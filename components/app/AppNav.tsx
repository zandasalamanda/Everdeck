"use client";

import Link from "next/link";
import { LayoutGrid, Mailbox, Radar, Gauge, CreditCard } from "lucide-react";

import NavChip from "@/components/app/NavChip";

// Icons live inside this client boundary — a Server Component cannot pass a
// component (function) as a prop to a Client Component in Next 15.
const NAV = [
  { href: "/app", label: "Prospects", icon: LayoutGrid, exact: true },
  { href: "/app/dock", label: "Outreach dock", icon: Mailbox, exact: false },
  { href: "/app/hunts", label: "Hunts", icon: Radar, exact: false },
  { href: "/app/usage", label: "Usage", icon: Gauge, exact: false },
  { href: "/app/billing", label: "Plan", icon: CreditCard, exact: false },
];

export function AppNavDesktop() {
  return (
    <nav className="relative z-10 mt-8 space-y-1">
      {NAV.map((n) => (
        <NavChip key={n.href} href={n.href} label={n.label} icon={n.icon} exact={n.exact} />
      ))}
    </nav>
  );
}

export function AppNavMobile() {
  return (
    <div className="relative z-10 flex items-center gap-4">
      {NAV.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} aria-label={label} className="text-white/60 hover:text-white">
          <Icon className="h-[18px] w-[18px]" />
        </Link>
      ))}
    </div>
  );
}
