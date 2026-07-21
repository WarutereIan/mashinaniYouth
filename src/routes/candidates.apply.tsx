import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitCandidate, type CandidateTier } from "@/lib/candidates";
import { supabase } from "@/integrations/supabase/client";
import { listPositions } from "@/lib/api/positions";
import { isSupabaseBackendEnabled } from "@/lib/feature-flags";
import { uploadCandidatePhoto, setCandidatePhotoPath } from "@/lib/api/candidate-photos";
import type { Position } from "@/lib/tier-meta";
import {
  COUNTY_NAMES,
  constituenciesForCounty,
  validateLocationForTier,
  wardsForConstituency,
} from "@/lib/locations";

export const Route = createFileRoute("/candidates/apply")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply to vie — MY-KDM Vote" },
      {
        name: "description",
        content:
          "Apply to vie for a Mashinani Youth Kazi Delivery Movement seat. Submit your National ID to receive your electronic certificate.",
      },
    ],
  }),
  component: ApplyPage,
});

const applicationSchema = z.object({
  full_name: z.string().trim().min(3, "Full name is required").max(120),
  national_id: z
    .string()
    .trim()
    .min(5, "Kenyan National ID number is required")
    .max(20)
    .regex(/^[0-9A-Za-z-]+$/, "Only letters, numbers and dashes allowed"),
  iebc_voter_number: z
    .string()
    .trim()
    .min(5, "IEBC number is at least 5 characters")
    .max(30)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[+0-9\s-]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  tier: z.enum(["national", "county", "constituency", "ward"]),
  position_id: z.string().min(1, "Select a position"),
  position_title: z.string().trim().min(3).max(120),
  county: z.string().trim().min(2).max(60),
  constituency: z.string().trim().max(60).optional().or(z.literal("")),
  ward: z.string().trim().max(60).optional().or(z.literal("")),
  party: z.string().trim().max(120).optional().or(z.literal("")),
  slogan: z.string().trim().max(140).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
});

