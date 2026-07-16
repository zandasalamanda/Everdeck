import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getUsage, getWorkspace } from "@/lib/data";

export const metadata: Metadata = { title: "Usage — Everdeck" };

// Deterministic server-side formatting, independent of server locale.
const nf = new Intl.NumberFormat("en-US");

export default async function UsagePage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");

  const usage = (await getUsage(ws.account.id)).sort(
    (a, b) => b.requests - a.requests,
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h1 className="text-xl font-medium tracking-tight text-cloud">Usage</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
          Engine calls by provider — requests and token volume across every run
          on this account.
        </p>
      </header>

      <section className="mt-6 overflow-hidden rounded-2xl bg-carbon-panel shadow-card ring-1 ring-white/10">
        {usage.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-white/55">
              No engine calls yet — start a run.
            </p>
            <Link
              href="/app/runs"
              className="mt-4 inline-flex rounded-full px-4 py-2 text-[13px] text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Go to Runs
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
            <span className="text-cloud">mock</span> — costs $0 and makes zero
            external calls; output is synthetic sample data.
          </li>
          <li>
            <span className="text-cloud">gemini</span> — the free tier budgets
            roughly 1,500 requests/day, and content sent on it may be used by
            Google to improve its products. See the go-live section in
            STATUS.md before enabling it for real accounts.
          </li>
        </ul>
      </aside>
    </div>
  );
}
