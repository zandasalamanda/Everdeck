import { describe, expect, it } from "vitest";

import { mockComplete, mockDiscussions } from "../supabase/functions/_shared/mock";

const base = { system: "", model: "mock", maxOutputTokens: 4096 };

describe("mock LLM provider", () => {
  it("stage 1 directed returns a parseable tree rooted at the market", () => {
    const out = mockComplete({
      ...base,
      user: "STAGE: 1\nMODE: directed\nMARKET: senior health",
      seed: "senior health",
    });
    const tree = JSON.parse(out) as { nodes: { label: string; type: string; children: unknown[] }[] };
    expect(tree.nodes).toHaveLength(1);
    expect(tree.nodes[0].label).toBe("senior health");
    expect(tree.nodes[0].type).toBe("core");
    expect(tree.nodes[0].children.length).toBeGreaterThan(0);
  });

  it("stage 1 autonomous spans Health, Wealth, Relationships", () => {
    const out = mockComplete({
      ...base,
      user: "STAGE: 1\nMODE: autonomous\nMARKET: Autonomous scan",
      seed: "scan-2026-07-15",
    });
    const tree = JSON.parse(out) as { nodes: { label: string }[] };
    expect(tree.nodes.map((n) => n.label)).toEqual(["Health", "Wealth", "Relationships"]);
  });

  it("is deterministic for the same seed", () => {
    const req = { ...base, user: "STAGE: 4\nMARKET: home coffee", seed: "home coffee" };
    expect(mockComplete(req)).toBe(mockComplete(req));
  });

  it("stage 3 emits pain points with 3-5 verbatim quotes each and a priority ranking", () => {
    const out = mockComplete({ ...base, user: "STAGE: 3\nMARKET: sleep tech", seed: "sleep tech" });
    const parsed = JSON.parse(out) as {
      pain_points: { heading: string; quotes: string[] }[];
      priority_ranking: string[];
    };
    expect(parsed.pain_points.length).toBeGreaterThanOrEqual(3);
    for (const pp of parsed.pain_points) {
      expect(pp.quotes.length).toBeGreaterThanOrEqual(3);
      expect(pp.quotes.length).toBeLessThanOrEqual(5);
    }
    expect(parsed.priority_ranking).toEqual(parsed.pain_points.map((p) => p.heading));
  });

  it("stage 4 emits five framework concepts with bounded scores and a ranked top-3", () => {
    const out = mockComplete({ ...base, user: "STAGE: 4\nMARKET: youth sports", seed: "youth sports" });
    const parsed = JSON.parse(out) as {
      concepts: { framework: string; score: number }[];
      top3: { rank: number }[];
    };
    expect(parsed.concepts).toHaveLength(5);
    expect(new Set(parsed.concepts.map((c) => c.framework))).toEqual(
      new Set(["segmentation", "differentiation", "business_model", "distribution", "new_paradigm"]),
    );
    for (const c of parsed.concepts) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
    expect(parsed.top3.map((t) => t.rank)).toEqual([1, 2, 3]);
  });

  it("stage 5 emits a Before-After-Bridge landing prompt mentioning the idea", () => {
    const out = mockComplete({
      ...base,
      user: "STAGE: 5\nMARKET: senior health\nIDEA: Fall-Alert Pendant",
      seed: "Fall-Alert Pendant",
    });
    expect(out).toContain("ABOVE THE FOLD");
    expect(out).toContain("BEFORE");
    expect(out).toContain("AFTER");
    expect(out).toContain("Fall-Alert Pendant");
  });

  it("synthetic discussions are clearly labeled as synthetic", () => {
    expect(mockDiscussions("senior health")).toContain("SYNTHETIC DISCUSSION DATA");
  });
});