function ApplyPage() {
  const navigate = useNavigate();
  const supabaseBackend = isSupabaseBackendEnabled();
  const [tier, setTier] = useState<CandidateTier>("county");
  const [county, setCounty] = useState<string>("");
  const [constituency, setConstituency] = useState<string>("");
  const [ward, setWard] = useState<string>("");
  const [positionId, setPositionId] = useState<string>("");
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [positionsLoaded, setPositionsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // Identity captured at signup (name / National ID / phone). Prefilled from the
  // signup flow (sessionStorage) or, failing that, the auth user + voter record,
  // so we never ask the contestant for these twice.
  const [identity, setIdentity] = useState<{
    fullName: string;
    nationalId: string;
    phone: string;
    email: string;
  }>({ fullName: "", nationalId: "", phone: "", email: "" });
  const [identityLoaded, setIdentityLoaded] = useState(false);

  useEffect(() => {
    if (!supabaseBackend) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/candidates/apply" } });
    });
    listPositions({ cycleSlug: "mykdm-2026", applicationsOpen: true })
      .then((rows) => {
        setAllPositions(rows);
        setPositionsLoaded(true);
      })
      .catch(() => {
        setAllPositions([]);
        setPositionsLoaded(true);
      });
  }, [supabaseBackend, navigate]);

  useEffect(() => {
    if (!supabaseBackend) return;
    let cancelled = false;

    async function loadIdentity() {
      let next = { fullName: "", nationalId: "", phone: "", email: "" };

      // 1. Identity forwarded straight from the signup flow (same session).
      try {
        const raw = sessionStorage.getItem("mym:signup-identity");
        if (raw) {
          const parsed = JSON.parse(raw) as {
            fullName?: string;
            nationalId?: string;
            phone?: string;
          };
          next = {
            fullName: parsed.fullName ?? "",
            nationalId: parsed.nationalId ?? "",
            phone: parsed.phone ?? "",
            email: "",
          };
          sessionStorage.removeItem("mym:signup-identity");
        }
      } catch {
        // ignore
      }

      // 2. Fall back to the auth account (metadata + email) then the voter
      //    record for anything still missing. Metadata is set at signup so
      //    National ID / phone survive a refresh.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled && user) {
          const meta = (user.user_metadata ?? {}) as {
            full_name?: string;
            national_id?: string;
            phone?: string;
          };
          if (!next.fullName) next.fullName = meta.full_name ?? "";
          if (!next.nationalId) next.nationalId = meta.national_id ?? "";
          if (!next.phone) next.phone = meta.phone ?? "";
          // Email always comes from the authenticated account.
          next.email = user.email ?? "";
          if (!next.phone || !next.fullName) {
            const { data: voter } = await supabase
              .from("voters")
              .select("phone, full_name")
              .eq("user_id", user.id)
              .maybeSingle();
            if (voter) {
              if (!next.phone) next.phone = voter.phone ?? "";
              if (!next.fullName) next.fullName = next.fullName || voter.full_name || "";
            }
          }
        }
      } catch {
        // ignore — fields will just be shown as inputs
      }

      if (!cancelled) {
        setIdentity(next);
        setIdentityLoaded(true);
      }
    }

    loadIdentity();
    return () => {
      cancelled = true;
    };
  }, [supabaseBackend]);

  const constituencyOptions = useMemo(() => constituenciesForCounty(county), [county]);
  const wardOptions = useMemo(() => wardsForConstituency(constituency), [constituency]);

  const positionOptions = useMemo(() => {
    return allPositions.filter((p) => {
      if (p.tier !== tier) return false;
      if (tier === "national") return true;
      if (!county || p.county !== county) return false;
      if (tier === "county") return true;
      if (!constituency || p.constituency !== constituency) return false;
      if (tier === "constituency") return true;
      return !!ward && p.ward === ward;
    });
  }, [allPositions, tier, county, constituency, ward]);

  useEffect(() => {
    if (!positionOptions.some((p) => p.id === positionId)) {
      setPositionId(positionOptions[0]?.id ?? "");
    }
  }, [positionOptions, positionId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      full_name: identity.fullName || String(fd.get("full_name") ?? ""),
      national_id: identity.nationalId || String(fd.get("national_id") ?? ""),
      iebc_voter_number: String(fd.get("iebc_voter_number") ?? ""),
      phone: identity.phone || String(fd.get("phone") ?? ""),
      email: identity.email || String(fd.get("email") ?? ""),
      date_of_birth: String(fd.get("date_of_birth") ?? ""),
      gender: String(fd.get("gender") ?? ""),
      tier,
      position_id: positionId,
      position_title: String(
        fd.get("position_title") ?? positionOptions.find((p) => p.id === positionId)?.title ?? "",
      ),
      county,
      constituency,
      ward,
      party: String(fd.get("party") ?? ""),
      slogan: String(fd.get("slogan") ?? ""),
      bio: String(fd.get("bio") ?? ""),
    };

    const parsed = applicationSchema.safeParse(raw);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path.join(".")] = issue.message;
      }
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const locationError = validateLocationForTier(
      tier,
      parsed.data.county,
      parsed.data.constituency,
      parsed.data.ward,
    );
    if (locationError) {
      const field = tier === "ward" ? "ward" : tier === "constituency" ? "constituency" : "county";
      setErrors({ [field]: locationError });
      return;
    }
    if (!parsed.data.position_id) {
      setErrors({ position_id: "Select a ballot position" });
      return;
    }

    const selectedPosition = positionOptions.find((p) => p.id === parsed.data.position_id);
    if (!selectedPosition) {
      setErrors({ position_id: "Selected position is not available for this location" });
      return;
    }

    setSubmitting(true);
    try {
      const candidate = await submitCandidate({
        full_name: parsed.data.full_name,
        national_id: parsed.data.national_id,
        iebc_voter_number: parsed.data.iebc_voter_number ?? "",
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        date_of_birth: parsed.data.date_of_birth || null,
        gender: parsed.data.gender || null,
        tier: parsed.data.tier,
        position_id: parsed.data.position_id,
        position_title: selectedPosition.title,
        county: parsed.data.county,
        constituency: parsed.data.constituency || null,
        ward: parsed.data.ward || null,
        party: parsed.data.party || null,
        slogan: parsed.data.slogan || null,
        bio: parsed.data.bio || null,
        photo_path: null,
      });
      toast.success(
        supabaseBackend
          ? "Application submitted — pending directorate review"
          : "Application approved — certificate issued!",
      );
      if (supabaseBackend && photoFile) {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const photoPath = await uploadCandidatePhoto(user.user.id, candidate.id, photoFile);
            await setCandidatePhotoPath(candidate.id, photoPath);
          }
        } catch (uploadErr) {
          console.warn("[apply] photo upload failed:", uploadErr);
          toast.error("Saved application, but the photo failed to upload. You can retry later.");
        }
      }
      if (supabaseBackend && candidate.status === "pending") {
        navigate({ to: "/candidates" });
        return;
      }
      navigate({
        to: "/candidates/$candidateId/certificate",
        params: { candidateId: candidate.id },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit application";
      if (/duplicate|unique/i.test(msg)) {
        toast.error("This National ID is already registered as a candidate.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            to="/candidates"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All candidates
          </Link>
          <div className="text-xs uppercase tracking-widest text-primary">Candidate sign-up</div>
          <h1 className="mt-1 font-display text-4xl">
            <span className="text-ink">Apply</span>{" "}
            <span className="text-gradient-gold">to vie</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Submit your details below. We verify your National ID, then issue you a tamper-proof
            electronic certificate to appear on the ballot.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Identity */}
          <Fieldset title="Your details" icon={ShieldCheck}>
            {!identityLoaded ? (
              <p className="text-sm text-muted-foreground">Loading your details…</p>
            ) : (
              <>
                {(identity.fullName ||
                  identity.nationalId ||
                  identity.phone ||
                  identity.email) && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm">
                    <div className="font-medium text-primary">From your sign-up</div>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                      {identity.fullName && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Name</dt>
                          <dd className="font-medium">{identity.fullName}</dd>
                        </div>
                      )}
                      {identity.nationalId && (
                        <div>
                          <dt className="text-xs text-muted-foreground">National ID</dt>
                          <dd className="font-medium">{identity.nationalId}</dd>
                        </div>
                      )}
                      {identity.phone && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Phone</dt>
                          <dd className="font-medium">{identity.phone}</dd>
                        </div>
                      )}
                      {identity.email && (
                        <div>
                          <dt className="text-xs text-muted-foreground">Email</dt>
                          <dd className="font-medium">{identity.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {!identity.fullName && (
                  <Field
                    label="Full name (as on ID)"
                    name="full_name"
                    placeholder="e.g. Wanjiru Kariuki"
                    error={errors["full_name"]}
                    required
                  />
                )}
                {!identity.nationalId && (
                  <Field
                    label="Kenyan National ID number"
                    name="national_id"
                    placeholder="e.g. 31245678"
                    error={errors["national_id"]}
                    required
                  />
                )}
                {!identity.phone && (
                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    error={errors["phone"]}
                    required
                  />
                )}

                <Field
                  label="IEBC voter registration number (optional)"
                  name="iebc_voter_number"
                  placeholder="e.g. IEBC-047-000123"
                  error={errors["iebc_voter_number"]}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {!identity.email && (
                    <Field
                      label="Email (optional)"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      error={errors["email"]}
                    />
                  )}
                  <Field
                    label="Date of birth (optional)"
                    name="date_of_birth"
                    type="date"
                    error={errors["date_of_birth"]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender (optional)</Label>
                  <Select name="gender">
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="photo">Profile photo (optional)</Label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP up to 5 MB. Shown on the ballot once approved.
                  </p>
                </div>
              </>
            )}
          </Fieldset>

          {/* Seat */}
          <Fieldset title="Seat you're vying for" icon={UserPlus}>
            {positionsLoaded && allPositions.length === 0 ? (
              <div className="rounded-lg border border-flag-red/40 bg-flag-red/10 p-4 text-sm">
                <div className="font-semibold text-flag-red">
                  Nominations are not open for any position right now
                </div>
                <p className="mt-1 text-muted-foreground">
                  The directorate opens candidate applications per seat. Please check back once a
                  position is open, or contact the MY-KDM secretariat.
                </p>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tier *</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as CandidateTier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="constituency">Constituency</SelectItem>
                    <SelectItem value="ward">Ward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 hidden">
              <Field
                label="Position title"
                name="position_title_legacy"
                placeholder="e.g. County Youth Governor"
                defaultValue={
                  tier === "county"
                    ? "County Youth Governor"
                    : tier === "constituency"
                      ? "Constituency Youth Rep"
                      : "Ward Representative"
                }
                error={errors["position_title"]}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>County *</Label>
                <Select
                  value={county}
                  onValueChange={(v) => {
                    setCounty(v);
                    setConstituency("");
                    setWard("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTY_NAMES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["county"] && <p className="text-xs text-flag-red">{errors["county"]}</p>}
              </div>

              {(tier === "constituency" || tier === "ward") && (
                <div className="space-y-1.5">
                  <Label>Constituency *</Label>
                  <Select
                    value={constituency}
                    onValueChange={(v) => {
                      setConstituency(v);
                      setWard("");
                    }}
                    disabled={!county}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={county ? "Select constituency" : "Pick a county first"}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {constituencyOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors["constituency"] && (
                    <p className="text-xs text-flag-red">{errors["constituency"]}</p>
                  )}
                </div>
              )}

              {tier === "ward" && (
                <div className="space-y-1.5">
                  <Label>Ward *</Label>
                  <Select value={ward} onValueChange={setWard} disabled={!constituency}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={constituency ? "Select ward" : "Pick a constituency first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wardOptions.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors["ward"] && <p className="text-xs text-flag-red">{errors["ward"]}</p>}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Ballot position *</Label>
              <Select
                value={positionId}
                onValueChange={setPositionId}
                disabled={
                  !county ||
                  ((tier === "constituency" || tier === "ward") && !constituency) ||
                  (tier === "ward" && !ward)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !county ||
                      ((tier === "constituency" || tier === "ward") && !constituency) ||
                      (tier === "ward" && !ward)
                        ? "Select the location first"
                        : "Select position for this location"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["position_id"] && (
                <p className="text-xs text-flag-red">{errors["position_id"]}</p>
              )}
            </div>
            <input
              type="hidden"
              name="position_title"
              value={positionOptions.find((p) => p.id === positionId)?.title ?? ""}
            />

            <Field
              label="Party / movement (optional)"
              name="party"
              placeholder="e.g. Mashinani Youth Kazi Delivery Movement"
              error={errors["party"]}
            />
            <Field
              label="Campaign slogan (optional)"
              name="slogan"
              placeholder="e.g. Kutoka Ground Hadi Top"
              error={errors["slogan"]}
            />
            <div className="space-y-1.5">
              <Label htmlFor="bio">Short bio (optional)</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="What have you organised, built or led that qualifies you for this seat?"
                maxLength={1000}
              />
            </div>
          </Fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              Your ID is validated before your certificate is issued.
            </div>
            <Button type="submit" disabled={submitting} className="bg-gradient-gold">
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}

function Fieldset({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ShieldCheck;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label} {required && <span className="text-flag-red">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      {error && <p className="text-xs text-flag-red">{error}</p>}
    </div>
  );
}
