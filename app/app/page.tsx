import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Radar } from "lucide-react";

import { TierLegend } from "@/components/app/badges";
import ProspectCard from "@/components/app/ProspectCard";
import { getRecentProspects, getTodaysProspects, getWorkspace } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Prospects — Everdeck" };

export default async function ProspectsPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const todays = await getTodaysProspects(ws.account.id);
  const prospects = todays.length ? todays : await getRecentProspects(ws.account.id);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
            Prospects
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
            {todays.length ? "Fresh prospects from today's hunt" : "Your best prospects"}
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            {prospects.length} businesses · sorted by opportunity
          </p>
        </div>
        <TierLegend />
      </header>

      {prospects.length === 0 ? (
        <div className="mt-16 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
          <Radar className="mx-auto h-6 w-6 text-white/30" />
          <h2 className="mt-3 text-lg font-medium text-white">No prospects yet</h2>
          <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-white/50">
            Run a hunt — pick a business type and a city, and Everdeck finds
            businesses that need a website, mocks one up, and drafts the outreach.
          </p>
          <Link
            href="/app/hunts"
            className="bg-iridescent mt-5 inline-block rounded-full px-5 py-2 text-sm font-medium text-ink"
          >
            Start your first hunt
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
        </div>
      )}
    </div>
  );
}
