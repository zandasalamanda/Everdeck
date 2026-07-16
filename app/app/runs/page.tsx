import type { Metadata } from "next";
import { redirect } from "next/navigation";

import RunRow, { RunListRefresh } from "@/components/app/RunRow";
import StartRunForm from "@/components/app/StartRunForm";
import { getRuns, getWorkspace } from "@/lib/data";

export const metadata: Metadata = { title: "Runs — Everdeck" };

export default async function RunsPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const runs = await getRuns(ws.account.id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-medium tracking-tight text-cloud">Runs</h1>
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/10">
            <span className="text-iridescent">
              {ws.plan.daily_runs} runs/day on the {ws.plan.plan} plan
            </span>
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          Runs are pipeline executions — five stages from market to scored deck.
        </p>
      </header>

      <div className="mt-6">
        <StartRunForm accountId={ws.account.id} engineAllowed={ws.plan.engine} />
      </div>

      <section aria-label="Recent runs" className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/45">
            Recent runs
          </h2>
          <RunListRefresh />
        </div>

        {runs.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-carbon-panel px-5 py-10 text-center ring-1 ring-white/10">
            <p className="text-sm text-white/55">
              No runs yet — start your first one above.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
