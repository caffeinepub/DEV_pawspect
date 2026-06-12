/**
 * bookingUtils.ts — Centralized booking state, validators, and payload builder.
 *
 * Single source of truth for booking draft shape, field validation, and
 * the API payload construction. Every step of the booking wizard should
 * use these validators so errors are consistent and the submit handler
 * never sends a malformed payload.
 */

import type { DayServiceSchedule, Pet, RecurrencePattern } from "../backend.d";

// ─── Canonical booking draft ──────────────────────────────────────────────────

export interface BookingDraft {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pets: Pet[];
  /** ISO date string like "2026-04-24" — never today, never empty */
  selectedDate: string;
  /** HH:mm format e.g. "16:00" */
  startTime: string;
  /** HH:mm format e.g. "17:00" */
  endTime: string;
  serviceIds: string[];
  sitterIds: bigint[];
  locationMode: "onsite" | "pickup";
  recurringConfig: {
    isRecurring: boolean;
    pattern?: string;
    endDate?: string;
  };
  agreements: {
    terms: boolean;
    privacy: boolean;
    communications: boolean;
    callRequest: boolean;
  };
  notes: string;
  /** Generated once per draft to prevent duplicate submissions */
  idempotencyKey: string;
  serviceSchedule?: DayServiceSchedule[];
}

// ─── Validation result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// ─── ZIP → timezone helper ─────────────────────────────────────────────────────

export function zipToTimezone(zip: string): string {
  const code = Number.parseInt(zip.replace(/\D/g, "").slice(0, 5), 10);
  if (Number.isNaN(code))
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (code >= 80000 && code <= 81999) return "America/Denver";
  if (code >= 90000 && code <= 96999) return "America/Los_Angeles";
  if (code >= 60000 && code <= 79999) return "America/Chicago";
  if (code >= 82000 && code <= 84999) return "America/Denver";
  if (code >= 97000 && code <= 99999) return "America/Los_Angeles";
  return "America/New_York";
}

