// External data provider seams for the prospect pipeline.
//
// Every provider has a deterministic MOCK default (zero network, zero cost,
// works in preview) and a LIVE path behind an env flag + key. Swapping is a
// config change. The only providers that NEED a key are business discovery
// (Google Places) and the LLM (Gemini); screenshots (thum.io) and public
// email extraction work with no key at all.

import { env } from "./config.ts";
import { mockBusinesses } from "./mock.ts";

export interface Business {
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  rating: number | null;
}

export interface SiteAudit {
  has_website: boolean;
  score: number | null; // 0-100; null when there is no site
  screenshot_url: string | null;
  contact_email: string | null;
  issues: string[];
}

const GOOGLE_KEY = () => env("GOOGLE_MAPS_API_KEY");
const PLACES_PROVIDER = () => env("PLACES_PROVIDER") ?? "mock";
const AUDIT_PROVIDER = () => env("AUDIT_PROVIDER") ?? "mock";

// ---------- 1. Business discovery ----------

export async function discoverBusinesses(
  type: string,
  location: string,
  limit: number,
): Promise<Business[]> {
  if (PLACES_PROVIDER() === "google" && GOOGLE_KEY()) {
    // Google Places API (New) — Text Search.
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY()!,
        // Fields kept to the Text Search Pro SKU (5k free/mo, then $32/1k).
        // Adding places.rating would bump every call to the pricier
        // Enterprise SKU ($35/1k), so it is deliberately omitted.
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri",
      },
      body: JSON.stringify({ textQuery: `${type} in ${location}`, maxResultCount: Math.min(limit, 20) }),
    });
    if (!res.ok) throw new Error(`places ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    return (json.places ?? []).map((p: Record<string, unknown>) => ({
      place_id: String(p.id),
      name: (p.displayName as { text?: string })?.text ?? "Unknown",
      address: (p.formattedAddress as string) ?? null,
      phone: (p.nationalPhoneNumber as string) ?? null,
      website_url: (p.websiteUri as string) ?? null,
      rating: (p.rating as number) ?? null,
    }));
  }
  return mockBusinesses(type, location, limit);
}

// ---------- 2. Site audit (fetch + optional PageSpeed) ----------

function registrableHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Is this a plausible human contact, not a tracking DSN / vendor telemetry? */
function isPlausibleContact(email: string): boolean {
  const at = email.indexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain) return false;
  if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(email)) return false;
  // Sentry DSNs / API keys appear as a long hex string before the @.
  if (/^[0-9a-f]{16,}$/i.test(local) || local.length > 40) return false;
  // Vendor telemetry / placeholder domains that are never a real inbox.
  if (/(^|\.)(sentry\.io|wixpress\.com|example\.(com|org|net))$/i.test(domain)) return false;
  return true;
}

/** Best public contact email on the page, preferring the business's own domain. */
function extractEmail(html: string, website: string | null): string | null {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+@[^"'?\s>]+)/gi)) found.add(m[1].toLowerCase());
  for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase());

  const candidates = [...found].filter(isPlausibleContact);
  if (candidates.length === 0) return null;

  const host = registrableHost(website);
  if (host) {
    const own = candidates.find((e) => e.endsWith("@" + host) || e.endsWith("." + host));
    if (own) return own;
  }
  return candidates[0];
}

/** thum.io renders a screenshot from a plain URL — no key required. */
export function screenshotFor(url: string): string {
  return `https://image.thum.io/get/width/1200/crop/900/${url}`;
}

export async function auditSite(website: string | null): Promise<SiteAudit> {
  if (!website) {
    return { has_website: false, score: null, screenshot_url: null, contact_email: null, issues: ["No website at all"] };
  }

  if (AUDIT_PROVIDER() === "mock") {
    // Deterministic mock audit derived from the URL. No screenshot — the mock
    // domains aren't real, so a live screenshot service would 404. Real audits
    // (AUDIT_PROVIDER=live) capture the actual site.
    const seed = [...website].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const score = 25 + (seed % 55); // 25-79
    const issues: string[] = [];
    if (score < 50) issues.push("Slow on mobile", "No SSL / mixed content");
    if (score < 65) issues.push("Not mobile-responsive");
    issues.push("Outdated design");
    return { has_website: true, score, screenshot_url: null, contact_email: null, issues };
  }

  // LIVE: fetch the page (keyless) for email + basic signals, PageSpeed if key.
  const issues: string[] = [];
  let contact_email: string | null = null;
  let reachable = true;
  try {
    const r = await fetch(website, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    const html = await r.text();
    contact_email = extractEmail(html, website);
    if (!/viewport/i.test(html)) issues.push("Not mobile-responsive");
    if (!website.startsWith("https")) issues.push("No SSL");
    if (html.length < 1500) issues.push("Very thin content");
  } catch {
    reachable = false;
    issues.push("Site fails to load");
  }

  let score: number | null = reachable ? 60 : 15;
  if (GOOGLE_KEY()) {
    try {
      const ps = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(website)}&strategy=mobile&key=${GOOGLE_KEY()}`,
        { signal: AbortSignal.timeout(20000) },
      );
      if (ps.ok) {
        const pj = await ps.json();
        const perf = pj.lighthouseResult?.categories?.performance?.score;
        if (typeof perf === "number") score = Math.round(perf * 100);
        if (score !== null && score < 50) issues.push("Poor performance score");
      }
    } catch {
      // PageSpeed is best-effort; keep the heuristic score.
    }
  }

  return { has_website: true, score, screenshot_url: screenshotFor(website), contact_email, issues };
}

/** Opportunity score: no site = top priority; worse site = better prospect. */
export function opportunityScore(audit: SiteAudit): number {
  if (!audit.has_website) return 95;
  const base = 100 - (audit.score ?? 50);
  return Math.max(20, Math.min(92, base + Math.min(20, audit.issues.length * 4)));
}
