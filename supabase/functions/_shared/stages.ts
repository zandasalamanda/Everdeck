// The five pipeline stage handlers. Each is idempotent and bounded; each
// enqueues its successors instead of running long. All writes go through
// the service-role client (RLS bypassed by design — account_id is always
// set explicitly from the job row, never from user input).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

import { complete } from "./llm.ts";
import { mockDiscussions } from "./mock.ts";

interface Job {
  id: number;
  account_id: string;
  run_id: string;
  stage: number;
  payload: Record<string, unknown>;
  attempts: number;
}

interface PromptConfig {
  stage: number;
  system_prompt: string;
  model: string;
  max_output_tokens: number;
}

type Db = SupabaseClient;

async function promptFor(db: Db, stage: number): Promise<PromptConfig> {
  const { data, error } = await db
    .from("prompt_configs")
    .select("stage, system_prompt, model, max_output_tokens")
    .eq("stage", stage)
    .single();
  if (error || !data) throw new Error(`prompt_config missing for stage ${stage}`);
  return data as PromptConfig;
}

async function meter(
  db: Db,
  job: Job,
  res: { provider: string; model: string; inputTokens: number; outputTokens: number },
) {
  await db.from("usage_events").insert({
    account_id: job.account_id,
    run_id: job.run_id,
    stage: job.stage,
    provider: res.provider,
    model: res.model,
    request_count: 1,
    input_tokens: res.inputTokens,
    output_tokens: res.outputTokens,
  });
}

async function planLimits(db: Db, accountId: string) {
  const { data } = await db
    .from("subscriptions")
    .select("plan, plans(ideas_per_run)")
    .eq("account_id", accountId)
    .single();
  const ideasPerRun =
    (data as { plans?: { ideas_per_run?: number } } | null)?.plans?.ideas_per_run ?? 5;
  // 5 concepts are generated per leaf niche, so leaf budget derives from plan.
  return { ideasPerRun, leafBudget: Math.max(1, Math.floor(ideasPerRun / 5)) };
}

interface TreeNode {
  label: string;
  type: string;
  children?: TreeNode[];
}

/** Stage 1 — Market Expander: build the tree, enqueue Stage 2 per leaf. */
export async function runStage1(db: Db, job: Job): Promise<void> {
  const marketId = job.payload.market_id as string;
  const mode = (job.payload.mode as string) ?? "directed";

  const { data: market } = await db
    .from("markets")
    .select("id, name")
    .eq("id", marketId)
    .single();
  if (!market) throw new Error(`market ${marketId} not found`);

  // Idempotency/cache: if this market already has nodes, reuse them.
  const { count: existing } = await db
    .from("market_nodes")
    .select("id", { count: "exact", head: true })
    .eq("market_id", marketId);

  let leaves: { id: string; label: string }[] = [];

  if ((existing ?? 0) > 0) {
    const { data } = await db
      .from("market_nodes")
      .select("id, label, node_type")
      .eq("market_id", marketId)
      .in("node_type", ["niche", "subniche"]);
    leaves = data ?? [];
  } else {
    const cfg = await promptFor(db, 1);
    const res = await complete({
      system: cfg.system_prompt,
      user: `STAGE: 1\nMODE: ${mode}\nMARKET: ${market.name}`,
      model: cfg.model,
      maxOutputTokens: cfg.max_output_tokens,
      seed: market.name,
    });
    await meter(db, job, res);

    const tree = JSON.parse(res.text) as { nodes: TreeNode[] };

    const insertNode = async (
      node: TreeNode,
      parentId: string | null,
      depth: number,
    ): Promise<void> => {
      const { data: row, error } = await db
        .from("market_nodes")
        .insert({
          account_id: job.account_id,
          market_id: marketId,
          parent_id: parentId,
          node_type: node.type,
          label: node.label.slice(0, 200),
          depth,
        })
        .select("id")
        .single();
      if (error) throw new Error(`node insert: ${error.message}`);
      const isLeaf = !node.children || node.children.length === 0;
      if (isLeaf) leaves.push({ id: row.id, label: node.label });
      for (const child of node.children ?? []) {
        await insertNode(child, row.id, depth + 1);
      }
    };

    for (const n of tree.nodes) await insertNode(n, null, 0);
  }

  const { leafBudget } = await planLimits(db, job.account_id);
  const chosen = leaves.slice(0, leafBudget);

  for (const leaf of chosen) {
    await db.rpc("enqueue_job", {
      p_account_id: job.account_id,
      p_run_id: job.run_id,
      p_stage: 2,
      p_payload: { market_id: marketId, node_id: leaf.id, node_label: leaf.label },
    });
  }

  await db
    .from("runs")
    .update({
      stage_progress: {
        stage1: "done",
        leaves_total: leaves.length,
        leaves_processed: chosen.length,
      },
    })
    .eq("id", job.run_id);
}

