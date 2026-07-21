import { supabase } from "@/integrations/supabase/client";

export type CandidateTier = "county" | "constituency" | "ward";
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
  county: string;
  constituency: string | null;
  ward: string | null;
  party: string | null;
  slogan: string | null;
  bio: string | null;
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

export async function submitCandidate(input: NewCandidate): Promise<Candidate> {
  const { data, error } = await supabase
    .from("candidates")
    .insert(input)
    .select("*")
    .single();
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
