import type { Candidate } from "@/lib/mym-data";

const accentBg: Record<Candidate["accent"], string> = {
  gold: "bg-gradient-gold text-primary-foreground",
  sage: "bg-sage text-white",
  terracotta: "bg-terracotta text-white",
};

export function CandidateAvatar({
  candidate,
  size = "md",
}: {
  candidate: Candidate;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-base";
  return (
    <span
      className={`grid ${dim} shrink-0 place-items-center rounded-full font-display font-semibold shadow-sm ${accentBg[candidate.accent]}`}
    >
      {candidate.initials}
    </span>
  );
}
