# PROGRESS.md — live journal

## M0 — Orient & plan ✅
- No spec files in repo; master prompt is sole authority. No CLIs/local keys; Stripe MCP disconnected. Vercel + Supabase connectors live.

## M1 — Infra up ✅
- Supabase project `everdeck` (fxrnuoahfzzdsepwvzux), $0/mo. Git repo + `feat/product-build`.
- Marketing site ported to Next.js 14 App Router; **LIVE in production: https://everdeck-psi.vercel.app** (build green, 4/4 pages).

## M2 — Schema + RLS + Auth 🔄
- ✅ 5 migrations applied to prod: core schema (17 tables), RLS on every table, seeded prompt_configs (A1–A5), gated RPCs, queue RPCs + vault worker token, pg_cron schedules.
- ✅ Security advisor run; RPC anon-execute tightened.
- ✅ Seeded demo login: demo@everdeck.app (password in STATUS.md), founder plan, sandbox source.
- ✅ Login/signup/magic-link UI + middleware-protected /app/* built.
- ⏳ Live signup/login verification happens after the full-product deploy (M9). NOTE for zander: set Supabase Auth "Site URL" to the live URL in the dashboard (1 click, no connector for it) so email links redirect correctly.

## M3 — LLM seam + job queue ✅
- Provider-agnostic llm.ts (mock default, Gemini behind env with 429 backoff + rate gap), deterministic mock provider, durable jobs table with atomic claim/complete/fail RPCs (skip-locked, exponential backoff, dead-letter).
- Worker Edge Function deployed (dual auth: vault token for cron, user JWT for in-app). Verified live: 401s without auth.

## M4 — Pipeline stages 1–5 ✅ (mock mode, live infra)
- Directed run "senior health": run done; 7 nodes, 15 pain points, 45 verbatim quotes, 20 scored ideas (all 3 tiers), 12 top-3 assessments, 9 metered usage events. Dedupe keys + per-node caching in place.

## M5 — Mind map + drill-in 🔄
- Deck page, map + idea-detail screens (agent-built), runs/usage screens done; integration build pending.

## M6 — Daily automation ✅
- pg_cron: tick every 2 min + daily 06:00 UTC → worker via pg_net with vault token.
- Verified live: `task=daily` enqueued 1 autonomous run; 25 jobs drained to done; today's-deck view populated.

## M7 — Billing + gating ✅ (sandbox live; Stripe test-mode code deployed, needs keys)
- `billing` + `stripe-webhook` Edge Functions deployed (signature verification, price→plan mapping, period sync, past_due handling).
- Verified live end-to-end: downgrade→free blocks with `plan_gate:daily_runs` AND `plan_gate:engine`; checkout→pro unlocks a real run; founder restored. Gating is server-side (SQL RPCs), not UI.

## M8 — Tests + security review — next
## M9 — Handoff — pending
