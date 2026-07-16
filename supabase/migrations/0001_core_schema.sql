-- Everdeck core schema. Multi-tenant: every row hangs off an account_id.
-- RLS is enabled on every table in 0002.

create extension if not exists pgcrypto;

create schema if not exists private;

-- ---------- Tenancy ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.account_members (
  account_id uuid not null references public.accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (account_id, user_id)
);

-- Membership check used by every RLS policy. SECURITY DEFINER so it can
-- read account_members without recursive policy evaluation.
create or replace function private.is_account_member(acc uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.account_members m
    where m.account_id = acc and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_account_member(uuid) from public;
grant execute on function private.is_account_member(uuid) to authenticated;

-- ---------- Markets & the mind-map tree ----------

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  name text not null,
  mode text not null default 'directed' check (mode in ('autonomous', 'directed')),
  created_at timestamptz not null default now()
);

create table public.market_nodes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  parent_id uuid references public.market_nodes (id) on delete cascade,
  node_type text not null check (node_type in ('core', 'category', 'subcategory', 'niche', 'subniche')),
  label text not null,
  depth int not null check (depth between 0 and 4),
  created_at timestamptz not null default now(),
  unique (market_id, parent_id, label)
);
create index market_nodes_market_idx on public.market_nodes (market_id);
create index market_nodes_parent_idx on public.market_nodes (parent_id);

-- ---------- Pipeline runs & durable job queue ----------

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  market_id uuid references public.markets (id) on delete set null,
  mode text not null check (mode in ('autonomous', 'directed')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error')),
  stage_progress jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index runs_account_idx on public.runs (account_id, created_at desc);

create table public.jobs (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  run_id uuid not null references public.runs (id) on delete cascade,
  stage int not null check (stage between 1 and 5),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error', 'dead')),
  attempts int not null default 0,
  max_attempts int not null default 4,
  run_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now()
);
create index jobs_drain_idx on public.jobs (status, run_at) where status = 'queued';

-- ---------- Pipeline outputs ----------

create table public.pain_points (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  node_id uuid not null references public.market_nodes (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,
  heading text not null,
  summary text not null,
  frequency text,
  intensity text,
  priority_rank int,
  grounding text not null default 'synthetic' check (grounding in ('synthetic', 'reddit')),
  created_at timestamptz not null default now()
);
create index pain_points_node_idx on public.pain_points (node_id);

create table public.pain_quotes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  pain_point_id uuid not null references public.pain_points (id) on delete cascade,
  quote text not null,
  source_url text
);
create index pain_quotes_pp_idx on public.pain_quotes (pain_point_id);

-- One row per generated solution concept (Stage 4). The "ideas" of the deck.
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  node_id uuid not null references public.market_nodes (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,
  framework text not null check (framework in ('segmentation', 'differentiation', 'business_model', 'distribution', 'new_paradigm')),
  name text not null,
  explanation text not null,
  features jsonb not null default '[]'::jsonb,
  value_prop text,
  business_model text,
  pain_addressed text,
  differentiator text,
  score numeric not null default 0 check (score >= 0 and score <= 100),
  tier text not null default 'low' check (tier in ('high', 'med', 'low')),
  grounding text not null default 'synthetic' check (grounding in ('synthetic', 'reddit')),
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (account_id, dedupe_key)
);
create index ideas_node_idx on public.ideas (node_id);
create index ideas_account_created_idx on public.ideas (account_id, created_at desc);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  node_id uuid not null references public.market_nodes (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  rank int not null check (rank between 1 and 3),
  rationale text not null,
  created_at timestamptz not null default now(),
  unique (node_id, run_id, rank)
);

create table public.landing_prompts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.idea_signals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('star', 'rating', 'archive')),
  value int,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id, kind)
);

create table public.usage_events (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  run_id uuid references public.runs (id) on delete set null,
  stage int,
  provider text not null,
  model text,
  request_count int not null default 1,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  created_at timestamptz not null default now()
);
create index usage_events_account_idx on public.usage_events (account_id, created_at desc);

-- ---------- Billing ----------

create table public.plans (
  plan text primary key,
  daily_runs int not null,
  ideas_per_run int not null,
  landing_prompts boolean not null,
  engine boolean not null
);

insert into public.plans (plan, daily_runs, ideas_per_run, landing_prompts, engine) values
  ('free',    1,  5,  false, false),
  ('pro',     3,  15, true,  true),
  ('founder', 10, 40, true,  true);

create table public.subscriptions (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  plan text not null default 'free' references public.plans (plan),
  status text not null default 'active',
  source text not null default 'sandbox' check (source in ('stripe', 'sandbox')),
  stripe_customer_id text,
  stripe_subscription_id text,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- Editable pipeline prompts (seeded in 0003) ----------

create table public.prompt_configs (
  id uuid primary key default gen_random_uuid(),
  stage int not null unique check (stage between 1 and 5),
  name text not null,
  system_prompt text not null,
  model text not null default 'gemini-2.0-flash',
  max_output_tokens int not null default 4096,
  updated_at timestamptz not null default now()
);

-- ---------- Signup bootstrap ----------
-- Creates profile + default account + membership + free subscription for
-- every new auth user.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc_id uuid;
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email, ''), split_part(coalesce(new.email, 'founder'), '@', 1));

  insert into public.accounts (name, owner_id)
  values (split_part(coalesce(new.email, 'My workspace'), '@', 1) || '''s deck', new.id)
  returning id into acc_id;

  insert into public.account_members (account_id, user_id, role)
  values (acc_id, new.id, 'owner');

  insert into public.subscriptions (account_id, plan, status, source)
  values (acc_id, 'free', 'active', 'sandbox');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
