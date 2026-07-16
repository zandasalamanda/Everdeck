# Everdeck — what I need from you to make it real

_The app is pivoted, built, and deployed. It runs end-to-end **right now on free mock
data** so you can click through the whole flow. To make it pull **real businesses and
write real mockups**, you add the two keys below and flip two switches. Everything
else (screenshots, emails) needs no key._

---

## First: do we need a rebuild? No.

Honest answer, no bias: **a rebuild was not necessary, and I didn't do one.** The
engine I already built — auth, multi-tenancy, the durable job queue, the provider-
agnostic AI seam, scoring/tiering, the deck UI, the deploy pipeline — mapped almost
1:1 onto the new concept. I **repointed** it: a market became a *hunt*, an idea became
a *prospect*, and the three pipeline stages became **discover → audit → generate
mockup + outreach**. ~70% of the code was reused. Rebuilding would have thrown away
the expensive, already-reviewed parts (RLS, queue, Clerk, billing) to re-solve
problems that were already solved. The only thing I fully replaced was the meaning of
the data and the app screens.

---

## The two keys you actually need (everything real hinges on these)

### 1. Google Maps Platform key — finds real businesses + scores their sites  ⭐ critical

One key covers **both** business discovery (Places API) and site auditing (PageSpeed
Insights).

**Get it:**
1. Go to <https://console.cloud.google.com/> → create a project ("everdeck").
2. APIs & Services → **Enable APIs** → enable **Places API (New)** and **PageSpeed
   Insights API**.
3. APIs & Services → Credentials → **Create credentials → API key**. Copy it.
4. (Recommended) Restrict the key to those two APIs.
5. You must enable billing on the project, but you stay inside the free thresholds
   below for normal solo use.

**What it costs (2026):** Google dropped the old $200 pooled credit in 2025. Now each
API has its own free monthly allotment:
- **Places Text Search (Pro SKU): 5,000 free calls/month**, then ~$32 per 1,000. One
  hunt = one Text Search call that returns up to 20 businesses, so 5,000 free calls =
  ~100,000 businesses/month free. I deliberately **omit the `rating` field** because
  adding it bumps every call to the pricier Enterprise SKU (~$35/1k) for no real
  benefit here.
- **PageSpeed Insights: free** (25k/day).

**Verdict:** more than enough free room for you and early customers. You will not pay
Google anything at solo/early scale.

### 2. Gemini API key — writes the real personalized mockups + openers  ⭐ critical

**Get it:** <https://aistudio.google.com/apikey> → "Create API key" (free, ~2 clicks).

**What it costs (2026):** the free tier is generous — the current **Gemini Flash**
model runs ~10 requests/min and **1,500 requests/day free**. One prospect = one
generate call, so ~1,500 free mockups/day.

> ⚠️ Two honest notes: (a) I hardcoded `gemini-2.0-flash` originally, but Google
> **shut that model down on June 1, 2026** — so the code now uses the rolling alias
> `gemini-flash-latest` (override with a `GEMINI_MODEL` secret to pin a version).
> (b) On the **free** tier, Google may use your content to improve its products. Move
> to a **paid** Gemini key (no-training) before you resell this to real customers.
> Paid Flash is roughly $1.50 / $9 per million input/output tokens — cents per day at
> your volume.

**Is a more expensive LLM worth it?** For these mockups, **no, not yet.** Flash writes
clean one-page sites and openers fine. If mockup quality ever feels thin, the upgrade
that actually helps is **Gemini Pro** (better layout/taste) or **Claude Sonnet** — but
only bother once a real prospect tells you the mockup wasn't good enough. Don't pre-pay
for quality you can't yet prove you need.

---

## The things that need NO key (already working)

