-- M1: election_cycles + poll_windows (Phase A / Slice 0)

CREATE TYPE public.position_tier AS ENUM ('national', 'county', 'constituency', 'ward');
CREATE TYPE public.election_phase AS ENUM (
  'draft',
  'scheduled',
  'open',
  'closed',
  'tallied',
  'cancelled'
);

CREATE TABLE public.election_cycles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  phase public.election_phase NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.poll_windows (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cycle_id bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE CASCADE,
  region text NOT NULL,
  poll_date date NOT NULL,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  counties text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, region)
);

CREATE INDEX poll_windows_cycle_idx ON public.poll_windows(cycle_id);
CREATE INDEX poll_windows_counties_idx ON public.poll_windows USING GIN (counties);

GRANT SELECT ON public.election_cycles TO anon, authenticated;
GRANT SELECT ON public.poll_windows TO anon, authenticated;
GRANT ALL ON public.election_cycles TO service_role;
GRANT ALL ON public.poll_windows TO service_role;

ALTER TABLE public.election_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Election cycles are publicly readable"
  ON public.election_cycles FOR SELECT
  USING (true);

CREATE POLICY "Poll windows are publicly readable"
  ON public.poll_windows FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_election_cycles_touch_updated_at
BEFORE UPDATE ON public.election_cycles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_poll_windows_touch_updated_at
BEFORE UPDATE ON public.poll_windows
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2026 MY-KDM General Elections (matches lib/election-schedule.ts REGION_SCHEDULE)
INSERT INTO public.election_cycles (name, slug, window_start, window_end, phase)
VALUES (
  '2026 MY-KDM General Elections',
  'mykdm-2026',
  '2026-07-21T08:00:00+03:00',
  '2026-07-28T18:00:00+03:00',
  'scheduled'
);

INSERT INTO public.poll_windows (cycle_id, region, poll_date, opens_at, closes_at, counties)
SELECT
  c.id,
  v.region,
  v.poll_date::date,
  v.opens_at::timestamptz,
  v.closes_at::timestamptz,
  v.counties
FROM public.election_cycles c
CROSS JOIN (
  VALUES
    ('Nairobi', '2026-07-21', '2026-07-21T08:00:00+03:00', '2026-07-21T18:00:00+03:00', ARRAY['Nairobi']::text[]),
    ('Central', '2026-07-22', '2026-07-22T08:00:00+03:00', '2026-07-22T18:00:00+03:00', ARRAY['Kiambu', 'Kirinyaga', 'Murang''a', 'Nyandarua', 'Nyeri']::text[]),
    ('Coast', '2026-07-23', '2026-07-23T08:00:00+03:00', '2026-07-23T18:00:00+03:00', ARRAY['Kilifi', 'Kwale', 'Lamu', 'Mombasa', 'Taita-Taveta', 'Tana River']::text[]),
    ('Eastern', '2026-07-24', '2026-07-24T08:00:00+03:00', '2026-07-24T18:00:00+03:00', ARRAY['Embu', 'Isiolo', 'Kitui', 'Machakos', 'Makueni', 'Marsabit', 'Meru', 'Tharaka-Nithi']::text[]),
    ('North Eastern', '2026-07-25', '2026-07-25T08:00:00+03:00', '2026-07-25T18:00:00+03:00', ARRAY['Garissa', 'Mandera', 'Wajir']::text[]),
    ('Nyanza', '2026-07-26', '2026-07-26T08:00:00+03:00', '2026-07-26T18:00:00+03:00', ARRAY['Homa Bay', 'Kisii', 'Kisumu', 'Migori', 'Nyamira', 'Siaya']::text[]),
    ('Rift Valley', '2026-07-27', '2026-07-27T08:00:00+03:00', '2026-07-27T18:00:00+03:00', ARRAY['Baringo', 'Bomet', 'Elgeyo-Marakwet', 'Kajiado', 'Kericho', 'Laikipia', 'Nakuru', 'Nandi', 'Narok', 'Samburu', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'West Pokot']::text[]),
    ('Western', '2026-07-28', '2026-07-28T08:00:00+03:00', '2026-07-28T18:00:00+03:00', ARRAY['Bungoma', 'Busia', 'Kakamega', 'Vihiga']::text[])
) AS v(region, poll_date, opens_at, closes_at, counties)
WHERE c.slug = 'mykdm-2026';
