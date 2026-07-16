-- Won / revenue tracking: record what a won prospect was worth.
alter table public.prospects add column if not exists deal_value numeric;

-- Replace the 2-arg set_prospect_status with a 3-arg version that keeps the old
-- calls working (the new param has a default). Drop the old signature first so
-- there is no ambiguous overload for PostgREST to resolve.
drop function if exists public.set_prospect_status(uuid, text);

create or replace function public.set_prospect_status(
  p_prospect_id uuid,
  p_status text,
  p_deal_value numeric default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_acc uuid;
begin
  select account_id into v_acc from public.prospects where id = p_prospect_id;
  if v_acc is null or not private.is_account_member(v_acc) then
    raise exception 'not_found' using errcode='42501'; end if;
  if p_status not in ('new','audited','ready','in_dock','sent','replied','won','lost','skipped') then
    raise exception 'bad_status'; end if;
  update public.prospects
     set status = p_status,
         -- deal value is only meaningful for a won deal; leave it untouched otherwise
         deal_value = case
           when p_status = 'won' and p_deal_value is not null then p_deal_value
           else deal_value
         end
   where id = p_prospect_id;
end; $function$;

revoke execute on function public.set_prospect_status(uuid, text, numeric) from public;
revoke execute on function public.set_prospect_status(uuid, text, numeric) from anon;
grant execute on function public.set_prospect_status(uuid, text, numeric) to authenticated;
