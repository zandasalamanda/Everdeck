// Live RLS smoke tests against the production Supabase project, using only
// public credentials (anon key). Proves the tenant boundary from outside.

import { describe, expect, it } from "vitest";

const SB = "https://fxrnuoahfzzdsepwvzux.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cm51b2FoZnp6ZHNlcHd2enV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTU2OTQsImV4cCI6MjA5OTczMTY5NH0.EW6_pH108A-jsPWKrfqJJt19kzNzcu1mByds_aPI8n8";
const DEMO_ACCOUNT = "17fb1899-da9a-4713-94e0-6f34e2237e7f";

async function demoToken(): Promise<string> {
  const res = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo@everdeck.app",
      password: process.env.EVERDECK_DEMO_PASSWORD ?? "19aceabb7884c0abce",
    }),
  });
  const json = await res.json();
  return json.access_token as string;
}

describe("live RLS boundary", () => {
  it("anonymous callers see zero rows in every tenant table", async () => {
    for (const table of ["ideas", "accounts", "pain_points", "subscriptions", "jobs"]) {
      const res = await fetch(`${SB}/rest/v1/${table}?select=id&limit=5`, {
        headers: { apikey: ANON },
      });
      const rows = await res.json();
      expect(Array.isArray(rows) ? rows.length : 0, `${table} leaked to anon`).toBe(0);
    }
  });

  it("a signed-in member sees only rows from their own account", async () => {
    const token = await demoToken();
    expect(token).toBeTruthy();

    const res = await fetch(`${SB}/rest/v1/ideas?select=id,account_id&limit=100`, {
      headers: { apikey: ANON, Authorization: `Bearer ${token}` },
    });
    const rows = (await res.json()) as { account_id: string }[];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.account_id).toBe(DEMO_ACCOUNT);
  });

  it("anonymous callers cannot execute the gated RPCs", async () => {
    const res = await fetch(`${SB}/rest/v1/rpc/start_run`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_account_id: DEMO_ACCOUNT,
        p_mode: "directed",
        p_market_name: "should not work",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("the worker rejects unauthenticated ticks", async () => {
    const res = await fetch(`${SB}/functions/v1/worker?task=tick`, { method: "POST" });
    expect(res.status).toBe(401);
  });
});
