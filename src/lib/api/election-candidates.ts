import { supabase } from "@/integrations/supabase/client";
import { toElectionCandidate, type ElectionCandidate, type Tier } from "@/lib/tier-meta";

export async function listCandidatesByPosition(positionId: string): Promise<ElectionCandidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("id, position_id, full_name, county, slogan, bio, date_of_birth, photo_path")
    .eq("position_id", positionId)
    .eq("status", "approved")
    .order("full_name");

  if (error) throw error;
  return (data ?? []).map((row, i) =>
    toElectionCandidate(
      {
        id: row.id,
        position_id: row.position_id,
        full_name: row.full_name,
        county: row.county,
        slogan: row.slogan,
        bio: row.bio,
        date_of_birth: row.date_of_birth,
        photo_path: row.photo_path,
      },
      i,
      positionId,
    ),
  );
}

/** Approved candidates at a location hierarchy, across all positions at that tier. */
export async function listCandidatesByLocation(filter: {
  tier: Tier;
  county?: string;
  constituency?: string;
  ward?: string;
}): Promise<ElectionCandidate[]> {
  let q = supabase
    .from("candidates")
    .select("id, position_id, full_name, county, slogan, bio, date_of_birth, photo_path")
    .eq("status", "approved")
    .eq("tier", filter.tier)
    .order("full_name");

  if (filter.tier !== "national" && filter.county) {
    q = q.eq("county", filter.county);
  }
  if ((filter.tier === "constituency" || filter.tier === "ward") && filter.constituency) {
    q = q.eq("constituency", filter.constituency);
  }
  if (filter.tier === "ward" && filter.ward) {
    q = q.eq("ward", filter.ward);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row, i) =>
    toElectionCandidate(
      {
        id: row.id,
        position_id: row.position_id,
        full_name: row.full_name,
        county: row.county,
        slogan: row.slogan,
        bio: row.bio,
        date_of_birth: row.date_of_birth,
        photo_path: row.photo_path,
      },
      i,
      row.position_id ?? "",
    ),
  );
}
