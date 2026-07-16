"use client";

import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";

/** Escape HTML so a brief can never inject markup when we render it. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Inline formatting: **bold** and `code`. Runs AFTER escaping. */
function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[12px] text-lilac">$1</code>');
}

/**
 * A deliberately small Markdown-to-HTML pass — headings, bold, inline code,
 * ordered/unordered lists, and paragraphs. No dependency; the brief comes from
 * our own generator, and everything is escaped before formatting is applied.
 */
function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!list) return;
    const inner = list.items.map((li) => `<li>${li}</li>`).join("");
    out.push(
      `<${list.type} class="my-2 ${
        list.type === "ul" ? "list-disc" : "list-decimal"
      } space-y-1 pl-5 text-white/70 marker:text-white/35">${inner}</${list.type}>`,
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const esc = escapeHtml(line);

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const level = h[1].length;
      const cls =
        level <= 1
          ? "mt-4 mb-2 text-[15px] font-semibold text-white"
          : level === 2
            ? "mt-4 mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-white/80"
            : "mt-3 mb-1 text-[12px] font-medium uppercase tracking-wider text-white/55";
      out.push(`<h${level} class="${cls}">${inline(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }

    // Unordered list item
    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (list && list.type !== "ul") flushList();
      if (!list) list = { type: "ul", items: [] };
      list.items.push(inline(escapeHtml(ul[1])));
      continue;
    }

    // Ordered list item
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ol) {
      if (list && list.type !== "ol") flushList();
      if (!list) list = { type: "ol", items: [] };
      list.items.push(inline(escapeHtml(ol[1])));
      continue;
    }

    // Blank line ends a block
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    out.push(`<p class="my-2 text-[13px] leading-relaxed text-white/70">${inline(esc)}</p>`);
  }
  flushList();
  return out.join("");
}

/**
 * The build brief: a Markdown spec the user pastes into an AI coding tool to
 * build the real site. Rendered as prose, with a copy-the-raw-markdown button.
 */
export default function BuildBrief({ brief }: { brief: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions / insecure context) — no-op.
    }
  }

  const html = renderMarkdown(brief);

  return (
    <section className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-lilac" aria-hidden />
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">
            Build brief
          </h2>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-mint" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy brief
            </>
          )}
        </button>
      </div>

      <div
        className="mt-4 max-h-[560px] overflow-y-auto rounded-xl bg-carbon-deep p-5 ring-1 ring-white/10 [&>:first-child]:mt-0"
        // eslint-disable-next-line react/no-danger -- our own generated brief, escaped in renderMarkdown
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <p className="mt-3 text-[12px] leading-relaxed text-white/40">
        Paste into Claude Code, Cursor, v0, or Bolt to build the real site.
      </p>
    </section>
  );
}
