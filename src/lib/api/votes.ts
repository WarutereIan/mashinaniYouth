import { supabase } from "@/integrations/supabase/client";
import { castVoteFn, type CastVoteInput, type CastVoteResult } from "@/lib/api/cast-vote.fn";

export type { CastVoteInput, CastVoteResult };

export interface TallyRow {
  candidateId: string;
  votes: number;
}

export interface MyVote {
  positionId: string;
  candidateId: string;
  receiptCode: string;
  castAt: string;
}

export async function castVote(input: CastVoteInput): Promise<CastVoteResult> {
  return castVoteFn({ data: input });
}

export async function getMyVote(positionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("votes")
    .select("candidate_id")
    .eq("position_id", positionId)
    .maybeSingle();

  if (error) throw error;
  return data?.candidate_id ?? null;
}

export async function getMyVotes(): Promise<MyVote[]> {
  const { data, error } = await supabase
    .from("votes")
    .select("position_id, candidate_id, receipt_code, cast_at");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    positionId: row.position_id,
    candidateId: row.candidate_id,
    receiptCode: row.receipt_code,
    castAt: row.cast_at,
  }));
}

export async function tallyPosition(positionId: string): Promise<TallyRow[]> {
  const { data, error } = await supabase.rpc("tally_by_position", {
    p_position_id: positionId,
  });
  if (error) throw error;
  return ((data ?? []) as { candidate_id: string; votes: number }[]).map((r) => ({
    candidateId: r.candidate_id,
    votes: Number(r.votes),
  }));
}

export async function totalVotesCast(): Promise<number> {
  const { data, error } = await supabase.rpc("total_votes_cast");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function totalVotesByPosition(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("votes_by_position");
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as { position_id: string; votes: number }[]) {
    out[row.position_id] = Number(row.votes);
  }
  return out;
}

export function subscribeToPositionVotes(positionId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`votes:${positionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `position_id=eq.${positionId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
