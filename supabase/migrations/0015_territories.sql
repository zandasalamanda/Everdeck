-- Territory mode: a claimed niche+city that auto-hunts every day.
-- Additive: reuses the existing discovery pipeline (hunts + runs + stage-1 job),
-- gated on plans.engine exactly like start_hunt's autonomous path.

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  business_type text not null,
  location text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists territories_account_active_idx
  on public.territories (account_id, active);

alter table public.territories enable row level security;

create policy "territories: member select" on public.territories
  for select to authenticated using (private.is_account_member(account_id));

create policy "territories: member insert" on public.territories
  for insert to authenticated with check (private.is_account_member(account_id));

create policy "territories: member update" on public.territories
  for update to authenticated
  using (private.is_account_member(account_id))
  with check (private.is_account_member(account_id));

create policy "territories: member delete" on public.territories
  for delete to authenticated using (private.is_account_member(account_id));

-- ---------- RPCs ----------

-- Claim a territory. Engine-gated (Pro) exactly like start_hunt's autonomous path.
create or replace function public.create_territory(p_business_type text, p_location text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_acc uuid; v_plan record; v_id uuid;
begin
  select account_id into v_acc from public.account_members where user_id = private.app_uid() limit 1;
  if v_acc is null then raise exception 'no_account' using errcode='42501'; end if;
  if p_business_type is null or length(trim(p_business_type)) < 2
     or p_location is null or length(trim(p_location)) < 2 then
    raise exception 'inputs_required'; end if;
  select p.* into v_plan from public.subscriptions s join public.plans p on p.plan = s.plan
    where s.account_id = v_acc and s.status in ('active','trialing');
  if v_plan is null then raise exception 'no_active_subscription' using errcode='42501'; end if;
  if not v_plan.engine then raise exception 'plan_gate:engine' using errcode='42501'; end if;
  insert into public.territories (account_id, business_type, location)
    values (v_acc, trim(p_business_type), trim(p_location)) returning id into v_id;
  return v_id;
end; $function$;

revoke execute on function public.create_territory(text, text) from public;
revoke execute on function public.create_territory(text, text) from anon;
grant execute on function public.create_territory(text, text) to authenticated;

-- Pause / resume a territory (stops or resumes tomorrow's auto-hunt).
create or replace function public.set_territory_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_acc uuid;
begin
  select account_id into v_acc from public.account_members where user_id = private.app_uid() limit 1;
  if v_acc is null then raise exception 'no_account' using errcode='42501'; end if;
  update public.territories set active = p_active where id = p_id and account_id = v_acc;
  if not found then raise exception 'not_found' using errcode='42501'; end if;
end; $function$;

revoke execute on function public.set_territory_active(uuid, boolean) from public;
revoke execute on function public.set_territory_active(uuid, boolean) from anon;
grant execute on function public.set_territory_active(uuid, boolean) to authenticated;

-- Release a territory.
create or replace function public.delete_territory(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_acc uuid;
begin
  select account_id into v_acc from public.account_members where user_id = private.app_uid() limit 1;
  if v_acc is null then raise exception 'no_account' using errcode='42501'; end if;
  delete from public.territories where id = p_id and account_id = v_acc;
  if not found then raise exception 'not_found' using errcode='42501'; end if;
end; $function$;

revoke execute on function public.delete_territory(uuid) from public;
revoke execute on function public.delete_territory(uuid) from anon;
grant execute on function public.delete_territory(uuid) to authenticated;

-- ---------- Recurring auto-hunts ----------
-- Extend the daily cron: keep the existing generic autonomous market scan, and
-- ALSO start one directed-style hunt per active territory (engine plans only),
-- on the same pipeline start_hunt uses. Idempotent: a territory that already
-- produced a hunt today is skipped, so this is safe to call repeatedly.
create or replace function public.enqueue_daily_autonomous()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count int := 0;
  rec record;
  v_market uuid;
  v_run uuid;
  v_hunt uuid;
begin
  -- (existing) one generic autonomous market scan per engine account per day
  for rec in
    select s.account_id
    from public.subscriptions s
    join public.plans p on p.plan = s.plan
    where s.status in ('active', 'trialing') and p.engine
      and not exists (
        select 1 from public.runs r
        where r.account_id = s.account_id
          and r.mode = 'autonomous'
          and r.created_at >= date_trunc('day', now())
      )
  loop
    insert into public.markets (account_id, name, mode)
    values (rec.account_id, 'Autonomous scan ' || to_char(now(), 'YYYY-MM-DD'), 'autonomous')
    returning id into v_market;

    insert into public.runs (account_id, market_id, mode, status)
    values (rec.account_id, v_market, 'autonomous', 'queued')
    returning id into v_run;

    insert into public.jobs (account_id, run_id, stage, payload)
    values (rec.account_id, v_run, 1, jsonb_build_object('market_id', v_market, 'mode', 'autonomous'));

    v_count := v_count + 1;
  end loop;

  -- (new) territory auto-hunts: one hunt per active territory per day, on the
  -- same discovery pipeline start_hunt uses. Skips territories that already
  -- produced a hunt today so repeated calls stay idempotent.
  for rec in
    select t.account_id, t.business_type, t.location
    from public.territories t
    join public.subscriptions s on s.account_id = t.account_id
    join public.plans p on p.plan = s.plan
    where t.active
      and s.status in ('active', 'trialing')
      and p.engine
      and not exists (
        select 1 from public.hunts h
        where h.account_id = t.account_id
          and h.business_type = t.business_type
          and h.location = t.location
          and h.created_at >= date_trunc('day', now())
      )
  loop
    insert into public.hunts (account_id, business_type, location, mode)
    values (rec.account_id, rec.business_type, rec.location, 'autonomous')
    returning id into v_hunt;

    insert into public.runs (account_id, hunt_id, mode, status)
    values (rec.account_id, v_hunt, 'autonomous', 'queued')
    returning id into v_run;

    insert into public.jobs (account_id, run_id, stage, payload)
    values (rec.account_id, v_run, 1, jsonb_build_object('hunt_id', v_hunt, 'mode', 'autonomous',
      'business_type', rec.business_type, 'location', rec.location));

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;
