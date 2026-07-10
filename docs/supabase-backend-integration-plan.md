# MashinaniVote — Supabase Backend Integration Plan & Implementation Guide

> **Project:** MY-KDM Vote (Mashinani Youth Kazi Delivery Movement — electronic voting platform)
> **Stack:** TanStack Start (SSR) · React 19 · Vite · TypeScript · Tailwind v4 · Radix/shadcn UI · `@supabase/supabase-js` v2
> **Lovable-connected:** yes — avoid rewriting published git history (see `AGENTS.md`)
> **Supabase project id:** `iswdjakcdkwumxywgcby` ("mashinani youth") — active remote.  
> `supabase/config.toml` / `.env` may still reference Lovable `hjtnuihppwsdrluoyjqx`; align for local CLI.  
> **Status of this doc:** living implementation guide. Tick the `- [ ]` boxes as work lands.  
> **Audit snapshot (2026-07-10):** Slices 0–7 largely done behind feature flags; see `docs/pre-audit-progress.md`.

---

## 1. Purpose & scope

This document is the comprehensive plan for wiring the MashinaniVote frontend to a
Supabase backend so that **every user-facing function persists to and reads from the
database** instead of the current mix of mock data and `localStorage`.

It covers:

1. What the platform does today (features + workflows).
2. The current data layer and exactly what is/isn't already wired to Supabase.
3. A gap analysis of every function that still needs a backend.
4. The target database schema (tables, enums, RLS, triggers, RPCs, storage, realtime).
5. A file-by-file implementation guide with task checklists.
6. Migration order, environment setup, testing, security and rollout.
7. Production-readiness hardening (observability, rate limiting, idempotency,
   encryption, backups, load testing, monitoring).

**Target bar: production-ready.** This is not a demo backend. The plan assumes the
elections must be tamper-evident, auditable, and survive real voter load. Prototype
shortcuts that exist in the codebase today (e.g. the `candidates_auto_approve` trigger,
`localStorage` votes, fake analytics) are explicitly removed, not preserved. Where a
trade-off has a "demo" option and a "production" option, the doc picks production and
flags it.

The guide is ordered so that each phase is independently shippable: you can stop after
any phase and the app still builds and runs.

---

## 2. What the platform does today

MY-KDM Vote is an electronic voting platform for an elected, four-tier Kenyan youth
leadership structure (National Secretariat → County → Constituency → Ward). The
mandate described in the UI is to run certified, contested, audited elections
"county by county, ward by ward", powered by an external sibling app called **M-Taji**
(`https://m-taji-tracker.vercel.app`) which hosts candidate profiles, projects and
donations.

### 2.1 Pages (routes) and their current data source

| Route file                                       | URL                                    | Purpose                                                      | Data source today                                                               |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `routes/index.tsx`                               | `/`                                    | Marketing home, featured contestants carousel, tier overview | **Mock** `POSITIONS`, `CANDIDATES` from `lib/mym-data.ts`                       |
| `routes/about.tsx`                               | `/about`                               | Concept note, National Secretariat bios                      | **Mock** `POSITIONS`, `CANDIDATES` + static images                              |
| `routes/auth.tsx`                                | `/auth`                                | Email/password login + signup                                | **Supabase Auth** (`signInWithPassword`, `signUp`) → redirects to `/dashboard`  |
| `routes/register.tsx`                            | `/register`                            | Voter registration (National ID + location + phone)          | **`localStorage`** via `lib/voter-store.ts`                                     |
| `routes/dashboard.tsx`                           | `/dashboard`                           | Voter dashboard: registration, ballot history, open ballots  | **`localStorage`** via `lib/voter-store.ts` ⚠️ ignores Supabase Auth user       |
| `routes/elections.tsx`                           | `/elections`                           | Live ballot hub: tally, stats, scoped analytics, quick-vote  | **Mock** candidates/positions + **`localStorage`** votes/tally                  |
| `routes/elections.$positionId.tsx`               | `/elections/$positionId`               | Single-position ballot with eligibility + poll-window checks | **Mock** + **`localStorage`** votes                                             |
| `routes/candidates.tsx`                          | `/candidates`                          | Browse certified candidates, verify certificate dialog       | **Supabase** `candidates` table via `lib/candidates.ts`                         |
| `routes/candidates.apply.tsx`                    | `/candidates/apply`                    | Aspirant sign-up form → issues certificate                   | **Supabase** `candidates` insert (auto-approved by trigger)                     |
| `routes/candidates.$candidateId.dashboard.tsx`   | `/candidates/$candidateId/dashboard`   | Per-candidate live KPI dashboard                             | **Supabase** for identity; **fake/seeded** stats (votes, share, rank, momentum) |
| `routes/candidates.$candidateId.certificate.tsx` | `/candidates/$candidateId/certificate` | Printable electronic clearance certificate                   | **Supabase** `getCandidate`                                                     |
| `routes/sitemap[.]xml.ts`                        | `/sitemap.xml`                         | Sitemap                                                      | static                                                                          |

### 2.2 Core workflows (as the UI presents them)

1. **Voter registration** — a visitor enters full name, National ID, county,
   constituency, ward and phone. The UI validates with Zod, then stores a `Voter`
   object. Today this is `localStorage` only; nothing leaves the device.
