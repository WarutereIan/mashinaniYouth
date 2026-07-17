-- M30: Fix infinite recursion in admin_users RLS policy.
--
-- The "Admins (superadmin) manage admin_users" policy had a self-referencing
-- subquery (SELECT role FROM admin_users WHERE ...) which triggered infinite
-- recursion when PostgreSQL evaluated the policy. Replace with a SECURITY
-- DEFINER helper that bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = p_user_id AND role = 'superadmin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins (superadmin) manage admin_users" ON public.admin_users;

CREATE POLICY "Superadmin manage admin_users"
  ON public.admin_users FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
