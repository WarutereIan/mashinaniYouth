-- M21: Admin pledge status RPC with audit (Phase 4)

CREATE OR REPLACE FUNCTION public.admin_set_pledge_status(
  p_pledge_id uuid,
  p_status public.pledge_status
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.support_pledges%ROWTYPE;
  v_before_status public.pledge_status;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT status INTO v_before_status
  FROM public.support_pledges
  WHERE id = p_pledge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pledge not found';
  END IF;

  IF v_before_status = p_status THEN
    SELECT * INTO v_row FROM public.support_pledges WHERE id = p_pledge_id;
    RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status);
  END IF;

  UPDATE public.support_pledges
  SET status = p_status
  WHERE id = p_pledge_id
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.set_pledge_status',
    'support_pledge',
    p_pledge_id::text,
    jsonb_build_object('status', v_before_status),
    jsonb_build_object('status', p_status)
  );

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_pledge_status(uuid, public.pledge_status) TO authenticated;
