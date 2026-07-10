export type Tier = "national" | "county" | "constituency" | "ward";

export interface Position {
  id: string;
  tier: Tier;
  title: string;
  scope: string;
  description: string;
  county?: string;
  constituency?: string;
  ward?: string;
}

export const TIER_META: Record<Tier, { label: string; blurb: string }> = {
  national: {
    label: "National Secretariat",
    blurb: "Chair, CEO and the Cabinet of Youth Ministers — the movement's national leadership.",
  },
  county: {
    label: "County Leadership",
    blurb: "County Youth Governors representing each of Kenya's 47 counties.",
  },
  constituency: {
    label: "Constituency Leadership",
    blurb: "Constituency Youth Reps linking wards to county and national leadership.",
  },
  ward: {
    label: "Ward Leadership",
    blurb: "Ward Representatives — the closest point of contact with young people on the ground.",
  },
};

/** UI-facing candidate card shape used on elections pages. */
export interface ElectionCandidate {
  id: string;
  positionId: string;
  name: string;
  age: number;
  county: string;
  slogan: string;
  bio: string;
  initials: string;
  accent: "gold" | "sage" | "terracotta";
  photoPath?: string | null;
}

const ACCENTS: ElectionCandidate["accent"][] = ["gold", "sage", "terracotta"];

export function accentForIndex(i: number): ElectionCandidate["accent"] {
  return ACCENTS[i % ACCENTS.length];
}

export function ageFromDob(dob: string | null): number {
  if (!dob) return 28;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
  return Math.max(18, age);
}

export function toElectionCandidate(
  row: {
    id: string;
    position_id: string | null;
    full_name: string;
    county: string;
    slogan: string | null;
    bio: string | null;
    date_of_birth: string | null;
    photo_path?: string | null;
  },
  index: number,
  positionId: string,
): ElectionCandidate {
  const initials = row.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return {
    id: row.id,
    positionId: row.position_id ?? positionId,
    name: row.full_name,
    age: ageFromDob(row.date_of_birth),
    county: row.county,
    slogan: row.slogan ?? "",
    bio: row.bio ?? "",
    initials,
    accent: accentForIndex(index),
    photoPath: row.photo_path,
  };
}
