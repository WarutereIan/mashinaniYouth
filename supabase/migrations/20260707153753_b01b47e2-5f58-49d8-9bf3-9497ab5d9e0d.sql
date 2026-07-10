
-- Enum for tier and status
CREATE TYPE public.candidate_tier AS ENUM ('county', 'constituency', 'ward');
CREATE TYPE public.candidate_status AS ENUM ('pending', 'approved', 'rejected');

-- Candidates table
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  national_id text NOT NULL UNIQUE,
  iebc_voter_number text NOT NULL,
  phone text NOT NULL,
  email text,
  date_of_birth date,
  gender text,
  tier public.candidate_tier NOT NULL,
  position_title text NOT NULL,
  county text NOT NULL,
  constituency text,
  ward text,
  party text,
  slogan text,
  bio text,
  status public.candidate_status NOT NULL DEFAULT 'pending',
  certificate_number text UNIQUE,
  certified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants (must come before RLS policies)
GRANT SELECT, INSERT ON public.candidates TO anon;
GRANT SELECT, INSERT, UPDATE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;

-- RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can view APPROVED candidates
CREATE POLICY "Approved candidates are publicly readable"
  ON public.candidates FOR SELECT
  USING (status = 'approved');

-- Anyone can submit an application (public candidate sign-up)
CREATE POLICY "Anyone can submit a candidate application"
  ON public.candidates FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.candidates_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_candidates_touch_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.candidates_touch_updated_at();

-- Certificate issuance trigger — generates cert number when status becomes 'approved'
CREATE OR REPLACE FUNCTION public.candidates_issue_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  tier_code text;
  rand_code text;
BEGIN
  IF NEW.status = 'approved' AND NEW.certificate_number IS NULL THEN
    tier_code := CASE NEW.tier
      WHEN 'county' THEN 'CO'
      WHEN 'constituency' THEN 'CN'
      WHEN 'ward' THEN 'WD'
    END;
    rand_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    NEW.certificate_number := 'MYM-2026-' || tier_code || '-' || rand_code;
    NEW.certified_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-approve on insert for prototype (issues certificate immediately)
CREATE OR REPLACE FUNCTION public.candidates_auto_approve()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = 'pending' THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_candidates_auto_approve
BEFORE INSERT ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.candidates_auto_approve();

CREATE TRIGGER trg_candidates_issue_certificate
BEFORE INSERT OR UPDATE OF status ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.candidates_issue_certificate();

-- Indexes
CREATE INDEX candidates_tier_idx ON public.candidates(tier);
CREATE INDEX candidates_county_idx ON public.candidates(county);
CREATE INDEX candidates_status_idx ON public.candidates(status);
