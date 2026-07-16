"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Mail, Send } from "lucide-react";

import { useSupabase } from "@/lib/supabase/browser";
import type { Outreach } from "@/lib/types";

type OutreachStatus = Outreach["status"];

interface OutreachEditorProps {
  prospectId: string;
  toEmail?: string | null;
  subject?: string | null;
  body?: string | null;
  status?: OutreachStatus | null;
}

type Busy = "save" | "approve" | "sent" | null;

/**
 * Opens the generated mockup HTML in a new tab via a blob URL — no server
 * round-trip, and the object URL is revoked once the tab has had time to load.
 */
export function OpenMockupButton({
  html,
  className = "",
}: {
  html: string;
  className?: string;
}) {
  const open = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // Give the new tab time to load before releasing the URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <button
      type="button"
      onClick={open}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Open full preview
    </button>
  );
}

export default function OutreachEditor({
  prospectId,
  toEmail,
  subject,
  body,
  status,
}: OutreachEditorProps) {
  const supabase = useSupabase();
  const router = useRouter();

  const [to, setTo] = useState(toEmail ?? "");
  const [subjectValue, setSubjectValue] = useState(subject ?? "");
  const [bodyValue, setBodyValue] = useState(body ?? "");
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(status === "sent");

  const disabled = busy !== null;

  async function saveDraft(approve: boolean) {
    setError(null);
    setBusy(approve ? "approve" : "save");
    try {
      const { error: rpcError } = await supabase.rpc("save_outreach", {
        p_prospect_id: prospectId,
        p_to: to.trim() || null,
        p_subject: subjectValue,
        p_body: bodyValue,
        p_approve: approve,
      });
      if (rpcError) throw new Error(rpcError.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the draft.");
    } finally {
      setBusy(null);
    }
  }

  function openInEmail() {
    setError(null);
    const recipient = to.trim();
    const params = new URLSearchParams();
    if (subjectValue) params.set("subject", subjectValue);
    if (bodyValue) params.set("body", bodyValue);
    const query = params.toString().replace(/\+/g, "%20");
    window.location.href = `mailto:${encodeURIComponent(recipient)}${query ? `?${query}` : ""}`;
  }

  async function markSent() {
    setError(null);
    setBusy("sent");
    try {
      const { error: rpcError } = await supabase.rpc("mark_sent", {
        p_prospect_id: prospectId,
      });
      if (rpcError) throw new Error(rpcError.message);
      setSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark this as sent.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="outreach-to" className="block text-[11px] font-medium uppercase tracking-wider text-white/40">
          To
        </label>
        <input
          id="outreach-to"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={disabled}
          placeholder="no public email found — add one"
          className="w-full rounded-lg bg-carbon-deep px-3 py-2 text-[13px] text-white placeholder:text-white/25 ring-1 ring-white/10 transition-colors focus:outline-none focus:ring-white/25 disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="outreach-subject" className="block text-[11px] font-medium uppercase tracking-wider text-white/40">
          Subject
        </label>
        <input
          id="outreach-subject"
          type="text"
          value={subjectValue}
          onChange={(e) => setSubjectValue(e.target.value)}
          disabled={disabled}
          placeholder="A quick idea for your website"
          className="w-full rounded-lg bg-carbon-deep px-3 py-2 text-[13px] text-white placeholder:text-white/25 ring-1 ring-white/10 transition-colors focus:outline-none focus:ring-white/25 disabled:opacity-60"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="outreach-body" className="block text-[11px] font-medium uppercase tracking-wider text-white/40">
          Message
        </label>
        <textarea
          id="outreach-body"
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
          disabled={disabled}
          rows={8}
          placeholder="Write a short, specific note about what you'd improve…"
          className="w-full resize-y rounded-lg bg-carbon-deep px-3 py-2.5 text-[13px] leading-relaxed text-white placeholder:text-white/25 ring-1 ring-white/10 transition-colors focus:outline-none focus:ring-white/25 disabled:opacity-60"
        />
      </div>

      {error && (
        <p role="alert" className="text-[12px] leading-relaxed text-blush">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => saveDraft(false)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {busy === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save draft
        </button>
        <button
          type="button"
          onClick={() => saveDraft(true)}
          disabled={disabled}
          className="bg-iridescent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-ink transition-opacity disabled:opacity-50"
        >
          {busy === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Approve &amp; add to dock
        </button>
        <button
          type="button"
          onClick={openInEmail}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:text-white disabled:opacity-50"
        >
          <Mail className="h-3.5 w-3.5" />
          Open in email
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="max-w-sm text-[12px] leading-relaxed text-white/40">
          Everdeck never sends on its own — you review and send from your own inbox.
        </p>
        {sent ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1.5 text-[12px] font-medium text-mint">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Marked as sent
          </span>
        ) : (
          <button
            type="button"
            onClick={markSent}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {busy === "sent" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Mark as sent
          </button>
        )}
      </div>
    </div>
  );
}
