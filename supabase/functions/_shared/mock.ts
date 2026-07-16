// Deterministic mock LLM. Produces realistic, structured synthetic output
// for any market label so the whole product works end-to-end with zero
// API cost. Seeded by market label: same market -> same output.

import type { LlmRequest } from "./llm.ts";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[(seed + salt * 2654435761) % arr.length];
}

const CORES = ["Health", "Wealth", "Relationships"] as const;

const CATEGORY_BANK: Record<string, string[]> = {
  Health: ["Sleep & recovery", "Longevity", "Home fitness", "Chronic care", "Mental wellness"],
  Wealth: ["Solo business", "Personal finance", "Career leverage", "Real assets", "Side income"],
  Relationships: ["Parenting", "Aging family", "Community", "Dating after 30", "Remote friendship"],
};

const NICHE_QUALIFIERS = [
  "for beginners", "for busy professionals", "on a budget", "for seniors",
  "without subscriptions", "for remote workers", "for caregivers", "at home",
];

const PAIN_TEMPLATES = [
  {
    heading: "Existing tools cost too much for what they do",
    summary: "People in {M} repeatedly say the current options are overpriced relative to the value delivered, and cancel within months.",
    quotes: [
      "I paid $40/month for {M} tooling and used maybe one feature.",
      "Everything in {M} is a subscription now and I'm so tired of it.",
      "Cancelled after 3 months. Couldn't justify the price.",
    ],
    frequency: "high",
    intensity: "high",
  },
  {
    heading: "Too complicated to get started",
    summary: "Newcomers to {M} report abandoning solutions during setup because the learning curve assumes expertise they don't have.",
    quotes: [
      "I spent a whole weekend trying to set this up for {M} and gave up.",
      "Why does every {M} product assume I already know the jargon?",
      "My biggest struggle was just knowing where to start.",
    ],
    frequency: "high",
    intensity: "medium",
  },
  {
    heading: "No trustworthy guidance, only marketing",
    summary: "Users can't find neutral, experience-based advice in {M}; every resource turns out to be selling something.",
    quotes: [
      "Every {M} 'guide' I found was an affiliate funnel in disguise.",
      "I just want someone who's actually done it to tell me what works.",
      "IMO the whole {M} space is full of people selling shovels.",
    ],
    frequency: "medium",
    intensity: "high",
  },
  {
    heading: "Solutions don't fit real constraints",
    summary: "The standard advice in {M} assumes time, money, or space that ordinary people don't have.",
    quotes: [
      "All the {M} advice assumes I have 2 free hours a day. I have 20 minutes.",
      "I live in an apartment. None of this works for me.",
      "What I wish I knew: the 'best practices' are written for a different life.",
    ],
    frequency: "medium",
    intensity: "medium",
  },
];

