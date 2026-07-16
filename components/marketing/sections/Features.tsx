"use client";

import { useId } from "react";
import { Bell } from "lucide-react";

import Logo from "@/components/marketing/Logo";
import SectionHeading from "@/components/marketing/SectionHeading";
import { useReveal } from "@/lib/useReveal";

const FACTORS = [
  { label: "Demand", value: 84 },
  { label: "Competition", value: 26 },
  { label: "Effort", value: 38 },
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
          style={{ "--score": 86 } as React.CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-medium tabular-nums text-white">86</span>
        <span className="text-[9px] uppercase tracking-wider text-white/45">
          score
        </span>
      </span>
    </div>
  );
}

function NicheMapVisual() {
  return (
    <svg viewBox="0 0 240 96" className="h-24 w-full" aria-hidden="true">
      <path
        d="M32 48 C 72 48, 72 20, 112 20 M32 48 C 72 48, 72 48, 112 48 M32 48 C 72 48, 72 76, 112 76 M112 20 C 152 20, 152 12, 192 12 M112 20 C 152 20, 152 32, 192 32"
        fill="none"
        stroke="rgba(14,14,16,0.15)"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="48" r="5" fill="#0E0E10" />
      <circle cx="112" cy="20" r="4" fill="white" stroke="rgba(14,14,16,0.25)" strokeWidth="1.5" />
      <circle cx="112" cy="48" r="4" fill="white" stroke="rgba(14,14,16,0.25)" strokeWidth="1.5" />
      <circle cx="112" cy="76" r="4" fill="white" stroke="rgba(14,14,16,0.25)" strokeWidth="1.5" />
      <circle cx="192" cy="12" r="4" fill="white" stroke="rgba(14,14,16,0.25)" strokeWidth="1.5" />
      <circle cx="192" cy="32" r="6" fill="#C9BBFF" />
      <text x="204" y="36" fontSize="9" fill="#6A6A70">
        Elder care
      </text>
      <text x="122" y="51" fontSize="9" fill="#6A6A70">
        Mobility
      </text>
      <text x="122" y="80" fontSize="9" fill="#6A6A70">
        Home safety
      </text>
    </svg>
  );
}

const GAP_ROWS = [
  { pain: "Best medication reminder for dementia patients", volume: "41k/mo", hot: false },
  { pain: "One-button video calls for grandparents", volume: "18k/mo", hot: true },
  { pain: "GPS tracker for seniors who wander", volume: "33k/mo", hot: false },
];

export default function Features() {
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section className="bg-white px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="The platform"
        title="Built like an analyst. Runs like software."
        sub="Four systems working your market around the clock."
      />

      <div
        ref={gridRef}
        className="reveal-group mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-16 md:grid-cols-3"
      >
        {/* Idea scoring — dark anchor tile */}
        <div className="rise bg-grid-dots rounded-2xl bg-carbon p-6 ring-1 ring-white/10 sm:p-7 md:col-span-2">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-[260px]">
              <h3 className="text-lg font-medium tracking-tight text-white">
                Idea scoring
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Every idea gets a 0 to 100 score built from demand, competition,
                and effort. Ranking beats guessing.
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

        {/* Daily digest */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7"
          style={{ transitionDelay: "100ms" }}
        >
          <h3 className="text-lg font-medium tracking-tight text-ink">
            Daily digest
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            A fresh hand of scored ideas dealt every morning.
          </p>
          <div
            aria-hidden="true"
            className="mt-5 rounded-xl bg-white p-3.5 ring-1 ring-ink/10 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Logo gradient className="h-4 w-4" />
              <span className="text-[12px] font-medium text-ink">
                Your morning hand is ready
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-slate">
                3 new ideas · senior health
              </span>
              <span className="rounded bg-cloud px-1.5 py-0.5 text-[10px] tabular-nums text-slate">
                6:04 AM
              </span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="mx-3 h-2 rounded-b-xl bg-ink/[0.04] ring-1 ring-ink/5"
          />
        </div>

        {/* Niche maps */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7"
          style={{ transitionDelay: "160ms" }}
        >
          <h3 className="text-lg font-medium tracking-tight text-ink">
            Niche maps
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Markets broken into branches you can walk, down to the corner worth
            owning.
          </p>
          <div className="mt-4 rounded-xl bg-white ring-1 ring-ink/10 shadow-sm">
            <NicheMapVisual />
          </div>
        </div>

        {/* Gap detection */}
        <div
          className="rise rounded-2xl bg-cloud p-6 ring-1 ring-ink/5 sm:p-7 md:col-span-2"
          style={{ transitionDelay: "220ms" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium tracking-tight text-ink">
              Gap detection
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white">
              <Bell className="h-3 w-3" />
              412 open gaps
            </span>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
            Unanswered questions pulled from real searches, forums and reviews,
            matched to who's not serving them.
          </p>
          <div aria-hidden="true" className="mt-5 space-y-2">
            {GAP_ROWS.map((row) => (
              <div
                key={row.pain}
                className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-[12px] ${
                  row.hot
                    ? "bg-lilac/10 ring-1 ring-lilac"
                    : "bg-white ring-1 ring-ink/5"
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-ink/80">
                  {row.pain}
                </span>
                <span className="shrink-0 tabular-nums text-[11px] text-slate">
                  {row.volume}
                </span>
                <span
                  className={`shrink-0 text-[11px] ${
                    row.hot ? "font-medium text-ink" : "text-slate"
                  }`}
                >
                  {row.hot ? "New gap" : "Scored"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
