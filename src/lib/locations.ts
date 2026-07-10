/**
 * Kenya locations adapter — wraps kenya-locations for drop-in replacement of
 * the legacy hardcoded kenya-locations.ts module.
 */
import { getCounties } from "kenya-locations/counties";
import { getConstituencies } from "kenya-locations/constituencies";
import { getWards } from "kenya-locations/wards";

export interface County {
  name: string;
  constituencies: string[];
}

const _constituencies = getConstituencies();
const _countyNames = getCounties().map((c) => c.name);

const _constituenciesByCounty = new Map<string, string[]>();
for (const c of _constituencies) {
  const list = _constituenciesByCounty.get(c.county) ?? [];
  list.push(c.name);
  _constituenciesByCounty.set(c.county, list);
}

const _wardsByConstituency = new Map<string, string[]>();
for (const w of getWards()) {
  const list = _wardsByConstituency.get(w.constituency) ?? [];
  list.push(w.name);
  _wardsByConstituency.set(w.constituency, list);
}

export const COUNTIES: County[] = _countyNames.map((name) => ({
  name,
  constituencies: [...(_constituenciesByCounty.get(name) ?? [])].sort((a, b) => a.localeCompare(b)),
}));

export const COUNTY_NAMES: string[] = [..._countyNames];

export const ALL_CONSTITUENCIES: { county: string; name: string }[] = _constituencies
  .map((c) => ({ county: c.county, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const ALL_WARDS: { county: string; constituency: string; name: string }[] = getWards()
  .map((w) => {
    const county = _constituencies.find((c) => c.name === w.constituency)?.county ?? "";
    return { county, constituency: w.constituency, name: w.name };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export function constituenciesForCounty(county: string): string[] {
  return [...(_constituenciesByCounty.get(county) ?? [])].sort((a, b) => a.localeCompare(b));
}

export function wardsForConstituency(constituency: string): string[] {
  const wards = _wardsByConstituency.get(constituency);
  return wards ? [...wards].sort((a, b) => a.localeCompare(b)) : [];
}

export const TOTAL_COUNTIES = COUNTY_NAMES.length;
export const TOTAL_CONSTITUENCIES = ALL_CONSTITUENCIES.length;
export const TOTAL_WARDS = ALL_WARDS.length;

/** True when county exists in kenya-locations. */
export function isValidCounty(county: string): boolean {
  return _constituenciesByCounty.has(county);
}

/** True when constituency belongs to the given county. */
export function isValidConstituencyInCounty(county: string, constituency: string): boolean {
  return _constituenciesByCounty.get(county)?.includes(constituency) ?? false;
}

/** True when county, constituency, and ward form a valid IEBC triple. */
export function isValidLocationTriple(county: string, constituency: string, ward: string): boolean {
  if (!isValidConstituencyInCounty(county, constituency)) return false;
  const wards = _wardsByConstituency.get(constituency);
  return wards?.includes(ward) ?? false;
}

export type LocationTier = "national" | "county" | "constituency" | "ward";

/**
 * Client-side location validation against kenya-locations.
 * Returns an error message, or null when valid.
 */
export function validateLocationForTier(
  tier: LocationTier,
  county: string,
  constituency?: string,
  ward?: string,
): string | null {
  const countyName = county.trim();
  if (!countyName) return "County is required";
  if (!isValidCounty(countyName)) return "Select a valid county";

  if (tier === "national" || tier === "county") return null;

  const constituencyName = constituency?.trim() ?? "";
  if (!constituencyName) return "Constituency is required";
  if (!isValidConstituencyInCounty(countyName, constituencyName)) {
    return "Constituency does not match the selected county";
  }

  if (tier === "constituency") return null;

  const wardName = ward?.trim() ?? "";
  if (!wardName) return "Ward is required";
  if (!isValidLocationTriple(countyName, constituencyName, wardName)) {
    return "Ward does not match the selected constituency";
  }

  return null;
}
