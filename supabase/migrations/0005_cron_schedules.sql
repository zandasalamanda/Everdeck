-- Applied to prod as `cron_schedules`. Daily autonomous run + queue drain:
-- pg_cron fires pg_net POSTs at the worker Edge Function, authenticated
-- with the vault-stored worker token (no secrets in code or repo).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'everdeck-tick',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := 'https://fxrnuoahfzzdsepwvzux.supabase.co/functions/v1/worker?task=tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-token', (select decrypted_secret from vault.decrypted_secrets where name = 'worker_token')
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'everdeck-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://fxrnuoahfzzdsepwvzux.supabase.co/functions/v1/worker?task=daily',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-token', (select decrypted_secret from vault.decrypted_secrets where name = 'worker_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
