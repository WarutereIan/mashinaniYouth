/** Feature flags for incremental Supabase rollout. */
export function isSupabaseReferenceDataEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_REFERENCE_DATA;
  return v === "true" || v === "1" || isSupabaseBackendEnabled();
}

export function isSupabaseVotersEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_VOTERS;
  return v === "true" || v === "1" || isSupabaseBackendEnabled();
}

export function isSupabaseVotingEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_VOTING;
  return v === "true" || v === "1" || isSupabaseBackendEnabled();
}

export function isSupabaseAnalyticsEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_ANALYTICS;
  return v === "true" || v === "1" || isSupabaseBackendEnabled();
}

export function isSupabaseSupportEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_SUPPORT;
  return v === "true" || v === "1" || isSupabaseBackendEnabled();
}

/** Master switch — enables all Supabase-backed slices (2–8). */
export function isSupabaseBackendEnabled(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_BACKEND;
  return v === "true" || v === "1";
}
