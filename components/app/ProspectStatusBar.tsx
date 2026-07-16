"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { useSupabase } from "@/lib/supabase/browser";
import { PIPELINE, STATUS_LABELS } from "@/lib/types";
import type { ProspectStatus } from "@/lib/types";

interface ProspectStatusBarProps {
  prospectId: string;
  status: ProspectStatus;
  dealValue?: number | null;
}

const OFF_TRACK: ProspectStatus[] = ["lost", "skipped"];

/** Compact currency for the "booked" line, e.g. 4200 → $4,200. */
function formatDeal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProspectStatusBar({ prospectId, status, dealValue }: ProspectStatusBarProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const [pending, setPending] = useState<ProspectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wonEntry, setWonEntry] = useState(false);
  const [dealInput, setDealInput] = useState(dealValue != null ? String(dealValue) : "");

  const currentIndex = PIPELINE.indexOf(status);

  async function move(next: ProspectStatus, deal: number | null = null) {
    // Re-picking "won" is allowed so the value can be edited; other repeats are no-ops.
    if (pending || (next === status && next !== "won")) return;
    setError(null);
    setPending(next);
    try {
      const params =
        next === "won"
          ? { p_prospect_id: prospectId, p_status: next, p_deal_value: deal }
          : { p_prospect_id: prospectId, p_status: next };
      const { error: rpcError } = await supabase.rpc("set_prospect_status", params);
      if (rpcError) throw new Error(rpcError.message);
      setWonEntry(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the status.");
    } finally {
      setPending(null);
    }
  }

  function openWon() {
    setError(null);
    setDealInput(dealValue != null ? String(dealValue) : "");
    setWonEntry(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {PIPELINE.map((step, i) => {
          const isCurrent = step === status;
          const isDone = currentIndex > -1 && i < currentIndex;
          const isPending = pending === step;

          const tone = isCurrent
            ? "bg-lilac/15 text-lilac ring-1 ring-lilac/40"
            : isDone
              ? "bg-mint/10 text-mint ring-1 ring-mint/20"
              : "bg-white/[0.04] text-white/45 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white/80";

          return (
            <button
              key={step}
              type="button"
              onClick={() => (step === "won" ? openWon() : move(step))}
              disabled={pending !== null}
              aria-current={isCurrent ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-default ${tone}`}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : isDone ? (
                <Check className="h-3 w-3" aria-hidden />
              ) : (
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${isCurrent ? "bg-lilac" : "bg-white/30"}`}
                />
              )}
              {STATUS_LABELS[step]}
            </button>
          );
        })}

        <span aria-hidden className="mx-1 h-4 w-px bg-white/10" />

        {OFF_TRACK.map((step) => {
          const isCurrent = step === status;
          const isPending = pending === step;
          return (
            <button
              key={step}
              type="button"
              onClick={() => move(step)}
              disabled={pending !== null}
              aria-current={isCurrent ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-default ${
                isCurrent
                  ? "bg-white/10 text-white/70 ring-1 ring-white/25"
                  : "text-white/35 ring-1 ring-transparent hover:text-white/70"
              }`}
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              {STATUS_LABELS[step]}
            </button>
          );
        })}
      </div>

      {/* Won → capture what the deal was worth. */}
      {wonEntry && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-carbon-panel p-3 ring-1 ring-white/10">
          <label htmlFor="deal-value" className="text-[12px] font-medium text-white/60">
            Deal value
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-white/40"
            >
              $
            </span>
            <input
              id="deal-value"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              autoFocus
              value={dealInput}
              onChange={(e) => setDealInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  move("won", dealInput ? Number(dealInput) : null);
                }
              }}
              placeholder="0"
              className="w-32 rounded-lg bg-white/[0.04] py-1.5 pl-6 pr-2.5 text-[13px] tabular-nums text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30"
            />
          </div>
          <button
            type="button"
            onClick={() => move("won", dealInput ? Number(dealInput) : null)}
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3.5 py-1.5 text-[12px] font-medium text-mint ring-1 ring-mint/30 transition hover:bg-mint/20 disabled:opacity-60"
          >
            {pending === "won" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            Mark won
          </button>
          <button
            type="button"
            onClick={() => move("won", null)}
            disabled={pending !== null}
            className="rounded-full px-2 py-1.5 text-[12px] font-medium text-white/40 transition hover:text-white/70 disabled:opacity-60"
          >
            Skip value
          </button>
        </div>
      )}

      {/* Booked value on a won deal. */}
      {status === "won" && !wonEntry && dealValue != null && (
        <p className="text-[12px] text-mint">
          Booked at <span className="font-medium tabular-nums">{formatDeal(dealValue)}</span> ·{" "}
          <button
            type="button"
            onClick={openWon}
            className="text-white/45 underline underline-offset-2 transition hover:text-white/70"
          >
            edit
          </button>
        </p>
      )}

      {error && (
        <p role="alert" className="text-[12px] text-blush">
          {error}
        </p>
      )}
    </div>
  );
}
