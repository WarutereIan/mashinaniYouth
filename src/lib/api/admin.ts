import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useSupabaseBackend } from "@/lib/feature-flags";
import type { Tier } from "@/lib/tier-meta";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdminRole = "superadmin" | "reviewer" | "viewer";

export interface AdminUser {
  userId: string;
  role: AdminRole;
  mfaEnrolled: boolean;
}

export interface AdminListedUser {
  user_id: string;
  email: string;
  role: AdminRole;
}

export interface RecountResult {
  position_id: string;
  declared_total: number;
  recounted_total: number;
  match: boolean;
  mismatched_rows: Array<{
    candidate_id: string;
    declared_votes: number;
    recounted_votes: number;
  }>;
}

export interface AuditLogEntry {
  id: number;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  before: unknown;
  after: unknown;
  created_at: string;
}

/** Redirects to /auth or /admin/mfa-required when the caller is not a fully enrolled admin. */
export async function requireAdminLoader(redirectPath: string): Promise<AdminUser> {
  const admin = await getMyAdminRole();
  if (!admin) {
    // Distinguish "not signed in" from "signed in but not admin" to avoid a
    // redirect loop between /auth (which bounces signed-in users back) and /admin.
    const { data: session } = await supabase.auth.getSession();
    if (session.session) {
      throw redirect({ to: "/admin/not-authorized" });
    }
    throw redirect({ to: "/auth", search: { redirect: redirectPath } });
  }
  if (useSupabaseBackend() && !admin.mfaEnrolled) {
    throw redirect({ to: "/admin/mfa-required", search: { redirect: redirectPath } });
  }
  return admin;
}

async function checkMfaEnrolled(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("admin_mfa_enrolled", { p_user: userId });
  if (error) throw error;
  return Boolean(data);
}

export async function getMyAdminRole(): Promise<AdminUser | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data, error } = await supabase.from("admin_users").select("user_id, role").maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let mfaEnrolled = true;
  if (useSupabaseBackend()) {
    mfaEnrolled = await checkMfaEnrolled(data.user_id);
  }

  return { userId: data.user_id, role: data.role as AdminRole, mfaEnrolled };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getMyAdminRole();
  if (!admin) throw new Error("Forbidden");
  return admin;
}

/** Server-side admin role check using the request-scoped Supabase client. */
async function requireAdminRole(
  client: SupabaseClient<Database>,
  userId: string,
  minRole?: AdminRole,
): Promise<AdminUser> {
  const { data, error } = await client
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
  const role = data.role as AdminRole;
  if (minRole === "superadmin" && role !== "superadmin") {
    throw new Error("Forbidden: superadmin access required");
  }
  return { userId: data.user_id, role, mfaEnrolled: true };
}

async function requireMfa(client: SupabaseClient<Database>, userId: string): Promise<void> {
  if (!useSupabaseBackend()) return;
  const { data, error } = await client.rpc("admin_mfa_enrolled", { p_user: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("MFA required: enroll TOTP before performing admin actions");
}

export async function listPendingCandidates() {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listSupportPledges() {
  const { data, error } = await supabase
    .from("support_pledges")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listElectionCycles() {
  const { data, error } = await supabase.from("election_cycles").select("*").order("id");
  if (error) throw error;
  return data ?? [];
}

export async function listPollWindows(cycleId: number) {
  const { data, error } = await supabase
    .from("poll_windows")
    .select("*")
    .eq("cycle_id", cycleId)
    .order("poll_date");
  if (error) throw error;
  return data ?? [];
}

export async function adminListUsers(): Promise<AdminListedUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return (data ?? []) as AdminListedUser[];
}

export async function recountPosition(positionId: string): Promise<RecountResult> {
  const { data, error } = await supabase.rpc("recount_position", {
    p_position_id: positionId,
  });
  if (error) throw error;
  return data as unknown as RecountResult;
}

export async function listRecentAudit(limit = 50): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase.rpc("recent_audit", { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as AuditLogEntry[];
}

const approveSchema = z.object({ candidateId: z.string().uuid() });

export const adminApproveCandidateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { candidateId: string }) => approveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId);
    const { data: result, error } = await supabase.rpc("admin_approve_candidate", {
      p_candidate_id: data.candidateId,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const rejectSchema = z.object({
  candidateId: z.string().uuid(),
  reason: z.string().optional(),
});

export const adminRejectCandidateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { candidateId: string; reason?: string }) => rejectSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId);
    const { data: result, error } = await supabase.rpc("admin_reject_candidate", {
      p_candidate_id: data.candidateId,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const phaseSchema = z.object({
  cycleSlug: z.string(),
  phase: z.enum(["draft", "scheduled", "open", "closed", "tallied", "cancelled"]),
});

export const adminSetCyclePhaseFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { cycleSlug: string; phase: string }) => phaseSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_set_cycle_phase", {
      p_cycle_slug: data.cycleSlug,
      p_phase: data.phase,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const grantRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["superadmin", "reviewer", "viewer"]),
});

