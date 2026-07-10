import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface AdminMfaEnrollProps {
  onEnrolled?: () => void;
}

export function AdminMfaEnroll({ onEnrolled }: AdminMfaEnrollProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start MFA enrollment");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnroll = async () => {
    if (!factorId || code.length !== 6) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      setEnrolled(true);
      toast.success("Two-factor authentication enabled");
      onEnrolled?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid verification code");
    } finally {
      setVerifying(false);
    }
  };

  if (enrolled) {
    return (
      <div className="rounded-xl border border-sage/40 bg-sage/5 p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-sage" />
        <p className="mt-3 font-medium text-foreground">MFA is active on your account</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Save your authenticator backup codes in a secure location. You will need your app to
          perform admin actions.
        </p>
      </div>
    );
  }

  if (!factorId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Admin actions require a TOTP authenticator app (Google Authenticator, Authy, 1Password,
          etc.). Scan the QR code on the next step and enter a verification code.
        </p>
        <Button onClick={() => void startEnroll()} disabled={enrolling}>
          {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Set up authenticator
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {qrCode && (
          <div
            className="rounded-lg border border-border bg-white p-3"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
        )}
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Scan the QR code with your authenticator app, or enter this secret manually:
          </p>
          {secret && (
            <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">{secret}</code>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mfa-code">Enter the 6-digit code from your app</Label>
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Input
          id="mfa-code"
          className="sr-only"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          autoComplete="one-time-code"
        />
      </div>

      <Button
        onClick={() => void verifyEnroll()}
        disabled={verifying || code.length !== 6}
        className="bg-gradient-gold"
      >
        {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Verify and enable MFA
      </Button>
    </div>
  );
}
