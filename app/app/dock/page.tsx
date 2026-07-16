import { redirect } from "next/navigation";
import { Mailbox, ShieldCheck } from "lucide-react";

import DockList from "@/components/app/DockList";
import { getDock, getWorkspace } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DockPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/sign-in");

  const items = await getDock(ws.account.id);

  const draft = items.filter((i) => i.outreach.status === "draft").length;
  const approved = items.filter((i) => i.outreach.status === "approved").length;
  const sent = items.filter((i) => i.outreach.status === "sent").length;

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-iridescent text-[11px] font-medium uppercase tracking-[0.22em]">
          Outreach dock
        </p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          Review, then send on your terms
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/50">
          Everdeck drafts a personalized email for each prospect. You approve the copy and
          send it from your own inbox — never automatically.
        </p>
        <div className="mt-3 text-[12px] text-white/45">
          <span className="tabular-nums text-white/70">{draft}</span> to review
          <span className="px-1.5 text-white/25" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-white/70">{approved}</span> ready
          <span className="px-1.5 text-white/25" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-white/70">{sent}</span> sent
        </div>
      </header>

      <div className="mt-5 flex gap-3 rounded-xl bg-lilac/10 p-4 text-lilac ring-1 ring-lilac/25">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[13px] leading-relaxed">
          Nothing is sent automatically. You review every email, fix anything, and hit send
          in your own mail app. This keeps your domain safe and your outreach honest.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
          <Mailbox className="mx-auto h-6 w-6 text-white/30" aria-hidden />
          <h2 className="mt-3 text-lg font-medium text-white">No drafts yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-white/50">
            Run a hunt and Everdeck fills your dock with a ready-to-review email for each
            prospect.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <DockList items={items} />
        </div>
      )}
    </div>
  );
}