const CONCEPT_TEMPLATES = [
  {
    framework: "segmentation",
    name: "{M} Starter System",
    explanation: "A stripped-down offering aimed squarely at first-timers in {M} who are priced out or intimidated by pro-grade tools. It wins by serving the underserved beginner segment better than anyone.",
    features: ["Guided 15-minute onboarding", "Plain-language explanations", "One-time purchase core"],
    value_prop: "Start in {M} today without the cost or the jargon.",
    business_model: "One-time purchase with optional paid upgrades",
    pain_addressed: "Too complicated to get started; existing tools cost too much",
    differentiator: "Only player designed exclusively for the first 90 days of {M}",
    base: 82,
  },
  {
    framework: "differentiation",
    name: "No-Subscription {M} Kit",
    explanation: "Takes the most-resented property of incumbent {M} products — recurring billing — and removes it. Own-it-forever positioning with paid feature packs.",
    features: ["Pay once, own forever", "Offline-first", "Lifetime updates tier"],
    value_prop: "Everything the subscription apps do, without the subscription.",
    business_model: "One-time purchase + paid expansion packs",
    pain_addressed: "Existing tools cost too much for what they do",
    differentiator: "The only credible 'own it' alternative in {M}",
    base: 76,
  },
  {
    framework: "business_model",
    name: "{M} Co-op",
    explanation: "A membership collective where {M} practitioners pool costs for tools and expertise. The business model itself — cost-sharing — is the innovation.",
    features: ["Shared expert office hours", "Group purchasing power", "Member-only playbooks"],
    value_prop: "Pro-level {M} resources at a fraction of solo cost.",
    business_model: "Low-cost membership cooperative",
    pain_addressed: "Solutions don't fit real constraints",
    differentiator: "Members are owners; incentives point the right way",
    base: 64,
  },
  {
    framework: "distribution",
    name: "{M} in Your Feed",
    explanation: "Distribution-led play: short, trustworthy {M} guidance delivered where the audience already is, converting attention into a lightweight paid product.",
    features: ["Daily 60-second lessons", "Creator-led trust", "One-tap starter purchase"],
    value_prop: "Learn {M} in the time you already spend scrolling.",
    business_model: "Free content funnel to low-priced digital product",
    pain_addressed: "No trustworthy guidance, only marketing",
    differentiator: "Trust built in public before the sale",
    base: 58,
  },
  {
    framework: "new_paradigm",
    name: "Autopilot {M}",
    explanation: "Reframes {M} from something you manage to something that runs itself: sensible defaults, automated decisions, and intervention only on exceptions.",
    features: ["Set-and-forget defaults", "Exception alerts only", "Quarterly auto-review"],
    value_prop: "{M} handled — you only step in when it matters.",
    business_model: "Managed service subscription",
    pain_addressed: "Solutions don't fit real constraints; too complicated",
    differentiator: "First mover on full automation in {M}",
    base: 71,
  },
];

function marketFromUser(user: string): string {
  const m = user.match(/MARKET:\s*(.+)/);
  return (m ? m[1] : user).trim().slice(0, 60) || "the market";
}

function stage1(req: LlmRequest): string {
  const seed = hash(req.seed);
  const directed = req.user.includes("MODE: directed");
  const market = marketFromUser(req.user);

  if (directed) {
    const cats = [0, 1].map((i) => ({
      label: `${market} — ${pick(NICHE_QUALIFIERS, seed, i + 7)}`,
      type: "category",
      children: [0, 1].map((j) => ({
        label: `${market} ${pick(NICHE_QUALIFIERS, seed, i * 3 + j)}`,
        type: "niche",
        children: [],
      })),
    }));
    return JSON.stringify({ nodes: [{ label: market, type: "core", children: cats }] });
  }

  const nodes = CORES.map((core, c) => ({
    label: core,
    type: "core",
    children: [0, 1].map((i) => {
      const cat = pick(CATEGORY_BANK[core], seed, c * 5 + i);
      return {
        label: cat,
        type: "category",
        children: [0, 1].map((j) => ({
          label: `${cat} ${pick(NICHE_QUALIFIERS, seed, c * 7 + i * 3 + j)}`,
          type: "niche",
          children: [],
        })),
      };
    }),
  }));
  return JSON.stringify({ nodes });
}

function stage3(req: LlmRequest): string {
  const market = marketFromUser(req.user);
  const seed = hash(req.seed);
  const count = 3 + (seed % 2);
  const points = PAIN_TEMPLATES.slice(0, count).map((t) => ({
    heading: t.heading,
    summary: t.summary.replaceAll("{M}", market),
    quotes: t.quotes.map((q) => q.replaceAll("{M}", market)),
    frequency: t.frequency,
    intensity: t.intensity,
  }));
  return JSON.stringify({
    pain_points: points,
    priority_ranking: points.map((p) => p.heading),
  });
}

