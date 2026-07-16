import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/publicConfig";

/**
 * Server-side Supabase client that authenticates as the current Clerk user.
 *
 * Clerk is registered as a Supabase third-party auth provider, so Supabase
 * validates the Clerk session JWT and RLS reads `auth.jwt()->>'sub'`. The
 * client never sees the service-role key — RLS is the entire boundary.
 */
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    async accessToken() {
      const { getToken } = await auth();
      return (await getToken()) ?? null;
    },
  });
}
