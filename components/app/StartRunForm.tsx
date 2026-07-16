"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Lock, Play } from "lucide-react";

import { useSupabase } from "@/lib/supabase/browser";
import { FUNCTIONS_URL } from "@/lib/publicConfig";
import type { RunMode } from "@/lib/types";

/** After the initial tick, repeat this many times, spaced this far apart.
 *  Each tick drains one batch of stage jobs on the worker. */
const TICK_REPEATS = 6;
const TICK_INTERVAL_MS = 2500;

const MODE_HELP: Record<RunMode, string> = {
  directed: "Point the engine at one market you name.",
  autonomous: "The engine scans and picks the market itself.",
};

function friendlyError(message: string): string {
  if (message.includes("plan_gate:daily_runs")) {
    return "Daily run limit reached for your plan — upgrade in Billing or come back tomorrow.";
  }
  if (message.includes("plan_gate:engine")) {
    return "Autonomous runs are a Pro feature — upgrade in Billing to unlock the engine.";
  }
  return message;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface StartRunFormProps {
  accountId: string;
  engineAllowed: boolean;
}

export default function StartRunForm({ accountId, engineAllowed }: StartRunFormProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { getToken } = useAuth();
  const [mode, setMode] = useState<RunMode>("directed");
  const [market, setMarket] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stops the drain loop from touching state after unmount.
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const marketName = market.trim();
    if (mode === "directed" && !marketName) {
      setError("Name a market to run against.");
      return;
    }

    setBusy(true);
    setError(null);
    setProgress("Queueing the run…");

    try {
      const { error: rpcError } = await supabase.rpc("start_run", {
        p_account_id: accountId,
        p_mode: mode,
        p_market_name: mode === "directed" ? marketName : null,
      });
      if (rpcError) {
        setError(friendlyError(rpcError.message));
        setProgress(null);
        return;
      }

      // Show the queued run right away while the engine drains.
      router.refresh();

      const token = await getToken();

      const tick = async () => {
        try {
          await fetch(`${FUNCTIONS_URL}/worker?task=tick`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // A dropped tick isn't fatal — the next one drains the batch.
        }
      };

      setProgress("Running the engine — stage jobs draining…");
      await tick();
      for (let i = 0; i < TICK_REPEATS; i += 1) {
        if (!activeRef.current) return;
        await sleep(TICK_INTERVAL_MS);
        if (!activeRef.current) return;
        await tick();
        setProgress(
          `Running the engine — stage jobs draining… (tick ${i + 2}/${TICK_REPEATS + 1})`,
        );
      }

      if (!activeRef.current) return;
      setProgress(null);
      setMarket("");
      router.refresh();
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }

  const autonomousLocked = !engineAllowed;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-carbon-panel p-5 shadow-card ring-1 ring-white/10"
    >
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/45">
        Start a run
      </h2>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Mode toggle */}
        <div>
          <div
            role="radiogroup"
            aria-label="Run mode"
            className="inline-flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === "directed"}
              onClick={() => setMode("directed")}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                mode === "directed"
                  ? "bg-white/10 text-cloud"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Directed
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "autonomous"}
              aria-disabled={autonomousLocked || undefined}
              title={autonomousLocked ? "Pro feature — upgrade in Billing" : undefined}
              onClick={() => {
                if (!autonomousLocked) setMode("autonomous");
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                mode === "autonomous"
                  ? "bg-white/10 text-cloud"
                  : autonomousLocked
                    ? "cursor-not-allowed text-white/25"
                    : "text-white/50 hover:text-white"
              }`}
            >
              {autonomousLocked && <Lock aria-hidden="true" className="h-3 w-3" />}
              Autonomous
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-white/40">
            {autonomousLocked && mode === "directed"
              ? "Autonomous is a Pro feature — upgrade in Billing."
              : MODE_HELP[mode]}
          </p>
        </div>

        {/* Market input — directed runs only */}
        {mode === "directed" && (
          <div className="flex-1">
            <label
              htmlFor="start-run-market"
              className="block text-[12px] text-white/55"
            >
              Market
            </label>
            <input
              id="start-run-market"
              type="text"
              required
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              placeholder="e.g. senior health"
              disabled={busy}
              className="mt-1.5 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-cloud outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/30 disabled:opacity-60"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="bg-iridescent inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play aria-hidden="true" className="h-3.5 w-3.5" />
          {busy ? "Starting…" : "Start run"}
        </button>

        <p aria-live="polite" className="min-w-0 text-[13px]">
          {progress && (
            <span className="inline-flex items-center gap-2 text-sky">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky"
              />
              {progress}
            </span>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[13px] leading-relaxed text-blush">
          {error}
        </p>
      )}
    </form>
  );
}
