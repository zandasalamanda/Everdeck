"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { FUNCTIONS_URL } from "@/lib/publicConfig";
import { useSupabase } from "@/lib/supabase/browser";
import type { RunMode } from "@/lib/types";

/** How many times we poke the worker to drain a fresh hunt, and how far apart. */
const DRAIN_TICKS = 8;
const TICK_INTERVAL_MS = 2500;

/** Remembers the last city the user hunted, so they don't retype it. */
const LAST_LOCATION_KEY = "everdeck:lastLocation";

/** High no-website-rate niches with real project budgets — one tap fills the type. */
const NICHE_PRESETS = [
  "Roofers",
  "Plumbers",
  "Landscapers",
  "HVAC",
  "Electricians",
  "Auto repair",
  "House cleaners",
  "Movers",
  "Fencing",
  "Painters",
  "Dentists",
  "Med spas",
  "Law firms",
] as const;

/** Map a raw RPC / gate error onto a calm, human sentence. */
function toMessage(raw: string, plan: string): string {
  if (raw.includes("plan_gate:daily_runs")) {
    return `You've used today's hunts on the ${plan} plan — upgrade in Plan or come back tomorrow.`;
  }
  if (raw.includes("plan_gate:engine")) {
    return "Autonomous hunting is a paid feature — upgrade in Plan to switch it on.";
  }
  if (raw.includes("inputs_required")) {
    return "Enter a business type and a location.";
  }
  return "Couldn't start that hunt. Give it another try in a moment.";
}

export default function StartHuntForm({
  engineAllowed,
  plan,
}: {
  engineAllowed: boolean;
  plan: string;
}) {
  const supabase = useSupabase();
  const { getToken } = useAuth();
  const router = useRouter();

  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState<RunMode>("directed");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // StrictMode-safe: the drain loop is async and outlives a click, so we never
  // touch state once this instance has unmounted.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Prefill the location with the last city hunted (placeholder stays "Austin, TX").
  useEffect(() => {
    try {
      const last = window.localStorage.getItem(LAST_LOCATION_KEY);
      if (last) setLocation(last);
    } catch {
      // localStorage can be unavailable (private mode) — just skip the prefill.
    }
  }, []);

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setError(null);

    const bt = businessType.trim();
    const loc = location.trim();
    if (!bt || !loc) {
      // Mirror the RPC's own inputs_required gate before we spend a run.
      setError(toMessage("inputs_required", plan));
      return;
    }

    // Remember this city for next time.
    try {
      window.localStorage.setItem(LAST_LOCATION_KEY, loc);
    } catch {
      // Non-fatal — the hunt proceeds even if we can't persist the location.
    }

    setBusy(true);
    setStatus("Starting hunt…");

    const { error: rpcError } = await supabase.rpc("start_hunt", {
      p_business_type: bt,
      p_location: loc,
      p_mode: mode,
    });

    if (rpcError) {
      if (!mounted.current) return;
      setError(toMessage(rpcError.message, plan));
      setStatus(null);
      setBusy(false);
      return;
    }

    // Drain the pipeline: nudge the worker a handful of times so businesses get
    // found, audited, and mocked up before the user lands on their deck.
    for (let step = 1; step <= DRAIN_TICKS; step++) {
      if (!mounted.current) return;
      setStatus(
        `Finding businesses, auditing sites, building mockups… (step ${step}/${DRAIN_TICKS})`,
      );
      try {
        const token = await getToken();
        await fetch(`${FUNCTIONS_URL}/worker?task=tick`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch {
        // A dropped tick shouldn't strand the user mid-drain — keep going.
      }
      if (step < DRAIN_TICKS) await sleep(TICK_INTERVAL_MS);
    }

    if (!mounted.current) return;
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
      <form onSubmit={handleSubmit} noValidate>
        {/* Niche presets — high no-website niches, one tap fills the type */}
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
            Popular niches
          </p>
          <div className="flex flex-wrap gap-1.5">
            {NICHE_PRESETS.map((niche) => {
              const active = businessType.trim().toLowerCase() === niche.toLowerCase();
              return (
                <button
                  key={niche}
                  type="button"
                  disabled={busy}
                  onClick={() => setBusinessType(niche)}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium ring-1 transition disabled:opacity-60 ${
                    active
                      ? "bg-white/10 text-white ring-white/25"
                      : "bg-white/[0.04] text-white/55 ring-white/10 hover:text-white/85"
                  }`}
                >
                  {niche}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hunt-business-type"
              className="mb-1.5 block text-[12px] font-medium text-white/70"
            >
              Business type
            </label>
            <input
              id="hunt-business-type"
              type="text"
              autoComplete="off"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              disabled={busy}
              placeholder="e.g. dentists, roofers, law firms"
              className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30 disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="hunt-location"
              className="mb-1.5 block text-[12px] font-medium text-white/70"
            >
              Location
            </label>
            <input
              id="hunt-location"
              type="text"
              autoComplete="off"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={busy}
              placeholder="e.g. Austin, TX"
              className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span id="hunt-mode-label" className="text-[12px] font-medium text-white/70">
              Mode
            </span>
            <div
              role="radiogroup"
              aria-labelledby="hunt-mode-label"
              className="inline-flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-white/10"
            >
              <button
                type="button"
                role="radio"
                aria-checked={mode === "directed"}
                disabled={busy}
                onClick={() => setMode("directed")}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${
                  mode === "directed"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                Directed
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "autonomous"}
                aria-disabled={!engineAllowed || undefined}
                disabled={busy || !engineAllowed}
                onClick={() => engineAllowed && setMode("autonomous")}
                title={
                  engineAllowed ? undefined : "Autonomous hunting is a Pro feature"
                }
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition ${
                  mode === "autonomous"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80"
                } disabled:cursor-not-allowed disabled:hover:text-white/50`}
              >
                Autonomous
                {!engineAllowed && (
                  <span className="rounded bg-white/10 px-1 py-px text-[9px] uppercase tracking-wider text-white/45">
                    Pro
                  </span>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="bg-iridescent rounded-full px-5 py-2.5 text-sm font-medium text-ink transition disabled:opacity-60"
          >
            {busy ? "Hunting…" : "Start hunt"}
          </button>
        </div>
      </form>

      {/* Live progress while the pipeline drains. */}
      <p aria-live="polite" role="status" className="mt-3 min-h-[1rem] text-[13px] text-sky">
        {busy && status ? status : ""}
      </p>

      {error && (
        <p role="alert" className="mt-1 text-[13px] text-blush">
          {error}
        </p>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-white/45">
        A hunt finds every matching business, screenshots their current site, and
        scores the opportunity — no AI yet. You review the deck and pursue the ones
        worth building, one lead at a time.
      </p>
    </div>
  );
}
