import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Lock, Search, Vote } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  type Voter,
} from "@/lib/voter-store";

export const Route = createFileRoute("/elections/candidates/$positionId")({
  loader: ({ params }) => {
    const position = POSITIONS.find((p) => p.id === params.positionId);
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
  const [, tick] = useState(0);
  const [voter, setVoter] = useState<Voter | null>(() => getVoter());
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onChange = () => tick((n) => n + 1);
    const onVoter = () => setVoter(getVoter());
    window.addEventListener("mym:votes-changed", onChange);
    window.addEventListener("mym:voter-changed", onVoter);
    return () => {
      window.removeEventListener("mym:votes-changed", onChange);
      window.removeEventListener("mym:voter-changed", onVoter);
    };
  }, []);

  const now = useNow();
  const voterRegion = voter ? regionForCounty(voter.county) : undefined;
  const pollsOpen = voterRegion ? pollStatus(voterRegion, now) === "open" : false;

  const candidates = useMemo(
    () => CANDIDATES.filter((c) => c.positionId === position.id),
    [position.id],
  );
  const rows = tallyPosition(position.id);
  const total = rows.reduce((s, r) => s + r.votes, 0);
  const myVote = voter ? getMyVote(position.id, voter.id) : null;
  const eligible = isEligible(voter, position);
  const reason = eligibilityReason(voter, position);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.county.toLowerCase().includes(q) ||
          c.slogan.toLowerCase().includes(q),
      )
    : candidates;

  const handleVote = (candidateId: string) => {
    if (!voter) {
      toast.error("Please register first to cast a vote.");
      navigate({ to: "/register" });
      return;
    }
    if (!pollsOpen) {
      toast.error("Voting isn't open yet", {
        description: voterRegion
          ? `Your county's polls open on ${DATE_FMT.format(new Date(voterRegion.date))}, 08:00–18:00 EAT.`
          : "This region's polling window is not open.",
      });
      return;
    }
    if (!eligible) {
      toast.error("You can't vote here", { description: reason ?? "Not eligible." });
      return;
    }
    const existing = getMyVote(position.id, voter.id);
    castVote(position.id, voter.id, candidateId);
    window.dispatchEvent(new Event("mym:votes-changed"));
    const cand = CANDIDATES.find((c) => c.id === candidateId);
    toast.success(existing ? "Vote updated" : "Vote recorded", {
      description: `${cand?.name} — ${position.title}.`,
    });
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
            {position.scope} · {candidates.length} candidates · {total.toLocaleString()} votes counted
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
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No candidates match "{search}".
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const row = rows.find((r) => r.candidateId === c.id);
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
                      onClick={() => handleVote(c.id)}
                      disabled={!!voter && (!eligible || isMine || !pollsOpen)}
                    >
                      {isMine ? (
                        <><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Voted</>
                      ) : voter && !pollsOpen ? (
                        <><Clock className="mr-1 h-3.5 w-3.5" /> {voterRegion ? DATE_FMT.format(new Date(voterRegion.date)) : "Closed"}</>
                      ) : voter && !eligible ? (
                        <><Lock className="mr-1 h-3.5 w-3.5" /> Locked</>
                      ) : (
                        <><Vote className="mr-1 h-3.5 w-3.5" /> Vote</>
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
