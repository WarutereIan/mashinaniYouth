-- M18: Superadmin admin_users management RPCs (Phase 1)

CREATE POLICY "Admins (superadmin) manage admin_users"
  ON public.admin_users FOR ALL
  USING (
    public.is_admin()
    AND (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) = 'superadmin'
  )
  WITH CHECK (
    public.is_admin()
    AND (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) = 'superadmin'
  );

CREATE OR REPLACE FUNCTION public.admin_grant_role(
  p_user_id uuid,
  p_role public.admin_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before_role public.admin_role;
  v_row public.admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT role INTO v_before_role FROM public.admin_users WHERE user_id = p_user_id;

  INSERT INTO public.admin_users (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.grant_role',
    'admin_user',
    p_user_id::text,
    CASE WHEN v_before_role IS NULL THEN NULL
         ELSE jsonb_build_object('role', v_before_role)
    END,
    jsonb_build_object('role', p_role)
  );

  RETURN jsonb_build_object('user_id', v_row.user_id, 'role', v_row.role);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_before_role public.admin_role;
BEGIN
  SELECT * INTO v_admin FROM public.admin_users WHERE user_id = auth.uid();
  IF NOT FOUND OR v_admin.role <> 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;

  SELECT role INTO v_before_role FROM public.admin_users WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = p_user_id;

  PERFORM public.write_audit(
    'admin.revoke_role',
    'admin_user',
    p_user_id::text,
    jsonb_build_object('role', v_before_role),
    NULL
  );

  RETURN jsonb_build_object('user_id', p_user_id, 'revoked', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id uuid,
  email   text,
  role    public.admin_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT a.user_id, u.email::text, a.role
  FROM public.admin_users a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY u.email;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_lookup_user_by_email(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
BEGIN
  IF (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_user
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'user_id', v_user.id,
    'email', v_user.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lookup_user_by_email(text) TO authenticated;


-- M19: Admin MFA enrollment check (Phase 2)

CREATE OR REPLACE FUNCTION public.admin_mfa_enrolled(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.mfa_factors
    WHERE user_id = p_user
      AND factor_type = 'totp'
      AND status = 'verified'
  );
$$;

GRANT EXECUTE ON FUNCTION public.admin_mfa_enrolled(uuid) TO authenticated;


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


-- M24: Wire write_audit into cast_vote + admin RPCs (Phase 3 completion)

CREATE OR REPLACE FUNCTION public.cast_vote(
  p_position_id text,
  p_candidate_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_voter public.voters%ROWTYPE;
  v_position public.positions%ROWTYPE;
  v_candidate public.candidates%ROWTYPE;
  v_cycle public.election_cycles%ROWTYPE;
  v_poll public.poll_windows%ROWTYPE;
  v_now timestamptz := now();
  v_receipt text;
  v_ballot_hash text;
  v_existing public.votes%ROWTYPE;
  v_prior_candidate_id uuid;
  v_cast_at timestamptz := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_voter FROM public.voters WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'You must register as a voter before casting a ballot';
  END IF;

  SELECT * INTO v_position FROM public.positions WHERE id = p_position_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown position';
  END IF;

  SELECT * INTO v_candidate FROM public.candidates
  WHERE id = p_candidate_id AND status = 'approved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Candidate not found or not approved';
  END IF;

  IF v_candidate.position_id IS DISTINCT FROM p_position_id THEN
    RAISE EXCEPTION 'Candidate does not belong to this position';
  END IF;

  SELECT * INTO v_cycle FROM public.election_cycles WHERE id = v_position.election_cycle_id;
  IF v_cycle.phase NOT IN ('open', 'scheduled') THEN
    RAISE EXCEPTION 'Voting is not open for this election cycle';
  END IF;

  IF v_position.tier = 'national' THEN
    NULL;
  ELSIF v_position.tier = 'county' THEN
    IF v_voter.county IS DISTINCT FROM v_position.county THEN
      RAISE EXCEPTION 'You are not eligible to vote in this county position';
    END IF;
  ELSIF v_position.tier = 'constituency' THEN
    IF v_voter.county IS DISTINCT FROM v_position.county
       OR v_voter.constituency IS DISTINCT FROM v_position.constituency THEN
      RAISE EXCEPTION 'You are not eligible to vote in this constituency position';
    END IF;
  ELSIF v_position.tier = 'ward' THEN
    IF v_voter.county IS DISTINCT FROM v_position.county
       OR v_voter.constituency IS DISTINCT FROM v_position.constituency
       OR v_voter.ward IS DISTINCT FROM v_position.ward THEN
      RAISE EXCEPTION 'You are not eligible to vote in this ward position';
    END IF;
  END IF;

  IF v_position.tier <> 'national' THEN
    SELECT pw.* INTO v_poll
    FROM public.poll_windows pw
    WHERE pw.cycle_id = v_cycle.id
      AND v_voter.county = ANY (pw.counties)
      AND v_now >= pw.opens_at
      AND v_now <= pw.closes_at
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Polls are not open for your county at this time';
    END IF;
  ELSE
    SELECT pw.* INTO v_poll
    FROM public.poll_windows pw
    WHERE pw.cycle_id = v_cycle.id
      AND v_now >= pw.opens_at
      AND v_now <= pw.closes_at
    LIMIT 1;
    IF NOT FOUND AND v_cycle.phase <> 'scheduled' THEN
      RAISE EXCEPTION 'National polls are not open at this time';
    END IF;
  END IF;

  v_receipt := public.gen_receipt_code();
  WHILE EXISTS (SELECT 1 FROM public.votes WHERE receipt_code = v_receipt) LOOP
    v_receipt := public.gen_receipt_code();
  END LOOP;

  v_ballot_hash := encode(
    digest(
      v_voter.id::text || ':' || p_position_id || ':' || p_candidate_id::text || ':' || v_cast_at::text,
      'sha256'
    ),
    'hex'
  );

  SELECT * INTO v_existing FROM public.votes
  WHERE voter_id = v_voter.id AND position_id = p_position_id;

  IF FOUND THEN
    v_prior_candidate_id := v_existing.candidate_id;

    UPDATE public.votes SET
      candidate_id = p_candidate_id,
      receipt_code = v_receipt,
      cast_at = v_cast_at,
      status = 'changed',
      ballot_hash = v_ballot_hash
    WHERE id = v_existing.id
    RETURNING * INTO v_existing;

    PERFORM public.write_audit(
      'vote.change',
      'vote',
      v_existing.id::text,
      jsonb_build_object(
        'candidate_id', v_prior_candidate_id,
        'position_id', p_position_id
      ),
      jsonb_build_object(
        'candidate_id', p_candidate_id,
        'position_id', p_position_id
      )
    );
  ELSE
    INSERT INTO public.votes (
      voter_id, position_id, candidate_id, cycle_id,
      receipt_code, cast_at, status, ballot_hash
    ) VALUES (
      v_voter.id, p_position_id, p_candidate_id, v_cycle.id,
      v_receipt, v_cast_at, 'cast', v_ballot_hash
    )
    RETURNING * INTO v_existing;

    PERFORM public.write_audit(
      'vote.cast',
      'vote',
      v_existing.id::text,
      NULL,
      jsonb_build_object(
        'candidate_id', p_candidate_id,
        'position_id', p_position_id
      )
    );
  END IF;

  INSERT INTO public.vote_receipts (
    receipt_code, voter_id, position_id, candidate_id, cast_at
  ) VALUES (
    v_receipt, v_voter.id, p_position_id, p_candidate_id, v_cast_at
  );

  RETURN jsonb_build_object(
    'receipt_code', v_receipt,
    'cast_at', v_cast_at,
    'position_id', p_position_id,
    'candidate_id', p_candidate_id
  );
END;
$$;

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

  PERFORM public.write_audit(
    'admin.approve_candidate',
    'candidate',
    p_candidate_id::text,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'approved')
  );

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

  PERFORM public.write_audit(
    'admin.reject_candidate',
    'candidate',
    p_candidate_id::text,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object('status', 'rejected', 'reason', p_reason)
  );

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

  UPDATE public.election_cycles SET phase = p_phase
  WHERE slug = p_cycle_slug
  RETURNING * INTO v_row;

  PERFORM public.write_audit(
    'admin.set_cycle_phase',
    'election_cycle',
    p_cycle_slug,
    jsonb_build_object('phase', v_before.phase),
    jsonb_build_object('phase', v_row.phase)
  );

  RETURN jsonb_build_object('slug', v_row.slug, 'phase', v_row.phase);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_vote(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_candidate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_candidate(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_cycle_phase(text, public.election_phase) TO authenticated;

