"use client";

import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";

import { GroundingBadge, StatusBadge, TierBadge } from "@/components/app/badges";
import type { Prospect } from "@/lib/types";

/** A single prospect in the deck — the visual is the business's current site
 * (or a "no website" placeholder), with the opportunity score over it. */
export default function ProspectCard({ prospect: p }: { prospect: Prospect }) {
  const score = Math.round(p.opportunity_score);

  return (
    <Link
      href={`/app/prospect/${p.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-carbon-panel ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:ring-white/25"
    >
      {/* Visual — current site screenshot or an opportunity placeholder */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-carbon-deep">
        {p.current_site_screenshot_url ? (
          <>
            <img
              src={p.current_site_screenshot_url}
              alt={p.name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="h-full w-full object-cover object-top"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-panel/70 via-transparent to-transparent"
            />
          </>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            <div
              aria-hidden
              className="pointer-events-none absolute h-24 w-24 rounded-full bg-lilac/20 blur-2xl"
            />
            <span className="relative text-[13px] text-white/50">No website</span>
          </div>
        )}

        {/* Opportunity score chip */}
        <div
          className="absolute right-2 top-2 inline-flex items-baseline gap-1 rounded-full bg-black/55 px-2.5 py-1 ring-1 ring-white/15 backdrop-blur-sm"
          aria-label={`Opportunity score ${score} out of 100`}
        >
          <span className="text-[15px] font-semibold leading-none tabular-nums text-white">
            {score}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-white/45">
            opp
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate text-[15px] font-medium text-white">{p.name}</h2>
        {p.address && (
          <p className="mt-0.5 truncate text-[12px] text-white/45">{p.address}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <TierBadge tier={p.tier} compact />
          <StatusBadge status={p.status} />
          <GroundingBadge grounding={p.grounding} />
        </div>

        {p.reason && (
          <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-white/55">
            {p.reason}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
            {p.has_website ? (
              <>
                <ExternalLink className="h-3 w-3" aria-hidden />
                has site
              </>
            ) : (
              "needs a site"
            )}
          </span>
          <ArrowUpRight
            className="h-4 w-4 text-white/25 transition-colors group-hover:text-white/60"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
