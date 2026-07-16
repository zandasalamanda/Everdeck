"use client";

import { ArrowRight, ArrowUp, Send } from "lucide-react";

import SectionHeading from "@/components/marketing/SectionHeading";
import { useReveal } from "@/lib/useReveal";

/** Step 1: the hero's two-field search — a business type and a city. */
function SearchVisual() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white ring-1 ring-ink/10 shadow-sm py-1 pl-3.5 pr-1.5">
      <span className="text-[12px] text-ink">dentists</span>
      <span className="h-4 w-px bg-ink/15" />
      <span className="text-[12px] text-ink">Austin</span>
      <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">
        <ArrowUp className="h-3 w-3" />
      </span>
    </div>
  );
}

/** Step 2: their tired site, redrawn — before and after side by side. */
function BeforeAfterVisual() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Before — a washed-out, dated site */}
      <div className="w-[74px] overflow-hidden rounded-md bg-white ring-1 ring-ink/10 shadow-sm">
        <div className="flex gap-0.5 bg-ink/[0.04] px-1.5 py-1">
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span className="h-1 w-1 rounded-full bg-ink/15" />
          <span className="h-1 w-1 rounded-full bg-ink/10" />
        </div>
        <div className="space-y-1 p-2 opacity-50">
          <span className="block h-3 w-full rounded-sm bg-ink/15" />
          <span className="block h-1 w-3/4 rounded-sm bg-ink/10" />
          <span className="block h-1 w-1/2 rounded-sm bg-ink/10" />
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-slate" />

      {/* After — your design, iridescent hero */}
      <div className="relative w-[74px] overflow-hidden rounded-md bg-white ring-1 ring-ink/10 shadow-sm">
        <span className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="flex gap-0.5 bg-ink/[0.04] px-1.5 py-1">
          <span className="h-1 w-1 rounded-full bg-ink/20" />
          <span className="h-1 w-1 rounded-full bg-ink/15" />
          <span className="h-1 w-1 rounded-full bg-ink/10" />
        </div>
        <div className="space-y-1 p-2">
          <span className="bg-iridescent block h-3 w-full rounded-sm" />
          <span className="block h-1 w-3/4 rounded-sm bg-ink/15" />
          <span className="block h-1 w-1/2 rounded-sm bg-ink/10" />
        </div>
      </div>
    </div>
  );
}

/** Step 3: the outreach dock — a drafted email waiting for your send. */
function InboxVisual() {
  return (
    <div className="w-full max-w-[192px] overflow-hidden rounded-lg bg-white ring-1 ring-ink/10 shadow-sm">
      <div className="flex items-center justify-between border-b border-ink/5 px-2.5 py-1.5">
        <span className="text-[10px] font-medium text-ink">Outreach dock</span>
        <span className="rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[8px] text-slate">
          Draft
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[10px] font-medium text-ink">Bright Smile Dental</div>
        <div className="mt-1.5 space-y-1">
          <span className="block h-1 w-full rounded-sm bg-ink/10" />
          <span className="block h-1 w-2/3 rounded-sm bg-ink/10" />
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1.5">
          <span className="text-[8px] text-slate">Your inbox</span>
          <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[9px] font-medium text-white">
            <Send className="h-2.5 w-2.5" />
            Send
          </span>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    step: "01",
    title: "Name a type and a city",
    body: "Tell Everdeck who you want to reach and where — “dentists in Austin.” That's the whole setup.",
    visual: SearchVisual,
  },
  {
    step: "02",
    title: "It finds weak sites and redesigns them",
    body: "Everdeck scans local businesses, flags the slow, dated and missing sites, then designs a better one for each.",
    visual: BeforeAfterVisual,
  },
  {
    step: "03",
    title: "Review the draft and send",
    body: "Open the dock, check the mockup and the outreach email, and send it from your own inbox.",
    visual: InboxVisual,
  },
];

export default function HowItWorks() {
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section id="how-it-works" className="scroll-mt-10 bg-cloud px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps to a client-ready pitch"
        sub="No lists to buy. No cold data. A designed website on day one."
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
