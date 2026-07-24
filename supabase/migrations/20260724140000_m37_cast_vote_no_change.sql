-- M37: One vote per seat — reject changes. Ballots are final once cast.

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

  -- A candidate may not vote in a position they themselves are vying for.
  IF EXISTS (
    SELECT 1 FROM public.candidates
    WHERE user_id = v_user_id
      AND position_id = p_position_id
      AND status IN ('pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'You cannot vote in a position you are vying for';
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

  -- Ballots are final: one vote per voter per position.
  IF EXISTS (
    SELECT 1 FROM public.votes
    WHERE voter_id = v_voter.id AND position_id = p_position_id
  ) THEN
    RAISE EXCEPTION 'You have already voted for this position';
  END IF;

  v_receipt := public.gen_receipt_code();
  WHILE EXISTS (SELECT 1 FROM public.votes WHERE receipt_code = v_receipt) LOOP
    v_receipt := public.gen_receipt_code();
  END LOOP;

  v_ballot_hash := encode(
    extensions.digest(
      v_voter.id::text || ':' || p_position_id || ':' || p_candidate_id::text || ':' || v_cast_at::text,
      'sha256'
    ),
    'hex'
  );

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

GRANT EXECUTE ON FUNCTION public.cast_vote(text, uuid) TO authenticated;
