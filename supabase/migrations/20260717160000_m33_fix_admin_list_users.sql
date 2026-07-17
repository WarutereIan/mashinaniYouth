-- M33: Fix admin_list_users ambiguous "role" column (RETURNS TABLE vs SELECT).

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, role admin_role)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT a.user_id, u.email::text, a.role
  FROM public.admin_users a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY u.email;
END;
$$;
