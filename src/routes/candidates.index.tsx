import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Vote,
  XCircle,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { mtajiProfileUrl, candidatePhoto } from "@/lib/mtaji";
import { candidatePhotoUrl } from "@/lib/api/candidate-photos";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listCandidates, type Candidate, type CandidateTier } from "@/lib/candidates";
import { verifyCertificate, type CertificateVerification } from "@/lib/api/verify";
import { LocationTierBar } from "@/components/location-tier-bar";
import { COUNTY_NAMES, constituenciesForCounty, wardsForConstituency } from "@/lib/locations";

export const Route = createFileRoute("/candidates/")({
  head: () => ({
    meta: [
      { title: "Candidates — MY-KDM Vote" },
      {
        name: "description",
        content:
          "Browse certified candidates for the Mashinani Youth Kazi Delivery Movement elections. Verify electronic certificates and view profiles.",
      },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<CandidateTier>("county");
  const [county, setCounty] = useState<string>(COUNTY_NAMES[0]);
  const [constituency, setConstituency] = useState<string>(
    constituenciesForCounty(COUNTY_NAMES[0])[0] ?? "",
  );
  const [ward, setWard] = useState<string>(
    wardsForConstituency(constituenciesForCounty(COUNTY_NAMES[0])[0] ?? "")[0] ?? "",
  );
  const [search, setSearch] = useState("");
  const [verifying, setVerifying] = useState<Candidate | null>(null);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    listCandidates()
      .then((c) => {
        if (ok) setCandidates(c);
      })
      .catch((e: Error) => ok && setError(e.message))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (c.tier !== tier) return false;
      if (tier === "county" && c.county !== county) return false;
      if (tier === "constituency" && (c.county !== county || c.constituency !== constituency))
        return false;
      if (
        tier === "ward" &&
        (c.county !== county || c.constituency !== constituency || c.ward !== ward)
      )
        return false;
      if (!q) return true;
      return c.full_name.toLowerCase().includes(q) || (c.slogan ?? "").toLowerCase().includes(q);
    });
  }, [candidates, tier, county, constituency, ward, search]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary">
                Certified candidates
              </div>
              <h1 className="mt-1 font-display text-4xl md:text-5xl">
                <span className="text-ink">Meet the</span>{" "}
                <span className="text-gradient-gold">certified</span>{" "}
                <span className="text-accent">contestants</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Every candidate is verified with their National ID and IEBC voter number, then
                issued a tamper-proof electronic certificate before appearing on the ballot.
              </p>
            </div>
            <Button size="lg" className="bg-gradient-gold" asChild>
              <Link to="/candidates/apply">
                <UserPlus className="mr-2 h-4 w-4" /> Apply to vie
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <LocationTierBar
        activeTier={tier}
        setActiveTier={(t) => {
          if (t === "county" || t === "constituency" || t === "ward") setTier(t);
        }}
        county={county}
        setCounty={setCounty}
        constituency={constituency}
        setConstituency={setConstituency}
        ward={ward}
        setWard={setWard}
        rightSlot={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate…"
              className="h-9 w-56 border-white/15 bg-white/5 pl-8 text-sm text-white placeholder:text-white/40"
            />
          </div>
        }
      />

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-4 text-xs text-muted-foreground">
          {loading
            ? "Loading candidates…"
            : `${filtered.length} of ${candidates.length} candidates`}
        </div>
        {error && (
          <div className="rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm text-flag-red">
            Failed to load candidates: {error}
          </div>
        )}
        {!loading && filtered.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <div className="font-display text-lg">No candidates yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to apply and get your electronic certificate.
            </p>
            <Button className="mt-4 bg-gradient-gold" asChild>
              <Link to="/candidates/apply">
                <UserPlus className="mr-2 h-4 w-4" /> Apply to vie
              </Link>
            </Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CandidateCard key={c.id} candidate={c} onVerify={() => setVerifying(c)} />
          ))}
        </div>
      </section>

      <VerifyDialog candidate={verifying} onOpenChange={(o) => !o && setVerifying(null)} />

      <SiteFooter />
    </div>
  );
}

