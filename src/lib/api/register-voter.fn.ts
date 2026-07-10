import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  id: z
    .string()
    .trim()
    .regex(/^\d{6,10}$/),
  county: z.string().trim().min(2).max(60),
  constituency: z.string().trim().min(2).max(80),
  ward: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)?[17]\d{8}$/),
});

export type RegisterVoterInput = z.infer<typeof registerInputSchema>;

export interface RegisteredVoter {
  id: string;
  userId: string;
  name: string;
  county: string;
  constituency: string;
  ward: string;
  phone: string;
  nationalIdLast4: string;
  registeredAt: string;
}

function nationalIdPepper(): string {
  const pepper = process.env.NATIONAL_ID_PEPPER;
  if (pepper) return pepper;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NATIONAL_ID_PEPPER is required in production");
  }
  return "dev-only-pepper-change-me";
}

function hashNationalId(nationalId: string): string {
  return createHash("sha256").update(`${nationalIdPepper()}:${nationalId}`).digest("hex");
}

function normalizePhone(phone: string): string {
  const p = phone.trim().replace(/\s/g, "");
  if (p.startsWith("+254")) return p;
  if (p.startsWith("254")) return `+${p}`;
  if (p.startsWith("0")) return `+254${p.slice(1)}`;
  return `+254${p}`;
}

export const registerVoterFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: RegisterVoterInput) => registerInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<RegisteredVoter> => {
    const { supabase, userId } = context;

    const nationalIdHash = hashNationalId(data.id);
    const nationalIdLast4 = data.id.slice(-4);
    const phone = normalizePhone(data.phone);

    const { data: existing, error: existingErr } = await supabase
      .from("voters")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingErr) throw new Error(existingErr.message);

    const voterPayload = {
      user_id: userId,
      national_id_hash: nationalIdHash,
      national_id_last4: nationalIdLast4,
      full_name: data.name,
      county: data.county,
      constituency: data.constituency,
      ward: data.ward,
      phone,
    };

    let row: {
      id: string;
      user_id: string;
      full_name: string;
      county: string;
      constituency: string;
      ward: string;
      phone: string;
      national_id_last4: string;
      registered_at: string;
    };

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from("voters")
        .update(voterPayload)
        .eq("user_id", userId)
        .select(
          "id, user_id, full_name, county, constituency, ward, phone, national_id_last4, registered_at",
        )
        .single();
      if (updateErr) {
        if (updateErr.code === "23505") {
          throw new Error("This National ID is already registered on the voter roll");
        }
        throw new Error(updateErr.message);
      }
      row = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("voters")
        .insert(voterPayload)
        .select(
          "id, user_id, full_name, county, constituency, ward, phone, national_id_last4, registered_at",
        )
        .single();
      if (insertErr) {
        if (insertErr.code === "23505") {
          throw new Error("This National ID is already registered on the voter roll");
        }
        throw new Error(insertErr.message);
      }
      row = inserted;
    }

    await supabase.from("profiles").update({ full_name: data.name, phone }).eq("id", userId);

    return {
      id: row.id,
      userId: row.user_id,
      name: row.full_name,
      county: row.county,
      constituency: row.constituency,
      ward: row.ward,
      phone: row.phone,
      nationalIdLast4: row.national_id_last4,
      registeredAt: row.registered_at,
    };
  });
