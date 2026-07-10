# Slice 0 — Phase A Audit Report

**Status:** Implementation complete locally — **awaiting migration apply + your sign-off** before Slice 1.

**Scope:** M1–M4 reference data (election cycles, poll windows, Kenya locations, positions, candidate extensions) + frontend adapter layer behind feature flag.

---

## What was implemented

### Database migrations (local files — not yet applied via MCP)

| File                                                                     | Purpose                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `supabase/migrations/20260710100000_m1_election_cycles_poll_windows.sql` | `election_cycles`, `poll_windows`, enums, RLS, 2026 cycle + 8 regional poll windows |
| `supabase/migrations/20260710100100_m1b_ke_locations.sql`                | `ke_locations` table + RLS                                                          |
| `supabase/migrations/20260710100101_m1b_ke_locations_seed.sql`           | **1,448 rows** seeded from `kenya-locations` (generated)                            |
| `supabase/migrations/20260710100200_m2_positions.sql`                    | `positions` table + 10 seeded positions                                             |
| `supabase/migrations/20260710100300_m3_candidate_tier_national.sql`      | `national` added to `candidate_tier` enum                                           |
| `supabase/migrations/20260710100400_m4_extend_candidates.sql`            | `position_id`, `election_cycle_id`, review columns + backfill                       |

### Scripts

| File                               | Purpose                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| `scripts/gen-ke-locations-seed.ts` | Regenerate `ke_locations` seed after bumping `kenya-locations` |

### Frontend / API

| File                                 | Purpose                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `src/lib/locations.ts`               | Adapter over `kenya-locations` (replaces hardcoded `kenya-locations.ts` imports) |
| `src/lib/api/positions.ts`           | `listPositions`, `getPosition`, `countPositions`                                 |
| `src/lib/api/schedule.ts`            | `listPollWindows`, `regionForCountyFromDb`                                       |
| `src/lib/positions-source.ts`        | Flag-aware `fetchPositions` with mock fallback                                   |
| `src/lib/feature-flags.ts`           | `VITE_USE_SUPABASE_REFERENCE_DATA`                                               |
| `src/integrations/supabase/types.ts` | Extended types for new tables + enums                                            |

### Import switches (locations library)

- `src/routes/register.tsx`
- `src/routes/candidates.tsx`
- `src/routes/candidates.apply.tsx`
- `src/components/location-tier-bar.tsx`

### Feature flag wiring

- `src/routes/elections.tsx` loads positions from Supabase when `VITE_USE_SUPABASE_REFERENCE_DATA=true`; otherwise uses mock `POSITIONS`.

### Dependencies

- `kenya-locations` added to `package.json`

---

## Intentional data corrections (IEBC-aligned)

Mock positions used fictional ward names; seeds now use real wards from `kenya-locations`:

| Position ID    | Change                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `ward-kibra`   | ward set to **`Laini saba`** (was "Kibra Central" — not in IEBC data)                                            |
| `ward-kondele` | ward set to **`Kondele`** (was "Kisumu Central Central"); title corrected to **`Ward Representative — Kondele`** |

The DB `ward` column is IEBC-accurate; titles now match the real ward. Mock `mym-data.ts` keeps old labels as the flag-off fallback.

---

## Audit fixes applied (post-implementation review)

1. **`ke_locations` seed codes corrected.** The generator was writing the ward code into `constituency_code` and leaving `county_code` NULL for all 1,448 rows. `gen-ke-locations-seed.ts` now reads `getCounties().code` and `getConstituencies().code` and emits the correct per-level codes (e.g. `('Uasin Gishu', 'Ainabkoi', 'Ainabkoi/Olare', '144', '027', '0721')`). Seed file regenerated; 0 rows with NULL `county_code`.
2. **`ward-kondele` title typo fixed** in `m2_positions.sql` (was `Ward Representative — Kisumu Central Central`).

---

## What was NOT changed (by design — Slice 0 scope)

- [ ] Voter registration still uses `localStorage` (`voter-store.ts`)
- [ ] Vote casting still uses `localStorage`
- [ ] `election-schedule.ts` still hardcoded (DB schedule API exists but not wired to UI)
- [ ] `src/lib/kenya-locations.ts` **not deleted** yet (no imports remain; safe to delete in Slice 8)
- [ ] Migrations **not applied** to remote Supabase (MCP lacked privileges from this environment)

---

## Apply migrations (required before enabling flag)

From project root, with Supabase CLI linked to project `hjtnuihppwsdrluoyjqx`:

```bash
npx supabase db push
# or apply each migration via Supabase Dashboard → SQL / Lovable Cloud migrations
```

Then regenerate types (optional if types.ts already updated):

```bash
npx supabase gen types typescript --project-id hjtnuihppwsdrluoyjqx > src/integrations/supabase/types.ts
```

Enable Supabase reference data in `.env`:

```env
VITE_USE_SUPABASE_REFERENCE_DATA=true
```

---

## Verification checklist (for auditor)

- [ ] All 6 migration files apply cleanly in order on staging/prod
- [ ] `SELECT count(*) FROM ke_locations` → **1448**
- [ ] `SELECT count(*) FROM positions` → **10**
- [ ] `SELECT count(*) FROM poll_windows` → **8**
- [ ] `SELECT slug, phase FROM election_cycles` → `mykdm-2026`, `scheduled`
- [ ] RLS: anon can `SELECT` on `election_cycles`, `poll_windows`, `positions`, `ke_locations`
- [ ] Existing `candidates` rows have `position_id` backfilled where matchable
- [ ] `npm run build` passes
- [ ] With flag **off**: app behaves as before (mock positions)
- [ ] With flag **on** + migrations applied: `/elections` loads positions from Supabase
- [ ] Register/apply forms: county → constituency → ward cascades work via `kenya-locations`

---

## Sign-off

| Role                | Name | Date | Approved to proceed to Slice 1? |
| ------------------- | ---- | ---- | ------------------------------- |
| Engineering         |      |      | ☐                               |
| Product / elections |      |      | ☐                               |

**Slice 1 preview:** Auth ↔ voter (`profiles`, `voters` tables, `register.tsx` + `dashboard.tsx` wired to Supabase Auth).
