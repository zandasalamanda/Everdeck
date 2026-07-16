import { ArrowUp } from "lucide-react";

import SectionHeading from "../SectionHeading";
import { useReveal } from "../../lib/useReveal";

/** Step 1: a miniature of the hero search pill. */
function TypeVisual() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white ring-1 ring-ink/10 shadow-sm pl-3.5 pr-1.5 py-1.5">
      <span className="text-[12px] text-ink">senior health</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
        <ArrowUp className="h-3 w-3" />
      </span>
    </div>
  );
}

/** Step 2: a radar sweeping the market for signals. */
function ScanVisual() {
  return (
    <div className="relative h-24 w-24">
      <span className="absolute inset-0 rounded-full ring-1 ring-ink/10" />
      <span className="absolute inset-3 rounded-full ring-1 ring-ink/10" />
      <span className="absolute inset-6 rounded-full ring-1 ring-ink/10" />
      <span className="animate-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(14,14,16,0.1),transparent_75deg)]" />
      <span className="absolute left-[68%] top-[26%] h-1.5 w-1.5 rounded-full bg-lilac" />
      <span className="absolute left-[28%] top-[52%] h-1.5 w-1.5 rounded-full bg-sky" />
      <span className="absolute left-[58%] top-[70%] h-1.5 w-1.5 rounded-full bg-mint" />
      <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
    </div>
  );
}

/** Step 3: a small fanned hand of scored cards. */
function DeckVisual() {
  return (
    <div className="relative h-24 w-32">
      {[
        { rotate: "-rotate-[10deg]", offset: "left-0 top-3", score: null },
        { rotate: "rotate-[10deg]", offset: "right-0 top-3", score: null },
        { rotate: "rotate-0", offset: "left-1/2 -translate-x-1/2 top-0", score: "86" },
      ].map((card, i) => (
        <div
          key={i}
          className={`absolute ${card.offset} ${card.rotate} h-[84px] w-16 rounded-lg bg-white ring-1 ring-ink/10 shadow-sm p-2`}
        >
          {card.score ? (
            <>
              <span className="bg-iridescent inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium text-ink">
                {card.score}
              </span>
              <span className="mt-2 block h-1 w-10 rounded bg-ink/15" />
              <span className="mt-1 block h-1 w-7 rounded bg-ink/10" />
            </>
          ) : (
            <>
              <span className="block h-1 w-8 rounded bg-ink/10" />
              <span className="mt-1.5 block h-1 w-6 rounded bg-ink/[0.07]" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  {
    step: "01",
    title: "Tell Everdeck a market",
    body: "Type any space you're curious about: senior health, home coffee, sleep tech. That's the whole setup.",
    visual: TypeVisual,
  },
  {
    step: "02",
    title: "It scans the market daily",
    body: "Search demand, competitors, forums, reviews and pricing gaps, checked fresh every morning.",
    visual: ScanVisual,
  },
  {
    step: "03",
    title: "You get a scored deck",
    body: "Ideas ranked by demand, competition, and effort. Pick a card and start building.",
    visual: DeckVisual,
  },
];

export default function HowItWorks() {
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section id="how-it-works" className="scroll-mt-10 bg-cloud px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps from market to move"
        sub="No setup. No spreadsheets. A scored plan on day one."
      />

      <div
        ref={gridRef}
        className="reveal-group mx-auto mt-12 grid max-w-5xl gap-4 sm:mt-16 md:grid-cols-3"
      >
        {STEPS.map(({ step, title, body, visual: Visual }, i) => (
          <div
            key={step}
            className="rise rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-7"
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <div
              aria-hidden="true"
              className="flex h-32 items-center justify-center rounded-xl bg-cloud/70 ring-1 ring-ink/5"
            >
              <Visual />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight text-ink">
                {title}
              </h3>
              <span className="text-[11px] font-medium tracking-[0.2em] text-slate">
                {step}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
