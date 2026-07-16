import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Radar, Trophy } from "lucide-react";

import { TierLegend } from "@/components/app/badges";
import ProspectCard from "@/components/app/ProspectCard";
import {
  getPursueUsage,
  getRecentProspects,
  getTodaysProspects,
  getWinsSummary,
  getWorkspace,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Prospects — Everdeck" };

export default async function ProspectsPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const todays = await getTodaysProspects(ws.account.id);
  const [fallback, usage, wins] = await Promise.all([
    todays.length ? Promise.resolve(todays) : getRecentProspects(ws.account.id),
    getPursueUsage(),
    getWinsSummary(ws.account.id),
  ]);
  const wonRevenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(wins.revenue);
  // Highest-opportunity first — no-website / high-opportunity leads lead the deck.
  const prospects = [...fallback].sort((a, b) => b.opportunity_score - a.opportunity_score);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
            Your team&apos;s report
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
            Fresh leads, ready for your call
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            {prospects.length} {prospects.length === 1 ? "business" : "businesses"} found · you
            decide who to pursue
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TierLegend />
          {wins.count > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-medium text-mint ring-1 ring-mint/20">
              <Trophy className="h-3 w-3" aria-hidden />
              {wins.count} won
              {wins.revenue > 0 && (
                <>
                  {" · "}
                  <span className="tabular-nums">{wonRevenue}</span>
                </>
              )}{" "}
              this month
            </span>
          )}
          {usage && (
            <span className="text-[11px] tabular-nums text-white/35">
              {usage.used} / {usage.allowed} pursues this month
            </span>
          )}
        </div>
      </header>

      {prospects.length === 0 ? (
        <div className="mt-16 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
          <Radar className="mx-auto h-6 w-6 text-white/30" />
          <h2 className="mt-3 text-lg font-medium text-white">No leads yet</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-white/50">
            Run a hunt — pick a business type and a city, and Everdeck finds every
            business, audits their site, and scores the opportunity. Then you pick
            who to pursue.
          </p>
          <Link
            href="/app/hunts"
            className="bg-iridescent mt-5 inline-block rounded-full px-5 py-2 text-sm font-medium text-ink"
          >
            Start your first hunt
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
        </div>
      )}
    </div>
  );
}
