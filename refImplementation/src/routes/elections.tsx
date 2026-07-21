import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Lock,
  Radio,
  Search,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  Vote,
  ExternalLink,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationTierBar } from "@/components/location-tier-bar";
import { ElectionSchedule } from "@/components/election-schedule";
import { CANDIDATES, POSITIONS, TIER_META, type Tier } from "@/lib/mym-data";
import { DATE_FMT, pollStatus, regionForCounty, useNow } from "@/lib/election-schedule";
import {
  castVote,
  eligibilityReason,
  getMyVote,
  getVoter,
  isEligible,
  tallyPosition,
  totalVotesByPosition,
  totalVotesCast,
  type Voter,
} from "@/lib/voter-store";


export const Route = createFileRoute("/elections")({
  head: () => ({
    meta: [
      { title: "Elections — MY-KDM Vote" },
      {
        name: "description",
        content:
          "The live MY-KDM electronic ballot: cast your vote and watch real-time tallies for County, Constituency and Ward positions.",
      },
    ],
  }),
  component: ElectionsPage,
});

// Fallback position per tier — used to render candidate rows when the
// selected location has no dedicated position in mym-data.
const TIER_FALLBACK_POSITION: Record<Tier, string> = {
  national: "national-chair",
  county: "governor-nairobi",
  constituency: "constituency-kibra",
  ward: "ward-kibra",
};

