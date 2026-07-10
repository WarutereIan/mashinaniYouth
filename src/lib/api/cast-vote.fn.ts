import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const castVoteSchema = z.object({
  positionId: z.string().min(1),
  candidateId: z.string().uuid(),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;

export interface CastVoteResult {
  receiptCode: string;
  castAt: string;
  positionId: string;
  candidateId: string;
}

export const castVoteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: CastVoteInput) => castVoteSchema.parse(data))
  .handler(async ({ data, context }): Promise<CastVoteResult> => {
    const { supabase } = context;

    const { data: result, error } = await supabase.rpc("cast_vote", {
      p_position_id: data.positionId,
      p_candidate_id: data.candidateId,
    });

    if (error) throw new Error(error.message);

    const row = result as {
      receipt_code: string;
      cast_at: string;
      position_id: string;
      candidate_id: string;
    };

    return {
      receiptCode: row.receipt_code,
      castAt: row.cast_at,
      positionId: row.position_id,
      candidateId: row.candidate_id,
    };
  });
