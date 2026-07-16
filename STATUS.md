# STATUS.md — Everdeck, built while you were away

_Last updated: 2026-07-15 late evening. Everything below was verified live before writing._

## Open it

- **Live app (production):** https://everdeck-psi.vercel.app
- **Sign in:** `demo@everdeck.app` / `19aceabb7884c0abce` — seeded, confirmed, on the **founder** plan (sandbox), with two completed pipeline runs so the map and deck are already populated.
- **Stripe test card** (once Stripe keys are wired; sandbox billing needs no card): `4242 4242 4242 4242`, any future expiry, any CVC.

## What works right now (exact steps)

1. **Marketing site** — the existing hero/landing, now the `/` route of the product app.
2. **Auth & multi-tenancy** — Sign up (email/password or magic link) at `/login`; a trigger provisions your profile + workspace + free subscription. Every table is RLS-scoped to account membership; verified from outside (see Tests).
3. **Five-stage idea engine** — `/app/runs` → "Start run" (directed, e.g. "senior health", or autonomous on paid plans). Stages run as durable jobs: market tree → discussion fetch (synthetic, labeled) → pain-point extraction with verbatim quotes → five-framework gap generation with 0–100 scores → ranked top-3. The form drains the queue live; a cron tick also drains every 2 minutes.
4. **Color-coded mind map** — `/app/map`: the market hierarchy with opportunity tiers (mint ▲ high / lilac ◆ med / gray ○ low — glyphs are the non-color cue), always-visible legend, leaf drill-in.
5. **Idea drill-in** — click any idea: explanation, features, value prop, business model, differentiator, the niche's pain points with customer quotes, top-3 assessment, star/save, and **Generate landing-page prompt** (plan-gated) → copy-pasteable Before-After-Bridge build prompt.
6. **Today's deck** — `/app` shows the freshest scored ideas (the daily autonomous run refills it at 06:00 UTC for engine-enabled plans).
7. **Billing & gating** — `/app/billing`: Free/Pro($49)/Founder($199) placeholder prices. Sandbox mode (Stripe keys absent) simulates checkout/downgrade end-to-end writing real subscription rows. Gating is enforced **server-side in SQL RPCs** (`plan_gate:engine`, `plan_gate:daily_runs`, `plan_gate:landing_prompts`) — verified by test: free plan blocked, pro unlocked.
8. **Usage metering** — `/app/usage`: requests/tokens per provider (mock = $0).

## What's stubbed / synthetic (and why)

| Thing | State | Why / how to flip |
|---|---|---|
| LLM | **Mock provider** (deterministic, labeled `synthetic`) | No Gemini key was available; zero real calls made. Flip: set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` in Supabase Edge Function secrets. Seam, rate limiting (~14 rpm), 429 backoff, and per-stage model config are already live. |
| Reddit data | **Synthetic discussions** (labeled in UI via grounding badges) | No Reddit/CSE credentials. The A2 query builder + provider seam exist; `DISCUSSION_PROVIDER=reddit` once creds + fetcher land. |
| Stripe | **Sandbox billing** (labeled banner in UI) | Stripe connector was down and no keys exist locally. Checkout/Portal/webhook code is deployed and signature-verified — see go-live below. |
| Email confirmations | Work, but redirect to localhost until you set Supabase Auth **Site URL** to the live URL (Dashboard → Auth → URL Configuration; no API for this). Password sign-in unaffected. |

## Architecture (one paragraph)

Next.js 14 (App Router) on Vercel holds the UI and uses **only the public anon key** — RLS is the entire tenant boundary (the Vercel connector can't set secrets, so the design never needs any there). All privileged work runs in **Supabase Edge Functions** (`worker`, `billing`, `stripe-webhook`) which get the service-role key from the platform. The pipeline is a durable Postgres job queue (atomic skip-locked claims, exponential backoff, dead-letter) drained in bounded batches by `worker`, which pg_cron pings every 2 minutes (and daily at 06:00 UTC for autonomous runs) using a vault-stored token — no secrets in the repo, none on Vercel, none typed by a human.

## Run / deploy from a clean clone

```bash
npm install
npm run typecheck && npm test && npm run build   # all green
npm run dev                                       # local dev against prod Supabase
```
Deploys have been done via the Vercel MCP connector (file-tree deploy, project `everdeck`, team `app-work`). `vercel deploy` from a linked CLI works identically. Migrations live in `supabase/migrations/` (0001–0005 applied to prod; the connector's migration history is authoritative). Edge functions live in `supabase/functions/`.

## Cost

- **Real LLM calls made: 0.** Everything ran on the mock provider ($0). Metering shows ~9–35 mock "requests" per pipeline run for sizing.
- Projected on Gemini free tier: an autonomous daily run ≈ 1 (stage 1) + 2×leaves (stages 3,4) calls ≈ **~25 requests/day** at founder sizing — comfortably inside free-tier daily budgets with 10× headroom. Paid Gemini Flash pricing at these volumes is cents/day.
- Vercel + Supabase: free/hobby tiers, $0.

## Decisions & open questions

See `DECISIONS.md` (11 recorded calls) and `QUESTIONS.md`. The three I most want your ruling on:
1. **Plan prices** — placeholders $49/$199; set the real "high price".
2. **Reddit path** — official API (my recommendation) vs Google CSE; either needs credentials.
3. **Git remote** — history is local-only on `feat/product-build`; want it pushed to GitHub?

## Go-live checklist (deliberately NOT executed)

1. **Stripe → live test first**: create test products/prices (`Pro`, `Founder`) in the Stripe dashboard; set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_FOUNDER`, `APP_URL` as Edge Function secrets; add a webhook endpoint `https://fxrnuoahfzzdsepwvzux.supabase.co/functions/v1/stripe-webhook` (events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) and set `STRIPE_WEBHOOK_SECRET`. Sandbox mode switches off automatically the moment `STRIPE_SECRET_KEY` exists. Test with `4242…` card end-to-end, then repeat with LIVE keys + live products when you're ready to charge.
2. **Gemini → real**: set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` (Edge Function secrets). ⚠️ Free-tier Gemini content may be used by Google to improve products — move to a paid key (no-training) before selling publicly.
3. **Auth polish**: set Site URL + redirect allowlist to the live domain; consider turning on captcha.
4. **Custom domain** on Vercel; update `APP_URL`.
5. Rotate the demo account password (or delete the demo user) before real customers arrive.
