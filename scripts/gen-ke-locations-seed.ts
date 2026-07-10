/**
 * Generates supabase/migrations/*_m1b_ke_locations_seed.sql from kenya-locations.
 * Pin: kenya-locations package version in package.json — re-run after bumping the lib.
 *
 * Usage: npx tsx scripts/gen-ke-locations-seed.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCounties } from "kenya-locations/counties";
import { getConstituencies } from "kenya-locations/constituencies";
import { getWards } from "kenya-locations/wards";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

const counties = getCounties();
const countyCode = new Map(counties.map((c) => [c.name, c.code]));
const constituencies = getConstituencies();
const constituencyCounty = new Map(constituencies.map((c) => [c.name, c.county]));
const constituencyCode = new Map(constituencies.map((c) => [c.name, c.code]));

const rows: string[] = [];
for (const ward of getWards()) {
  const county = constituencyCounty.get(ward.constituency);
  if (!county) {
    console.warn(`Skip ward ${ward.name}: unknown constituency ${ward.constituency}`);
    continue;
  }
  rows.push(
    `('${esc(county)}', '${esc(ward.constituency)}', '${esc(ward.name)}', '${esc(constituencyCode.get(ward.constituency) ?? "")}', '${esc(countyCode.get(county) ?? "")}', '${esc(ward.code)}')`,
  );
}

const header = `-- M1b seed: ke_locations from kenya-locations (generated — do not edit by hand)
-- Rows: ${rows.length}
-- Regenerate: npx tsx scripts/gen-ke-locations-seed.ts

`;

const insertPrefix = `INSERT INTO public.ke_locations (county, constituency, ward, constituency_code, county_code, ward_code)
VALUES
`;

const chunkSize = 100;
const chunks: string[] = [];
for (let i = 0; i < rows.length; i += chunkSize) {
  const slice = rows.slice(i, i + chunkSize);
  chunks.push(
    insertPrefix + slice.join(",\n") + "\nON CONFLICT (county, constituency, ward) DO NOTHING;",
  );
}

const sql = header + chunks.join("\n\n");
const out = resolve(
  import.meta.dirname,
  "../supabase/migrations/20260710100101_m1b_ke_locations_seed.sql",
);
writeFileSync(out, sql, "utf8");
console.log(`Wrote ${rows.length} rows to ${out}`);
