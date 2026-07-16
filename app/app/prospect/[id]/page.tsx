import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, Sparkles } from "lucide-react";

import { GroundingBadge, StatusBadge, TierBadge } from "@/components/app/badges";
import BuildBrief from "@/components/app/BuildBrief";
import MockupPreview from "@/components/app/MockupPreview";
import OutreachEditor, { OpenMockupButton } from "@/components/app/OutreachEditor";
import ProspectStatusBar from "@/components/app/ProspectStatusBar";
import PursueButton from "@/components/app/PursueButton";
import { getProspectDetail, getWorkspace } from "@/lib/data";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Opportunity score as a luminous progress ring, tinted by tier. */
function ScoreRing({ score, tier }: { score: number; tier: Tier }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const stroke = tier === "high" ? "#B5F5D8" : tier === "med" ? "#C9BBFF" : "#9CD6FF";

  return (
    <div className="relative flex h-[76px] w-[76px] items-center justify-center">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-lg font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ws, detail] = await Promise.all([getWorkspace(), getProspectDetail(id)]);
  if (!ws) redirect("/sign-in");
  if (!detail) notFound();

  const { prospect, mockup, outreach } = detail;
  const meta = [prospect.address, prospect.phone].filter(Boolean).join("  ·  ");
  const issues = (prospect.reason ?? "")
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);
  const hasScreenshot = Boolean(prospect.website_url && prospect.current_site_screenshot_url);
  const isBuilding = prospect.status === "pursuing";

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All prospects
      </Link>

      {/* Header */}
      <header className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium tracking-tight text-white">{prospect.name}</h1>
          {meta && <p className="mt-1 text-[13px] text-white/50">{meta}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TierBadge tier={prospect.tier} />
            <StatusBadge status={prospect.status} />
            <GroundingBadge grounding={prospect.grounding} />
            {prospect.website_url && (
              <a
                href={prospect.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                View current site
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-carbon-panel px-4 py-3 ring-1 ring-white/10">
          <ScoreRing score={prospect.opportunity_score} tier={prospect.tier} />
          <div className="pr-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Opportunity</p>
            <p className="mt-0.5 text-[13px] text-white/60">out of 100</p>
          </div>
        </div>
      </header>

      {/* Pipeline control */}
      <div className="mt-6">
        <ProspectStatusBar prospectId={prospect.id} status={prospect.status} />
      </div>

      {/* Before / After — the emotional centerpiece */}
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {/* LEFT — their site today */}
        <div className="flex flex-col rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">Their site today</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums ${
                prospect.has_website ? "bg-white/[0.06] text-white/70" : "bg-blush/15 text-blush"
              }`}
            >
              {prospect.has_website ? `Site score ${prospect.current_site_score ?? 0}/100` : "No website"}
            </span>
          </div>

          <div className="mt-4">
            {hasScreenshot ? (
              <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] bg-carbon-deep px-3 py-2">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  </span>
                  <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/40">
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{prospect.website_url}</span>
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prospect.current_site_screenshot_url ?? ""}
                  alt={`Current website of ${prospect.name}`}
                  className="block max-h-[440px] w-full bg-white object-cover object-top"
                />
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-carbon-deep/60 text-center">
                <Globe className="h-6 w-6 text-white/25" />
                <p className="mt-3 text-[14px] font-medium text-white/70">
                  {prospect.has_website ? "No screenshot captured" : "No website found"}
                </p>
                <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/40">
                  {prospect.has_website
                    ? "This business has a site, but we couldn't grab a preview."
                    : "This business has no site at all — a clean opening for you."}
                </p>
              </div>
            )}
          </div>

          {issues.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">What's holding them back</p>
              <ul className="mt-2 space-y-1.5">
                {issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-white/65">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blush/70" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — your concept (or the pursue call to action) */}
        <div className="flex flex-col rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">Your concept</h2>
            {mockup && <OpenMockupButton html={mockup.html} />}
          </div>

          <div className="mt-4">
            {mockup ? (
              <>
                <MockupPreview html={mockup.html} className="h-[520px] rounded-xl ring-1 ring-white/10" />
                {mockup.summary && (
                  <p className="mt-4 text-[13px] leading-relaxed text-white/60">{mockup.summary}</p>
                )}
              </>
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-carbon-deep/60 p-8 text-center">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute h-14 w-14 rounded-full bg-lilac/25 blur-xl"
                  />
                  <Sparkles
                    className={`relative h-7 w-7 text-lilac ${isBuilding ? "animate-pulse" : ""}`}
                  />
                </div>
                <h3 className="mt-4 text-[15px] font-medium text-white">
                  {isBuilding ? "Building your concept + brief…" : "Pursue this lead"}
                </h3>
                <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-white/50">
                  {isBuilding
                    ? "Your team is generating a website concept, a build brief, and a drafted email. This can take a moment."
                    : "Generate a website concept, a build brief, and a drafted email — one pursue."}
                </p>
                <div className="mt-5">
                  <PursueButton prospectId={prospect.id} status={prospect.status} variant="cta" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Build brief — the spec to hand to an AI coding tool */}
      {mockup?.brief && (
        <div className="mt-5">
          <BuildBrief brief={mockup.brief} />
        </div>
      )}

      {/* Outreach — only once the concept + draft exist */}
      {mockup && (
        <section className="mt-5 rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10 sm:p-6">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">Outreach</h2>
          <div className="mt-4">
            <OutreachEditor
              prospectId={prospect.id}
              toEmail={outreach?.to_email}
              subject={outreach?.subject}
              body={outreach?.body}
              status={outreach?.status}
            />
          </div>
        </section>
      )}
    </div>
  );
}
