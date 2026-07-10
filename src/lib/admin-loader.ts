import { redirect } from "@tanstack/react-router";
import { getMyAdminRole, requireAdminLoader } from "@/lib/api/admin";

export async function adminRouteLoader(redirectPath: string) {
  const admin = await requireAdminLoader(redirectPath);
  return { admin };
}

export async function superadminRouteLoader(redirectPath: string) {
  const admin = await requireAdminLoader(redirectPath);
  if (admin.role !== "superadmin") {
    throw redirect({ to: "/admin" });
  }
  return { admin };
}

/** For /admin/mfa-required — admin role required, MFA check skipped. */
export async function adminRouteLoaderSkipMfa(redirectPath: string) {
  const admin = await getMyAdminRole();
  if (!admin) {
    throw redirect({ to: "/auth", search: { redirect: redirectPath } });
  }
  return { admin };
}
