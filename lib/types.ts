// Domain types for the prospect model (web-dev lead machine).

export type Tier = "high" | "med" | "low";
export type Grounding = "synthetic" | "live";
export type RunMode = "autonomous" | "directed";
export type ProspectStatus =
  | "new"
  | "audited"
  | "ready"
  | "in_dock"
  | "sent"
  | "replied"
  | "won"
  | "lost"
  | "skipped";

export const TIER_LABELS: Record<Tier, string> = {
  high: "Hot lead",
  med: "Worth a look",
  low: "Long shot",
};

/** Non-color cue alongside tier colors, for accessibility. */
export const TIER_GLYPHS: Record<Tier, string> = {
  high: "▲",
  med: "◆",
  low: "○",
};

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  new: "New",
  audited: "Audited",
  ready: "Mockup ready",
  in_dock: "In outreach dock",
  sent: "Sent",
  replied: "Replied",
  won: "Won",
  lost: "Lost",
  skipped: "Skipped",
};

/** Ordered pipeline for the board. */
export const PIPELINE: ProspectStatus[] = ["ready", "in_dock", "sent", "replied", "won"];

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
  ideas_per_run: number; // prospects per hunt
  landing_prompts: boolean; // can regenerate mockups
  engine: boolean; // autonomous hunts
}

export interface Hunt {
  id: string;
  account_id: string;
  business_type: string;
  location: string;
  mode: RunMode;
  status: "queued" | "running" | "done" | "error";
  created_at: string;
}

export interface Prospect {
  id: string;
  hunt_id: string;
  run_id: string | null;
  place_id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  has_website: boolean;
  current_site_score: number | null;
  current_site_screenshot_url: string | null;
  contact_email: string | null;
  opportunity_score: number;
  tier: Tier;
  reason: string | null;
  status: ProspectStatus;
  grounding: Grounding;
  created_at: string;
}

export interface Mockup {
  id: string;
  prospect_id: string;
  html: string;
  summary: string | null;
  created_at: string;
}

export interface Outreach {
  id: string;
  prospect_id: string;
  to_email: string | null;
  subject: string | null;
  body: string | null;
  status: "draft" | "approved" | "sent";
  sent_at: string | null;
}

export interface Run {
  id: string;
  account_id: string;
  hunt_id: string | null;
  mode: RunMode;
  status: "queued" | "running" | "done" | "error";
  stage_progress: Record<string, string>;
  error: string | null;
  created_at: string;
}

export function tierFromScore(score: number): Tier {
  if (score >= 75) return "high";
  if (score >= 50) return "med";
  return "low";
}
