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
  return usePositionsTally(positionId ? [positionId] : []);
}

/** Merged live tallies for one or more ballots (location-scoped candidate lists). */
export function usePositionsTally(positionIds: string[]) {
  const [tally, setTally] = useState<TallyRow[]>([]);
  const key = positionIds.slice().sort().join("|");

  useEffect(() => {
    const ids = key ? key.split("|").filter(Boolean) : [];
    if (!ids.length) {
      setTally([]);
      return;
    }
    let cancelled = false;

    const load = () => {
      Promise.all(ids.map((id) => tallyPositionApi(id)))
        .then((lists) => {
          if (cancelled) return;
          const byCandidate = new Map<string, number>();
          for (const rows of lists) {
            for (const row of rows) {
              byCandidate.set(row.candidateId, (byCandidate.get(row.candidateId) ?? 0) + row.votes);
            }
          }
          setTally(
            [...byCandidate.entries()]
              .map(([candidateId, votes]) => ({ candidateId, votes }))
              .sort((a, b) => b.votes - a.votes),
          );
        })
        .catch((e) => console.warn("[tally]", e));
    };

    load();
    const unsubs = ids.map((id) => subscribeToPositionVotes(id, load));
    const poll = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      for (const unsub of unsubs) unsub();
      window.clearInterval(poll);
    };
  }, [key]);

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
  if (!isPositionInVoterLocale(voter, position)) {
    return { eligible: false, reason: "This seat is outside your registered location" };
  }
  return { eligible: true };
}

/** National is nationwide; subnational seats must match the voter's home hierarchy. */
export function isPositionInVoterLocale(voter: Voter, position: Position): boolean {
  if (position.tier === "national") return true;
  if (position.tier === "county") return position.county === voter.county;
  if (position.tier === "constituency") {
    return position.county === voter.county && position.constituency === voter.constituency;
  }
  if (position.tier === "ward") {
    return (
      position.county === voter.county &&
      position.constituency === voter.constituency &&
      position.ward === voter.ward
    );
  }
  return false;
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
