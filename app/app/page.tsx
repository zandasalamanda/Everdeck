import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { GroundingBadge, TierBadge, TierLegend } from "@/components/app/badges";
import { getRecentIdeas, getTodaysDeck, getWorkspace } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodaysDeckPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const todays = await getTodaysDeck(ws.account.id);
  const ideas = todays.length > 0 ? todays : await getRecentIdeas(ws.account.id);
  const showingToday = todays.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
            {showingToday ? "Today's deck" : "Latest deck"}
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
            {showingToday
              ? "Fresh ideas from last night's scan"
              : "Your highest-scoring ideas"}
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            {ideas.length} scored ideas · sorted by opportunity
          </p>
        </div>
        <TierLegend />
      </header>

      {ideas.length === 0 ? (
        <div className="mt-16 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
          <Sparkles className="mx-auto h-6 w-6 text-white/30" />
          <h2 className="mt-3 text-lg font-medium text-white">No ideas yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-white/50">
            The engine hasn't dealt a hand for this workspace. Start a run and
            the five-stage pipeline will map a market, mine its pain points,
            and score the openings.
          </p>
          <Link
            href="/app/runs"
            className="bg-iridescent mt-5 inline-block rounded-full px-5 py-2 text-sm font-medium text-ink"
          >
            Start your first run
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {ideas.map((idea, i) => (
            <li key={idea.id}>
              <Link
                href={`/app/idea/${idea.id}`}
                className="group flex h-full flex-col rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:ring-white/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-white/35">
                    {FRAMEWORK_LABELS[idea.framework]}
                  </span>
                  <span className="text-xl font-medium tabular-nums text-white">
                    {Math.round(idea.score)}
                  </span>
                </div>
                <h2 className="mt-2 text-[15px] font-medium leading-snug tracking-tight text-white">
                  {i < 3 && showingToday && (
                    <span className="text-iridescent mr-1.5 text-[11px] font-medium uppercase">
                      Top {i + 1}
                    </span>
                  )}
                  {idea.name}
                </h2>
                <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-white/55">
                  {idea.explanation}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center gap-1.5">
                    <TierBadge tier={idea.tier} compact />
                    <GroundingBadge grounding={idea.grounding} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/25 transition-colors group-hover:text-white/60" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
