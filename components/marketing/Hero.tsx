"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowUp, Sparkles } from "lucide-react";

import Navbar from "@/components/marketing/Navbar";
import DashboardMockup from "@/components/marketing/DashboardMockup";

const BACKGROUND_URL =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260611_133301_d5f2a94a-b22e-4e4a-a6b6-eacdddf1f5b0.png&w=1280&q=85";

const GRASS_URL =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781191264/grass_eam204.png";

const DASHBOARD_DESIGN_WIDTH = 896;

const EXAMPLE_MARKETS = [
  "senior health",
  "pet longevity",
  "home coffee",
  "sleep tech",
  "youth sports gear",
];

/** Bright specks drifting over the hero photo. */
const SPECKS = [
  { left: "12%", top: "58%", duration: "11s", delay: "0s", size: 4 },
  { left: "22%", top: "70%", duration: "14s", delay: "2.5s", size: 3 },
  { left: "38%", top: "64%", duration: "12s", delay: "5s", size: 3 },
  { left: "55%", top: "72%", duration: "15s", delay: "1s", size: 4 },
  { left: "68%", top: "60%", duration: "12.5s", delay: "6.5s", size: 3 },
  { left: "81%", top: "68%", duration: "13.5s", delay: "3.5s", size: 4 },
  { left: "90%", top: "56%", duration: "11.5s", delay: "8s", size: 3 },
];

/**
 * Renders the dashboard mockup at a fixed design width and scales it down
 * with a CSS transform to fit the container, so the mockup keeps its exact
 * desktop proportions at every viewport size.
 */
function ScaledDashboard({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const nextScale = outer.offsetWidth / DASHBOARD_DESIGN_WIDTH;
      setScale(nextScale);
      setHeight(inner.offsetHeight * nextScale);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} style={{ height }}>
      <div
        ref={innerRef}
        style={{
          width: DASHBOARD_DESIGN_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Cycles example markets into the search placeholder, typewriter style. */
function useTypedExample() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let wordIndex = 0;
    let chars = 0;
    let deleting = false;
    let timer: number;

    const tick = () => {
      const word = EXAMPLE_MARKETS[wordIndex];
      if (!deleting) {
        chars += 1;
        setTyped(word.slice(0, chars));
        if (chars === word.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1800);
          return;
        }
        timer = window.setTimeout(tick, 85);
      } else {
        chars -= 1;
        setTyped(word.slice(0, chars));
        if (chars === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % EXAMPLE_MARKETS.length;
          timer = window.setTimeout(tick, 500);
          return;
        }
        timer = window.setTimeout(tick, 45);
      }
    };

    timer = window.setTimeout(tick, 1400);
    return () => clearTimeout(timer);
  }, []);

  return typed;
}

export default function Hero() {
  const typed = useTypedExample();
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // The mockup rises gently toward the cursor: mouse position over the hero
  // sets a target lift, and the CSS transition glides to it.
  useEffect(() => {
    const section = sectionRef.current;
    const target = parallaxRef.current;
    if (!section || !target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (event: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const y = (event.clientY - rect.top) / rect.height;
      const lift = -16 * Math.min(Math.max(y, 0), 1);
      target.style.transform = `translateY(${lift}px)`;
    };
    const onLeave = () => {
      target.style.transform = "translateY(0px)";
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-hidden bg-cover bg-center flex flex-col"
      style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
    >
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
        {SPECKS.map((speck, i) => (
          <span
            key={i}
            className="animate-drift absolute rounded-full bg-white/80 blur-[0.5px]"
            style={{
              left: speck.left,
              top: speck.top,
              width: speck.size,
              height: speck.size,
              animationDuration: speck.duration,
              animationDelay: speck.delay,
            }}
          />
        ))}
      </div>

      <Navbar />

      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16 shrink-0" />

      <div className="relative z-20 flex flex-col items-center text-center px-5">
        <a
          href="#deck"
          className="animate-fade-up mb-5 flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md ring-1 ring-ink/10 pl-1.5 pr-3.5 py-1.5 transition-colors hover:bg-white/80"
        >
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-medium text-white">
            New
          </span>
          <span className="text-[13px] text-ink/80">
            Every market, scanned daily
          </span>
        </a>

        <h1 className="text-ink font-normal leading-[1.05] tracking-tight text-[40px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[80px]">
          <span className="block animate-fade-up [animation-delay:100ms]">
            Find your market.
          </span>
          <span className="block animate-fade-up font-serif italic [animation-delay:200ms]">
            Effortlessly.
          </span>
        </h1>

        <form
          className="animate-fade-up [animation-delay:320ms] mt-5 sm:mt-6 w-full max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            const market = new FormData(event.currentTarget)
              .get("market")
              ?.toString()
              .trim();
            // Start the product with their market in hand — not a sales page.
            window.location.href = market
              ? `/sign-up?market=${encodeURIComponent(market)}`
              : "/sign-up";
          }}
        >
          <div className="flex items-center gap-3 rounded-full bg-white/60 backdrop-blur-md ring-1 ring-ink/10 pl-5 pr-1.5 py-1.5 transition-shadow focus-within:shadow-lift">
            <input
              type="text"
              name="market"
              placeholder={
                typed ? `Try “${typed}”` : "What market should we explore?"
              }
              aria-label="What market should we explore?"
              className="flex-1 bg-transparent text-sm sm:text-base text-ink placeholder-slate outline-none py-2"
            />
            <button
              type="submit"
              aria-label="Get started"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-ink text-white hover:scale-105 active:scale-95 transition-transform shrink-0"
            >
              <ArrowUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </form>

        <p className="animate-fade-up [animation-delay:440ms] mt-4 sm:mt-5 text-ink/70 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">
          Everdeck studies the market and hands you scored business ideas every day,
          <br />
          mapped out and ready to{" "}
          <Sparkles className="inline w-4 h-4 -mt-1 text-ink/60" /> build
        </p>

        <div className="animate-fade-up [animation-delay:560ms] mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/sign-up"
            className="bg-iridescent text-ink text-sm font-medium px-6 py-2.5 rounded-full shadow-card hover:shadow-glow"
          >
            Start free
          </a>
          <a
            href="#deck"
            className="text-ink/80 text-sm font-medium px-6 py-2.5 rounded-full ring-1 ring-ink/20 hover:bg-white/50 transition-colors"
          >
            See today's deck
          </a>
        </div>
      </div>

      <div className="flex-1 min-h-10 sm:min-h-12 lg:min-h-16 shrink-0" />

      <div className="animate-hero-rise [animation-delay:700ms] relative z-0 w-[92%] sm:w-[84%] lg:w-[72%] max-w-4xl mx-auto shrink-0 -mb-10 sm:-mb-20 lg:-mb-32">
        <div
          ref={parallaxRef}
          className="will-change-transform transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        >
          <ScaledDashboard>
            <DashboardMockup />
          </ScaledDashboard>
        </div>
      </div>

      <img
        src={GRASS_URL}
        alt=""
        draggable={false}
        className="pointer-events-none absolute bottom-0 left-0 z-10 w-full select-none"
      />
    </section>
  );
}
