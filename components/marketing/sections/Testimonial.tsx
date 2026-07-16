"use client";

import { useReveal } from "@/lib/useReveal";

export default function Testimonial() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="bg-cloud px-5 py-16 sm:py-24">
      <div ref={ref} className="reveal mx-auto max-w-2xl text-center">
        <div
          className="bg-iridescent mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium text-ink"
          aria-hidden="true"
        >
          MB
        </div>
        <blockquote className="mt-6 text-xl leading-snug tracking-tight text-ink sm:text-2xl lg:text-3xl">
          “Everdeck compressed a month of market research into{" "}
          <em className="font-serif">a single morning</em>. I walked into the
          pitch with the gap, the numbers, and the plan. It won.”
        </blockquote>
        <p className="mt-5 text-sm">
          <span className="font-medium text-ink">Maxwell Brohm</span>
          <span className="text-slate">
            {" "}
            · Nation-Wide App Challenge Winner and Business Owner
          </span>
        </p>
      </div>
    </section>
  );
}