| Need | What I used | Why | Cost |
|---|---|---|---|
| **Screenshots** of their current site | **thum.io** (keyless — just prefix the URL) | 1,000/mo free, no signup, no key. Perfect for a "before" thumbnail. | $0 |
| **Public contact email** | Fetch their site + regex for `mailto:`/emails | Zero cost, zero legal exposure (it's their own published email) | $0 |
| **Sending** the email | **Your own inbox** via a `mailto:` "Open in email" button | Keeps your domain safe; you review every word | $0 |

**Premium screenshot alternative (skip for now):** ScreenshotOne has more controls but
costs ~$8.5/1k and posted a **63% failure rate** in 2026 third-party testing — not
worth it over thum.io for a thumbnail. If thum.io ever bottlenecks, **Urlbox** or
**Microlink** are the reliable paid options; only switch if you hit real volume.

**Premium email-finder (optional, later):** **Hunter.io** free tier is 25 lookups/mo;
paid starts ~$34/mo (annual) for 500. Only add it if the keyless "email off their own
site" isn't finding enough contacts. It's wired as a seam, not on by default —
deliberately, because bulk email discovery is where the legal risk starts.

---

## How you flip it to real (2 minutes, once you have the keys)

All providers run in the **Supabase Edge Function** worker, so keys are set as
**Supabase Edge Function secrets** (Dashboard → Project → Edge Functions → Secrets, or
`supabase secrets set`). Set these:

```bash
# Business discovery + audit (Google key)
GOOGLE_MAPS_API_KEY=AIza...          # the key from step 1
PLACES_PROVIDER=google               # flip discovery from mock → real
AUDIT_PROVIDER=live                  # flip audits from mock → real (fetch + PageSpeed)

# Mockup + outreach generation (Gemini key)
GEMINI_API_KEY=AIza...               # the key from step 2
LLM_PROVIDER=gemini                  # flip generation from mock → real
# GEMINI_MODEL=gemini-flash-latest   # optional; this is the default

# Optional, later:
# HUNTER_API_KEY=...                 # only if you want richer email finding
```

That's it. No redeploy needed — the worker reads them on the next hunt. Screenshots and
sending already work with no key. (The `CLERK_ISSUER` for the edge functions is already
pinned to your instance.)

---

## Cold email — the honest risk section

This is the part that can hurt you, so read it:

- **Everdeck never sends for you.** By design, it drafts; you review each email in the
  **Outreach Dock**, fix anything, and hit send from your own mailbox. That single
  choice avoids ~90% of the ways these tools blow up (burned domains, spam complaints).
- **Legally:** in the US, cold B2B email is allowed under CAN-SPAM *if* you use a real
  from-name, a truthful subject, a physical address, and a working opt-out. Contacting
  *businesses* (not consumers) about a relevant service is the safe lane. GDPR (if you
  ever email EU businesses) is stricter — have a lawful basis and honor opt-outs.
- **Do not** buy a bulk email-blaster and fire hundreds/day from your main domain. If
  you ever scale sending, do it through **Instantly** or **Smartlead** (they handle
  inbox rotation + warmup) on a *separate* domain — not through Everdeck.
- The valuable, defensible thing you're selling is the **personalized mockup**, not
  volume. Ten great personalized emails beat a thousand generic ones.

---

## What can you realistically charge?

Two answers, because there are two businesses here:

**A) Using it yourself (the real money, near-term).** This isn't a subscription you
pay — it's a tool that lands you **$1,500–$5,000 web projects**. Land *one* client a
month and it's paid for itself ~100×. That's the honest ROI, and it's why "for me
first" is the right call. Your cost to run it at solo volume: **~$0** (inside free
tiers), maybe a few dollars of Gemini if you go paid.

**B) Reselling it as a product** to other freelancers/agencies. Realistic pricing,
grounded in what comparable lead-gen tools charge:
- **$0 free** — 1 hunt/day, ~5 prospects. Gets people hooked.
- **$29–$49/mo "Freelancer"** — this is the sweet spot. A freelancer who lands one
  extra project pays for a year in a day, so ~$39/mo is an easy yes. This is where most
  of your revenue will sit.
- **$99–$149/mo "Agency"** — higher volume + autonomous daily hunts. Only a fraction of
  users, but they anchor value.
- **Skip $199+** unless you add real team features (seats, CRM sync). The earlier
  build's $199 tier was aspirational; for a lead tool it's above the pain threshold.

Honest expectation: reselling to freelancers is a **real but grindy** business (they're
price-sensitive and churn), so the near-certain money is **(A) — use it to sell your
own web work** and treat reselling as upside once you've proven it lands *you* clients.
Your own results become the only marketing that matters.

---

## Sources (2026 pricing)

- Google Places pricing — <https://developers.google.com/maps/documentation/places/web-service/usage-and-billing>, <https://mapsplatform.google.com/pricing/>
- Gemini API pricing + free tier — <https://ai.google.dev/gemini-api/docs/pricing>, <https://ai.google.dev/gemini-api/docs/rate-limits>
- Screenshots (thum.io vs ScreenshotOne) — <https://screenshotapi.to/blog/best-free-screenshot-apis>, <https://screenshotone.com/the-best-screenshot-api/>
- Hunter.io pricing — <https://hunter.io/pricing>
