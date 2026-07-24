import { useMemo, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DATE_FMT,
  TIME_FMT,
  diffParts,
  pollStatus,
  regionForCounty,
  useNow,
  usePollSchedule,
  type RegionSchedule,
} from "@/lib/election-schedule";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function ElectionSchedule({ voterCounty }: { voterCounty?: string | null }) {
  const now = useNow(1000);
  const { schedule, ready, error } = usePollSchedule();

  const myRegion = useMemo(
    () => (voterCounty ? regionForCounty(voterCounty, schedule) : undefined),
    [voterCounty, schedule],
  );

  const focus: RegionSchedule | undefined = useMemo(() => {
    if (!schedule.length) return undefined;
    if (myRegion) return myRegion;
    const upcoming = schedule.find((r) => new Date(r.closesAt).getTime() > now);
    return upcoming ?? schedule[0];
  }, [myRegion, now, schedule]);

  if (!ready) {
    return (
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-flag-red">
            Regional polling schedule
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Loading live schedule…</div>
        </div>
      </section>
    );
  }

  if (!focus || schedule.length === 0) {
    return (
      <section className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-flag-red">
            Regional polling schedule
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {error
              ? "Could not load the polling schedule from the server."
              : "No poll windows have been published for this election yet."}
          </div>
        </div>
      </section>
    );
  }

  const status = pollStatus(focus, now);
  const openMs = new Date(focus.opensAt).getTime();
  const closeMs = new Date(focus.closesAt).getTime();
  const target = status === "upcoming" ? openMs : status === "open" ? closeMs : closeMs;
  const parts = diffParts(target, now);

  const statusMeta =
    status === "open"
      ? { label: "Polls open", tone: "bg-flag-green text-white", cd: "Closes in" }
      : status === "upcoming"
        ? { label: "Upcoming", tone: "bg-flag-red text-white", cd: "Polls open in" }
        : { label: "Closed", tone: "bg-muted text-muted-foreground", cd: "Closed" };

  return (
    <section className="border-b border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-flag-red">
              <CalendarDays className="h-3.5 w-3.5" /> Regional polling schedule
            </div>
            <div className="mt-1 font-display text-xl sm:text-2xl">
              {myRegion
                ? `${focus.region} region votes ${DATE_FMT.format(new Date(focus.opensAt))}`
                : `Next up: ${focus.region} region · ${DATE_FMT.format(new Date(focus.opensAt))}`}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${statusMeta.tone}`}
              >
                {status === "open" && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                )}
                {statusMeta.label}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {TIME_FMT.format(new Date(focus.opensAt))}–
                {TIME_FMT.format(new Date(focus.closesAt))} EAT
              </span>
              {voterCounty && myRegion && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Your county: {voterCounty}
                </span>
              )}
            </div>
          </div>

          {status !== "closed" && (
            <div className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {statusMeta.cd}
              </div>
              <div className="mt-1 flex gap-2 font-display text-2xl tabular-nums text-ink sm:text-3xl">
                <TimeCell v={parts.days} label="d" />
                <span className="text-muted-foreground">:</span>
                <TimeCell v={parts.hours} label="h" />
                <span className="text-muted-foreground">:</span>
                <TimeCell v={parts.minutes} label="m" />
                <span className="text-muted-foreground">:</span>
                <TimeCell v={parts.seconds} label="s" />
              </div>
            </div>
          )}
        </div>

        <RegionCarousel now={now} schedule={schedule} myRegion={myRegion} focus={focus} />
      </div>
    </section>
  );
}

function RegionCarousel({
  now,
  schedule,
  myRegion,
  focus,
}: {
  now: number;
  schedule: RegionSchedule[];
  myRegion?: RegionSchedule;
  focus: RegionSchedule;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.9), behavior: "smooth" });
  };

  return (
    <div className="relative mt-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          All regions
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous regions"
            className="h-8 w-8"
            onClick={() => scrollBy(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next regions"
            className="h-8 w-8"
            onClick={() => scrollBy(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {schedule.map((r) => {
          const s = pollStatus(r, now);
          const isMine = myRegion?.region === r.region;
          const isFocus = focus.region === r.region;
          return (
            <div
              key={`${r.region}-${r.date}`}
              className={`w-[260px] shrink-0 snap-start rounded-xl border px-3 py-2.5 text-xs transition sm:w-[280px] ${
                isFocus
                  ? "border-primary/60 bg-primary/10"
                  : isMine
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-background/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-sm text-ink">{r.region}</div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    s === "open"
                      ? "bg-flag-green text-white"
                      : s === "upcoming"
                        ? "bg-flag-red/90 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s === "open" ? "Open" : s === "upcoming" ? "Upcoming" : "Closed"}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">
                {DATE_FMT.format(new Date(r.opensAt))} · {TIME_FMT.format(new Date(r.opensAt))}–
                {TIME_FMT.format(new Date(r.closesAt))} EAT
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/80">
                {r.counties.join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeCell({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex min-w-[2.5rem] flex-col items-center">
      <span>{pad(v)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
