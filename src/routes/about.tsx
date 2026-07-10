import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  LogIn,
  UserPlus,
  Vote,
  Briefcase,
  GraduationCap,
  Megaphone,
  HeartHandshake,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";

import davidMbehiImg from "@/assets/secretariat/david-mbehi.jpg";
import malobaWanjalaImg from "@/assets/secretariat/maloba-wanjala.jpg";
import brianOtienoImg from "@/assets/secretariat/brian-otieno.jpg";
import aishaNoorImg from "@/assets/secretariat/aisha-noor.jpg";

const SECRETARIAT_PHOTOS: Record<string, string> = {
  c1: davidMbehiImg,
  c4: malobaWanjalaImg,
  c6: brianOtienoImg,
  c8: aishaNoorImg,
};

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { POSITIONS, CANDIDATES } from "@/lib/mym-data";
import { isSupabaseBackendEnabled } from "@/lib/feature-flags";
import { getPublicCounters, type PublicCounters } from "@/lib/api/analytics";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Mashinani Youth Kazi Delivery Movement" },
      {
        name: "description",
        content:
          "MY-KDM is an elected, digitally-powered alternative to the National Youth Council congress — built from the ward level up.",
      },
      { property: "og:title", content: "About the Mashinani Youth Kazi Delivery Movement" },
      {
        property: "og:description",
        content:
          "A united, credible and self-organised generation of Kenyan youth with a direct, elected voice in national development.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
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
      .catch((error) => console.warn("[about] public counters failed:", error));
  }, [supabaseBackend]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
          <h1 className="mt-2 font-display text-4xl leading-tight md:text-6xl">
            <span className="text-ink">Mashinani Youth</span>{" "}
            <span className="text-gradient-gold">Government</span>{" "}
            <span className="text-accent">Delivery Unit</span>
          </h1>
          <p className="mt-4 font-display text-2xl text-primary md:text-3xl">
            "Kutoka Ground Hadi Top"
          </p>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            A nationwide youth movement with a national youth leadership structure — built from the
            ward level upward and elected by young people themselves through this platform.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-4xl gap-3 px-4 py-8 sm:grid-cols-4 sm:px-6">
          <AboutStat label="Counties on ballot" value={String(counters.countiesOnBallot)} />
          <AboutStat label="Live positions" value={String(counters.livePositions)} />
          <AboutStat label="Certified candidates" value={String(counters.certifiedCandidates)} />
          <AboutStat label="Registered voters" value={counters.registeredVoters.toLocaleString()} />
        </div>
      </section>

      {/* Background */}
      <Section
        eyebrow="01 · Background"
        title={
          <>
            <span className="text-ink">Why this</span>{" "}
            <span className="text-gradient-gold">movement</span>{" "}
            <span className="text-accent">exists</span>
          </>
        }
      >
        <p>
          Kenya's youth make up the majority of the population, yet existing structures for youth
          representation do not ensure that young people are genuinely represented or economically
          empowered. Over time these structures have become an exclusive, elitist caucus — making
          decisions on behalf of millions of young people without ever holding an election.
        </p>
        <p>
          The Mashinani Youth Kazi Delivery Movement (MY-KDM) is that alternative: a nationwide
          youth movement with a national youth leadership structure, built from the ward upward and
          elected end-to-end on this platform using electronic voting — fast, verifiable and
          accessible across all 47 counties.
        </p>
      </Section>

      {/* Vision */}
      <Section
        eyebrow="02 · Vision"
        title={
          <>
            <span className="text-ink">Our</span> <span className="text-gradient-gold">vision</span>
          </>
        }
        tone="alt"
      >
        <p>
          A united, credible and self-organised generation of Kenyan youth with a direct, elected
          voice in national development.
        </p>
      </Section>

      {/* Mission */}
      <Section
        eyebrow="03 · Mission"
        title={
          <>
            <span className="text-ink">Our</span> <span className="text-accent">mission</span>
          </>
        }
      >
        <p>
          To build a transparent, competitive and digitally-run national youth structure that
          identifies capable young leaders, amplifies youth priorities, and converts that voice into
          partnerships, opportunities and policy influence.
        </p>
      </Section>

      {/* Structure */}
      <Section
        eyebrow="04 · Structure"
        title={
          <>
            <span className="text-ink">National to</span>{" "}
            <span className="text-gradient-gold">grassroots</span>{" "}
            <span className="text-accent">leadership</span>
          </>
        }
        tone="alt"
      >
        <ul className="grid gap-4 md:grid-cols-2">
          <StructureItem
            name="National Secretariat"
            body="Chair, CEO and national office bearers providing strategic direction and national coordination."
          />
          <StructureItem
            name="County Youth Commander"
            body="Coordinates county-level youth engagement across all 47 counties."
          />
          <StructureItem
            name="Constituency Youth Commander"
            body="Coordinates constituency-level mobilisation and reporting."
          />
          <StructureItem
            name="Ward / Location Heads"
            body="Lead grassroots mobilisation and reporting at ward and location level."
          />
          <StructureItem
            name="Village Youth Units"
            body="Local units of ~1,000 youth per ward driving last-mile delivery and two-way data flow via M-Taji."
          />
          <StructureItem
            name="Elected on-platform"
            body="Every seat — national, county, constituency and ward — is filled through electronic voting on this platform."
          />
        </ul>
      </Section>

      {/* Secretariat carousel */}
      <SecretariatCarousel />

      {/* Partners */}
      <Section
        eyebrow="05 · Strategic partners"
        title={
          <>
            <span className="text-ink">Built</span> <span className="text-gradient-gold">with</span>{" "}
            <span className="text-accent">purpose</span>
          </>
        }
      >
        <ul className="grid gap-4 md:grid-cols-2">
          <PartnerCard
            name="M-Taji"
            domain="m-taji.africa"
            href="https://m-taji.africa"
            body="Technology arm — powers candidate certification, electronic voting and the opportunities marketplace."
            initials="M"
            logoClass="bg-gradient-gold"
          />
          <PartnerCard
            name="USLA"
            domain="uslakenya.co.ke"
            href="https://uslakenya.co.ke/"
            body="University Student Leaders Association — ensures campus-based youth are represented alongside the wider youth population."
            initials="USLA"
            logoClass="bg-flag-red"
          />
        </ul>
      </Section>

      {/* Roadmap */}
      <Section
        eyebrow="06 · Roadmap"
        title={
          <>
            <span className="text-ink">Launch.</span>{" "}
            <span className="text-gradient-gold">Build.</span>{" "}
            <span className="text-accent">Empower.</span>
          </>
        }
        tone="alt"
      >
        <ol className="space-y-3">
          <RoadmapItem phase="Phase 1" title="Launch & National Elections" />
          <RoadmapItem phase="Phase 2" title="Institution Building" />
          <RoadmapItem phase="Phase 3" title="Public Engagement & Visibility" />
          <RoadmapItem phase="Phase 4" title="Economic Empowerment Programmes" />
        </ol>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {(
            [
              {
                name: "Youth economic empowerment",
                body: "Through a public project ecosystem — jobs, contracts, ambassadorship, innovation, volunteering and content creation.",
                Icon: Briefcase,
                tone: "gold",
              },
              {
                name: "Education scholarships & entrepreneurship training",
                body: "Bursaries, mentorship and practical business bootcamps that turn hustles into real ventures.",
                Icon: GraduationCap,
                tone: "green",
              },
              {
                name: "Advocacy and policy influence",
                body: "Turning organised youth voice into partnerships, opportunities and policy weight.",
                Icon: Megaphone,
                tone: "gold",
              },
              {
                name: "Philanthropy",
                body: "Charity walks, tree planting and sports fundraising initiatives led by young people ward by ward.",
                Icon: HeartHandshake,
                tone: "green",
              },
            ] as const
          ).map((track) => (
            <ProgrammeCard key={track.name} {...track} />
          ))}
        </div>
      </Section>

      {/* Connect */}
      <Section
        eyebrow="07 · Connect"
        title={
          <>
            <span className="text-ink">Follow the</span>{" "}
            <span className="text-gradient-gold">movement</span>
          </>
        }
      >
        <p>
          Track our campaigns, meet the candidates and see MY-KDM's full digital operation live on
          M-Taji — plus join the conversation across our social channels.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="https://m-taji-tracker.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-5 transition hover:border-primary/60 hover:shadow-md"
          >
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                Platform
              </div>
              <div className="mt-1 font-display text-lg text-ink">MY-KDM on M-Taji</div>
              <div className="text-sm text-muted-foreground">
                Certification, ballots and the candidate marketplace.
              </div>
            </div>
            <ExternalLink className="h-5 w-5 text-primary transition group-hover:translate-x-0.5" />
          </a>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                Icon: FaFacebook,
                label: "Facebook",
                href: "https://facebook.com/mashinaniyouthmovement",
                color: "#1877F2",
              },
              {
                Icon: FaXTwitter,
                label: "X (Twitter)",
                href: "https://x.com/mymkenya",
                color: "#000000",
              },
              {
                Icon: FaInstagram,
                label: "Instagram",
                href: "https://instagram.com/mashinaniyouthmovement",
                color: "#E4405F",
              },
              {
                Icon: FaYoutube,
                label: "YouTube",
                href: "https://youtube.com/@mashinaniyouthmovement",
                color: "#FF0000",
              },
            ].map(({ Icon, label, href, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group grid aspect-square place-items-center rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
              >
                <Icon
                  className="h-6 w-6 transition-transform group-hover:scale-110"
                  style={{ color }}
                />
              </a>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-background to-primary/5">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <div className="text-xs uppercase tracking-widest text-flag-red">Join in</div>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">
            <span className="text-ink">Kutoka</span>{" "}
            <span className="text-gradient-gold">Ground</span>{" "}
            <span className="text-accent">Hadi Top.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Register today, vote in your ward, and help elect the leaders your generation deserves.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-gradient-gold" asChild>
              <Link to="/auth" search={{ redirect: undefined }}>
                <UserPlus className="mr-2 h-4 w-4" /> Sign up
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth" search={{ redirect: undefined }}>
                <LogIn className="mr-2 h-4 w-4" /> Log in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function AboutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center sm:text-left">
      <div className="font-display text-2xl text-ink">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
  tone,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
  tone?: "alt";
}) {
  return (
    <section className={tone === "alt" ? "border-y border-border bg-secondary/40" : ""}>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 md:py-16">
        <div className="text-xs uppercase tracking-widest text-flag-red">{eyebrow}</div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{title}</h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          {children}
        </div>
      </div>
    </section>
  );
}

function StructureItem({ name, body }: { name: string; body: string }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="font-display text-lg text-ink">{name}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </li>
  );
}

