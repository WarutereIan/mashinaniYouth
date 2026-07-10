import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, IdCard, CheckCircle2, Loader2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseVotersEnabled } from "@/lib/feature-flags";
import { registerVoter, signOutVoter, useVoter } from "@/lib/voters-source";
import {
  COUNTY_NAMES,
  constituenciesForCounty,
  isValidLocationTriple,
  wardsForConstituency,
} from "@/lib/locations";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  id: z
    .string()
    .trim()
    .regex(/^\d{6,10}$/, "National ID should be 6–10 digits"),
  county: z.string().trim().min(2, "Select your county"),
  constituency: z.string().trim().min(2, "Select your constituency"),
  ward: z.string().trim().min(2, "Select your ward"),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)?[17]\d{8}$/, "Enter a valid Kenyan phone number"),
});

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Register to vote — MY-KDM" },
      {
        name: "description",
        content: "Register on the MY-KDM electronic voter roll with your National ID.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const supabaseMode = isSupabaseVotersEnabled();
  const { voter: existing, ready } = useVoter();
  const [authChecked, setAuthChecked] = useState(!supabaseMode);
  const [form, setForm] = useState({
    name: "",
    id: "",
    county: "",
    constituency: "",
    ward: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabaseMode) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth", search: { redirect: "/register" } });
        return;
      }
      setAuthChecked(true);
    });
  }, [supabaseMode, navigate]);

  const constituencyOpts = useMemo(
    () => (form.county ? constituenciesForCounty(form.county) : []),
    [form.county],
  );
  const wardOpts = useMemo(
    () => (form.constituency ? wardsForConstituency(form.constituency) : []),
    [form.constituency],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: typeof errors = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as keyof typeof form] = issue.message;
      }
      setErrors(errs);
      return;
    }
    if (!isValidLocationTriple(parsed.data.county, parsed.data.constituency, parsed.data.ward)) {
      setErrors({
        ward: "County, constituency and ward do not match IEBC data",
      });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (supabaseMode) {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          navigate({ to: "/auth", search: { redirect: "/register" } });
          return;
        }
      }
      await registerVoter({
        name: parsed.data.name,
        id: parsed.data.id,
        county: parsed.data.county,
        constituency: parsed.data.constituency,
        ward: parsed.data.ward,
        phone: parsed.data.phone,
      });
      window.dispatchEvent(new Event("mym:voter-changed"));
      toast.success("You're on the voter roll", { description: "Your MY-KDM ballot is now open." });
      navigate({ to: "/elections" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !authChecked) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-sage/30 bg-sage/5 p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-3xl">You're already registered</h1>
            <p className="mt-2 text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{existing.name}</span> ·{" "}
              {existing.ward}, {existing.constituency}, {existing.county}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button className="bg-gradient-gold" asChild>
                <Link to="/elections">Go to ballot</Link>
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOutVoter();
                  window.dispatchEvent(new Event("mym:voter-changed"));
                  navigate({ to: "/register", replace: true });
                }}
              >
                Register a different voter
              </Button>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Voter registration</div>
          <h1 className="mt-1 font-display text-4xl md:text-5xl">Join the voter roll</h1>
          <p className="mt-4 text-muted-foreground">
            Registration takes 30 seconds. You'll need your National ID and a Kenyan phone number.
            Your county, constituency and ward decide which ballots you can cast — you can only vote
            for candidates in the area where you're registered.
          </p>
          {supabaseMode && (
            <p className="mt-3 text-sm text-muted-foreground">
              You must be signed in to register. Your National ID is hashed on the server and never
              stored in plain text.
            </p>
          )}
          <ul className="mt-8 space-y-3 text-sm">
            {[
              ["ID-verified", "Every ballot is bound to a National ID."],
              ["Location-locked", "You only see and vote in your ward, constituency and county."],
              ["End-to-end encrypted", "Your choices are encrypted before leaving your device."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-sage" />
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={submit}
          className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <IdCard className="h-4 w-4 text-primary" /> MY-KDM voter registration form
          </div>
          <div className="space-y-4">
            <Field
              label="Full name (as on your ID)"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              error={errors.name}
              placeholder="Wanjiru Kariuki"
              autoComplete="name"
            />
            <Field
              label="National ID number"
              value={form.id}
              onChange={(v) => setForm({ ...form, id: v.replace(/\D/g, "").slice(0, 10) })}
              error={errors.id}
              placeholder="e.g. 34567890"
              inputMode="numeric"
            />
            <SelectField
              label="County of registration"
              value={form.county}
              onChange={(v) => setForm({ ...form, county: v, constituency: "", ward: "" })}
              options={COUNTY_NAMES}
              placeholder="Select county"
              error={errors.county}
            />
            <SelectField
              label="Constituency"
              value={form.constituency}
              onChange={(v) => setForm({ ...form, constituency: v, ward: "" })}
              options={constituencyOpts}
              placeholder={form.county ? "Select constituency" : "Choose county first"}
              disabled={!form.county}
              error={errors.constituency}
            />
            <SelectField
              label="Ward"
              value={form.ward}
              onChange={(v) => setForm({ ...form, ward: v })}
              options={wardOpts}
              placeholder={form.constituency ? "Select ward" : "Choose constituency first"}
              disabled={!form.constituency}
              error={errors.ward}
            />
            <Field
              label="Phone number"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              error={errors.phone}
              placeholder="+254 7XX XXX XXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full bg-gradient-gold"
            disabled={submitting}
          >
            {submitting ? "Verifying…" : "Register & enter voting hall"}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            By registering you agree to the MY-KDM code of conduct.
            {!supabaseMode && " This demo stores data locally on your device only."}
          </p>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
