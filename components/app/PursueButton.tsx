"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ArrowUpRight, CheckCircle2, Loader2, Wand2 } from "lucide-react";

import { FUNCTIONS_URL } from "@/lib/publicConfig";
import { useSupabase } from "@/lib/supabase/browser";
import type { ProspectStatus } from "@/lib/types";

/** How long between worker pokes / status refreshes while a pursue is building. */
const TICK_INTERVAL_MS = 2500;

type Variant = "card" | "cta";

/** Statuses at or past a finished pursue — the concept + brief + draft exist. */
const READY_STATES: ReadonlyArray<ProspectStatus> = [
  "ready",
  "in_dock",
  "sent",
  "replied",
  "won",
];

/** Map a raw RPC / gate error onto a calm sentence, plus whether to link to Plan. */
function toMessage(raw: string): { text: string; upgrade: boolean } {
  if (raw.includes("plan_gate:pursues")) {
    return {
      text: "You've used all your pursues this month — upgrade in Plan.",
      upgrade: true,
    };
  }
  if (raw.includes("no_active_subscription")) {
    return {
      text: "Your subscription isn't active — open Plan to start pursuing leads.",
      upgrade: true,
    };
  }
  return { text: "Couldn't start that pursue. Give it another try in a moment.", upgrade: false };
}

/**
 * The "give the order" control. A hunt discovers + audits every business and
 * stops; a pursue is the user telling their team to build the concept, brief,
 * and outreach draft for one specific lead.
 *
 * - `audited` / `new` → an iridescent Pursue button.
 * - `pursuing`        → a disabled "Building…" state that keeps poking the
 *                       worker and refreshing until the mockup + brief exist.
 * - `ready` (& later) → a subtle "Ready" affordance (a link to the concept).
 */
export default function PursueButton({
  prospectId,
  status,
  variant = "card",
}: {
  prospectId: string;
  status: ProspectStatus;
  variant?: Variant;
}) {
  const supabase = useSupabase();
  const { getToken } = useAuth();
  const router = useRouter();

  // Local "just clicked" flag; the server-driven `status === 'pursuing'` is the
  // other source of the building state (e.g. after a refresh or a fresh load).
  const [clicked, setClicked] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade: boolean } | null>(null);

  const building = clicked || status === "pursuing";

  // StrictMode-safe cancellation + always-fresh reads inside the async loop.
  const mounted = useRef(true);
  const statusRef = useRef(status);
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    statusRef.current = status;
    getTokenRef.current = getToken;
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  // While the server says we're pursuing, keep poking the worker and refreshing
  // so the new status (and eventually the concept) shows up on its own.
  useEffect(() => {
    if (status !== "pursuing") return;
    let cancelled = false;

    (async () => {
      while (!cancelled && mounted.current && statusRef.current === "pursuing") {
        try {
          const token = await getTokenRef.current();
          await fetch(`${FUNCTIONS_URL}/worker?task=tick`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
        } catch {
          // A dropped tick shouldn't strand the pursue — keep going.
        }
        await sleep(TICK_INTERVAL_MS);
        if (cancelled || !mounted.current) return;
        router.refresh();
        // Give the refresh time to flow new props into statusRef before re-checking.
        await sleep(600);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  async function handlePursue() {
    if (building) return;
    setError(null);
    setClicked(true);

    const { data, error: rpcError } = await supabase.rpc("pursue_prospect", {
      p_prospect_id: prospectId,
    });

    if (rpcError) {
      if (!mounted.current) return;
      setError(toMessage(rpcError.message));
      setClicked(false);
      return;
    }

    // 'ready' means it was already generated — otherwise the order is accepted
    // and now 'pursuing'; either way, refresh so the server drives the next
    // render (and the pursuing poll loop, if applicable).
    if (data === "pursuing") {
      // Kick the worker once immediately so the build starts without waiting.
      try {
        const token = await getTokenRef.current();
        await fetch(`${FUNCTIONS_URL}/worker?task=tick`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch {
        // Non-fatal — the poll loop will keep poking.
      }
    }
    if (!mounted.current) return;
    router.refresh();
  }

  // ---- READY: a subtle affordance, no action ----
  if (READY_STATES.includes(status)) {
    if (variant === "cta") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-4 py-2 text-[13px] font-medium text-mint">
          <CheckCircle2 className="h-4 w-4" />
          Concept ready
        </span>
      );
    }
    return (
      <Link
        href={`/app/prospect/${prospectId}`}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-mint/15 px-4 py-2 text-[12px] font-medium text-mint transition-colors hover:bg-mint/20"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        View concept
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  // ---- BUILDING: disabled spinner, polling under the hood ----
  if (building) {
    const size = variant === "cta" ? "px-5 py-2.5 text-[13px]" : "w-full px-4 py-2 text-[12px]";
    return (
      <button
        type="button"
        disabled
        aria-busy="true"
        className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-white/[0.06] font-medium text-white/70 ring-1 ring-white/10 ${size}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Building…
      </button>
    );
  }

  // ---- AUDITED / NEW: the pursue call to action ----
  const size = variant === "cta" ? "px-5 py-2.5 text-[14px]" : "w-full px-4 py-2 text-[13px]";
  return (
    <div className={variant === "card" ? "w-full" : ""}>
      <button
        type="button"
        onClick={handlePursue}
        className={`bg-iridescent inline-flex items-center justify-center gap-1.5 rounded-full font-medium text-ink transition ${size}`}
      >
        <Wand2 className={variant === "cta" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {variant === "cta" ? "Pursue this lead" : "Pursue"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[12px] leading-relaxed text-blush">
          {error.text}
          {error.upgrade && (
            <>
              {" "}
              <Link href="/app/billing" className="underline underline-offset-2 hover:text-white">
                Open Plan
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
