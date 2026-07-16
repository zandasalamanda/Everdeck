// The prospect pipeline. Three idempotent, bounded stages, each enqueuing
// the next. All writes go through the service-role client; account_id always
// comes from the job row, never from user input.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { env } from "./config.ts";
import { complete } from "./llm.ts";
import { auditSite, discoverBusinesses, opportunityScore } from "./providers.ts";

interface Job {
  id: number;
  account_id: string;
  run_id: string;
  stage: number;
  payload: Record<string, unknown>;
  attempts: number;
}

type Db = SupabaseClient;

class PermanentStageError extends Error {}
export { PermanentStageError };

function parseJson<T>(text: string, where: string): T {
  let t = text.trim();
  // Models sometimes wrap JSON in ``` fences despite JSON mode.
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t) as T;
  } catch {
    // Last resort: parse the outermost {...} object in the text.
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(t.slice(s, e + 1)) as T;
      } catch { /* fall through to the hard failure below */ }
    }
    throw new PermanentStageError(`${where}: unparseable model JSON (${text.length} chars)`);
  }
}

function assertOk(error: { message: string } | null, where: string): void {
  if (error) throw new Error(`${where}: ${error.message}`);
}

async function meter(db: Db, job: Job, provider: string, res?: { inputTokens: number; outputTokens: number }) {
  await db.from("usage_events").insert({
    account_id: job.account_id,
    run_id: job.run_id,
    stage: job.stage,
    provider,
    request_count: 1,
    input_tokens: res?.inputTokens ?? 0,
    output_tokens: res?.outputTokens ?? 0,
  });
}

async function prospectsPerHunt(db: Db, accountId: string): Promise<number> {
  const { data } = await db
    .from("subscriptions")
    .select("plan, plans(ideas_per_run)")
    .eq("account_id", accountId)
    .single();
  return (data as { plans?: { ideas_per_run?: number } } | null)?.plans?.ideas_per_run ?? 5;
}

function tierOf(score: number): "high" | "med" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "med" : "low";
}

const GENERATE_SYSTEM =
  "You are a senior web designer and cold-outreach copywriter. Given a local business, produce a personalized one-page website mockup as a single self-contained HTML document (inline CSS, no external assets, modern/clean/trustworthy, mobile-first, with a clear booking/quote CTA), a short summary of what you improved, and a warm, non-pushy 2-3 sentence outreach opener offering to send the free preview. Output strict JSON: {\"html\":string,\"summary\":string,\"opener\":string}.";

/** Stage 1 — discover businesses for a hunt; enqueue an audit per prospect. */
export async function runDiscover(db: Db, job: Job): Promise<void> {
  const huntId = job.payload.hunt_id as string;
  const type = job.payload.business_type as string;
  const location = job.payload.location as string;

  const { count: existing } = await db
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("hunt_id", huntId);

  const grounding = (env("PLACES_PROVIDER") ?? "mock") === "google" ? "live" : "synthetic";
  let prospectIds: string[] = [];

  if ((existing ?? 0) === 0) {
    const budget = await prospectsPerHunt(db, job.account_id);
    const businesses = await discoverBusinesses(type, location, budget);
    await meter(db, job, `places:${grounding}`);

    for (const b of businesses) {
      const dedupe = `${huntId}::${b.place_id}`;
      const { data: row, error } = await db
        .from("prospects")
        .upsert(
          {
            account_id: job.account_id,
            hunt_id: huntId,
            run_id: job.run_id,
            place_id: b.place_id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            website_url: b.website_url,
            has_website: !!b.website_url,
            grounding,
            dedupe_key: dedupe,
            status: "new",
          },
          { onConflict: "account_id,dedupe_key", ignoreDuplicates: false },
        )
        .select("id")
        .single();
      assertOk(error, "prospect upsert");
      if (row) prospectIds.push(row.id);
    }
  } else {
    const { data } = await db.from("prospects").select("id").eq("hunt_id", huntId);
    prospectIds = (data ?? []).map((r) => r.id);
  }

  for (const pid of prospectIds) {
    const { error } = await db.rpc("enqueue_job", {
      p_account_id: job.account_id,
      p_run_id: job.run_id,
      p_stage: 2,
      p_payload: { prospect_id: pid },
    });
    assertOk(error, "discover enqueue audit");
  }

  await db.from("hunts").update({ status: "running" }).eq("id", huntId);
}

