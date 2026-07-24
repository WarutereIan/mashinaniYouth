import { useCallback, useEffect, useState } from "react";
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
import { useVoter } from "@/lib/voters-source";
import type { Position } from "@/lib/tier-meta";

export type { CastVoteInput, CastVoteResult, TallyRow };

export function useVoteActions() {
  const { voter } = useVoter();

  const castVote = useCallback(async (positionId: string, candidateId: string) => {
    return castVoteApi({ positionId, candidateId });
  }, []);

  const getMyVote = useCallback(async (positionId: string) => {
    return getMyVoteApi(positionId);
  }, []);

  const tallyPosition = useCallback(async (positionId: string) => {
    return tallyPositionApi(positionId);
  }, []);

  return { castVote, getMyVote, tallyPosition, voter, supabase: true as const };
}

export function usePositionTally(positionId: string | null) {
  const [tally, setTally] = useState<TallyRow[]>([]);

  useEffect(() => {
    if (!positionId) return;
    let cancelled = false;

    const load = () => {
      tallyPositionApi(positionId)
        .then((rows) => {
          if (!cancelled) setTally(rows);
        })
        .catch((e) => console.warn("[tally]", e));
    };

    load();
    const unsub = subscribeToPositionVotes(positionId, load);
    const poll = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      unsub();
      window.clearInterval(poll);
    };
  }, [positionId]);

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

export async function fetchElectionTotals(): Promise<{
  totalVotesCast: number;
  totalVotesByPosition: Record<string, number>;
}> {
  const [total, byPos] = await Promise.all([totalVotesCastApi(), totalVotesByPositionApi()]);
  return { totalVotesCast: total, totalVotesByPosition: byPos };
}

export async function fetchMyVotes(_voter: Voter | null) {
  return getMyVotes();
}

export { getMyVoter };
