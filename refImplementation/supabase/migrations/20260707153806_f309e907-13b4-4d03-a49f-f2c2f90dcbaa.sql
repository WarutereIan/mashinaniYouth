
DROP POLICY IF EXISTS "Anyone can submit a candidate application" ON public.candidates;

CREATE POLICY "Anyone can submit a valid candidate application"
  ON public.candidates FOR INSERT
  WITH CHECK (
    length(trim(full_name)) BETWEEN 3 AND 120
    AND length(trim(national_id)) BETWEEN 5 AND 20
    AND length(trim(iebc_voter_number)) BETWEEN 5 AND 30
    AND length(trim(phone)) BETWEEN 7 AND 20
    AND length(trim(position_title)) BETWEEN 3 AND 120
    AND length(trim(county)) BETWEEN 2 AND 60
    AND status IN ('pending', 'approved')
    AND certificate_number IS NULL
    AND certified_at IS NULL
  );
