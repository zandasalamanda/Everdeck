import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import IdeaActions from "@/components/app/IdeaActions";
import { GroundingBadge, TierBadge } from "@/components/app/badges";
import { getIdeaDetail, getWorkspace } from "@/lib/data";
import type { Tier } from "@/lib/types";
import { FRAMEWORK_LABELS, TIER_GLYPHS } from "@/lib/types";

export const metadata: Metadata = {
  title: "Idea · Everdeck",
};

const TIER_TEXT: Record<Tier, string> = {
  high: "text-mint",
  med: "text-lilac",
  low: "text-white/55",
};

const TIER_DOT: Record<Tier, string> = {
  high: "bg-mint",
  med: "bg-lilac",
  low: "bg-white/40",
};

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ws, detail] = await Promise.all([getWorkspace(), getIdeaDetail(id)]);
  if (!ws) redirect("/sign-in");
  if (!detail) notFound();

  const { idea, nodeLabel, painPoints, siblings, assessments, landingPrompts, starred } =
    detail;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/app/map"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to map
      </Link>

      {/* Header */}
      <header className="mt-5 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            {FRAMEWORK_LABELS[idea.framework]}
            {nodeLabel && <span className="text-white/25"> · {nodeLabel}</span>}
          </div>
          <h1 className="mt-1.5 text-2xl font-medium tracking-tight text-cloud">
            {idea.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TierBadge tier={idea.tier} />
            <GroundingBadge grounding={idea.grounding} />
          </div>
        </div>

        <ScoreRing score={idea.score} tier={idea.tier} />
      </header>

      <div className="mt-6 space-y-4">
        <Panel title="Explanation">
          <p className="text-[14px] leading-relaxed text-white/75">{idea.explanation}</p>
        </Panel>

        <Panel title="Features">
          {idea.features.length === 0 ? (
            <p className="text-[13px] text-white/40">No features listed for this idea.</p>
          ) : (
            <ul className="space-y-2">
              {idea.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-white/75">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/25"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Shape of the business">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Definition term="Value prop" value={idea.value_prop} />
            <Definition term="Business model" value={idea.business_model} />
            <Definition term="Differentiator" value={idea.differentiator} />
            <Definition term="Pain addressed" value={idea.pain_addressed} />
          </dl>
        </Panel>

        <Panel title="Pain points & customer language">
          {painPoints.length === 0 ? (
            <p className="text-[13px] text-white/40">
              No pain-point research at this niche yet.
            </p>
          ) : (
            <div className="space-y-6">
              {painPoints.map((pain) => (
                <div key={pain.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[14px] font-medium text-white/90">
                      {pain.heading}
                    </h3>
                    {pain.frequency && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                        frequency: {pain.frequency}
                      </span>
                    )}
                    {pain.intensity && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/55">
                        intensity: {pain.intensity}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                    {pain.summary}
                  </p>
                  {pain.pain_quotes.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {pain.pain_quotes.map((quote) => (
                        <blockquote
                          key={quote.id}
                          className="border-l-2 border-lilac/40 pl-3 text-[13px] italic leading-relaxed text-white/70"
                        >
                          &ldquo;{quote.quote}&rdquo;
                          {quote.source_url && (
                            <a
                              href={quote.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex items-center gap-1 align-baseline text-[11px] not-italic text-white/35 hover:text-white"
                            >
                              source
                              <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            </a>
                          )}
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top 3 at this niche">
          {assessments.length === 0 ? (
            <p className="text-[13px] text-white/40">
              This niche hasn&rsquo;t been ranked yet.
            </p>
          ) : (
            <ol className="space-y-4">
              {assessments.slice(0, 3).map((assessment) => {
                const isThisIdea = assessment.idea_id === idea.id;
                return (
                  <li key={assessment.id} className="flex items-start gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${
                        assessment.rank === 1
                          ? "bg-iridescent text-ink"
                          : "bg-white/10 text-white/70"
                      }`}
                      aria-label={`Rank ${assessment.rank}`}
                    >
                      {assessment.rank}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-[14px] ${
                          isThisIdea ? "font-semibold text-cloud" : "text-white/75"
                        }`}
                      >
                        {assessment.ideas.name}
                        {isThisIdea && (
                          <span className="ml-2 text-[11px] font-normal text-white/40">
                            this idea
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                        {assessment.rationale}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <Panel title="Other ideas at this node">
          {siblings.length === 0 ? (
            <p className="text-[13px] text-white/40">No other ideas at this node yet.</p>
          ) : (
            <ul className="-mx-2 space-y-0.5">
              {siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link
                    href={`/app/idea/${sibling.id}`}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.05]"
                  >
                    <span
                      aria-hidden="true"
                      className={`text-[10px] ${TIER_TEXT[sibling.tier]}`}
                    >
                      {TIER_GLYPHS[sibling.tier]}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${TIER_DOT[sibling.tier]}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/75 group-hover:text-white">
                      {sibling.name}
                    </span>
                    <span className="text-[12px] tabular-nums text-white/50">
                      {sibling.score}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <IdeaActions
          idea={idea}
          starred={starred}
          landingPrompts={landingPrompts}
          canGenerate={ws.plan.landing_prompts}
        />
      </div>
    </div>
  );
}

/** Large score inside a drawn ring, tinted by tier. */
function ScoreRing({ score, tier }: { score: number; tier: Tier }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-carbon-panel p-4 ring-1 ring-white/10">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 44 44" className="h-20 w-20 -rotate-90" aria-hidden="true">
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-white/10"
          />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - Math.min(Math.max(score, 0), 100)}
            strokeLinecap="round"
            className={TIER_TEXT[tier]}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-medium tabular-nums text-cloud">
          {score}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/40">Score</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/40">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Definition({ term, value }: { term: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-white/35">{term}</dt>
      <dd className="mt-1 text-[14px] leading-relaxed text-white/75">
        {value ?? <span className="text-white/30">—</span>}
      </dd>
    </div>
  );
}
