# Slice 1 — Phase B Audit Report

**Status:** Implementation complete — M5/M6 applied to Supabase project `iswdjakcdkwumxywgcby` ("mashinani youth").

**Scope:** Auth ↔ voter (`profiles`, `voters`), server-side registration with hashed National ID, frontend wiring behind `VITE_USE_SUPABASE_VOTERS`.

---

## What was implemented

### Database migrations

| File                                                 | Purpose                           |
| ---------------------------------------------------- | --------------------------------- |
| `supabase/migrations/20260710100500_m5_profiles.sql` | `profiles` + `auth.users` trigger |
| `supabase/migrations/20260710100600_m6_voters.sql`   | `voters` with hashed ID + RLS     |

### Server / API

| File                               | Purpose                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/api/register-voter.fn.ts` | `registerVoterFn` — auth middleware, location validation, SHA-256 ID hash |
| `src/lib/api/voters.ts`            | `getMyVoter`, `registerVoter`, `signOutVoter`                             |
| `src/lib/voters-source.ts`         | `useVoter()` hook, flag-aware register/sign-out                           |

### Feature flag

```env
VITE_USE_SUPABASE_VOTERS=true
```

Also set `NATIONAL_ID_PEPPER` in server env for production (falls back to dev pepper locally).

### Routes updated

- `register.tsx` — requires auth when flag on; calls server fn; no localStorage
- `dashboard.tsx` — `useVoter()`; auth gate; ID shows last-4 only
- `auth.tsx` — supports `?redirect=` after login/signup
- `site-chrome.tsx` — unified voter header via `useVoter()`
- `elections.tsx`, `elections.$positionId.tsx` — voter from `useVoter()`

### Still localStorage (Slice 2 scope)

- Vote casting, tally, ballot history keys still use `voter-store.ts`

---

## Enable & test

1. Point `.env` at project `iswdjakcdkwumxywgcby` (see Supabase dashboard for URL/keys).
2. Set `VITE_USE_SUPABASE_VOTERS=true` and optionally `VITE_USE_SUPABASE_REFERENCE_DATA=true`.
3. Sign up at `/auth` → register at `/register` → confirm dashboard shows ward/county and `ID •••XXXX`.

---

## Sign-off

| Role        | Approved to proceed to Slice 2 (real voting)? |
| ----------- | --------------------------------------------- |
| Engineering | ☐                                             |
| Product     | ☐                                             |

**Slice 2 preview:** `votes` table + `cast_vote` RPC; remove `voter-store.ts` vote functions.
