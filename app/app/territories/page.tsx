import type { Metadata } from "next";
import { redirect } from "next/navigation";

import TerritoriesClient from "@/components/app/TerritoriesClient";
import { getTerritories, getWorkspace } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Territories — Everdeck" };

export default async function TerritoriesPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const territories = await getTerritories(ws.account.id);

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
          Territories
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Claim a niche. Wake up to leads.
        </h1>
        <p className="mt-1 text-[13px] text-white/50">
          A territory is a niche + city Everdeck hunts for you every morning — the
          autonomous engine, always on.
        </p>
      </header>

      <div className="mt-6">
        <TerritoriesClient
          initialTerritories={territories}
          engineAllowed={ws.plan.engine}
        />
      </div>
    </div>
  );
}
