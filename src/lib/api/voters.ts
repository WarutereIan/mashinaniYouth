import { supabase } from "@/integrations/supabase/client";
import {
  registerVoterFn,
  type RegisterVoterInput,
  type RegisteredVoter,
} from "@/lib/api/register-voter.fn";

export type { RegisterVoterInput, RegisteredVoter };

export interface DbVoter {
  id: string;
  user_id: string;
  full_name: string;
  county: string;
  constituency: string;
  ward: string;
  phone: string;
  national_id_last4: string;
  registered_at: string;
}

/** UI-facing voter shape (compatible with legacy voter-store). */
export interface Voter {
  id: string;
  userId?: string;
  name: string;
  county: string;
  constituency: string;
  ward: string;
  phone: string;
  registeredAt: string;
  /** Last 4 digits of National ID — never the full value. */
  nationalIdLast4?: string;
}

export function toVoter(row: DbVoter): Voter {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.full_name,
    county: row.county,
    constituency: row.constituency,
    ward: row.ward,
    phone: row.phone,
    registeredAt: row.registered_at,
    nationalIdLast4: row.national_id_last4,
  };
}

export async function getMyVoter(): Promise<Voter | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data, error } = await supabase
    .from("voters")
    .select(
      "id, user_id, full_name, county, constituency, ward, phone, national_id_last4, registered_at",
    )
    .maybeSingle();

  if (error) throw error;
  return data ? toVoter(data as DbVoter) : null;
}

export async function registerVoter(input: RegisterVoterInput): Promise<Voter> {
  const result: RegisteredVoter = await registerVoterFn({ data: input });
  return {
    id: result.id,
    userId: result.userId,
    name: result.name,
    county: result.county,
    constituency: result.constituency,
    ward: result.ward,
    phone: result.phone,
    registeredAt: result.registeredAt,
    nationalIdLast4: result.nationalIdLast4,
  };
}

export async function signOutVoter(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
