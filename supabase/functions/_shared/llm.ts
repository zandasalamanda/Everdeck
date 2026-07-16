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

/** Naive rate limiter: serialize Gemini calls with a minimum gap. */
let lastGeminiCall = 0;
const MIN_GAP_MS = 4_100; // ~14 rpm, safely under the 15 rpm free tier

async function geminiComplete(req: LlmRequest, apiKey: string): Promise<LlmResponse> {
  const wait = lastGeminiCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeminiCall = Date.now();

  const body = {
    system_instruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
    generationConfig: {
      maxOutputTokens: req.maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${GEMINI_BASE}/${req.model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429 || res.status >= 500) {
      const backoff = 2 ** attempt * 2_000;
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }
    if (!res.ok) {
      throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const usage = json.usageMetadata ?? {};
    return {
      text,
      provider: "gemini",
      model: req.model,
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
