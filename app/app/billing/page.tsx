import { redirect } from "next/navigation";

import PlanCard from "@/components/app/PlanCard";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/data";
import type { Plan } from "@/lib/types";

export const dynamic = "force-dynamic";

const PLAN_COPY: Record<string, { blurb: string; price: string }> = {
  free: { blurb: "A taste of the deck.", price: "$0" },
  pro: { blurb: "The engine, running daily for you.", price: "$49/mo" },
  founder: { blurb: "Full volume, full autonomy.", price: "$199/mo" },
};

export default async function BillingPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");

  const supabase = createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .order("daily_runs", { ascending: true });

  const sandbox = ws.subscription.source === "sandbox";

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
          Billing
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Plans & subscription
        </h1>
        <p className="mt-1 text-[13px] text-white/50">
          You're on <span className="font-medium text-white">{ws.plan.plan}</span>
          {ws.subscription.current_period_end &&
            ` · renews ${new Date(ws.subscription.current_period_end).toLocaleDateString()}`}
        </p>
      </header>

      {sandbox && (
        <div className="mt-6 rounded-xl bg-lilac/10 px-4 py-3 text-[13px] leading-relaxed text-lilac ring-1 ring-lilac/25">
          <strong>Billing sandbox is on.</strong> Stripe keys aren't configured
          yet, so plan changes here are simulated end-to-end (they write the
          same subscription records real webhooks would). Wiring real Stripe
          TEST mode is a 5-minute step in STATUS.md — feature gating behaves
          identically either way.
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {((plans ?? []) as Plan[]).map((plan) => (
          <PlanCard
            key={plan.plan}
            plan={plan}
            price={PLAN_COPY[plan.plan]?.price ?? ""}
            blurb={PLAN_COPY[plan.plan]?.blurb ?? ""}
            current={ws.plan.plan === plan.plan}
            featured={plan.plan === "pro"}
          />
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-medium text-white">Test cards (Stripe TEST mode)</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-white/50">
          Once Stripe test keys are configured, use{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] text-white/80">
            4242 4242 4242 4242
          </code>{" "}
          with any future expiry and CVC. No real money moves in test mode; the
          go-live checklist lives in STATUS.md.
        </p>
      </div>
    </div>
  );
}
