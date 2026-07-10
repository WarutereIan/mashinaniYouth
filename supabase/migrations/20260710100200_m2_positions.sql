-- M2: positions table + seed from mym-data POSITIONS (2026 cycle)

CREATE TABLE public.positions (
  id text PRIMARY KEY,
  tier public.position_tier NOT NULL,
  title text NOT NULL,
  scope text NOT NULL,
  description text NOT NULL,
  county text,
  constituency text,
  ward text,
  election_cycle_id bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positions_scope_check CHECK (
    (tier = 'national')
    OR (tier = 'county' AND county IS NOT NULL)
    OR (tier = 'constituency' AND county IS NOT NULL AND constituency IS NOT NULL)
    OR (tier = 'ward' AND county IS NOT NULL AND constituency IS NOT NULL AND ward IS NOT NULL)
  )
);

CREATE INDEX positions_tier_idx ON public.positions(tier);
CREATE INDEX positions_county_idx ON public.positions(county);
CREATE INDEX positions_constituency_idx ON public.positions(constituency);
CREATE INDEX positions_cycle_idx ON public.positions(election_cycle_id);

GRANT SELECT ON public.positions TO anon, authenticated;
GRANT ALL ON public.positions TO service_role;

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Positions are publicly readable"
  ON public.positions FOR SELECT
  USING (true);

CREATE TRIGGER trg_positions_touch_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.positions (
  id, tier, title, scope, description, county, constituency, ward, election_cycle_id
)
SELECT
  p.id,
  p.tier::public.position_tier,
  p.title,
  p.scope,
  p.description,
  p.county,
  p.constituency,
  p.ward,
  c.id
FROM public.election_cycles c
CROSS JOIN (
  VALUES
    ('national-chair', 'national', 'National Chair', 'National Secretariat',
     'Sets the strategic vision, chairs national leadership meetings, and safeguards the movement''s founding principles.',
     NULL::text, NULL::text, NULL::text),
    ('national-ceo', 'national', 'Chief Executive Officer', 'National Secretariat',
     'Runs day-to-day operations, drives weekly activities, and manages the elected national and county leadership.',
     NULL, NULL, NULL),
    ('minister-enterprise', 'national', 'Youth Minister — Enterprise', 'Cabinet of Youth Ministers',
     'Leads the enterprise, jobs and opportunities docket in partnership with M-Taji''s marketplace.',
     NULL, NULL, NULL),
    ('minister-health', 'national', 'Youth Minister — Health', 'Cabinet of Youth Ministers',
     'Represents youth priorities on mental health, SRHR, NCDs and universal health coverage.',
     NULL, NULL, NULL),
    ('governor-nairobi', 'county', 'County Youth Governor — Nairobi', 'County Leadership',
     'Coordinates Nairobi''s ward representatives and speaks for the county''s youth on the national stage.',
     'Nairobi', NULL, NULL),
    ('governor-kisumu', 'county', 'County Youth Governor — Kisumu', 'County Leadership',
     'Coordinates Kisumu''s ward representatives and speaks for the county''s youth on the national stage.',
     'Kisumu', NULL, NULL),
    ('ward-kibra', 'ward', 'Ward Representative — Kibra Central', 'Ward Leadership',
     'Closest point of contact with young people on the ground in Kibra Central ward.',
     'Nairobi', 'Kibra', 'Laini saba'),
    ('constituency-kibra', 'constituency', 'Constituency Youth Rep — Kibra', 'Constituency Leadership',
     'Represents Kibra constituency''s wards on the county council and links ward reps to national leadership.',
     'Nairobi', 'Kibra', NULL),
    ('constituency-kisumu-central', 'constituency', 'Constituency Youth Rep — Kisumu Central', 'Constituency Leadership',
     'Represents Kisumu Central constituency and coordinates its ward representatives.',
     'Kisumu', 'Kisumu Central', NULL),
    ('ward-kondele', 'ward', 'Ward Representative — Kondele', 'Ward Leadership',
     'Closest point of contact with young people on the ground in Kondele ward.',
     'Kisumu', 'Kisumu Central', 'Kondele')
) AS p(id, tier, title, scope, description, county, constituency, ward)
WHERE c.slug = 'mykdm-2026';
