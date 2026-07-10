import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Printer, ShieldCheck, Download } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getCandidate, type Candidate } from "@/lib/candidates";
import { candidatePhoto } from "@/lib/mtaji";
import { candidatePhotoUrl } from "@/lib/api/candidate-photos";

export const Route = createFileRoute("/candidates/$candidateId/certificate")({
  head: () => ({
    meta: [
      { title: "Candidate certificate — MY-KDM Vote" },
      {
        name: "description",
        content:
          "Official electronic certificate of clearance issued by the Mashinani Youth Kazi Delivery Movement Elections Directorate for the 2026 election cycle.",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { candidateId } = Route.useParams();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    getCandidate(candidateId)
      .then((c) => ok && setCandidate(c))
      .catch((e: Error) => ok && setError(e.message))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [candidateId]);

  return (
    <div className="min-h-screen bg-secondary/30 print:bg-white">
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            to="/candidates"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All candidates
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button size="sm" className="bg-gradient-gold" onClick={() => window.print()}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Save as PDF
            </Button>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading certificate…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-flag-red/40 bg-flag-red/10 p-6 text-sm text-flag-red">
            {error}
          </div>
        )}
        {!loading && !candidate && !error && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="font-display text-lg">Certificate not found</div>
            <p className="mt-2 text-sm text-muted-foreground">
              This candidate may not be approved yet, or the link is incorrect.
            </p>
          </div>
        )}

        {candidate && <Certificate candidate={candidate} />}
      </section>

      <div className="print:hidden">
        <SiteFooter />
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Certificate({ candidate }: { candidate: Candidate }) {
  const scope =
    candidate.tier === "county"
      ? candidate.county
      : candidate.tier === "constituency"
        ? `${candidate.constituency}, ${candidate.county}`
        : `${candidate.ward} — ${candidate.constituency}, ${candidate.county}`;
  const issued = candidate.certified_at
    ? new Date(candidate.certified_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const expires = candidate.certified_at
    ? new Date(
        new Date(candidate.certified_at).getTime() + 365 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${candidate.certificate_number ?? ""}`
      : `/verify/${candidate.certificate_number ?? ""}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&qzone=1&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <article
      className="relative isolate mx-auto overflow-hidden rounded-[28px] bg-white text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] print:rounded-none print:shadow-none"
      style={{
        aspectRatio: "1.414 / 1",
        maxWidth: "1100px",
      }}
    >
      {/* Gold guilloché frame */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] p-[6px] print:rounded-none">
        <div
          className="h-full w-full rounded-[22px] print:rounded-none"
          style={{
            background:
              "linear-gradient(135deg, hsl(45 85% 55%) 0%, hsl(38 90% 45%) 25%, hsl(48 95% 70%) 50%, hsl(38 90% 45%) 75%, hsl(45 85% 55%) 100%)",
          }}
        />
      </div>
      <div className="absolute inset-[10px] rounded-[22px] bg-white print:rounded-none" />
      <div className="pointer-events-none absolute inset-[14px] rounded-[20px] border border-primary/30 print:rounded-none" />
      <div className="pointer-events-none absolute inset-[22px] rounded-[16px] border border-primary/20 print:rounded-none" />

      {/* Guilloché SVG pattern */}
      <svg
        className="pointer-events-none absolute inset-[14px] h-[calc(100%-28px)] w-[calc(100%-28px)] opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="guilloche" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(45 85% 45%)" strokeWidth="0.4" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="hsl(45 85% 45%)" strokeWidth="0.4" />
            <circle cx="40" cy="40" r="18" fill="none" stroke="hsl(45 85% 45%)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#guilloche)" />
      </svg>

      {/* Diagonal MY-KDM watermark */}
      <div className="pointer-events-none absolute inset-0 grid select-none place-items-center">
        <div
          className="font-display text-[220px] font-black uppercase tracking-tighter text-primary/[0.04]"
          style={{ transform: "rotate(-22deg)" }}
        >
          MY-KDM · 2026
        </div>
      </div>

      {/* Content */}
      <div className="relative flex h-full flex-col px-10 py-8 md:px-14 md:py-10">
        {/* Header */}
        <header className="flex items-start justify-between gap-6 border-b border-primary/20 pb-4">
          <div className="flex items-center gap-3">
            <MymCrest className="h-14 w-14" />
            <div>
              <div className="font-display text-xl leading-tight text-ink">
                Mashinani Youth Kazi Delivery Movement
              </div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Republic of Kenya · Elections Directorate
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Serial · Cert No.
            </div>
            <div className="font-mono text-sm font-bold text-primary">
              {candidate.certificate_number ?? "—"}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
              Series MY-KDM/2026
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="relative flex-1 pt-6">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-primary">
              Certificate of Clearance to Vie
            </div>
            <div className="mx-auto mt-1 h-[2px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
            <p className="mt-3 font-display text-base italic text-muted-foreground">
              This is to formally certify that
            </p>
          </div>

          <div className="mt-4 grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            {/* Photo */}
            <div className="mx-auto">
              <div
                className="relative rounded-lg p-[3px] shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(45 85% 55%), hsl(38 90% 45%))",
                }}
              >
                <img
                  src={candidatePhotoUrl(candidate.photo_path) ?? candidatePhoto(candidate.id)}
                  alt={candidate.full_name}
                  className="h-32 w-28 rounded-md object-cover md:h-36 md:w-32"
                />
              </div>
              <div className="mt-1 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
                Bearer photo
              </div>
            </div>

            {/* Name & particulars */}
            <div className="text-center">
              <div className="font-display text-3xl font-bold md:text-4xl">
                <span className="text-gradient-gold">{candidate.full_name}</span>
              </div>
              <div className="mx-auto mt-1 h-[1px] w-40 bg-primary/40" />

              <div className="mx-auto mt-3 grid max-w-md gap-2 text-left text-xs">
                <ParticularRow label="National ID" value={candidate.national_id} />
                <ParticularRow label="IEBC Voter No." value={candidate.iebc_voter_number} />
                {candidate.party && (
                  <ParticularRow label="Party / Movement" value={candidate.party} />
                )}
              </div>

              <p className="mx-auto mt-3 max-w-lg text-xs italic text-muted-foreground md:text-sm">
                has satisfied all eligibility requirements of the Movement and is hereby duly
                cleared to vie for the office of
              </p>

              <div className="mt-3">
                <div className="font-display text-xl text-ink md:text-2xl">
                  {candidate.position_title}
                </div>
                <div className="mt-0.5 text-xs uppercase tracking-[0.22em] text-accent">
                  {scope}
                </div>
              </div>
            </div>

            {/* QR + Seal */}
            <div className="mx-auto flex flex-col items-center gap-2">
              <img
                src={qrSrc}
                alt="Verification QR code"
                width={110}
                height={110}
                className="rounded border border-border bg-white p-1"
              />
              <div className="text-center text-[9px] uppercase tracking-widest text-muted-foreground">
                Scan to verify
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative mt-4 border-t border-primary/20 pt-4">
          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div>
              <div
                className="font-display text-lg italic text-ink"
                style={{ fontFamily: "cursive" }}
              >
                J. Wanjiru
              </div>
              <div className="mt-1 h-px w-48 bg-foreground/50" />
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Chair · MY-KDM Elections Directorate
              </div>
            </div>

            {/* Embossed circular seal */}
            <div className="relative grid h-24 w-24 place-items-center justify-self-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, hsl(0 75% 55%), hsl(0 75% 40%) 60%, hsl(0 75% 30%) 100%)",
                  boxShadow:
                    "inset 0 0 0 3px rgba(255,255,255,0.35), 0 4px 12px rgba(180,20,20,0.35)",
                }}
              />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/70" />
              <div className="relative text-center text-white">
                <ShieldCheck className="mx-auto h-5 w-5" />
                <div className="mt-0.5 text-[8px] font-black uppercase tracking-[0.18em]">
                  MY-KDM
                  <br />
                  OFFICIAL
                </div>
              </div>
            </div>

            <div className="md:text-right">
              <div
                className="font-display text-lg italic text-ink"
                style={{ fontFamily: "cursive" }}
              >
                A. Otieno
              </div>
              <div className="mt-1 ml-auto h-px w-48 bg-foreground/50" />
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Secretary General · MY-KDM
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Award className="h-3 w-3 text-primary" /> Issued:{" "}
              <span className="text-foreground">{issued}</span>
            </div>
            <div>
              Valid until: <span className="text-foreground">{expires}</span>
            </div>
            <div className="font-mono normal-case">
              Verify: /verify/<span className="text-primary">{candidate.certificate_number}</span>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}

function ParticularRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border/70 pb-1">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MymCrest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="crestGold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(48 95% 70%)" />
          <stop offset="50%" stopColor="hsl(45 85% 50%)" />
          <stop offset="100%" stopColor="hsl(38 90% 40%)" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path
        d="M32 3 L58 12 V32 C58 46 46 57 32 61 C18 57 6 46 6 32 V12 Z"
        fill="url(#crestGold)"
        stroke="hsl(38 90% 30%)"
        strokeWidth="1.2"
      />
      {/* Inner shield */}
      <path d="M32 9 L52 16 V32 C52 43 43 52 32 55 C21 52 12 43 12 32 V16 Z" fill="hsl(0 0% 10%)" />
      {/* Star */}
      <polygon
        points="32,17 34.5,25 43,25 36,30 38.5,38 32,33 25.5,38 28,30 21,25 29.5,25"
        fill="url(#crestGold)"
      />
      {/* MY-KDM text */}
      <text
        x="32"
        y="49"
        textAnchor="middle"
        fontFamily="serif"
        fontWeight="900"
        fontSize="9"
        fill="url(#crestGold)"
        letterSpacing="1"
      >
        MY-KDM
      </text>
    </svg>
  );
}
