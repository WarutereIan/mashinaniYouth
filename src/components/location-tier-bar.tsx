import { Building2, MapPin, Vote } from "lucide-react";
import { TIER_META, type Tier } from "@/lib/tier-meta";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUNTY_NAMES,
  TOTAL_CONSTITUENCIES,
  TOTAL_COUNTIES,
  TOTAL_WARDS,
  constituenciesForCounty,
  wardsForConstituency,
} from "@/lib/locations";

export const BALLOT_TIERS: Tier[] = ["county", "constituency", "ward"];

const TIER_ICON: Record<Tier, typeof Vote> = {
  national: Vote,
  county: MapPin,
  constituency: Building2,
  ward: Vote,
};

export interface LocationTierBarProps {
  activeTier: Tier;
  setActiveTier: (t: Tier) => void;
  county: string;
  setCounty: (v: string) => void;
  constituency: string;
  setConstituency: (v: string) => void;
  ward: string;
  setWard: (v: string) => void;
  /** Optional homeLocation used to render a subtle marker on the voter's registered area. */
  homeLocation?: { county?: string; constituency?: string; ward?: string } | null;
  /** Optional right-slot for search etc. */
  rightSlot?: React.ReactNode;
}

export function LocationTierBar({
  activeTier,
  setActiveTier,
  county,
  setCounty,
  constituency,
  setConstituency,
  ward,
  setWard,
  homeLocation,
  rightSlot,
}: LocationTierBarProps) {
  const constituencyOpts = constituenciesForCounty(county);
  const wardOpts = wardsForConstituency(constituency);

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {BALLOT_TIERS.map((t) => {
            const Icon = TIER_ICON[t];
            const active = t === activeTier;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-primary text-ink" : "text-white/70 hover:text-white"
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5" />
                {TIER_META[t].label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2">
          <LocationSelect
            icon={MapPin}
            placeholder="Select county"
            value={county}
            onChange={(v) => {
              setCounty(v);
              const opts = constituenciesForCounty(v);
              if (!opts.includes(constituency)) {
                const next = opts[0] ?? "";
                setConstituency(next);
                setWard(wardsForConstituency(next)[0] ?? "");
              }
            }}
            options={COUNTY_NAMES}
            badge={`${TOTAL_COUNTIES}`}
            isHome={!!homeLocation?.county && homeLocation.county === county}
          />
          {(activeTier === "constituency" || activeTier === "ward") && (
            <LocationSelect
              icon={Building2}
              placeholder="Select constituency"
              value={constituency}
              onChange={(v) => {
                setConstituency(v);
                const opts = wardsForConstituency(v);
                if (!opts.includes(ward)) setWard(opts[0] ?? "");
              }}
              options={constituencyOpts}
              badge={`${TOTAL_CONSTITUENCIES}`}
              isHome={!!homeLocation?.constituency && homeLocation.constituency === constituency}
            />
          )}
          {activeTier === "ward" && (
            <LocationSelect
              icon={Vote}
              placeholder="Select ward"
              value={ward}
              onChange={setWard}
              options={wardOpts}
              badge={`${TOTAL_WARDS}`}
              isHome={!!homeLocation?.ward && homeLocation.ward === ward}
            />
          )}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}

function LocationSelect({
  icon: Icon,
  placeholder,
  value,
  onChange,
  options,
  badge,
  isHome,
}: {
  icon: typeof MapPin;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  badge?: string;
  isHome?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 min-w-[180px] bg-white/5 text-sm text-white hover:bg-white/10 focus:ring-primary/40 [&>svg]:text-white/60 ${
          isHome ? "border-primary/60 ring-1 ring-primary/40" : "border-white/15"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${isHome ? "text-primary" : "text-primary"}`} />
          <SelectValue placeholder={placeholder} />
          {isHome && (
            <span className="rounded-full bg-primary/25 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              home
            </span>
          )}
          {badge && !isHome && (
            <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums text-white/70">
              {badge}
            </span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
