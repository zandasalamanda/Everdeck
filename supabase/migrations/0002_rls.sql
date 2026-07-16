-- Row-Level Security: every table locked down; membership via
-- private.is_account_member(account_id). The worker (service role)
-- bypasses RLS by design; clients only ever see their own account's rows.
-- Tables without an insert/update/delete policy are read-only to clients.

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles: own row select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles: own row update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- accounts ----------
alter table public.accounts enable row level security;

create policy "accounts: member select" on public.accounts
  for select to authenticated using (private.is_account_member(id));

create policy "accounts: owner update" on public.accounts
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ---------- account_members ----------
alter table public.account_members enable row level security;

create policy "account_members: member select" on public.account_members
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- markets ----------
alter table public.markets enable row level security;

create policy "markets: member select" on public.markets
  for select to authenticated using (private.is_account_member(account_id));

create policy "markets: member insert" on public.markets
  for insert to authenticated with check (private.is_account_member(account_id));

create policy "markets: member delete" on public.markets
  for delete to authenticated using (private.is_account_member(account_id));

-- ---------- market_nodes ----------
alter table public.market_nodes enable row level security;

create policy "market_nodes: member select" on public.market_nodes
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- runs ----------
alter table public.runs enable row level security;

create policy "runs: member select" on public.runs
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- jobs ----------
alter table public.jobs enable row level security;

create policy "jobs: member select" on public.jobs
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- pain_points ----------
alter table public.pain_points enable row level security;

create policy "pain_points: member select" on public.pain_points
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- pain_quotes ----------
alter table public.pain_quotes enable row level security;

create policy "pain_quotes: member select" on public.pain_quotes
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- ideas ----------
alter table public.ideas enable row level security;

create policy "ideas: member select" on public.ideas
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- assessments ----------
alter table public.assessments enable row level security;

create policy "assessments: member select" on public.assessments
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- landing_prompts ----------
alter table public.landing_prompts enable row level security;

create policy "landing_prompts: member select" on public.landing_prompts
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- idea_signals ----------
alter table public.idea_signals enable row level security;

create policy "idea_signals: member select" on public.idea_signals
  for select to authenticated using (private.is_account_member(account_id));

create policy "idea_signals: own insert" on public.idea_signals
  for insert to authenticated
  with check (private.is_account_member(account_id) and user_id = (select auth.uid()));

create policy "idea_signals: own update" on public.idea_signals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.is_account_member(account_id));

create policy "idea_signals: own delete" on public.idea_signals
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------- usage_events ----------
alter table public.usage_events enable row level security;

create policy "usage_events: member select" on public.usage_events
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- subscriptions ----------
alter table public.subscriptions enable row level security;

create policy "subscriptions: member select" on public.subscriptions
  for select to authenticated using (private.is_account_member(account_id));

-- ---------- plans (global, read-only) ----------
alter table public.plans enable row level security;

create policy "plans: authenticated select" on public.plans
  for select to authenticated using (true);

-- ---------- prompt_configs (global, read-only to clients) ----------
alter table public.prompt_configs enable row level security;

create policy "prompt_configs: authenticated select" on public.prompt_configs
  for select to authenticated using (true);
