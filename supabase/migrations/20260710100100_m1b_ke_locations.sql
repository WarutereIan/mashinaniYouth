-- M1b: Kenya administrative reference (county / constituency / ward)

CREATE TABLE public.ke_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  county text NOT NULL,
  constituency text NOT NULL,
  ward text NOT NULL,
  county_code text,
  constituency_code text,
  ward_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (county, constituency, ward)
);

CREATE INDEX ke_locations_county_idx ON public.ke_locations(county);
CREATE INDEX ke_locations_constituency_idx ON public.ke_locations(constituency);
CREATE INDEX ke_locations_ward_idx ON public.ke_locations(ward);

GRANT SELECT ON public.ke_locations TO anon, authenticated;
GRANT ALL ON public.ke_locations TO service_role;

ALTER TABLE public.ke_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kenya locations are publicly readable"
  ON public.ke_locations FOR SELECT
  USING (true);

-- Seed data is in 20260710100101_m1b_ke_locations_seed.sql (generated from kenya-locations)
