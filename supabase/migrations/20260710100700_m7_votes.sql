-- M7: votes + vote_receipts (Slice 2)

CREATE TYPE public.vote_status AS ENUM ('cast', 'changed', 'voided');

CREATE TABLE public.votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id      uuid NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  position_id   text NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  candidate_id  uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  cycle_id      bigint NOT NULL REFERENCES public.election_cycles(id) ON DELETE RESTRICT,
  receipt_code  text NOT NULL UNIQUE,
  cast_at       timestamptz NOT NULL DEFAULT now(),
  status        public.vote_status NOT NULL DEFAULT 'cast',
  ballot_hash   text NOT NULL,
  CONSTRAINT votes_one_per_position UNIQUE (voter_id, position_id)
);

CREATE INDEX votes_position_idx   ON public.votes(position_id);
CREATE INDEX votes_candidate_idx  ON public.votes(candidate_id);
CREATE INDEX votes_cycle_idx      ON public.votes(cycle_id);

CREATE TABLE public.vote_receipts (
  receipt_code  text PRIMARY KEY,
  voter_id      uuid NOT NULL REFERENCES public.voters(id) ON DELETE CASCADE,
  position_id   text NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
  candidate_id  uuid NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  cast_at       timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
GRANT ALL ON public.vote_receipts TO service_role;

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voters read own votes"
  ON public.votes FOR SELECT
  USING (
    voter_id IN (SELECT id FROM public.voters WHERE user_id = auth.uid())
  );

CREATE POLICY "Voters insert own votes"
  ON public.votes FOR INSERT
  WITH CHECK (
    voter_id IN (SELECT id FROM public.voters WHERE user_id = auth.uid())
  );

CREATE POLICY "Voters update own votes"
  ON public.votes FOR UPDATE
  USING (
    voter_id IN (SELECT id FROM public.voters WHERE user_id = auth.uid())
  )
  WITH CHECK (
    voter_id IN (SELECT id FROM public.voters WHERE user_id = auth.uid())
  );

-- vote_receipts: no direct client reads; verification via RPC only
