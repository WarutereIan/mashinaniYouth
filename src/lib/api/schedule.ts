import { supabase } from "@/integrations/supabase/client";

export interface RegionSchedule {
  region: string;
  counties: string[];
  /** ISO date (YYYY-MM-DD) of polling day, EAT (UTC+3). */
  date: string;
  opensAt: string;
  closesAt: string;
}

export interface DbPollWindow {
  id: number;
  cycle_id: number;
  region: string;
  poll_date: string;
  opens_at: string;
  closes_at: string;
  counties: string[];
}

function toRegionSchedule(row: DbPollWindow): RegionSchedule {
  return {
    region: row.region,
    counties: row.counties,
    date: row.poll_date,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
  };
}

export async function getCyclePhase(cycleSlug = "mykdm-2026"): Promise<string | null> {
  const { data, error } = await supabase
    .from("election_cycles")
    .select("phase")
    .eq("slug", cycleSlug)
    .maybeSingle();
  if (error) throw error;
  return (data?.phase as string | undefined) ?? null;
}

export async function listPollWindows(cycleSlug = "mykdm-2026"): Promise<RegionSchedule[]> {
  const { data: cycle, error: cycleErr } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("slug", cycleSlug)
    .maybeSingle();
  if (cycleErr) throw cycleErr;
  if (!cycle) return [];

  const { data, error } = await supabase
    .from("poll_windows")
    .select("*")
    .eq("cycle_id", cycle.id)
    .order("poll_date");
  if (error) throw error;
  return ((data ?? []) as DbPollWindow[]).map(toRegionSchedule);
}

export async function regionForCountyFromDb(
  county: string,
  cycleSlug = "mykdm-2026",
): Promise<RegionSchedule | undefined> {
  const windows = await listPollWindows(cycleSlug);
  const norm = county.trim().toLowerCase();
  return windows.find((r) =>
    r.counties.some((c: string) => c.toLowerCase() === norm),
  );
}
