# QUESTIONS.md — parked for your ruling (assumptions shipped)

1. **Git remote.** No remote configured; history is local in `everdeck/.git` on branch `feat/product-build`. Want me to push this to a GitHub repo next session? (Shipped: local commits only.)
2. **Real plan pricing.** Test placeholders: Pro $49/mo, Founder $199/mo. Set your real "high price" and I'll update the Stripe setup script + pricing UI copy. (Shipped: placeholders, clearly labeled.)
3. **Gemini key.** No key was available, so zero real LLM calls were made; everything runs on the deterministic mock provider. Add `GEMINI_API_KEY` as a Supabase Edge Function secret and set `LLM_PROVIDER=gemini` to go live (see STATUS.md §flip-to-real). Confirm you're OK with free-tier training caveat until you move to paid.
4. **Reddit data path.** Preferred: official Reddit API (needs app credentials) vs Google Programmable Search (needs CSE key). Shipped: labeled synthetic fallback with the exact A2 query builder ready for either.
5. **Auth method.** Shipped email/password + magic link via Supabase Auth. Want OAuth (Google/GitHub) added?
6. **Stripe keys.** Connector was unavailable; when you're back, paste test keys into Supabase secrets + Vercel is not needed (webhook is an Edge Function). One script creates products/prices. Sandbox billing is ON until then (labeled in the UI).

## Clerk + Stripe follow-ups (2026-07-16)
7. **Clerk keys needed (BLOCKING deploy).** Everdeck's dedicated instance is `alert-oarfish-38.clerk.accounts.dev`. Paste its **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`) — from the Clerk dashboard for that instance → API keys. The root app's `relevant-bat-62` keys will NOT work (Supabase only trusts alert-oarfish-38). Once pasted I set Vercel env + deploy.
8. **Stripe is live-mode on the connector.** I did NOT create products (guardrail: test mode only). To finish real billing in TEST mode: create Pro/Founder products+prices with TEST keys, then set `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_FOUNDER` as Supabase Edge Function secrets. Sandbox billing works meanwhile.
