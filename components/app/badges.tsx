import type { Grounding, ProspectStatus, Tier } from "@/lib/types";
import { STATUS_LABELS, TIER_GLYPHS, TIER_LABELS } from "@/lib/types";

/** Opportunity tier chip: color + glyph (non-color cue) + label. */
export function TierBadge({ tier, compact = false }: { tier: Tier; compact?: boolean }) {
  const color =
    tier === "high"
      ? "bg-mint/15 text-mint"
      : tier === "med"
        ? "bg-lilac/15 text-lilac"
        : "bg-white/10 text-white/55";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}
      title={TIER_LABELS[tier]}
    >
      <span aria-hidden="true">{TIER_GLYPHS[tier]}</span>
      {compact ? tier.toUpperCase() : TIER_LABELS[tier]}
    </span>
  );
}

/** Data provenance chip — live provider vs synthetic sample. */
export function GroundingBadge({ grounding }: { grounding: Grounding }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        grounding === "live" ? "bg-sky/15 text-sky" : "bg-white/10 text-white/45"
      }`}
      title={
        grounding === "live"
          ? "Pulled from a live business-data provider"
          : "Synthetic sample data (add API keys to go live)"
      }
    >
      {grounding === "live" ? "live" : "sample"}
    </span>
  );
}

const STATUS_STYLE: Record<ProspectStatus, string> = {
  new: "bg-white/10 text-white/50",
  audited: "bg-white/10 text-white/60",
  pursuing: "bg-lilac/15 text-lilac",
  ready: "bg-lilac/15 text-lilac",
  in_dock: "bg-sky/15 text-sky",
  sent: "bg-blush/15 text-blush",
  replied: "bg-mint/15 text-mint",
  won: "bg-mint/20 text-mint",
  lost: "bg-white/10 text-white/40",
  skipped: "bg-white/10 text-white/40",
};

export function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** The always-visible tier legend for the deck. */
export function TierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["high", "med", "low"] as Tier[]).map((t) => (
        <TierBadge key={t} tier={t} />
      ))}
      <span className="text-[10px] text-white/35">shapes distinguish tiers without color</span>
    </div>
  );
}
