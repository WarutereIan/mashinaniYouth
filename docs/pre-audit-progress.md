# Pre-audit progress (MashinaniVote × Supabase)

> Living checklist before phase-by-phase audits.  
> **Active Supabase project:** `iswdjakcdkwumxywgcby` ("mashinani youth")  
> **Note:** `supabase/config.toml` / `.env` may still reference Lovable project `hjtnuihppwsdrluoyjqx` — align before local CLI work.

Last updated: 2026-07-10 (admin hardening phases 0–6 complete; phase 7 audit pending)

## Remote DB snapshot (`iswdjakcdkwumxywgcby`)

| Table / metric          |  Count | Target / note                                   |
| ----------------------- | -----: | ----------------------------------------------- |
| `ke_locations`          |  1,448 | Target met — all 15 seed chunks applied         |
| `positions`             |     10 | Demo subset seeded                              |
| `candidates` (approved) |     22 | `supabase/seed.sql` applied                     |
| `election_cycles.phase` | `open` | Ready for voting tests                          |
| `voters`                |      0 | None registered yet                             |
| `votes`                 |      0 | None cast yet                                   |
| `admin_users`           |      1 | Superadmin bootstrapped (`722a053f-…`)          |
| `audit_log`             |      0 | Table + RPCs live; rows appear on admin actions |

---

## Manual steps (owner)

- [ ] **Regenerate types** — run `npx supabase gen types typescript --project-id iswdjakcdkwumxywgcby > src/integrations/supabase/types.ts` (owner).
- [ ] **Align env** — point `.env` / `VITE_*` at `iswdjakcdkwumxywgcby`.
- [x] **Bootstrap superadmin** — `superadmin@mashinani-vote.ke` + `admin_users` row (see `docs/admin-credentials.local.md`).
- [ ] **Enroll superadmin MFA** — sign in → `/admin/mfa-required` → TOTP before other admin routes.
- [x] **Apply demo seed** — 22 approved candidates + cycle `open` (remote confirmed).

---

## Slice 0 — Reference data

| Item                               | Status         | Evidence                                                                                 |
| ---------------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| M1 election_cycles + poll_windows  | Done           | `20260710100000_m1_election_cycles_poll_windows.sql`                                     |
| M1b ke_locations table + RLS       | Done           | `20260710100100_m1b_ke_locations.sql`                                                    |
| ke_locations seed (1,448 rows)     | Done           | All 15 chunks applied idempotently (`ON CONFLICT DO NOTHING`); remote count = 1,448      |
| M2 positions + seed                | Done           | `20260710100200_m2_positions.sql` (10 positions remote)                                  |
| M3 national tier enum              | Done           | `20260710100300_m3_candidate_tier_national.sql`                                          |
| M4 candidate extensions            | Done           | `20260710100400_m4_extend_candidates.sql`                                                |
| kenya-locations npm + adapter      | Done           | `package.json`, `src/lib/locations.ts`                                                   |
| Delete legacy `kenya-locations.ts` | Done           | File removed; all imports use `@/lib/locations`                                          |
| Location validation                | Done (revised) | Frontend: `isValidLocationTriple` / `validateLocationForTier`; backend: Zod strings only |
| `scripts/gen-ke-locations-seed.ts` | Done           | Seed generator exists                                                                    |

## Slice 1 — Auth ↔ voter

| Item                         | Status       | Evidence                                                                   |
| ---------------------------- | ------------ | -------------------------------------------------------------------------- |
| M5 profiles                  | Done         | `20260710100500_m5_profiles.sql`                                           |
| M6 voters + RLS              | Done         | `20260710100600_m6_voters.sql`                                             |
| National ID hashing          | Done         | `register-voter.fn.ts` — SHA-256 + `NATIONAL_ID_PEPPER` env                |
| register-voter server fn     | Done         | `src/lib/api/register-voter.fn.ts`                                         |
| register.tsx + auth gate     | Done         | Redirects to `/auth` when `VITE_USE_SUPABASE_VOTERS`                       |
| voters-source / feature flag | Done         | `src/lib/voters-source.ts`, `VITE_USE_SUPABASE_VOTERS`                     |
| Phone OTP gate               | **Not done** | `phone_verified` column exists; no OTP flow; `cast_vote` does not check it |

## Slice 2 — Voting