/** Stage 2 — audit a prospect's current site; score the opportunity. */
export async function runAudit(db: Db, job: Job): Promise<void> {
  const pid = job.payload.prospect_id as string;
  const { data: p } = await db
    .from("prospects")
    .select("id, website_url, has_website, contact_email")
    .eq("id", pid)
    .single();
  if (!p) throw new PermanentStageError(`audit: prospect ${pid} not found`);

  const audit = await auditSite(p.website_url);
  await meter(db, job, "audit");
  const score = opportunityScore(audit);

  const { error } = await db
    .from("prospects")
    .update({
      has_website: audit.has_website,
      current_site_score: audit.score,
      current_site_screenshot_url: audit.screenshot_url,
      contact_email: p.contact_email ?? audit.contact_email,
      opportunity_score: score,
      tier: tierOf(score),
      reason: audit.issues.slice(0, 4).join(" · "),
      status: "audited",
    })
    .eq("id", pid);
  assertOk(error, "audit update");

  const { error: enqErr } = await db.rpc("enqueue_job", {
    p_account_id: job.account_id,
    p_run_id: job.run_id,
    p_stage: 3,
    p_payload: { prospect_id: pid },
  });
  assertOk(enqErr, "audit enqueue generate");
}

/** Stage 3 — generate the personalized mockup + outreach draft. */
export async function runGenerate(db: Db, job: Job): Promise<void> {
  const pid = job.payload.prospect_id as string;
  const { data: p } = await db
    .from("prospects")
    .select("id, hunt_id, name, has_website, contact_email, website_url, hunts(business_type, location)")
    .eq("id", pid)
    .single();
  if (!p) throw new PermanentStageError(`generate: prospect ${pid} not found`);

  const hunt = p.hunts as unknown as { business_type: string; location: string };
  const res = await complete({
    system: GENERATE_SYSTEM,
    user: `STAGE: generate\nBUSINESS: ${p.name}\nTYPE: ${hunt?.business_type ?? "local business"}\nLOCATION: ${hunt?.location ?? ""}\nHAS_SITE: ${p.has_website}\nCURRENT_URL: ${p.website_url ?? "none"}`,
    model: "gemini-flash-latest",
    // Current Flash models think by default, and thinking tokens are drawn
    // from this same budget. A full HTML page + summary + opener needs real
    // headroom or generation stops at MAX_TOKENS before any JSON is emitted.
    maxOutputTokens: 32768,
    // Force strictly-valid JSON — long inline HTML otherwise breaks parsing.
    responseSchema: {
      type: "object",
      properties: {
        html: { type: "string" },
        summary: { type: "string" },
        opener: { type: "string" },
      },
      required: ["html", "summary", "opener"],
    },
    seed: p.name,
  });
  await meter(db, job, res.provider, res);

  const gen = parseJson<{ html: string; summary: string; opener: string }>(res.text, "generate");
  if (!gen.html || gen.html.length < 200) throw new PermanentStageError("generate: empty mockup");

  const { error: mErr } = await db.from("mockups").insert({
    account_id: job.account_id,
    prospect_id: pid,
    html: gen.html,
    summary: gen.summary ?? null,
  });
  assertOk(mErr, "mockup insert");

  // Seed the outreach dock draft (user reviews/edits/sends).
  const subject = `A free website concept for ${p.name}`;
  const { error: oErr } = await db.from("outreach").upsert(
    {
      account_id: job.account_id,
      prospect_id: pid,
      to_email: p.contact_email ?? null,
      subject,
      body: gen.opener ?? "",
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "prospect_id", ignoreDuplicates: true },
  );
  assertOk(oErr, "outreach upsert");

  await db.from("prospects").update({ status: "ready" }).eq("id", pid);
}

export async function runStage(db: Db, job: Job): Promise<void> {
  switch (job.stage) {
    case 1:
      return runDiscover(db, job);
    case 2:
      return runAudit(db, job);
    case 3:
      return runGenerate(db, job);
    default:
      throw new PermanentStageError(`unknown stage ${job.stage}`);
  }
}
