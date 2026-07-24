import { Building2, Landmark, MapPin, Vote } from "lucide-react";
import type { ReactNode } from "react";
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

export const BALLOT_TIERS: Tier[] = ["national", "county", "constituency", "ward"];

const TIER_ICON: Record<Tier, typeof Vote> = {
  national: Landmark,
  county: MapPin,
  constituency: Building2,
  ward: Vote,
};

const TIER_SHORT: Record<Tier, string> = {
  national: "National",
  county: "County",
  constituency: "Const.",
  ward: "Ward",
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
  /** Ballot seats available for the current tier/location scope. */
  scopeSeats?: { id: string; title: string }[];
  selectedSeatId?: string;
  setSelectedSeatId?: (id: string) => void;
  /**
   * When true (registered voter), location selects are hidden and the bar
   * shows only their home county / constituency / ward. National remains open to all.
   */
  lockToHome?: boolean;
  /** Optional homeLocation used to render a subtle marker on the voter's registered area. */
  homeLocation?: { county?: string; constituency?: string; ward?: string } | null;
  /** Optional right-slot for search etc. */
  rightSlot?: ReactNode;
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
  scopeSeats = [],
  selectedSeatId = "",
  setSelectedSeatId,
  lockToHome = false,
  homeLocation,
  rightSlot,
}: LocationTierBarProps) {
  const constituencyOpts = constituenciesForCounty(county);
  const wardOpts = wardsForConstituency(constituency);
  const showSeatPicker = scopeSeats.length > 0 && !!setSelectedSeatId;

  const homeLabel =
    activeTier === "county"
      ? county
        ? `${county} County`
        : "Your county"
      : activeTier === "constituency"
        ? constituency
          ? `${constituency}, ${county}`
          : "Your constituency"
        : ward
          ? `${ward} — ${constituency}`
          : "Your ward";

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex w-fit shrink-0 gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {BALLOT_TIERS.map((t) => {
            const Icon = TIER_ICON[t];
            const active = t === activeTier;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
                  active ? "bg-primary text-ink" : "text-white/70 hover:text-white"
                }`}
                aria-pressed={active}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{TIER_META[t].label}</span>
                <span className="sm:hidden">{TIER_SHORT[t]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:justify-end">
          {activeTier === "national" ? (
            showSeatPicker ? (
              <LocationSelect
                icon={Landmark}
                placeholder="Select national seat"
                value={selectedSeatId}
                onChange={setSelectedSeatId!}
                options={scopeSeats.map((p) => p.title)}
                optionValues={scopeSeats.map((p) => p.id)}
                badge={`${scopeSeats.length}`}
              />
            ) : (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
                <Landmark className="h-3.5 w-3.5 text-primary" />
                Nationwide · open to all voters
              </span>
            )
          ) : lockToHome ? (
            <>
              <span className="inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border border-primary/50 bg-primary/15 px-3 text-xs text-white">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{homeLabel}</span>
                <span className="shrink-0 rounded-full bg-primary/25 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  your area
                </span>
              </span>
              {showSeatPicker && (
                <LocationSelect
                  icon={Vote}
                  placeholder="Select ballot seat"
                  value={selectedSeatId}
                  onChange={setSelectedSeatId!}
                  options={scopeSeats.map((p) => p.title)}
                  optionValues={scopeSeats.map((p) => p.id)}
                  badge={`${scopeSeats.length}`}
                />
              )}
            </>
          ) : (
            <>
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
                  isHome={
                    !!homeLocation?.constituency && homeLocation.constituency === constituency
                  }
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
              {showSeatPicker && (
                <LocationSelect
                  icon={Vote}
                  placeholder="Select ballot seat"
                  value={selectedSeatId}
                  onChange={setSelectedSeatId!}
                  options={scopeSeats.map((p) => p.title)}
                  optionValues={scopeSeats.map((p) => p.id)}
                  badge={`${scopeSeats.length}`}
                />
              )}
            </>
          )}
          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
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
  optionValues,
  badge,
  isHome,
}: {
  icon: typeof MapPin;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  /** When set, Select values use these ids while labels use `options`. */
  optionValues?: string[];
  badge?: string;
  isHome?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 w-[10.5rem] shrink-0 rounded-full bg-white/5 px-3 text-sm text-white hover:bg-white/10 focus:ring-primary/40 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:opacity-60 [&>svg]:text-white/60 sm:w-[14rem] ${
          isHome ? "border-primary/60 ring-1 ring-primary/40" : "border-white/15"
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <SelectValue placeholder={placeholder} className="truncate" />
          {isHome && (
            <span className="shrink-0 rounded-full bg-primary/25 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              home
            </span>
          )}
          {badge && !isHome && (
            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums text-white/70">
              {badge}
            </span>
          )}
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((o, i) => {
          const itemValue = optionValues?.[i] ?? o;
          return (
            <SelectItem key={itemValue} value={itemValue}>
              {o}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
