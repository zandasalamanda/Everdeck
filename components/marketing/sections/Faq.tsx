"use client";

import { ChevronDown } from "lucide-react";

import SectionHeading from "@/components/marketing/SectionHeading";
import { useReveal } from "@/lib/useReveal";

const FAQS = [
  {
    q: "Does Everdeck send emails for me?",
    a: "No. Everdeck drafts the outreach, but you review every email and send it yourself from your own inbox. Nothing goes out automatically — that keeps you in control and keeps your domain's reputation safe.",
  },
  {
    q: "Is cold outreach allowed?",
    a: "It can be, if you do it right. Follow CAN-SPAM and your local rules: only contact businesses, be honest about who you are, and include a clear way to opt out. Everdeck helps you personalize a genuine offer — it is not a tool for blasting spam.",
  },
  {
    q: "Where do the businesses come from?",
    a: "Public sources — maps listings and local search for the type and city you name. Everdeck checks each one's website for speed, mobile and SSL, then flags the weakest as your best prospects.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No — but Everdeck is built for people who sell websites. It hands you a mockup and a drafted email; you decide how you build and deliver the final site.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from settings in one click. Your prospects and mockups stay available until the end of the billing period.",
  },
];

export default function Faq() {
  const listRef = useReveal<HTMLDivElement>();

  return (
    <section id="faq" className="scroll-mt-10 bg-cloud px-5 py-20 sm:py-28">
      <SectionHeading
        eyebrow="FAQ"
        title="Fair questions"
      />

      <div
        ref={listRef}
        className="reveal mx-auto mt-10 max-w-2xl divide-y divide-ink/10 rounded-2xl bg-white px-6 shadow-card ring-1 ring-ink/5 sm:mt-14"
      >
        {FAQS.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-slate transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="mt-3 pr-8 text-sm leading-relaxed text-slate">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
