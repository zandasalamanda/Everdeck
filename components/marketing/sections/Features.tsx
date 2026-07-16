"use client";

import { useId } from "react";
import { ArrowRight, MapPin } from "lucide-react";

import Logo from "@/components/marketing/Logo";
import SectionHeading from "@/components/marketing/SectionHeading";
import { useReveal } from "@/lib/useReveal";

const FACTORS = [
  { label: "Speed", value: 44 },
  { label: "Mobile", value: 21 },
  { label: "SSL", value: 12 },
];

function ScoreGauge() {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FFC2D4" />
            <stop offset="0.38" stopColor="#C9BBFF" />
            <stop offset="0.72" stopColor="#9CD6FF" />
            <stop offset="1" stopColor="#B5F5D8" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r="16"
          pathLength="100"
          fill="none"
          strokeWidth="3"
          className="stroke-white/10"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          pathLength="100"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke={`url(#${id})`}
          className="ring-fg"
          style={{ "--score": 34 } as React.CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-medium tabular-nums text-white">34</span>
        <span className="text-[9px] uppercase tracking-wider text-white/45">
          site score
        </span>
      </span>
    </div>
  );
}

function BeforeAfterVisual() {
  return (
    <div className="flex items-center justify-center gap-3 px-2 py-3">
      {/* Before — their tired site */}
      <div className="flex-1 overflow-hidden rounded-md ring-1 ring-ink/10">
        <div className="flex gap-1 bg-ink/[0.04] px-2 py-1.5">
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span className="h-1 w-1 rounded-full bg-ink/15" />
          <span className="h-1 w-1 rounded-full bg-ink/10" />
        </div>
        <div className="space-y-1.5 bg-white p-2.5 opacity-50">
          <span className="block h-4 w-full rounded-sm bg-ink/15" />
          <span className="block h-1.5 w-3/4 rounded-sm bg-ink/10" />
          <span className="block h-1.5 w-1/2 rounded-sm bg-ink/10" />
        </div>
        <div className="px-2.5 pb-2 text-[8px] uppercase tracking-wider text-slate">
          Their site
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-slate" />

      {/* After — your design */}
      <div className="relative flex-1 overflow-hidden rounded-md ring-1 ring-ink/10">
        <span className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="flex gap-1 bg-ink/[0.04] px-2 py-1.5">
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span className="h-1 w-1 rounded-full bg-ink/15" />
          <span className="h-1 w-1 rounded-full bg-ink/10" />
        </div>
        <div className="space-y-1.5 bg-white p-2.5">
          <span className="bg-iridescent block h-4 w-full rounded-sm" />
          <span className="block h-1.5 w-3/4 rounded-sm bg-ink/15" />
          <span className="block h-1.5 w-1/2 rounded-sm bg-ink/10" />
        </div>
        <div className="px-2.5 pb-2 text-[8px] uppercase tracking-wider text-slate">
          Your design
        </div>
      </div>
    </div>
  );
}

const DISCOVERY_ROWS = [
  { name: "Bright Smile Dental", site: "0 / 100", hot: true },
  { name: "Cedar Family Dentistry", site: "41 / 100", hot: false },
  { name: "Downtown Ortho Studio", site: "36 / 100", hot: false },
];

export default function Features() {
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section className="bg-white px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="The platform"
        title="Finds the work. Designs the pitch."
        sub="Four systems that turn a city into a client pipeline."
      />

      <div
        ref={gridRef}
        className="reveal-group mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-16 md:grid-cols-3"
      >
        {/* Site audits — dark anchor tile */}
        <div className="rise bg-grid-dots rounded-2xl bg-carbon p-6 ring-1 ring-white/10 sm:p-7 md:col-span-2">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-[260px]">
              <h3 className="text-lg font-medium tracking-tight text-white">
                Site audits
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Every prospect's current site is graded on speed, mobile and SSL.
                The lower the score, the bigger your opening.
              </p>
            </div>
            <div className="flex items-center gap-6" aria-hidden="true">
              <ScoreGauge />
              <div className="w-36 space-y-3">
                {FACTORS.map((factor) => (
                  <div key={factor.label}>
                    <div className="flex justify-between text-[10px] text-white/55">
                      <span>{factor.label}</span>
                      <span className="tabular-nums">{factor.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="bg-iridescent h-full rounded-full"
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Outreach dock */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7"
          style={{ transitionDelay: "100ms" }}
        >
          <h3 className="text-lg font-medium tracking-tight text-ink">
            Outreach dock
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Every prospect comes with a drafted email. You review it and send from
            your own inbox — Everdeck never sends for you.
          </p>
          <div
            aria-hidden="true"
            className="mt-5 rounded-xl bg-white p-3.5 ring-1 ring-ink/10 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Logo gradient className="h-4 w-4" />
              <span className="text-[12px] font-medium text-ink">
                Draft ready to review
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate">
                Bright Smile Dental · no site
              </span>
              <span className="rounded bg-cloud px-1.5 py-0.5 text-[10px] font-medium text-slate">
                Draft
              </span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="mx-3 h-2 rounded-b-xl bg-ink/[0.04] ring-1 ring-ink/5"
          />
        </div>

        {/* Before/after mockups */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7"
          style={{ transitionDelay: "160ms" }}
        >
          <h3 className="text-lg font-medium tracking-tight text-ink">
            Before/after mockups
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            See their tired site beside the one Everdeck designed — the exact thing
            you show up with.
          </p>
          <div
            aria-hidden="true"
            className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-ink/10 shadow-sm"
          >
            <BeforeAfterVisual />
          </div>
        </div>

        {/* Real business discovery */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7 md:col-span-2"
          style={{ transitionDelay: "220ms" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium tracking-tight text-ink">
              Real business discovery
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">
              <MapPin className="h-3 w-3" />
              48 found today
            </span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
            Real local businesses pulled from maps and local search — each flagged
            by how weak, or missing, their website is.
          </p>
          <div aria-hidden="true" className="mt-5 space-y-2">
            {DISCOVERY_ROWS.map((row) => (
              <div
                key={row.name}
                className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-[12px] ${
                  row.hot
                    ? "bg-lilac/10 ring-1 ring-lilac"
                    : "bg-white ring-1 ring-ink/5"
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-ink/80">
                  {row.name}
                </span>
                <span className="shrink-0 tabular-nums text-[11px] text-slate">
                  {row.site}
                </span>
                <span
                  className={`shrink-0 text-[11px] ${
                    row.hot ? "font-medium text-ink" : "text-slate"
                  }`}
                >
                  {row.hot ? "No site" : "Audited"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
