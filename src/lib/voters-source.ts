import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseVotersEnabled } from "@/lib/feature-flags";
import {
  getMyVoter,
  registerVoter as registerVoterApi,
  signOutVoter as signOutVoterApi,
  type RegisterVoterInput,
  type Voter,
} from "@/lib/api/voters";
import {
  getVoter as getLocalVoter,
  registerVoter as registerLocalVoter,
  signOutVoter as signOutLocalVoter,
  type Voter as LocalVoter,
} from "@/lib/voter-store";

export type { RegisterVoterInput, Voter };

/** Sync read — localStorage only. Supabase mode returns null (use useVoter). */
export function getVoterSync(): LocalVoter | Voter | null {
  if (isSupabaseVotersEnabled()) return null;
  return getLocalVoter();
}

export async function fetchVoter(): Promise<Voter | LocalVoter | null> {
  if (!isSupabaseVotersEnabled()) return getLocalVoter();
  return getMyVoter();
}

export async function registerVoter(
  input: Omit<LocalVoter, "registeredAt"> | RegisterVoterInput,
): Promise<Voter | LocalVoter> {
  if (!isSupabaseVotersEnabled()) {
    return registerLocalVoter(input as Omit<LocalVoter, "registeredAt">);
  }
  return registerVoterApi(input as RegisterVoterInput);
}

export async function signOutVoter(): Promise<void> {
  if (!isSupabaseVotersEnabled()) {
    signOutLocalVoter();
    return;
  }
  await signOutVoterApi();
}

/** Hook for routes that need the current voter (Supabase or localStorage). */
export function useVoter() {
  const supabaseMode = isSupabaseVotersEnabled();
  const [voter, setVoter] = useState<Voter | LocalVoter | null>(() =>
    supabaseMode ? null : getLocalVoter(),
  );
  const [ready, setReady] = useState(!supabaseMode);

  useEffect(() => {
    if (!supabaseMode) {
      const refresh = () => setVoter(getLocalVoter());
      window.addEventListener("storage", refresh);
      window.addEventListener("mym:voter-changed", refresh);
      return () => {
        window.removeEventListener("storage", refresh);
        window.removeEventListener("mym:voter-changed", refresh);
      };
    }

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

    refresh();

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
  }, [supabaseMode]);

  return { voter, ready, supabaseMode };
}

/** Display last-4 for ID line in UI. */
export function voterIdDisplay(voter: Voter | LocalVoter): string {
  if ("nationalIdLast4" in voter && voter.nationalIdLast4) {
    return voter.nationalIdLast4;
  }
  return voter.id.slice(-4);
}
