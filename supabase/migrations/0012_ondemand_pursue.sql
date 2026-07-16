-- Decouple discovery (cheap, all businesses, no LLM) from generation (metered,
-- on-demand — the user gives the order). This is what stops the token burn and
-- the 429 storms: a hunt no longer auto-generates a mockup for every result.

-- Discovery breadth is now generous and cheap; the metered resource is "pursues"
-- (a mockup + build brief + outreach, generated only when the user asks).
alter table public.plans add column if not exists prospects_per_hunt int not null default 20;
alter table public.plans add column if not exists pursues_per_month int not null default 10;

-- The build brief: a copy-paste spec for Claude Code / v0 / Cursor to build the real site.
alter table public.mockups add column if not exists brief text;

update public.plans set prospects_per_hunt=20, pursues_per_month=10,   daily_runs=3   where plan='free';
update public.plans set prospects_per_hunt=20, pursues_per_month=200,  daily_runs=25  where plan='pro';
update public.plans set prospects_per_hunt=25, pursues_per_month=1000, daily_runs=200 where plan='founder';

-- On-demand pursue: gate on the monthly pursue budget, then enqueue generation
-- for exactly one prospect. Idempotent + retry-safe.
create or replace function public.pursue_prospect(p_prospect_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_acc uuid; v_plan record; v_used int; v_p record; v_active boolean;
begin
  select account_id into v_acc from public.account_members where user_id = private.app_uid() limit 1;
  if v_acc is null then raise exception 'no_account' using errcode='42501'; end if;

  select * into v_p from public.prospects where id = p_prospect_id and account_id = v_acc;
  if v_p is null then raise exception 'not_found' using errcode='42501'; end if;

  if exists (select 1 from public.mockups m where m.prospect_id = p_prospect_id) then
    return 'ready';
  end if;

  select exists (
    select 1 from public.jobs j
    where j.run_id = v_p.run_id and j.stage = 3
      and (j.payload->>'prospect_id') = p_prospect_id::text
      and j.status in ('queued','running')
  ) into v_active;
  if v_active then return 'pursuing'; end if;

  select p.* into v_plan from public.subscriptions s join public.plans p on p.plan = s.plan
    where s.account_id = v_acc and s.status in ('active','trialing');
  if v_plan is null then raise exception 'no_active_subscription' using errcode='42501'; end if;

  select count(*) into v_used from public.mockups m
    where m.account_id = v_acc and m.created_at >= date_trunc('month', now());
  if v_used >= v_plan.pursues_per_month then raise exception 'plan_gate:pursues' using errcode='42501'; end if;

  update public.prospects set status = 'pursuing', updated_at = now() where id = p_prospect_id;
  perform public.enqueue_job(
    p_account_id => v_acc, p_run_id => v_p.run_id, p_stage => 3,
    p_payload => jsonb_build_object('prospect_id', p_prospect_id));
  return 'pursuing';
end; $function$;

revoke execute on function public.pursue_prospect(uuid) from public;
grant execute on function public.pursue_prospect(uuid) to authenticated;

-- Usage helper for the UI: pursues used / allowed this month.
create or replace function public.pursue_usage()
returns table(used int, allowed int)
language sql
security definer
set search_path to 'public'
as $function$
  select
    (select count(*)::int from public.mockups m
       join public.account_members am on am.account_id = m.account_id
      where am.user_id = private.app_uid() and m.created_at >= date_trunc('month', now())),
    (select coalesce(pl.pursues_per_month, 0)::int
       from public.account_members am
       join public.subscriptions s on s.account_id = am.account_id and s.status in ('active','trialing')
       join public.plans pl on pl.plan = s.plan
      where am.user_id = private.app_uid() limit 1);
$function$;

revoke execute on function public.pursue_usage() from public;
grant execute on function public.pursue_usage() to authenticated;
