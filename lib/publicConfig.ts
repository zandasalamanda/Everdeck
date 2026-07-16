/**
 * Public runtime configuration.
 *
 * The Supabase URL and anon key are PUBLIC values by design — they ship to
 * every browser and are safe to commit; Row-Level Security is the security
 * boundary. Environment variables override when present (e.g. to point a
 * fork at another project). The service-role key is never referenced here
 * and never exists on Vercel: privileged code runs in Supabase Edge
 * Functions, which receive it from the platform.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://fxrnuoahfzzdsepwvzux.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4cm51b2FoZnp6ZHNlcHd2enV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTU2OTQsImV4cCI6MjA5OTczMTY5NH0.EW6_pH108A-jsPWKrfqJJt19kzNzcu1mByds_aPI8n8";

/** Base URL of the deployed Supabase Edge Functions. */
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
