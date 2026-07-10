import { MapPin, Building2, Vote } from "lucide-react";
import { TIER_META, type Tier } from "@/lib/tier-meta";

export const BALLOT_TIERS: Tier[] = ["county", "constituency", "ward"];

const ICON: Record<Tier, typeof Vote> = {
  national: Vote,
  county: MapPin,
  constituency: Building2,
  ward: Vote,
};

export function TierTabsBar({
  activeTier,
  setActiveTier,
  counts,
  votedCount,
}: {
  activeTier: Tier;
  setActiveTier: (t: Tier) => void;
  counts?: Record<Tier, number>;
  votedCount?: (t: Tier) => number;
}) {
  return (
    <div className="sticky top-16 z-30 border-y border-border bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BALLOT_TIERS.map((t) => {
          const Icon = ICON[t];
          const isActive = t === activeTier;
          const voted = votedCount ? votedCount(t) : 0;
          const count = counts?.[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTier(t)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary bg-primary text-ink shadow-lg shadow-primary/20"
                  : "border-white/15 text-white/80 hover:border-white/40 hover:bg-white/5"
              }`}
              aria-pressed={isActive}
            >
              <Icon className="h-4 w-4" />
              <span>{TIER_META[t].label}</span>
              {typeof count === "number" && (
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                    isActive ? "bg-ink/15 text-ink" : "bg-white/10 text-white/70"
                  }`}
                >
                  {votedCount ? `${voted}/${count}` : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
