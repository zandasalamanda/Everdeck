// Everdeck pipeline worker.
//
// Entry points:
//   POST /worker?task=tick   — drain a bounded batch of queued jobs
//   POST /worker?task=daily  — enqueue autonomous runs, then tick once
//
// Auth (verify_jwt is disabled; this function does its own):
//   1. `x-worker-token` header matching the vault-stored token (pg_cron)
//      → "cron" principal, may run task=daily (system-wide enqueue), or
//   2. a valid Clerk session JWT in Authorization (the in-app "Run now")
//      → "user" principal, may only drain the queue (task=tick).
//
// The service-role key is injected by the platform and never leaves this
// process. account_id always comes from the job row — never from input.

import { createClient } from "npm:@supabase/supabase-js@2";

import { PermanentStageError, runStage } from "../_shared/stages.ts";
import { bearer, verifyClerkJwt } from "../_shared/clerk.ts";
import { setOverride } from "../_shared/config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TICK_BATCH = Number(Deno.env.get("TICK_BATCH") ?? 6);
const WORKER_ID = `edge-${crypto.randomUUID().slice(0, 8)}`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

let cachedToken: string | null = null;

async function workerToken(force = false): Promise<string> {
  if (!cachedToken || force) {
    const { data, error } = await admin.rpc("get_worker_token");
    if (error) throw new Error(`get_worker_token: ${error.message}`);
    cachedToken = data as string;
  }
  return cachedToken;
}

let providerConfigLoaded = false;

/**
 * Provider API keys live in Supabase Vault — no Edge Function secret store is
 * reachable from here (no CLI / Management API / MCP secrets tool). Load them
 * once per isolate and hand them to the provider seams via config overrides
 * (Deno.env.set is a no-op in the edge runtime). Presence of a key auto-enables
 * its live provider; a Vault hiccup degrades to mock rather than crashing
 * (retried on the next invocation).
 */
async function ensureProviderConfig(): Promise<void> {
  if (providerConfigLoaded) return;
  try {
    const { data, error } = await admin.rpc("get_provider_config");
    if (error) throw new Error(error.message);
    const cfg = (data ?? {}) as {
      gemini_api_key?: string | null;
      google_maps_api_key?: string | null;
    };
    if (cfg.gemini_api_key) {
      setOverride("GEMINI_API_KEY", cfg.gemini_api_key);
      setOverride("LLM_PROVIDER", "gemini");
    }
    if (cfg.google_maps_api_key) {
      setOverride("GOOGLE_MAPS_API_KEY", cfg.google_maps_api_key);
      setOverride("PLACES_PROVIDER", "google");
      setOverride("AUDIT_PROVIDER", "live");
    }
    providerConfigLoaded = true;
  } catch {
    // Keep whatever env is already set (mock). Try again next invocation.
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Principal = "cron" | "user" | null;

/**
 * Returns which principal authenticated the request:
 *   "cron" — valid vault worker token (the pg_cron heartbeat), full trust
 *   "user" — a valid Supabase user JWT, limited to draining its own queue
 *   null   — unauthenticated
 * Only the "cron" principal may enqueue system-wide work (task=daily).
 */
async function authorize(req: Request): Promise<Principal> {
  const token = req.headers.get("x-worker-token");
  if (token) {
    if (timingSafeEqual(token, await workerToken())) return "cron";
    // Token may have been rotated in vault since this isolate warmed up.
    if (timingSafeEqual(token, await workerToken(true))) return "cron";
    return null;
  }

  const jwt = bearer(req);
  if (!jwt) return null;

  const claims = await verifyClerkJwt(jwt);
  return claims ? "user" : null;
}

async function tick(): Promise<{ claimed: number; done: number; failed: number }> {
  const { data: jobs, error } = await admin.rpc("claim_jobs", {
    n: TICK_BATCH,
    worker: WORKER_ID,
  });
  if (error) throw new Error(`claim_jobs: ${error.message}`);

  let done = 0;
  let failed = 0;

  for (const job of jobs ?? []) {
    try {
      await runStage(admin, job);
      await admin.rpc("complete_job", { p_job_id: job.id });
      done++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Deterministic failures (bad/truncated model JSON) won't fix themselves
      // on retry — send them straight to the dead-letter state.
      await admin.rpc("fail_job", {
        p_job_id: job.id,
        p_error: message.slice(0, 800),
        p_permanent: err instanceof PermanentStageError,
      });
      failed++;
    }
  }

  return { claimed: (jobs ?? []).length, done, failed };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const principal = await authorize(req);
  if (!principal) {
    return new Response("unauthorized", { status: 401 });
  }

  await ensureProviderConfig();

  const task = new URL(req.url).searchParams.get("task") ?? "tick";

  try {
    if (task === "daily") {
      // System-wide enqueue touches every engine account — cron only.
      if (principal !== "cron") {
        return new Response("forbidden", { status: 403 });
      }
      const { data: enqueued, error } = await admin.rpc("enqueue_daily_autonomous");
      if (error) throw new Error(`enqueue_daily_autonomous: ${error.message}`);
      const result = await tick();
      return Response.json({ task, enqueued, ...result });
    }

    const result = await tick();
    return Response.json({ task, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
});
