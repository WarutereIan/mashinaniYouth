-- M22: Positions CRUD RPCs with tier validation + audit (Phase 5)

CREATE OR REPLACE FUNCTION public.validate_position_locations(
  p_tier public.position_tier,
  p_county text,
  p_constituency text,
  p_ward text
)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_tier = 'national' THEN
    IF p_county IS NOT NULL OR p_constituency IS NOT NULL OR p_ward IS NOT NULL THEN
      RAISE EXCEPTION 'National positions must not set county, constituency, or ward';
    END IF;
  ELSIF p_tier = 'county' THEN
    IF p_county IS NULL OR trim(p_county) = '' THEN
      RAISE EXCEPTION 'County is required for county-tier positions';
    END IF;
    IF p_constituency IS NOT NULL OR p_ward IS NOT NULL THEN
      RAISE EXCEPTION 'County-tier positions must not set constituency or ward';
    END IF;
  ELSIF p_tier = 'constituency' THEN
    IF p_county IS NULL OR trim(p_county) = '' THEN
      RAISE EXCEPTION 'County is required for constituency-tier positions';
    END IF;
    IF p_constituency IS NULL OR trim(p_constituency) = '' THEN
      RAISE EXCEPTION 'Constituency is required for constituency-tier positions';
    END IF;
    IF p_ward IS NOT NULL THEN
      RAISE EXCEPTION 'Constituency-tier positions must not set ward';
    END IF;
  ELSIF p_tier = 'ward' THEN
    IF p_county IS NULL OR trim(p_county) = ''
       OR p_constituency IS NULL OR trim(p_constituency) = ''
       OR p_ward IS NULL OR trim(p_ward) = '' THEN
      RAISE EXCEPTION 'County, constituency, and ward are required for ward-tier positions';
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.slugify_position_id(p_title text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_slug text;
BEGIN
  v_slug := lower(trim(both '-' from regexp_replace(trim(p_title), '[^a-zA-Z0-9]+', '-', 'g')));
  IF v_slug = '' THEN
    v_slug := 'position';
  END IF;
  RETURN v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_position(
  p_title          text,
  p_tier           public.position_tier,
  p_scope          text,
  p_county         text DEFAULT NULL,
  p_constituency   text DEFAULT NULL,
  p_ward           text DEFAULT NULL,
  p_description    text DEFAULT '',
  p_cycle_slug     text DEFAULT 'mykdm-2026'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_cycle public.election_cycles%ROWTYPE;
  v_id text;
  v_row public.positions%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  IF length(trim(p_scope)) < 2 THEN
    RAISE EXCEPTION 'Scope is required';
  END IF;

  PERFORM public.validate_position_locations(p_tier, p_county, p_constituency, p_ward);

  SELECT * INTO v_cycle FROM public.election_cycles WHERE slug = p_cycle_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Election cycle not found';
  END IF;

  v_id := public.slugify_position_id(p_title);
  IF EXISTS (SELECT 1 FROM public.positions WHERE id = v_id) THEN
    v_id := v_id || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;

  INSERT INTO public.positions (
    id, tier, title, scope, description,
    county, constituency, ward, election_cycle_id
  ) VALUES (
    v_id,
    p_tier,
    trim(p_title),
    trim(p_scope),
    coalesce(nullif(trim(p_description), ''), trim(p_title)),
    nullif(trim(p_county), ''),
    nullif(trim(p_constituency), ''),
    nullif(trim(p_ward), ''),
    v_cycle.id
  )
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.create_position',
    'position',
    v_row.id,
    NULL,
    to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_position(
  p_id             text,
  p_title          text,
  p_tier           public.position_tier,
  p_scope          text,
  p_county         text DEFAULT NULL,
  p_constituency   text DEFAULT NULL,
  p_ward           text DEFAULT NULL,
  p_description    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.positions%ROWTYPE;
  v_row public.positions%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.positions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  IF length(trim(p_title)) < 2 THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  IF length(trim(p_scope)) < 2 THEN
    RAISE EXCEPTION 'Scope is required';
  END IF;

  PERFORM public.validate_position_locations(p_tier, p_county, p_constituency, p_ward);

  UPDATE public.positions SET
    title = trim(p_title),
    tier = p_tier,
    scope = trim(p_scope),
    description = coalesce(nullif(trim(p_description), ''), trim(p_title)),
    county = nullif(trim(p_county), ''),
    constituency = nullif(trim(p_constituency), ''),
    ward = nullif(trim(p_ward), '')
  WHERE id = p_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.update_position',
    'position',
    p_id,
    to_jsonb(v_before),
    to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_position(p_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.positions%ROWTYPE;
  v_candidate_count bigint;
  v_vote_count bigint;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.positions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  SELECT count(*) INTO v_candidate_count
  FROM public.candidates WHERE position_id = p_id;

  SELECT count(*) INTO v_vote_count
  FROM public.votes WHERE position_id = p_id;

  IF v_candidate_count > 0 OR v_vote_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete position: referenced by % candidate(s) and % vote(s)',
      v_candidate_count, v_vote_count;
  END IF;

  DELETE FROM public.positions WHERE id = p_id;

  PERFORM public.write_audit(
    'admin.delete_position',
    'position',
    p_id,
    to_jsonb(v_before),
    NULL
  );

  RETURN jsonb_build_object('id', p_id, 'deleted', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_position(text, public.position_tier, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_position(text, text, public.position_tier, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_position(text) TO authenticated;
