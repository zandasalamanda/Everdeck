// Verifies a Clerk session JWT against the issuing instance's JWKS.
//
// The issuer is pinned to an allowlist of this project's known Clerk
// instances, so a forged `iss` can't point us at an attacker's JWKS. Both
// candidate dev instances are listed until the app's instance is finalized;
// prune to the one in use (and add the production Frontend API domain) at
// go-live. A CLERK_ISSUER env var, if set, overrides the allowlist.

import { createRemoteJWKSet, decodeJwt, jwtVerify } from "npm:jose@5";

const ENV_ISSUER = Deno.env.get("CLERK_ISSUER");
const ALLOWED_ISSUERS = ENV_ISSUER
  ? [ENV_ISSUER]
  : [
      "https://alert-oarfish-38.clerk.accounts.dev",
      "https://relevant-bat-62.clerk.accounts.dev",
    ];

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export interface ClerkClaims {
  sub: string;
  email: string | null;
}

/** Returns verified claims, or null if the token is missing/invalid/untrusted. */
export async function verifyClerkJwt(token: string): Promise<ClerkClaims | null> {
  try {
    const iss = decodeJwt(token).iss;
    if (!iss || !ALLOWED_ISSUERS.includes(iss)) return null;

    let jwks = jwksByIssuer.get(iss);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${iss}/.well-known/jwks.json`));
      jwksByIssuer.set(iss, jwks);
    }

    const { payload } = await jwtVerify(token, jwks, { issuer: iss });
    if (!payload.sub) return null;
    const email =
      (typeof payload.email === "string" && payload.email) ||
      (typeof (payload as { email_address?: string }).email_address === "string" &&
        (payload as { email_address?: string }).email_address) ||
      null;
    return { sub: String(payload.sub), email };
  } catch {
    return null;
  }
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("Authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}
