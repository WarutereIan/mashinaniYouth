/**
 * Live-data mode: all election / voter / voting / analytics / support
 * slices talk to Supabase. Local mock fallbacks (mym-data, voter-store)
 * are no longer used for product flows.
 *
 * Env vars `VITE_USE_SUPABASE_*` are retained for documentation only —
 * these helpers always return true.
 */

export function isSupabaseReferenceDataEnabled(): boolean {
  return true;
}

export function isSupabaseVotersEnabled(): boolean {
  return true;
}

export function isSupabaseVotingEnabled(): boolean {
  return true;
}

export function isSupabaseAnalyticsEnabled(): boolean {
  return true;
}

export function isSupabaseSupportEnabled(): boolean {
  return true;
}

/** Master switch — always on (live Supabase backend). */
export function isSupabaseBackendEnabled(): boolean {
  return true;
}
