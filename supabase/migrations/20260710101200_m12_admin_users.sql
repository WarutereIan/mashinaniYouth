-- M12: admin_users RBAC (Slice 5)

CREATE TYPE public.admin_role AS ENUM ('superadmin', 'reviewer', 'viewer');

CREATE TABLE public.admin_users (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.admin_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read own admin row"
  ON public.admin_users FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = p_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Admin bypass policies for votes (read-only reconciliation)
CREATE POLICY "Admins read all votes"
  ON public.votes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins read vote receipts"
  ON public.vote_receipts FOR SELECT
  USING (public.is_admin());

-- Admin candidate review policies
CREATE POLICY "Admins read all candidates"
  ON public.candidates FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update candidates"
  ON public.candidates FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Candidates read own pending row"
  ON public.candidates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Candidates update own pending row"
  ON public.candidates FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read pledges"
  ON public.support_pledges FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins update pledges"
  ON public.support_pledges FOR UPDATE
  USING (public.is_admin());
