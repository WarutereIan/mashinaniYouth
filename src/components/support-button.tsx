import { useState, type ReactNode } from "react";
import { Heart, HandCoins, Handshake, Sparkles, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_URL } from "@/lib/support";
import { useSupabaseSupport } from "@/lib/feature-flags";
import { submitPledge } from "@/lib/api/support";

const AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

type Mode = "donate" | "partner" | "other";

export function SupportButton({
  children,
  className,
  variant = "default",
  size = "sm",
  asChildContent,
}: {
  children?: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
  asChildContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("donate");
  const [amount, setAmount] = useState<number>(1000);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const supabaseSupport = useSupabaseSupport();

  const chosen = custom ? Number(custom) || 0 : amount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (supabaseSupport) {
      setSubmitting(true);
      try {
        await submitPledge({
          kind: mode,
          amountKes: mode === "donate" ? chosen || undefined : undefined,
          fullName: name,
          phone: phone || undefined,
          email: email || undefined,
          message: message || undefined,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not submit pledge";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    setSubmitted(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSubmitted(false);
      }}
    >
      <DialogTrigger asChild>
        {asChildContent ?? (
          <Button variant={variant} size={size} className={className}>
            <Heart className="mr-1.5 h-3.5 w-3.5" /> {children ?? "Support"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Support MY-KDM</DialogTitle>
          <DialogDescription>
            Fuel a nationwide, elected youth movement. Every shilling and every partner counts.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-sm">
            <div className="font-display text-lg text-ink">Asante sana!</div>
            <p className="mt-1 text-muted-foreground">
              We've received your intent to{" "}
              {mode === "donate"
                ? `contribute KES ${chosen.toLocaleString()}`
                : mode === "partner"
                  ? "partner with MY-KDM"
                  : "support the movement"}
              . Our team will reach out on {phone || email || "the contact you shared"}.
            </p>
            {mode === "donate" && (
              <Button asChild className="mt-4 w-full bg-gradient-gold">
                <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                  Complete payment on M-Taji <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "donate", label: "Donate", Icon: HandCoins },
                  { id: "partner", label: "Partner", Icon: Handshake },
                  { id: "other", label: "Other", Icon: Sparkles },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition ${
                    mode === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {mode === "donate" && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Suggested amounts (KES)
                </Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAmount(a);
                        setCustom("");
                      }}
                      className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                        !custom && amount === a
                          ? "border-primary bg-gradient-gold text-primary-foreground"
                          : "border-border bg-card text-ink hover:border-primary/40"
                      }`}
                    >
                      {a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Label htmlFor="custom" className="text-xs text-muted-foreground">
                    Or enter a custom amount
                  </Label>
                  <Input
                    id="custom"
                    inputMode="numeric"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 15000"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-xs">
                  Full name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">
                  Phone (M-Pesa)
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07…"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            {mode !== "donate" && (
              <div>
                <Label htmlFor="message" className="text-xs">
                  {mode === "partner"
                    ? "How would you like to partner?"
                    : "How would you like to support?"}
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1"
                  placeholder={
                    mode === "partner"
                      ? "e.g. corporate sponsorship, in-kind, media…"
                      : "e.g. volunteer, mentor, share the movement…"
                  }
                />
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-flag-red/40 bg-flag-red/10 px-3 py-2 text-xs text-flag-red">
                {submitError}
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-gold"
              disabled={submitting}
            >
              {mode === "donate"
                ? submitting
                  ? "Submitting contribution..."
                  : `Contribute KES ${(chosen || 0).toLocaleString()}`
                : mode === "partner"
                  ? submitting
                    ? "Sending partnership request..."
                    : "Send partnership request"
                  : submitting
                    ? "Sending support pledge..."
                    : "Send support pledge"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
