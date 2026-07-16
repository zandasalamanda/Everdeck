// Server-side data helpers. All queries run with the current Clerk user's
// JWT — RLS is the enforcement layer; these helpers never see other
// accounts' rows.

import { auth, currentUser } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  Hunt,
  Mockup,
  Outreach,
  Plan,
  Prospect,
  PursueUsage,
  Run,
  Subscription,
} from "@/lib/types";

export interface Workspace {
  account: Account;
  subscription: Subscription;
  plan: Plan;
  email: string;
}

/** The signed-in user's workspace; provisions it on first visit. */
export async function getWorkspace(): Promise<Workspace | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createClient();
  await supabase.rpc("ensure_workspace");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.firstName ?? user?.username ?? "";
  if (email || name) await supabase.rpc("sync_profile", { p_email: email, p_name: name });

  const { data: account } = await supabase
    .from("accounts")
    .select("id, name, owner_id")
    .limit(1)
    .single();
  if (!account) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("account_id, plan, status, source, current_period_end")
    .eq("account_id", account.id)
    .single();

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("plan", subscription?.plan ?? "free")
    .single();

  return {
    account: account as Account,
    subscription: (subscription ?? {
      account_id: account.id,
      plan: "free",
      status: "active",
      source: "sandbox",
      current_period_end: null,
    }) as Subscription,
    plan: (plan ?? {
      plan: "free",
      daily_runs: 1,
      ideas_per_run: 5,
      landing_prompts: false,
      engine: false,
    }) as Plan,
    email,
  };
}

export async function getTodaysProspects(accountId: string): Promise<Prospect[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_todays_prospects")
    .select("*")
    .eq("account_id", accountId)
    .order("opportunity_score", { ascending: false })
    .limit(60);
  return (data ?? []) as Prospect[];
}

export async function getRecentProspects(accountId: string, limit = 40): Promise<Prospect[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .eq("account_id", accountId)
    .order("opportunity_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Prospect[];
}

export async function getBoardProspects(accountId: string): Promise<Prospect[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("prospects")
    .select("*")
    .eq("account_id", accountId)
    .in("status", ["ready", "in_dock", "sent", "replied", "won", "lost"])
    .order("opportunity_score", { ascending: false })
    .limit(300);
  return (data ?? []) as Prospect[];
}

export interface ProspectDetail {
  prospect: Prospect;
  hunt: Hunt | null;
  mockup: Mockup | null;
  outreach: Outreach | null;
  canGenerate: boolean;
}

export async function getProspectDetail(prospectId: string): Promise<ProspectDetail | null> {
  const supabase = createClient();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .single();
  if (!prospect) return null;

  const [{ data: hunt }, { data: mockup }, { data: outreach }] = await Promise.all([
    supabase.from("hunts").select("*").eq("id", prospect.hunt_id).maybeSingle(),
    supabase
      .from("mockups")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("outreach").select("*").eq("prospect_id", prospectId).maybeSingle(),
  ]);

  return {
    prospect: prospect as Prospect,
    hunt: (hunt ?? null) as Hunt | null,
    mockup: (mockup ?? null) as Mockup | null,
    outreach: (outreach ?? null) as Outreach | null,
    canGenerate: true,
  };
}

export interface DockItem {
  outreach: Outreach;
  prospect: Pick<Prospect, "id" | "name" | "website_url" | "has_website" | "tier" | "contact_email">;
}

export async function getDock(accountId: string): Promise<DockItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("outreach")
    .select("*, prospects(id, name, website_url, has_website, tier, contact_email)")
    .eq("account_id", accountId)
    .order("updated_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as unknown as (Outreach & { prospects: DockItem["prospect"] })[]).map((row) => ({
    outreach: row,
    prospect: row.prospects,
  }));
}

export async function getHunts(accountId: string): Promise<Hunt[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("hunts")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as Hunt[];
}

export async function getRuns(accountId: string): Promise<Run[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("runs")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as Run[];
}

export interface UsageSummary {
  provider: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

export async function getUsage(accountId: string): Promise<UsageSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("usage_events")
    .select("provider, request_count, input_tokens, output_tokens")
    .eq("account_id", accountId)
    .limit(3000);

  const byProvider = new Map<string, UsageSummary>();
  for (const row of data ?? []) {
    const cur = byProvider.get(row.provider) ?? {
      provider: row.provider,
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    cur.requests += row.request_count;
    cur.inputTokens += row.input_tokens;
    cur.outputTokens += row.output_tokens;
    byProvider.set(row.provider, cur);
  }
  return [...byProvider.values()];
}

/** This month's pursue budget — how many "give the order" calls are left. */
export async function getPursueUsage(): Promise<PursueUsage | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("pursue_usage");
  if (error) return null;

  // The RPC returns a table(used int, allowed int) — a single-row set.
  const row = (Array.isArray(data) ? data[0] : data) as
    | { used: number; allowed: number }
    | null
    | undefined;
  if (!row) return null;

  return { used: Number(row.used ?? 0), allowed: Number(row.allowed ?? 0) };
}
