/**
 * coverageTracking.ts
 * Tracks ZIP codes that clients search when no sitters are available.
 * Used in admin portal to surface uncovered demand for targeted marketing.
 *
 * All data is stored in localStorage only — no backend changes.
 */

import { zipToAreaName } from "../config/business";

const STORAGE_KEY = "pawspect_uncovered_zips";

export interface UncoveredZipEntry {
  count: number;
  lastSearched: string; // ISO timestamp
}

export type UncoveredZipData = Record<string, UncoveredZipEntry>;

/**
 * Record a search for a ZIP code that returned 0 sitters.
 * Increments the search count and updates the lastSearched timestamp.
 */
export function recordUncoveredZipSearch(zip: string): void {
  if (!zip || !/^\d{5}$/.test(zip.trim())) return;
  const cleaned = zip.trim();
  try {
    const data = getUncoveredZipData();
    const existing = data[cleaned];
    data[cleaned] = {
      count: (existing?.count ?? 0) + 1,
      lastSearched: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

/**
 * Get the full uncovered ZIP demand dataset from localStorage.
 */
export function getUncoveredZipData(): UncoveredZipData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UncoveredZipData;
  } catch {
    return {};
  }
}

/**
 * Clear all uncovered ZIP demand data.
 */
export function clearUncoveredZipData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface TopUncoveredZip {
  zip: string;
  count: number;
  lastSearched: string;
  areaName?: string;
  isHotDemand: boolean;
}

/**
 * Get the top N uncovered ZIPs sorted by search count descending.
 */
export function getTopUncoveredZips(n: number): TopUncoveredZip[] {
  const data = getUncoveredZipData();
  return Object.entries(data)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([zip, entry]) => ({
      zip,
      count: entry.count,
      lastSearched: entry.lastSearched,
      areaName: zipToAreaName(zip),
      isHotDemand: entry.count >= 3,
    }));
}
