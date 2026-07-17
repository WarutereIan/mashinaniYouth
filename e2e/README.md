# E2E smoke tests

End-to-end Playwright smoke coverage for MashinaniVote user flows.

## What is covered

| Spec | Flows |
|------|--------|
| `01-public` | Home, elections, candidates, about, auth gates |
| `02-auth` | Voter signup, vie signup, admin login, bad credentials |
| `03-candidate-apply` | Sign up as candidate → submit application |
| `04-voting` | Register voter → elections UI → optional cast vote |
| `05-admin` | Admin dashboard, candidates (search/detail), positions, schedule, support, audit, users |
| `06-election-cycle` | Open nominations → apply → admin review → position/schedule forms |

## Prerequisites

1. Dev server running with Supabase backend enabled:
   ```bash
   npm run dev
   ```
   Default URL: `http://localhost:8080` (override with `E2E_BASE_URL`).

2. Copy env file and set admin credentials:
   ```bash
   cp e2e/.env.example e2e/.env.local
   ```
   Fill `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (see `docs/admin-credentials.local.md`).

3. Chromium for Playwright (already installed if you ran setup):
   ```bash
   npx playwright install chromium
   ```

## Run

```bash
npm run test:e2e
npm run test:e2e -- e2e/smoke/01-public.spec.ts
npm run test:e2e:ui
npm run test:e2e:report
```

## Notes

- Tests create throwaway `@example.com` users with unique IDs/phones each run.
- Admin/cycle tests **skip** if admin env vars are missing.
- Candidate apply / cycle tests **skip** if no position has nominations open (open one in `/admin/positions` first).
- Voting may land on Locked/Closed buttons depending on poll windows — that is treated as a valid UI outcome.
- Do not commit `e2e/.env.local`.
