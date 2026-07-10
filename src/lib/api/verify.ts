import { supabase } from "@/integrations/supabase/client";

export interface CertificateVerification {
  valid: boolean;
  certificateNumber?: string;
  fullName?: string;
  positionTitle?: string;
  scope?: string;
  county?: string;
  certifiedAt?: string;
  status?: string;
}

export interface ReceiptVerification {
  valid: boolean;
  receiptCode?: string;
  positionTitle?: string;
  positionScope?: string;
  candidateName?: string;
  castAt?: string;
}

export async function verifyCertificate(
  certificateNumber: string,
): Promise<CertificateVerification> {
  const { data, error } = await supabase.rpc("verify_certificate", {
    p_certificate_number: certificateNumber,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  if (!row?.valid) return { valid: false };
  return {
    valid: true,
    certificateNumber: row.certificate_number as string,
    fullName: row.full_name as string,
    positionTitle: row.position_title as string,
    scope: row.scope as string,
    county: row.county as string,
    certifiedAt: row.certified_at as string,
    status: row.status as string,
  };
}

export async function verifyReceipt(receiptCode: string): Promise<ReceiptVerification> {
  const { data, error } = await supabase.rpc("verify_receipt", {
    p_receipt_code: receiptCode,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  if (!row?.valid) return { valid: false };
  return {
    valid: true,
    receiptCode: row.receipt_code as string,
    positionTitle: row.position_title as string,
    positionScope: row.position_scope as string,
    candidateName: row.candidate_name as string,
    castAt: row.cast_at as string,
  };
}
