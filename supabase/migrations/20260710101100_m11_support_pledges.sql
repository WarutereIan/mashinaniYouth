-- M11: support_pledges (Slice 4)

CREATE TYPE public.support_kind AS ENUM ('donate', 'partner', 'other');
CREATE TYPE public.pledge_status AS ENUM ('pledged', 'fulfilled', 'cancelled');

CREATE TABLE public.support_pledges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        public.support_kind NOT NULL,
  amount_kes  integer,
  full_name   text NOT NULL,
  phone       text,
  email       text,
  message     text,
  status      public.pledge_status NOT NULL DEFAULT 'pledged',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.support_pledges TO anon, authenticated;
GRANT SELECT, UPDATE ON public.support_pledges TO authenticated;
GRANT ALL ON public.support_pledges TO service_role;

ALTER TABLE public.support_pledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can pledge support"
  ON public.support_pledges FOR INSERT
  WITH CHECK (
    length(trim(full_name)) >= 2
    AND (phone IS NOT NULL OR email IS NOT NULL)
  );

-- Admin SELECT/UPDATE policies added in M12 after admin_users exists

CREATE TRIGGER trg_support_pledges_touch_updated_at
BEFORE UPDATE ON public.support_pledges
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
