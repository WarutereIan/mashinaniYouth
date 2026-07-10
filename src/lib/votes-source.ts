import { useCallback, useEffect, useState } from "react";
import { useSupabaseVoting } from "@/lib/feature-flags";
import type { Voter } from "@/lib/api/voters";
import { getMyVoter } from "@/lib/api/voters";
import {
  castVote as castVoteApi,
  getMyVote as getMyVoteApi,
  getMyVotes,
  tallyPosition as tallyPositionApi,
  totalVotesByPosition as totalVotesByPositionApi,
  totalVotesCast as totalVotesCastApi,
  subscribeToPositionVotes,
  type CastVoteInput,
  type CastVoteResult,
  type TallyRow,
} from "@/lib/api/votes";
import {
  castVote as castVoteLocal,
  getMyVote as getMyVoteLocal,
  tallyPosition as tallyPositionLocal,
  totalVotesByPosition as totalVotesByPositionLocal,
  totalVotesCast as totalVotesCastLocal,
  isEligible,
  eligibilityReason,
} from "@/lib/voter-store";
import { useVoter } from "@/lib/voters-source";
import type { Position } from "@/lib/tier-meta";

export type { CastVoteInput, CastVoteResult, TallyRow };

export function useVoteActions() {
  const supabase = useSupabaseVoting();
  const { voter } = useVoter();

  const castVote = useCallback(
    async (positionId: string, candidateId: string) => {
      if (supabase) {
        return castVoteApi({ positionId, candidateId });
      }
      if (!voter) throw new Error("Register to vote first");
      castVoteLocal(positionId, voter.id, candidateId);
      return {
        receiptCode: "LOCAL-MOCK",
        castAt: new Date().toISOString(),
        positionId,
        candidateId,
      };
    },
    [supabase, voter],
  );

  const getMyVote = useCallback(
    async (positionId: string) => {
      if (supabase) return getMyVoteApi(positionId);
      if (!voter) return null;
      return getMyVoteLocal(voter.id, positionId);
    },
    [supabase, voter],
  );

  const tallyPosition = useCallback(
    async (positionId: string) => {
      if (supabase) return tallyPositionApi(positionId);
      return tallyPositionLocal(positionId);
    },
    [supabase],
  );

  return { castVote, getMyVote, tallyPosition, voter, supabase };
}

export function usePositionTally(positionId: string | null) {
  const supabase = useSupabaseVoting();
  const [tally, setTally] = useState<TallyRow[]>([]);

  useEffect(() => {
    if (!positionId) return;
    let cancelled = false;

    const load = () => {
      if (supabase) {
        tallyPositionApi(positionId)
          .then((rows) => {
            if (!cancelled) setTally(rows);
          })
          .catch((e) => console.warn("[tally]", e));
      } else {
        setTally(tallyPositionLocal(positionId));
      }
    };

    load();
    if (!supabase || !positionId)
      return () => {
        cancelled = true;
      };

    const unsub = subscribeToPositionVotes(positionId, load);
    const fallback = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      unsub();
      window.clearInterval(fallback);
    };
  }, [positionId, supabase]);

  return tally;
}

export function checkEligibility(
  voter: Voter | null,
  position: Position | undefined,
  vyingPositionIds?: Set<string>,
): { eligible: boolean; reason?: string } {
  if (!voter || !position) {
    return { eligible: false, reason: "Register to vote in your ward first" };
  }
  if (vyingPositionIds?.has(position.id)) {
    return {
      eligible: false,
      reason: "You are vying for this seat, so you cannot vote in it",
    };
  }
  if (useSupabaseVoting()) {
    if (position.tier === "national") return { eligible: true };
    if (position.tier === "county" && position.county === voter.county) return { eligible: true };
    if (
      position.tier === "constituency" &&
      position.county === voter.county &&
      position.constituency === voter.constituency
    ) {
      return { eligible: true };
    }
    if (
      position.tier === "ward" &&
      position.county === voter.county &&
      position.constituency === voter.constituency &&
      position.ward === voter.ward
    ) {
      return { eligible: true };
    }
    return { eligible: false, reason: "This seat is outside your registered location" };
  }
  const ok = isEligible(voter, position);
  return ok
    ? { eligible: true }
    : { eligible: false, reason: eligibilityReason(voter, position) ?? undefined };
}

export async function fetchElectionTotals(): Promise<{
  totalVotesCast: number;
  totalVotesByPosition: Record<string, number>;
}> {
  if (useSupabaseVoting()) {
    const [total, byPos] = await Promise.all([totalVotesCastApi(), totalVotesByPositionApi()]);
    return { totalVotesCast: total, totalVotesByPosition: byPos };
  }
  return {
    totalVotesCast: totalVotesCastLocal(),
    totalVotesByPosition: totalVotesByPositionLocal(),
  };
}

export async function fetchMyVotes(_voter: Voter | null) {
  if (!useSupabaseVoting()) return [];
  return getMyVotes();
}

export { getMyVoter };
