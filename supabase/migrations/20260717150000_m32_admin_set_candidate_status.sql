-- M32: Allow admins to set candidate status from any state (not just pending).

CREATE OR REPLACE FUNCTION public.admin_set_candidate_status(
  p_candidate_id uuid,
  p_status candidate_status,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_row public.candidates%ROWTYPE;
  v_old_status candidate_status;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role NOT IN ('superadmin', 'reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT status INTO v_old_status FROM public.candidates WHERE id = p_candidate_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;

  IF v_old_status = p_status THEN
    SELECT * INTO v_row FROM public.candidates WHERE id = p_candidate_id;
    RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status);
  END IF;

  UPDATE public.candidates SET
    status = p_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    bio = CASE
      WHEN p_status = 'rejected' AND p_reason IS NOT NULL AND btrim(p_reason) <> ''
        THEN p_reason
      ELSE bio
    END
  WHERE id = p_candidate_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.set_candidate_status',
    'candidate',
    p_candidate_id::text,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_status, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'id', v_row.id,
    'status', v_row.status,
    'certificate_number', v_row.certificate_number
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_candidate_status(uuid, candidate_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_candidate_status(uuid, candidate_status, text) TO authenticated;
