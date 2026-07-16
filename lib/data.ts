// Server-side data helpers. All queries run with the current Clerk user's
// JWT — RLS is the enforcement layer; these helpers never see other
// accounts' rows.

import { auth, currentUser } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  Assessment,
  Idea,
  LandingPrompt,
  Market,
  MarketNode,
  PainPoint,
  PainQuote,
  Plan,
  Run,
  Subscription,
} from "@/lib/types";

export interface Workspace {
  account: Account;
  subscription: Subscription;
  plan: Plan;
  email: string;
}

/** The signed-in user's workspace (first account membership).
 *  Provisions the workspace on first visit and keeps email/name in sync. */
export async function getWorkspace(): Promise<Workspace | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createClient();

  // Idempotent: creates profile+account+membership+subscription for a brand
  // new Clerk user, otherwise a no-op. Identity is read from the verified
  // JWT inside the RPC, never passed in.
  await supabase.rpc("ensure_workspace");

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.firstName ?? user?.username ?? "";
  if (email || name) {
    await supabase.rpc("sync_profile", { p_email: email, p_name: name });
  }

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

/** Today's deck: freshest ideas, highest score first. */
export async function getTodaysDeck(accountId: string): Promise<Idea[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("v_todays_deck")
    .select("*")
    .eq("account_id", accountId)
    .limit(60);
  return (data ?? []) as Idea[];
}

/** Most recent ideas regardless of day (fallback when today is empty). */
export async function getRecentIdeas(accountId: string, limit = 30): Promise<Idea[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("account_id", accountId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Idea[];
}

export interface MapData {
  markets: Market[];
  nodes: MarketNode[];
  ideas: Idea[];
}

export async function getMapData(accountId: string): Promise<MapData> {
  const supabase = createClient();
  const [{ data: markets }, { data: nodes }, { data: ideas }] = await Promise.all([
    supabase
      .from("markets")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("market_nodes")
      .select("id, market_id, parent_id, node_type, label, depth")
      .eq("account_id", accountId)
      .limit(2000),
    supabase
      .from("ideas")
      .select("*")
      .eq("account_id", accountId)
      .order("score", { ascending: false })
      .limit(500),
  ]);
  return {
    markets: (markets ?? []) as Market[],
    nodes: (nodes ?? []) as MarketNode[],
    ideas: (ideas ?? []) as Idea[],
  };
}

export interface IdeaDetail {
  idea: Idea;
  nodeLabel: string;
  painPoints: (PainPoint & { pain_quotes: PainQuote[] })[];
  siblings: Idea[];
  assessments: (Assessment & { ideas: { name: string } })[];
  landingPrompts: LandingPrompt[];
  starred: boolean;
}

export async function getIdeaDetail(ideaId: string): Promise<IdeaDetail | null> {
  const supabase = createClient();
  // The profiles RLS policy returns exactly the caller's row, so this is the
  // current user's internal id (app_uid) without trusting client input.
  const { data: me } = await supabase.from("profiles").select("id").maybeSingle();

  const { data: idea } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .single();
  if (!idea) return null;

  const [{ data: node }, { data: pains }, { data: siblings }, { data: assessments }, { data: prompts }, { data: signal }] =
    await Promise.all([
      supabase.from("market_nodes").select("label").eq("id", idea.node_id).single(),
      supabase
        .from("pain_points")
        .select("*, pain_quotes(*)")
        .eq("node_id", idea.node_id)
        .order("priority_rank", { ascending: true }),
      supabase
        .from("ideas")
        .select("*")
        .eq("node_id", idea.node_id)
        .neq("id", ideaId)
        .order("score", { ascending: false }),
      supabase
        .from("assessments")
        .select("*, ideas(name)")
        .eq("node_id", idea.node_id)
        .order("rank", { ascending: true }),
      supabase
        .from("landing_prompts")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false }),
      me
        ? supabase
            .from("idea_signals")
            .select("id")
            .eq("idea_id", ideaId)
            .eq("user_id", me.id)
            .eq("kind", "star")
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return {
    idea: idea as Idea,
    nodeLabel: node?.label ?? "",
    painPoints: (pains ?? []) as IdeaDetail["painPoints"],
    siblings: (siblings ?? []) as Idea[],
    assessments: (assessments ?? []) as IdeaDetail["assessments"],
    landingPrompts: (prompts ?? []) as LandingPrompt[],
    starred: !!signal,
  };
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
    .limit(2000);

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
