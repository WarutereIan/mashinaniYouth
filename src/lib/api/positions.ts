import { supabase } from "@/integrations/supabase/client";
import type { Position, Tier } from "@/lib/tier-meta";

export interface DbPosition {
  id: string;
  tier: Tier;
  title: string;
  scope: string;
  description: string;
  county: string | null;
  constituency: string | null;
  ward: string | null;
  election_cycle_id: number;
  applications_open: boolean;
  created_at: string;
  updated_at: string;
}

function toPosition(row: DbPosition): Position {
  return {
    id: row.id,
    tier: row.tier,
    title: row.title,
    scope: row.scope,
    description: row.description,
    applicationsOpen: row.applications_open,
    ...(row.county ? { county: row.county } : {}),
    ...(row.constituency ? { constituency: row.constituency } : {}),
    ...(row.ward ? { ward: row.ward } : {}),
  };
}

export async function listPositions(filter?: {
  tier?: Tier;
  cycleSlug?: string;
  applicationsOpen?: boolean;
}): Promise<Position[]> {
  let q = supabase.from("positions").select("*").order("tier").order("title");
  if (filter?.tier) q = q.eq("tier", filter.tier);
  if (filter?.applicationsOpen !== undefined) {
    q = q.eq("applications_open", filter.applicationsOpen);
  }
  if (filter?.cycleSlug) {
    const { data: cycle, error: cycleErr } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("slug", filter.cycleSlug)
      .maybeSingle();
    if (cycleErr) throw cycleErr;
    if (cycle) q = q.eq("election_cycle_id", cycle.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as DbPosition[]).map(toPosition);
}

export async function getPosition(id: string): Promise<Position | null> {
  const { data, error } = await supabase.from("positions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toPosition(data as DbPosition) : null;
}

export async function countPositions(): Promise<number> {
  const { count, error } = await supabase
    .from("positions")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
