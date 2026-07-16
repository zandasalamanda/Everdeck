-- The worker reads provider API keys from Vault at runtime. No Edge Function
-- secrets store is reachable in this environment (no Supabase CLI / access
-- token / MCP secrets tool), so keys live in Vault and this RPC hands them to
-- the service-role worker only. Security mirrors get_worker_token exactly:
-- SECURITY DEFINER, empty search_path, EXECUTE revoked from public/anon/
-- authenticated and granted to service_role only. Never expose to a tenant.
--
-- The secret values themselves are inserted out-of-band via
-- vault.create_secret('<key>', 'GEMINI_API_KEY') and
-- vault.create_secret('<key>', 'GOOGLE_MAPS_API_KEY') — never committed.
create or replace function public.get_provider_config()
returns jsonb
language sql
security definer
set search_path to ''
as $function$
  select jsonb_build_object(
    'gemini_api_key',      (select decrypted_secret from vault.decrypted_secrets where name = 'GEMINI_API_KEY'),
    'google_maps_api_key', (select decrypted_secret from vault.decrypted_secrets where name = 'GOOGLE_MAPS_API_KEY')
  );
$function$;

revoke execute on function public.get_provider_config() from public;
revoke execute on function public.get_provider_config() from anon;
revoke execute on function public.get_provider_config() from authenticated;
grant execute on function public.get_provider_config() to service_role;
