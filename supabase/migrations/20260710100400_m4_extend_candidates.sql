-- M4: link candidates to positions and election cycle

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_id text REFERENCES public.positions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS election_cycle_id bigint REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS candidates_position_id_idx ON public.candidates(position_id);
CREATE INDEX IF NOT EXISTS candidates_election_cycle_id_idx ON public.candidates(election_cycle_id);
CREATE INDEX IF NOT EXISTS candidates_user_id_idx ON public.candidates(user_id);

-- Backfill position_id + election_cycle_id for existing rows where we can match scope
UPDATE public.candidates cand
SET
  position_id = p.id,
  election_cycle_id = ec.id
FROM public.positions p
JOIN public.election_cycles ec ON ec.slug = 'mykdm-2026'
WHERE cand.position_id IS NULL
  AND cand.status = 'approved'
  AND (
    (cand.tier = 'county' AND p.tier = 'county' AND p.county = cand.county
      AND cand.position_title ILIKE '%' || cand.county || '%')
    OR (cand.tier = 'constituency' AND p.tier = 'constituency'
      AND p.county = cand.county AND p.constituency = cand.constituency
      AND cand.position_title ILIKE '%' || cand.constituency || '%')
    OR (cand.tier = 'ward' AND p.tier = 'ward'
      AND p.county = cand.county AND p.constituency = cand.constituency
      AND p.ward = cand.ward)
  );

-- National-tier backfill by position title keyword (no county on candidate row)
UPDATE public.candidates cand
SET
  position_id = p.id,
  election_cycle_id = ec.id
FROM public.positions p
JOIN public.election_cycles ec ON ec.slug = 'mykdm-2026'
WHERE cand.position_id IS NULL
  AND cand.status = 'approved'
  AND p.tier = 'national'
  AND (
    (cand.position_title ILIKE '%chair%' AND p.id = 'national-chair')
    OR (cand.position_title ILIKE '%executive%' AND p.id = 'national-ceo')
    OR (cand.position_title ILIKE '%enterprise%' AND p.id = 'minister-enterprise')
    OR (cand.position_title ILIKE '%health%' AND p.id = 'minister-health')
  );
