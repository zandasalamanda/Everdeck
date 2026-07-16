import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUsage, getWorkspace } from "@/lib/data";

export const metadata: Metadata = { title: "Usage — Everdeck" };

// Deterministic server-side formatting, independent of server locale.
const nf = new Intl.NumberFormat("en-US");

export default async function UsagePage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const usage = (await getUsage(ws.account.id)).sort(
    (a, b) => b.requests - a.requests,
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h1 className="text-xl font-medium tracking-tight text-cloud">Usage</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          Provider calls by source — business discovery, site audits, and mockup
          generation across every hunt on this account.
        </p>
      </header>

      <section className="mt-6 overflow-hidden rounded-2xl bg-carbon-panel shadow-card ring-1 ring-white/10">
        {usage.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-white/55">
              No provider calls yet — start a hunt.
            </p>
            <Link
              href="/app/hunts"
              className="mt-4 inline-flex rounded-full px-4 py-2 text-[13px] text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Go to Hunts
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Engine usage by provider</caption>
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-white/40">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Requests
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Input tokens
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Output tokens
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row) => (
                  <tr
                    key={row.provider}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-5 py-3 text-cloud">{row.provider}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-white/70">
                      {nf.format(row.requests)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-white/70">
                      {nf.format(row.inputTokens)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-white/70">
                      {nf.format(row.outputTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="mt-4 rounded-2xl bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.06]">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/45">
          Provider notes
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-white/55">
          <li>
            <span className="text-cloud">places / audit :sample</span> — $0, zero
            external calls; synthetic businesses and site scores. Add a Google
            key to pull real businesses and PageSpeed scores.
          </li>
          <li>
            <span className="text-cloud">mock</span> — the mockup generator on
            $0. Add a Gemini key to write real, personalized mockups + openers.
          </li>
          <li>
            Screenshots come from thum.io (no key). See SETUP.md for the exact
            keys and how to flip each provider to live.
          </li>
        </ul>
      </aside>
    </div>
  );
}
