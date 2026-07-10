import {
  submitPledgeFn,
  type SubmitPledgeInput,
  type SubmitPledgeResult,
} from "@/lib/api/submit-pledge.fn";

export type { SubmitPledgeInput, SubmitPledgeResult };

export async function submitPledge(input: SubmitPledgeInput): Promise<SubmitPledgeResult> {
  return submitPledgeFn({ data: input });
}
