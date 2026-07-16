import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";

import Logo from "@/components/marketing/Logo";
import { AppNavDesktop, AppNavMobile } from "@/components/app/AppNav";
import { getWorkspace } from "@/lib/data";

const GRASS_URL =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781191264/grass_eam204.png";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-carbon text-cloud">
      <aside className="app-rail fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-white/[0.06] bg-carbon-deep px-4 py-5 md:flex">
        <img src={GRASS_URL} alt="" aria-hidden className="app-rail-grass" draggable={false} />

        <Link href="/app" className="relative z-10 flex items-center gap-2 px-2 text-cloud">
          <Logo gradient className="h-6 w-6" />
          <span className="font-medium tracking-tight">Everdeck</span>
        </Link>

        <AppNavDesktop />

        <div className="relative z-10 mt-auto space-y-3">
          <div className="rounded-xl bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="truncate text-[12px] text-white/70">{ws.email || "Your workspace"}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-iridescent text-[11px] font-medium uppercase tracking-wider">
                {ws.plan.plan}
              </span>
              {ws.subscription.source === "sandbox" && (
                <span className="rounded bg-white/10 px-1 py-px text-[9px] uppercase tracking-wider text-white/40">
                  sandbox
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            <UserButton />
            <span className="text-[12px] text-white/40">Account</span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="app-rail fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-carbon-deep px-4 py-3 md:hidden">
        <Link href="/app" className="relative z-10 flex items-center gap-2 text-cloud">
          <Logo gradient className="h-5 w-5" />
          <span className="text-sm font-medium tracking-tight">Everdeck</span>
        </Link>
        <div className="relative z-10 flex items-center gap-4">
          <AppNavMobile />
          <UserButton />
        </div>
      </div>

      <main className="min-h-screen w-full px-5 pb-16 pt-16 md:ml-56 md:px-8 md:pt-8">{children}</main>
    </div>
  );
}
