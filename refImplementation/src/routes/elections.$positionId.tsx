import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Lock, ShieldCheck, Vote } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { CandidateAvatar } from "@/components/candidate-avatar";
import { CANDIDATES, POSITIONS } from "@/lib/mym-data";
import { DATE_FMT, pollStatus, regionForCounty, useNow } from "@/lib/election-schedule";
import {
  castVote,
  eligibilityReason,
  getMyVote,
  getVoter,
  isEligible,
  tallyPosition,
} from "@/lib/voter-store";


export const Route = createFileRoute("/elections/$positionId")({
  loader: ({ params }) => {
    const position = POSITIONS.find((p) => p.id === params.positionId);
    if (!position) throw notFound();
    return { position };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.position.title ?? "Position"} — MY-KDM Vote` },
      { name: "description", content: loaderData?.position.description ?? "Cast your vote on the MY-KDM ballot." },
    ],
  }),
  component: PositionPage,
});

function PositionPage() {
  const { position } = Route.useLoaderData();
  const navigate = useNavigate();
  const [voter, setVoter] = useState(() => getVoter());
  const [selected, setSelected] = useState<string | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [tally, setTally] = useState(() => tallyPosition(position.id));
  const [submitting, setSubmitting] = useState(false);

  const candidates = CANDIDATES.filter((c) => c.positionId === position.id);
  const totalVotes = tally.reduce((s, r) => s + r.votes, 0);

  useEffect(() => {
    const v = getVoter();
    setVoter(v);
    if (v) {
      const existing = getMyVote(position.id, v.id);
      setMyVote(existing);
      setSelected(existing);
    }
    setTally(tallyPosition(position.id));
  }, [position.id]);

  const eligible = isEligible(voter, position);
  const reason = eligibilityReason(voter, position);

  const now = useNow();
  const voterRegion = voter ? regionForCounty(voter.county) : undefined;
  const regionStatus = voterRegion ? pollStatus(voterRegion, now) : undefined;
  const pollsOpen = regionStatus === "open";

  const handleSubmit = () => {
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
    setTimeout(() => {
      castVote(position.id, voter.id, selected);
      setMyVote(selected);
      setTally(tallyPosition(position.id));
      window.dispatchEvent(new Event("mym:votes-changed"));
      setSubmitting(false);
      toast.success("Your vote has been recorded", {
        description: `Encrypted receipt saved to your device.`,
      });
    }, 500);
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
                {totalVotes.toLocaleString()} total votes on this position
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {voter && !eligible && (
          <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-200">
                You cannot vote on this ballot
              </div>
              <div className="text-amber-700 dark:text-amber-300">
                {reason}. You're registered in{" "}
                <span className="font-medium">
                  {voter.ward}, {voter.constituency}, {voter.county}
                </span>
                . You can still view the candidates and live tally.
              </div>
            </div>
          </div>
        )}
        {voter && voterRegion && regionStatus !== "open" && (
          <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-flag-red/40 bg-flag-red/10 p-4 text-sm">
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
        )}
        <div className="grid gap-4">

          {candidates.map((c) => {
            const votes = tally.find((t) => t.candidateId === c.id)?.votes ?? 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const active = selected === c.id;
            const isMyVote = myVote === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/[0.06] shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <CandidateAvatar candidate={c} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl">{c.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {c.age} yrs · {c.county}
                      </span>
                      {isMyVote && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-semibold text-sage">
                          <CheckCircle2 className="h-3 w-3" /> Your vote
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-primary">"{c.slogan}"</div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.bio}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{votes.toLocaleString()} vote{votes === 1 ? "" : "s"}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-gold transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                      active ? "border-primary bg-primary" : "border-border bg-background"
                    }`}
                  >
                    {active && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
            <div className="text-sm">
              {selected ? (
                <>
                  Selected:{" "}
                  <span className="font-semibold">
                    {candidates.find((c) => c.id === selected)?.name}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Select a candidate to continue</span>
              )}
            </div>
            <div className="flex gap-2">
              {!voter && (
                <Button variant="outline" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={
                  !selected ||
                  submitting ||
                  (myVote !== null && myVote === selected) ||
                  (voter !== null && !eligible) ||
                  (voter !== null && !pollsOpen)
                }
                className="bg-gradient-gold"
                size="lg"
              >
                {submitting ? (
                  "Encrypting…"
                ) : voter && !eligible ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> Not eligible
                  </>
                ) : voter && !pollsOpen ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />{" "}
                    {regionStatus === "upcoming" && voterRegion
                      ? `Opens ${DATE_FMT.format(new Date(voterRegion.date))}`
                      : "Voting closed"}
                  </>
                ) : myVote ? (
                  myVote === selected ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Vote recorded
                    </>
                  ) : (
                    <>Change vote</>
                  )
                ) : (
                  <>
                    <Vote className="mr-2 h-4 w-4" /> Cast vote
                  </>
                )}
              </Button>

            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
