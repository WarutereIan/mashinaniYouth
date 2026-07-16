-- M28: Unique users — enforce uniqueness of name, phone, and national ID.
--
-- national_id is already unique per table (voters.national_id_hash UNIQUE,
-- candidates.national_id UNIQUE). This migration adds phone + name uniqueness
-- and an anon-callable pre-signup check RPC so the signup form can surface
-- per-field collisions BEFORE creating an auth account (avoiding orphans).

-- Phone uniqueness (one person, one phone) per table.
CREATE UNIQUE INDEX IF NOT EXISTS voters_phone_key ON public.voters(phone);
CREATE UNIQUE INDEX IF NOT EXISTS candidates_phone_key ON public.candidates(phone);

-- Case-insensitive name uniqueness per table.
CREATE UNIQUE INDEX IF NOT EXISTS voters_full_name_ci_key ON public.voters (lower(trim(full_name)));
CREATE UNIQUE INDEX IF NOT EXISTS candidates_full_name_ci_key ON public.candidates (lower(trim(full_name)));

-- Normalize a Kenyan phone number to the canonical +254XXXXXXXXX form so that
-- "0712345678", "254712345678" and "+254712345678" all match the same row.
CREATE OR REPLACE FUNCTION public.normalize_phone_ke(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text := btrim(p_phone);
BEGIN
  IF v IS NULL OR v = '' THEN RETURN v; END IF;
  v := replace(v, ' ', '');
  IF v LIKE '+254%' THEN RETURN v; END IF;
  IF v LIKE '254%' THEN RETURN '+' || v; END IF;
  IF v LIKE '0%' THEN RETURN '+254' || substring(v from 2); END IF;
  RETURN '+254' || v;
END;
$$;

-- Pre-signup uniqueness probe. Callable by anon (signup happens before login).
-- Checks name + phone across both voters and candidates, and national_id against
-- candidates (stored in plain text). national_id against voters is hashed with a
-- Node-side pepper not available to SQL, so that collision is enforced by the
-- voters.national_id_hash UNIQUE constraint at insert time instead.
CREATE OR REPLACE FUNCTION public.check_signup_uniqueness(
  p_name text,
  p_national_id text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := lower(btrim(p_name));
  v_phone text := public.normalize_phone_ke(p_phone);
  v_name_taken boolean := false;
  v_phone_taken boolean := false;
  v_id_taken boolean := false;
BEGIN
  IF v_name IS NOT NULL AND v_name <> '' THEN
    SELECT EXISTS(SELECT 1 FROM public.voters WHERE lower(trim(full_name)) = v_name)
      OR EXISTS(SELECT 1 FROM public.candidates WHERE lower(trim(full_name)) = v_name)
      INTO v_name_taken;
  END IF;

  IF v_phone IS NOT NULL AND v_phone <> '' THEN
    SELECT EXISTS(SELECT 1 FROM public.voters WHERE phone = v_phone)
      OR EXISTS(SELECT 1 FROM public.candidates WHERE phone = v_phone)
      INTO v_phone_taken;
  END IF;

  IF p_national_id IS NOT NULL AND btrim(p_national_id) <> '' THEN
    SELECT EXISTS(SELECT 1 FROM public.candidates WHERE national_id = btrim(p_national_id))
      INTO v_id_taken;
  END IF;

  RETURN jsonb_build_object(
    'name_taken', v_name_taken,
    'phone_taken', v_phone_taken,
    'id_taken', v_id_taken
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_signup_uniqueness(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_signup_uniqueness(text, text, text) TO anon, authenticated;
