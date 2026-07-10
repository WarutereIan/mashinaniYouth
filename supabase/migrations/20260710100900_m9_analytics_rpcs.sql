-- M9: analytics + counter RPCs (Slice 3)

CREATE OR REPLACE FUNCTION public.analytics_gender_split(p_position_id text)
RETURNS TABLE (gender text, votes bigint, pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT coalesce(nullif(trim(vt.gender), ''), 'unknown') AS gender, count(*) AS cnt
    FROM public.votes vo
    JOIN public.voters vt ON vt.id = vo.voter_id
    WHERE vo.position_id = p_position_id
      AND vo.status IN ('cast', 'changed')
    GROUP BY 1
  ),
  total AS (SELECT sum(cnt) AS t FROM base)
  SELECT b.gender, b.cnt AS votes,
    CASE WHEN total.t > 0 THEN round(100.0 * b.cnt / total.t, 1) ELSE 0 END AS pct
  FROM base b, total
  ORDER BY b.cnt DESC;
$$;

CREATE OR REPLACE FUNCTION public.analytics_age_split(p_position_id text)
RETURNS TABLE (age_band text, votes bigint, pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH bands AS (
    SELECT
      CASE
        WHEN vt.date_of_birth IS NULL THEN 'unknown'
        WHEN date_part('year', age(vt.date_of_birth)) BETWEEN 18 AND 24 THEN '18-24'
        WHEN date_part('year', age(vt.date_of_birth)) BETWEEN 25 AND 34 THEN '25-34'
        WHEN date_part('year', age(vt.date_of_birth)) BETWEEN 35 AND 44 THEN '35-44'
        ELSE '45+'
      END AS age_band,
      count(*) AS cnt
    FROM public.votes vo
    JOIN public.voters vt ON vt.id = vo.voter_id
    WHERE vo.position_id = p_position_id
      AND vo.status IN ('cast', 'changed')
    GROUP BY 1
  ),
  total AS (SELECT sum(cnt) AS t FROM bands)
  SELECT b.age_band, b.cnt AS votes,
    CASE WHEN total.t > 0 THEN round(100.0 * b.cnt / total.t, 1) ELSE 0 END AS pct
  FROM bands b, total
  ORDER BY b.cnt DESC;
$$;

CREATE OR REPLACE FUNCTION public.voter_turnout(
  p_county text DEFAULT NULL,
  p_constituency text DEFAULT NULL,
  p_ward text DEFAULT NULL
)
RETURNS TABLE (registered bigint, voted bigint, turnout_pct numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH reg AS (
    SELECT count(*) AS n FROM public.voters vt
    WHERE (p_county IS NULL OR vt.county = p_county)
      AND (p_constituency IS NULL OR vt.constituency = p_constituency)
      AND (p_ward IS NULL OR vt.ward = p_ward)
  ),
  voted AS (
    SELECT count(DISTINCT vo.voter_id) AS n
    FROM public.votes vo
    JOIN public.voters vt ON vt.id = vo.voter_id
    WHERE vo.status IN ('cast', 'changed')
      AND (p_county IS NULL OR vt.county = p_county)
      AND (p_constituency IS NULL OR vt.constituency = p_constituency)
      AND (p_ward IS NULL OR vt.ward = p_ward)
  )
  SELECT reg.n, voted.n,
    CASE WHEN reg.n > 0 THEN round(100.0 * voted.n / reg.n, 1) ELSE 0 END
  FROM reg, voted;
$$;

CREATE OR REPLACE FUNCTION public.count_positions()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT count(*)::bigint FROM public.positions; $$;

CREATE OR REPLACE FUNCTION public.count_approved_candidates()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT count(*)::bigint FROM public.candidates WHERE status = 'approved'; $$;

CREATE OR REPLACE FUNCTION public.count_registered_voters()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT count(*)::bigint FROM public.voters; $$;

GRANT EXECUTE ON FUNCTION public.analytics_gender_split(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_age_split(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.voter_turnout(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_positions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_approved_candidates() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_registered_voters() TO anon, authenticated;
