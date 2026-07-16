"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { GroundingBadge, TierLegend } from "@/components/app/badges";
import type { Idea, Market, MarketNode, Tier } from "@/lib/types";
import { TIER_GLYPHS } from "@/lib/types";

/** Ring color on a leaf card, taken from its best idea's tier. */
const LEAF_RING: Record<Tier, string> = {
  high: "ring-mint/40",
  med: "ring-lilac/40",
  low: "ring-white/15",
};

const TIER_TEXT: Record<Tier, string> = {
  high: "text-mint",
  med: "text-lilac",
  low: "text-white/55",
};

const TIER_DOT: Record<Tier, string> = {
  high: "bg-mint",
  med: "bg-lilac",
  low: "bg-white/40",
};

interface MapViewProps {
  markets: Market[];
  nodes: MarketNode[];
  ideas: Idea[];
}

export default function MapView({ markets, nodes, ideas }: MapViewProps) {
  // Markets arrive newest-first; default to the most recent one.
  const [marketId, setMarketId] = useState<string>(markets[0]?.id ?? "");

  const { roots, childrenByParent, ideasByNode } = useMemo(() => {
    const marketNodes = nodes.filter((n) => n.market_id === marketId);

    const byParent = new Map<string, MarketNode[]>();
    const rootNodes: MarketNode[] = [];
    for (const node of marketNodes) {
      if (node.parent_id === null) {
        rootNodes.push(node);
      } else {
        const siblings = byParent.get(node.parent_id) ?? [];
        siblings.push(node);
        byParent.set(node.parent_id, siblings);
      }
    }
    const byLabel = (a: MarketNode, b: MarketNode) => a.label.localeCompare(b.label);
    rootNodes.sort(byLabel);
    for (const siblings of byParent.values()) siblings.sort(byLabel);

    // Ideas arrive score-desc; grouping preserves that order per node.
    const byNode = new Map<string, Idea[]>();
    for (const idea of ideas) {
      if (idea.market_id !== marketId) continue;
      const list = byNode.get(idea.node_id) ?? [];
      list.push(idea);
      byNode.set(idea.node_id, list);
    }

    return { roots: rootNodes, childrenByParent: byParent, ideasByNode: byNode };
  }, [nodes, ideas, marketId]);

  return (
    <div>
      <header>
        <h1 className="text-2xl font-medium tracking-tight text-cloud">Mind map</h1>
        <p className="mt-1 text-[13px] text-white/50">
          How the engine broke each market down — and where the strongest ideas sit.
        </p>
      </header>

      {/* Market selector */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {markets.map((market) => {
          const active = market.id === marketId;
          return (
            <button
              key={market.id}
              type="button"
              onClick={() => setMarketId(market.id)}
              aria-pressed={active}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-cloud font-medium text-ink"
                  : "text-white/60 ring-1 ring-white/15 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {market.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <TierLegend />
      </div>

      {roots.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-carbon-panel p-8 text-center ring-1 ring-white/10">
          <p className="text-[14px] text-white/60">
            No nodes mapped for this market yet.
          </p>
          <p className="mt-1 text-[13px] text-white/40">
            A run is likely still in progress —{" "}
            <Link
              href="/app/runs"
              className="text-lilac hover:text-cloud hover:underline"
            >
              check your runs
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto pb-6">
          <div className="min-w-max space-y-6">
            {roots.map((root) => (
              <NodeBranch
                key={root.id}
                node={root}
                childrenByParent={childrenByParent}
                ideasByNode={ideasByNode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface NodeBranchProps {
  node: MarketNode;
  childrenByParent: Map<string, MarketNode[]>;
  ideasByNode: Map<string, Idea[]>;
}

/** One node card plus, to its right, a connected column of its children. */
function NodeBranch({ node, childrenByParent, ideasByNode }: NodeBranchProps) {
  const children = childrenByParent.get(node.id) ?? [];
  const isLeaf = children.length === 0;

  return (
    <div className="flex items-start gap-4">
      <NodeCard node={node} isLeaf={isLeaf} ideas={ideasByNode.get(node.id) ?? []} />

      {children.length > 0 && (
        <div className="flex flex-col gap-3 border-l border-white/10 pl-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="relative before:absolute before:-left-4 before:top-7 before:h-px before:w-4 before:bg-white/10"
            >
              <NodeBranch
                node={child}
                childrenByParent={childrenByParent}
                ideasByNode={ideasByNode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({
  node,
  isLeaf,
  ideas,
}: {
  node: MarketNode;
  isLeaf: boolean;
  ideas: Idea[];
}) {
  const best = ideas[0];
  const ring = isLeaf && best ? LEAF_RING[best.tier] : "ring-white/10";
  const visible = ideas.slice(0, 5);

  return (
    <div
      className={`shrink-0 rounded-2xl bg-carbon-panel p-3.5 ring-1 ${ring} ${
        isLeaf ? "w-72" : "w-56"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-white/35">
        {node.node_type}
      </div>

      <div className="mt-1 flex items-start justify-between gap-2">
        <div
          className={`flex items-baseline gap-1.5 text-[13px] font-medium leading-snug ${
            node.node_type === "core" ? "text-iridescent" : "text-white/90"
          }`}
        >
          {isLeaf && best && (
            <span aria-hidden="true" className={`text-[10px] ${TIER_TEXT[best.tier]}`}>
              {TIER_GLYPHS[best.tier]}
            </span>
          )}
          <span>{node.label}</span>
        </div>
        {isLeaf && best && <GroundingBadge grounding={best.grounding} />}
      </div>

      {isLeaf && (
        <>
          {visible.length === 0 ? (
            <p className="mt-2 text-[12px] text-white/35">No ideas yet.</p>
          ) : (
            <ul className="-mx-1.5 mt-2 space-y-0.5">
              {visible.map((idea) => (
                <li key={idea.id}>
                  <Link
                    href={`/app/idea/${idea.id}`}
                    className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-white/[0.05]"
                  >
                    <span
                      aria-hidden="true"
                      className={`text-[10px] ${TIER_TEXT[idea.tier]}`}
                    >
                      {TIER_GLYPHS[idea.tier]}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${TIER_DOT[idea.tier]}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-white/75 group-hover:text-white">
                      {idea.name}
                    </span>
                    <span className="text-[12px] tabular-nums text-white/50">
                      {idea.score}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {ideas.length > visible.length && (
            <p className="mt-1 px-1.5 text-[11px] text-white/35">
              +{ideas.length - visible.length} more at this niche
            </p>
          )}
        </>
      )}
    </div>
  );
}
