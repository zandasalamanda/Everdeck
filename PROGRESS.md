# PROGRESS.md — live journal (final)

**Status: build complete per Definition of Done. Live app + real infra + full pipeline + test-mode billing (sandbox) + daily automation + security-reviewed.**

## M0 — Orient & plan ✅
No spec files in repo; master prompt sole authority. No CLIs/local keys; Stripe MCP disconnected. Vercel + Supabase connectors used throughout.

## M1 — Infra up ✅
Supabase project `everdeck` (fxrnuoahfzzdsepwvzux, $0/mo). Git repo + `feat/product-build`. Marketing site ported to Next.js 14 App Router, deployed to Vercel production (team app-work).

## M2 — Schema + RLS + Auth ✅
6 migrations applied to prod: core schema (17 tables) · RLS on every table · seeded prompt_configs (A1–A5) · gated RPCs · queue RPCs + vault worker token · pg_cron · post-review hardening. Security advisor run + RPC grants tightened. Email/password + magic-link auth, middleware-protected `/app/*`, signup trigger provisions profile+account+subscription. Seeded demo account (founder, populated). Live RLS boundary proven by test from outside.

## M3 — LLM seam + job queue ✅
Provider-agnostic `llm.ts` (mock default; Gemini behind env, key in header, 429 backoff, truncation-fail). Durable jobs table: atomic skip-locked claim, stale-lock reclaim, exponential backoff, permanent dead-letter. Worker Edge Function, dual auth (cron token vs user JWT, principal-scoped).

## M4 — Pipeline stages 1–5 ✅ (mock, live infra)
All five stages persisted structured output; caching + dedupe + idempotency. Verified E2E on multiple markets.

## M5 — Mind map + drill-in ✅
Today's-deck, color-coded mind map (tier colors + glyph cues + legend), idea detail (pain points/quotes, solutions, top-3, on-demand landing prompt), runs, usage, billing. Build green (8 routes).

## M6 — Daily automation ✅
pg_cron: 2-min tick + 06:00 UTC daily → worker via pg_net + vault token. Cron confirmed firing on its own (job_run_details succeeded). Manual `task=daily` produced a fresh autonomous batch.

## M7 — Billing + gating ✅
`billing` + `stripe-webhook` Edge Functions (signature-verified, in-place plan change, replay guard, version-agnostic fields). Sandbox mode live until Stripe keys added. Gating server-side in SQL — verified: free blocked, pro unlocked, founder full.

## M8 — Tests + security review ✅
11 tests (mock-provider determinism + live RLS/auth boundary), all green. 28-agent adversarial review across 4 lenses, double-verified; 12 confirmed issues all fixed + redeployed + re-verified live (worker daily=403, key in header, no double-billing, replay guard, guarded parses, quota fix, stale-lock reclaim, open-redirect). 2 findings refuted.

## M9 — Handoff 🔄
STATUS.md (live URL, demo login, test card, works/stubbed, costs, go-live checklist incl. sandbox reset), DECISIONS.md, QUESTIONS.md, .env.example, migration mirrors — all written. Final production deploy of the full app in flight; branch `feat/product-build`, local-only (no remote — QUESTIONS #1).

## Handoff pointers for zander
- **1-click, no API:** set Supabase Auth **Site URL** to the live URL (Dashboard → Auth → URL Configuration) so email links resolve.
- Everything else to go real (Gemini, Stripe, Reddit) is in STATUS.md → go-live checklist.