function ElectionsPage() {
  const navigate = useNavigate();
  const [, tick] = useState(0);
  const [voter, setVoter] = useState<Voter | null>(() => getVoter());
  const [activeTier, setActiveTier] = useState<Tier>("county");
  const [county, setCounty] = useState<string>(voter?.county ?? "Nairobi");
  const [constituency, setConstituency] = useState<string>(voter?.constituency ?? "Kibra");
  const [ward, setWard] = useState<string>(voter?.ward ?? "Kibra Central");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const onChange = () => tick((n) => n + 1);
    const onVoter = () => setVoter(getVoter());
    window.addEventListener("mym:votes-changed", onChange);
    window.addEventListener("mym:voter-changed", onVoter);
    const iv = setInterval(onChange, 3000);
    return () => {
      window.removeEventListener("mym:votes-changed", onChange);
      window.removeEventListener("mym:voter-changed", onVoter);
      clearInterval(iv);
    };
  }, []);

  const scopeLabel =
    activeTier === "county"
      ? `${county} County`
      : activeTier === "constituency"
        ? `${constituency}, ${county}`
        : `${ward} — ${constituency}, ${county}`;

  const scopeKey =
    activeTier === "county"
      ? county
      : activeTier === "constituency"
        ? `${county}|${constituency}`
        : `${county}|${constituency}|${ward}`;

  const activePosition = useMemo(() => {
    const tierPositions = POSITIONS.filter((p) => p.tier === activeTier);
    const matched = tierPositions.find((p) => {
      if (activeTier === "county") return p.county === county;
      if (activeTier === "constituency")
        return p.county === county && p.constituency === constituency;
      return p.county === county && p.constituency === constituency && p.ward === ward;
    });
    return (
      matched ??
      tierPositions.find((p) => p.id === TIER_FALLBACK_POSITION[activeTier]) ??
      tierPositions[0]
    );
  }, [activeTier, county, constituency, ward]);

  const positionTitle =
    activeTier === "county"
      ? `County Youth Governor — ${county}`
      : activeTier === "constituency"
        ? `Constituency Youth Rep — ${constituency}`
        : `Ward Representative — ${ward}`;

  const rows = activePosition ? tallyPosition(activePosition.id) : [];
  const positionCandidates = activePosition
    ? CANDIDATES.filter((c) => c.positionId === activePosition.id)
    : [];
  const positionTotal = rows.reduce((s, r) => s + r.votes, 0);
  const leaderRow = rows[0];
  const leaderCand = leaderRow ? CANDIDATES.find((c) => c.id === leaderRow.candidateId) : null;

  const q = search.trim().toLowerCase();
  const filteredCandidates = q
    ? positionCandidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.county.toLowerCase().includes(q) ||
          c.slogan.toLowerCase().includes(q),
      )
    : positionCandidates;

  const totalCast = totalVotesCast();
  const perPosition = totalVotesByPosition();
  const activePositions = Object.keys(perPosition).length;
  const registered = voter ? 1 : 0;
  const turnout = registered > 0 ? Math.min(100, (totalCast / registered) * 100) : 0;

  const [registerOpen, setRegisterOpen] = useState(false);

  const myVote = voter && activePosition ? getMyVote(activePosition.id, voter.id) : null;
  const eligibleHere = activePosition ? isEligible(voter, activePosition) : false;
  const ineligibleReason = activePosition ? eligibilityReason(voter, activePosition) : null;

  const now = useNow();
  const voterRegion = voter ? regionForCounty(voter.county) : undefined;
  const regionStatus = voterRegion ? pollStatus(voterRegion, now) : undefined;
  const pollsOpen = regionStatus === "open";

  const handleQuickVote = (candidateId: string) => {
    if (!voter) {
      setRegisterOpen(true);
      return;
    }
    if (!activePosition) return;
    if (!pollsOpen) {
      toast.error("Voting isn't open yet", {
        description: voterRegion
          ? `Your county's polls open on ${DATE_FMT.format(new Date(voterRegion.date))}, 08:00–18:00 EAT.`
          : "This region's polling window is not open.",
      });
      return;
    }
    if (!eligibleHere) {
      toast.error("You can't vote here", { description: ineligibleReason ?? "Not eligible." });
      return;
    }
    const existing = getMyVote(activePosition.id, voter.id);
    castVote(activePosition.id, voter.id, candidateId);
    window.dispatchEvent(new Event("mym:votes-changed"));
    const cand = CANDIDATES.find((c) => c.id === candidateId);
    toast.success(existing ? "Vote updated" : "Vote recorded", {
      description: `${cand?.name} — ${positionTitle}. Encrypted receipt saved.`,
    });
  };

  const goToBallot = () => {
    if (!activePosition) return;
    navigate({ to: "/elections/$positionId", params: { positionId: activePosition.id } });
  };


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Powered by M-Taji banner */}
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-xs text-muted-foreground">
          <span>Powered by</span>
          <a
            href="https://m-taji-tracker.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            M-Taji <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="inline-flex items-center gap-1 rounded bg-flag-red px-1.5 py-0.5 font-semibold text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
                </span>
                <span className="text-muted-foreground">Mashinani Youth Kazi Delivery Movement · Kenya</span>
              </div>
              <h1 className="mt-2 font-display text-3xl md:text-4xl">
                <span className="text-ink">2026 MY-KDM</span>{" "}
                <span className="text-gradient-gold">General</span>{" "}
                <span className="text-accent">Elections</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Cast your ballot and watch the tally stream from the M-Taji ballot store · voter-by-voter,
                in real time.
              </p>
            </div>
            <Button variant="outline" className="border-accent/60 bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground" asChild>
              <a href="https://m-taji-tracker.vercel.app/signup" target="_blank" rel="noopener noreferrer">
                Create profile on M-Taji <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Registered voters" value={registered.toLocaleString()} />
            <StatCard
              icon={BarChart3}
              label="Votes counted"
              value={totalCast.toLocaleString()}
              highlight
            />
            <StatCard icon={Activity} label="Positions active" value={activePositions.toLocaleString()} />
            <StatCard icon={Radio} label="Turnout" value={`${turnout.toFixed(0)}%`} />
          </div>
        </div>
      </section>

      <ElectionSchedule voterCounty={voter?.county ?? county} />

      <LocationTierBar
        activeTier={activeTier}
        setActiveTier={setActiveTier}
        county={county}
        setCounty={setCounty}
        constituency={constituency}
        setConstituency={setConstituency}
        ward={ward}
        setWard={setWard}
        homeLocation={
          voter ? { county: voter.county, constituency: voter.constituency, ward: voter.ward } : null
        }
        rightSlot={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate…"
              className="h-9 w-56 border-white/15 bg-white/5 pl-8 text-sm text-white placeholder:text-white/40 focus-visible:ring-primary/40"
            />
          </div>
        }
      />

      {voter && voterRegion && regionStatus !== "open" && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-flag-red" />
            <div>
              <div className="font-semibold text-flag-red">
                {regionStatus === "upcoming"
                  ? "Voting hasn't started for your county"
                  : "Voting has closed for your county"}
              </div>
              <div className="text-muted-foreground">
                Your county votes in the <span className="font-medium">{voterRegion.region}</span>{" "}
                region on <span className="font-medium">{DATE_FMT.format(new Date(voterRegion.date))}</span>
                . Polls are open 08:00–18:00 EAT.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-5">
          {/* Live tally */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Live tally · {TIER_META[activeTier].label}
                </div>
                <div className="mt-1 font-display text-2xl">{positionTitle}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {positionTotal.toLocaleString()} votes counted · scope: {scopeLabel}
                </div>
              </div>
              {leaderCand && positionTotal > 0 && (
                <div className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    Provisional leader
                  </div>
                  <div className="mt-1 font-display text-lg">{leaderCand.name}</div>
                  <div className="text-xs text-muted-foreground">{leaderCand.slogan}</div>
                </div>
              )}
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-flag-red via-primary to-accent"
                style={{
                  width: `${Math.min(100, (positionTotal / Math.max(1, positionCandidates.length * 1_000_000)) * 100 + 30)}%`,
                }}
              />
            </div>

            <div className="mt-5 space-y-2">
              {filteredCandidates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No candidates match "{search}".
                </div>
              ) : (
                filteredCandidates.map((c) => {
                  const row = rows.find((r) => r.candidateId === c.id);
                  const votes = row?.votes ?? 0;
                  const pct = positionTotal > 0 ? Math.round((votes / positionTotal) * 100) : 0;
                  const isLeader = leaderRow?.candidateId === c.id && positionTotal > 0;
                  return (
                    <div
                      key={c.id}
                      className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border px-4 py-3 transition ${
                        isLeader
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background/40 hover:bg-background/80"
                      }`}
                    >
                      <CandidateAvatar candidate={c} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {c.county} · age {c.age} · "{c.slogan}"
                        </div>
                      </div>
                      <div className="hidden w-24 text-right tabular-nums text-sm sm:block">
                        {votes.toLocaleString()}
                      </div>
                      <div className="w-12 text-right font-display text-sm tabular-nums text-primary">
                        {pct}%
                      </div>
                      <div className="flex w-full gap-2 sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hidden h-8 sm:inline-flex"
                          onClick={goToBallot}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-full bg-gradient-gold sm:w-auto"
                          onClick={() => handleQuickVote(c.id)}
                          disabled={!!voter && (!eligibleHere || myVote === c.id || !pollsOpen)}
                        >
                          {myVote === c.id ? (
                            <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Voted</>
                          ) : voter && !pollsOpen ? (
                            <><Clock className="mr-1 h-3.5 w-3.5" /> {voterRegion ? DATE_FMT.format(new Date(voterRegion.date)) : "Closed"}</>
                          ) : voter && !eligibleHere ? (
                            <><Lock className="mr-1 h-3.5 w-3.5" /> Locked</>
                          ) : (
                            <><Vote className="mr-1 h-3.5 w-3.5" /> Vote</>
                          )}
                        </Button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-flag-red" />
                Updated just now · live from M-Taji ballot servers
              </div>
              <Button variant="outline" asChild>
                <Link to="/candidates">
                  <Users className="mr-2 h-4 w-4" /> All candidates
                </Link>
              </Button>

            </div>
          </div>
        </div>


        {/* Scoped analytics row */}
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <VoteByGenderChart scopeKey={scopeKey} scopeLabel={scopeLabel} />
          <TurnoutByRegion scopeKey={scopeKey} scopeLabel={scopeLabel} tier={activeTier} />
          <AgeSplitPanel scopeKey={scopeKey} scopeLabel={scopeLabel} />
        </div>
      </section>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Register to cast your vote
            </DialogTitle>
            <DialogDescription>
              Only registered voters can cast a ballot. Register with your National ID —
              it takes less than a minute — then come back to vote for your candidate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Not now
            </Button>
            <Button variant="outline" asChild>
              <a href="https://m-taji-tracker.vercel.app/signup" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Create profile on M-Taji
              </a>
            </Button>
            <Button className="bg-gradient-gold" asChild>
              <Link to="/register">
                <UserPlus className="mr-2 h-4 w-4" /> Register to vote
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />

    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight ? "border-flag-red/30 bg-flag-red/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${highlight ? "text-flag-red" : "text-primary"}`} />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl tabular-nums">{value}</div>
    </div>
  );
}

/* ---------- Scoped analytics widgets ---------- */

// Deterministic 0..1 hash so numbers stay stable per scope but change per region.
function hashUnit(seed: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h >>> 0) / 0xffffffff;
}

function VoteByGenderChart({
  scopeKey,
  scopeLabel,
}: {
  scopeKey: string;
  scopeLabel: string;
}) {
  // Female share swings between 42% and 58% based on scope
  const female = Math.round(42 + hashUnit(scopeKey, 1) * 16);
  const male = 100 - female;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-base">Vote by gender</div>
          <div className="text-xs text-muted-foreground">Scope: {scopeLabel}</div>
        </div>
        <Users className="h-4 w-4 text-primary" />
      </div>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-flag-red/80"
          style={{ width: `${female}%` }}
          aria-label={`Female ${female}%`}
        />
        <div
          className="h-full bg-primary"
          style={{ width: `${male}%` }}
          aria-label={`Male ${male}%`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-flag-red">
            <span className="h-2 w-2 rounded-full bg-flag-red/80" /> Female
          </div>
          <div className="mt-1 font-display text-2xl tabular-nums">{female}%</div>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Male
          </div>
          <div className="mt-1 font-display text-2xl tabular-nums">{male}%</div>
        </div>
      </div>
    </div>
  );
}

function TurnoutByRegion({
  scopeKey,
  scopeLabel,
  tier,
}: {
  scopeKey: string;
  scopeLabel: string;
  tier: Tier;
}) {
  const heading =
    tier === "county"
      ? "Turnout by constituency"
      : tier === "constituency"
        ? "Turnout by ward"
        : "Turnout by polling stream";
  const labels =
    tier === "county"
      ? ["Central", "North", "South", "East", "West", "Coastal"]
      : tier === "constituency"
        ? ["Ward A", "Ward B", "Ward C", "Ward D", "Ward E"]
        : ["Stream 1", "Stream 2", "Stream 3", "Stream 4"];

  const rows = labels.map((name, i) => ({
    name,
    pct: Math.round(28 + hashUnit(scopeKey, i + 2) * 55),
  }));
  const peak = Math.max(...rows.map((r) => r.pct));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-base">{heading}</div>
          <div className="text-xs text-muted-foreground">Scope: {scopeLabel}</div>
        </div>
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const top = r.pct === peak;
          return (
            <div key={r.name}>
              <div className="flex justify-between text-xs">
                <span className={top ? "font-medium text-primary" : "text-foreground"}>{r.name}</span>
                <span className="tabular-nums text-muted-foreground">{r.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${top ? "bg-primary" : "bg-gradient-gold"}`}
                  style={{ width: `${r.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AGE_BANDS = ["18–20", "21–24", "25–29", "30–35"] as const;

function AgeSplitPanel({
  scopeKey,
  scopeLabel,
}: {
  scopeKey: string;
  scopeLabel: string;
}) {
  // Generate a distribution that sums to 100 per scope
  const weights = AGE_BANDS.map((_, i) => 15 + hashUnit(scopeKey, i + 20) * 25);
  const sum = weights.reduce((a, b) => a + b, 0);
  const rows = AGE_BANDS.map((band, i) => ({
    band,
    pct: Math.round((weights[i] / sum) * 100),
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-base">Voter age split</div>
            <div className="text-xs text-muted-foreground">Scope: {scopeLabel}</div>
          </div>
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-4 space-y-2">
          {rows.map((a) => (
            <div key={a.band}>
              <div className="flex justify-between text-xs">
                <span>{a.band}</span>
                <span className="tabular-nums text-muted-foreground">{a.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-accent" style={{ width: `${a.pct * 2}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          Voting channel
        </div>
        <div className="mt-1 font-display text-lg">100% via M-Taji app</div>
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          All ballots cast in-app · end-to-end encrypted
        </div>
      </div>
    </div>
  );
}

// Silence unused warning — kept for future analytics
void Trophy;
