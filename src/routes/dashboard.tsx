import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
  MapPin,
  ShieldCheck,
  Trophy,
  UserCircle2,
  Vote,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseVotersEnabled, isSupabaseVotingEnabled } from "@/lib/feature-flags";
import { TIER_META, type Position, type Tier } from "@/lib/tier-meta";
import { CANDIDATES, POSITIONS } from "@/lib/mym-data";
import { fetchPositions } from "@/lib/positions-source";
import { checkEligibility, fetchMyVotes, useVoteActions } from "@/lib/votes-source";
import { listCandidatesByPosition } from "@/lib/api/election-candidates";
import { getMyCandidatePositionIds } from "@/lib/candidates";
import type { ElectionCandidate } from "@/lib/tier-meta";
import {
  getMyVote as getMyVoteLocal,
  tallyPosition as tallyPositionLocal,
} from "@/lib/voter-store";
import { signOutVoter, useVoter, voterIdDisplay } from "@/lib/voters-source";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My dashboard — MY-KDM Vote" },
      {
        name: "description",
        content:
          "Your MY-KDM voter dashboard: registration details, ballot history and eligible positions.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const supabaseMode = isSupabaseVotersEnabled();
  const supabaseVoting = isSupabaseVotingEnabled();
  const { voter, ready } = useVoter();
  const { tallyPosition } = useVoteActions();
  const [positions, setPositions] = useState<Position[]>(POSITIONS);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [tallies, setTallies] = useState<Record<string, { candidateId: string; votes: number }[]>>(
    {},
  );
  const [candidateCards, setCandidateCards] = useState<Record<string, ElectionCandidate>>({});
  const [vyingPositions, setVyingPositions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabaseMode || !ready) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: { redirect: "/dashboard" } });
    });
  }, [supabaseMode, ready, navigate]);

  useEffect(() => {
    fetchPositions()
      .then(setPositions)
      .catch(() => setPositions(POSITIONS));
  }, []);

  useEffect(() => {
    if (!supabaseVoting) return;
    let cancelled = false;
    getMyCandidatePositionIds()
      .then((set) => {
        if (!cancelled) setVyingPositions(set);
      })
      .catch(() => {
        if (!cancelled) setVyingPositions(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [supabaseVoting]);

  useEffect(() => {
    if (!voter) {
      setMyVotes({});
      return;
    }
    if (supabaseVoting) {
      void fetchMyVotes(voter).then((rows) => {
        const map: Record<string, string> = {};
        for (const row of rows) map[row.positionId] = row.candidateId;
        setMyVotes(map);
      });
      return;
    }
    const map: Record<string, string> = {};
    for (const p of positions) {
      const id = getMyVoteLocal(p.id, voter.id);
      if (id) map[p.id] = id;
    }
    setMyVotes(map);
  }, [voter, positions, supabaseVoting]);

  useEffect(() => {
    if (!voter || Object.keys(myVotes).length === 0) {
      setTallies({});
      return;
    }
    const load = async () => {
      const next: Record<string, { candidateId: string; votes: number }[]> = {};
      const cards: Record<string, ElectionCandidate> = {};
      for (const positionId of Object.keys(myVotes)) {
        if (supabaseVoting) {
          const [tally, candidates] = await Promise.all([
            tallyPosition(positionId),
            listCandidatesByPosition(positionId),
          ]);
          next[positionId] = tally;
          const picked = candidates.find((c) => c.id === myVotes[positionId]);
          if (picked) cards[positionId] = picked;
        } else {
          next[positionId] = tallyPositionLocal(positionId);
          const picked = CANDIDATES.find((c) => c.id === myVotes[positionId]);
          if (picked) cards[positionId] = picked;
        }
      }
      setTallies(next);
      setCandidateCards(cards);
    };
    void load();
  }, [myVotes, supabaseVoting, tallyPosition, voter]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!voter) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <UserCircle2 className="mx-auto h-14 w-14 text-muted-foreground" />
          <h1 className="mt-4 font-display text-4xl">
            <span className="text-ink">Register to see your</span>{" "}
            <span className="text-gradient-gold">dashboard</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Your MY-KDM dashboard shows your registration, ballot history and the positions you're
            eligible to vote on. Register in under a minute to unlock it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-gradient-gold" asChild>
              <Link to={supabaseMode ? "/auth" : "/register"}>
                {supabaseMode ? "Sign in to register" : "Register to vote"}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const votedIds = Object.keys(myVotes);
  const eligiblePositions = positions.filter(
    (p) => checkEligibility(voter, p, vyingPositions).eligible,
  );
  const pendingPositions = eligiblePositions.filter((p) => !votedIds.includes(p.id));
  const votedPositions = eligiblePositions.filter((p) => votedIds.includes(p.id));
  const turnoutPct = eligiblePositions.length
    ? Math.round((votedPositions.length / eligiblePositions.length) * 100)
    : 0;

  const logout = async () => {
    await signOutVoter();
    window.dispatchEvent(new Event("mym:voter-changed"));
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Header */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-gold font-display text-2xl text-primary-foreground shadow-md">
                {voter.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-primary">
                  Registered voter · MY-KDM 2026
                </div>
                <h1 className="mt-1 font-display text-3xl md:text-4xl">
                  <span className="text-ink">Karibu,</span>{" "}
                  <span className="text-gradient-gold">{voter.name.split(" ")[0]}</span>
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {voter.ward}, {voter.constituency},{" "}
                    {voter.county}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-sage" /> ID •••{voterIdDisplay(voter)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/elections">
                  <Vote className="mr-2 h-4 w-4" /> Voting hall
                </Link>
              </Button>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Ballots cast"
              value={votedPositions.length.toString()}
              icon={CheckCircle2}
              tone="sage"
            />
            <StatCard
              label="Eligible ballots"
              value={eligiblePositions.length.toString()}
              icon={Vote}
              tone="primary"
            />
            <StatCard label="Your turnout" value={`${turnoutPct}%`} icon={Trophy} tone="accent" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Ballot history */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                My ballot history
              </div>
              <div className="mt-1 font-display text-2xl">Votes you've cast</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {votedPositions.length} of {eligiblePositions.length}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {votedPositions.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                You haven't cast a vote yet. Head to the{" "}
                <Link to="/elections" className="font-medium text-primary hover:underline">
                  voting hall
                </Link>{" "}
                to begin.
              </div>
            )}

            {votedPositions.map((position) => {
              const myCandidateId = myVotes[position.id];
              const cand =
                candidateCards[position.id] ?? CANDIDATES.find((c) => c.id === myCandidateId);
              const tally = tallies[position.id] ?? [];
              const total = tally.reduce((s, r) => s + r.votes, 0);
              const rank = cand ? tally.findIndex((r) => r.candidateId === cand.id) + 1 : 0;
              const myCandidateVotes = cand
                ? (tally.find((r) => r.candidateId === cand.id)?.votes ?? 0)
                : 0;
              const pct = total > 0 ? Math.round((myCandidateVotes / total) * 100) : 0;
              const isLeader = rank === 1 && total > 0;

              return (
                <Link
                  key={position.id}
                  to="/elections/$positionId"
                  params={{ positionId: position.id }}
                  className="group flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/40 p-4 transition hover:border-primary/40 hover:bg-background"
                >
                  {cand && <CandidateAvatar candidate={cand} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                      {TIER_META[position.tier as Tier].label} · {position.scope}
                    </div>
                    <div className="mt-0.5 truncate font-medium">{position.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      You voted for{" "}
                      <span className="font-semibold text-foreground">{cand?.name ?? "—"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-display text-lg text-primary tabular-nums">{pct}%</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        {isLeader ? "Leading" : `Rank #${rank || "—"}`}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending ballots */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Still to vote
          </div>
          <div className="mt-1 font-display text-2xl">Your open ballots</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Positions you're eligible to vote on — based on your registered ward and county.
          </p>

          <div className="mt-5 space-y-2">
            {pendingPositions.length === 0 && (
              <div className="rounded-xl border border-dashed border-sage/40 bg-sage/5 p-6 text-center text-sm text-sage">
                <CheckCircle2 className="mx-auto mb-2 h-5 w-5" />
                You've voted in every ballot you're eligible for. Asante!
              </div>
            )}

            {pendingPositions.map((p) => (
              <Link
                key={p.id}
                to="/elections/$positionId"
                params={{ positionId: p.id }}
                className="group flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3 transition hover:border-primary/40 hover:bg-background"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Vote className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {TIER_META[p.tier as Tier].label} · {p.scope}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Vote;
  tone: "sage" | "primary" | "accent";
}) {
  const toneClass =
    tone === "sage"
      ? "text-sage border-sage/30 bg-sage/5"
      : tone === "accent"
        ? "text-accent border-accent/30 bg-accent/5"
        : "text-primary border-primary/30 bg-primary/5";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-display text-3xl tabular-nums text-foreground">{value}</div>
    </div>
  );
}
