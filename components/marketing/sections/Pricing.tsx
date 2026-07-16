"use client";

import { Check } from "lucide-react";

import SectionHeading from "@/components/marketing/SectionHeading";
import { useReveal } from "@/lib/useReveal";

const PLANS = [
  {
    name: "Scout",
    price: "$0",
    period: "forever",
    blurb: "For your first hunt.",
    features: [
      "1 hunt per day",
      "10 prospects per hunt",
      "Site audits & scores",
      "Mockup preview",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Founder",
    price: "$19",
    period: "per month",
    blurb: "For a full client pipeline.",
    features: [
      "Unlimited hunts",
      "Full prospect feed",
      "Before/after mockup on every prospect",
      "Outreach drafts + the dock",
      "Export prospects to CSV",
    ],
    cta: "Go Founder",
    featured: true,
  },
];

export default function Pricing() {
  const gridRef = useReveal<HTMLDivElement>();

  return (
    <section id="pricing" className="scroll-mt-10 bg-white px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Pricing"
        title="Free to try. Cheap to grow."
        sub="No card to start. One hunt a day, free. Cancel anytime — your prospects stay until the period ends."
      />

      <div
        ref={gridRef}
        className="reveal-group mx-auto mt-12 grid max-w-3xl gap-4 sm:mt-16 md:grid-cols-2"
      >
        {PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`rise relative rounded-2xl p-7 sm:p-8 ${
              plan.featured
                ? "bg-grid-dots bg-carbon text-white shadow-lift ring-1 ring-white/15"
                : "bg-cloud text-ink ring-1 ring-ink/10"
            }`}
            style={{ transitionDelay: `${i * 130}ms` }}
          >
            {plan.featured && (
              <span className="bg-iridescent absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-ink">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] opacity-70">
              {plan.name}
            </h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-medium tracking-tight tabular-nums">
                {plan.price}
              </span>
              <span
                className={`text-sm ${plan.featured ? "text-white/50" : "text-slate"}`}
              >
                {plan.period}
              </span>
            </div>
            <p
              className={`mt-1 text-sm ${plan.featured ? "text-white/60" : "text-slate"}`}
            >
              {plan.blurb}
            </p>

            <ul className="mt-6 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      plan.featured ? "text-mint" : "text-ink/50"
                    }`}
                  />
                  <span
                    className={plan.featured ? "text-white/80" : "text-ink/80"}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={`mailto:hello@everdeck.ai?subject=${encodeURIComponent(
                `Everdeck early access — ${plan.name}`,
              )}`}
              className={`mt-8 block rounded-full py-2.5 text-center text-sm font-medium ${
                plan.featured
                  ? "bg-iridescent text-ink hover:shadow-glow"
                  : "bg-ink text-white hover:bg-graphite transition-colors"
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
