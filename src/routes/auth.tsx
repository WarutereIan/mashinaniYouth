import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, IdCard, Loader2, LogIn, UserCheck, UserPlus, Vote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSupabaseVoters } from "@/lib/feature-flags";
import { registerVoter } from "@/lib/voters-source";
import {
  COUNTY_NAMES,
  constituenciesForCounty,
  isValidLocationTriple,
  wardsForConstituency,
} from "@/lib/locations";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or sign up — MY-KDM" },
      {
        name: "description",
        content: "Sign up or log in to your MY-KDM account to vote, vie, and track results.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Intent = "vote" | "vie" | "both";

const voterSchema = z.object({
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

function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; status?: number; message?: string } | undefined;
  const code = e?.code;
  const status = e?.status;
  if (code === "invalid_credentials")
    return "Incorrect email or password. Double-check your details and try again.";
  if (code === "email_not_confirmed")
    return "Your email isn't confirmed yet. Check your inbox for a confirmation link.";
  if (code === "user_already_exists" || code === "email_exists")
    return "An account with this email already exists. Try logging in instead.";
  if (code === "over_request_rate_limit" || code === "rate_limit_exceeded")
    return "Too many attempts. Wait a moment, then try again.";
  if (code === "weak_password")
    return "That password is too weak. Use at least 8 characters with a mix of letters, numbers and symbols.";
  if (status === 0 || (typeof navigator !== "undefined" && !navigator.onLine))
    return "Network error — check your connection and retry.";
  return e?.message ?? "Something went wrong. Please try again.";
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const supabaseVoters = useSupabaseVoters();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<Intent>("vote");
  const [voter, setVoter] = useState({ id: "", county: "", constituency: "", ward: "", phone: "" });
  const [voterErrors, setVoterErrors] = useState<Partial<Record<keyof typeof voter, string>>>({});
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const wantsVoter = intent === "vote" || intent === "both";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect ?? "/dashboard" });
    });
  }, [navigate, redirect]);

  const afterAuth = () => redirect ?? "/dashboard";

  const constituencyOpts = useMemo(
    () => (voter.county ? constituenciesForCounty(voter.county) : []),
    [voter.county],
  );
  const wardOpts = useMemo(
    () => (voter.constituency ? wardsForConstituency(voter.constituency) : []),
    [voter.constituency],
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(authErrorMessage(error));
    toast.success("Welcome back!");
    navigate({ to: afterAuth() });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setConfirmTouched(true);
      return toast.error("Passwords do not match.");
    }
    let parsedVoter: z.infer<typeof voterSchema> | null = null;
    if (wantsVoter) {
      const parsed = voterSchema.safeParse(voter);
      if (!parsed.success) {
        const errs: typeof voterErrors = {};
        for (const issue of parsed.error.issues) {
          errs[issue.path[0] as keyof typeof voter] = issue.message;
        }
        setVoterErrors(errs);
        return;
      }
      if (!isValidLocationTriple(parsed.data.county, parsed.data.constituency, parsed.data.ward)) {
        setVoterErrors({ ward: "County, constituency and ward do not match IEBC data" });
        return;
      }
      setVoterErrors({});
      parsedVoter = parsed.data;
    }

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    if (error) {
      setBusy(false);
      return toast.error(authErrorMessage(error));
    }

    if (wantsVoter && parsedVoter) {
      try {
        await registerVoter({
          name,
          id: parsedVoter.id,
          county: parsedVoter.county,
          constituency: parsedVoter.constituency,
          ward: parsedVoter.ward,
          phone: parsedVoter.phone,
        });
        window.dispatchEvent(new Event("mym:voter-changed"));
      } catch (err) {
        setBusy(false);
        return toast.error(err instanceof Error ? err.message : "Voter registration failed.");
      }
    }

    setBusy(false);
    if (intent === "vie") {
      toast.success("Account created — apply to vie next.");
      navigate({ to: "/candidates/apply" });
    } else {
      toast.success(
        wantsVoter
          ? "You're on the voter roll — your ballot is open."
          : "Account created — you're signed in.",
      );
      navigate({ to: redirect ?? "/elections" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="text-center">
          <span className="grid mx-auto h-12 w-12 place-items-center rounded-xl bg-gradient-gold text-primary-foreground shadow-sm">
            <Vote className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <h1 className="mt-4 font-display text-3xl">
            <span className="text-ink">Your MY-KDM</span>{" "}
            <span className="text-gradient-gold">account</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up or log in to vote, vie and track live results.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="li-email">Email</Label>
                  <Input
                    id="li-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="li-pass">Password</Label>
                  <div className="relative">
                    <Input
                      id="li-pass"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-gold" disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4" />
                  )}
                  Log in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input
                    id="su-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wanjiru Kariuki"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <div className="relative">
                    <Input
                      id="su-pass"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="su-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmTouched(true);
                      }}
                      className={cn(
                        "pr-10",
                        confirmTouched &&
                          !passwordsMatch &&
                          "border-flag-red focus-visible:ring-flag-red",
                      )}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-0 top-0 grid h-9 w-9 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmTouched && !passwordsMatch && (
                    <p className="text-xs text-flag-red">Passwords do not match.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>I want to…</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "vote", label: "Vote", icon: Vote },
                        { id: "vie", label: "Vie", icon: UserCheck },
                        { id: "both", label: "Both", icon: UserPlus },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setIntent(opt.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                          intent === opt.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {wantsVoter && (
                  <div className="space-y-4 rounded-lg border border-border/70 bg-muted/30 p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <IdCard className="h-4 w-4 text-primary" /> Voter roll details
                    </div>
                    <Field
                      label="National ID number"
                      value={voter.id}
                      onChange={(v) =>
                        setVoter({ ...voter, id: v.replace(/\D/g, "").slice(0, 10) })
                      }
                      error={voterErrors.id}
                      placeholder="e.g. 34567890"
                      inputMode="numeric"
                    />
                    <SelectField
                      label="County"
                      value={voter.county}
                      onChange={(v) =>
                        setVoter({ ...voter, county: v, constituency: "", ward: "" })
                      }
                      options={COUNTY_NAMES}
                      placeholder="Select county"
                      error={voterErrors.county}
                    />
                    <SelectField
                      label="Constituency"
                      value={voter.constituency}
                      onChange={(v) => setVoter({ ...voter, constituency: v, ward: "" })}
                      options={constituencyOpts}
                      placeholder={voter.county ? "Select constituency" : "Choose county first"}
                      disabled={!voter.county}
                      error={voterErrors.constituency}
                    />
                    <SelectField
                      label="Ward"
                      value={voter.ward}
                      onChange={(v) => setVoter({ ...voter, ward: v })}
                      options={wardOpts}
                      placeholder={voter.constituency ? "Select ward" : "Choose constituency first"}
                      disabled={!voter.constituency}
                      error={voterErrors.ward}
                    />
                    <Field
                      label="Phone number"
                      value={voter.phone}
                      onChange={(v) => setVoter({ ...voter, phone: v })}
                      error={voterErrors.phone}
                      placeholder="+254 7XX XXX XXX"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-gold"
                  disabled={busy || (confirmTouched && !passwordsMatch)}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {intent === "vie" ? "Create account & apply to vie" : "Create account"}
                </Button>
                {supabaseVoters && wantsVoter && (
                  <p className="text-center text-xs text-muted-foreground">
                    Your National ID is hashed on the server and never stored in plain text.
                  </p>
                )}
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to MY-KDM's community rules.{" "}
            <Link to="/" className="text-primary hover:underline">
              Back home
            </Link>
          </p>
        </div>
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
