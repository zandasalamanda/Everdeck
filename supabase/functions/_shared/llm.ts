// Provider-agnostic LLM seam for the pipeline.
//
// Providers: "mock" (default — deterministic, zero cost, always available)
// and "gemini" (enabled by setting LLM_PROVIDER=gemini + GEMINI_API_KEY as
// Edge Function secrets). Swapping providers is a config change, not a code
// change. Every call is metered into usage_events by the caller.

import { mockComplete } from "./mock.ts";

export interface LlmRequest {
  system: string;
  user: string;
  model: string;
  maxOutputTokens: number;
  /** Deterministic seed for the mock provider (e.g. market label). */
  seed: string;
}

export interface LlmResponse {
  text: string;
  provider: "mock" | "gemini";
  model: string;
  inputTokens: number;
  outputTokens: number;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Belt-and-suspenders: redact anything key-shaped from error text. */
function scrub(s: string): string {
  return s.replace(/key=[\w-]+/gi, "key=REDACTED").replace(/AIza[\w-]{20,}/g, "REDACTED");
}

/** Naive rate limiter: serialize Gemini calls with a minimum gap. */
let lastGeminiCall = 0;
const MIN_GAP_MS = 4_100; // ~14 rpm, safely under the 15 rpm free tier

async function geminiComplete(req: LlmRequest, apiKey: string): Promise<LlmResponse> {
  const wait = lastGeminiCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeminiCall = Date.now();

  // Model is env-configurable; the default is a rolling alias so the app
  // doesn't break when Google retires a dated model (e.g. gemini-2.0-flash
  // shut down 2026-06-01). Set GEMINI_MODEL to pin a specific version.
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest";

  const body = {
    system_instruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
    generationConfig: {
      maxOutputTokens: req.maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    let res: Response;
    try {
      // Key goes in the header, never the URL, so it can't leak into an
      // error message that reaches the (client-readable) jobs.last_error.
      res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // Network-layer failure (DNS/TLS/timeout): back off and retry.
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 2_000));
        continue;
      }
      throw new Error(`gemini: network error after retries: ${scrub(String(err))}`);
    }

    if (res.status === 429 || res.status >= 500) {
      const backoff = 2 ** attempt * 2_000;
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }
    if (!res.ok) {
      throw new Error(`gemini ${res.status}: ${scrub((await res.text()).slice(0, 300))}`);
    }

    const json = await res.json();
    const candidate = json.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text ?? "";
    // Truncated output produces invalid JSON downstream — fail loudly now.
    if (candidate?.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`gemini: incomplete response (finishReason=${candidate.finishReason})`);
    }
    const usage = json.usageMetadata ?? {};
    return {
      text,
      provider: "gemini",
      model,
      inputTokens: usage.promptTokenCount ?? 0,
      outputTokens: usage.candidatesTokenCount ?? 0,
    };
  }
  throw new Error("gemini: exhausted retries (429/5xx)");
}

export async function complete(req: LlmRequest): Promise<LlmResponse> {
  const provider = Deno.env.get("LLM_PROVIDER") ?? "mock";
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (provider === "gemini" && apiKey) {
    return geminiComplete(req, apiKey);
  }

  // Mock: deterministic synthetic output, clearly labeled by callers.
  const text = mockComplete(req);
  return {
    text,
    provider: "mock",
    model: "mock",
    inputTokens: Math.ceil((req.system.length + req.user.length) / 4),
    outputTokens: Math.ceil(text.length / 4),
  };
}