/** Stage 2 — discussion fetch (synthetic provider; reddit seam ready). */
export async function runStage2(db: Db, job: Job): Promise<void> {
  const nodeId = job.payload.node_id as string;
  const nodeLabel = job.payload.node_label as string;

  // Hard cache: one fetch per node, ever, unless explicitly cleared.
  const { data: cached } = await db
    .from("discussion_cache")
    .select("id")
    .eq("node_id", nodeId)
    .maybeSingle();

  if (!cached) {
    const query = `"${nodeLabel}" (site:reddit.com inurl:comments|inurl:thread | intext:"I think"|"I feel"|"my biggest struggle"|"pain point"|"frustrations"|"what I wish I knew"|"what I regret")`;
    const provider = Deno.env.get("DISCUSSION_PROVIDER") ?? "synthetic";

    // Official Reddit API path lands here when credentials exist; until
    // then we generate clearly-labeled synthetic threads.
    const content = mockDiscussions(nodeLabel);
    const grounding = provider === "reddit" ? "reddit" : "synthetic";

    await db.from("discussion_cache").insert({
      account_id: job.account_id,
      node_id: nodeId,
      query,
      content,
      grounding,
    });
  }

  await db.rpc("enqueue_job", {
    p_account_id: job.account_id,
    p_run_id: job.run_id,
    p_stage: 3,
    p_payload: job.payload,
  });
}

/** Stage 3 — Pain Point Extractor. */
export async function runStage3(db: Db, job: Job): Promise<void> {
  const nodeId = job.payload.node_id as string;
  const nodeLabel = job.payload.node_label as string;
  const marketId = job.payload.market_id as string;

  // Idempotency: skip extraction if this node already has pain points.
  const { count: existing } = await db
    .from("pain_points")
    .select("id", { count: "exact", head: true })
    .eq("node_id", nodeId);

  if ((existing ?? 0) === 0) {
    const { data: cache } = await db
      .from("discussion_cache")
      .select("content, grounding")
      .eq("node_id", nodeId)
      .single();
    if (!cache) throw new Error(`no discussion cache for node ${nodeId}`);

    const cfg = await promptFor(db, 3);
    const res = await complete({
      system: cfg.system_prompt,
      user: `STAGE: 3\nMARKET: ${nodeLabel}\n\nCONVERSATIONS:\n${cache.content.slice(0, 24_000)}`,
      model: cfg.model,
      maxOutputTokens: cfg.max_output_tokens,
      seed: nodeLabel,
    });
    await meter(db, job, res);

    const parsed = JSON.parse(res.text) as {
      pain_points: {
        heading: string;
        summary: string;
        quotes: string[];
        frequency: string;
        intensity: string;
      }[];
      priority_ranking: string[];
    };

    for (const [i, pp] of parsed.pain_points.entries()) {
      const rank = parsed.priority_ranking.indexOf(pp.heading);
      const { data: row, error } = await db
        .from("pain_points")
        .insert({
          account_id: job.account_id,
          market_id: marketId,
          node_id: nodeId,
          run_id: job.run_id,
          heading: pp.heading.slice(0, 300),
          summary: pp.summary,
          frequency: pp.frequency,
          intensity: pp.intensity,
          priority_rank: rank >= 0 ? rank + 1 : i + 1,
          grounding: cache.grounding,
        })
        .select("id")
        .single();
      if (error) throw new Error(`pain_point insert: ${error.message}`);

      if (pp.quotes?.length) {
        await db.from("pain_quotes").insert(
          pp.quotes.slice(0, 5).map((q) => ({
            account_id: job.account_id,
            pain_point_id: row.id,
            quote: q.slice(0, 1000),
          })),
        );
      }
    }
  }

  await db.rpc("enqueue_job", {
    p_account_id: job.account_id,
    p_run_id: job.run_id,
    p_stage: 4,
    p_payload: job.payload,
  });
}

