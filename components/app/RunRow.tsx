"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import type { Run, RunStatus } from "@/lib/types";

/** Color + glyph per status — the glyph is the non-color cue. */
const STATUS_META: Record<
  RunStatus,
  { label: string; glyph: string; chip: string; pulse: boolean }
> = {
  queued: { label: "Queued", glyph: "○", chip: "bg-white/[0.06] text-white/40", pulse: false },
  running: { label: "Running", glyph: "◐", chip: "bg-sky/15 text-sky", pulse: true },
  done: { label: "Done", glyph: "●", chip: "bg-mint/15 text-mint", pulse: false },
  error: { label: "Error", glyph: "✕", chip: "bg-blush/15 text-blush", pulse: false },
};

function summarizeStages(progress: Run["stage_progress"]): string | null {
  if (!progress) return null;
  const parts = Object.entries(progress).map(([stage, value]) => `${stage} ${value}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function RunRow({ run }: { run: Run }) {
  const meta = STATUS_META[run.status];
  const stages = summarizeStages(run.stage_progress);
  const created = new Date(run.created_at);

  return (
    <li className="rounded-2xl bg-carbon-panel px-4 py-3.5 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.chip} ${
            meta.pulse ? "animate-pulse" : ""
          }`}
        >
          <span aria-hidden="true">{meta.glyph}</span>
          {meta.label}
        </span>

        <span className="text-[11px] uppercase tracking-wider text-white/45">
          {run.mode}
        </span>

        <span
          className="font-mono text-[12px] text-white/45"
          title={run.market_id ?? undefined}
        >
          {run.market_id ? `market ${run.market_id.slice(0, 8)}` : "no market yet"}
        </span>

        {/* Local time renders client-side; server HTML may differ by timezone. */}
        <time
          dateTime={run.created_at}
          suppressHydrationWarning
          className="ml-auto text-[12px] tabular-nums text-white/40"
        >
          {created.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </div>

      {stages && <p className="mt-2 text-[12px] text-white/50">{stages}</p>}

      {run.error && (
        <p className="mt-2 truncate text-[12px] text-blush" title={run.error}>
          {run.error}
        </p>
      )}
    </li>
  );
}

/** Ghost refresh button for the run list header. */
export function RunListRefresh() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white/55 ring-1 ring-white/10 transition-colors hover:bg-white/[0.05] hover:text-white"
    >
      <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}
