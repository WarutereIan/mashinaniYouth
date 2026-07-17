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

/** Where to send a user immediately after sign-in. Admins always go to /admin. */
export async function resolvePostLoginPath(options?: {
  redirect?: string;
  userId?: string;
}): Promise<string> {
  const admin = await getMyAdminRow(options?.userId);
  if (admin) return "/admin";
  return options?.redirect ?? "/dashboard";
}