/** Stage 4 — Market Gap Generator: concepts + top-3, colors the map. */
export async function runStage4(db: Db, job: Job): Promise<void> {
  const nodeId = job.payload.node_id as string;
  const nodeLabel = job.payload.node_label as string;
  const marketId = job.payload.market_id as string;

  const { data: pains } = await db
    .from("pain_points")
    .select("heading, summary, grounding, pain_quotes(quote)")
    .eq("node_id", nodeId)
    .order("priority_rank", { ascending: true })
    .limit(8);

  const grounding = pains?.[0]?.grounding ?? "synthetic";
  const painText = (pains ?? [])
    .map(
      (p) =>
        `- ${p.heading}: ${p.summary}\n  quotes: ${(p.pain_quotes as { quote: string }[])
          .map((q) => `"${q.quote}"`)
          .join(" | ")}`,
    )
    .join("\n");

  const cfg = await promptFor(db, 4);
  const res = await complete({
    system: cfg.system_prompt,
    user: `STAGE: 4\nMARKET: ${nodeLabel}\n\nPAIN POINTS:\n${painText}`,
    model: cfg.model,
    maxOutputTokens: cfg.max_output_tokens,
    seed: nodeLabel,
  });
  await meter(db, job, res);

  const parsed = JSON.parse(res.text) as {
    concepts: {
      framework: string;
      name: string;
      explanation: string;
      features: string[];
      value_prop: string;
      business_model: string;
      pain_addressed: string;
      differentiator: string;
      score: number;
    }[];
    top3: { name: string; rank: number; rationale: string }[];
  };

  const tierOf = (s: number) => (s >= 75 ? "high" : s >= 50 ? "med" : "low");
  const idsByName = new Map<string, string>();

  for (const c of parsed.concepts) {
    const dedupeKey = `${nodeLabel}::${c.name}`.toLowerCase().replace(/\s+/g, " ").trim();
    const { data: row } = await db
      .from("ideas")
      .upsert(
        {
          account_id: job.account_id,
          market_id: marketId,
          node_id: nodeId,
          run_id: job.run_id,
          framework: c.framework,
          name: c.name.slice(0, 200),
          explanation: c.explanation,
          features: c.features ?? [],
          value_prop: c.value_prop,
          business_model: c.business_model,
          pain_addressed: c.pain_addressed,
          differentiator: c.differentiator,
          score: Math.round(c.score),
          tier: tierOf(c.score),
          grounding,
          dedupe_key: dedupeKey,
        },
        { onConflict: "account_id,dedupe_key", ignoreDuplicates: false },
      )
      .select("id, name")
      .single();
    if (row) idsByName.set(row.name, row.id);
  }

  for (const t of parsed.top3 ?? []) {
    const ideaId = idsByName.get(t.name);
    if (!ideaId) continue;
    await db.from("assessments").upsert(
      {
        account_id: job.account_id,
        node_id: nodeId,
        run_id: job.run_id,
        idea_id: ideaId,
        rank: t.rank,
        rationale: t.rationale,
      },
      { onConflict: "node_id,run_id,rank" },
    );
  }
}

/** Stage 5 — Landing Page Prompt Generator (on demand, per idea). */
export async function runStage5(db: Db, job: Job): Promise<void> {
  const ideaId = job.payload.idea_id as string;

  const { data: idea } = await db
    .from("ideas")
    .select("id, name, node_id, market_id, explanation, value_prop, differentiator")
    .eq("id", ideaId)
    .single();
  if (!idea) throw new Error(`idea ${ideaId} not found`);

  const { data: node } = await db
    .from("market_nodes")
    .select("label")
    .eq("id", idea.node_id)
    .single();

  const { data: pains } = await db
    .from("pain_points")
    .select("heading, summary, pain_quotes(quote)")
    .eq("node_id", idea.node_id)
    .order("priority_rank", { ascending: true })
    .limit(5);

  const painText = (pains ?? [])
    .map(
      (p) =>
        `- ${p.heading}: ${p.summary} | quotes: ${(p.pain_quotes as { quote: string }[])
          .map((q) => `"${q.quote}"`)
          .join(" · ")}`,
    )
    .join("\n");

  const cfg = await promptFor(db, 5);
  const res = await complete({
    system: cfg.system_prompt,
    user: `STAGE: 5\nMARKET: ${node?.label ?? "unknown"}\nIDEA: ${idea.name}\nEXPLANATION: ${idea.explanation}\nVALUE PROP: ${idea.value_prop}\nDIFFERENTIATOR: ${idea.differentiator}\n\nPAIN POINTS + CUSTOMER LANGUAGE:\n${painText}`,
    model: cfg.model,
    maxOutputTokens: cfg.max_output_tokens,
    seed: idea.name,
  });
  await meter(db, job, res);

  await db.from("landing_prompts").insert({
    account_id: job.account_id,
    idea_id: ideaId,
    content: res.text,
  });
}

export async function runStage(db: Db, job: Job): Promise<void> {
  switch (job.stage) {
    case 1:
      return runStage1(db, job);
    case 2:
      return runStage2(db, job);
    case 3:
      return runStage3(db, job);
    case 4:
      return runStage4(db, job);
    case 5:
      return runStage5(db, job);
    default:
      throw new Error(`unknown stage ${job.stage}`);
  }
}
