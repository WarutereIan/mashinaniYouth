-- M25: Security hardening — close PostgREST EXECUTE privilege gap.
-- Postgres grants EXECUTE to PUBLIC by default on function creation.
-- Revoke from PUBLIC and grant only to authenticated for sensitive RPCs.
-- write_audit is internal-only (called by SECURITY DEFINER functions).

-- 1. Revoke EXECUTE from PUBLIC on admin/vote/audit RPCs
REVOKE EXECUTE ON FUNCTION public.admin_grant_role(uuid, public.admin_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_lookup_user_by_email(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_mfa_enrolled(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_approve_candidate(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_reject_candidate(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_cycle_phase(text, public.election_phase) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_pledge_status(uuid, public.pledge_status) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_create_position(text, public.position_tier, text, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_position(text, text, public.position_tier, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_position(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_unseal_cycle(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cast_vote(text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.write_audit(text, text, text, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recent_audit(int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recount_position(text) FROM PUBLIC;

-- 2. Grant EXECUTE to authenticated only (function bodies guard with is_admin())
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lookup_user_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mfa_enrolled(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_candidate(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_cycle_phase(text, public.election_phase) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_pledge_status(uuid, public.pledge_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_position(text, public.position_tier, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_position(text, text, public.position_tier, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_position(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unseal_cycle(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recent_audit(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recount_position(text) TO authenticated;

-- 3. write_audit: NOT granted to authenticated (internal-only via SECURITY DEFINER fns)

-- 4. Add is_admin() guard to recount_position (defense in depth)
CREATE OR REPLACE FUNCTION public.recount_position(p_position_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_declared_total bigint := 0;
  v_recounted_total bigint := 0;
  v_mismatched_rows jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.positions WHERE id = p_position_id) THEN
    RAISE EXCEPTION 'Position not found';
  END IF;

  SELECT coalesce(sum(votes), 0)::bigint INTO v_declared_total
  FROM public.tally_by_position(p_position_id);

  SELECT count(*)::bigint INTO v_recounted_total
  FROM public.votes v
  WHERE v.position_id = p_position_id
    AND v.status IN ('cast', 'changed');

  WITH declared AS (
    SELECT candidate_id, votes
    FROM public.tally_by_position(p_position_id)
  ),
  recounted AS (
    SELECT v.candidate_id, count(*)::bigint AS votes
    FROM public.votes v
    WHERE v.position_id = p_position_id
      AND v.status IN ('cast', 'changed')
    GROUP BY v.candidate_id
  ),
  mismatches AS (
    SELECT coalesce(d.candidate_id, r.candidate_id) AS candidate_id,
           coalesce(d.votes, 0)::bigint AS declared_votes,
           coalesce(r.votes, 0)::bigint AS recounted_votes
    FROM declared d
    FULL OUTER JOIN recounted r USING (candidate_id)
    WHERE coalesce(d.votes, 0) IS DISTINCT FROM coalesce(r.votes, 0)
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'candidate_id', m.candidate_id,
        'declared_votes', m.declared_votes,
        'recounted_votes', m.recounted_votes
      )
    ),
    '[]'::jsonb
  )
  INTO v_mismatched_rows
  FROM mismatches m;

  RETURN jsonb_build_object(
    'position_id', p_position_id,
    'declared_total', v_declared_total,
    'recounted_total', v_recounted_total,
    'match', v_declared_total = v_recounted_total AND v_mismatched_rows = '[]'::jsonb,
    'mismatched_rows', v_mismatched_rows
  );
END;
$$;

-- 5. Switch tally_by_position_live to SECURITY INVOKER so caller's RLS applies
ALTER VIEW public.tally_by_position_live SET (security_invoker = true);
