import { ChevronDown } from "lucide-react";

import SectionHeading from "../SectionHeading";
import { useReveal } from "../../lib/useReveal";

const FAQS = [
  {
    q: "Where does the data come from?",
    a: "Search volume, marketplaces, forums and review sites — pulled fresh on every scan. Nothing is hand-curated or stale; the deck reflects what people asked for this week.",
  },
  {
    q: "How are ideas scored?",
    a: "Each idea gets a 0–100 score blending three inputs: demand (how many people want it), competition (who already serves it), and effort (how hard it is to launch). Every card shows all three, so you can overrule the blend.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Build plans include no-code paths where they exist, and effort scores account for them. Plenty of deck cards are service or marketplace ideas with no software at all.",
  },
  {
    q: "Can I export my deck?",
    a: "On the Founder plan — CSV and Notion, including scores, gap sources and the build plan for each card.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, from settings in one click. Your deck stays available until the end of the billing period.",
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
