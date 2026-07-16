import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { Layers, Map, Activity, CreditCard, Gauge } from "lucide-react";

import Logo from "@/components/marketing/Logo";
import SignOutButton from "@/components/app/SignOutButton";
import { getWorkspace } from "@/lib/data";

const NAV = [
  { href: "/app", label: "Today's deck", icon: Layers },
  { href: "/app/map", label: "Mind map", icon: Map },
  { href: "/app/runs", label: "Runs", icon: Activity },
  { href: "/app/usage", label: "Usage", icon: Gauge },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-carbon text-cloud">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-white/[0.06] bg-carbon-deep px-4 py-5 md:flex">
        <Link href="/app" className="flex items-center gap-2 px-2 text-cloud">
          <Logo gradient className="h-6 w-6" />
          <span className="font-medium tracking-tight">Everdeck</span>
        </Link>

        <nav className="mt-8 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
            <div className="truncate text-[12px] text-white/70">{ws.email}</div>
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
          <div className="flex items-center gap-2">
            <UserButton />
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-carbon-deep px-4 py-3 md:hidden">
        <Link href="/app" className="flex items-center gap-2 text-cloud">
          <Logo gradient className="h-5 w-5" />
          <span className="text-sm font-medium tracking-tight">Everdeck</span>
        </Link>
        <nav className="flex items-center gap-4">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} aria-label={label} className="text-white/60 hover:text-white">
              <Icon className="h-4.5 w-4.5" />
            </Link>
          ))}
        </nav>
      </div>

      <main className="min-h-screen w-full px-5 pb-16 pt-16 md:ml-56 md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
