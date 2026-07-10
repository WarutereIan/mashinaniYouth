-- M20: Append-only audit_log + write_audit / recent_audit RPCs (Phase 3)

CREATE TABLE public.audit_log (
  id             bigserial PRIMARY KEY,
  actor_user_id  uuid,
  action         text NOT NULL,
  target_type    text,
  target_id      text,
  "before"       jsonb,
  "after"        jsonb,
  ip             inet,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_actor_idx ON public.audit_log(actor_user_id);
CREATE INDEX audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX audit_log_action_idx ON public.audit_log(action);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated, anon, service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit rows; admins read all"
  ON public.audit_log FOR SELECT
  USING (actor_user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.write_audit(
  p_action      text,
  p_target_type text DEFAULT NULL,
  p_target_id   text DEFAULT NULL,
  p_before      jsonb DEFAULT NULL,
  p_after       jsonb DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
  v_user_agent text;
BEGIN
  BEGIN
    v_user_agent := nullif(
      current_setting('request.headers', true)::jsonb ->> 'user-agent',
      ''
    );
  EXCEPTION
    WHEN OTHERS THEN
      v_user_agent := NULL;
  END;

  INSERT INTO public.audit_log (
    actor_user_id,
    action,
    target_type,
    target_id,
    "before",
    "after",
    ip,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    p_before,
    p_after,
    inet_client_addr(),
    v_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recent_audit(p_limit int DEFAULT 50)
RETURNS TABLE (
  id             bigint,
  actor_user_id  uuid,
  actor_email    text,
  action         text,
  target_type    text,
  target_id      text,
  "before"       jsonb,
  "after"        jsonb,
  created_at     timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.actor_user_id,
    u.email::text AS actor_email,
    a.action,
    a.target_type,
    a.target_id,
    a."before",
    a."after",
    a.created_at
  FROM public.audit_log a
  LEFT JOIN auth.users u ON u.id = a.actor_user_id
  ORDER BY a.created_at DESC
  LIMIT greatest(1, least(p_limit, 500));
END;
$$;

GRANT EXECUTE ON FUNCTION public.write_audit(text, text, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recent_audit(int) TO authenticated;
