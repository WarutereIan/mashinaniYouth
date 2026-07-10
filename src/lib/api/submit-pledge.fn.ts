import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const pledgeSchema = z.object({
  kind: z.enum(["donate", "partner", "other"]),
  amountKes: z.number().int().positive().optional(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  message: z.string().trim().max(2000).optional(),
});

export type SubmitPledgeInput = z.infer<typeof pledgeSchema>;

export interface SubmitPledgeResult {
  id: string;
}

function anonSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient<Database>(url, key);
}

export const submitPledgeFn = createServerFn({ method: "POST" })
  .validator((data: SubmitPledgeInput) => pledgeSchema.parse(data))
  .handler(async ({ data }): Promise<SubmitPledgeResult> => {
    if (!data.phone && !data.email) {
      throw new Error("Phone or email is required");
    }

    const supabase = anonSupabase();
    const { data: row, error } = await supabase
      .from("support_pledges")
      .insert({
        kind: data.kind,
        amount_kes: data.amountKes ?? null,
        full_name: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        message: data.message ?? null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id };
  });
