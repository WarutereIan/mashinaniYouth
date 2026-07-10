import { supabase } from "@/integrations/supabase/client";
import { toElectionCandidate, type ElectionCandidate } from "@/lib/tier-meta";

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
