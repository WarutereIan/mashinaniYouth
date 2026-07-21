import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const submitSchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  national_id: z.string().trim().min(5).max(20),
  iebc_voter_number: z.string().trim().min(5).max(30).optional().or(z.literal("")),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  tier: z.enum(["national", "county", "constituency", "ward"]),
  position_id: z.string().min(1),
  position_title: z.string().trim().min(3).max(120),
  county: z.string().trim().min(2).max(60),
  constituency: z.string().trim().max(80).optional().or(z.literal("")),
  ward: z.string().trim().max(80).optional().or(z.literal("")),
  party: z.string().trim().max(120).optional().or(z.literal("")),
  slogan: z.string().trim().max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type SubmitCandidateInput = z.infer<typeof submitSchema>;

function candidateDuplicateMessage(err: {
  code?: string;
  constraint?: string;
  message?: string;
}): string {
  if (err.code !== "23505") return err.message ?? "Application failed";
  switch (err.constraint) {
    case "candidates_national_id_key":
      return "This National ID is already registered as a candidate";
    case "candidates_phone_key":
      return "This phone number is already registered to an account";
    case "candidates_full_name_ci_key":
      return "This name is already registered to an account";
    default:
      return "This detail is already registered to an account";
  }
}

export const submitCandidateFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: SubmitCandidateInput) => submitSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: positionRow, error: posErr } = await supabase
      .from("positions")
      .select("*")
      .eq("id", data.position_id)
      .maybeSingle();
    if (posErr) throw new Error(posErr.message);
    const position = positionRow as {
      id: string;
      tier: string;
      title: string;
      county: string | null;
      constituency: string | null;
      ward: string | null;
      election_cycle_id: number;
      applications_open?: boolean;
    } | null;
    if (!position) throw new Error("Selected position not found");
    if (position.tier !== data.tier) {
      throw new Error("Position tier does not match your selection");
    }
    if (!position.applications_open) {
      throw new Error("Applications are not open for this position");
    }

    const { data: cycle, error: cycleErr } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("slug", "mykdm-2026")
      .maybeSingle();
    if (cycleErr) throw new Error(cycleErr.message);

    const { data: row, error } = await supabase
      .from("candidates")
      .insert({
        full_name: data.full_name,
        national_id: data.national_id,
        iebc_voter_number: data.iebc_voter_number || null,
        phone: data.phone,
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        tier: data.tier,
        position_id: data.position_id,
        position_title: position.title,
        election_cycle_id: cycle?.id ?? position.election_cycle_id,
        county: data.county,
        constituency: data.constituency || null,
        ward: data.ward || null,
        party: data.party || null,
        slogan: data.slogan || null,
        bio: data.bio || null,
        user_id: userId,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(candidateDuplicateMessage(error));
      }
      throw new Error(error.message);
    }

    return row;
  });
