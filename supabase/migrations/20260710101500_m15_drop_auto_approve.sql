-- M15: Remove auto-approve prototype trigger (Slice 5/8)

DROP TRIGGER IF EXISTS trg_candidates_auto_approve ON public.candidates;
DROP FUNCTION IF EXISTS public.candidates_auto_approve();

-- Update certificate trigger to handle national tier
CREATE OR REPLACE FUNCTION public.candidates_issue_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  tier_code text;
  rand_code text;
BEGIN
  IF NEW.status = 'approved' AND NEW.certificate_number IS NULL THEN
    tier_code := CASE NEW.tier
      WHEN 'national' THEN 'NT'
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

-- Default new applications to pending (explicit)
ALTER TABLE public.candidates ALTER COLUMN status SET DEFAULT 'pending';
