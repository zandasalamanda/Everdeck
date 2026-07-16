"use client";

import { useSession } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/publicConfig";

/**
 * Browser Supabase client bound to the current Clerk session. Every request
 * carries the Clerk JWT, which Supabase validates (third-party auth) and RLS
 * scopes by `auth.jwt()->>'sub'`.
 */
export function useSupabase() {
  const { session } = useSession();

  return useMemo(
    () =>
      createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        async accessToken() {
          return (await session?.getToken()) ?? null;
        },
      }),
    [session],
  );
}
