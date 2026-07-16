-- prospects has no updated_at column; drop it from the status write in pursue_prospect.
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

  update public.prospects set status = 'pursuing' where id = p_prospect_id;
  perform public.enqueue_job(
    p_account_id => v_acc, p_run_id => v_p.run_id, p_stage => 3,
    p_payload => jsonb_build_object('prospect_id', p_prospect_id));
  return 'pursuing';
end; $function$;
