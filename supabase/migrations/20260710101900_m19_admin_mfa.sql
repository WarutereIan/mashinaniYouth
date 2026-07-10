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
