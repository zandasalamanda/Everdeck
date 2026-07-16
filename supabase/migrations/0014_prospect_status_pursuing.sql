-- Allow the new 'pursuing' status (order given, generation in flight).
alter table public.prospects drop constraint prospects_status_check;
alter table public.prospects add constraint prospects_status_check
  check (status = any (array[
    'new','audited','pursuing','ready','in_dock','sent','replied','won','lost','skipped'
  ]::text[]));
