-- M29: Relax name uniqueness to a soft warning (drop the hard unique indexes)
-- and make the candidate IEBC voter registration number optional.

DROP INDEX IF EXISTS public.voters_full_name_ci_key;
DROP INDEX IF EXISTS public.candidates_full_name_ci_key;

ALTER TABLE public.candidates
  ALTER COLUMN iebc_voter_number DROP NOT NULL;
