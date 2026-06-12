/**
 * zipTimezone.ts
 * Maps a 5-digit US ZIP code prefix to an IANA timezone string.
 * Used by the booking flow for accurate timezone-aware date display.
 *
 * Lookup strategy:
 * 1. Try zippopotam.us for accurate state-based timezone (async path)
 * 2. Fall back to static 38-range ZIP prefix table
 */

import {
  getDailyLimit,
  getMonthlyLimit,
  isAtDailyLimit,
  isAtMonthlyLimit,
  recordLookup,
} from "../lib/usageTracking";

// ── Static fallback: sorted ranges [low3, high3, timezone] ──────────────────
const ZIP_RANGES: Array<[number, number, string]> = [
  [6, 9, "America/Puerto_Rico"],
  [10, 212, "America/New_York"],
  [213, 268, "America/New_York"],
  [270, 316, "America/New_York"],
  [317, 342, "America/New_York"],
  [344, 347, "America/New_York"],
  [349, 349, "America/New_York"],
  [350, 352, "America/Chicago"],
  [354, 399, "America/Chicago"],
  [400, 427, "America/New_York"],
  [430, 459, "America/New_York"],
  [460, 479, "America/Chicago"],
  [480, 499, "America/New_York"],
  [500, 535, "America/Chicago"],
  [537, 567, "America/Chicago"],
  [570, 577, "America/Chicago"],
  [580, 588, "America/Chicago"],
  [590, 599, "America/Denver"],
  [600, 693, "America/Chicago"],
  [700, 729, "America/Chicago"],
  [730, 799, "America/Chicago"],
  [800, 816, "America/Denver"],
  [820, 838, "America/Denver"],
  [840, 847, "America/Denver"],
  [850, 865, "America/Phoenix"],
  [870, 885, "America/Denver"],
  [889, 898, "America/Los_Angeles"],
  [900, 961, "America/Los_Angeles"],
  [967, 968, "Pacific/Honolulu"],
  [995, 999, "America/Anchorage"],
];

// ── Comprehensive US state → IANA timezone map ───────────────────────────────
// States with multiple zones use the most-populated/dominant timezone.
const STATE_TIMEZONE: Record<string, string> = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Denver",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  PR: "America/Puerto_Rico",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  VI: "America/Puerto_Rico",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
  DC: "America/New_York",
  GU: "Pacific/Guam",
  AS: "Pacific/Pago_Pago",
  MP: "Pacific/Saipan",
};

// ── Static synchronous fallback lookup ───────────────────────────────────────
function staticLookup(zip: string): string {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);
  if (cleaned.length < 3) return "America/New_York";
  const prefix = Number.parseInt(cleaned.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return "America/New_York";
  for (const [low, high, tz] of ZIP_RANGES) {
    if (prefix >= low && prefix <= high) return tz;
  }
  return "America/New_York";
}

// ── In-memory cache: zip → tz (avoids repeat API calls within a session) ────
const tzCache = new Map<string, string>();

/**
 * Async lookup: validates ZIP via zippopotam.us and maps state → IANA timezone.
 * Records usage and respects daily/monthly limits.
 * Falls back to static lookup on failure or when limits are reached.
 *
 * @param zip - 5-digit US ZIP code
 * @returns Promise resolving to IANA timezone string
 */
export async function getTimezoneForZipAsync(zip: string): Promise<string> {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);
  if (cleaned.length < 5) return staticLookup(cleaned);

  // Check in-memory session cache first
  if (tzCache.has(cleaned)) {
    return tzCache.get(cleaned)!;
  }

  // Check limits before making the call
  const dailyLimit = getDailyLimit();
  const monthlyLimit = getMonthlyLimit();

  if (isAtDailyLimit(dailyLimit) || isAtMonthlyLimit(monthlyLimit)) {
    const tz = staticLookup(cleaned);
    tzCache.set(cleaned, tz);
    return tz;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    const res = await fetch(`https://api.zippopotam.us/us/${cleaned}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    recordLookup();

    if (!res.ok) {
      const tz = staticLookup(cleaned);
      tzCache.set(cleaned, tz);
      return tz;
    }

    const data = (await res.json()) as {
      "post code": string;
      places: Array<{ state: string; "state abbreviation": string }>;
    };

    const stateAbbr = data.places?.[0]?.["state abbreviation"]?.toUpperCase();
    const tz =
      (stateAbbr ? STATE_TIMEZONE[stateAbbr] : undefined) ??
      staticLookup(cleaned);

    tzCache.set(cleaned, tz);
    return tz;
  } catch {
    // Fetch failed (timeout, network error, etc.) — use static fallback
    const tz = staticLookup(cleaned);
    tzCache.set(cleaned, tz);
    return tz;
  }
}

/**
 * Synchronous timezone lookup (immediate, static-only).
 * Returns the IANA timezone string for a given US ZIP code.
 * Falls back to "America/New_York" for unrecognized or invalid ZIPs.
 *
 * Used as the synchronous entry point; async enrichment happens on first call.
 *
 * @param zip - 5-digit US ZIP code string (e.g. "80304")
 * @returns IANA timezone string (e.g. "America/Denver")
 */
export function getTimezoneForZip(zip: string): string {
  const cleaned = zip.replace(/\D/g, "").slice(0, 5);

  // Check session cache (may be populated by a prior async call)
  if (tzCache.has(cleaned)) {
    return tzCache.get(cleaned)!;
  }

  // Fire async enrichment in the background for future calls (best-effort)
  if (cleaned.length === 5) {
    getTimezoneForZipAsync(cleaned).catch(() => {
      // Intentionally ignored — background enrichment only
    });
  }

  return staticLookup(cleaned);
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for "tomorrow"
 * relative to the current time in the given ZIP code's timezone.
 *
 * @param zip - 5-digit US ZIP code string
 * @returns ISO date string for tomorrow in that timezone
 */
export function tomorrowIsoForZip(zip: string): string {
  try {
    const tz = getTimezoneForZip(zip);
    const now = new Date();
    // Get current date in the target timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === "year")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";

    if (!year || !month || !day) throw new Error("format failed");

    // Add one day
    const todayInTz = new Date(`${year}-${month}-${day}T12:00:00`);
    const tomorrowInTz = new Date(todayInTz);
    tomorrowInTz.setDate(tomorrowInTz.getDate() + 1);

    const y = tomorrowInTz.getFullYear();
    const m = String(tomorrowInTz.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrowInTz.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    // Fallback: device local tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
}

// ─── End of zipTimezone.ts ────────────────────────────────────────────────────
