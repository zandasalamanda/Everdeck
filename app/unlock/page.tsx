import type { Metadata } from "next";

import AuthBackdrop from "@/components/marketing/AuthBackdrop";
import { unlock } from "./actions";

export const metadata: Metadata = { title: "Everdeck" };

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  const wrong = sp.error === "1";

  return (
    <AuthBackdrop>
      <form
        action={unlock}
        className="w-full max-w-sm rounded-2xl bg-carbon-panel p-6 shadow-lift ring-1 ring-white/10"
      >
        <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
          Private preview
        </p>
        <h1 className="mt-1 text-lg font-medium tracking-tight text-cloud">
          Everdeck is almost ready
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-white/50">
          Enter the access password to take a look.
        </p>

        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="off"
          placeholder="Password"
          aria-label="Access password"
          className="mt-4 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30"
        />

        {wrong && (
          <p role="alert" className="mt-2 text-[13px] text-blush">
            That password isn&apos;t right — try again.
          </p>
        )}

        <button
          type="submit"
          className="bg-iridescent mt-4 w-full rounded-full px-5 py-2.5 text-sm font-medium text-ink transition"
        >
          Enter
        </button>
      </form>
    </AuthBackdrop>
  );
}
