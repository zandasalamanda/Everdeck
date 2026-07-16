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
          “I stopped cold-pitching and started showing up with the{" "}
          <em className="font-serif">site already built</em>. Owners can't say no
          to something they can already see. I booked three clients my first week.”
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
