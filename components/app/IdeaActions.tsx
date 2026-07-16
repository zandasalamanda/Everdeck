"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Check, Copy, FileText, Loader2, Lock, Star } from "lucide-react";

import { FUNCTIONS_URL } from "@/lib/publicConfig";
import { useSupabase } from "@/lib/supabase/browser";
import type { Idea, LandingPrompt } from "@/lib/types";

interface IdeaActionsProps {
  idea: Idea;
  starred: boolean;
  landingPrompts: LandingPrompt[];
  canGenerate: boolean;
}

/** Deterministic date formatting (SSR + client render identically). */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default function IdeaActions({
  idea,
  starred,
  landingPrompts,
  canGenerate,
}: IdeaActionsProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const { getToken } = useAuth();

  const [isStarred, setIsStarred] = useState(starred);
  const [starBusy, setStarBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planGated, setPlanGated] = useState(!canGenerate);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Re-sync with the server after router.refresh().
  useEffect(() => setIsStarred(starred), [starred]);

  async function toggleStar() {
    setStarBusy(true);
    setError(null);

    // Optimistically flip; revert if the RPC fails.
    const previous = isStarred;
    setIsStarred(!previous);

    const { data, error: rpcError } = await supabase.rpc("toggle_star", {
      p_idea_id: idea.id,
    });

    if (rpcError) {
      setIsStarred(previous);
      setError(rpcError.message);
      setStarBusy(false);
      return;
    }

    setIsStarred(data === true);
    setStarBusy(false);
    router.refresh();
  }

  async function generatePrompt() {
    setGenerating(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("request_landing_prompt", {
      p_idea_id: idea.id,
    });
    if (rpcError) {
      if (rpcError.message.includes("plan_gate")) {
        setPlanGated(true);
      } else {
        setError(rpcError.message);
      }
      setGenerating(false);
      return;
    }

    // Drain the job immediately, then give the worker a moment to finish.
    const token = await getToken();
    if (token) {
      try {
        await fetch(`${FUNCTIONS_URL}/worker?task=tick`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Best-effort: the worker also runs on a schedule.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setGenerating(false);
    router.refresh();
  }

  async function copyPrompt(prompt: LandingPrompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      setTimeout(
        () => setCopiedId((current) => (current === prompt.id ? null : current)),
        1600,
      );
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <>
      <section className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          Actions
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleStar}
            disabled={starBusy}
            aria-pressed={isStarred}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] ring-1 transition-colors disabled:opacity-60 ${
              isStarred
                ? "bg-blush/10 text-blush ring-blush/30"
                : "text-white/70 ring-white/15 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Star
              className="h-4 w-4"
              fill={isStarred ? "currentColor" : "none"}
              aria-hidden="true"
            />
            {isStarred ? "Starred" : "Star this idea"}
          </button>

          {planGated ? (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-medium text-white/40"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Generate landing-page prompt
            </button>
          ) : (
            <button
              type="button"
              onClick={generatePrompt}
              disabled={generating}
              className="bg-iridescent inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-ink disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              {generating ? "Generating…" : "Generate landing-page prompt"}
            </button>
          )}
        </div>

        {planGated && (
          <p className="mt-3 text-[12px] text-white/50">
            Available on Pro —{" "}
            <Link href="/app/billing" className="text-lilac hover:text-cloud hover:underline">
              upgrade in Billing
            </Link>
            .
          </p>
        )}

        {error && <p className="mt-3 text-[12px] text-blush">{error}</p>}
      </section>

      <section className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/40">
          Landing-page prompts
          {landingPrompts.length > 0 && (
            <span className="ml-1.5 tabular-nums text-white/30">
              {landingPrompts.length}
            </span>
          )}
        </h2>

        {landingPrompts.length === 0 ? (
          <p className="mt-3 text-[13px] text-white/40">
            {planGated
              ? "No prompts yet. Prompts are generated on the Pro plan."
              : "No prompts yet. Generate one to hand to your site builder of choice."}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {landingPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-xl bg-carbon p-3.5 ring-1 ring-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/40">
                    {formatDate(prompt.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyPrompt(prompt)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/15 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {copiedId === prompt.id ? (
                      <>
                        <Check className="h-3 w-3 text-mint" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="mt-2.5 max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-white/75">
                  {prompt.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