| Item                                | Status      | Evidence                                                                                                                                                                                                                                              |
| ----------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M7 votes + vote_receipts            | Done        | `20260710100700_m7_votes.sql`                                                                                                                                                                                                                         |
| M8 cast_vote + tally RPCs           | Done        | `20260710100800_m8_voting_rpcs.sql`                                                                                                                                                                                                                   |
| cast-vote server fn                 | Done        | `src/lib/api/cast-vote.fn.ts`                                                                                                                                                                                                                         |
| votes-source + realtime             | Done        | `src/lib/votes-source.ts`, `subscribeToPositionVotes`                                                                                                                                                                                                 |
| elections routes wired              | Done (flag) | `elections.tsx`, `elections.$positionId.tsx` (flag-gated); fixed `[object Object]` renders for `voterRegion` + `DATE_FMT`                                                                                                                             |
| M17 votes lockdown + aggregate RPCs | Done        | `20260710101700_m17_votes_lockdown.sql` applied remotely — client INSERT/UPDATE policies dropped + grants revoked; `total_votes_cast` / `votes_by_position` SECURITY DEFINER RPCs live; `votes.ts` switched to RPCs (fixes RLS-restricted totals bug) |
| M8b audit_log                       | Done        | `20260710102000_m20_audit_log.sql` + M24 audit wiring                                                                                                                                                                                                 |
| M8c recount_position + cycle seal   | Done        | `20260710102300_m23_recount_seal.sql`; trigger `trg_votes_cycle_seal` live                                                                                                                                                                            |

## Slice 3 — Analytics

| Item                           | Status      | Evidence                                                    |
| ------------------------------ | ----------- | ----------------------------------------------------------- |
| M9 analytics RPCs              | Done        | `20260710100900_m9_analytics_rpcs.sql`                      |
| analytics API                  | Done        | `src/lib/api/analytics.ts`                                  |
| elections charts (real data)   | Done (flag) | `VITE_USE_SUPABASE_ANALYTICS`; `hashUnit` fallback when off |
| candidate dashboard real tally | Done (flag) | Realtime via `subscribeToPositionVotes`                     |

## Slice 4 — Support

| Item                        | Status | Evidence                                 |
| --------------------------- | ------ | ---------------------------------------- |
| M11 support_pledges         | Done   | `20260710101100_m11_support_pledges.sql` |
| submit-pledge + support API | Done   | `submit-pledge.fn.ts`, `support.ts`      |
| support-button wired        | Done   | `components/support-button.tsx`          |

## Slice 5 — Admin

| Item                           | Status | Evidence                                                                           |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| M12 admin_users + RLS          | Done   | `20260710101200_m12_admin_users.sql`                                               |
| M15 drop auto-approve          | Done   | `20260710101500_m15_drop_auto_approve.sql`                                         |
| M16 admin RPCs + candidate RLS | Done   | `20260710101600_m16_admin_rpcs.sql`                                                |
| admin routes (6 pages)         | Done   | `routes/admin/*` — `ssr: false` added to all (fixes SSR auth-context redirect bug) |
| admin API                      | Done   | `src/lib/api/admin.ts` (admin reads via `is_admin()` RLS policies)                 |
| positions CRUD form            | Done   | `admin/positions.tsx` + M22 RPCs                                                   |
| Admin MFA gate                 | Done   | M19 + `adminRouteLoader` + `/admin/mfa-required`                                   |
| Admin user management          | Done   | `/admin/users` + M18 RPCs                                                          |
| Superadmin bootstrap           | Done   | 1 row; credentials in `docs/admin-credentials.local.md`                            |

## Slice 6 — Storage

| Item                                  | Status | Evidence                                                                                                                                                                    |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M13 candidate-photos + candidate-docs | Done   | `20260710101300_m13_storage.sql`                                                                                                                                            |
| Photo upload helper                   | Done   | `src/lib/api/candidate-photos.ts` — `uploadCandidatePhoto`, `setCandidatePhotoPath`, `candidatePhotoUrl` (deduped; removed duplicate helpers from `election-candidates.ts`) |
| Photo upload in apply flow            | Done   | `candidates.apply.tsx` — file input + upload + `photo_path` update after submit                                                                                             |
| Avatar renders stored photo           | Done   | `components/candidate-avatar.tsx` + certificate/candidates pages use `candidatePhotoUrl` with bundled-portrait fallback                                                     |

