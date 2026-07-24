-- M35: Admin delete candidate / voter / auth user (+ list voters for ops UI).

CREATE OR REPLACE FUNCTION public.admin_list_voters()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  county text,
  constituency text,
  ward text,
  national_id_last4 text,
  registered_at timestamptz,
  vote_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.user_id,
    v.full_name,
    p.email,
    v.phone,
    v.county,
    v.constituency,
    v.ward,
    v.national_id_last4,
    v.registered_at,
    (SELECT count(*)::bigint FROM public.votes vo WHERE vo.voter_id = v.id) AS vote_count
  FROM public.voters v
  LEFT JOIN public.profiles p ON p.id = v.user_id
  ORDER BY v.registered_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_candidate(p_candidate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.candidates%ROWTYPE;
  v_votes_deleted bigint;
  v_receipts_deleted bigint;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role NOT IN ('superadmin', 'reviewer') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.candidates WHERE id = p_candidate_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found';
  END IF;

  DELETE FROM public.vote_receipts WHERE candidate_id = p_candidate_id;
  GET DIAGNOSTICS v_receipts_deleted = ROW_COUNT;

  DELETE FROM public.votes WHERE candidate_id = p_candidate_id;
  GET DIAGNOSTICS v_votes_deleted = ROW_COUNT;

  DELETE FROM public.candidates WHERE id = p_candidate_id;

  PERFORM public.write_audit(
    'admin.delete_candidate',
    'candidate',
    p_candidate_id::text,
    jsonb_build_object(
      'full_name', v_before.full_name,
      'status', v_before.status,
      'position_id', v_before.position_id,
      'user_id', v_before.user_id,
      'votes_deleted', v_votes_deleted,
      'receipts_deleted', v_receipts_deleted
    ),
    NULL
  );

  RETURN jsonb_build_object(
    'id', p_candidate_id,
    'deleted', true,
    'votes_deleted', v_votes_deleted,
    'receipts_deleted', v_receipts_deleted
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_voter(p_voter_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before public.voters%ROWTYPE;
  v_votes_deleted bigint;
  v_receipts_deleted bigint;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_before FROM public.voters WHERE id = p_voter_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voter not found';
  END IF;

  DELETE FROM public.vote_receipts WHERE voter_id = p_voter_id;
  GET DIAGNOSTICS v_receipts_deleted = ROW_COUNT;

  DELETE FROM public.votes WHERE voter_id = p_voter_id;
  GET DIAGNOSTICS v_votes_deleted = ROW_COUNT;

  DELETE FROM public.voters WHERE id = p_voter_id;

  PERFORM public.write_audit(
    'admin.delete_voter',
    'voter',
    p_voter_id::text,
    jsonb_build_object(
      'user_id', v_before.user_id,
      'full_name', v_before.full_name,
      'county', v_before.county,
      'votes_deleted', v_votes_deleted,
      'receipts_deleted', v_receipts_deleted
    ),
    NULL
  );

  RETURN jsonb_build_object(
    'id', p_voter_id,
    'user_id', v_before.user_id,
    'deleted', true,
    'votes_deleted', v_votes_deleted,
    'receipts_deleted', v_receipts_deleted
  );
END;
$$;

-- Removes public app data for an auth user, then deletes auth.users.
-- Does not allow deleting yourself or the last remaining superadmin.
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_target_role public.admin_role;
  v_superadmin_count bigint;
  v_voter_id uuid;
  v_candidates_deleted bigint;
  v_votes_deleted bigint := 0;
  v_receipts_deleted bigint := 0;
  v_email text;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account from admin';
  END IF;

  SELECT role INTO v_target_role FROM public.admin_users WHERE user_id = p_user_id;
  IF FOUND THEN
    IF v_target_role = 'superadmin' THEN
      SELECT count(*) INTO v_superadmin_count
      FROM public.admin_users WHERE role = 'superadmin';
      IF v_superadmin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot delete the last superadmin';
      END IF;
    END IF;
    DELETE FROM public.admin_users WHERE user_id = p_user_id;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  SELECT id INTO v_voter_id FROM public.voters WHERE user_id = p_user_id;
  IF FOUND THEN
    DELETE FROM public.vote_receipts WHERE voter_id = v_voter_id;
    GET DIAGNOSTICS v_receipts_deleted = ROW_COUNT;
    DELETE FROM public.votes WHERE voter_id = v_voter_id;
    GET DIAGNOSTICS v_votes_deleted = ROW_COUNT;
    DELETE FROM public.voters WHERE id = v_voter_id;
  END IF;

  -- Clear votes cast for this user's candidacies before removing candidate rows.
  DELETE FROM public.vote_receipts
  WHERE candidate_id IN (SELECT id FROM public.candidates WHERE user_id = p_user_id);

  DELETE FROM public.votes
  WHERE candidate_id IN (SELECT id FROM public.candidates WHERE user_id = p_user_id);

  DELETE FROM public.candidates WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_candidates_deleted = ROW_COUNT;

  DELETE FROM public.profiles WHERE id = p_user_id;

  DELETE FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  PERFORM public.write_audit(
    'admin.delete_user',
    'user',
    p_user_id::text,
    jsonb_build_object(
      'email', v_email,
      'candidates_deleted', v_candidates_deleted,
      'votes_deleted', v_votes_deleted,
      'receipts_deleted', v_receipts_deleted,
      'voter_id', v_voter_id
    ),
    NULL
  );

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'email', v_email,
    'deleted', true,
    'candidates_deleted', v_candidates_deleted,
    'votes_deleted', v_votes_deleted
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_voters() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_candidate(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_voter(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_list_voters() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_voter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