function CandidateCard({ candidate, onVerify }: { candidate: Candidate; onVerify: () => void }) {
  const scope =
    candidate.tier === "county"
      ? candidate.county
      : candidate.tier === "constituency"
        ? `${candidate.constituency}, ${candidate.county}`
        : `${candidate.ward} — ${candidate.constituency}, ${candidate.county}`;
  const TierIcon =
    candidate.tier === "county" ? MapPin : candidate.tier === "constituency" ? Building2 : Vote;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-ink">
        <img
          src={candidatePhotoUrl(candidate.photo_path) ?? candidatePhoto(candidate.id)}
          alt={candidate.full_name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-flag-red/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {candidate.county}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg">{candidate.full_name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <TierIcon className="h-3 w-3" />
              <span className="truncate">
                {candidate.position_title} · {scope}
              </span>
            </div>
          </div>
        </div>

        {candidate.slogan && (
          <p className="mt-3 line-clamp-1 text-sm italic text-accent">"{candidate.slogan}"</p>
        )}
        {candidate.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{candidate.bio}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Cert ·{" "}
            <span className="font-mono normal-case text-foreground">
              {candidate.certificate_number}
            </span>
          </div>
        </div>

        <a
          href={mtajiProfileUrl(candidate.full_name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ink/90"
        >
          View profile on M-Taji <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onVerify}
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Verified
          </Button>
          <Button size="sm" className="flex-1 bg-gradient-gold" asChild>
            <Link to="/candidates/$candidateId/certificate" params={{ candidateId: candidate.id }}>
              <Award className="mr-1.5 h-3.5 w-3.5" /> Certificate
            </Link>
          </Button>
        </div>
        <Button size="sm" variant="secondary" className="mt-2 w-full" asChild>
          <Link to="/candidates/$candidateId/dashboard" params={{ candidateId: candidate.id }}>
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Live dashboard
          </Link>
        </Button>
      </div>
    </article>
  );
}

function VerifyDialog({
  candidate,
  onOpenChange,
}: {
  candidate: Candidate | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidate) {
      setResult(null);
      setError(null);
      setCopied(false);
      return;
    }
    if (!candidate.certificate_number) {
      setResult({ valid: false });
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    verifyCertificate(candidate.certificate_number)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Verification failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidate]);

  const certNumber = result?.certificateNumber ?? candidate?.certificate_number ?? "";

  return (
    <Dialog open={!!candidate} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {candidate && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-flag-red/15 text-flag-red">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                {loading
                  ? "Verifying certificate…"
                  : result?.valid
                    ? "Certificate verified"
                    : "Certificate not verified"}
              </DialogTitle>
              <DialogDescription>
                {loading
                  ? "Checking the MY-KDM 2026 certificate ledger…"
                  : result?.valid
                    ? "This candidate holds a valid MY-KDM 2026 electronic certificate."
                    : "No matching approved certificate was found on the ledger."}
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm text-flag-red">
                {error}
              </div>
            ) : result?.valid ? (
              <>
                <div className="space-y-3 rounded-xl border border-border bg-card p-4 text-sm">
                  <Row label="Full name" value={result.fullName ?? "—"} />
                  <Row label="Position" value={result.positionTitle ?? "—"} />
                  <Row label="Scope" value={result.scope ?? "—"} />
                  <Row label="County" value={result.county ?? "—"} />
                  <Row
                    label="Certificate no."
                    value={result.certificateNumber ?? "—"}
                    mono
                    highlight
                  />
                  <Row
                    label="Issued"
                    value={result.certifiedAt ? new Date(result.certifiedAt).toLocaleString() : "—"}
                  />
                  <Row label="Status" value={result.status ?? "—"} />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
                  <CheckCircle2 className="h-4 w-4" /> Verified on-chain by MY-KDM Elections
                  Directorate
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (certNumber) {
                        navigator.clipboard.writeText(certNumber);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }
                    }}
                  >
                    {copied ? "Copied!" : "Copy cert number"}
                  </Button>
                  <Button className="flex-1 bg-gradient-gold" asChild>
                    <Link
                      to="/candidates/$candidateId/certificate"
                      params={{ candidateId: candidate.id }}
                    >
                      Open certificate
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm text-flag-red">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">Unverified</div>
                  <p className="mt-1 text-flag-red/90">
                    Certificate <span className="font-mono">{certNumber || "—"}</span> could not be
                    confirmed. It may be invalid, revoked, or not yet issued.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span
        className={`text-right ${mono ? "font-mono text-xs" : "text-sm"} ${
          highlight ? "font-semibold text-primary" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function maskId(id: string): string {
  if (id.length <= 4) return id;
  return `${"•".repeat(Math.max(0, id.length - 4))}${id.slice(-4)}`;
}
