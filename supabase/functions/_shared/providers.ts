// External data provider seams for the prospect pipeline.
//
// Every provider has a deterministic MOCK default (zero network, zero cost,
// works in preview) and a LIVE path behind an env flag + key. Swapping is a
// config change. The only providers that NEED a key are business discovery
// (Google Places) and the LLM (Gemini); screenshots (thum.io) and public
// email extraction work with no key at all.

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

const GOOGLE_KEY = () => Deno.env.get("GOOGLE_MAPS_API_KEY");
const PLACES_PROVIDER = () => Deno.env.get("PLACES_PROVIDER") ?? "mock";
const AUDIT_PROVIDER = () => Deno.env.get("AUDIT_PROVIDER") ?? "mock";

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

function extractEmail(html: string): string | null {
  const mailto = html.match(/mailto:([^"'?\s>]+@[^"'?\s>]+)/i);
  if (mailto) return mailto[1].toLowerCase();
  const plain = html.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  // Skip obvious asset/no-reply noise.
  if (plain && !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(plain[0])) return plain[0].toLowerCase();
  return null;
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
    // Deterministic mock audit derived from the URL.
    const seed = [...website].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const score = 25 + (seed % 55); // 25-79
    const issues: string[] = [];
    if (score < 50) issues.push("Slow on mobile", "No SSL / mixed content");
    if (score < 65) issues.push("Not mobile-responsive");
    issues.push("Outdated design");
    return { has_website: true, score, screenshot_url: screenshotFor(website), contact_email: null, issues };
  }

  // LIVE: fetch the page (keyless) for email + basic signals, PageSpeed if key.
  const issues: string[] = [];
  let contact_email: string | null = null;
  let reachable = true;
  try {
    const r = await fetch(website, { signal: AbortSignal.timeout(8000), redirect: "follow" });
    const html = await r.text();
    contact_email = extractEmail(html);
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
