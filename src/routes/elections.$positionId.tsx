import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Lock, ShieldCheck, Vote } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { CandidateAvatar } from "@/components/candidate-avatar";
import {
  DATE_FMT,
  ELECTION_WINDOW_END,
  ELECTION_WINDOW_START,
  pollStatus,
  regionForCounty,
  useNow,
} from "@/lib/election-schedule";
import { useVoter } from "@/lib/voters-source";
import { getPositionById } from "@/lib/positions-source";
import { listCandidatesByPosition } from "@/lib/api/election-candidates";
import { checkEligibility, usePositionTally, useVoteActions } from "@/lib/votes-source";
import { useSupabaseReferenceData, useSupabaseVoting } from "@/lib/feature-flags";
import { getMyCandidatePositionIds } from "@/lib/candidates";
import { CANDIDATES } from "@/lib/mym-data";
import type { ElectionCandidate } from "@/lib/tier-meta";

export const Route = createFileRoute("/elections/$positionId")({
  loader: async ({ params }) => {
    const position = await getPositionById(params.positionId);
    if (!position) throw notFound();
    return { position };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.position.title ?? "Position"} — MY-KDM Vote` },
      {
        name: "description",
        content: loaderData?.position.description ?? "Cast your vote on the MY-KDM ballot.",
      },
    ],
  }),
  component: PositionPage,
});

function PositionPage() {
  const { position } = Route.useLoaderData();
  const navigate = useNavigate();
  const { voter } = useVoter();
  const { castVote, getMyVote } = useVoteActions();
  const tally = usePositionTally(position.id);
  const supabaseRef = useSupabaseReferenceData();
  const supabaseVoting = useSupabaseVoting();
  const [selected, setSelected] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [vyingPositions, setVyingPositions] = useState<Set<string>>(new Set());

  const totalVotes = tally.reduce((s, r) => s + r.votes, 0);

  useEffect(() => {
    if (!supabaseRef) {
      setCandidates(CANDIDATES.filter((c) => c.positionId === position.id));
      return;
    }
    listCandidatesByPosition(position.id)
      .then(setCandidates)
      .catch(() => setCandidates([]));
  }, [position.id, supabaseRef]);

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
      setMyVote(null);
      setSelected(null);
      return;
    }
    void getMyVote(position.id).then((id) => {
      setMyVote(id);
      setSelected(id);
    });
  }, [position.id, voter, getMyVote]);

  const { eligible, reason } = checkEligibility(voter, position, vyingPositions);

  const now = useNow();
  const voterRegion = voter ? regionForCounty(voter.county) : undefined;
  const regionStatus = voterRegion ? pollStatus(voterRegion, now) : undefined;
  const pollsOpen = regionStatus === "open";

  const handleSubmit = async () => {
    if (!voter) {
      navigate({ to: "/register" });
      return;
    }
    if (!eligible) {
      toast.error("You can't vote here", { description: reason ?? "Not eligible." });
      return;
    }
    if (!selected) {
      toast.error("Choose a candidate first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await castVote(position.id, selected);
      setMyVote(selected);
      toast.success("Your vote has been recorded", {
        description: `Encrypted receipt ${result.receiptCode} saved.`,
      });
    } catch (e) {
      toast.error("Could not record vote", {
        description: e instanceof Error ? e.message : "Try again shortly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <Link
            to="/elections"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ballot
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary">{position.scope}</div>
              <h1 className="mt-1 font-display text-4xl md:text-5xl">{position.title}</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">{position.description}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sage" />
                {myVote ? (
                  <span className="font-semibold text-sage">Your vote is recorded</span>
                ) : voter ? (
                  <span>Ready to cast your vote</span>
                ) : (
                  <span>Register to vote</span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {totalVotes.toLocaleString()} vote{totalVotes === 1 ? "" : "s"} counted
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {!voter ? (
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
            <p className="text-muted-foreground">Register on the voter roll to cast your ballot.</p>
            <Button className="mt-4 bg-gradient-gold" asChild>
              <Link to="/register">Register to vote</Link>
            </Button>
          </div>
        ) : !eligible ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Not eligible for this seat
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{reason}</p>
          </div>
        ) : !pollsOpen ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Polls are not open for your county
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {voterRegion
                ? `Your region (${voterRegion.region}) is ${regionStatus ?? "scheduled"}.`
                : "Check the election schedule."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {candidates.map((c) => {
                const votes = tally.find((t) => t.candidateId === c.id)?.votes ?? 0;
                const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                const isSelected = selected === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelected(c.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <CandidateAvatar candidate={c} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-display text-lg">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.slogan}</div>
                          </div>
                          <div className="text-right text-sm tabular-nums">
                            <div className="font-semibold">{votes.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">{pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-gold transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Poll day schedule uses IEBC county groupings ·{" "}
                {DATE_FMT.format(new Date(ELECTION_WINDOW_START))} –{" "}
                {DATE_FMT.format(new Date(ELECTION_WINDOW_END))} 2026
              </p>
              <Button
                size="lg"
                className="bg-gradient-gold"
                disabled={submitting || !selected}
                onClick={() => void handleSubmit()}
              >
                <Vote className="mr-2 h-4 w-4" />
                {myVote ? "Change my vote" : "Cast vote"}
              </Button>
            </div>
          </>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
