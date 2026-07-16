# STATUS.md — Everdeck

_Last updated: 2026-07-16 (overnight). **Everdeck is now a web-dev lead machine** —
it finds local businesses that need a website, builds each a personalized mockup, and
drafts outreach you review and send yourself. Auth is Clerk. To flip it from free mock
data to real businesses + real mockups, see **SETUP.md** (two keys, two switches)._

> **The pivot in one line:** market → **hunt**, idea → **prospect**, pipeline →
> **discover → audit → generate mockup + outreach**. It was a repoint of the existing
> engine, not a rebuild (~70% reuse). The sections below still describe the shared
> infrastructure (auth, queue, billing); the product on top of it is the new one.

## Open it

- **Live app (production):** https://everdeck-psi.vercel.app
- **Sign in:** click **Sign up** in the nav → **Continue with Google** (one click, no email) or email+password. On first sign-in your workspace auto-provisions (free plan). Verified end-to-end in production: sign-up → provision → a directed run produced 5 scored ideas.
- **Auth instance:** dedicated Clerk `alert-oarfish-38` (registered as the Supabase third-party provider). Keys are in Vercel env + gitignored `.env.local`, never committed.
- **Old Supabase `demo@everdeck.app` login no longer works** (Clerk replaced it). Its 100-idea demo deck still exists in the DB, orphaned — tell me your Clerk user id after you sign in and I'll reassign that deck to you.
- **Stripe test card** (once TEST keys are wired; sandbox billing needs no card): `4242 4242 4242 4242`.

## What works right now (verified end-to-end on production)

1. **Sign up with Google or email** → your workspace auto-provisions. Grass+sky auth screen (Clerk dark theme).
2. **Run a hunt** — `/app/hunts` → business type + city (e.g. "coffee shops" / "Portland, OR") → **Start hunt**. The pipeline discovers businesses, audits each site, scores the opportunity (no website = ~95), and generates a personalized mockup + outreach draft. Verified live: a hunt produced 5 scored prospects with mockups.
3. **Prospect deck** — `/app`: cards sorted by opportunity, tier chips (▲ hot lead / ◆ worth a look / ○ long shot with glyphs), "No website" flags, current-site thumbnails. Grass-glass nav rail.
4. **Prospect detail** — `/app/prospect/[id]`: the **before/after** — their current site next to your generated one-page mockup (rendered live in a sandboxed iframe) — plus the site issues, opportunity score, a status pipeline (New → Mockup ready → In dock → Sent → Replied → Won), and the outreach editor.
5. **Outreach dock** — `/app/dock`: every AI-drafted email, grouped by status. Review/edit the recipient, subject, and body; **Open in email** hands it to your own mail app; **Mark as sent**. Everdeck never sends automatically.
6. **Billing & gating** — `/app/billing`: Free/Pro($49)/Founder($199) placeholders. Gating enforced server-side in SQL (`plan_gate:daily_runs`, `plan_gate:engine`) — a hunt = a daily run; free = 1/day, 5 prospects.
7. **Usage metering** — `/app/usage`: provider calls (places / audit / mockup); mock = $0.
8. **Daily autonomous hunts + queue drain** — pg_cron ticks the worker every 2 min and can enqueue a daily autonomous hunt.

> **To make it real, see [SETUP.md](SETUP.md):** a Google Places key + a Gemini key + two env switches turn mock businesses/mockups into real ones. Screenshots (thum.io) and public-email extraction already work with no key.

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

## Security review

A 28-agent adversarial review (four lenses — RLS/tenancy, billing/webhook, worker/queue, app-auth — each finding double-verified) ran before handoff. It confirmed 12 real issues; **all are fixed and redeployed**:

- **Worker `task=daily` was callable by any signed-in user** (could trigger autonomous runs + LLM spend on other tenants). Now gated to the cron principal only (403 otherwise).
- **Gemini key was in the request URL** and could leak into the client-readable `jobs.last_error`. Moved to a header; errors are scrubbed; truncated responses fail cleanly.
- **Billing `checkout` could create a second concurrent subscription** (double-billing on upgrade). Now changes the existing subscription's price in place with proration; downgrade routes to the Stripe Portal.
- **Webhook replay/out-of-order** could resurrect a cancelled plan. Added an `updated_at`-based guard, clear the subscription id on cancel, and read period/subscription fields defensively across Stripe API versions.
- **Unguarded `JSON.parse` of model output** would crash-loop on truncation. All parses guarded; deterministic failures dead-letter immediately; dropped enqueues now surface instead of silently orphaning a run.
- **Landing-prompt generation consumed the daily run quota**. It now reuses the idea's originating run and is capped at 10/day.
- **`claim_jobs` had no stale-lock reclaim** (a job orphaned by a killed isolate stuck forever). Now reclaims `running` jobs older than 10 minutes.
- **Open redirect** via `?next=` on the login page and auth callback. Both now accept same-origin relative paths only.

Two flagged items were refuted by the verifiers (not bugs). Full detail is in the review transcript; the fixes are commit `7ae1895`.

## Go-live checklist (deliberately NOT executed)

0. **Reset sandbox-granted plans** so nobody keeps a paid plan for free after Stripe goes live:
   ```sql
   update public.subscriptions set plan='free', source='sandbox', current_period_end=null, updated_at=now()
   where source='sandbox' and plan <> 'free';
   ```
   (This will also reset the demo account — re-grant it afterward if you want it on founder.)

1. **Stripe → live test first**: create test products/prices (`Pro`, `Founder`) in the Stripe dashboard; set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_FOUNDER`, `APP_URL` as Edge Function secrets; add a webhook endpoint `https://fxrnuoahfzzdsepwvzux.supabase.co/functions/v1/stripe-webhook` (events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) and set `STRIPE_WEBHOOK_SECRET`. Sandbox mode switches off automatically the moment `STRIPE_SECRET_KEY` exists. Test with `4242…` card end-to-end, then repeat with LIVE keys + live products when you're ready to charge.
2. **Gemini → real**: set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` (Edge Function secrets). ⚠️ Free-tier Gemini content may be used by Google to improve products — move to a paid key (no-training) before selling publicly.
3. **Auth polish**: set Site URL + redirect allowlist to the live domain; consider turning on captcha.
4. **Custom domain** on Vercel; update `APP_URL`.
5. Rotate the demo account password (or delete the demo user) before real customers arrive.
