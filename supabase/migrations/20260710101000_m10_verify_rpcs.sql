-- M10: verify_certificate + verify_receipt (Slice 7)

CREATE OR REPLACE FUNCTION public.verify_receipt(p_receipt_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.vote_receipts%ROWTYPE;
  v_position public.positions%ROWTYPE;
  v_candidate public.candidates%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.vote_receipts
  WHERE receipt_code = upper(trim(p_receipt_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT * INTO v_position FROM public.positions WHERE id = v_row.position_id;
  SELECT * INTO v_candidate FROM public.candidates WHERE id = v_row.candidate_id;

  RETURN jsonb_build_object(
    'valid', true,
    'receipt_code', v_row.receipt_code,
    'position_title', v_position.title,
    'position_scope', v_position.scope,
    'candidate_name', v_candidate.full_name,
    'cast_at', v_row.cast_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_number text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cand public.candidates%ROWTYPE;
  v_position public.positions%ROWTYPE;
BEGIN
  SELECT * INTO v_cand FROM public.candidates
  WHERE certificate_number = upper(trim(p_certificate_number))
    AND status = 'approved';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  IF v_cand.position_id IS NOT NULL THEN
    SELECT * INTO v_position FROM public.positions WHERE id = v_cand.position_id;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'certificate_number', v_cand.certificate_number,
    'full_name', v_cand.full_name,
    'position_title', coalesce(v_position.title, v_cand.position_title),
    'scope', coalesce(v_position.scope, v_cand.tier::text),
    'county', v_cand.county,
    'certified_at', v_cand.certified_at,
    'status', v_cand.status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_receipt(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
