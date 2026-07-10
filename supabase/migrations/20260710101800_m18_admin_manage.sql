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