2. **Casting a vote** — a registered voter picks a candidate on a position ballot and
   submits. Eligibility is enforced (voter's county/constituency/ward must match the
   position's scope) and the regional poll window must be open (08:00–18:00 EAT on the
   county's scheduled day). One vote per voter per position. Today votes live in
   `localStorage` and tallies are computed in-browser.
3. **Candidate certification** — an aspirant submits identity (National ID, IEBC voter
   number, phone), the seat they're vying for (tier + position title + scope), and
   optional slogan/bio/party. A Postgres trigger auto-approves and issues a
   tamper-proof certificate number (`MYM-2026-<CO|CN|WD>-<8hex>`). This is the **only
   workflow already fully backed by Supabase**.
4. **Certificate verification** — the certificate page renders a verify URL
   `https://mym.vote/verify/<cert_number>` and a QR code, but **no such route exists**.
5. **Live results** — the elections hub shows tallies, provisional leader, vote-by-gender,
   turnout-by-region and age split. All analytics today are deterministic hashes, not
   real data.
6. **Support / donate / partner** — the `SupportButton` dialog collects a pledge
   (donate amount, or partner/other message) but only flips a `submitted` state; nothing
   is persisted.
7. **Auth** — email/password auth exists and is wired through the TanStack Start
   function middleware (`attachSupabaseAuth` in `start.ts`) and server middleware
   (`requireSupabaseAuth`), but the authenticated user is **not** connected to a voter
   profile or a candidate profile.

### 2.3 Regional election schedule (currently hardcoded)

Defined in `lib/election-schedule.ts` as `REGION_SCHEDULE` — Kenya's 8 former provinces
vote on consecutive days from **Tue 21 Jul 2026 → Tue 28 Jul 2026**, polls 08:00–18:00
EAT. `pollStatus()` returns `upcoming | open | closed`. This is client-side and
timezone-correct via `Africa/Nairobi`.

---

## 3. Current Supabase integration state

### 3.1 What already exists

- **Clients**
  - `src/integrations/supabase/client.ts` — browser client (publishable key,
    `localStorage` session persistence, auto-refresh).
  - `src/integrations/supabase/client.server.ts` — service-role admin client for
    trusted server functions (bypasses RLS).
  - `src/integrations/supabase/auth-middleware.ts` — `requireSupabaseAuth` server
    middleware that validates a Bearer token via `auth.getClaims` and exposes
    `{ supabase, userId, claims }` to server functions.
  - `src/integrations/supabase/auth-attacher.ts` — `attachSupabaseAuth` client
    middleware that attaches the session access token to every server-function RPC;
    registered globally in `src/start.ts`.
- **Auth UI** — `routes/auth.tsx` performs real sign-up / sign-in.
- **Data access** — `src/lib/candidates.ts` queries the `candidates` table
  (`listCandidates`, `getCandidate`, `submitCandidate`).
- **Database** — one migration creates the `candidates` table (`candidate_tier`,
  `candidate_status` enums), grants, RLS policies, an `updated_at` trigger, an
  auto-approve trigger, and a certificate-issuance trigger. A second migration
  tightens the insert policy with field-length checks.
- **Generated types** — `src/integrations/supabase/types.ts` only models `candidates`.

### 3.2 What is NOT wired (the gaps)

> **2026-07-10 audit:** Items below marked `[x]` are implemented behind `VITE_USE_SUPABASE_*` flags
> (or unconditionally for verify/admin routes). Mock fallbacks remain when flags are off.

- [x] **Positions** — `positions` table + `src/lib/api/positions.ts`; elections routes use when
      `VITE_USE_SUPABASE_REFERENCE_DATA` / master flag is on.
- [x] **Voters** — `voters` table + `register-voter.fn.ts`; `register.tsx` / `dashboard.tsx` when
      `VITE_USE_SUPABASE_VOTERS` is on.
- [x] **Votes** — `votes` + `vote_receipts` + `cast_vote` RPC; `cast-vote.fn.ts` when
      `VITE_USE_SUPABASE_VOTING` is on.
- [x] **Tally / results** — `tally_by_position` RPC + `tally_by_position_live` view + Realtime in
      `votes-source.ts`.
- [x] **Auth ↔ voter mismatch** — fixed in Supabase mode: dashboard reads `voters` for `auth.uid()`.
- [x] **Auth ↔ candidate mismatch** — `submit-candidate.fn.ts` sets `user_id`; status defaults `pending`.
- [x] **National tier** — `national` in `candidate_tier`; apply form offers national tier + position picker.
- [x] **Candidate ↔ position link** — `position_id` column + apply flow requires it.
- [x] **Candidate dashboard stats** — real tally + Realtime when `VITE_USE_SUPABASE_ANALYTICS` on
      (`candidates.$candidateId.dashboard.tsx`).
- [x] **Elections analytics** — real RPCs when analytics flag on; `hashUnit` fallback when off.
- [ ] **Election schedule** — `src/lib/api/schedule.ts` exists but `election-schedule.ts` still
      hardcodes `REGION_SCHEDULE` as primary source.
- [x] **Support / donations / partnerships** — `support_pledges` + `submit-pledge.fn.ts`.
- [x] **Certificate verification** — `/verify/$certificateNumber` + `verify_certificate` RPC.
- [x] **Audit trail / receipts** — `vote_receipts` + `verify_receipt` RPC; **`audit_log` table not migrated**.
- [ ] **Candidate photos** — Storage buckets exist; upload helper in `election-candidates.ts` not wired
      in `candidates.apply.tsx`.
- [x] **Admin / moderation** — admin routes + M15 dropped auto-approve; **0 `admin_users` bootstrapped**.
- [x] **RLS coverage** — all new tables have RLS in M1–M16 migrations.
- [x] **Realtime** — M14 publication + `subscribeToPositionVotes` (30s fallback poll).
- [x] **Generated types** — regenerated for full schema (`iswdjakcdkwumxywgcby`).

---

## 4. Target architecture

### 4.1 Principles

- **RLS-first.** Every table has RLS enabled. The browser client (publishable key)
  only ever performs operations that RLS permits. Service-role admin client is used
  solely inside server functions / edge functions for trusted operations.
- **Auth is the identity root.** A Supabase Auth user is the principal. A `voters`
  row and (optionally) a `candidates` row hang off `auth.uid()`.
- **Server functions for sensitive writes.** Vote casting, candidate submission
  moderation, and admin actions go through TanStack server functions that use
  `requireSupabaseAuth` + the user-scoped client, so RLS is enforced but we can also
  add server-side validation (poll window, eligibility, idempotency).
- **Real data replaces mock data incrementally.** `lib/mym-data.ts` is replaced by
  Supabase queries behind the same exported shapes so route components change minimally.
- **Realtime for liveness.** Tally and candidate-dashboard numbers update via
  Supabase Realtime instead of `setInterval`.

### 4.2 High-level component map

```
Browser (publishable key) ──► PostgREST (RLS-enforced) ──► Postgres
   │                                                          ▲
   │  server functions (requireSupabaseAuth)                  │
   └─────────────────────────────────────────────────────► service_role (admin, RLS bypass)
   │                                                          ▲
   │  Realtime (postgres_changes / broadcast)                 │
   └─────────────────────────────────────────────────────► WAL / pub-sub

Auth (Supabase Auth) ──► auth.users ──► triggers ──► public.profiles
                                              └──► public.voters (1:1 with profile, when registered)
```

---

## 5. Target database schema

All new migrations live in `supabase/migrations/` with the existing
`YYYYMMDDHHMMSS_<uuid>.sql` naming. The enums and `candidates` table already exist;
the plan below **extends** the schema. Where the existing `candidates` table needs to
change (e.g. add `position_id`, add `national` to the tier enum), use
`ALTER ... ADD COLUMN` / `ALTER TYPE ... ADD VALUE` so existing rows survive.

### 5.1 Enums

```sql
-- existing
-- candidate_tier   : county | constituency | ward
-- candidate_status : pending | approved | rejected

-- extend tier to include national
ALTER TYPE public.candidate_tier ADD VALUE IF NOT EXISTS 'national';

-- new enums
CREATE TYPE public.position_tier AS ENUM ('national','county','constituency','ward');
CREATE TYPE public.election_phase AS ENUM ('draft','scheduled','open','closed','tallied','cancelled');
CREATE TYPE public.vote_status AS ENUM ('cast','spoilt','retracted');
CREATE TYPE public.support_kind AS ENUM ('donation','partnership','other');
CREATE TYPE public.pledge_status AS ENUM ('pledged','fulfilled','expired');
CREATE TYPE public.admin_role AS ENUM ('superadmin','director','returning_officer','clerk');
```

> **Note on `candidate_tier` vs `position_tier`:** keep `candidate_tier` for backwards
> compatibility with the existing table/types, but new code should read tier from the
> related `positions` row. We add `national` to `candidate_tier` so a national
> aspirant can still be stored.

### 5.2 Tables

#### `positions` (new — replaces `POSITIONS` mock)

```sql
CREATE TABLE public.positions (
  id            text PRIMARY KEY,                 -- stable slug e.g. 'governor-nairobi'
  tier          public.position_tier NOT NULL,
  title         text NOT NULL,
  scope         text NOT NULL,                    -- 'National Secretariat' | 'County Leadership' ...
  description   text NOT NULL,
  county        text,
  constituency  text,
  ward          text,
  election_cycle_id bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positions_scope_check CHECK (
    (tier = 'national')   OR
    (tier = 'county'      AND county IS NOT NULL) OR
    (tier = 'constituency' AND county IS NOT NULL AND constituency IS NOT NULL) OR
    (tier = 'ward'        AND county IS NOT NULL AND constituency IS NOT NULL AND ward IS NOT NULL)
  )
);
CREATE INDEX positions_tier_idx        ON public.positions(tier);
CREATE INDEX positions_county_idx      ON public.positions(county);
CREATE INDEX positions_constituency_idx ON public.positions(constituency);
CREATE INDEX positions_cycle_idx       ON public.positions(election_cycle_id);
```

#### `election_cycles` (new — top-level election container)

```sql
CREATE TABLE public.election_cycles (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,                      -- '2026 MY-KDM General Elections'
  slug        text NOT NULL UNIQUE,
  window_start timestamptz NOT NULL,
  window_end  timestamptz NOT NULL,
  phase       public.election_phase NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `poll_windows` (new — replaces hardcoded `REGION_SCHEDULE`)

```sql
CREATE TABLE public.poll_windows (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cycle_id    bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE CASCADE,
  region      text NOT NULL,                      -- 'Nairobi' | 'Central' | ...
  poll_date   date NOT NULL,                      -- EAT day
  opens_at    timestamptz NOT NULL,               -- '2026-07-21T08:00:00+03:00'
  closes_at   timestamptz NOT NULL,
  counties    text[] NOT NULL DEFAULT '{}',       -- counties that vote in this window
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, region)
);
CREATE INDEX poll_windows_cycle_idx    ON public.poll_windows(cycle_id);
CREATE INDEX poll_windows_county_idx   ON public.poll_windows USING GIN (counties);
```

#### `profiles` (new — 1:1 with `auth.users`)

```sql
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  email       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

