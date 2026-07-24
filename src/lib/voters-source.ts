import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getMyVoter,
  registerVoter as registerVoterApi,
  signOutVoter as signOutVoterApi,
  type RegisterVoterInput,
  type Voter,
} from "@/lib/api/voters";

export type { RegisterVoterInput, Voter };

/** Sync read — always null in live mode (use useVoter / fetchVoter). */
export function getVoterSync(): Voter | null {
  return null;
}

export async function fetchVoter(): Promise<Voter | null> {
  return getMyVoter();
}

export async function registerVoter(input: RegisterVoterInput): Promise<Voter> {
  return registerVoterApi(input);
}

export async function signOutVoter(): Promise<void> {
  await signOutVoterApi();
}

/** Hook for routes that need the current voter from Supabase. */
export function useVoter() {
  const [voter, setVoter] = useState<Voter | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const v = await getMyVoter();
        if (!cancelled) setVoter(v);
      } catch (e) {
        console.warn("[voters] fetch failed:", e);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void refresh();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    const onChange = () => {
      void refresh();
    };
    window.addEventListener("mym:voter-changed", onChange);

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      window.removeEventListener("mym:voter-changed", onChange);
    };
  }, []);

  return { voter, ready, supabaseMode: true as const };
}

/** Display last-4 for ID line in UI. */
export function voterIdDisplay(voter: Voter): string {
  if (voter.nationalIdLast4) return voter.nationalIdLast4;
  return voter.id.slice(-4);
}
