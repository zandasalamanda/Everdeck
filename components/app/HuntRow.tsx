"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RotateCw } from "lucide-react";

import type { Hunt } from "@/lib/types";

type HuntStatus = Hunt["status"];

/** Color + a non-color glyph cue + label for each hunt status. */
const STATUS_META: Record<
  HuntStatus,
  { label: string; glyph: string; className: string }
> = {
  queued: { label: "Queued", glyph: "○", className: "bg-white/10 text-white/40" },
  running: {
    label: "Running",
    glyph: "◍",
    className: "bg-sky/15 text-sky animate-pulse",
  },
  done: { label: "Done", glyph: "✓", className: "bg-mint/15 text-mint" },
  error: { label: "Error", glyph: "!", className: "bg-blush/15 text-blush" },
};

function HuntStatusChip({ status }: { status: HuntStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
    >
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </span>
  );
}

export default function HuntRow({ hunt }: { hunt: Hunt }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-carbon-panel p-4 ring-1 ring-white/10 transition-colors hover:ring-white/20">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-medium text-white">
            {hunt.business_type} · {hunt.location}
          </p>
          {hunt.mode === "autonomous" && (
            <span className="shrink-0 rounded bg-white/10 px-1 py-px text-[9px] uppercase tracking-wider text-white/40">
              auto
            </span>
          )}
        </div>
        <time
          dateTime={hunt.created_at}
          suppressHydrationWarning
          className="mt-0.5 block text-[12px] text-white/40"
        >
          {new Date(hunt.created_at).toLocaleString()}
        </time>
      </div>

      <HuntStatusChip status={hunt.status} />

      <Link
        href="/app"
        className="group inline-flex items-center gap-1 text-[13px] font-medium text-white/70 transition-colors hover:text-white"
      >
        View prospects
        <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-white/70" />
      </Link>
    </li>
  );
}

/** Ghost button that re-fetches the server component tree for this route. */
export function RefreshHuntsButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/60 ring-1 ring-white/10 transition-colors hover:text-white hover:ring-white/25"
    >
      <RotateCw className="h-3.5 w-3.5" />
      Refresh
    </button>
  );
}
