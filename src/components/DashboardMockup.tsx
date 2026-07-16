import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Inbox,
  Layers,
  Lock,
  Mail,
  Monitor,
  PanelLeft,
  Plus,
  RotateCw,
  Share,
  Sparkles,
} from "lucide-react";

import Logo from "./Logo";

const SIDEBAR_NAV = [
  { label: "Explore", icon: Compass, active: true },
  { label: "Niches", icon: Layers, active: false },
  { label: "Inbox", icon: Inbox, active: false },
  { label: "Daily digest", icon: Mail, active: false },
];

const STATS = [
  { label: "IDEAS", value: "62", detail: "Scored & ranked", bars: [5, 8, 6, 10, 12] },
  { label: "NICHES", value: "12", detail: "Market branches", bars: [4, 6, 7, 7, 9] },
  { label: "GAPS", value: "412", detail: "Ready to build", bars: [6, 9, 8, 12, 14] },
  { label: "REACH", value: "3.1M", detail: "Searches a month", bars: [7, 8, 11, 12, 13] },
];

const TOP_IDEAS = [
  { title: "Fall-alert pendant, one-time purchase", score: 86, demand: 84 },
  { title: "Dementia med reminders with family escalation", score: 81, demand: 71 },
  { title: "Room-by-room home safety audit marketplace", score: 78, demand: 62 },
];

const GAP_FEED = [
  { pain: "How do I make a home safer for an aging parent?", volume: "74k/mo", live: false },
  { pain: "Best medication reminder for dementia patients", volume: "41k/mo", live: false },
  { pain: "GPS tracker for seniors who wander", volume: "33k/mo", live: false },
  { pain: "Affordable alternatives to stair lifts", volume: "23k/mo", live: true },
];

function ScorePill({ score }: { score: number }) {
  const high = score >= 80;
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium tabular-nums ${
        high ? "bg-iridescent text-ink" : "bg-white/10 text-white/70"
      }`}
    >
      {score}
    </span>
  );
}

export default function DashboardMockup() {
  return (
    <div
      aria-hidden="true"
      className="rounded-t-2xl overflow-hidden bg-carbon-deep shadow-[0_-20px_80px_rgba(6,6,7,0.5)] ring-1 ring-white/10 text-left"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 bg-carbon-panel border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2.5">
          <PanelLeft className="w-3.5 h-3.5 text-white/40" />
          <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
          <ChevronRight className="w-3.5 h-3.5 text-white/25" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 bg-carbon-deep rounded-md px-6 py-1 text-[10px] text-white/60">
            <Lock className="w-2.5 h-2.5 text-white/40" />
            everdeck.ai/markets/senior-health
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <RotateCw className="w-3.5 h-3.5 text-white/40" />
          <Share className="w-3.5 h-3.5 text-white/40" />
          <Plus className="w-3.5 h-3.5 text-white/40" />
          <Monitor className="w-3.5 h-3.5 text-white/40" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-[22%] shrink-0 border-r border-white/5 bg-carbon px-3 py-3.5">
          <div className="flex items-center gap-1.5 px-1 text-white/85">
            <Logo gradient className="w-4 h-4" />
            <span className="text-[11px] font-medium tracking-tight">
              Everdeck
            </span>
          </div>

          <div className="mt-4 px-2 text-[8px] tracking-wider text-white/30">
            MARKETS
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1.5">
            <span className="animate-pulse-dot w-1.5 h-1.5 shrink-0 rounded-full bg-white/90" />
            <span className="text-[10px] text-white/85">Senior Health</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 px-2 py-1.5">
            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-white/20" />
            <span className="text-[10px] text-white/50">Home Coffee</span>
          </div>

          <nav className="mt-4 space-y-0.5">
            {SIDEBAR_NAV.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${
                  active ? "bg-white/[0.07] text-white/90" : "text-white/55"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </nav>

          <div className="mt-5 rounded-lg bg-white/[0.04] ring-1 ring-white/10 px-2.5 py-2">
            <div className="flex items-center gap-1 text-[9px] font-medium">
              <Sparkles className="w-2.5 h-2.5 text-white/70" />
              <span className="text-iridescent">Fresh hand dealt</span>
            </div>
            <div className="mt-0.5 text-[8px] leading-relaxed text-white/45">
              3 new ideas scored this morning
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  Senior Health
                </span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-medium text-white/75">
                  SCAN COMPLETE
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-white/45">
                Daily scan finished 6:04 AM — 12 niches, 412 open gaps
              </div>
            </div>
            <div className="bg-iridescent flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium text-ink">
              <Sparkles className="w-3 h-3" />
              Generate ideas
            </div>
          </div>

          {/* Stats with sparklines */}
          <div className="mt-3.5 grid grid-cols-4 divide-x divide-white/5 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
            {STATS.map((stat, statIndex) => (
              <div key={stat.label} className="px-3.5 py-3">
                <div className="text-[8px] tracking-wider text-white/35">
                  {stat.label}
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-xl font-medium text-white tabular-nums">
                      {stat.value}
                    </div>
                    <div className="mt-0.5 text-[9px] text-white/40">
                      {stat.detail}
                    </div>
                  </div>
                  <div className="flex items-end gap-[3px] pb-0.5">
                    {stat.bars.map((h, barIndex) => (
                      <span
                        key={barIndex}
                        className="animate-grow-bar w-[3px] rounded-sm bg-white/30 last:bg-white/90"
                        style={{
                          height: h,
                          animationDelay: `${0.7 + statIndex * 0.12 + barIndex * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-5 gap-3">
            {/* Top ideas */}
            <div className="col-span-2 rounded-xl bg-white/[0.03] ring-1 ring-white/5">
              <div className="border-b border-white/5 px-3.5 py-2 text-[10px] text-white/70">
                Today's hand
              </div>
              <div className="divide-y divide-white/5">
                {TOP_IDEAS.map((idea) => (
                  <div key={idea.title} className="px-3.5 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] leading-snug text-white/80">
                        {idea.title}
                      </span>
                      <ScorePill score={idea.score} />
                    </div>
                    <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="bg-iridescent h-full rounded-full"
                        style={{ width: `${idea.demand}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap feed with scanning sweep */}
            <div className="col-span-3 relative overflow-hidden rounded-xl bg-white/[0.03] ring-1 ring-white/5">
              <div className="animate-sweep pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
              <div className="flex items-center justify-between border-b border-white/5 px-3.5 py-2">
                <span className="text-[10px] text-white/70">Gap feed</span>
                <span className="text-[9px] text-white/35">
                  Live from search & forums
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {GAP_FEED.map((gap) => (
                  <div
                    key={gap.pain}
                    className="flex items-center gap-3 px-3.5 py-[7px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white/70">
                      {gap.pain}
                    </span>
                    <span className="shrink-0 text-[9px] tabular-nums text-white/40">
                      {gap.volume}
                    </span>
                    {gap.live ? (
                      <span className="relative shrink-0 w-[52px] text-right text-[9px]">
                        <span className="animate-status-swap text-white/45 motion-reduce:opacity-0">
                          Scoring…
                        </span>
                        <span className="animate-status-swap absolute inset-y-0 right-0 text-white/85 [animation-delay:-4s]">
                          Scored 79
                        </span>
                      </span>
                    ) : (
                      <span className="shrink-0 w-[52px] text-right text-[9px] text-white/85">
                        Scored
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/5 px-3.5 py-1.5">
                <span className="text-[8px] text-white/30">
                  Next scan in 14h 22m
                </span>
                <span className="text-[8px] text-white/30">
                  408 more gaps →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