A trigger on `auth.users` inserts a `profiles` row on new-user creation
(copying `raw_user_meta_data->>'full_name'`).

#### `voters` (new — replaces `localStorage` voter)

```sql
CREATE TABLE public.voters (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- National ID is stored hashed (SHA-256 + server pepper in Vault) for uniqueness;
  -- the raw value is NEVER stored. last4 is kept for UI display.
  national_id_hash  text NOT NULL UNIQUE,
  national_id_last4 text NOT NULL,
  full_name         text NOT NULL,
  county            text NOT NULL,
  constituency      text NOT NULL,
  ward              text NOT NULL,
  phone             text NOT NULL,
  phone_verified    boolean NOT NULL DEFAULT false,   -- gate for cast_vote (§11.5)
  date_of_birth     date,
  gender            text,
  registered_at     timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX voters_county_idx       ON public.voters(county);
CREATE INDEX voters_constituency_idx ON public.voters(constituency);
CREATE INDEX voters_ward_idx         ON public.voters(ward);
```

> **Security (production default):** `national_id_hash` is computed in the
> `registerVoter` server function as `sha256(pepper || national_id)` where `pepper` is
> read from Supabase Vault and never reaches the client. The raw National ID never
> persists to any table or log. `national_id_last4` powers the `ID •••<last4>` UI in
> `dashboard.tsx`. RLS restricts `SELECT` to `user_id = auth.uid()` (see §5.4).

#### Extend `candidates` (existing)

```sql
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_id  text REFERENCES public.positions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS election_cycle_id bigint REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS photo_path   text,
  ADD COLUMN IF NOT EXISTS reviewed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at  timestamptz;

-- position_id becomes required for approved candidates (enforced via a partial CHECK
-- added once backfill is complete; see §7 backfill tasks).
```

#### `votes` (new — replaces `localStorage` votes)

```sql
CREATE TABLE public.votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id      uuid NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  position_id   text NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  candidate_id  uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  cycle_id      bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  receipt_code  text NOT NULL UNIQUE,             -- returned to voter as "encrypted receipt"
  cast_at       timestamptz NOT NULL DEFAULT now(),
  status        public.vote_status NOT NULL DEFAULT 'cast',
  -- Tamper-evidence: store a hash of (voter_id, position_id, candidate_id, cast_at)
  -- so recounts can verify integrity without revealing the voter.
  ballot_hash   text NOT NULL,
  CONSTRAINT votes_one_per_position UNIQUE (voter_id, position_id)
);
CREATE INDEX votes_position_idx   ON public.votes(position_id);
CREATE INDEX votes_candidate_idx  ON public.votes(candidate_id);
CREATE INDEX votes_cycle_idx      ON public.votes(cycle_id);
```

> The `UNIQUE (voter_id, position_id)` constraint is the database-level guarantee of
> "one vote per voter per position". A voter _changing_ their vote is implemented as an
> `UPDATE ... SET candidate_id = $1, receipt_code = $2, cast_at = now()` on the
> existing row (so the unique constraint still holds), not a second insert.

#### `vote_receipts` (new — audit / verification)

```sql
CREATE TABLE public.vote_receipts (
  receipt_code  text PRIMARY KEY,
  voter_id      uuid NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  position_id   text NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  candidate_id  uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  cast_at       timestamptz NOT NULL,
  -- public-facing verification only exposes: receipt_code -> position, candidate, cast_at
  -- NEVER the voter_id (enforced by a restricted view + RLS).
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

#### `support_pledges` (new — replaces no-op `SupportButton`)

```sql
CREATE TABLE public.support_pledges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        public.support_kind NOT NULL,
  amount_kes  integer,                            -- nullable for partnership/other
  full_name   text NOT NULL,
  phone       text,
  email       text,
  message     text,
  status      public.pledge_status NOT NULL DEFAULT 'pledged',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

#### `admin_users` (new — RBAC for the admin console)

