"use client";

import { useReveal } from "@/lib/useReveal";

const BACKGROUND_URL =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260611_133301_d5f2a94a-b22e-4e4a-a6b6-eacdddf1f5b0.png&w=1280&q=85";

const GRASS_URL =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781191264/grass_eam204.png";

export default function FinalCta() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="bg-white px-5 pb-20 pt-4 sm:pb-28">
      <div
        ref={ref}
        className="reveal relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-cover bg-center shadow-lift ring-1 ring-ink/10"
        style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
      >
        <div className="relative z-20 flex flex-col items-center px-6 pb-36 pt-16 text-center sm:pb-44 sm:pt-24">
          <h2 className="text-3xl font-normal leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Your market is out there.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/70 sm:text-base">
            Name it, and Everdeck deals the first hand tomorrow morning.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/sign-up"
              className="bg-iridescent rounded-full px-6 py-2.5 text-sm font-medium text-ink shadow-card hover:shadow-glow"
            >
              Start free
            </a>
            <a
              href="#how-it-works"
              className="rounded-full px-6 py-2.5 text-sm font-medium text-ink/80 ring-1 ring-ink/20 transition-colors hover:bg-white/50"
            >
              How it works
            </a>
          </div>
          <p className="mt-4 text-xs text-ink/70">
            Free while scouting — no credit card required.
          </p>
        </div>

        <img
          src={GRASS_URL}
          alt=""
          draggable={false}
          className="pointer-events-none absolute bottom-0 left-0 z-10 w-full select-none"
        />
      </div>
    </section>
  );
}