function PartnerCard({
  name,
  domain,
  href,
  body,
  initials,
  logoClass,
}: {
  name: string;
  domain: string;
  href: string;
  body: string;
  initials: string;
  logoClass: string;
}) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${logoClass}`}>
          <span
            className={`font-display font-bold text-white ${
              initials.length > 1 ? "text-base" : "text-2xl"
            }`}
          >
            {initials}
          </span>
        </div>
        <div className="flex-1">
          <div className="font-display text-lg text-ink">{name}</div>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {domain} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </li>
  );
}

function ProgrammeCard({
  name,
  body,
  Icon,
  tone,
}: {
  name: string;
  body: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "gold" | "green";
}) {
  const isGold = tone === "gold";
  return (
    <div
      className={`rounded-2xl border bg-card p-5 ${
        isGold ? "border-primary/30" : "border-accent/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            isGold ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="font-display text-lg">
          <span className={isGold ? "text-gradient-gold" : "text-accent"}>{name}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function RoadmapItem({ phase, title }: { phase: string; title: string }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">{phase}</div>
      <div className="flex-1 font-display text-lg text-ink">{title}</div>
    </li>
  );
}

function SecretariatCarousel() {
  const nationalPositions = POSITIONS.filter((p) => p.tier === "national");
  const members = nationalPositions.flatMap((pos) => {
    const cand = CANDIDATES.find((c) => c.positionId === pos.id);
    return cand
      ? [
          {
            id: cand.id,
            name: cand.name,
            initials: cand.initials,
            title: pos.title,
            scope: pos.scope,
            slogan: cand.slogan,
            accent: cand.accent,
            photo:
              SECRETARIAT_PHOTOS[cand.id] ??
              `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(cand.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&radius=50`,
          },
        ]
      : [];
  });
  const loop = [...members, ...members];

  return (
    <section id="secretariat" className="scroll-mt-24 border-y border-border bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-xs uppercase tracking-widest text-accent">
          The National Secretariat
        </div>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">
          <span className="text-white">Meet the</span>{" "}
          <span className="text-gradient-gold">secretariat</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Chair, CEO and the Cabinet of Youth Ministers — the elected national leadership driving
          MY-KDM's delivery agenda.
        </p>
      </div>

      <div className="group relative overflow-hidden pb-16">
        <div
          className="flex w-max gap-5 px-6 animate-secretariat-marquee group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(members.length * 6, 30)}s` }}
        >
          {loop.map((m, i) => (
            <article
              key={`${m.id}-${i}`}
              className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
            >
              <div
                className={`mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/20 ${
                  m.accent === "gold"
                    ? "bg-gradient-gold"
                    : m.accent === "sage"
                      ? "bg-accent/30"
                      : "bg-flag-red/30"
                }`}
              >
                <img
                  src={m.photo}
                  alt={`${m.name} portrait`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-3 text-center">
                <div className="font-display text-base">{m.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/50">{m.scope}</div>
              </div>
              <div className="mt-3 text-center font-display text-base text-white">{m.title}</div>
              <p className="mt-2 text-center text-sm italic text-white/70">"{m.slogan}"</p>
              <Link
                to="/candidates/$candidateId/dashboard"
                params={{ candidateId: m.id }}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/60 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                View profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
