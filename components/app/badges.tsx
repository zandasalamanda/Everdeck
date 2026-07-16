import type { Grounding, Tier } from "@/lib/types";
import { TIER_GLYPHS, TIER_LABELS } from "@/lib/types";

/** Opportunity tier chip: color + glyph (non-color cue) + label. */
export function TierBadge({ tier, compact = false }: { tier: Tier; compact?: boolean }) {
  const color =
    tier === "high" ? "bg-mint/15 text-mint" : tier === "med" ? "bg-lilac/15 text-lilac" : "bg-white/10 text-white/55";
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

/** Data provenance chip — synthetic vs grounded-in-Reddit. */
export function GroundingBadge({ grounding }: { grounding: Grounding }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        grounding === "reddit" ? "bg-sky/15 text-sky" : "bg-white/10 text-white/45"
      }`}
      title={
        grounding === "reddit"
          ? "Grounded in real Reddit discussions"
          : "Synthetic sample data from the mock provider"
      }
    >
      {grounding === "reddit" ? "grounded" : "synthetic"}
    </span>
  );
}

/** The always-visible map legend. */
export function TierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["high", "med", "low"] as Tier[]).map((t) => (
        <TierBadge key={t} tier={t} />
      ))}
      <span className="text-[10px] text-white/35">
        shapes distinguish tiers without color
      </span>
    </div>
  );
}
