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
}

const OFF_TRACK: ProspectStatus[] = ["lost", "skipped"];

export default function ProspectStatusBar({ prospectId, status }: ProspectStatusBarProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const [pending, setPending] = useState<ProspectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = PIPELINE.indexOf(status);

  async function move(next: ProspectStatus) {
    if (next === status || pending) return;
    setError(null);
    setPending(next);
    try {
      const { error: rpcError } = await supabase.rpc("set_prospect_status", {
        p_prospect_id: prospectId,
        p_status: next,
      });
      if (rpcError) throw new Error(rpcError.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the status.");
    } finally {
      setPending(null);
    }
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
              onClick={() => move(step)}
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

      {error && (
        <p role="alert" className="text-[12px] text-blush">
          {error}
        </p>
      )}
    </div>
  );
}
