/**
 * SitterCoverageMap.tsx
 * Admin Operations tab — visualizes sitter coverage by state + ZIP demand gaps.
 *
 * Hybrid approach:
 *  1. SVG US map with state-level fill (red/amber/green coverage tiers)
 *  2. Coverage data table grouped by state with demand badges
 *  3. Summary stat cards at the top
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Flame,
  MapPin,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Public } from "../../backend.d";
import { zipToAreaName } from "../../config/business";
import { useAllSitters } from "../../hooks/useQueries";
import {
  type UncoveredZipData,
  clearUncoveredZipData,
  getTopUncoveredZips,
  getUncoveredZipData,
} from "../../utils/coverageTracking";

// ── ZIP prefix → US state abbreviation ──────────────────────────────────────
// Lookup table: [min, max, state]. Ranges are sorted by min ascending so the
// first matching entry wins. No range is duplicated or shadowed by a broader
// range above it.
const ZIP_RANGES: ReadonlyArray<[number, number, string]> = [
  [6, 9, "PR"],
  [10, 14, "NY"],
  [15, 19, "PA"],
  [20, 20, "DC"],
  [100, 149, "NY"],
  [150, 196, "PA"],
  [197, 199, "DE"],
  [200, 212, "DC"],
  [213, 219, "MD"],
  [220, 246, "VA"],
  [247, 268, "WV"],
  [270, 289, "NC"],
  [290, 299, "SC"],
  [300, 319, "GA"],
  [320, 349, "FL"],
  [350, 369, "AL"],
  [370, 385, "TN"],
  [386, 399, "MS"],
  [400, 427, "KY"],
  [430, 459, "OH"],
  [460, 479, "IN"],
  [480, 499, "MI"],
  [500, 528, "IA"],
  [530, 549, "WI"],
  [550, 567, "MN"],
  [570, 577, "SD"],
  [580, 588, "ND"],
  [590, 599, "MT"],
  [600, 629, "IL"],
  [630, 658, "MO"],
  [660, 679, "KS"],
  [680, 693, "NE"],
  [700, 714, "LA"],
  [716, 729, "AR"],
  [730, 749, "OK"],
  [750, 799, "TX"],
  [800, 816, "CO"],
  [820, 831, "WY"],
  [832, 838, "ID"],
  [840, 847, "UT"],
  [850, 865, "AZ"],
  [870, 885, "NM"],
  [889, 898, "NV"],
  [900, 961, "CA"],
  [967, 968, "HI"],
  [970, 979, "OR"],
  [980, 994, "WA"],
  [995, 999, "AK"],
];

function zipToState(zip: string): string {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);
  if (cleaned.length < 3) return "Unknown";
  const prefix = Number.parseInt(cleaned.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return "Unknown";

  for (const [min, max, state] of ZIP_RANGES) {
    if (prefix >= min && prefix <= max) return state;
  }
  return "Unknown";
}

// ── Simplified US state SVG paths (scaled to 480×300 viewBox) ──────────────
// These are highly simplified paths for visual representation only.
const STATE_PATHS: Record<
  string,
  { d: string; label: string; cx: number; cy: number }
> = {
  WA: { d: "M60,30 L120,30 L125,70 L65,72 Z", label: "WA", cx: 90, cy: 50 },
  OR: { d: "M60,72 L125,70 L128,108 L60,108 Z", label: "OR", cx: 90, cy: 90 },
  CA: {
    d: "M58,110 L127,108 L132,175 L80,200 L55,170 Z",
    label: "CA",
    cx: 90,
    cy: 155,
  },
  NV: {
    d: "M130,75 L162,75 L165,160 L128,175 L127,108 Z",
    label: "NV",
    cx: 147,
    cy: 125,
  },
  ID: {
    d: "M127,38 L175,38 L178,92 L160,92 L162,75 L130,75 Z",
    label: "ID",
    cx: 152,
    cy: 65,
  },
  MT: {
    d: "M128,28 L245,28 L248,65 L175,65 L178,42 L127,38 Z",
    label: "MT",
    cx: 188,
    cy: 45,
  },
  WY: {
    d: "M163,93 L238,90 L240,130 L162,132 Z",
    label: "WY",
    cx: 200,
    cy: 112,
  },
  UT: {
    d: "M130,110 L162,108 L162,132 L163,155 L130,155 Z",
    label: "UT",
    cx: 146,
    cy: 133,
  },
  AZ: {
    d: "M130,157 L165,157 L163,200 L118,200 L118,175 Z",
    label: "AZ",
    cx: 143,
    cy: 178,
  },
  CO: {
    d: "M165,130 L240,128 L243,168 L165,170 Z",
    label: "CO",
    cx: 203,
    cy: 150,
  },
  NM: {
    d: "M166,172 L242,170 L244,210 L164,212 Z",
    label: "NM",
    cx: 203,
    cy: 191,
  },
  ND: { d: "M250,30 L330,28 L332,68 L248,70 Z", label: "ND", cx: 290, cy: 50 },
  SD: {
    d: "M248,70 L332,68 L334,108 L250,110 Z",
    label: "SD",
    cx: 291,
    cy: 89,
  },
  NE: {
    d: "M245,110 L335,108 L336,140 L246,142 Z",
    label: "NE",
    cx: 290,
    cy: 125,
  },
  KS: {
    d: "M248,142 L336,140 L338,172 L248,174 Z",
    label: "KS",
    cx: 292,
    cy: 157,
  },
  OK: {
    d: "M248,174 L340,172 L355,178 L355,210 L248,212 Z",
    label: "OK",
    cx: 300,
    cy: 193,
  },
  TX: {
    d: "M248,214 L356,210 L375,215 L380,270 L300,285 L248,270 Z",
    label: "TX",
    cx: 315,
    cy: 248,
  },
  MN: {
    d: "M337,28 L395,28 L397,88 L370,90 L335,72 L333,28 Z",
    label: "MN",
    cx: 365,
    cy: 58,
  },
  IA: {
    d: "M336,90 L397,88 L398,125 L337,127 Z",
    label: "IA",
    cx: 367,
    cy: 107,
  },
  MO: {
    d: "M338,127 L400,125 L402,168 L340,170 Z",
    label: "MO",
    cx: 370,
    cy: 148,
  },
  AR: {
    d: "M340,170 L403,168 L404,200 L340,202 Z",
    label: "AR",
    cx: 372,
    cy: 186,
  },
  LA: {
    d: "M340,202 L404,200 L405,230 L380,240 L340,232 Z",
    label: "LA",
    cx: 373,
    cy: 218,
  },
  WI: {
    d: "M370,42 L425,40 L428,88 L398,90 L370,72 Z",
    label: "WI",
    cx: 398,
    cy: 65,
  },
  IL: {
    d: "M398,90 L430,88 L432,150 L400,152 L399,127 Z",
    label: "IL",
    cx: 415,
    cy: 120,
  },
  MI: {
    d: "M400,45 L440,42 L442,78 L428,80 L425,60 Z",
    label: "MI",
    cx: 422,
    cy: 62,
  },
  IN: {
    d: "M430,90 L455,88 L457,140 L432,142 Z",
    label: "IN",
    cx: 443,
    cy: 115,
  },
  OH: {
    d: "M456,78 L480,75 L482,140 L457,142 L455,90 Z",
    label: "OH",
    cx: 468,
    cy: 108,
  },
  KY: {
    d: "M400,152 L458,148 L480,145 L480,172 L400,175 Z",
    label: "KY",
    cx: 440,
    cy: 162,
  },
  TN: {
    d: "M338,202 L458,198 L462,220 L340,222 Z",
    label: "TN",
    cx: 400,
    cy: 210,
  },
  MS: {
    d: "M340,222 L408,220 L408,260 L345,265 Z",
    label: "MS",
    cx: 374,
    cy: 242,
  },
  AL: {
    d: "M408,220 L438,218 L440,262 L408,265 Z",
    label: "AL",
    cx: 423,
    cy: 242,
  },
  GA: {
    d: "M440,192 L475,190 L478,255 L438,258 Z",
    label: "GA",
    cx: 457,
    cy: 224,
  },
  FL: {
    d: "M440,258 L480,255 L480,280 L455,295 L435,280 Z",
    label: "FL",
    cx: 458,
    cy: 274,
  },
  SC: {
    d: "M462,162 L480,160 L480,192 L440,195 Z",
    label: "SC",
    cx: 462,
    cy: 178,
  },
  NC: {
    d: "M400,148 L462,145 L465,165 L400,168 Z",
    label: "NC",
    cx: 432,
    cy: 157,
  },
  VA: {
    d: "M400,128 L462,125 L464,148 L400,150 Z",
    label: "VA",
    cx: 432,
    cy: 138,
  },
  WV: {
    d: "M455,112 L480,108 L482,130 L460,132 Z",
    label: "WV",
    cx: 468,
    cy: 120,
  },
  PA: {
    d: "M440,95 L480,92 L482,112 L442,115 Z",
    label: "PA",
    cx: 461,
    cy: 103,
  },
  NY: { d: "M440,65 L480,60 L482,95 L440,98 Z", label: "NY", cx: 461, cy: 79 },
  NJ: {
    d: "M474,95 L480,93 L480,110 L473,112 Z",
    label: "NJ",
    cx: 477,
    cy: 102,
  },
  DE: {
    d: "M472,108 L478,106 L479,118 L471,120 Z",
    label: "DE",
    cx: 475,
    cy: 113,
  },
  MD: {
    d: "M460,112 L475,110 L476,125 L458,127 Z",
    label: "MD",
    cx: 467,
    cy: 119,
  },
  CT: { d: "M472,82 L480,80 L480,92 L470,93 Z", label: "CT", cx: 475, cy: 87 },
  RI: { d: "M478,80 L482,80 L482,88 L477,89 Z", label: "RI", cx: 480, cy: 84 },
  MA: { d: "M462,62 L480,60 L480,80 L460,82 Z", label: "MA", cx: 470, cy: 71 },
  VT: { d: "M455,45 L465,43 L466,65 L454,66 Z", label: "VT", cx: 460, cy: 55 },
  NH: { d: "M465,40 L475,38 L476,65 L464,66 Z", label: "NH", cx: 470, cy: 52 },
  ME: { d: "M468,28 L480,25 L482,45 L466,48 Z", label: "ME", cx: 474, cy: 36 },
  AK: { d: "M30,220 L95,220 L98,270 L28,272 Z", label: "AK", cx: 63, cy: 246 },
  HI: {
    d: "M130,265 L175,265 L176,285 L128,287 Z",
    label: "HI",
    cx: 152,
    cy: 276,
  },
};

// ── Coverage color helpers ───────────────────────────────────────────────────
function coverageColor(sitterCount: number, hasDemand: boolean): string {
  if (sitterCount >= 2) return "oklch(0.52 0.16 145 / 0.5)"; // green
  if (sitterCount === 1) return "oklch(0.72 0.18 55 / 0.5)"; // amber
  if (hasDemand) return "oklch(0.50 0.18 27 / 0.4)"; // red with demand
  return "oklch(0.88 0.015 255 / 0.3)"; // neutral — no data
}

function coverageStroke(sitterCount: number, hasDemand: boolean): string {
  if (sitterCount >= 2) return "oklch(0.40 0.16 145)";
  if (sitterCount === 1) return "oklch(0.55 0.18 55)";
  if (hasDemand) return "oklch(0.38 0.18 27)";
  return "oklch(0.70 0.02 255)";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SitterCoverageMap({
  onViewAllClick,
}: {
  onViewAllClick?: () => void;
}) {
  const { data: sittersRaw = [], isLoading } = useAllSitters();
  const sitters = sittersRaw as Public[];

  const [demandData, setDemandData] = useState<UncoveredZipData>({});
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Load demand data from localStorage on mount
  useEffect(() => {
    setDemandData(getUncoveredZipData());
  }, []);

  const handleClearDemand = () => {
    clearUncoveredZipData();
    setDemandData({});
  };

  // ── Build coverage data structures ─────────────────────────────────────────
  const { stateMap, zipMap, summaryStats } = useMemo(() => {
    // ZIP → sitters list
    const zMap: Record<string, Public[]> = {};
    for (const sitter of sitters) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zip = (sitter as any).serviceZip ?? "";
      if (!zip) continue;
      if (!zMap[zip]) zMap[zip] = [];
      zMap[zip].push(sitter);
    }

    // State → { zips, sitterCount }
    const sMap: Record<
      string,
      { zips: string[]; sitters: Public[]; state: string }
    > = {};
    for (const [zip, sittersInZip] of Object.entries(zMap)) {
      const state = zipToState(zip);
      if (!sMap[state]) sMap[state] = { zips: [], sitters: [], state };
      if (!sMap[state].zips.includes(zip)) sMap[state].zips.push(zip);
      for (const s of sittersInZip) {
        if (!sMap[state].sitters.find((x) => x.id === s.id)) {
          sMap[state].sitters.push(s);
        }
      }
    }

    // Demand ZIP entries that have no sitters
    const uncoveredDemandZips = Object.keys(demandData).filter(
      (z) => !zMap[z] || zMap[z].length === 0,
    );

    // States with demand but no sitters
    const demandStates = new Set<string>();
    for (const zip of uncoveredDemandZips) {
      const state = zipToState(zip);
      demandStates.add(state);
    }

    // Total sitters with a service ZIP set
    const sittersWithZip = sitters.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s) => !!(s as any).serviceZip,
    ).length;

    return {
      stateMap: sMap,
      zipMap: zMap,
      summaryStats: {
        coveredZips: Object.keys(zMap).length,
        uncoveredDemandZips: uncoveredDemandZips.length,
        statesWithNoCoverage: demandStates.size,
        sittersWithZip,
      },
    };
  }, [sitters, demandData]);

  // ── Table rows: demand ZIPs first, then covered ZIPs ───────────────────────
  const tableRows = useMemo(() => {
    const rows: Array<{
      zip: string;
      state: string;
      areaName: string;
      sitterCount: number;
      sitterNames: string[];
      demandCount: number;
      isHotDemand: boolean;
    }> = [];

    // Collect all ZIPs (covered + demanded)
    const allZips = new Set([
      ...Object.keys(zipMap),
      ...Object.keys(demandData),
    ]);

    for (const zip of allZips) {
      const sittersHere = zipMap[zip] ?? [];
      const demand = demandData[zip];
      const demandCount = demand?.count ?? 0;

      rows.push({
        zip,
        state: zipToState(zip),
        areaName: zipToAreaName(zip),
        sitterCount: sittersHere.length,
        sitterNames: sittersHere.map((s) => s.name),
        demandCount,
        isHotDemand: demandCount >= 3,
      });
    }

    // Sort: uncovered with demand first (by count desc), then covered
    return rows.sort((a, b) => {
      const aScore = a.sitterCount === 0 ? b.demandCount - a.demandCount : 1000;
      const bScore = b.sitterCount === 0 ? a.demandCount - b.demandCount : 1000;
      if (a.sitterCount === 0 && b.sitterCount === 0) {
        return b.demandCount - a.demandCount;
      }
      if (a.sitterCount === 0) return -1;
      if (b.sitterCount === 0) return 1;
      return aScore - bScore;
    });
  }, [zipMap, demandData]);

  // State-level coverage for SVG map coloring
  function getStateCoverage(stateAbbr: string) {
    const stateData = stateMap[stateAbbr];
    const sitterCount = stateData?.sitters.length ?? 0;
    // Check if any demand ZIP maps to this state
    const hasDemand = Object.keys(demandData).some(
      (z) =>
        zipToState(z) === stateAbbr && (!zipMap[z] || zipMap[z].length === 0),
    );
    return { sitterCount, hasDemand };
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const topDemand = getTopUncoveredZips(5);

  return (
    <div className="space-y-6" data-ocid="admin.coverage.panel">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl">Coverage Map</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sitter service areas · client demand signals · marketing gaps
          </p>
        </div>
        {Object.keys(demandData).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDemand}
            className="gap-1.5 text-muted-foreground hover:text-destructive rounded-full text-xs"
            data-ocid="admin.coverage.clear_demand_button"
          >
            <Trash2 size={12} /> Clear demand data
          </Button>
        )}
      </div>

      {/* ── Summary stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Covered ZIPs",
            value: summaryStats.coveredZips,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: "✅",
          },
          {
            label: "Demand ZIPs (no sitters)",
            value: summaryStats.uncoveredDemandZips,
            color: "text-red-600",
            bg: "bg-red-50",
            icon: "🔥",
          },
          {
            label: "States w/ Demand Gaps",
            value: summaryStats.statesWithNoCoverage,
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: "⚠️",
          },
          {
            label: "Sitters w/ Service ZIP",
            value: summaryStats.sittersWithZip,
            color: "text-primary",
            bg: "bg-primary/10",
            icon: "🐾",
          },
        ].map(({ label, value, color, bg, icon }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div
              className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2 text-base`}
            >
              {icon}
            </div>
            <p className={`font-display font-bold text-2xl ${color}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── SVG US Map ──────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          State Coverage Overview
        </h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
          {[
            {
              color: "oklch(0.52 0.16 145 / 0.5)",
              label: "2+ sitters",
              border: "oklch(0.40 0.16 145)",
            },
            {
              color: "oklch(0.72 0.18 55 / 0.5)",
              label: "1 sitter",
              border: "oklch(0.55 0.18 55)",
            },
            {
              color: "oklch(0.50 0.18 27 / 0.4)",
              label: "Hot demand, no sitters",
              border: "oklch(0.38 0.18 27)",
            },
            {
              color: "oklch(0.88 0.015 255 / 0.3)",
              label: "No data",
              border: "oklch(0.70 0.02 255)",
            },
          ].map(({ color, label, border }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-4 h-3 rounded-sm border"
                style={{ background: color, borderColor: border }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 500 300"
            className="w-full max-w-2xl mx-auto"
            style={{ minWidth: "320px" }}
            role="img"
            aria-label="US state coverage map showing sitter coverage by state"
          >
            {/* Draw each state */}
            {Object.entries(STATE_PATHS).map(([abbr, { d, label, cx, cy }]) => {
              const { sitterCount, hasDemand } = getStateCoverage(abbr);
              const fill = coverageColor(sitterCount, hasDemand);
              const stroke = coverageStroke(sitterCount, hasDemand);
              const isHovered = hoveredState === abbr;

              return (
                <g key={abbr}>
                  <path
                    d={d}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    style={{
                      transition: "fill 0.2s, stroke-width 0.15s",
                      filter: isHovered ? "brightness(0.88)" : undefined,
                      cursor:
                        sitterCount > 0 || hasDemand ? "pointer" : "default",
                    }}
                    onMouseEnter={() => setHoveredState(abbr)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State label — only show for larger states */}
                  {cx && cy && (
                    <text
                      x={cx}
                      y={cy + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={7}
                      fill={
                        sitterCount > 0
                          ? "oklch(0.15 0.02 265)"
                          : "oklch(0.45 0.03 265)"
                      }
                      style={{
                        pointerEvents: "none",
                        fontFamily: "sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip for hovered state */}
        {hoveredState && (
          <div className="mt-2 text-center">
            {(() => {
              const { sitterCount, hasDemand } = getStateCoverage(hoveredState);
              const stateData = stateMap[hoveredState];
              return (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-2 bg-muted/60 rounded-full px-3 py-1">
                  <strong>{hoveredState}</strong>
                  {sitterCount > 0 ? (
                    <span className="text-emerald-600 font-medium">
                      {sitterCount} sitter{sitterCount !== 1 ? "s" : ""} ·{" "}
                      {stateData?.zips.length ?? 0} ZIP
                      {(stateData?.zips.length ?? 0) !== 1 ? "s" : ""} covered
                    </span>
                  ) : hasDemand ? (
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      <Flame size={11} /> Hot demand — no sitters
                    </span>
                  ) : (
                    <span>No coverage data</span>
                  )}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Hot Demand Summary ───────────────────────────────────────────── */}
      {topDemand.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Flame size={16} className="text-red-500" />
              Top Uncovered Demand ZIPs
            </h3>
            <span className="text-xs text-muted-foreground">
              Areas clients searched with no sitters available
            </span>
          </div>
          <div className="space-y-2">
            {topDemand.map((item, i) => (
              <div
                key={item.zip}
                data-ocid={`admin.coverage.demand.item.${i + 1}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
                style={{
                  background:
                    item.count >= 3
                      ? "oklch(0.50 0.18 27 / 0.06)"
                      : "oklch(0.72 0.18 55 / 0.05)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-bold text-foreground shrink-0">
                    {item.zip}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {item.areaName}
                  </span>
                  <span className="text-xs text-muted-foreground/70 shrink-0 hidden sm:block">
                    {zipToState(item.zip)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.isHotDemand && (
                    <Badge
                      className="bg-red-100 text-red-700 border-red-200 text-[10px] gap-1 rounded-full"
                      data-ocid={`admin.coverage.hot_badge.${i + 1}`}
                    >
                      <Flame size={9} /> Hot
                    </Badge>
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    {item.count} search{item.count !== 1 ? "es" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Coverage Data Table ──────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Full Coverage Table
          </h3>
          <span className="text-xs text-muted-foreground">
            {tableRows.length} ZIP{tableRows.length !== 1 ? "s" : ""} tracked
          </span>
        </div>

        {tableRows.length === 0 ? (
          <div
            className="text-center py-12"
            data-ocid="admin.coverage.empty_state"
          >
            <MapPin size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-muted-foreground">
              No coverage data yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sitters need a service ZIP in their profile, and demand signals
              appear when clients search areas with no sitters.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[80px_80px_1fr_100px_1fr] gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>ZIP</span>
              <span>State</span>
              <span>Area</span>
              <span>Sitters</span>
              <span>Demand</span>
            </div>

            {tableRows.map((row, i) => {
              const isExpanded = expandedStates.has(row.zip);
              const rowBg =
                row.sitterCount === 0 && row.demandCount > 0
                  ? "bg-red-50/60 border-red-200/60"
                  : row.sitterCount === 1
                    ? "bg-amber-50/50 border-amber-200/50"
                    : row.sitterCount >= 2
                      ? "bg-emerald-50/50 border-emerald-200/50"
                      : "bg-muted/20 border-border/50";

              return (
                <div
                  key={row.zip}
                  data-ocid={`admin.coverage.row.${i + 1}`}
                  className={`rounded-xl border ${rowBg} overflow-hidden`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedStates((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.zip)) next.delete(row.zip);
                        else next.add(row.zip);
                        return next;
                      })
                    }
                    data-ocid={`admin.coverage.expand.${i + 1}`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden px-3 py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">
                            {row.zip}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {row.state}
                          </span>
                          {row.isHotDemand && (
                            <Flame
                              size={12}
                              className="text-red-500 shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.areaName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <span
                          className={
                            row.sitterCount >= 2
                              ? "text-emerald-600 font-semibold"
                              : row.sitterCount === 1
                                ? "text-amber-600 font-semibold"
                                : "text-red-500 font-semibold"
                          }
                        >
                          {row.sitterCount} sitter
                          {row.sitterCount !== 1 ? "s" : ""}
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={13} />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-[80px_80px_1fr_100px_1fr] gap-3 px-3 py-3 items-center">
                      <span className="font-mono text-sm font-bold">
                        {row.zip}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {row.state}
                      </span>
                      <span className="text-sm truncate">{row.areaName}</span>
                      <span
                        className={`text-sm font-semibold ${
                          row.sitterCount >= 2
                            ? "text-emerald-600"
                            : row.sitterCount === 1
                              ? "text-amber-600"
                              : "text-red-500"
                        }`}
                      >
                        {row.sitterCount}
                      </span>
                      <div className="flex items-center gap-2">
                        {row.demandCount > 0 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            {row.isHotDemand && (
                              <Flame size={11} className="text-red-500" />
                            )}
                            {row.demandCount} search
                            {row.demandCount !== 1 ? "es" : ""}
                          </span>
                        )}
                        {row.demandCount === 0 && (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
                        )}
                        <span className="ml-auto">
                          {isExpanded ? (
                            <ChevronDown
                              size={13}
                              className="text-muted-foreground"
                            />
                          ) : (
                            <ChevronRight
                              size={13}
                              className="text-muted-foreground"
                            />
                          )}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded sitter details */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-border/40">
                      {row.sitterCount > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                            Sitters covering this ZIP:
                          </p>
                          {row.sitterNames.map((name) => (
                            <div
                              key={name}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                {name.charAt(0)}
                              </div>
                              <span>{name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Flame size={11} className="text-red-500" />
                          No sitters cover this area — {row.demandCount} client
                          {row.demandCount !== 1 ? "s" : ""} searched here.
                          {onViewAllClick && (
                            <button
                              type="button"
                              className="underline text-primary ml-1"
                              onClick={onViewAllClick}
                            >
                              View sitters →
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
