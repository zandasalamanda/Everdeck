import { useId, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";

import Logo from "../Logo";
import SectionHeading from "../SectionHeading";
import { useReveal } from "../../lib/useReveal";

const CARDS = [
  {
    score: 86,
    title: "Fall-alert pendant, one-time purchase",
    body: "Seniors resent monthly fees. 68k searches a month for alert devices without subscriptions — nobody owns it.",
    demand: "High",
    competition: "Low",
    effort: "Medium",
    rotate: "-6deg",
    y: "12px",
  },
  {
    score: 81,
    title: "Med reminders with family escalation",
    body: "Caregivers want alerts that reach the family when a dose is missed. Existing apps stop at the patient's phone.",
    demand: "High",
    competition: "Low",
    effort: "Low",
    rotate: "0deg",
    y: "0px",
  },
  {
    score: 78,
    title: "Home safety audit marketplace",
    body: "Occupational therapists already do room-by-room audits. No marketplace connects them to worried families.",
    demand: "Medium",
    competition: "Low",
    effort: "Medium",
    rotate: "6deg",
    y: "12px",
  },
];

const CHIP_COLOR: Record<string, string> = {
  High: "text-mint",
  Medium: "text-lilac",
  Low: "text-white/70",
};

function ScoreRing({ score }: { score: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden="true">
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
          strokeWidth="3.5"
          className="stroke-white/10"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          pathLength="100"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke={`url(#${id})`}
          className="ring-fg"
          style={{ "--score": score } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-medium tabular-nums text-white">
        {score}
      </span>
    </div>
  );
}

export default function TodaysHand() {
  const groupRef = useReveal<HTMLDivElement>();
  const footnoteRef = useReveal<HTMLParagraphElement>();

  return (
    <section
      id="deck"
      className="scroll-mt-10 bg-grid-dots overflow-hidden bg-carbon px-5 py-20 sm:py-28"
    >
      <SectionHeading
        dark
        eyebrow="The deck"
        title="A fresh hand, every morning"
        sub="Dealt after every overnight scan — the day's highest-scoring ideas, reasoned and ready. This is today's hand for “senior health”."
      />

      <div
        ref={groupRef}
        className="reveal-group mx-auto mt-14 flex max-w-5xl flex-col items-center gap-5 sm:mt-20 md:flex-row md:items-stretch md:justify-center md:gap-0"
      >
        {CARDS.map((card, i) => (
          <article
            key={card.title}
            className={`deal relative w-full max-w-sm md:w-[320px] ${
              i === 1 ? "z-[2]" : "z-[1]"
            } hover:z-[3]`}
            style={
              {
                "--deal-transform": `rotate(${card.rotate}) translateY(${card.y})`,
                transitionDelay: `${i * 150}ms`,
              } as CSSProperties
            }
          >
            <div className="h-full rounded-2xl bg-carbon-panel p-6 shadow-card ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-glow hover:ring-white/25">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-1.5 text-white/55">
                  <Logo className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-[0.18em]">
                    Idea No.{i + 1}
                  </span>
                </div>
                <ScoreRing score={card.score} />
              </div>

              <h3 className="mt-2 text-lg font-medium leading-snug tracking-tight text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {card.body}
              </p>

              <dl className="mt-5 flex gap-2">
                {(
                  [
                    ["Demand", card.demand],
                    ["Comp.", card.competition],
                    ["Effort", card.effort],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex-1 rounded-lg bg-white/[0.04] px-2 py-1.5 text-center ring-1 ring-white/5"
                  >
                    <dt className="text-[9px] uppercase tracking-wider text-white/55">
                      {label}
                    </dt>
                    <dd
                      className={`mt-0.5 text-[11px] font-medium ${CHIP_COLOR[value]}`}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <a
                href="#pricing"
                className="mt-5 flex items-center justify-between rounded-full bg-white/[0.06] px-4 py-2 text-[12px] font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white hover:text-ink"
              >
                Open in Everdeck
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <p
        ref={footnoteRef}
        className="reveal mx-auto mt-12 max-w-md text-center text-[13px] text-white/55"
      >
        Cards you skip go back in the deck. Cards you keep become a build plan —
        niche map, competitors, first steps.
      </p>
    </section>
  );
}
