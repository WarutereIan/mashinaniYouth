/** Feature flags for incremental Supabase rollout. */
export function useSupabaseReferenceData(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_REFERENCE_DATA;
  return v === "true" || v === "1" || useSupabaseBackend();
}

export function useSupabaseVoters(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_VOTERS;
  return v === "true" || v === "1" || useSupabaseBackend();
}

export function useSupabaseVoting(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_VOTING;
  return v === "true" || v === "1" || useSupabaseBackend();
}

export function useSupabaseAnalytics(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_ANALYTICS;
  return v === "true" || v === "1" || useSupabaseBackend();
}

export function useSupabaseSupport(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_SUPPORT;
  return v === "true" || v === "1" || useSupabaseBackend();
}

/** Master switch — enables all Supabase-backed slices (2–8). */
export function useSupabaseBackend(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_BACKEND;
  return v === "true" || v === "1";
}