export const adminGrantRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string; role: AdminRole }) => grantRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_grant_role", {
      p_user_id: data.userId,
      p_role: data.role,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const revokeRoleSchema = z.object({ userId: z.string().uuid() });

export const adminRevokeRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string }) => revokeRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_revoke_role", {
      p_user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const lookupEmailSchema = z.object({ email: z.string().email() });

export const adminLookupUserByEmailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { email: string }) => lookupEmailSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_lookup_user_by_email", {
      p_email: data.email,
    });
    if (error) throw new Error(error.message);
    return result as { user_id: string; email: string } | null;
  });

const pledgeStatusSchema = z.object({
  pledgeId: z.string().uuid(),
  status: z.enum(["pledged", "fulfilled", "cancelled"]),
});

export const adminSetPledgeStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { pledgeId: string; status: string }) => pledgeStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId);
    const { data: result, error } = await supabase.rpc("admin_set_pledge_status", {
      p_pledge_id: data.pledgeId,
      p_status: data.status,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const positionFieldsSchema = z.object({
  title: z.string().trim().min(2),
  tier: z.enum(["national", "county", "constituency", "ward"]),
  scope: z.string().trim().min(2),
  county: z.string().optional(),
  constituency: z.string().optional(),
  ward: z.string().optional(),
  description: z.string().optional(),
  cycleSlug: z.string().optional(),
});

export const adminCreatePositionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: z.infer<typeof positionFieldsSchema>) => positionFieldsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_create_position", {
      p_title: data.title,
      p_tier: data.tier as Tier,
      p_scope: data.scope,
      p_county: data.county,
      p_constituency: data.constituency,
      p_ward: data.ward,
      p_description: data.description ?? "",
      p_cycle_slug: data.cycleSlug ?? "mykdm-2026",
    });
    if (error) throw new Error(error.message);
    return result;
  });

const updatePositionSchema = positionFieldsSchema.extend({
  id: z.string().min(1),
});

export const adminUpdatePositionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: z.infer<typeof updatePositionSchema>) => updatePositionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_update_position", {
      p_id: data.id,
      p_title: data.title,
      p_tier: data.tier as Tier,
      p_scope: data.scope,
      p_county: data.county,
      p_constituency: data.constituency,
      p_ward: data.ward,
      p_description: data.description,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const deletePositionSchema = z.object({ id: z.string().min(1) });

export const adminDeletePositionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => deletePositionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_delete_position", {
      p_id: data.id,
    });
    if (error) throw new Error(error.message);
    return result;
  });

const unsealSchema = z.object({ cycleSlug: z.string() });

export const adminUnsealCycleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { cycleSlug: string }) => unsealSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMfa(supabase, userId);
    await requireAdminRole(supabase, userId, "superadmin");
    const { data: result, error } = await supabase.rpc("admin_unseal_cycle", {
      p_cycle_slug: data.cycleSlug,
    });
    if (error) throw new Error(error.message);
    return result;
  });

export async function adminDashboardStats() {
  const [voters, candidates, votes, pledges] = await Promise.all([
    supabase.rpc("count_registered_voters"),
    supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase
      .from("support_pledges")
      .select("*", { count: "exact", head: true })
      .eq("status", "pledged"),
  ]);
  const errors = [voters.error, candidates.error, votes.error, pledges.error].filter(Boolean);
  if (errors.length > 0) {
    console.error("adminDashboardStats partial errors:", errors);
  }
  return {
    registeredVoters: Number(voters.data ?? 0),
    pendingCandidates: candidates.count ?? 0,
    votesCast: votes.count ?? 0,
    openPledges: pledges.count ?? 0,
    hasErrors: errors.length > 0,
  };
}
