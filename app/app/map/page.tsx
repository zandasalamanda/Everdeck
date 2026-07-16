import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Map } from "lucide-react";

import MapView from "@/components/app/MapView";
import { getMapData, getWorkspace } from "@/lib/data";

export const metadata: Metadata = {
  title: "Mind map · Everdeck",
};

export default async function MapPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");

  const { markets, nodes, ideas } = await getMapData(ws.account.id);

  if (markets.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-carbon-panel ring-1 ring-white/10">
          <Map className="h-5 w-5 text-white/50" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-medium tracking-tight text-cloud">
          No maps yet
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          The engine hasn&rsquo;t run yet. A run explores a market, breaks it
          into niches, and scores ideas at each one — that&rsquo;s what grows
          this map.
        </p>
        <Link
          href="/app/runs"
          className="bg-iridescent mt-6 inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-medium text-ink"
        >
          Start your first run
        </Link>
      </div>
    );
  }

  return <MapView markets={markets} nodes={nodes} ideas={ideas} />;
}
