// Runtime config resolver for the provider seams.
//
// No Edge Function secret store is reachable from here (no CLI / Management API
// / MCP secrets tool), so the worker loads provider keys from Supabase Vault and
// stashes them via setOverride(). The seams read every setting through env():
// overrides win, then Deno.env — so mock/local still works with plain env, and
// Vault-loaded keys enable the live providers. This exists because Deno.env.set
// is a no-op in the Supabase edge runtime; a module-level Map is not.
const overrides = new Map<string, string>();

export function setOverride(key: string, value: string | null | undefined): void {
  if (value != null && value !== "") overrides.set(key, value);
}

export function env(key: string): string | undefined {
  return overrides.get(key) ?? Deno.env.get(key);
}