function stage4(req: LlmRequest): string {
  const market = marketFromUser(req.user);
  const seed = hash(req.seed);
  const concepts = CONCEPT_TEMPLATES.map((t, i) => ({
    framework: t.framework,
    name: t.name.replaceAll("{M}", market),
    explanation: t.explanation.replaceAll("{M}", market),
    features: t.features,
    value_prop: t.value_prop.replaceAll("{M}", market),
    business_model: t.business_model,
    pain_addressed: t.pain_addressed,
    differentiator: t.differentiator.replaceAll("{M}", market),
    score: Math.max(20, Math.min(95, t.base + ((seed >> (i * 4)) % 13) - 6)),
  }));
  const top3 = [...concepts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c, i) => ({
      name: c.name,
      rank: i + 1,
      rationale: `Ranked ${i + 1} on market size, defensibility, feasibility, and category-dominance potential for ${market}.`,
    }));
  return JSON.stringify({ concepts, top3 });
}

function stage5(req: LlmRequest): string {
  const market = marketFromUser(req.user);
  const ideaMatch = req.user.match(/IDEA:\s*(.+)/);
  const idea = ideaMatch ? ideaMatch[1].trim() : `a ${market} product`;
  return [
    `Build a single-page landing page for "${idea}" (market: ${market}) using the Before-After-Bridge structure, in the Everdeck house style: monochrome near-black/white, one iridescent pastel gradient accent, Instrument Serif italic accent words, generous spacing, sleek and modern.`,
    ``,
    `ABOVE THE FOLD`,
    `- Headline (customer wording): "I just want ${market} handled — without the subscription treadmill."`,
    `- Subheadline: who it's for, what it does, why it's different in one sentence.`,
    `- 3–5 benefit bullets, each tied to a concrete feature of ${idea}.`,
    `- Primary CTA: "Start free" (repeat after each major section).`,
    ``,
    `BEFORE — THE CURRENT PAIN`,
    `- Connecting title acknowledging the struggle in their words.`,
    `- 3 short paragraphs drawn from real customer language: cost resentment, setup overwhelm, distrust of marketing-driven advice.`,
    `- Belief deconstruction: why the tools they already tried couldn't work.`,
    ``,
    `AFTER — THE DESIRED OUTCOME`,
    `- Transformation title.`,
    `- 3 outcome blocks, each linked to an emotion (relief, confidence, momentum).`,
    `- Introduce the new paradigm behind ${idea}.`,
    ``,
    `BRIDGE — INTRODUCING ${idea.toUpperCase()}`,
    `- Name + one-paragraph description.`,
    `- How it works in 3 steps.`,
    `- Founder message (2–3 sentences, plain voice).`,
    `- Urgent final CTA.`,
    ``,
    `ALSO INCLUDE: feature grid, 2 testimonials (realistic, no superlatives), simple 2-tier pricing, 5-question FAQ, footer with legal links, and an email signup form wired to the CTA.`,
  ].join("\n");
}

export function mockComplete(req: LlmRequest): string {
  if (req.user.includes("STAGE: 1")) return stage1(req);
  if (req.user.includes("STAGE: 3")) return stage3(req);
  if (req.user.includes("STAGE: 4")) return stage4(req);
  if (req.user.includes("STAGE: 5")) return stage5(req);
  return JSON.stringify({ note: "mock: unrecognized stage" });
}

/** Synthetic Reddit-style discussions for Stage 2 (clearly labeled). */
export function mockDiscussions(market: string): string {
  const threads = PAIN_TEMPLATES.map(
    (t, i) =>
      `--- r/${market.toLowerCase().replace(/[^a-z0-9]+/g, "")} thread ${i + 1} ---\n` +
      t.quotes.map((q) => `u/user${i * 7 + 3}: ${q.replaceAll("{M}", market)}`).join("\n"),
  );
  return `[SYNTHETIC DISCUSSION DATA — generated by Everdeck mock provider, not fetched from Reddit]\n\n${threads.join("\n\n")}`;
}
