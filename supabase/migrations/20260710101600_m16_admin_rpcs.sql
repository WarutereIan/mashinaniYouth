-- M16: Admin RPCs for candidate review + cycle phase (Slice 5)

CREATE OR REPLACE FUNCTION public.admin_approve_candidate(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_row public.candidates%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role NOT IN ('superadmin', 'reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.candidates SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_candidate_id AND status = 'pending'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found or not pending';
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'certificate_number', v_row.certificate_number
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_candidate(p_candidate_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_row public.candidates%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role NOT IN ('superadmin', 'reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.candidates SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    bio = coalesce(p_reason, bio)
  WHERE id = p_candidate_id AND status = 'pending'
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found or not pending';
  END IF;

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_cycle_phase(
  p_cycle_slug text,
  p_phase public.election_phase
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

  UPDATE public.election_cycles SET phase = p_phase
  WHERE slug = p_cycle_slug
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found';
  END IF;

  RETURN jsonb_build_object('slug', v_row.slug, 'phase', v_row.phase);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_candidate(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_cycle_phase(text, public.election_phase) TO authenticated;

-- Admin write policies for reference tables
CREATE POLICY "Admins manage election cycles"
  ON public.election_cycles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage poll windows"
  ON public.poll_windows FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage positions"
  ON public.positions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
