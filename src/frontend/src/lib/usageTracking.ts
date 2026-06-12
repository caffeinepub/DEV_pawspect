/**
 * usageTracking.ts
 * Client-side usage tracking for ZIP timezone API calls.
 * Stores daily and monthly counters in localStorage.
 * Admin-set limits are also persisted in localStorage so enforcement
 * can happen without a backend round-trip on every lookup.
 */

const KEYS = {
  dailyCount: "ziptz_daily_count",
  dailyDate: "ziptz_daily_date",
  monthlyCount: "ziptz_monthly_count",
  month: "ziptz_month",
  dailyLimit: "ziptz_daily_limit",
  monthlyLimit: "ziptz_monthly_limit",
} as const;

const DEFAULT_DAILY_LIMIT = 500;
const DEFAULT_MONTHLY_LIMIT = 5000;
const NEAR_LIMIT_THRESHOLD = 0.8;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthStr(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function safeInt(key: string, fallback = 0): number {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: number | string): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // localStorage might be unavailable (private browsing restrictions)
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Auto-reset daily counter if the date changed. */
function ensureDailyReset(): void {
  const stored = safeGet(KEYS.dailyDate);
  const today = todayStr();
  if (stored !== today) {
    safeSet(KEYS.dailyCount, 0);
    safeSet(KEYS.dailyDate, today);
  }
}

/** Auto-reset monthly counter if the month changed. */
function ensureMonthlyReset(): void {
  const stored = safeGet(KEYS.month);
  const current = monthStr();
  if (stored !== current) {
    safeSet(KEYS.monthlyCount, 0);
    safeSet(KEYS.month, current);
  }
}

export interface UsageStats {
  dailyCount: number;
  monthlyCount: number;
  dailyDate: string;
  month: string;
  dailyLimit: number;
  monthlyLimit: number;
}

/** Record one API lookup attempt. Call this whenever zippopotam.us is called. */
export function recordLookup(): void {
  ensureDailyReset();
  ensureMonthlyReset();
  const daily = safeInt(KEYS.dailyCount) + 1;
  const monthly = safeInt(KEYS.monthlyCount) + 1;
  safeSet(KEYS.dailyCount, daily);
  safeSet(KEYS.monthlyCount, monthly);
}

/** Get current usage stats including limits. */
export function getUsageStats(): UsageStats {
  ensureDailyReset();
  ensureMonthlyReset();
  return {
    dailyCount: safeInt(KEYS.dailyCount),
    monthlyCount: safeInt(KEYS.monthlyCount),
    dailyDate: safeGet(KEYS.dailyDate) ?? todayStr(),
    month: safeGet(KEYS.month) ?? monthStr(),
    dailyLimit: safeInt(KEYS.dailyLimit, DEFAULT_DAILY_LIMIT),
    monthlyLimit: safeInt(KEYS.monthlyLimit, DEFAULT_MONTHLY_LIMIT),
  };
}

/** Returns true if the daily call limit has been reached. */
export function isAtDailyLimit(limit: number): boolean {
  ensureDailyReset();
  return safeInt(KEYS.dailyCount) >= limit;
}

/** Returns true if the monthly call limit has been reached. */
export function isAtMonthlyLimit(limit: number): boolean {
  ensureMonthlyReset();
  return safeInt(KEYS.monthlyCount) >= limit;
}

/** Returns true if usage is at or above 80% of the daily limit. */
export function isNearDailyLimit(limit: number): boolean {
  ensureDailyReset();
  return safeInt(KEYS.dailyCount) >= Math.floor(limit * NEAR_LIMIT_THRESHOLD);
}

/** Returns true if usage is at or above 80% of the monthly limit. */
export function isNearMonthlyLimit(limit: number): boolean {
  ensureMonthlyReset();
  return safeInt(KEYS.monthlyCount) >= Math.floor(limit * NEAR_LIMIT_THRESHOLD);
}

/** Persist admin-set limits to localStorage for frontend enforcement. */
export function saveLimitsLocally(
  dailyLimit: number,
  monthlyLimit: number,
): void {
  safeSet(KEYS.dailyLimit, dailyLimit);
  safeSet(KEYS.monthlyLimit, monthlyLimit);
}

/** Read the currently stored daily limit (from localStorage or default). */
export function getDailyLimit(): number {
  return safeInt(KEYS.dailyLimit, DEFAULT_DAILY_LIMIT);
}

/** Read the currently stored monthly limit (from localStorage or default). */
export function getMonthlyLimit(): number {
  return safeInt(KEYS.monthlyLimit, DEFAULT_MONTHLY_LIMIT);
}
