-- M6: voters table + RLS (Slice 1 / Phase B)

CREATE TABLE public.voters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  national_id_hash text NOT NULL UNIQUE,
  national_id_last4 text NOT NULL,
  full_name text NOT NULL,
  county text NOT NULL,
  constituency text NOT NULL,
  ward text NOT NULL,
  phone text NOT NULL,
  phone_verified boolean NOT NULL DEFAULT false,
  date_of_birth date,
  gender text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voters_national_id_last4_check CHECK (length(national_id_last4) = 4)
);

CREATE INDEX voters_county_idx ON public.voters(county);
CREATE INDEX voters_constituency_idx ON public.voters(constituency);
CREATE INDEX voters_ward_idx ON public.voters(ward);

GRANT SELECT, INSERT, UPDATE ON public.voters TO authenticated;
GRANT ALL ON public.voters TO service_role;

ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters can read own row"
  ON public.voters FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Voters can insert own row"
  ON public.voters FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Voters can update own row"
  ON public.voters FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_voters_touch_updated_at
BEFORE UPDATE ON public.voters
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
