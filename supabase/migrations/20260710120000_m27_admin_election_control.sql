-- M27: Admin-controlled election lifecycle.
--
-- 1) positions.applications_open: per-position gate for candidate nominations.
--    New admin-created positions default to CLOSED (false); an admin must
--    explicitly open nominations seat-by-seat. Existing seeded positions are
--    set to OPEN so the demo seed (direct candidate inserts) still works.
--
-- 2) CRUD RPCs for election cycles and poll windows (superadmin, audited),
--    so the admin can create/edit/delete the schedule from the UI rather than
--    only flipping phase on SQL-seeded rows.
--
-- 3) admin_set_position_applications_open: toggle nominations on a position.
--
-- 4) A BEFORE INSERT trigger on candidates that enforces applications_open at
--    the database level, so a direct client insert cannot bypass the server fn.

-- (1) applications_open column
ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS applications_open boolean NOT NULL DEFAULT false;

UPDATE public.positions
SET applications_open = true
WHERE election_cycle_id = (
  SELECT id FROM public.election_cycles WHERE slug = 'mykdm-2026'
);

-- (3) toggle nominations
CREATE OR REPLACE FUNCTION public.admin_set_position_applications_open(
  p_id   text,
  p_open boolean
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

  UPDATE public.positions SET applications_open = p_open
  WHERE id = p_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.set_position_applications_open',
    'position',
    p_id,
    jsonb_build_object('applications_open', v_before.applications_open),
    jsonb_build_object('applications_open', v_row.applications_open)
  );

  RETURN jsonb_build_object('id', v_row.id, 'applications_open', v_row.applications_open);
END;
$$;

