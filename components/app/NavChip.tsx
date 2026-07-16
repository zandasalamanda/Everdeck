"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

/** Glass nav chip: blurs on hover, gradient label + icon when active. */
export default function NavChip({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link href={href} className={`nav-chip ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon className="nav-ico h-4 w-4 shrink-0" />
      <span className="nav-label">{label}</span>
    </Link>
  );
}
