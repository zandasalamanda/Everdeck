// Domain types mirroring the Supabase schema (see supabase/migrations).

export type Tier = "high" | "med" | "low";
export type Grounding = "synthetic" | "reddit";
export type RunMode = "autonomous" | "directed";
export type RunStatus = "queued" | "running" | "done" | "error";
export type NodeType = "core" | "category" | "subcategory" | "niche" | "subniche";
export type Framework =
  | "segmentation"
  | "differentiation"
  | "business_model"
  | "distribution"
  | "new_paradigm";

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  segmentation: "Market segmentation",
  differentiation: "Product differentiation",
  business_model: "Business-model innovation",
  distribution: "Distribution & marketing",
  new_paradigm: "New paradigm",
};

export const TIER_LABELS: Record<Tier, string> = {
  high: "High opportunity",
  med: "Medium opportunity",
  low: "Low opportunity",
};

/** Non-color cue shown alongside tier colors for accessibility. */
export const TIER_GLYPHS: Record<Tier, string> = {
  high: "▲",
  med: "◆",
  low: "○",
};

export interface Account {
  id: string;
  name: string;
  owner_id: string;
}

export interface Subscription {
  account_id: string;
  plan: string;
  status: string;
  source: "stripe" | "sandbox";
  current_period_end: string | null;
}

export interface Plan {
  plan: string;
  daily_runs: number;
  ideas_per_run: number;
  landing_prompts: boolean;
  engine: boolean;
}

export interface Market {
  id: string;
  account_id: string;
  name: string;
  mode: RunMode;
  created_at: string;
}

export interface MarketNode {
  id: string;
  market_id: string;
  parent_id: string | null;
  node_type: NodeType;
  label: string;
  depth: number;
}

export interface Idea {
  id: string;
  market_id: string;
  node_id: string;
  run_id: string | null;
  framework: Framework;
  name: string;
  explanation: string;
  features: string[];
  value_prop: string | null;
  business_model: string | null;
  pain_addressed: string | null;
  differentiator: string | null;
  score: number;
  tier: Tier;
  grounding: Grounding;
  created_at: string;
}

export interface PainPoint {
  id: string;
  node_id: string;
  heading: string;
  summary: string;
  frequency: string | null;
  intensity: string | null;
  priority_rank: number | null;
  grounding: Grounding;
}

export interface PainQuote {
  id: string;
  pain_point_id: string;
  quote: string;
  source_url: string | null;
}

export interface Assessment {
  id: string;
  node_id: string;
  idea_id: string;
  rank: number;
  rationale: string;
}

export interface Run {
  id: string;
  account_id: string;
  market_id: string | null;
  mode: RunMode;
  status: RunStatus;
  stage_progress: Record<string, string>;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface LandingPrompt {
  id: string;
  idea_id: string;
  content: string;
  created_at: string;
}

export function tierFromScore(score: number): Tier {
  if (score >= 75) return "high";
  if (score >= 50) return "med";
  return "low";
}
