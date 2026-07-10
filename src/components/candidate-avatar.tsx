import type { ElectionCandidate } from "@/lib/tier-meta";
import { candidatePhotoUrl } from "@/lib/api/candidate-photos";

const accentBg: Record<ElectionCandidate["accent"], string> = {
  gold: "bg-gradient-gold text-primary-foreground",
  sage: "bg-sage text-white",
  terracotta: "bg-terracotta text-white",
};

export function CandidateAvatar({
  candidate,
  size = "md",
}: {
  candidate: ElectionCandidate;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-base";
  const photoUrl = candidatePhotoUrl(candidate.photoPath);
  return (
    <span
      className={`grid ${dim} shrink-0 place-items-center overflow-hidden rounded-full font-display font-semibold shadow-sm ${
        photoUrl ? "" : accentBg[candidate.accent]
      }`}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={candidate.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        candidate.initials
      )}
    </span>
  );
}
