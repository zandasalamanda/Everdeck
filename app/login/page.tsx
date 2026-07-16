"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import Logo from "@/components/marketing/Logo";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only same-origin relative paths — never a protocol-relative (//host) or
  // absolute URL, which would be an open redirect.
  const rawNext = params.get("next") ?? "/app";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/app";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
        });
        if (error) throw error;
        setNotice("Check your email for the sign-in link.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-carbon px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-cloud">
          <Logo gradient className="h-7 w-7" />
          <span className="text-lg font-medium tracking-tight">Everdeck</span>
        </Link>

        <div className="mt-8 rounded-2xl bg-carbon-panel p-7 ring-1 ring-white/10">
          <h1 className="text-lg font-medium tracking-tight text-white">
            {mode === "signup" ? "Create your deck" : "Welcome back"}
          </h1>
          <p className="mt-1 text-[13px] text-white/50">
            {mode === "signup"
              ? "One account, your own private workspace."
              : mode === "magic"
                ? "We'll email you a one-time sign-in link."
                : "Sign in to open today's deck."}
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-white/40">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/25 focus:ring-white/30"
                placeholder="you@company.com"
              />
            </label>

            {mode !== "magic" && (
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-white/40">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/25 focus:ring-white/30"
                  placeholder="At least 8 characters"
                />
              </label>
            )}

            {error && <p className="text-[13px] text-blush">{error}</p>}
            {notice && <p className="text-[13px] text-mint">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="bg-iridescent w-full rounded-full py-2.5 text-sm font-medium text-ink disabled:opacity-60"
            >
              {busy
                ? "One moment…"
                : mode === "signup"
                  ? "Create account"
                  : mode === "magic"
                    ? "Email me a link"
                    : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-[12px] text-white/45">
            {mode === "signin" ? (
              <>
                <button onClick={() => setMode("signup")} className="hover:text-white">
                  Create account
                </button>
                <button onClick={() => setMode("magic")} className="hover:text-white">
                  Use a magic link
                </button>
              </>
            ) : (
              <button onClick={() => setMode("signin")} className="hover:text-white">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-white/30">
          Multi-tenant by design — your data is isolated by Row-Level Security.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
