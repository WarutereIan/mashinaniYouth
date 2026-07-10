-- M23: Recount RPC, cycle seal trigger, admin unseal (Phase 6)

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

CREATE OR REPLACE FUNCTION public.enforce_cycle_seal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_cycle_id bigint;
  v_phase public.election_phase;
BEGIN
  v_cycle_id := coalesce(NEW.cycle_id, OLD.cycle_id);

  SELECT phase INTO v_phase
  FROM public.election_cycles
  WHERE id = v_cycle_id;

  IF v_phase = 'tallied' THEN
    RAISE EXCEPTION 'Cycle is sealed';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_votes_cycle_seal ON public.votes;

CREATE TRIGGER trg_votes_cycle_seal
BEFORE INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.enforce_cycle_seal();

CREATE OR REPLACE FUNCTION public.admin_unseal_cycle(p_cycle_slug text)
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

  SELECT * INTO v_before FROM public.election_cycles WHERE slug = p_cycle_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cycle not found';
  END IF;

  IF v_before.phase <> 'tallied' THEN
    RAISE EXCEPTION 'Cycle is not sealed (phase must be tallied)';
  END IF;

  UPDATE public.election_cycles
  SET phase = 'closed'
  WHERE slug = p_cycle_slug
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.unseal_cycle',
    'election_cycle',
    p_cycle_slug,
    jsonb_build_object('phase', v_before.phase),
    jsonb_build_object('phase', v_row.phase)
  );

  RETURN jsonb_build_object('slug', v_row.slug, 'phase', v_row.phase);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recount_position(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unseal_cycle(text) TO authenticated;
