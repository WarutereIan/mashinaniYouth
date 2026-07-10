import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Vote,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building2,
  Landmark,
  Users,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter, MYKDM_SOCIALS } from "@/components/site-chrome";
import { SupportButton } from "@/components/support-button";
import { POSITIONS, TIER_META, CANDIDATES, type Tier, type Candidate } from "@/lib/mym-data";
import heroProfessions from "@/assets/hero-professions.jpg";
import { mtajiProfileUrl, candidatePhoto } from "@/lib/mtaji";
import { isSupabaseBackendEnabled } from "@/lib/feature-flags";
import { getPublicCounters, type PublicCounters } from "@/lib/api/analytics";

export const Route = createFileRoute("/")({
  component: Home,
});

const FROM_WORDS = [
  "Ground",
  "Mashinani",
  "Ghetto",
  "Ocha",
  "Chini",
  "Backbench",
  "Hustling",
  "Brokieness",
];
const TO_WORDS = ["Singapore", "First World", "Top"];

function TypewriterLine({ words, className }: { words: string[]; className?: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex];
    if (!deleting && text === word) {
      const t = setTimeout(() => setDeleting(true), 1400);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(
      () =>
        setText((prev) =>
          deleting ? word.slice(0, prev.length - 1) : word.slice(0, prev.length + 1),
        ),
      deleting ? 60 : 110,
    );
    return () => clearTimeout(t);
  }, [text, deleting, wordIndex, words]);

  return (
    <span className={className}>
      {text}
      <span
        className="ml-0.5 inline-block w-[3px] animate-pulse bg-accent align-middle"
        style={{ height: "0.85em" }}
      />
    </span>
  );
}

