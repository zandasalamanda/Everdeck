-- Seed the five pipeline prompts (editable at runtime via this table) and
-- the security-definer RPCs that are the ONLY client path into the engine.
-- Plan gating is enforced here, server-side, not in the UI.

insert into public.prompt_configs (stage, name, system_prompt, model, max_output_tokens) values
(1, 'Market Expander',
'You are a business strategy and market segmentation expert. Generate a deep hierarchy across the three core markets Health, Wealth, Relationships: Core Market -> Category -> Subcategory -> Niche -> Sub-Niche, as many as possible, no overlap, each node unique. Random request -> expand across all three; specific-subcategory request -> expand only beneath that node within its core market, don''t mention the others. Output only the structured hierarchy as JSON: {"nodes":[{"label":string,"type":"core|category|subcategory|niche|subniche","children":[...]}]}.',
'gemini-2.0-flash', 8192),

(2, 'Reddit Pain-Point Search Query',
'Build the exact search query for the target market and return fetched discussion text. Query template: "{MARKET}" (site:reddit.com inurl:comments|inurl:thread | intext:"I think"|"I feel"|"I was"|"I have been"|"I experienced"|"my experience"|"in my opinion"|"IMO"|"my biggest struggle"|"my biggest fear"|"I found that"|"I learned"|"I realized"|"my advice"|"struggles"|"problems"|"issues"|"challenge"|"difficulties"|"hardships"|"pain point"|"barriers"|"obstacles"|"concerns"|"frustrations"|"worries"|"hesitations"|"what I wish I knew"|"what I regret")',
'none', 0),

(3, 'Pain Point Extractor',
'You are an expert Market Research Analyst. Analyze the provided Reddit conversations; identify distinct pain points/problems/frustrations; organize into clear thematic categories; extract EVERY valuable pain point. For each: a descriptive heading, a 1-2 sentence summary, 3-5 verbatim user quotes, and a frequency/intensity note. Include specific problems, frustrations with existing solutions, unmet needs, workarounds, usage scenarios, emotional impact; exclude general chatter, advice-seeking without a described problem, generic complaints, success stories (unless contrasting a problem), news/politics. End with a Priority Ranking by frequency, intensity, specificity, solvability. Preserve exact original language. Output JSON: {"pain_points":[{"heading":string,"summary":string,"quotes":[string],"frequency":string,"intensity":string}],"priority_ranking":[heading strings in priority order]}.',
'gemini-2.0-flash', 8192),

(4, 'Market Gap Generator',
'You are an expert Business Opportunity Strategist. From the provided pain points, generate solutions using five frameworks - Market Segmentation, Product Differentiation, Business Model Innovation, Distribution & Marketing, New Paradigm - considering both capturing existing demand and creating new demand. Per concept: clear name, 2-3 sentence explanation, key features, primary value proposition, potential business model, how it addresses the pain, and a unique differentiator / "best-in-category" assessment. Conclude with a ranked top-3 by market size/growth, competitive-advantage sustainability, implementation feasibility, and category-dominance potential. Prioritize practical, implementable ideas. Output JSON: {"concepts":[{"framework":"segmentation|differentiation|business_model|distribution|new_paradigm","name":string,"explanation":string,"features":[string],"value_prop":string,"business_model":string,"pain_addressed":string,"differentiator":string,"score":0-100}],"top3":[{"name":string,"rank":1|2|3,"rationale":string}]}.',
'gemini-2.0-flash-thinking', 8192),

(5, 'Landing Page Prompt Generator',
'You are an expert conversion copywriter and landing-page build expert. From the gathered pain points, exact customer language, and chosen solution, emit a complete, copy-pasteable landing-page build prompt using Before-After-Bridge. Specify: Above the Fold (headline in customer wording, subheadline of who/what/why-different, 3-5 benefit bullets each backed by a feature, clear CTA); Current Pain "Before" (connecting title, 3 pain paragraphs in customer language, belief-deconstruction of why past solutions failed); Desired Outcome "After" (transformation title, 3 emotion-linked outcome blocks, new-paradigm intro); Introducing the Product (name + description, 3-step how-it-works, founder message, urgent final CTA); plus features, testimonials, pricing, FAQ, footer, signup form. Emit it in the Everdeck house style. Output only the final build prompt.',
'gemini-2.0-flash-thinking', 8192);

