"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, Mail } from "lucide-react";

import { TierBadge } from "@/components/app/badges";
import type { DockItem } from "@/lib/data";
import { useSupabase } from "@/lib/supabase/browser";
import type { Outreach } from "@/lib/types";

type OutreachStatus = Outreach["status"];

const SECTIONS: { status: OutreachStatus; title: string; hint: string }[] = [
  {
    status: "draft",
    title: "To review",
    hint: "Read it over, fix anything, then approve.",
  },
  {
    status: "approved",
    title: "Ready",
    hint: "Approved — send from your inbox whenever you're set.",
  },
  {
    status: "sent",
    title: "Sent",
    hint: "Already sent from your own mail app.",
  },
];

export default function DockList({ items }: { items: DockItem[] }) {
  return (
    <div className="space-y-8">
      {SECTIONS.map(({ status, title, hint }) => {
        const group = items.filter((i) => i.outreach.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} aria-label={title}>
            <div className="mb-1 flex items-baseline gap-2">
              <h2 className="text-[13px] font-medium tracking-tight text-white/80">{title}</h2>
              <span className="text-[12px] tabular-nums text-white/35">{group.length}</span>
            </div>
            <p className="mb-3 text-[12px] text-white/40">{hint}</p>
            <ul className="space-y-2.5">
              {group.map((item) => (
                <li key={item.outreach.id}>
                  <DockCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function DockCard({ item }: { item: DockItem }) {
  const { outreach, prospect } = item;
  const supabase = useSupabase();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(outreach.to_email ?? "");
  const [subject, setSubject] = useState(outreach.subject ?? "");
  const [body, setBody] = useState(outreach.body ?? "");
  const [busy, setBusy] = useState<null | "save" | "approve" | "sent">(null);
  const [error, setError] = useState<string | null>(null);

  const isSent = outreach.status === "sent";
  const hasEmail = to.trim().length > 0;
  const panelId = `dock-panel-${outreach.id}`;

  async function persist(approve: boolean) {
    setBusy(approve ? "approve" : "save");
    setError(null);
    const { error: rpcError } = await supabase.rpc("save_outreach", {
      p_prospect_id: prospect.id,
      p_to: to.trim() || null,
      p_subject: subject,
      p_body: body,
      p_approve: approve,
    });
    if (rpcError) {
      setError(rpcError.message || "Couldn't save this draft. Try again.");
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  async function markSent() {
    setBusy("sent");
    setError(null);
    const { error: rpcError } = await supabase.rpc("mark_sent", {
      p_prospect_id: prospect.id,
    });
    if (rpcError) {
      setError(rpcError.message || "Couldn't mark this as sent. Try again.");
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  function openInEmail() {
    // Address is left unencoded (mail clients expect a raw address); the
    // subject and body are percent-encoded so line breaks and symbols survive.
    const url = `mailto:${to.trim()}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  const fieldClass =
    "w-full rounded-lg bg-carbon-deep px-3 py-2 text-[13px] text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/25 disabled:opacity-60";

  return (
    <div className="overflow-hidden rounded-2xl bg-carbon-panel ring-1 ring-white/10 transition-colors hover:ring-white/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-medium text-white">{prospect.name}</span>
            <TierBadge tier={prospect.tier} compact />
          </div>
          <div className="mt-1 text-[12px]">
            {hasEmail ? (
              <span className="truncate text-white/45">{to.trim()}</span>
            ) : (
              <span className="text-blush">no email — add one</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-white/40">
            {subject.trim() || "No subject yet"}
          </p>
        </div>
        <StatusPill status={outreach.status} />
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/35 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="space-y-3 border-t border-white/[0.06] px-4 pb-4 pt-4">
          <div>
            <label
              htmlFor={`${panelId}-to`}
              className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40"
            >
              To
            </label>
            <input
              id={`${panelId}-to`}
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={isSent}
              placeholder="name@business.com"
              className={fieldClass}
            />
            {!hasEmail && !isSent && (
              <p className="mt-1 text-[12px] text-blush">
                Add a recipient email before you can approve or send.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`${panelId}-subject`}
              className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40"
            >
              Subject
            </label>
            <input
              id={`${panelId}-subject`}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSent}
              placeholder="A free website concept for…"
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor={`${panelId}-body`}
              className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40"
            >
              Message
            </label>
            <textarea
              id={`${panelId}-body`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSent}
              rows={8}
              placeholder="Write a warm, non-pushy opener…"
              className={`${fieldClass} resize-y leading-relaxed`}
            />
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-blush">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isSent ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-mint">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Sent{outreach.sent_at ? ` · ${formatDate(outreach.sent_at)}` : ""}
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => persist(false)}
                  disabled={busy !== null}
                  className="rounded-full bg-white/10 px-4 py-1.5 text-[13px] text-white hover:bg-white/15 disabled:opacity-50"
                >
                  {busy === "save" ? "Saving…" : "Save"}
                </button>

                {outreach.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => persist(true)}
                    disabled={busy !== null || !hasEmail}
                    className="bg-iridescent rounded-full px-4 py-1.5 text-[13px] font-medium text-ink disabled:opacity-50"
                  >
                    {busy === "approve" ? "Approving…" : "Approve"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={openInEmail}
                  disabled={!hasEmail}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] text-white/80 ring-1 ring-white/15 hover:text-white disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Open in email
                </button>

                <button
                  type="button"
                  onClick={markSent}
                  disabled={busy !== null || !hasEmail}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] text-mint ring-1 ring-mint/30 hover:bg-mint/10 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {busy === "sent" ? "Marking…" : "Mark as sent"}
                </button>
              </>
            )}

            <Link
              href={`/app/prospect/${prospect.id}`}
              className="ml-auto text-[12px] text-white/45 hover:text-white"
            >
              Open prospect →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OutreachStatus }) {
  const meta: Record<OutreachStatus, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-white/10 text-white/55" },
    approved: { label: "Ready", cls: "bg-lilac/15 text-lilac" },
    sent: { label: "Sent", cls: "bg-mint/15 text-mint" },
  };
  const { label, cls } = meta[status];
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