```sql
CREATE TABLE public.admin_users (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role     public.admin_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `ke_locations` (new — server-side source of truth for Kenya administrative units)

A read-only reference table seeded from the `kenya-locations` library (see §5.7) so the
database — not the frontend — is the authority for county/constituency/ward validation.
Used by `voters`, `positions`, and the `cast_vote` / `registerVoter` RPCs to reject
invalid or misspelled locations server-side.

```sql
CREATE TABLE public.ke_locations (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  county          text NOT NULL,
  constituency    text NOT NULL,
  ward            text NOT NULL,
  county_code     text,                -- IEBC county code (01..47)
  constituency_code text,              -- IEBC constituency code
  ward_code       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (county, constituency, ward)
);
CREATE INDEX ke_locations_county_idx        ON public.ke_locations(county);
CREATE INDEX ke_locations_constituency_idx  ON public.ke_locations(constituency);
CREATE INDEX ke_locations_ward_idx          ON public.ke_locations(ward);
-- RLS: publicly readable (reference data), no client writes.
```

### 5.3 Views & RPCs

- [x] **`public.tally_by_position(position_id text)`** — M8 migration.
- [x] **`public.tally_by_position_live`** (view) — M8 migration.
- [x] **`public.voter_turnout(scope)`** — M9 migration.
- [x] **`public.analytics_gender_split(position_id)`** /
      **`analytics_age_split(position_id)`** — M9 migration.
- [x] **`public.verify_receipt(receipt_code text)`** — M10 migration.
- [x] **`public.verify_certificate(certificate_number text)`** — M10 migration.
- [x] **`public.cast_vote(p_position_id, p_candidate_id)`** — M8 migration.
- [ ] **`public.recount_position(position_id)`** — not migrated (§11.2).

### 5.4 RLS policy plan

- [x] **`profiles`** — M5 migration.
- [x] **`voters`** — M6 migration.
- [x] **`positions`** — M2 migration.
- [x] **`election_cycles` / `poll_windows`** — M1 migration.
- [x] **`candidates`** — original + M16 tightened auth-owned path.
- [x] **`votes`** — M7 migration; aggregation via RPCs.
- [x] **`vote_receipts`** — M7; verification via `verify_receipt` RPC.
- [x] **`support_pledges`** — M11 migration.
- [x] **`admin_users`** — M12 migration.
- [x] **`ke_locations`** — M1b migration (public read).

### 5.5 Storage

- [x] Create a public Storage bucket `candidate-photos` for candidate portrait uploads (M13).
- [x] Storage policies: candidate upload path + public read (M13).
- [x] Create a private bucket `candidate-docs` for IEBC/ID supporting documents (M13).

### 5.6 Realtime

- [x] Enable Realtime on the `votes` table (M14).
- [x] Elections hub + candidate dashboard subscribe via `subscribeToPositionVotes` in
      `votes-source.ts` / candidate dashboard (30s fallback poll).

### 5.7 Kenya locations — library + server-side reference

Today `src/lib/kenya-locations.ts` is a 59 KB hardcoded dataset (47 counties, 290
constituencies, 1,450 wards) sourced from an IEBC-gazetted boundaries project. For a
production backend we replace this with (a) a maintained npm library for the
**frontend** cascading selectors and (b) the `ke_locations` Postgres table (§5.2) for
**server-side validation**, so the database is the authority and the frontend library
is just a convenience.

#### Library choice: `kenya-locations`

`kenya-locations` (davidamunga) is the recommended package:

- 47 counties · 290 constituencies · 1,450 wards — identical coverage to the current
  hardcoded file.
- First-class TypeScript types, tree-shakeable subpath imports
  (`kenya-locations/counties`, `kenya-locations/constituencies`, `kenya-locations/wards`).
- O(1) name/code lookups; case-insensitive search.
- Optional React companion `kenya-locations-react` if we want drop-in cascading
  selects later.
- MIT licensed; actively maintained through 2026.

Alternatives considered: `kenya-administrative-divisions` (single global object, less
ergonomic API) and `ke-locations-data` (newer, smaller community). `kenya-locations`
wins on API design and subpath exports.

#### Migration path

- [x] `npm install kenya-locations` (add to `package.json` dependencies).
- [x] Create `src/lib/locations.ts` as a thin adapter that re-exports the shapes the
      app already consumes, so route files don't change their import surface:
  - `COUNTY_NAMES: string[]` ← `getCounties()` mapped to names (sorted, IEBC order).
  - `constituenciesForCounty(county): string[]` ← `getConstituenciesInCounty(county)`.
  - `wardsForConstituency(constituency): string[]` ← `getWardsInConstituency(constituency)`.
  - `ALL_CONSTITUENCIES`, `ALL_WARDS` ← library getters, mapped to
    `{ county, name }` / `{ county, constituency, name }`.
  - `TOTAL_COUNTIES / TOTAL_CONSTITUENCIES / TOTAL_WARDS` constants.
- [x] Replace every `import ... from "@/lib/kenya-locations"` with the new adapter
      (`register.tsx`, `candidates.apply.tsx`, `candidates.tsx`,
      `components/location-tier-bar.tsx`, and any other consumers).
- [x] Delete `src/lib/kenya-locations.ts` (the 59 KB hardcoded file) once no imports
      remain.
- [x] **Server-side validation** — **Revised:** validate locations on the **frontend** via
      `kenya-locations` (`src/lib/locations.ts`); backend accepts location **strings** (Zod length only).
      `ke_locations` remains reference/analytics data, not a validation gate.
- [ ] **Seed `ke_locations`** — table + RLS done; **600/1,448 rows** in remote DB (partial).
- [ ] **Keep the data in sync** — `scripts/gen-ke-locations-seed.ts` exists; pin version note TBD.

---

## 6. Frontend implementation guide (file by file)

The strategy is to introduce a **data-access layer** (`src/lib/api/*.ts`) that wraps
Supabase queries and returns shapes compatible with the existing route components, so
the route files swap mock imports for async queries with minimal JSX churn. TanStack
Router loaders and React Query (`@tanstack/react-query` is already a dependency) cache
the results.

### 6.1 New data-access modules

- [x] Create `src/lib/api/positions.ts`
- [x] Create `src/lib/api/voters.ts`
- [x] Create `src/lib/api/votes.ts`
- [x] Create `src/lib/api/schedule.ts`
- [x] Create `src/lib/api/analytics.ts`
- [x] Create `src/lib/api/support.ts`
- [x] Extend `src/lib/candidates.ts` (`position_id`, `user_id`, server-fn submit)
- [x] Create `src/lib/api/verify.ts`
- [x] Create `src/lib/locations.ts` (adapter over `kenya-locations`)
- [x] Create `src/lib/api/admin.ts`, `election-candidates.ts` (admin + photo helper)

### 6.2 Server functions (TanStack Start)

Server functions live as `src/lib/api/*.fn.ts` and use `requireSupabaseAuth` from
`auth-middleware.ts`.

- [x] `src/lib/api/cast-vote.fn.ts` — `castVote` → `cast_vote` RPC.
- [x] `src/lib/api/register-voter.fn.ts` — `registerVoter`; hashes National ID; Zod string locations.
- [x] `src/lib/api/submit-candidate.fn.ts` — auth-owned insert; `status='pending'`.
- [x] `src/lib/api/submit-pledge.fn.ts` — `submitPledge`.
- [x] `src/lib/api/admin.ts` — approve/reject/phase/schedule via admin RPCs (no MFA gate yet).

### 6.3 Route rewrites

- [x] **`routes/register.tsx`** — Supabase voters when flagged; auth gate; frontend location validation.
- [x] **`routes/dashboard.tsx`** — auth-user voter profile when flagged; sign-out wired.
- [x] **`routes/elections.tsx`** — real positions/candidates/tally/analytics + Realtime when flagged.
- [x] **`routes/elections.$positionId.tsx`** — real loader + tally + castVote when flagged.
- [ ] **`routes/candidates.tsx`** — Supabase-backed; VerifyDialog still local (not RPC).
- [x] **`routes/candidates.apply.tsx`** — auth, `position_id`, national tier, server fn, pending review.
- [x] **`routes/candidates.$candidateId.dashboard.tsx`** — real tally + Realtime when flagged.
- [x] **`routes/candidates.$candidateId.certificate.tsx`** — verify URL → `/verify/$cert`.
- [x] **`routes/auth.tsx`** — unchanged; redirect target handling works.
- [x] **`routes/index.tsx` + `routes/about.tsx`** — real `count_*` RPCs when `VITE_USE_SUPABASE_BACKEND`.
- [x] **`components/support-button.tsx`** — `submitPledge` when flagged.
- [x] **New route `routes/verify.$certificateNumber.tsx`**
- [x] **New route `routes/receipt.$receiptCode.tsx`**
- [x] **New route tree `routes/admin/*`** — index, candidates, positions (read-only), schedule, support, audit.

### 6.4 Removing the mock layer

- [ ] Delete `src/lib/mym-data.ts` — **deferred**; still used when flags off (mock fallback).
- [ ] Delete `src/lib/voter-store.ts` — **deferred**; still used when flags off.
- [ ] Keep `src/lib/election-schedule.ts` — hardcoded `REGION_SCHEDULE` still primary;
      `api/schedule.ts` not yet wired as default.

### 6.5 Generated types

- [x] Regenerate `src/integrations/supabase/types.ts` for `iswdjakcdkwumxywgcby`.
- [x] API modules use regenerated `Database` types.

---

## 7. Migration & seed plan

Run order (each is a separate migration file so it can be reviewed/applied
independently). Use the Supabase MCP `apply_migration` tool or local `supabase migration
up`. **Back up the project before running destructive alters.**

### Phase A — core reference data

- [x] **M1** `election_cycles` + `poll_windows` tables, enums + seed.
- [ ] **M1b** `ke_locations` table + RLS done; seed **partial (600/1,448 rows)**.
- [x] **M2** `positions` table + seed (10 positions in remote DB).
- [x] **M3** `ALTER TYPE candidate_tier ADD VALUE 'national'`.
- [x] **M4** extend `candidates` (`position_id`, `election_cycle_id`, `user_id`, etc.).

### Phase B — identity & voting

- [x] **M5** `profiles` table + trigger on `auth.users`.
- [x] **M6** `voters` table + RLS + indexes.
- [x] **M7** `votes` + `vote_receipts` tables + RLS + unique constraint.
- [x] **M8** `cast_vote` RPC + `tally_by_position` + `tally_by_position_live` view.
- [x] **M9** Analytics RPCs (`analytics_*`, `count_*`, `voter_turnout`).
- [x] **M10** `verify_certificate` + `verify_receipt` RPCs.

### Phase C — support, admin, storage

- [x] **M11** `support_pledges` table + enums + RLS.
- [x] **M12** `admin_users` table + `admin_role` enum + RLS. **Bootstrap superadmin pending (0 rows).**
- [x] **M13** Storage buckets `candidate-photos` + `candidate-docs`.
- [x] **M14** Realtime publication on `votes`.

### Phase D — prototype-cleanups

- [x] **M15** Drop `candidates_auto_approve` trigger; default `pending`.
- [x] **M16** Tighten `candidates` RLS + admin RPCs.

### Seed scripts

- [x] Write `supabase/seed.sql` — applied remotely (22 approved candidates, cycle `open`).
- [x] Write `scripts/gen-ke-locations-seed.ts` — seed generator exists.
- [ ] Complete `ke_locations` backfill to 1,448 rows.

---

## 8. Admin console (new)

- [x] `routes/admin/index.tsx` — dashboard KPIs.
- [x] `routes/admin/candidates.tsx` — review queue (approve/reject).
- [ ] `routes/admin/positions.tsx` — **read-only list**; no CRUD form yet.
- [x] `routes/admin/schedule.tsx` — poll windows + cycle phase.
- [x] `routes/admin/support.tsx` — pledge list.
- [x] `routes/admin/audit.tsx` — read-only votes/receipts view.
- [ ] Admin MFA gate in loaders — not implemented.
- [ ] Bootstrap first `superadmin` — 0 rows in `admin_users`.

---

## 9. Security & integrity checklist

- [ ] **RLS enabled on every new table**; verify with `select * from pg_tables where
    rowsecurity = false` in the public schema (should be empty).
- [ ] **`votes` never directly readable across voters**; all aggregation via
      `SECURITY DEFINER` RPCs that do not leak `voter_id`.
- [ ] **`national_id`** stored hashed (SHA-256 + Vault pepper) with `last4` for
      display; raw value never stored or logged; `voters` RLS restricts `SELECT` to
      `user_id = auth.uid()` (production default — see §11.3).
- [ ] **`cast_vote` RPC** validates: voter exists & belongs to `auth.uid()`; voter is
      `verified` (phone OTP); poll window is `open` for the voter's county and cycle
      `phase = 'open'`; candidate is `approved` and `position_id` matches; voter's
      county/constituency/ward matches the position scope; one vote per position
      (enforced by unique constraint + RPC upsert). This is the sole write path.
- [ ] **Receipts** are random, unique, non-enumerable 26-char base32 tokens
      (`gen_random_bytes`); do not encode the voter or candidate.
- [ ] **Service-role key** never shipped to the browser; only imported inside
      `*.server.ts` / server functions (the existing `client.server.ts` comment already
      enforces this convention). Add a CI grep to guarantee it.
- [ ] **Rate limiting** on `submitCandidate`, `submitPledge`, `castVote`, and the
      public verify endpoints (Supabase Edge Function in front of the RPC, and/or a
      per-voter/per-IP rolling-window check inside the RPC).
- [ ] **Audit log** — append-only `audit_log` table for admin actions and vote
      changes (approve/reject, phase changes, pledge status, vote cast/change).
      `UPDATE/DELETE` revoked from all roles. Required for production (see §11.2).
- [ ] **Backups** — confirm Supabase project has PITR / daily backups enabled before
      running destructive migrations; take a pre-election snapshot (§11.8).
- [ ] **Secrets** — `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and
      `SUPABASE_SERVICE_ROLE_KEY` are set in Lovable Cloud env (the clients already
      reference them). The service role key must be server-only. The National ID
      pepper and signing keys live in Supabase Vault (§11.3).

---

## 10. Realtime & liveness plan

- [ ] Elections hub: subscribe to `postgres_changes` on `public.votes` filtered by
      `position_id`; on any change, refetch `tally_by_position(positionId)` (or apply
      a local delta). Throttle to avoid refetch storms.
- [ ] Candidate dashboard: subscribe to `votes` for its `position_id`; recompute
      share/rank locally from the latest tally RPC.
- [ ] Replace every `setInterval` "live" tick (`elections.tsx` 3s,
      `candidates.$candidateId.dashboard.tsx` 4s, `dashboard.tsx` event pollers) with
      the realtime subscription + a slow fallback poll (e.g. 30s) in case realtime
      drops.
- [ ] Add a `useTally(positionId)` React Query hook with `staleTime: 0` that
      invalidates on realtime events.

---

## 11. Production-readiness hardening

The earlier sections define _what_ to build. This section defines the bar the backend
must clear before it is allowed to run a real election. Treat every item as a launch
blocker unless explicitly marked "recommended".

### 11.1 Integrity & tamper-evidence (blocker)

- [ ] **No prototype shortcuts in the write path.** Remove `candidates_auto_approve`
      (M15) before any real aspirant applies. Default `candidates.status` to `pending`;
      approval is an explicit admin action that sets `reviewed_by` + `reviewed_at`.
- [ ] **`cast_vote` is the single write path to `votes`.** No client ever `INSERT`s
      into `votes` directly — the RLS policy denies client inserts entirely and the
      `SECURITY DEFINER` RPC performs the insert with elevated privileges after
      validation. This is the cornerstone of integrity.
- [ ] **`votes.ballot_hash`** = `digest(voter_id || ':' || position_id || ':' ||
    candidate_id || ':' || cast_at, 'sha256')` computed inside the RPC. Used by a
      `recount_position(position_id)` RPC that recomputes tallies from `votes` and
      compares against `tally_by_position_live` to detect drift.
- [ ] **Receipts are unguessable and non-enumerable.** `receipt_code` is a
      26-character base32 (like a Stripe id) from `gen_random_bytes`, `UNIQUE`, with
      no sequential component. `verify_receipt` never returns `voter_id`.
- [ ] **One vote per voter per position** is enforced at three layers: the
      `UNIQUE (voter_id, position_id)` constraint, the RPC upsert logic, and RLS.
      A "change vote" is an `UPDATE` of the existing row (same constraint), not a
      second insert; record the prior choice in `audit_log`.
- [ ] **Poll window enforcement in the RPC**, not the UI. `cast_vote` queries
      `poll_windows` for the voter's county and rejects unless `now()` is within
      `[opens_at, closes_at)` and the cycle `phase = 'open'`. The frontend's
      `pollStatus()` is advisory only.
- [ ] **Eligibility enforcement in the RPC.** Voter's `(county, constituency, ward)`
      must match the position's scope; the candidate's `position_id` must equal the
      target position and `status = 'approved'`. The UI's `isEligible()` is advisory.

### 11.2 Auditability (blocker)

- [ ] **`audit_log` table (append-only).** Promote the earlier "optional" audit table
      to required. Columns: `id`, `actor_user_id`, `action`, `target_type`,
      `target_id`, `before jsonb`, `after jsonb`, `ip inet`, `user_agent text`,
      `created_at`. RLS: a user can `SELECT` only their own rows; admins `SELECT` all;
      **no `UPDATE`/`DELETE` to anyone** (revoke `UPDATE/DELETE` from all roles,
      including service_role, via `REVOKE`).
- [ ] **Audited actions:** vote cast, vote changed, candidate submit, candidate
      approve/reject, cycle phase change, poll window edit, admin role grant/revoke,
      pledge status change, voter profile edit.
- [ ] **Recount RPC** `recount_position(position_id)` returns `{ declared_total,
    recounted_total, match boolean, mismatched_rows jsonb }` for scrutineers.
- [ ] **Immutable results.** Once a cycle reaches `phase='tallied'`, a trigger
      blocks further `INSERT/UPDATE/DELETE` on `votes` for that cycle (raise an
      exception). Only a superadmin "unseal" action (itself audited) can re-open it.

### 11.3 PII & secrets (blocker)

- [ ] **`national_id` is hashed at rest.** Store `national_id_hash` (SHA-256, salted
      with a server-only pepper held in a Supabase Vault secret) for uniqueness/lookup,
      and `national_id_last4` for display. Do not store the raw National ID. The
      `registerVoter` server function hashes before insert; the RPC never logs the
      raw value.
- [ ] **Vault secrets** — the ID pepper, any M-Pesa/API keys, and signing keys live in
      Supabase Vault, loaded via `vault.decrypted_secrets` inside `SECURITY DEFINER`
      functions only.
- [ ] **`voters` PII columns** (`phone`, `date_of_birth`, `gender`) are
      `SELECT`-restricted to the owning user and admins; never exposed in tally/analytics
      RPCs. Analytics joins aggregate and do not return per-voter PII.
- [ ] **Service-role key** is server-only (already enforced by convention in
      `client.server.ts`); add a CI grep check that it is never imported from a
      client-bundle file (`*.ts` reachable from `routes` or `*.functions.ts`).

### 11.4 Rate limiting & abuse (blocker)

- [ ] **Vote casting** — per-voter minimum interval (e.g. 5s between casts/changes) to
      dampen scripting; per-IP rate limit via an Edge Function in front of `cast_vote`
      or a `vote_attempts` table with a rolling window.
- [ ] **Registration & candidate submission** — per-IP and per-phone rate limits to
      stop bulk fake accounts; phone OTP verification (see §11.5) before a voter can
      cast a ballot.
- [ ] **Support pledges** — per-IP rate limit + honeypot field to cut pledge spam.
- [ ] **Certificate verification** — public endpoint, rate-limited per-IP to prevent
      enumeration of cert numbers.

### 11.5 Identity assurance (blocker for real election)

- [ ] **Phone OTP verification for voters.** Use Supabase Auth phone (M-Pesa/SMS
      provider) or a custom OTP step: a voter is `unverified` until they confirm an
      OTP; only `verified` voters may call `cast_vote`. This is the real-world
      equivalent of "ID-verified" copy on the register page.
- [ ] **Email confirmation for candidates/admins** (Supabase Auth `confirm email`).
- [ ] **Admin MFA** — require TOTP MFA (`auth.mfa` API) for any user in `admin_users`.
      The admin routes' loader checks `auth.mfa` enrollment and blocks otherwise.

### 11.6 Observability (blocker)

- [ ] **Structured logging** in every server function and RPC: `actor`, `action`,
      `target`, `latency_ms`, `outcome`, `request_id`. Ship to the Supabase logs
      pipeline and surface via the `get_logs` MCP tool when debugging.
- [ ] **Metrics** — emit counters for: votes cast/min (per position), registrations/min,
      RPC error rate, p95 RPC latency, realtime connection count. Use a `metrics`
      table or an external sink; the admin dashboard renders them.
- [ ] **Alerts** (via Supabase advisors + external): RPC error rate > 1%, recount
      mismatch, vote rate spike (> N std dev), failed auth burst, RLS denial spike.
- [ ] **Run `get_advisors`** post-migration and resolve every Index/RLS/Auth advisor
      before launch.

### 11.7 Performance & scale (blocker)

- [ ] **Tally reads are O(1)-ish.** `tally_by_position_live` is a materialized view
      refreshed by a trigger on `votes` (incremental update of one row per
      position), not a full `COUNT(*)` scan on every poll. Index `votes(position_id,
    candidate_id)` to support the refresh.
- [ ] **Realtime fan-out budget.** Cap concurrent subscriptions; for the elections hub
      subscribe to one channel per visible position, not all positions. Consider
      Broadcast for tally deltas instead of `postgres_changes` if connection count
      gets large.
- [ ] **Connection pooling** — confirm Supabase pooler (PgBouncer) is used by the
      server functions; set pool size for peak election-day load.
- [ ] **Load test** before launch: simulate peak concurrent voters (target N voters
      casting votes within the 08:00–18:00 window for the largest region) and verify
      p95 `cast_vote` latency < 500 ms with zero lost votes. Use k6 or a script
      driving the `cast_vote` RPC directly.
- [ ] **Idempotency** for `cast_vote`: the RPC is idempotent for retries within the
      same poll window — calling it twice with the same `(voter, position, candidate)`
      returns the same `receipt_code` without creating a duplicate.

### 11.8 Disaster recovery (blocker)

- [ ] **PITR / daily backups** confirmed enabled on the Supabase project; document the
      RPO/RTO and the restore drill steps.
- [ ] **Pre-election snapshot** — take a manual Supabase snapshot immediately before
      polls open and another after they close; name them with the cycle id.
- [ ] **Rollback plan** — every migration is reversible (each `ALTER` has a paired
      down-migration in the same PR for review); the deploy pipeline can revert.
- [ ] **Realtime fallback** — if Realtime drops, the UI falls back to a 30s poll on
      the tally RPC (never silent failure); show a "live connection: degraded" badge.

### 11.9 Pre-launch checklist (sign-off)

- [ ] RLS verified on all tables; no `rowsecurity = false` in public schema.
- [ ] `recount_position` matches declared tallies on a seeded dataset.
- [ ] No raw National IDs anywhere in the DB or logs.
- [ ] Service-role key never present in the client bundle (CI grep passes).
- [ ] Load test passes the peak-concurrency target with zero lost votes.
- [ ] Phone OTP gate active; no `unverified` voter can cast a vote.
- [ ] Admin MFA enforced; auto-approve trigger dropped.
- [ ] Audit log capturing all audited actions; `UPDATE/DELETE` revoked.
- [ ] Backups + pre-election snapshot confirmed; restore drill run.
- [ ] Security review (e.g. the `security-review` subagent) run on the diff and
      findings resolved.

---

## 12. Environment & tooling

- [ ] Confirm `.env` (local) and Lovable Cloud env contain:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY` (browser)
  - `SUPABASE_SERVICE_ROLE_KEY` (server only — never exposed to client bundle)
- [ ] Install Supabase CLI locally for `supabase migration up`, `gen types`, and
      `supabase db reset` against a branch (Supabase branching) before touching prod.
- [ ] Use the Supabase MCP tools available in this workspace for:
  - `list_tables` / `list_migrations` before schema work.
  - `apply_migration` for reviewable, versioned migrations.
  - `execute_sql` for one-off backfills.
  - `generate_typescript_types` after each migration to refresh `types.ts`.
  - `get_advisors` + `get_logs` when debugging RLS/perf issues.

---

## 13. Testing plan

- [ ] **Schema tests** — for each RPC, write a small `execute_sql` test that calls it
      with sample args and asserts the shape.
- [ ] **RLS tests** — as two distinct Supabase users (and `anon`), assert:
  - a user cannot read another user's `voters`/`votes`/`profiles` rows.
  - a user cannot insert a `votes` row for another `voter_id`.
  - an unauthenticated user cannot read `votes` at all but can read approved
    `candidates` and `positions`.
- [ ] **`cast_vote` RPC tests** — cover: happy path, double-vote (upsert), ineligible
      voter (wrong county), closed poll, unknown candidate, candidate not in position.
- [ ] **Frontend e2e** (manual or Playwright later): register → vote → see tally bump
      → see receipt → open certificate → open verify route → green.
- [ ] **Realtime smoke** — open two browsers, cast a vote in one, assert the other's
      tally updates without a manual refresh.

---

## 14. Rollout / phasing

- [x] **Slice 0 — Reference data (M1–M4).** Behind `VITE_USE_SUPABASE_REFERENCE_DATA`.
- [x] **Slice 1 — Auth ↔ voter (M5–M6).** Behind `VITE_USE_SUPABASE_VOTERS`.
- [x] **Slice 2 — Real voting (M7–M10).** Behind `VITE_USE_SUPABASE_VOTING`.
- [x] **Slice 3 — Real analytics & candidate dashboard (M9).** Behind `VITE_USE_SUPABASE_ANALYTICS`.
- [x] **Slice 4 — Support persistence (M11).** Behind `VITE_USE_SUPABASE_SUPPORT`.
- [x] **Slice 5 — Admin console (M12, M15, §8).** Routes exist; superadmin bootstrap pending.
- [ ] **Slice 6 — Storage & photos (M13).** Buckets done; apply-flow upload not wired.
- [x] **Slice 7 — Verify routes (M10 + new routes).** `/verify` + `/receipt` live.
- [ ] **Slice 8 — Cleanup.** Types done; mock fallbacks (`mym-data`, `voter-store`) retained for flag-off mode.

---

## 15. Known risks & decisions to confirm

> **Already decided (production defaults):**
>
> - **Kenya locations** → use the `kenya-locations` npm library on the frontend and a
>   `ke_locations` Postgres reference table for server-side validation (§5.7). The
>   59 KB hardcoded `kenya-locations.ts` is deleted.
> - **National ID storage** → hashed at rest (SHA-256 + server pepper in Vault) +
>   `last4` for display; raw value never stored (§11.3).
> - **Auto-approve** → removed for production; candidates default to `pending` and go
>   through admin review (§11.1, M15).
> - **Vote casting** → single `SECURITY DEFINER` `cast_vote` RPC; client never writes
>   `votes` directly (§11.1).

- [ ] **National tier in DB** — confirm we want `national` aspirants to apply via the
      same form (today the form hides the national tier). Decision needed: open the
      form to `national`, or keep national positions appointed/curated?
- [ ] **Phone OTP provider** — Supabase Auth phone vs. a custom M-Pesa/SMS OTP
      integration. Affects §11.5 and the voter verification flow. Confirm the SMS
      provider and cost budget.
- [ ] **Verify domain** — `mym.vote` is referenced in the certificate UI but not
      owned. Either register the domain and point it at this app, or switch the
      certificate QR/URL to the app's real deployment URL + `/verify/<cert>`.
- [ ] **M-Taji integration depth** — candidate profiles/donations currently link out
      to `m-taji-tracker.vercel.app`. Do we keep M-Taji as the source of truth for
      profile content (engagement stats, manifesto), or mirror into Supabase? Today
      the candidate dashboard fakes M-Taji engagement numbers; decide whether to fetch
      them from M-Taji's API or drop those widgets.
- [ ] **Vote changing** — the UI lets a voter "change" their vote. Confirm this is
      intended for the real election (civic risk) vs. a demo affordance. If kept,
      every change is recorded in `audit_log` and `vote_receipts` reflects the latest
      choice; decide whether to expose a "change window" that closes before polls end.
- [ ] **Election cycle phase authority** — who can flip `open`/`closed`? Returning
      officers per region, or a single superadmin? Affects `admin_users` granularity
      and the `setCyclePhase` server function.
- [ ] **Peak load target** — the number of concurrent voters the load test (§11.7)
      must pass. Confirm expected turnout per region to size the pooler and tallies.

---

## 16. Quick-reference: current vs. target data source

| Function                                | Today                                | Target                                                                          |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Home stats (positions/candidates count) | mock array lengths                   | `count_*` RPCs                                                                  |
| Featured contestants                    | mock `CANDIDATES`                    | `featured_candidates` view/flag                                                 |
| Tier meta                               | mock `TIER_META`                     | static (UI copy) — keep in code                                                 |
| Positions list                          | mock `POSITIONS`                     | `positions` table                                                               |
| Voter registration                      | `localStorage`                       | `voters` table (auth-owned)                                                     |
| Current voter                           | `localStorage`                       | `voters` for `auth.uid()`                                                       |
| Cast vote                               | `localStorage`                       | `cast_vote` RPC → `votes` table                                                 |
| Tally                                   | in-browser from `localStorage`       | `tally_by_position` RPC + Realtime                                              |
| My vote                                 | `localStorage`                       | `votes` row for `auth.uid()`'s voter                                            |
| Eligibility                             | JS comparison vs. mock position      | `cast_vote` RPC + `positions` scope                                             |
| Poll window                             | hardcoded `REGION_SCHEDULE`          | `poll_windows` table                                                            |
| Candidate list                          | `candidates` table (Supabase)        | same + `position_id` join                                                       |
| Candidate apply                         | `candidates` insert (auto-approve)   | server fn, auth-owned, `position_id`, manual review                             |
| Candidate dashboard KPIs                | seeded fakes                         | `tally_by_position` + `votes_over_time`                                         |
| Certificate                             | `getCandidate` (Supabase)            | same + `/verify/$cert` route                                                    |
| Certificate verify URL                  | dead `mym.vote` link                 | real `/verify/$cert` route + RPC                                                |
| Support/donate                          | no-op `setSubmitted(true)`           | `support_pledges` insert                                                        |
| Analytics (gender/age/turnout)          | `hashUnit` fakes                     | analytics RPCs                                                                  |
| Auth                                    | Supabase Auth (wired)                | same + linked to `voters`/`candidates` + phone OTP + admin MFA                  |
| Photos                                  | 6 local assets by id hash            | Storage bucket `candidate-photos`                                               |
| Kenya locations                         | 59 KB hardcoded `kenya-locations.ts` | `kenya-locations` npm lib (frontend) + `ke_locations` table (server validation) |

---

## 17. Task checklist (consolidated)

> **Audit 2026-07-10.** See `docs/pre-audit-progress.md` for remote DB counts and blockers.

### Schema & migrations

- [x] M1 — `election_cycles`, `poll_windows`, enums + seed
- [ ] M1b — `ke_locations` seed complete (**600/1,448** rows remote)
- [x] M2 — `positions` table + seed
- [x] M3 — add `national` to `candidate_tier`
- [x] M4 — extend `candidates` + backfill via seed
- [x] M5 — `profiles` + `auth.users` trigger
- [x] M6 — `voters` (hashed `national_id` + `last4`) + RLS
- [x] M7 — `votes` + `vote_receipts` + RLS + `ballot_hash`
- [x] M8 — `cast_vote`, `tally_by_position` RPCs + live view
- [ ] M8b — `audit_log` (append-only)
- [ ] M8c — `recount_position` RPC + cycle-seal trigger
- [x] M9 — analytics + count RPCs
- [x] M10 — `verify_certificate`, `verify_receipt` RPCs
- [x] M11 — `support_pledges` + enums + RLS
- [x] M12 — `admin_users` + `admin_role` (**bootstrap superadmin pending**)
- [x] M13 — Storage buckets + policies
- [x] M14 — Realtime publication on `votes`
- [x] M15 — drop `candidates_auto_approve`
- [x] M16 — tighten `candidates` RLS + admin RPCs
- [ ] Vault secrets — ID pepper in Vault (using env `NATIONAL_ID_PEPPER` today)
- [x] Write `supabase/seed.sql`
- [x] Write `scripts/gen-ke-locations-seed.ts`
- [x] Regenerate `src/integrations/supabase/types.ts`

### Data-access layer

- [x] `src/lib/api/positions.ts`
- [x] `src/lib/api/voters.ts`
- [x] `src/lib/api/votes.ts`
- [x] `src/lib/api/schedule.ts`
- [x] `src/lib/api/analytics.ts`
- [x] `src/lib/api/support.ts`
- [x] Extend `src/lib/candidates.ts`
- [x] `src/lib/api/verify.ts`
- [x] `src/lib/locations.ts`
- [x] `src/lib/api/admin.ts`

### Server functions

- [x] `cast-vote.fn.ts` — `castVote`
- [x] `register-voter.fn.ts` — `registerVoter` (Zod strings; hashed ID)
- [x] `submit-candidate.fn.ts` — auth-owned, `pending`
- [x] `submit-pledge.fn.ts` — `submitPledge`
- [x] `admin.ts` — approve/reject/phase/schedule (**no MFA gate**)

### Route rewrites

- [x] `register.tsx` → Supabase Auth + `voters` (**phone OTP not done**)
- [x] `dashboard.tsx` → auth-user voter profile
- [x] `elections.tsx` → real data + Realtime (flag-gated)
- [x] `elections.$positionId.tsx` → real loader + `castVote`
- [ ] `candidates.tsx` → VerifyDialog still local (not RPC)
- [x] `candidates.apply.tsx` → auth, `position_id`, national tier
- [x] `candidates.$candidateId.dashboard.tsx` → real tally + Realtime
- [x] `candidates.$candidateId.certificate.tsx` → `/verify/` URL
- [x] `auth.tsx` → redirect target handling
- [x] `index.tsx` + `about.tsx` → real counts (flag-gated)
- [x] `components/support-button.tsx` → `submitPledge`
- [x] `@/lib/locations` imports (kenya-locations.ts deleted)
- [x] `routes/verify.$certificateNumber.tsx`
- [x] `routes/receipt.$receiptCode.tsx`
- [x] `routes/admin/*` (positions read-only)

### Cleanup

- [ ] Delete `src/lib/mym-data.ts` (deferred — mock fallback)
- [ ] Delete `src/lib/voter-store.ts` (deferred — mock fallback)
- [x] Delete `src/lib/kenya-locations.ts`
- [ ] Remove `mym:votes-changed` / `mym:voter-changed` events
- [ ] Remove all fake live-poll `setInterval`s (partial — 30s fallback remains)
- [ ] `election-schedule.ts` → default to `api/schedule.ts`

### Production hardening (§11) — not started

- [x] `cast_vote` is sole write path (M8)
- [ ] `ballot_hash` + `recount_position` verification
- [ ] Cycle-seal when `phase='tallied'`
- [ ] `audit_log` append-only
- [x] National ID hashed (env pepper; Vault TBD)
- [ ] Phone OTP gate before `cast_vote`
- [ ] Admin MFA in admin loaders
- [ ] Rate limits on cast/register/apply/pledge/verify
- [ ] Structured logging + metrics + alerts
- [ ] `get_advisors` resolved pre-launch
- [ ] Load test + PITR drill
- [ ] CI grep: service-role key never in client bundle

### Security & testing — not started

- [ ] RLS multi-user tests
- [ ] `cast_vote` RPC branch tests
- [ ] Realtime two-browser smoke test
- [ ] Security-review subagent on diff

### Pre-launch sign-off (§11.9) — not started

### Decisions to lock (unchanged)

- [x] National tier in apply form — **opened**
- [ ] Phone OTP provider
- [ ] Verify domain (`mym.vote` vs deployment URL)
- [ ] M-Taji integration depth
- [ ] Vote-changing policy
- [ ] Phase-change authority
- [ ] Peak load target

---

_End of document. Update the checklists as work progresses; keep §16 in sync with the
current state of the codebase._
