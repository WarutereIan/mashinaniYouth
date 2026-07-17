-- M31: Add poll_window_id to positions so each position can be assigned to a specific voting window.

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS poll_window_id bigint REFERENCES public.poll_windows(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.positions.poll_window_id IS 'Optional FK linking this position to a specific poll window (voting schedule).';

-- Update admin_create_position to accept the new column
CREATE OR REPLACE FUNCTION public.admin_create_position(
  p_title text,
  p_tier position_tier,
  p_scope text,
  p_county text DEFAULT NULL,
  p_constituency text DEFAULT NULL,
  p_ward text DEFAULT NULL,
  p_description text DEFAULT '',
  p_cycle_slug text DEFAULT 'mykdm-2026',
  p_poll_window_id bigint DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id bigint;
  v_id text;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT id INTO v_cycle_id FROM public.election_cycles WHERE slug = p_cycle_slug;
  IF v_cycle_id IS NULL THEN
    RAISE EXCEPTION 'election cycle not found: %', p_cycle_slug;
  END IF;

  v_id := lower(replace(p_title, ' ', '-'));
  v_id := regexp_replace(v_id, '[^a-z0-9\-]', '', 'g');

  INSERT INTO public.positions(id, tier, title, scope, description, county, constituency, ward, election_cycle_id, applications_open, poll_window_id)
  VALUES (v_id, p_tier, p_title, p_scope, COALESCE(NULLIF(p_description,''), p_title), p_county, p_constituency, p_ward, v_cycle_id, false, p_poll_window_id);

  RETURN v_id;
END;
$$;

-- Update admin_update_position to accept the new column
CREATE OR REPLACE FUNCTION public.admin_update_position(
  p_id text,
  p_title text,
  p_tier position_tier,
  p_scope text,
  p_county text DEFAULT NULL,
  p_constituency text DEFAULT NULL,
  p_ward text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_poll_window_id bigint DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  UPDATE public.positions
  SET title = p_title,
      tier = p_tier,
      scope = p_scope,
      county = p_county,
      constituency = p_constituency,
      ward = p_ward,
      description = COALESCE(NULLIF(p_description,''), title),
      poll_window_id = p_poll_window_id,
      updated_at = now()
  WHERE id = p_id;
END;
$$;
