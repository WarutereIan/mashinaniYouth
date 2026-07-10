import { supabase } from "@/integrations/supabase/client";
import { useSupabaseBackend } from "@/lib/feature-flags";
import { submitCandidateFn, type SubmitCandidateInput } from "@/lib/api/submit-candidate.fn";

export type CandidateTier = "national" | "county" | "constituency" | "ward";
export type CandidateStatus = "pending" | "approved" | "rejected";

export interface Candidate {
  id: string;
  full_name: string;
  national_id: string;
  iebc_voter_number: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  tier: CandidateTier;
  position_title: string;
  position_id?: string | null;
  county: string;
  constituency: string | null;
  ward: string | null;
  party: string | null;
  slogan: string | null;
  bio: string | null;
  photo_path: string | null;
  status: CandidateStatus;
  certificate_number: string | null;
  certified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NewCandidate = Omit<
  Candidate,
  "id" | "status" | "certificate_number" | "certified_at" | "created_at" | "updated_at"
>;

export async function listCandidates(filter?: {
  tier?: CandidateTier;
  county?: string;
}): Promise<Candidate[]> {
  let q = supabase
    .from("candidates")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (filter?.tier) q = q.eq("tier", filter.tier);
  if (filter?.county) q = q.eq("county", filter.county);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Candidate[];
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Candidate | null) ?? null;
}

/**
 * Position IDs the current user is actively vying for (pending or approved).
 * Used to block self-voting: a candidate may not vote in their own position.
 * Returns an empty set when signed out or on error (fail-open for UI display;
 * the cast_vote RPC enforces the real guard authoritatively).
 */
export async function getMyCandidatePositionIds(): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("candidates")
    .select("position_id")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .not("position_id", "is", null);
  if (error) return new Set();
  return new Set(
    (data ?? [])
      .map((r) => r.position_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  );
}

export async function submitCandidate(input: NewCandidate): Promise<Candidate> {
  if (useSupabaseBackend() && input.position_id) {
    const row = await submitCandidateFn({
      data: {
        full_name: input.full_name,
        national_id: input.national_id,
        iebc_voter_number: input.iebc_voter_number,
        phone: input.phone,
        email: input.email ?? "",
        date_of_birth: input.date_of_birth ?? "",
        gender: input.gender ?? "",
        tier: input.tier,
        position_id: input.position_id,
        position_title: input.position_title,
        county: input.county,
        constituency: input.constituency ?? "",
        ward: input.ward ?? "",
        party: input.party ?? "",
        slogan: input.slogan ?? "",
        bio: input.bio ?? "",
      },
    });
    return row as Candidate;
  }

  const { data, error } = await supabase.from("candidates").insert(input).select("*").single();
  if (error) throw error;
  return data as Candidate;
}

export function candidateInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