function Home() {
  const tiers = ["national", "county", "constituency", "ward"] as const;
  const supabaseBackend = isSupabaseBackendEnabled();
  const [counters, setCounters] = useState<PublicCounters>({
    countiesOnBallot: 47,
    livePositions: POSITIONS.length,
    certifiedCandidates: CANDIDATES.length,
    registeredVoters: 0,
  });

  useEffect(() => {
    if (!supabaseBackend) return;
    getPublicCounters()
      .then(setCounters)
      .catch((error) => console.warn("[home] public counters failed:", error));
  }, [supabaseBackend]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — full-bleed cover */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroProfessions}
            alt="Young Kenyan professionals from every walk of life — chef, mason, lawyer, boda-boda rider, vendor, businessman, nurse, mechanic and student — standing together."
            width={1920}
            height={1088}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/60 to-ink/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--sage)/0.20),transparent_55%)]" />
        </div>

        <div className="mx-auto flex min-h-[96vh] max-w-5xl flex-col items-center justify-between px-4 pb-4 pt-8 text-center text-white sm:px-6 md:pb-6 md:pt-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-flag-red bg-flag-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-flag-red" />
            Electronic voting is now open
          </span>

          <div className="w-full">
            <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-white">Kutoka</span>{" "}
              <TypewriterLine words={FROM_WORDS} className="text-gradient-gold" />
              <br />
              <span className="text-white">Hadi</span>{" "}
              <TypewriterLine words={TO_WORDS} className="text-accent" />
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-white/85 md:text-lg">
              Mashinani Youth – Kazi Delivery Movement (MY-KDM) is a nationwide youth movement with
              an elected leadership structure running from the ward level to the National
              Secretariat. Our mandate is twofold: to support government, political actors, and
              development partners in public service delivery — and in doing so, open the door for
              Kenya's youth to actively participate in that delivery and be economically empowered
              in the process.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                className="border border-white/30 border-t-primary bg-white/5 text-base text-white backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <Link to="/register">Register to vie</Link>
              </Button>
              <Button
                size="lg"
                className="bg-gradient-gold text-base text-primary-foreground transition hover:shadow-cta"
                asChild
              >
                <Link to="/elections">
                  Cast your vote <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border border-white/30 border-t-primary bg-white/5 text-base text-white backdrop-blur transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <a
                  href="https://m-taji-tracker.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  See MY-KDM on M-Taji <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar — opens the white section */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <div className="grid grid-cols-3 gap-6">
            <LightStat value={String(counters.countiesOnBallot)} label="Counties on the ballot" />
            <LightStat value={String(counters.livePositions)} label="Live positions" />
            <LightStat value={String(counters.certifiedCandidates)} label="Certified candidates" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Follow MY-KDM
            </div>
            <div className="flex items-center gap-3">
              {MYKDM_SOCIALS.map(({ Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group grid h-11 w-11 place-items-center rounded-full border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
                >
                  <Icon
                    className="h-5 w-5 transition-transform group-hover:scale-110"
                    style={{ color }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-flag-red">
              Organisational structure
            </div>
            <h2 className="mt-1 font-display text-4xl">
              <span className="text-ink">Four tiers,</span>{" "}
              <span className="text-gradient-gold">one</span>{" "}
              <span className="text-accent">movement</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Elections cascade from the National Secretariat down to every ward — no appointments, no
            shortcuts.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => (
            <div
              key={t}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <div className="absolute right-4 top-4 font-display text-6xl text-accent/20">
                0{i + 1}
              </div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-flag-red/15 text-flag-red">
                {t === "national" ? (
                  <Users className="h-5 w-5" />
                ) : t === "county" ? (
                  <MapPin className="h-5 w-5" />
                ) : t === "constituency" ? (
                  <Building2 className="h-5 w-5" />
                ) : (
                  <Vote className="h-5 w-5" />
                )}
              </div>
              <h3 className="mt-4 font-display text-2xl">{TIER_META[t].label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{TIER_META[t].blurb}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                {t === "national" ? (
                  <span />
                ) : (
                  <span className="text-muted-foreground">
                    {POSITIONS.filter((p) => p.tier === t).length} positions
                  </span>
                )}
                {t === "national" ? (
                  <Link
                    to="/about"
                    hash="secretariat"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    View secretariat <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/elections"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    View ballot <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contestants — M-taji style */}
      <ContestantsSection />

      {/* Process */}
      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent">
              The electoral process
            </div>
            <h2 className="mt-1 font-display text-4xl">
              <span className="text-white">Certified.</span>{" "}
              <span className="text-gradient-gold">Contested.</span>{" "}
              <span className="text-accent">Counted.</span>
            </h2>
            <p className="mt-4 text-white/70">
              Every aspirant is certified by MY-KDM. Every voter is verified. Every ballot is
              encrypted, signed and audit-ready — county by county, ward by ward.
            </p>
            <Button size="lg" className="mt-6 bg-gradient-gold" asChild>
              <Link to="/about">Read the concept note</Link>
            </Button>
          </div>
          <ol className="space-y-4">
            {[
              [
                "01",
                "Candidate certification",
                "Aspirants obtain their MY-KDM clearance certificate to be eligible.",
              ],
              [
                "02",
                "Campaign period",
                "Certified candidates campaign for national, county and ward positions.",
              ],
              [
                "03",
                "Electronic voting",
                "Elections run county by county on M-Taji with a verifiable digital trail.",
              ],
              [
                "04",
                "Results & inauguration",
                "The elected leadership is announced and inaugurated in the open.",
              ],
            ].map(([n, t, d]) => (
              <li
                key={n}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 font-display text-xl text-accent">
                  {n}
                </span>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-white/65">{d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-10 md:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-xs uppercase tracking-widest text-flag-red">
                Your voice, your vote
              </div>
              <h2 className="mt-2 font-display text-4xl">
                <span className="text-ink">Ready to make it</span>{" "}
                <span className="text-gradient-gold">count</span>
                <span className="text-accent">?</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Register with your National ID, cast one verified vote per position, and watch the
                tallies update in real time.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="bg-gradient-gold" asChild>
                <Link to="/auth" search={{ redirect: undefined }}>
                  Sign up
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth" search={{ redirect: undefined }}>
                  Log in
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href="https://m-taji-tracker.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  See MY-KDM on M-Taji <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Support MY-KDM */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-flag-red/30 bg-gradient-to-br from-flag-red/10 via-background to-accent/10 p-10 md:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-flag-red/15 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-xs uppercase tracking-widest text-flag-red">Support MY-KDM</div>
              <h2 className="mt-2 font-display text-4xl">
                <span className="text-ink">Power the</span>{" "}
                <span className="text-gradient-gold">movement</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Donate, partner or lend your skills — every shilling and every hand helps take
                MY-KDM from ward committees to national delivery. Kutoka Ground Hadi Top.
              </p>
            </div>
            <SupportButton size="lg" className="bg-flag-red text-white hover:bg-flag-red/90">
              Support MY-KDM
            </SupportButton>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function LightStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-4xl text-ink md:text-5xl">
        <span className="text-gradient-gold">{value}</span>
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

const TIER_ORDER: Tier[] = ["national", "county", "constituency", "ward"];

const TIER_ICON: Record<Tier, typeof Users> = {
  national: Landmark,
  county: MapPin,
  constituency: Building2,
  ward: Vote,
};

function ContestantsSection() {
  const [activeTier, setActiveTier] = useState<Tier>("national");
  const positions = POSITIONS.filter((p) => p.tier === activeTier);
  const candidates = CANDIDATES.filter((c) => positions.some((p) => p.id === c.positionId)).slice(
    0,
    8,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  // Auto-advance carousel every ~4s; loop back to start when near end.
  useEffect(() => {
    if (paused) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (!el) return;
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (nearEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: el.clientWidth * 0.85, behavior: "smooth" });
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [paused, activeTier]);

  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-flag-red/30 bg-flag-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-flag-red">
              <Sparkles className="h-3 w-3" /> Featured contestants
            </span>
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
              <span className="text-ink">Leaders running a</span>{" "}
              <span className="text-gradient-gold">smarter</span>{" "}
              <span className="text-accent">campaign</span>{" "}
              <span className="text-ink">on M-Taji.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              From the National Secretariat to your ward — meet the certified aspirants and open
              their live M-Taji profile to see their manifesto, projects and receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-secondary"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary transition hover:bg-primary/20"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tier tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {TIER_ORDER.map((t) => {
            const Icon = TIER_ICON[t];
            const active = activeTier === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
                  active
                    ? "border-primary bg-gradient-gold text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {TIER_META[t].label}
              </button>
            );
          })}
        </div>

        {/* Carousel */}
        <div
          ref={scrollerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {candidates.map((c) => {
            const position = positions.find((p) => p.id === c.positionId);
            return (
              <FeaturedCandidateCard
                key={c.id}
                candidate={c}
                positionTitle={position?.title ?? ""}
              />
            );
          })}
        </div>

        {/* Carousel dots */}
        {candidates.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {candidates.map((c, i) => (
              <span
                key={c.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === 0 ? "w-6 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-sm text-muted-foreground">
            {candidates.length} aspirants featured on the {TIER_META[activeTier].label} tier · view
            the full ballot for every position.
          </p>
          <Button className="bg-gradient-gold" asChild>
            <Link to="/elections">
              View all contestants <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeaturedCandidateCard({
  candidate,
  positionTitle,
}: {
  candidate: Candidate;
  positionTitle: string;
}) {
  // deterministic pseudo-metrics per candidate for a lively card
  const seed = candidate.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const approval = 50 + (seed % 35);
  const projects = 3 + (seed % 18);

  return (
    <article className="group w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-background shadow-soft transition hover:-translate-y-1 hover:shadow-lg sm:w-[300px]">
      <div className="relative aspect-[4/5] overflow-hidden bg-ink">
        <img
          src={candidatePhoto(candidate.id)}
          alt={`${candidate.name}, ${positionTitle}`}
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent" /> {candidate.slogan}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {positionTitle}
        </div>
        <h3 className="mt-1 truncate font-display text-lg">{candidate.name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Age {candidate.age} · {candidate.county}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Approval
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-accent">
              <TrendingUp className="h-3.5 w-3.5" /> {approval}%
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Projects
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" /> {projects}
            </div>
          </div>
        </div>

        <a
          href={mtajiProfileUrl(candidate.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ink/90"
        >
          View profile on M-Taji <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
