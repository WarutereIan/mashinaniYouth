import { type Position, type Tier } from "@/lib/tier-meta";
import { getPosition, listPositions } from "@/lib/api/positions";

/** Positions from Supabase for the active MY-KDM cycle. */
export async function fetchPositions(filter?: { tier?: Tier }): Promise<Position[]> {
  return listPositions({ tier: filter?.tier, cycleSlug: "mykdm-2026" });
}

export async function getPositionById(id: string): Promise<Position | undefined> {
  const row = await getPosition(id);
  return row ?? undefined;
}