/** Returns tomorrow's ISO date string in the given ZIP code's timezone. */
export function tomorrowIsoForZip(zip: string): string {
  try {
    const tz = zipToTimezone(zip);
    const now = new Date();
    const nowInTZ = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const tomorrow = new Date(nowInTZ);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
}

// ─── Step validators ──────────────────────────────────────────────────────────

/** Validates a 5-digit US ZIP code */
export function validateSearchStep(zip: string): ValidationResult {
  const errors: Record<string, string> = {};
  if (!/^\d{5}$/.test(zip)) {
    errors.zip = "Please enter a valid 5-digit ZIP code.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validates date, time, and service selection */
export function validateDateTimeServiceStep(
  draft: Pick<
    BookingDraft,
    "selectedDate" | "startTime" | "endTime" | "serviceIds"
  >,
  _zip = "",
  isMeetAndGreet = false,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!draft.selectedDate) {
    errors.selectedDate = "Please select a date.";
  }

  if (!draft.startTime) {
    errors.startTime = "Please select a start time.";
  }

  if (!draft.endTime) {
    errors.endTime = "Please select an end time.";
  }

  if (!isMeetAndGreet && draft.serviceIds.length === 0) {
    errors.serviceIds = "Please select at least one service.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validates sitter selection */
export function validateSitterStep(
  draft: Pick<BookingDraft, "sitterIds">,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (draft.sitterIds.length === 0) {
    errors.sitterIds = "Please select at least one sitter.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validates pet details */
export function validatePetsStep(
  draft: Pick<BookingDraft, "pets">,
): ValidationResult {
  const errors: Record<string, string> = {};
  if (draft.pets.length === 0) {
    errors.pets = "Please add at least one pet.";
  } else {
    draft.pets.forEach((p, i) => {
      if (!p.petName?.trim()) {
        errors[`pets[${i}].petName`] = `Pet ${i + 1} needs a name.`;
      }
      if (!p.petType?.trim()) {
        errors[`pets[${i}].petType`] = `Pet ${i + 1} needs a type.`;
      }
    });
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validates contact info */
export function validateContactStep(
  draft: Pick<BookingDraft, "clientName" | "clientEmail" | "clientPhone">,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!draft.clientName.trim()) {
    errors.clientName = "Please enter your name.";
  }

  if (
    !draft.clientEmail.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.clientEmail)
  ) {
    errors.clientEmail = "Please enter a valid email address.";
  }

  const phone = draft.clientPhone.replace(/\D/g, "");
  if (phone.length < 10) {
    errors.clientPhone = "Please enter a valid 10-digit phone number.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validates review step — terms and privacy required, communications optional */
export function validateReviewStep(
  draft: Pick<BookingDraft, "agreements" | "sitterIds" | "pets">,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!draft.agreements.terms) {
    errors["agreements.terms"] = "You must agree to the Terms of Service.";
  }
  if (!draft.agreements.privacy) {
    errors["agreements.privacy"] = "You must agree to the Privacy Policy.";
  }
  if (draft.sitterIds.length === 0) {
    errors.sitterIds =
      "No sitter selected. Please go back and select a sitter.";
  }
  if (draft.pets.length === 0) {
    errors.pets = "No pets added. Please go back and add your pet(s).";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Idempotency key ──────────────────────────────────────────────────────────

/** Generates a deterministic idempotency key from booking draft fields. */
export function generateIdempotencyKey(
  draft: Pick<
    BookingDraft,
    | "clientEmail"
    | "sitterIds"
    | "selectedDate"
    | "startTime"
    | "endTime"
    | "serviceIds"
    | "pets"
  >,
): string {
  const parts = [
    draft.clientEmail.toLowerCase().trim(),
    draft.sitterIds.map(String).sort().join(","),
    draft.selectedDate,
    draft.startTime,
    draft.endTime,
    draft.serviceIds.sort().join(","),
    draft.pets
      .map((p) => p.petName.toLowerCase())
      .sort()
      .join(","),
  ];
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return `idem_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
}

// ─── Payload builder ──────────────────────────────────────────────────────────

export interface BookingPayload {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pets: Pet[];
  services: string[];
  sitterIds: bigint[];
  startDate: bigint;
  endDate: bigint;
  notes: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: bigint;
  callRequest: boolean;
  serviceSchedule?: DayServiceSchedule[];
}

/**
 * Builds the final API payload from a booking draft.
 * Validates all required fields and normalizes dates and phone.
 * Throws a structured error with field-level details if validation fails.
 */
export function buildBookingPayload(draft: BookingDraft): BookingPayload {
  const contactValidation = validateContactStep(draft);
  if (!contactValidation.valid) {
    throw new Error(
      `Contact info invalid: ${Object.values(contactValidation.errors).join("; ")}`,
    );
  }

  const reviewValidation = validateReviewStep(draft);
  if (!reviewValidation.valid) {
    throw new Error(
      `Review validation failed: ${Object.values(reviewValidation.errors).join("; ")}`,
    );
  }

  const startDate =
    BigInt(new Date(`${draft.selectedDate}T${draft.startTime}:00`).getTime()) *
    1_000_000n;
  const endDate =
    BigInt(new Date(`${draft.selectedDate}T${draft.endTime}:00`).getTime()) *
    1_000_000n;

  const normalizedPhone = draft.clientPhone.replace(/\D/g, "");

  const recurrenceEndDate =
    draft.recurringConfig.isRecurring && draft.recurringConfig.endDate
      ? BigInt(new Date(draft.recurringConfig.endDate).getTime()) * 1_000_000n
      : undefined;

  return {
    clientName: draft.clientName.trim(),
    clientEmail: draft.clientEmail.toLowerCase().trim(),
    clientPhone: normalizedPhone,
    pets: draft.pets,
    services: draft.serviceIds,
    sitterIds: draft.sitterIds,
    startDate,
    endDate,
    notes: draft.notes.trim(),
    isRecurring: draft.recurringConfig.isRecurring,
    recurrencePattern: draft.recurringConfig.isRecurring
      ? (draft.recurringConfig.pattern as RecurrencePattern)
      : undefined,
    recurrenceEndDate,
    callRequest: draft.agreements.callRequest,
    serviceSchedule: draft.serviceSchedule,
  };
}

// ─── Recurring booking utilities ──────────────────────────────────────────────

/**
 * Generates the list of occurrence dates for a recurring booking.
 * Client-side expansion matching backend logic. Capped at 52 occurrences.
 *
 * @param pattern    "weekly" | "biweekly" | "monthly"
 * @param daysOfWeek Days of the week (0=Sun, 1=Mon, ..., 6=Sat). Used for weekly/biweekly.
 * @param startDate  First occurrence must be on or after this date.
 * @param endDate    If set, stop generating after this date.
 * @param occurrenceCount If set (and endDate is null), stop after this many occurrences.
 */
export function generateOccurrenceDates(
  pattern: "weekly" | "biweekly" | "monthly",
  daysOfWeek: number[],
  startDate: Date,
  endDate: Date | null,
  occurrenceCount: number | null,
): Date[] {
  const MAX = 52;
  const results: Date[] = [];

  if (pattern === "monthly") {
    const limit = endDate
      ? Number.POSITIVE_INFINITY
      : Math.min(occurrenceCount ?? MAX, MAX);
    const cursor = new Date(startDate);
    const dayOfMonth = cursor.getDate();
    while (results.length < limit && results.length < MAX) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), dayOfMonth);
      if (d < startDate) {
        cursor.setMonth(cursor.getMonth() + 1);
        continue;
      }
      if (endDate && d > endDate) break;
      results.push(d);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return results;
  }

  // Weekly or biweekly
  const stepWeeks = pattern === "biweekly" ? 2 : 1;
  if (daysOfWeek.length === 0) return [];

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  const limit = endDate
    ? Number.POSITIVE_INFINITY
    : Math.min(occurrenceCount ?? MAX, MAX);

  // Start from the Sunday of the week containing startDate
  const weekCursor = new Date(startDate);
  weekCursor.setDate(weekCursor.getDate() - weekCursor.getDay());

  let weekCount = 0;
  while (results.length < limit && results.length < MAX) {
    for (const dow of sortedDays) {
      const d = new Date(weekCursor);
      d.setDate(d.getDate() + dow);
      if (d < startDate) continue;
      if (endDate && d > endDate) return results;
      results.push(d);
      if (results.length >= limit || results.length >= MAX) return results;
    }
    weekCount++;
    weekCursor.setDate(weekCursor.getDate() + 7 * stepWeeks);
    if (weekCount > 200) break;
  }

  return results;
}

/** Convert a Date to ISO YYYY-MM-DD string */
export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert an ISO YYYY-MM-DD string to bigint nanoseconds since epoch */
export function isoToNanoseconds(iso: string): bigint {
  return BigInt(new Date(`${iso}T00:00:00`).getTime()) * 1_000_000n;
}

export interface RecurringGroupPayload {
  sitterId: bigint;
  clientInfo: { clientName: string; clientEmail: string; clientPhone: string };
  petInfo: Pet[];
  serviceIds: string[];
  recurrenceRule: {
    pattern: { weekly: null } | { biweekly: null } | { monthly: null };
    daysOfWeek: number[];
    startDate: bigint;
    endDate: [] | [bigint];
    occurrenceCount: [] | [bigint];
  };
  startTime: string;
  endTime: string;
  serviceDuration: bigint;
  totalCostCents: bigint;
  agreements: {
    terms: boolean;
    privacy: boolean;
    communications: boolean;
    callRequest: boolean;
    cancellationPolicy: boolean;
    nonEmploymentAck: boolean;
    termsVersion: bigint;
  };
  occurrenceDates: bigint[];
}

/**
 * Builds the payload for createRecurringBookingGroup backend call.
 * Throws with field-level errors if required fields are missing.
 */
export function buildRecurringGroupPayload(params: {
  sitterId: bigint;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pets: Pet[];
  serviceIds: string[];
  pattern: "weekly" | "biweekly" | "monthly";
  daysOfWeek: number[];
  startDate: string;
  endDate: string | null;
  occurrenceCount: number | null;
  startTime: string;
  endTime: string;
  occurrenceDates: string[];
  hourlyRateCents: number;
  agreements: {
    terms: boolean;
    privacy: boolean;
    communications: boolean;
    callRequest: boolean;
    cancellationPolicy: boolean;
    nonEmploymentAck: boolean;
    termsVersion: bigint;
  };
}): RecurringGroupPayload {
  const errors: string[] = [];
  if (!params.clientName.trim()) errors.push("Client name is required.");
  if (!params.clientEmail.trim()) errors.push("Client email is required.");
  if (params.pets.length === 0) errors.push("At least one pet is required.");
  if (params.serviceIds.length === 0)
    errors.push("At least one service is required.");
  if (params.occurrenceDates.length < 2)
    errors.push("At least 2 occurrence dates are required.");
  if (!params.agreements.terms)
    errors.push("Terms of Service agreement required.");
  if (!params.agreements.privacy)
    errors.push("Privacy Policy agreement required.");
  if (errors.length > 0) throw new Error(errors.join(" "));

  const patternObj =
    params.pattern === "weekly"
      ? { weekly: null as null }
      : params.pattern === "biweekly"
        ? { biweekly: null as null }
        : { monthly: null as null };

  const [sh, sm] = params.startTime.split(":").map(Number);
  const [eh, em] = params.endTime.split(":").map(Number);
  const durationMinutes = Math.max(0, eh * 60 + em - (sh * 60 + (sm || 0)));

  const occCount = params.occurrenceDates.length;
  const durationHours = durationMinutes / 60;
  const totalCostCents = BigInt(
    Math.round(durationHours * params.hourlyRateCents * occCount),
  );

  return {
    sitterId: params.sitterId,
    clientInfo: {
      clientName: params.clientName.trim(),
      clientEmail: params.clientEmail.toLowerCase().trim(),
      clientPhone: params.clientPhone.replace(/\D/g, ""),
    },
    petInfo: params.pets,
    serviceIds: params.serviceIds,
    recurrenceRule: {
      pattern: patternObj,
      daysOfWeek: params.daysOfWeek,
      startDate: isoToNanoseconds(params.startDate),
      endDate: params.endDate ? [isoToNanoseconds(params.endDate)] : [],
      occurrenceCount: params.occurrenceCount
        ? [BigInt(params.occurrenceCount)]
        : [],
    },
    startTime: params.startTime,
    endTime: params.endTime,
    serviceDuration: BigInt(durationMinutes),
    totalCostCents,
    agreements: params.agreements,
    occurrenceDates: params.occurrenceDates.map(isoToNanoseconds),
  };
}
