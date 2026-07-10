# Admin & superadmin hardening — implementation plan

> Plan to close every admin/superadmin gap surfaced in the slice-by-slice audit.
> Active Supabase project: `iswdjakcdkwumxywgcby` ("mashinani youth").
> Aligned with `docs/supabase-backend-integration-plan.md` §8 (admin) and §11 (production hardening).
>
> **Decisions locked in:**
>
> - Bootstrap: auto-create the first superadmin via MCP (`auth.users` insert + `admin_users` row) and document credentials in `docs/admin-credentials.local.md` (gitignored).
> - MFA: in-app enrollment UI using the Supabase Auth MFA API; the app checks enrollment and blocks otherwise.
> - Scope: execute all phases 0–7 end to end.

Last updated: 2026-07-10 (implementation + security hardening complete — audited)

---

## Current state (post-implementation + audit)

- `admin_users` RBAC live with **1 superadmin** bootstrapped (`722a053f-8138-4afd-87a5-b6613f28123c`).
- Migrations **M17–M25** applied remotely. M25 closes the PostgREST EXECUTE privilege gap.
- Frontend: `/admin/users`, `/admin/mfa-required`, rebuilt `/admin/support`, `/admin/positions`, `/admin/audit`; shared `adminRouteLoader` with MFA gate.
- **MFA fix:** `admin_mfa_enrolled` uses `status = 'verified'` only (`auth.mfa_factors` has no `verified` column on this Supabase version).
- **Types:** regenerated via `npx supabase gen types typescript --project-id iswdjakcdkwumxywgcby`.
- **Security (M25):** `REVOKE EXECUTE FROM PUBLIC` on all admin/vote/audit RPCs; `GRANT EXECUTE TO authenticated` only; `write_audit` internal-only; `recount_position` gained `is_admin()` guard; `tally_by_position_live` switched to `SECURITY INVOKER`.
- **Audit result:** 9/10 SQL checks PASS; security advisors FAIL resolved by M25.

---

## Phase 0 — Bootstrap superadmin ☑

- ☑ Generate a strong password (22 chars, mixed case + digits + safe symbols).
- ☑ Insert auth user into `auth.users` (email `superadmin@mashinani-vote.ke`).
- ☑ Insert `admin_users (user_id, role) VALUES ('722a053f-8138-4afd-87a5-b6613f28123c', 'superadmin')`.
- ☐ Verify `/admin` loads for this user (manual smoke after MFA enroll).
- ☐ Enroll TOTP MFA for this user via `/admin/mfa-required` **before** exercising other admin routes.

### Credentials

See **`docs/admin-credentials.local.md`** (gitignored). Rotate after first login.

---

## Phase 1 — Admin user management UI ☑

- ☑ Migration `m18_admin_manage` (policy + grant/revoke/list/lookup RPCs).
- ☑ `src/lib/api/admin.ts`: `adminGrantRoleFn`, `adminRevokeRoleFn`, `adminListUsers`, `adminLookupUserByEmail`.
- ☑ Route `src/routes/admin/users.tsx` (superadmin-only).
- ☑ QuickLink from `src/routes/admin/index.tsx`.

---

## Phase 2 — Admin MFA enforcement ☑

- ☑ Migration `m19_admin_mfa` (`admin_mfa_enrolled` RPC).
- ☑ `getMyAdminRole()` returns `mfaEnrolled`; `requireMfa()` on action server fns.
- ☑ Route `/admin/mfa-required` + `src/components/admin-mfa-enroll.tsx`.
- ☑ Each `/admin/*` loader redirects when `!mfaEnrolled` (via `adminRouteLoader`).
- ☑ Gated behind `useSupabaseBackend()`.

---

## Phase 3 — Audit log (M8b) ☑

