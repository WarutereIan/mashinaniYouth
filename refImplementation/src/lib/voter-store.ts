// Client-side voter + vote store for the MY-KDM electronic voting demo.
// One vote per voter per position. Persisted to localStorage.

import { CANDIDATES, type Position } from "./mym-data";

const VOTER_KEY = "mym.voter";
const VOTES_KEY = "mym.votes.v1"; // { [positionId]: { [voterId]: candidateId } }

export interface Voter {
  id: string; // national ID
  name: string;
  county: string;
  constituency: string;
  ward: string;
  phone: string;
  registeredAt: string;
}


type VotesShape = Record<string, Record<string, string>>;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getVoter(): Voter | null {
  if (typeof window === "undefined") return null;
  return safeParse<Voter | null>(localStorage.getItem(VOTER_KEY), null);
}

export function registerVoter(v: Omit<Voter, "registeredAt">): Voter {
  const voter: Voter = { ...v, registeredAt: new Date().toISOString() };
  localStorage.setItem(VOTER_KEY, JSON.stringify(voter));
  return voter;
}

export function signOutVoter() {
  localStorage.removeItem(VOTER_KEY);
}

function readVotes(): VotesShape {
  if (typeof window === "undefined") return {};
  return safeParse<VotesShape>(localStorage.getItem(VOTES_KEY), {});
}

function writeVotes(v: VotesShape) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(v));
}

export function getMyVote(positionId: string, voterId: string): string | null {
  return readVotes()[positionId]?.[voterId] ?? null;
}

export function castVote(positionId: string, voterId: string, candidateId: string) {
  const all = readVotes();
  const bucket = all[positionId] ?? {};
  bucket[voterId] = candidateId;
  all[positionId] = bucket;
  writeVotes(all);
}

export function tallyPosition(positionId: string): { candidateId: string; votes: number }[] {
  const bucket = readVotes()[positionId] ?? {};
  const counts = new Map<string, number>();
  CANDIDATES.filter((c) => c.positionId === positionId).forEach((c) => counts.set(c.id, 0));
  Object.values(bucket).forEach((cid) => counts.set(cid, (counts.get(cid) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([candidateId, votes]) => ({ candidateId, votes }))
    .sort((a, b) => b.votes - a.votes);
}

export function totalVotesCast(): number {
  const all = readVotes();
  return Object.values(all).reduce((sum, bucket) => sum + Object.keys(bucket).length, 0);
}

export function positionsVotedByMe(voterId: string): string[] {
  const all = readVotes();
  return Object.entries(all)
    .filter(([, bucket]) => bucket[voterId])
    .map(([positionId]) => positionId);
}

export function totalVotesByPosition(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const all = safeParse<VotesShape>(localStorage.getItem(VOTES_KEY), {});
  const out: Record<string, number> = {};
  for (const [pid, bucket] of Object.entries(all)) out[pid] = Object.keys(bucket).length;
  return out;
}

export function isEligible(voter: Voter | null, position: Position): boolean {
  if (!voter) return false;
  if (position.county && position.county !== voter.county) return false;
  if (position.constituency && position.constituency !== voter.constituency) return false;
  if (position.ward && position.ward !== voter.ward) return false;
  return true;
}

export function eligibilityReason(voter: Voter | null, position: Position): string | null {
  if (!voter) return "Register to vote first";
  if (position.ward && position.ward !== voter.ward)
    return `Only voters registered in ${position.ward} can vote here`;
  if (position.constituency && position.constituency !== voter.constituency)
    return `Only voters registered in ${position.constituency} can vote here`;
  if (position.county && position.county !== voter.county)
    return `Only voters registered in ${position.county} County can vote here`;
  return null;
}

