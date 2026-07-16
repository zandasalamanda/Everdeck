// Soft pre-launch password gate. The real security boundary is Clerk auth +
// Supabase RLS; this only keeps casual visitors out until launch.
//
// The gate cookie stores an HMAC of the password keyed by a server secret, so
// it can't be forged by reading this (public) repo. Change the password by
// setting SITE_PASSWORD in the environment; it defaults to "SOLA".
export const GATE_COOKIE = "everdeck_gate";

export function sitePassword(): string {
  return process.env.SITE_PASSWORD ?? "SOLA";
}

function gateSecret(): string {
  // Any server-only secret works as the HMAC key; CLERK_SECRET_KEY is always
  // present in this app's server/edge runtime and never ships to the repo.
  return process.env.CLERK_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "everdeck-gate-fallback";
}

/** Deterministic, unforgeable token for the current password + server secret. */
export async function gateToken(): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(gateSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`gate:${sitePassword()}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
