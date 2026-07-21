import { useEffect, useState } from "react";

// MY-KDM regional election schedule.
// Kenya's 8 former provinces vote on consecutive days starting Tue 21 Jul 2026.
// Polls open 08:00 EAT and close 18:00 EAT.

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

export interface RegionSchedule {
  region: string;
  counties: string[];
  /** ISO date (YYYY-MM-DD) of polling day, EAT (UTC+3). */
  date: string;
  opensAt: string; // ISO with +03:00
  closesAt: string; // ISO with +03:00
}

const day = (d: string): { opensAt: string; closesAt: string; date: string } => ({
  date: d,
  opensAt: `${d}T08:00:00+03:00`,
  closesAt: `${d}T18:00:00+03:00`,
});

export const REGION_SCHEDULE: RegionSchedule[] = [
  {
    region: "Nairobi",
    counties: ["Nairobi"],
    ...day("2026-07-21"),
  },
  {
    region: "Central",
    counties: ["Kiambu", "Kirinyaga", "Murang'a", "Nyandarua", "Nyeri"],
    ...day("2026-07-22"),
  },
  {
    region: "Coast",
    counties: ["Kilifi", "Kwale", "Lamu", "Mombasa", "Taita-Taveta", "Tana River"],
    ...day("2026-07-23"),
  },
  {
    region: "Eastern",
    counties: [
      "Embu",
      "Isiolo",
      "Kitui",
      "Machakos",
      "Makueni",
      "Marsabit",
      "Meru",
      "Tharaka-Nithi",
    ],
    ...day("2026-07-24"),
  },
  {
    region: "North Eastern",
    counties: ["Garissa", "Mandera", "Wajir"],
    ...day("2026-07-25"),
  },
  {
    region: "Nyanza",
    counties: ["Homa Bay", "Kisii", "Kisumu", "Migori", "Nyamira", "Siaya"],
    ...day("2026-07-26"),
  },
  {
    region: "Rift Valley",
    counties: [
      "Baringo",
      "Bomet",
      "Elgeyo-Marakwet",
      "Kajiado",
      "Kericho",
      "Laikipia",
      "Nakuru",
      "Nandi",
      "Narok",
      "Samburu",
      "Trans Nzoia",
      "Turkana",
      "Uasin Gishu",
      "West Pokot",
    ],
    ...day("2026-07-27"),
  },
  {
    region: "Western",
    counties: ["Bungoma", "Busia", "Kakamega", "Vihiga"],
    ...day("2026-07-28"),
  },
];

export const ELECTION_WINDOW_START = REGION_SCHEDULE[0].opensAt;
export const ELECTION_WINDOW_END = REGION_SCHEDULE[REGION_SCHEDULE.length - 1].closesAt;

export function regionForCounty(county: string): RegionSchedule | undefined {
  const norm = county.trim().toLowerCase();
  return REGION_SCHEDULE.find((r) =>
    r.counties.some((c) => c.toLowerCase() === norm),
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

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