-- (2a) election cycle CRUD
CREATE OR REPLACE FUNCTION public.admin_create_cycle(
  p_name         text,
  p_slug         text,
  p_window_start timestamptz,
  p_window_end   timestamptz,
  p_phase        public.election_phase DEFAULT 'draft'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_row public.election_cycles%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF length(trim(p_name)) < 2 THEN RAISE EXCEPTION 'Cycle name is required'; END IF;
  IF length(trim(p_slug)) < 2 THEN RAISE EXCEPTION 'Cycle slug is required'; END IF;
  IF p_window_end <= p_window_start THEN
    RAISE EXCEPTION 'Window end must be after window start';
  END IF;

  INSERT INTO public.election_cycles (name, slug, window_start, window_end, phase)
  VALUES (trim(p_name), trim(p_slug), p_window_start, p_window_end, p_phase)
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.create_cycle', 'election_cycle', v_row.id::text, NULL, to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_cycle(
  p_id           bigint,
  p_name         text,
  p_slug         text,
  p_window_start timestamptz,
  p_window_end   timestamptz,
  p_phase        public.election_phase
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.election_cycles%ROWTYPE;
  v_row public.election_cycles%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.election_cycles WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cycle not found'; END IF;

  IF length(trim(p_name)) < 2 THEN RAISE EXCEPTION 'Cycle name is required'; END IF;
  IF length(trim(p_slug)) < 2 THEN RAISE EXCEPTION 'Cycle slug is required'; END IF;
  IF p_window_end <= p_window_start THEN
    RAISE EXCEPTION 'Window end must be after window start';
  END IF;

  UPDATE public.election_cycles SET
    name = trim(p_name),
    slug = trim(p_slug),
    window_start = p_window_start,
    window_end = p_window_end,
    phase = p_phase
  WHERE id = p_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.update_cycle', 'election_cycle', p_id::text,
    to_jsonb(v_before), to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_cycle(p_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.election_cycles%ROWTYPE;
  v_position_count bigint;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.election_cycles WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cycle not found'; END IF;

  SELECT count(*) INTO v_position_count
  FROM public.positions WHERE election_cycle_id = p_id;
  IF v_position_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete cycle: % position(s) still reference it', v_position_count;
  END IF;

  DELETE FROM public.election_cycles WHERE id = p_id;

  PERFORM public.write_audit(
    'admin.delete_cycle', 'election_cycle', p_id::text, to_jsonb(v_before), NULL
  );

  RETURN jsonb_build_object('id', p_id, 'deleted', true);
END;
$$;

-- (2b) poll window CRUD
CREATE OR REPLACE FUNCTION public.admin_create_poll_window(
  p_cycle_id  bigint,
  p_region    text,
  p_poll_date date,
  p_opens_at  timestamptz,
  p_closes_at timestamptz,
  p_counties  text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_row public.poll_windows%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF length(trim(p_region)) < 2 THEN RAISE EXCEPTION 'Region is required'; END IF;
  IF p_closes_at <= p_opens_at THEN RAISE EXCEPTION 'Closes at must be after opens at'; END IF;

  INSERT INTO public.poll_windows (cycle_id, region, poll_date, opens_at, closes_at, counties)
  VALUES (p_cycle_id, trim(p_region), p_poll_date, p_opens_at, p_closes_at, p_counties)
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.create_poll_window', 'poll_window', v_row.id::text, NULL, to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_poll_window(
  p_id        bigint,
  p_region    text,
  p_poll_date date,
  p_opens_at  timestamptz,
  p_closes_at timestamptz,
  p_counties  text[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.poll_windows%ROWTYPE;
  v_row public.poll_windows%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.poll_windows WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Poll window not found'; END IF;

  IF length(trim(p_region)) < 2 THEN RAISE EXCEPTION 'Region is required'; END IF;
  IF p_closes_at <= p_opens_at THEN RAISE EXCEPTION 'Closes at must be after opens at'; END IF;

  UPDATE public.poll_windows SET
    region = trim(p_region),
    poll_date = p_poll_date,
    opens_at = p_opens_at,
    closes_at = p_closes_at,
    counties = p_counties
  WHERE id = p_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.update_poll_window', 'poll_window', p_id::text,
    to_jsonb(v_before), to_jsonb(v_row)
  );

  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_poll_window(p_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.poll_windows%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.poll_windows WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Poll window not found'; END IF;

  DELETE FROM public.poll_windows WHERE id = p_id;

  PERFORM public.write_audit(
    'admin.delete_poll_window', 'poll_window', p_id::text, to_jsonb(v_before), NULL
  );

  RETURN jsonb_build_object('id', p_id, 'deleted', true);
END;
$$;

-- (4) DB-level guard: candidates may only be inserted when the position has
--     applications_open = true. Defense in depth on top of the server fn.
CREATE OR REPLACE FUNCTION public.guard_candidate_application_open()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_open boolean;
BEGIN
  SELECT applications_open INTO v_open FROM public.positions WHERE id = NEW.position_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected position not found';
  END IF;
  IF NOT v_open THEN
    RAISE EXCEPTION 'Applications are not open for this position';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_candidate_application_open ON public.candidates;
CREATE TRIGGER trg_guard_candidate_application_open
BEFORE INSERT ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.guard_candidate_application_open();

-- Privileges: revoke default PUBLIC EXECUTE, grant to authenticated only.
REVOKE EXECUTE ON FUNCTION public.admin_set_position_applications_open(text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_cycle(text, text, timestamptz, timestamptz, public.election_phase) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_cycle(bigint, text, text, timestamptz, timestamptz, public.election_phase) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_cycle(bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_poll_window(bigint, text, date, timestamptz, timestamptz, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_poll_window(bigint, text, date, timestamptz, timestamptz, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_poll_window(bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_set_position_applications_open(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_cycle(text, text, timestamptz, timestamptz, public.election_phase) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_cycle(bigint, text, text, timestamptz, timestamptz, public.election_phase) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_cycle(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_poll_window(bigint, text, date, timestamptz, timestamptz, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_poll_window(bigint, text, date, timestamptz, timestamptz, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_poll_window(bigint) TO authenticated;
