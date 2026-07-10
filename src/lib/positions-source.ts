import { useSupabaseReferenceData } from "@/lib/feature-flags";
import { type Position, type Tier } from "@/lib/tier-meta";
import { POSITIONS } from "@/lib/mym-data";
import { getPosition, listPositions } from "@/lib/api/positions";

/** Positions for UI: Supabase when flag on, mock fallback otherwise. */
export async function fetchPositions(filter?: { tier?: Tier }): Promise<Position[]> {
  if (!useSupabaseReferenceData())
    return POSITIONS.filter((p) => !filter?.tier || p.tier === filter.tier);
  try {
    return await listPositions({ tier: filter?.tier, cycleSlug: "mykdm-2026" });
  } catch (e) {
    console.warn("[positions] Supabase fetch failed, using mock data:", e);
    return POSITIONS.filter((p) => !filter?.tier || p.tier === filter.tier);
  }
}

export function getPositionByIdSync(id: string): Position | undefined {
  return POSITIONS.find((p) => p.id === id);
}

export async function getPositionById(id: string): Promise<Position | undefined> {
  if (!useSupabaseReferenceData()) return getPositionByIdSync(id);
  try {
    const row = await getPosition(id);
    return row ?? undefined;
  } catch {
    return getPositionByIdSync(id);
  }
}
