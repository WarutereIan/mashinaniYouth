-- M17: Lock down votes writes to cast_vote RPC (plan §11.1) + aggregate RPCs
--
-- Problem: M7 granted INSERT/UPDATE to authenticated and added client write
-- policies, so a crafted client could bypass the cast_vote RPC and insert
-- votes directly, skipping poll-window/eligibility validation. Also, the
-- tally_by_position_live view and direct count() on votes run with the
-- caller's privileges, so RLS restricts them to the voter's own rows — the
-- elections hub "Votes counted" stat was therefore wrong.
--
-- Fix:
--   1. Revoke INSERT/UPDATE from authenticated; drop client write policies.
--      cast_vote is SECURITY DEFINER (owner), so it still writes.
--   2. Add SECURITY DEFINER aggregate RPCs so the hub reads cross-voter totals.

-- 1. Make cast_vote the sole write path to votes
REVOKE INSERT, UPDATE ON public.votes FROM authenticated;
GRANT SELECT ON public.votes TO authenticated; -- keep own-row reads (RLS still applies)

DROP POLICY IF EXISTS "Voters insert own votes" ON public.votes;
DROP POLICY IF EXISTS "Voters update own votes" ON public.votes;

-- 2. SECURITY DEFINER aggregate RPCs (bypass RLS for public tally reads)
CREATE OR REPLACE FUNCTION public.total_votes_cast(p_cycle_slug text DEFAULT 'mykdm-2026')
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.votes v
  JOIN public.election_cycles c ON c.id = v.cycle_id
  WHERE c.slug = p_cycle_slug
    AND v.status IN ('cast', 'changed');
$$;

GRANT EXECUTE ON FUNCTION public.total_votes_cast(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.votes_by_position(p_cycle_slug text DEFAULT 'mykdm-2026')
RETURNS TABLE (position_id text, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.position_id, count(*)::bigint AS votes
  FROM public.votes v
  JOIN public.election_cycles c ON c.id = v.cycle_id
  WHERE c.slug = p_cycle_slug
    AND v.status IN ('cast', 'changed')
  GROUP BY v.position_id;
$$;

GRANT EXECUTE ON FUNCTION public.votes_by_position(text) TO anon, authenticated;
