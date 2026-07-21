import { supabase } from "@/integrations/supabase/client";

export type AdminRow = {
  user_id: string;
  role: string;
};

// Lightweight client-side admin probe. Kept separate from admin.ts (which
// bundles createServerFn RPCs) so importing it into site-wide chrome doesn't
// pull server-function code into the main client bundle.
export async function getMyAdminRow(userId?: string): Promise<AdminRow | null> {
  let uid = userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    uid = user.id;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", uid)
    .maybeSingle();

  if (!error && data) return data;

  // Fallback: SECURITY DEFINER probe (still uses the caller's JWT for auth.uid()).
  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin", {
    p_user_id: uid,
  });
  if (rpcError || !isAdmin) {
    if (error) console.warn("[admin-check] admin_users select failed:", error.message);
    return null;
  }

  // is_admin confirmed but the row read failed — return a minimal stub so routing
  // still works; admin loaders fetch the full role again server-side.
  return { user_id: uid, role: "superadmin" };
}

/**
 * Detects an abandoned "apply to vie" flow: the account was created with a
 * vie/both intent (stored in user_metadata at signup) but no candidate
 * application row exists yet.
 */
export async function hasPendingVieApplication(userId?: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (userId && user.id !== userId)) return false;

  const intent = (user.user_metadata as { signup_intent?: string } | undefined)?.signup_intent;
  if (intent !== "vie" && intent !== "both") return false;

  const { data, error } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);
  if (error) return false;
  return (data ?? []).length === 0;
}

/**
 * Where to send a user immediately after sign-in / when resuming a session.
 *
 * Priority: Admin > pending vie application > explicit ?redirect= >
 * voter dashboard > submitted candidate list > default /dashboard.
 */
export async function resolvePostLoginPath(options?: {
  redirect?: string;
  userId?: string;
}): Promise<string> {
  const admin = await getMyAdminRow(options?.userId);
  if (admin) return "/admin";
  if (await hasPendingVieApplication(options?.userId)) return "/candidates/apply";
  if (options?.redirect) return options.redirect;

  let uid = options?.userId;
  if (!uid) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return "/dashboard";

  const { data: voter } = await supabase
    .from("voters")
    .select("id")
    .eq("user_id", uid)
    .maybeSingle();
  if (voter) return "/dashboard";

  const { data: candidates } = await supabase
    .from("candidates")
    .select("id")
    .eq("user_id", uid)
    .limit(1);
  if ((candidates ?? []).length > 0) return "/candidates";

  return "/dashboard";
}
