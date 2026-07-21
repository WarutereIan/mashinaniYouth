# refImplementation Merge Plan

**Goal:** Port the marketing/content updates from `refImplementation/src` into the main codebase
exactly as designed there, **without regressing** our newer auth, admin navigation, Supabase
counters, or hero layout ("Approach A").

**Source of truth for the new features:** `refImplementation/src`
**Target:** `src/`

---

## What is being ported

| # | Feature | Ref file | Target file |
|---|---------|----------|-------------|
| 1 | Patron portrait assets (6), project posters (10 + hero), media covers (9), baraza images (10) | `refImplementation/src/assets/{patrons,projects,media,barazas}` | `src/assets/{patrons,projects,media,barazas}` |
| 2 | "Kazi" nav link to `/projects` (desktop + mobile) | `site-chrome.tsx` (nav array only) | `src/components/site-chrome.tsx` |
| 3 | Contestants heading → "Mashinani Youth Leadership:" + typewriter cycling two phrases; updated intro copy | `index.tsx` `ContestantsSection` | `src/routes/index.tsx` |
| 4 | Elected/Upcoming badges on the contestants tier tabs (national/county = Elected, constituency/ward = Upcoming) | `index.tsx` `ContestantsSection` | `src/routes/index.tsx` |
| 5 | New `PatronsSection`: marquee carousel (hover to pause), 6 patrons (Kalonzo, Mudavadi, Mwangi, Karua, Chandaria, Kindiki) with AI portraits + M-Taji profile links | `index.tsx` `PatronsSection`, `PatronCard`, `PATRONS` | `src/routes/index.tsx` |
| 6 | Full Projects page at `/projects`: hero with baraza image; sticky gold-highlight section tabs (Upcoming activities / Mashinani Youth Baraza's / Media); activities tab with sticky search + region + date-range filters and AI posters on every card + "Register to attend"; Barazas tab (10 county barazas, county filter + search, images, register buttons); Media tab (search + Print/Video/Pictorial chips, AI covers) | `projects.tsx` (whole file) | `src/routes/projects.tsx` (new) |

## What is intentionally NOT taken from refImplementation

These are places where our current code is ahead of the ref; ref versions are ignored:

- **Hero section** of the home page (ref has an older image-top layout; we keep the current
  full-bleed hero with the "Join as a member" → M-Taji CTA set we already have).
- **Stats bar**: we keep live Supabase `getPublicCounters()`; ref uses static `POSITIONS.length`.
- **TiersCarousel** (ref) vs our static four-tier grid — out of scope; not requested. Keep ours.
- **site-chrome.tsx**: ref version uses old `voter-store` and lacks admin-aware header. Only the
  `Kazi` nav entry is copied.
- **Auth links**: ref uses bare `<Link to="/auth">`; our route requires
  `search={{ redirect: undefined }}` (validateSearch). All ported links are adapted.

## Implementation order

1. **Assets** — copy `patrons/`, `projects/`, `media/`, `barazas/` folders into `src/assets/`.
2. **Nav** — add `{ to: "/projects", label: "Kazi" }` to the `nav` array in `site-chrome.tsx`
   (renders on both desktop and mobile automatically).
3. **Home page** (`src/routes/index.tsx`):
   - Update `ContestantsSection` heading block to the ref markup ("Mashinani Youth Leadership:" +
     `TypewriterLine` with the two phrases) and the new intro paragraph.
   - Add the Elected/Upcoming badge markup to the tier tab buttons.
   - Add `PATRONS` data, `PatronsSection`, `PatronCard` and the six patron image imports; render
     `<PatronsSection />` directly after `<ContestantsSection />`.
   - `styles.css` already has `secretariat-marquee` keyframes — reused as-is, no CSS change.
4. **Projects route** — create `src/routes/projects.tsx` as an exact copy of the ref file, with
   the three `/auth` links adapted to `search={{ redirect: undefined }}`.
5. **Verify** — `tsc --noEmit`, lint the touched files, confirm the route tree regenerates
   (`/projects` appears), and load `/` + `/projects` in the running dev server.

## Batch 2 (merged after initial port)

| # | Feature | Target file(s) |
|---|---------|----------------|
| 7 | Home hero reverted to ref layout: image on top, heading/description/buttons below on white; new shorter hero description; "Join as a member" button (→ `/auth`); "Brokieness" removed from the typewriter rotation | `src/routes/index.tsx` |
| 8 | "Four tiers, one movement" is now a horizontal auto-advancing carousel with prev/next arrows and dots (`TiersCarousel`) | `src/routes/index.tsx` |
| 9 | Regional polling schedule is now a horizontal carousel with prev/next arrows (`RegionCarousel`) | `src/components/election-schedule.tsx` (copied from ref) |
| 10 | "All candidates" panel removed from the elections hall; replaced by an "All candidates" button under the live tally that opens a dedicated `/elections/candidates/$positionId` page (search + vote + view profile per candidate, adapted to the Supabase data layer: `useVoter`, `usePositionTally`, `useVoteActions`, `checkEligibility` incl. self-vote guard) | `src/routes/elections.index.tsx`, `src/routes/elections.candidates.$positionId.tsx` (new) |
| 11 | `/elections` converted to a layout route (`<Outlet />`) with the hall page moved to `elections.index.tsx` — same pattern as the candidates subtree, required for nested election pages to render | `src/routes/elections.tsx`, `src/routes/elections.index.tsx` |
| 12 | About page: sticky gold "See MY-KDM on M-Taji" banner below the header; Structure section is now a marquee carousel (`StructureCarousel`); Programmes grid is now a marquee carousel (`ProgrammesCarousel`). Supabase-backed About counters kept. | `src/routes/about.tsx` |

## Risks / notes

- `routeTree.gen.ts` is regenerated by the TanStack Router plugin when the dev server or build
  runs — no manual edit.
- The ref projects page links "Register to attend" to `/auth`; per current UX signed-in users are
  redirected away from `/auth` automatically, so no extra gating is needed.
- Patron/baraza/media data are static dummy content by design (as in ref).
