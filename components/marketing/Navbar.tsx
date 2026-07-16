"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import Logo from "@/components/marketing/Logo";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "The pitch", href: "#deck" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="animate-fade-down relative z-30">
      <nav className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-4 sm:py-5">
        <a href="#" className="flex items-center gap-2 text-ink">
          <Logo gradient className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-medium tracking-tight">Everdeck</span>
        </a>

        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] text-ink/70 hover:text-ink transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/sign-up"
            className="bg-ink text-white text-[13px] font-medium px-4 sm:px-5 py-2 rounded-full hover:bg-graphite transition-colors"
          >
            Get started
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-ink/10 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden absolute left-4 right-4 top-full rounded-2xl bg-white/80 backdrop-blur-xl ring-1 ring-ink/10 px-5 py-3 animate-fade-up">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[15px] text-ink/70 hover:text-ink border-b border-ink/10 last:border-b-0"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
