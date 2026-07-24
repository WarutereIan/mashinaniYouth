import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Lock, Search, Vote } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { DATE_FMT, isPollingOpen, regionForCounty, useNow, usePollSchedule } from "@/lib/election-schedule";
import { useVoter } from "@/lib/voters-source";
import { getPositionById } from "@/lib/positions-source";
import { listCandidatesByPosition } from "@/lib/api/election-candidates";
import { checkEligibility, isPositionInVoterLocale, usePositionTally, useVoteActions } from "@/lib/votes-source";
import { getMyCandidatePositionIds } from "@/lib/candidates";
import type { ElectionCandidate } from "@/lib/tier-meta";

export const Route = createFileRoute("/elections/candidates/$positionId")({
  loader: async ({ params }) => {
    const position = await getPositionById(params.positionId);
    if (!position) throw notFound();
    return { position };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `All candidates — ${loaderData?.position.title ?? "Position"} — MY-KDM` },
      {
        name: "description",
        content: `Browse every candidate contesting the ${loaderData?.position.title ?? ""} seat.`,
      },
    ],
  }),
  component: AllCandidatesPage,
});

function AllCandidatesPage() {
  const { position } = Route.useLoaderData();
  const navigate = useNavigate();
  const { voter } = useVoter();
  const { castVote, getMyVote } = useVoteActions();
  const tally = usePositionTally(position.id);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [vyingPositions, setVyingPositions] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { schedule, cyclePhase } = usePollSchedule();

  useEffect(() => {
    listCandidatesByPosition(position.id)
      .then(setCandidates)
      .catch(() => setCandidates([]));
  }, [position.id]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!voter) {
      setMyVote(null);
      return;
    }
    void getMyVote(position.id).then(setMyVote);
  }, [position.id, voter, getMyVote]);

  const now = useNow();
  const voterRegion = voter ? regionForCounty(voter.county, schedule) : undefined;
  const pollsOpen = isPollingOpen({
    tier: position.tier,
    voterCounty: voter?.county,
    schedule,
    now,
    cyclePhase,
  });

  const { eligible, reason } = checkEligibility(voter, position, vyingPositions);
  const inLocale = !voter || isPositionInVoterLocale(voter, position);

  const total = tally.reduce((s, r) => s + r.votes, 0);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? candidates.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.county.toLowerCase().includes(q) ||
              c.slogan.toLowerCase().includes(q),
          )
        : candidates,
    [candidates, q],
  );

  const handleVote = async (candidateId: string) => {
    if (!voter) {
      toast.error("Please register first to cast a vote.");
      navigate({ to: "/register" });
      return;
    }
    if (!pollsOpen) {
      toast.error("Voting isn't open yet", {
        description:
          position.tier === "national"
            ? "National polls are not open at this time."
            : voterRegion
              ? `Your county's polls open on ${DATE_FMT.format(new Date(voterRegion.date))}, 08:00–18:00 EAT.`
              : "This region's polling window is not open.",
      });
      return;
    }
    if (!eligible) {
      toast.error("You can't vote here", { description: reason ?? "Not eligible." });
      return;
    }
    const existing = myVote;
    try {
      const receipt = await castVote(position.id, candidateId);
      setMyVote(candidateId);
      const cand = candidates.find((c) => c.id === candidateId);
      toast.success(existing ? "Vote updated" : "Vote recorded", {
        description: `${cand?.name ?? "Candidate"} — ${position.title}. Receipt: ${receipt.receiptCode}.`,
      });
    } catch (e) {
      toast.error("Vote failed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
            <Link to="/elections">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to elections
            </Link>
          </Button>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-flag-red">
            All candidates
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">{position.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {position.scope} · {candidates.length} candidates · {total.toLocaleString()} votes
            counted
          </p>
        </div>
      </section>

      <div className="sticky top-14 z-20 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, county or slogan…"
              className="h-10 pl-8"
            />
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {filtered.length} of {candidates.length}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {voter && !inLocale ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Outside your registered area
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This seat is not on your ballot. Your registration: {voter.ward}, {voter.constituency},{" "}
              {voter.county}.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link to="/elections">Back to your ballots</Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {candidates.length === 0 ? "No candidates yet." : `No candidates match "${search}".`}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const row = tally.find((r) => r.candidateId === c.id);
              const votes = row?.votes ?? 0;
              const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
              const isMine = myVote === c.id;
              return (
                <div
                  key={c.id}
                  className={`flex flex-col rounded-2xl border p-4 transition ${
                    isMine
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:bg-background/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CandidateAvatar candidate={c} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-base">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.county} · age {c.age}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg tabular-nums text-primary">{pct}%</div>
                      <div className="text-[10px] tabular-nums text-muted-foreground">
                        {votes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm italic text-muted-foreground">
                    "{c.slogan}"
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground/80">{c.bio}</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        navigate({
                          to: "/elections/$positionId",
                          params: { positionId: position.id },
                        })
                      }
                    >
                      View profile
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-gold"
                      onClick={() => void handleVote(c.id)}
                      disabled={!!voter && (!eligible || isMine || !pollsOpen)}
                    >
                      {isMine ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Voted
                        </>
                      ) : voter && !pollsOpen ? (
                        <>
                          <Clock className="mr-1 h-3.5 w-3.5" />{" "}
                          {voterRegion ? DATE_FMT.format(new Date(voterRegion.date)) : "Closed"}
                        </>
                      ) : voter && !eligible ? (
                        <>
                          <Lock className="mr-1 h-3.5 w-3.5" /> Locked
                        </>
                      ) : (
                        <>
                          <Vote className="mr-1 h-3.5 w-3.5" /> Vote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
