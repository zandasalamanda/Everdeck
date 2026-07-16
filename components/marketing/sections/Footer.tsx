"use client";

import Logo from "@/components/marketing/Logo";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "The deck", href: "#deck" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "News", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-carbon px-6 py-14 text-white sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <a href="#" className="flex items-center gap-2">
            <Logo gradient className="h-6 w-6" />
            <span className="font-medium tracking-tight">Everdeck</span>
          </a>
          <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-white/60">
            Find your market. Effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
                {column.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-5xl items-center justify-between border-t border-white/10 pt-6 text-xs text-white/60">
        <span>© 2026 Everdeck</span>
        <span>Scans land at 6:04 AM, your time.</span>
      </div>
    </footer>
  );
}
