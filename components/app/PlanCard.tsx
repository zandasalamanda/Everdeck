"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { FUNCTIONS_URL } from "@/lib/publicConfig";
import { createClient } from "@/lib/supabase/client";
import type { Plan } from "@/lib/types";

export default function PlanCard({
  plan,
  price,
  blurb,
  current,
  featured,
}: {
  plan: Plan;
  price: string;
  blurb: string;
  current: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const features = [
    `${plan.daily_runs} run${plan.daily_runs === 1 ? "" : "s"} per day`,
    `${plan.ideas_per_run} scored ideas per run`,
    plan.engine ? "Daily autonomous engine" : "Directed runs only",
    plan.landing_prompts ? "Landing-page prompt generator" : "No landing prompts",
  ];

  async function change(action: "checkout" | "downgrade") {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      const res = await fetch(`${FUNCTIONS_URL}/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(
          action === "checkout" ? { action, plan: plan.plan } : { action },
        ),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `billing error (${res.status})`);

      if (json.url) {
        window.location.href = json.url as string; // Stripe Checkout / Portal
        return;
      }
      // sandbox action, or in-place Stripe plan change — reflect on refresh
      // (Stripe changes finalize when the webhook lands a moment later).
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl p-6 ring-1 ${
        featured ? "bg-carbon-panel ring-white/25" : "bg-carbon-panel ring-white/10"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
          {plan.plan}
        </h3>
        {current && (
          <span className="text-iridescent text-[10px] font-medium uppercase tracking-wider">
            current
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-medium tracking-tight text-white">{price}</div>
      <p className="mt-0.5 text-[13px] text-white/50">{blurb}</p>

      <ul className="mt-4 space-y-1.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-white/70">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
            {f}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-[12px] text-blush">{error}</p>}

      <div className="mt-auto pt-5">
        {current ? (
          plan.plan !== "free" ? (
            <button
              onClick={() => change("downgrade")}
              disabled={busy}
              className="w-full rounded-full py-2 text-[13px] text-white/50 ring-1 ring-white/15 hover:text-white disabled:opacity-50"
            >
              {busy ? "Working…" : "Downgrade to free"}
            </button>
          ) : (
            <div className="py-2 text-center text-[12px] text-white/35">Your current plan</div>
          )
        ) : plan.plan === "free" ? (
          <button
            onClick={() => change("downgrade")}
            disabled={busy}
            className="w-full rounded-full py-2 text-[13px] text-white/50 ring-1 ring-white/15 hover:text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Switch to free"}
          </button>
        ) : (
          <button
            onClick={() => change("checkout")}
            disabled={busy}
            className={`w-full rounded-full py-2 text-[13px] font-medium disabled:opacity-50 ${
              featured ? "bg-iridescent text-ink" : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {busy ? "Working…" : `Upgrade to ${plan.plan}`}
          </button>
        )}
      </div>
    </div>
  );
}