-- ---------- Gated entry points ----------

-- Starts a pipeline run. Enforces: membership, plan daily-run limit, and
-- (for autonomous mode) the plan''s engine flag.
create or replace function public.start_run(
  p_account_id uuid,
  p_mode text,
  p_market_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan record;
  v_runs_today int;
  v_market_id uuid;
  v_run_id uuid;
begin
  if not private.is_account_member(p_account_id) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  if p_mode not in ('autonomous', 'directed') then
    raise exception 'invalid_mode';
  end if;

  select p.* into v_plan
  from public.subscriptions s
  join public.plans p on p.plan = s.plan
  where s.account_id = p_account_id and s.status in ('active', 'trialing');

  if v_plan is null then
    raise exception 'no_active_subscription' using errcode = '42501';
  end if;

  if p_mode = 'autonomous' and not v_plan.engine then
    raise exception 'plan_gate:engine' using errcode = '42501';
  end if;

  select count(*) into v_runs_today
  from public.runs r
  where r.account_id = p_account_id
    and r.created_at >= date_trunc('day', now());

  if v_runs_today >= v_plan.daily_runs then
    raise exception 'plan_gate:daily_runs' using errcode = '42501';
  end if;

  if p_mode = 'directed' then
    if p_market_name is null or length(trim(p_market_name)) < 2 then
      raise exception 'market_name_required';
    end if;
    select id into v_market_id from public.markets
    where account_id = p_account_id and lower(name) = lower(trim(p_market_name));
    if v_market_id is null then
      insert into public.markets (account_id, name, mode)
      values (p_account_id, trim(p_market_name), 'directed')
      returning id into v_market_id;
    end if;
  else
    insert into public.markets (account_id, name, mode)
    values (p_account_id, 'Autonomous scan ' || to_char(now(), 'YYYY-MM-DD'), 'autonomous')
    returning id into v_market_id;
  end if;

  insert into public.runs (account_id, market_id, mode, status)
  values (p_account_id, v_market_id, p_mode, 'queued')
  returning id into v_run_id;

  insert into public.jobs (account_id, run_id, stage, payload)
  values (p_account_id, v_run_id, 1, jsonb_build_object(
    'market_id', v_market_id,
    'market_name', p_market_name,
    'mode', p_mode
  ));

  return v_run_id;
end;
$$;

revoke all on function public.start_run(uuid, text, text) from public;
grant execute on function public.start_run(uuid, text, text) to authenticated;

-- Requests a landing-page prompt for an idea (Stage 5). Plan-gated.
create or replace function public.request_landing_prompt(p_idea_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_idea record;
  v_plan record;
  v_run_id uuid;
  v_job_id bigint;
begin
  select * into v_idea from public.ideas where id = p_idea_id;
  if v_idea is null or not private.is_account_member(v_idea.account_id) then
    raise exception 'not_found' using errcode = '42501';
  end if;

  select p.* into v_plan
  from public.subscriptions s
  join public.plans p on p.plan = s.plan
  where s.account_id = v_idea.account_id and s.status in ('active', 'trialing');

  if v_plan is null or not v_plan.landing_prompts then
    raise exception 'plan_gate:landing_prompts' using errcode = '42501';
  end if;

  insert into public.runs (account_id, market_id, mode, status)
  values (v_idea.account_id, v_idea.market_id, 'directed', 'queued')
  returning id into v_run_id;

  insert into public.jobs (account_id, run_id, stage, payload)
  values (v_idea.account_id, v_run_id, 5, jsonb_build_object('idea_id', p_idea_id))
  returning id into v_job_id;

  return v_job_id;
end;
$$;

revoke all on function public.request_landing_prompt(uuid) from public;
grant execute on function public.request_landing_prompt(uuid) to authenticated;

-- Today's deck: freshest scored ideas, RLS-respecting (security_invoker).
create or replace view public.v_todays_deck
with (security_invoker = true)
as
select i.*, a.rank as top_rank, a.rationale as top_rationale
from public.ideas i
left join public.assessments a on a.idea_id = i.id
where i.created_at >= date_trunc('day', now())
order by i.score desc;

-- Applied as separate migration `tighten_rpc_grants` after advisor review:
revoke execute on function public.start_run(uuid, text, text) from anon;
revoke execute on function public.request_landing_prompt(uuid) from anon;