- ☑ Migration `m20_audit_log` (`audit_log`, `write_audit`, `recent_audit`).
- ☑ `write_audit` wired in `cast_vote`, approve/reject, set_cycle_phase (M24).
- ☑ `write_audit` wired in grant/revoke, pledge status, positions CRUD, unseal (M18–M23).

---

## Phase 4 — Support pledge status management ☑

- ☑ Migration `m21_pledge_status_rpc`.
- ☑ `adminSetPledgeStatusFn` server fn.
- ☑ `src/routes/admin/support.tsx` per-row status `<Select>`.

---

## Phase 5 — Positions CRUD ☑

- ☑ Migration `m22_positions_crpcs` (create/update/delete + tier validation).
- ☑ Server fns in `admin.ts`.
- ☑ Rebuilt `src/routes/admin/positions.tsx` (table + form dialog).

---

## Phase 6 — Recount + cycle seal (M8c) ☑

- ☑ Migration `m23_recount_seal` (`recount_position`, `trg_votes_cycle_seal`, `admin_unseal_cycle`).
- ☑ `recountPosition`, `adminUnsealCycleFn` in `admin.ts`.
- ☑ Rebuilt `src/routes/admin/audit.tsx` (recount table, audit log, cycle seal status).

---

## Phase 7 — Verification ☑ (audited)

- ☑ SQL: all 17 RPCs exist (M17–M24).
- ☑ SQL: `audit_log` immutable — UPDATE/DELETE denied to `authenticated` and `service_role`.
- ☑ SQL: `audit_log` RLS enabled with SELECT policy.
- ☑ SQL: `write_audit` wired in all 9 audited functions (cast_vote, approve/reject, set_cycle_phase, grant/revoke, pledge status, positions CRUD, unseal).
- ☑ SQL: cycle-seal trigger `trg_votes_cycle_seal` live on `votes`.
- ☑ SQL: `recount_position` compares `tally_by_position` vs `votes` count, now guarded by `is_admin()`.
- ☑ SQL: `admin_mfa_enrolled` uses `status = 'verified'` (correct column).
- ☑ SQL: `admin_users` RLS — superadmin-only management policy.
- ☑ SQL: 1 superadmin seeded.
- ☑ Security (M25): `REVOKE EXECUTE FROM PUBLIC` on sensitive RPCs; `anon` blocked; `write_audit` internal-only; `tally_by_position_live` → `SECURITY INVOKER`.
- ☑ Build: `npm run build` green with regenerated types; lints clean.
- ☑ UI: public pages (home, elections, candidates, auth) render correctly; `/admin` redirects to `/auth` when unauthenticated.
- ☐ MFA: admin without TOTP → `/admin/mfa-required` (manual smoke after enroll).
- ☐ E2E: bootstrap → MFA enroll → grant reviewer → approve candidate → recount → seal → unseal (needs votes + MFA enroll).

---

## Migration inventory

| File                                        | Phase    | Remote                                               |
| ------------------------------------------- | -------- | ---------------------------------------------------- |
| `20260710101700_m17_votes_lockdown.sql`     | pre-plan | Applied                                              |
| `20260710102000_m20_audit_log.sql`          | 3        | Applied                                              |
| `20260710101800_m18_admin_manage.sql`       | 1        | Applied (via execute_sql)                            |
| `20260710101900_m19_admin_mfa.sql`          | 2        | Applied (fixed `status` only)                        |
| `20260710102100_m21_pledge_status_rpc.sql`  | 4        | Applied                                              |
| `20260710102200_m22_positions_crpcs.sql`    | 5        | Applied                                              |
| `20260710102300_m23_recount_seal.sql`       | 6        | Applied                                              |
| `20260710102400_m24_audit_wire_rpcs.sql`    | 3        | Applied                                              |
| `20260710102500_m25_security_hardening.sql` | 7        | Applied (REVOKE PUBLIC, recount guard, view INVOKER) |

Phase 0 has no migration file (one-time `auth.users` + `admin_users` insert via MCP).
