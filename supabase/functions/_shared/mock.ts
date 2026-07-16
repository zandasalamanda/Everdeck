// Deterministic mock data for the prospect pipeline — zero cost, works in
// preview. Same seed (business type + location) → same output.

import type { LlmRequest } from "./llm.ts";
import type { Business } from "./providers.ts";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FIRST = ["Summit", "Cedar", "Bluebird", "Ironwood", "Harbor", "Maple", "Vista", "Copper", "Willow", "Granite", "Riverside", "Oakhaven"];
const LAST_BY_TYPE: Record<string, string[]> = {
  default: ["Group", "Co.", "& Sons", "Studio", "Works", "Collective", "Partners", "Shop"],
};
const STREETS = ["Main St", "Oak Ave", "2nd St", "Commerce Dr", "Elm St", "Park Blvd", "Market St", "Cedar Ln"];

/** A realistic list of local businesses; ~40% have no website, the rest weak. */
export function mockBusinesses(type: string, location: string, limit: number): Business[] {
  const seed = hash(`${type}|${location}`);
  const singular = type.replace(/s$/, "");
  const out: Business[] = [];
  for (let i = 0; i < limit; i++) {
    const s = (seed + i * 2654435761) >>> 0;
    const name = `${FIRST[s % FIRST.length]} ${singular[0].toUpperCase() + singular.slice(1)} ${LAST_BY_TYPE.default[(s >> 4) % LAST_BY_TYPE.default.length]}`;
    const noSite = s % 5 < 2; // ~40% no website
    const domain = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    out.push({
      place_id: `mock_${s.toString(16)}`,
      name,
      address: `${100 + (s % 899)} ${STREETS[s % STREETS.length]}, ${location}`,
      phone: `(${200 + (s % 700)}) ${100 + (s % 900)}-${1000 + (s % 9000)}`,
      website_url: noSite ? null : `http://www.${domain}.com`,
      rating: 3.4 + ((s % 16) / 10),
    });
  }
  return out;
}

/** A clean, modern one-page mockup for the business — the outreach wedge. */
function mockupHtml(business: string, type: string, location: string): string {
  const singular = type.replace(/s$/, "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${business}</title>
<style>
:root{--ink:#0E0E10;--muted:#6A6A70;--bg:#fafafa;--accent:#111}
*{margin:0;box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
body{color:var(--ink);background:#fff;line-height:1.5}
.wrap{max-width:1040px;margin:0 auto;padding:0 24px}
header{display:flex;justify-content:space-between;align-items:center;padding:22px 0}
.logo{font-weight:700;letter-spacing:-.02em;font-size:19px}
nav a{margin-left:24px;color:var(--muted);text-decoration:none;font-size:14px}
.cta{background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:14px;text-decoration:none}
.hero{padding:80px 0 64px;background:linear-gradient(180deg,#fff,#f4f4f5)}
.hero h1{font-size:clamp(34px,6vw,60px);letter-spacing:-.03em;line-height:1.05;max-width:12ch}
.hero p{color:var(--muted);font-size:19px;margin-top:18px;max-width:46ch}
.hero .row{margin-top:28px;display:flex;gap:12px}
.ghost{border:1px solid #ddd;padding:12px 22px;border-radius:999px;text-decoration:none;color:var(--ink);font-size:15px}
.solid{background:var(--ink);color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:64px 0}
.card{border:1px solid #eee;border-radius:16px;padding:24px}
.card h3{font-size:17px;margin-bottom:8px}.card p{color:var(--muted);font-size:14px}
.band{background:var(--ink);color:#fff;padding:64px 0;text-align:center}
.band h2{font-size:32px;letter-spacing:-.02em}.band p{color:#bbb;margin-top:12px}
footer{padding:40px 0;color:var(--muted);font-size:13px;text-align:center}
</style></head><body>
<div class="wrap"><header><div class="logo">${business}</div>
<nav><a href="#">Services</a><a href="#">About</a><a href="#">Reviews</a><a class="cta" href="#">Book now</a></nav></header></div>
<section class="hero"><div class="wrap"><h1>${location}'s trusted ${singular}, done right.</h1>
<p>Friendly, reliable ${type} with the workmanship your neighbors already recommend. Book online in under a minute.</p>
<div class="row"><a class="solid" href="#">Get a free quote</a><a class="ghost" href="#">Call us today</a></div></div></section>
<div class="wrap"><section class="grid">
<div class="card"><h3>Upfront pricing</h3><p>No surprises. Clear quotes before we start, every time.</p></div>
<div class="card"><h3>Local &amp; licensed</h3><p>Proudly serving ${location} with fully insured, vetted pros.</p></div>
<div class="card"><h3>Book in seconds</h3><p>Pick a time online — confirmation lands in your inbox instantly.</p></div>
</section></div>
<section class="band"><div class="wrap"><h2>Ready to get started?</h2><p>Join hundreds of happy ${location} customers.</p>
<p style="margin-top:20px"><a class="cta" href="#" style="background:#fff;color:#111">Request your quote →</a></p></div></section>
<footer>© ${business} · ${location} · Built as a preview by Everdeck</footer>
</body></html>`;
}

export function mockGenerate(req: LlmRequest): string {
  const m = req.user.match(/BUSINESS:\s*(.+)/);
  const business = (m ? m[1] : "This business").trim();
  const tm = req.user.match(/TYPE:\s*(.+)/);
  const type = (tm ? tm[1] : "local business").trim();
  const lm = req.user.match(/LOCATION:\s*(.+)/);
  const location = (lm ? lm[1] : "your area").trim();
  const hasSite = /HAS_SITE:\s*true/.test(req.user);

  const opener = hasSite
    ? `Hi ${business} team — I put together a free redesign concept of your website (mobile-first, faster, easier to book). It took your current site and modernized it — mind if I send the link? No obligation, just thought it might be useful.`
    : `Hi ${business} team — I noticed you don't have a website yet, so I built a free one-page concept for you to see how it could look. Happy to send the preview link — takes 10 seconds to look at, no strings attached.`;

  return JSON.stringify({
    html: mockupHtml(business, type, location),
    opener,
    summary: hasSite
      ? "Modernized layout, mobile-first hero, clear booking CTA, upfront-pricing trust cues."
      : "A complete first website: hero, services, trust signals, and an online booking CTA.",
  });
}

export function mockComplete(req: LlmRequest): string {
  if (req.user.includes("STAGE: generate")) return mockGenerate(req);
  return JSON.stringify({ note: "mock: unrecognized stage" });
}
