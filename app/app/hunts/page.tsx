import { redirect } from "next/navigation";
import { Radar } from "lucide-react";

import HuntRow, { RefreshHuntsButton } from "@/components/app/HuntRow";
import StartHuntForm from "@/components/app/StartHuntForm";
import { getHunts, getWorkspace } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HuntsPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const hunts = await getHunts(ws.account.id);
  const { plan } = ws;

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
          Hunts
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Find businesses that need a website
        </h1>
        <p className="mt-1 text-[13px] text-white/50">
          {plan.daily_runs} hunts/day on the {plan.plan} plan · up to{" "}
          {plan.ideas_per_run} prospects each
        </p>
      </header>

      <div className="mt-6">
        <StartHuntForm engineAllowed={plan.engine} plan={plan.plan} />
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">
            Recent hunts
          </h2>
          <RefreshHuntsButton />
        </div>

        {hunts.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
            <Radar className="mx-auto h-6 w-6 text-white/30" />
            <p className="mt-3 text-[13px] text-white/50">
              No hunts yet — start one above.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {hunts.map((h) => (
              <HuntRow key={h.id} hunt={h} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