## Slice 7 — Verify

| Item                              | Status | Evidence                                                                                                                         |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| M10 verify RPCs                   | Done   | `20260710101000_m10_verify_rpcs.sql`                                                                                             |
| verify + receipt routes           | Done   | `verify.$certificateNumber.tsx`, `receipt.$receiptCode.tsx`                                                                      |
| verify API                        | Done   | `src/lib/api/verify.ts`                                                                                                          |
| Certificate QR → `/verify/`       | Done   | certificate route updated                                                                                                        |
| candidates.tsx VerifyDialog → RPC | Done   | `VerifyDialog` now calls `verifyCertificate`, renders loading/valid/invalid states from RPC result (sensitive ID fields dropped) |

## Slice 8 — Cleanup

| Item                                       | Status                | Evidence                                                                                                                          |
| ------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Feature flags master switch                | Done                  | `src/lib/feature-flags.ts`                                                                                                        |
| API layer (`src/lib/api/*`)                | Done                  | 13 modules (+ `.fn.ts` server functions)                                                                                          |
| Generated types current                    | Done                  | `src/integrations/supabase/types.ts`                                                                                              |
| `supabase/seed.sql`                        | Done                  | Applied remotely (22 approved candidates)                                                                                         |
| Delete `mym-data.ts`                       | **Deferred**          | Still used when `VITE_USE_SUPABASE_BACKEND` is off                                                                                |
| Delete `voter-store.ts`                    | **Deferred**          | Fallback for mock voting mode                                                                                                     |
| `election-schedule.ts` → `api/schedule.ts` | **Partial**           | `schedule.ts` exists; `election-schedule.ts` still hardcodes `REGION_SCHEDULE`                                                    |
| Remove `mym:*` custom events               | **Deferred (benign)** | Legitimate cross-component refresh signal; `useVoter` also subscribes to `onAuthStateChange`. Safe to keep while flags can be off |
| Remove fake `setInterval` pollers          | **Deferred (benign)** | 30s poll in `votes-source` is the documented realtime fallback; carousel tick in `index.tsx` is UI-only                           |

---

## Production hardening (§11) — not started

| Area                                      | Status                        |
| ----------------------------------------- | ----------------------------- |
| `audit_log` append-only                   | Done                          | M20 + no UPDATE/DELETE policies                                                      |
| `recount_position` RPC                    | Done                          | M23                                                                                  |
| Vault pepper (vs env var)                 | Env `NATIONAL_ID_PEPPER` only |
| Phone OTP before `cast_vote`              | Not implemented               |
| Rate limiting (vote/register/verify)      | Not implemented               |
| Admin MFA                                 | Done (app)                    | M19 + in-app TOTP enroll; superadmin must enroll manually                            |
| RPC EXECUTE privileges                    | Done (M25)                    | REVOKE FROM PUBLIC on admin/vote/audit RPCs; anon blocked; write_audit internal-only |
| `tally_by_position_live` SECURITY DEFINER | Fixed (M25)                   | Switched to SECURITY INVOKER                                                         |
| Structured logging / metrics / alerts     | Not implemented               |
| Load test / PITR drill                    | Not done                      |
| CI grep service-role in client bundle     | Not done                      |
| RLS / RPC / e2e tests                     | Not done                      |

---

## Top blockers before audits

1. **Types regen** — owner running Supabase CLI `gen types` for new RPCs (`admin_mfa_enrolled`, `recount_position`, etc.).
2. **Env mismatch** — align `.env` / `config.toml` with `iswdjakcdkwumxywgcby`.
3. **Superadmin MFA enroll** — required before admin console works with `VITE_USE_SUPABASE_BACKEND=true`.
4. **Phase 7 audit** — SQL/RLS/MFA/E2E per `docs/admin-hardening-plan.md`.
5. **End-to-end smoke** — register voter → cast vote → verify receipt (0 voters/votes today).

## Feature flags

Set for full backend testing:

```env
VITE_USE_SUPABASE_BACKEND=true
NATIONAL_ID_PEPPER=<secret>
```

Granular overrides: `VITE_USE_SUPABASE_REFERENCE_DATA`, `_VOTERS`, `_VOTING`, `_ANALYTICS`, `_SUPPORT`.
