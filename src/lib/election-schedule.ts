import { useEffect, useMemo, useState } from "react";
import { listPollWindows, getCyclePhase, type RegionSchedule } from "@/lib/api/schedule";
import type { Tier } from "@/lib/tier-meta";

export type { RegionSchedule };

export const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "Africa/Nairobi",
});
export const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Nairobi",
});

export function regionForCounty(
  county: string,
  schedule: RegionSchedule[],
): RegionSchedule | undefined {
  const norm = county.trim().toLowerCase();
  return schedule.find((r) =>
    r.counties.some((c: string) => c.toLowerCase() === norm),
  );
}

export type PollStatus = "upcoming" | "open" | "closed";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function diffParts(target: number, now: number): CountdownParts {
  const totalMs = Math.max(0, target - now);
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

export function pollStatus(
  schedule: Pick<RegionSchedule, "opensAt" | "closesAt">,
  now: number,
): PollStatus {
  const open = new Date(schedule.opensAt).getTime();
  const close = new Date(schedule.closesAt).getTime();
  if (now < open) return "upcoming";
  if (now > close) return "closed";
  return "open";
}

/** True when any regional poll window is currently open. */
export function anyPollWindowOpen(schedule: RegionSchedule[], now: number): boolean {
  return schedule.some((r) => pollStatus(r, now) === "open");
}

/**
 * Mirrors cast_vote poll gating:
 * - national: any open window, or cycle phase `scheduled`
 * - other tiers: voter's county window must be open
 */
export function isPollingOpen(opts: {
  tier: Tier;
  voterCounty?: string | null;
  schedule: RegionSchedule[];
  now: number;
  cyclePhase?: string | null;
}): boolean {
  if (opts.tier === "national") {
    if (anyPollWindowOpen(opts.schedule, opts.now)) return true;
    return opts.cyclePhase === "scheduled";
  }
  if (!opts.voterCounty) return false;
  const region = regionForCounty(opts.voterCounty, opts.schedule);
  return region ? pollStatus(region, opts.now) === "open" : false;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Live poll windows from Supabase for the active election cycle. */
export function usePollSchedule(cycleSlug = "mykdm-2026") {
  const [schedule, setSchedule] = useState<RegionSchedule[]>([]);
  const [cyclePhase, setCyclePhase] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    Promise.all([listPollWindows(cycleSlug), getCyclePhase(cycleSlug)])
      .then(([rows, phase]) => {
        if (cancelled) return;
        setSchedule(rows);
        setCyclePhase(phase);
        setError(null);
      })
      .catch((e) => {
        console.warn("[schedule] load failed:", e);
        if (cancelled) return;
        setSchedule([]);
        setCyclePhase(null);
        setError(e instanceof Error ? e.message : "Failed to load schedule");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [cycleSlug]);

  const windowStart = useMemo(
    () => (schedule.length ? schedule[0].opensAt : null),
    [schedule],
  );
  const windowEnd = useMemo(
    () => (schedule.length ? schedule[schedule.length - 1].closesAt : null),
    [schedule],
  );

  return { schedule, cyclePhase, ready, error, windowStart, windowEnd };
}
