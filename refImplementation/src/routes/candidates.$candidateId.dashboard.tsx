import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Award,
  ExternalLink,
  Eye,
  Heart,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { getCandidate, listCandidates, type Candidate } from "@/lib/candidates";
import { candidatePhoto, mtajiProfileUrl, MTAJI_BASE } from "@/lib/mtaji";

export const Route = createFileRoute("/candidates/$candidateId/dashboard")({
  ssr: false,
  loader: async ({ params }) => {
    const candidate = await getCandidate(params.candidateId);
    if (!candidate) throw notFound();
    return { candidate };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.candidate.full_name} — Live dashboard · MY-KDM`
          : "Candidate dashboard — MY-KDM",
      },
      {
        name: "description",
        content:
          "Real-time performance dashboard for a certified MY-KDM candidate — votes, share, momentum and engagement, linked to their M-Taji profile.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm text-muted-foreground">Could not load dashboard: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm text-muted-foreground">Candidate not found.</p>
    </div>
  ),
  component: CandidateDashboard,
});

// Deterministic pseudo-random from candidate id — keeps stats stable per candidate
// but different across candidates.
function seededRand(seed: string, salt: string): number {
  let h = 2166136261;
  const key = `${seed}::${salt}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return ((h >>> 0) % 100000) / 100000;
}

function buildStats(candidate: Candidate, tick: number) {
  const base = Math.floor(600 + seededRand(candidate.id, "votes") * 4200);
  const drift = Math.floor(seededRand(candidate.id, `t${tick}`) * 25);
  const votes = base + drift;
  const totalInRace = Math.floor(votes / (0.18 + seededRand(candidate.id, "share") * 0.35));
  const share = Math.min(72, Math.round((votes / totalInRace) * 1000) / 10);
  const rank = 1 + Math.floor(seededRand(candidate.id, "rank") * 4);
  const momentum =
    Math.round((seededRand(candidate.id, `m${Math.floor(tick / 3)}`) * 22 - 4) * 10) / 10;
  const views = Math.floor(votes * (3 + seededRand(candidate.id, "views") * 4));
  const endorsements = Math.floor(20 + seededRand(candidate.id, "end") * 180);
  const messages = Math.floor(40 + seededRand(candidate.id, "msg") * 320);
  const wardsWon = Math.floor(1 + seededRand(candidate.id, "wards") * 12);
  return { votes, totalInRace, share, rank, momentum, views, endorsements, messages, wardsWon };
}

function buildTrend(candidate: Candidate, tick: number): number[] {
  return Array.from({ length: 24 }, (_, i) => {
    const v = seededRand(candidate.id, `trend${i}-${Math.floor(tick / 6)}`);
    return 0.25 + v * 0.75;
  });
}

function CandidateDashboard() {
  const { candidate } = Route.useLoaderData();
  const [tick, setTick] = useState(0);
  const [peers, setPeers] = useState<Candidate[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 4000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    listCandidates({ tier: candidate.tier })
      .then((all) => setPeers(all.filter((c) => c.id !== candidate.id).slice(0, 5)))
      .catch(() => setPeers([]));
  }, [candidate.id, candidate.tier]);

  const stats = useMemo(() => buildStats(candidate, tick), [candidate, tick]);
  const trend = useMemo(() => buildTrend(candidate, tick), [candidate, tick]);
  const mtajiUrl = mtajiProfileUrl(candidate.full_name);

  const scope =
    candidate.tier === "county"
      ? candidate.county
      : candidate.tier === "constituency"
        ? `${candidate.constituency}, ${candidate.county}`
        : `${candidate.ward} — ${candidate.constituency}, ${candidate.county}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Link
            to="/candidates"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All candidates
          </Link>

          <div className="mt-5 flex flex-wrap items-start gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-ink shadow-md sm:h-28 sm:w-28">
              <img
                src={candidatePhoto(candidate.id)}
                alt={candidate.full_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                <span className="inline-flex items-center gap-1 rounded-full bg-flag-red/90 px-2 py-0.5 text-white">
                  <ShieldCheck className="h-3 w-3" /> MY-KDM Certified
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage/10 px-2 py-0.5 text-sage">
                  <Activity className="h-3 w-3 animate-pulse" /> Live
                </span>
                <span className="text-primary">{candidate.tier} · {scope}</span>
              </div>
              <h1 className="mt-2 font-display text-3xl md:text-4xl">
                <span className="text-ink">{candidate.full_name.split(" ")[0]}</span>{" "}
                <span className="text-gradient-gold">
                  {candidate.full_name.split(" ").slice(1).join(" ")}
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {candidate.position_title}
                {candidate.party ? ` · ${candidate.party}` : ""}
              </p>
              {candidate.slogan && (
                <p className="mt-2 text-sm italic text-accent">"{candidate.slogan}"</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:min-w-[220px]">
              <Button asChild className="bg-gradient-gold">
                <a href={mtajiUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open M-Taji dashboard
                </a>
              </Button>
              <Button variant="outline" className="border-accent/60 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground" asChild>
                <a href={`${MTAJI_BASE}/signup`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Create profile on M-Taji
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link
                  to="/candidates/$candidateId/certificate"
                  params={{ candidateId: candidate.id }}
                >
                  <Award className="mr-2 h-4 w-4" /> View certificate
                </Link>
              </Button>
              <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                Cert · <span className="font-mono normal-case">{candidate.certificate_number}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live KPI grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Live votes"
            value={stats.votes.toLocaleString()}
            hint={`of ${stats.totalInRace.toLocaleString()} cast in race`}
            icon={Vote}
            tone="primary"
          />
          <Kpi
            label="Vote share"
            value={`${stats.share}%`}
            hint="updated every 4s"
            icon={TrendingUp}
            tone="sage"
          />
          <Kpi
            label="Rank"
            value={`#${stats.rank}`}
            hint={stats.rank === 1 ? "Leading the race" : `In ${ordinal(stats.rank)} place`}
            icon={Trophy}
            tone="accent"
          />
          <Kpi
            label="24h momentum"
            value={`${stats.momentum > 0 ? "+" : ""}${stats.momentum}%`}
            hint={stats.momentum >= 0 ? "Trending up" : "Cooling off"}
            icon={Sparkles}
            tone={stats.momentum >= 0 ? "sage" : "accent"}
          />
        </div>

        {/* Trend + Engagement */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Real-time tally
                </div>
                <div className="mt-1 font-display text-2xl">Votes over the last 24 hours</div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-sage">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" /> Live
              </div>
            </div>
            <Sparkline data={trend} />
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Wards won" value={stats.wardsWon.toString()} />
              <MiniStat label="Endorsements" value={stats.endorsements.toString()} />
              <MiniStat label="Profile views" value={stats.views.toLocaleString()} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Community engagement
            </div>
            <div className="mt-1 font-display text-2xl">On M-Taji</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Manifesto, projects and receipts live on the candidate's public M-Taji profile.
            </p>

            <ul className="mt-4 space-y-3 text-sm">
              <EngagementRow icon={Eye} label="Profile views" value={stats.views.toLocaleString()} />
              <EngagementRow
                icon={Heart}
                label="Endorsements"
                value={stats.endorsements.toString()}
              />
              <EngagementRow
                icon={MessageSquare}
                label="Messages"
                value={stats.messages.toString()}
              />
              <EngagementRow icon={Users} label="Followers" value={(stats.views * 0.06 | 0).toString()} />
            </ul>

            <a
              href={mtajiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ink/90"
            >
              Open on M-Taji <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              {MTAJI_BASE.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>

        {/* Peer race */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Race context
              </div>
              <div className="mt-1 font-display text-2xl">Head to head vs peers</div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {candidate.tier}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <PeerRow
              name={candidate.full_name}
              subtitle={candidate.position_title}
              share={stats.share}
              highlighted
            />
            {peers.map((p) => {
              const peerStats = buildStats(p, tick);
              return (
                <PeerRow
                  key={p.id}
                  name={p.full_name}
                  subtitle={p.position_title}
                  share={peerStats.share}
                />
              );
            })}
            {peers.length === 0 && (
              <p className="text-xs text-muted-foreground">No peer data yet for this race.</p>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Vote;
  tone: "primary" | "sage" | "accent";
}) {
  const toneClass =
    tone === "sage"
      ? "border-sage/30 bg-sage/5 text-sage"
      : tone === "accent"
        ? "border-accent/30 bg-accent/5 text-accent"
        : "border-primary/30 bg-primary/5 text-primary";
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-3xl tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="font-display text-lg tabular-nums text-ink">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function EngagementRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-display text-lg tabular-nums text-ink">{value}</span>
    </li>
  );
}

function PeerRow({
  name,
  subtitle,
  share,
  highlighted,
}: {
  name: string;
  subtitle: string;
  share: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlighted ? "border-primary/40 bg-primary/5" : "border-border bg-background/40"
      }`}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="min-w-0">
          <div className={`truncate font-medium ${highlighted ? "text-primary" : "text-ink"}`}>
            {highlighted ? "You · " : ""}
            {name}
          </div>
          <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </div>
        </div>
        <div className="ml-3 font-display text-lg tabular-nums text-ink">{share}%</div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${highlighted ? "bg-gradient-gold" : "bg-primary/50"}`}
          style={{ width: `${Math.min(100, share)}%` }}
        />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 600;
  const h = 140;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - v * h}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background/40">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#sparkFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--gold))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
