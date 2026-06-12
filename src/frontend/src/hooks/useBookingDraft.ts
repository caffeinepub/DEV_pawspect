/**
 * useBookingDraft.ts
 * Single canonical booking draft state — shared across all booking flow steps.
 *
 * This is the SINGLE source of truth for all booking criteria. No local copies
 * of date/time/service/sitter should exist in individual pages/components.
 *
 * Phases 2-10 of the booking flow rewrite use this as the central state store.
 */

import {
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useReducer,
} from "react";
import type { Pet } from "../backend.d";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AlternativeSuggestion {
  date: string; // ISO YYYY-MM-DD
  timeSlot: string; // "morning" | "afternoon" | "evening" | HH:MM
  timeWindow: number; // duration in minutes
  service: string;
  availableCount: number;
  label: string; // human-readable label for display
}

export interface BookingDraftClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface OccurrenceAvailability {
  date: bigint;
  available: boolean;
  conflictReason: [] | [string];
}

export interface BookingDraftState {
  // Step 1: ZIP lookup
  zip: string;
  /** IDs of sitters whose service radius covers the entered ZIP */
  inScopeSitterIds: string[];

  // Step 2: Booking criteria
  selectedDate: string | null; // ISO YYYY-MM-DD
  selectedTime: string | null; // HH:MM (24h)
  selectedTimeWindow: number | null; // duration in minutes (60, 120, etc.)
  selectedService: string | null;

  // Step 2: Live availability feedback
  liveAvailabilityCount: number;
  availableSitterIds: string[]; // subset of inScopeSitterIds passing full eligibility
  /**
   * True only after the first SET_AVAILABILITY action completes for the current
   * criteria set. Starts false. Reset to false whenever criteria change.
   * Gates the sitter-selection step so cards never render before availability is known.
   */
  availabilityReady: boolean;

  // Step 3: Alternative suggestions (when count = 0)
  alternativeSuggestions: AlternativeSuggestion[];

  // Step 4: Sitter selection
  selectedSitterIds: string[];

  // Step 5: Client info
  clientInfo: BookingDraftClientInfo | null;
  isReturningClient: boolean;

  // Step 6: Pet info
  petInfo: Pet[] | null;

  // Step 7: Agreement flags
  agreementFlags: {
    terms: boolean;
    privacy: boolean;
    communications: boolean;
    callRequest: boolean;
    cancellationPolicy: boolean;
  };

  // ── Recurring booking fields (default: OFF) ──────────────────────────────
  /** When false (default), single-booking flow runs unchanged. */
  isRecurring: boolean;
  recurrencePattern: "weekly" | "biweekly" | "monthly";
  recurrenceDaysOfWeek: number[];
  recurrenceEndDate: string; // ISO YYYY-MM-DD, empty = use occurrenceCount
  recurrenceOccurrenceCount: number; // 2-26
  /** Derived from pattern+days+end condition. Updated client-side. */
  recurringOccurrenceDates: string[]; // ISO YYYY-MM-DD array
  /** Results from backend validateRecurringAvailability call. */
  recurringAvailabilityResults: OccurrenceAvailability[];
  /** Subset of recurringOccurrenceDates that are available. Derived. */
  recurringAvailableCount: number;
  /** Set after successful recurring group submission. */
  recurringGroupId: string | null;

  // Meta
  idempotencyKey: string | null;
  lastSubmitAttemptAt: number | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: BookingDraftState = {
  zip: "",
  inScopeSitterIds: [],
  selectedDate: null,
  selectedTime: null,
  selectedTimeWindow: null,
  selectedService: null,
  liveAvailabilityCount: 0,
  availableSitterIds: [],
  availabilityReady: false,
  alternativeSuggestions: [],
  selectedSitterIds: [],
  clientInfo: null,
  isReturningClient: false,
  petInfo: null,
  agreementFlags: {
    terms: false,
    privacy: false,
    communications: false,
    callRequest: false,
    cancellationPolicy: false,
  },
  // Recurring — all OFF/empty by default
  isRecurring: false,
  recurrencePattern: "weekly",
  recurrenceDaysOfWeek: [],
  recurrenceEndDate: "",
  recurrenceOccurrenceCount: 4,
  recurringOccurrenceDates: [],
  recurringAvailabilityResults: [],
  recurringAvailableCount: 0,
  recurringGroupId: null,
  idempotencyKey: null,
  lastSubmitAttemptAt: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type BookingDraftAction =
  | { type: "SET_ZIP"; zip: string }
  | { type: "SET_IN_SCOPE_SITTERS"; ids: string[] }
  | { type: "SET_DATE"; date: string | null }
  | { type: "SET_TIME"; time: string | null }
  | { type: "SET_TIME_WINDOW"; window: number | null }
  | { type: "SET_SERVICE"; service: string | null }
  | {
      type: "SET_AVAILABILITY";
      count: number;
      availableIds: string[];
      suggestions: AlternativeSuggestion[];
    }
  | { type: "SET_SELECTED_SITTERS"; ids: string[] }
  | { type: "SET_CLIENT_INFO"; info: BookingDraftClientInfo | null }
  | { type: "SET_RETURNING_CLIENT"; isReturning: boolean }
  | { type: "SET_PET_INFO"; pets: Pet[] | null }
  | {
      type: "SET_AGREEMENT_FLAG";
      flag: keyof BookingDraftState["agreementFlags"];
      value: boolean;
    }
  // Recurring actions
  | { type: "SET_IS_RECURRING"; value: boolean }
  | {
      type: "SET_RECURRENCE_PATTERN";
      pattern: "weekly" | "biweekly" | "monthly";
    }
  | { type: "SET_RECURRENCE_DAYS_OF_WEEK"; days: number[] }
  | { type: "SET_RECURRENCE_END_DATE"; endDate: string }
  | { type: "SET_RECURRENCE_OCCURRENCE_COUNT"; count: number }
  | { type: "SET_RECURRING_OCCURRENCE_DATES"; dates: string[] }
  | {
      type: "SET_RECURRING_AVAILABILITY_RESULTS";
      results: OccurrenceAvailability[];
    }
  | { type: "SET_RECURRING_GROUP_ID"; groupId: string | null }
  | { type: "REMOVE_CONFLICTING_OCCURRENCE_DATES" }
  | { type: "GENERATE_IDEMPOTENCY_KEY" }
  | { type: "RECORD_SUBMIT_ATTEMPT" }
  | { type: "RESET_DRAFT" }
  | { type: "LOAD_PREBOOK"; partial: Partial<BookingDraftState> };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(
  state: BookingDraftState,
  action: BookingDraftAction,
): BookingDraftState {
  switch (action.type) {
    case "SET_ZIP":
      return { ...state, zip: action.zip };

    case "SET_IN_SCOPE_SITTERS":
      return {
        ...state,
        inScopeSitterIds: action.ids,
        // Reset availability when scope changes
        liveAvailabilityCount: 0,
        availableSitterIds: [],
        availabilityReady: false,
      };

    case "SET_DATE":
      return {
        ...state,
        selectedDate: action.date,
        // Clear sitter selection when date changes — eligibility must be re-checked
        selectedSitterIds: [],
        liveAvailabilityCount: 0,
        availableSitterIds: [],
        availabilityReady: false,
      };

    case "SET_TIME":
      return {
        ...state,
        selectedTime: action.time,
        selectedSitterIds: [],
        liveAvailabilityCount: 0,
        availableSitterIds: [],
        availabilityReady: false,
      };

    case "SET_TIME_WINDOW":
      return {
        ...state,
        selectedTimeWindow: action.window,
        selectedSitterIds: [],
        liveAvailabilityCount: 0,
        availableSitterIds: [],
        availabilityReady: false,
      };

    case "SET_SERVICE":
      return {
        ...state,
        selectedService: action.service,
        selectedSitterIds: [],
        liveAvailabilityCount: 0,
        availableSitterIds: [],
        availabilityReady: false,
      };

    case "SET_AVAILABILITY":
      return {
        ...state,
        liveAvailabilityCount: action.count,
        availableSitterIds: action.availableIds,
        alternativeSuggestions: action.suggestions,
        availabilityReady: true,
      };

    case "SET_SELECTED_SITTERS":
      return { ...state, selectedSitterIds: action.ids };

    case "SET_CLIENT_INFO":
      return { ...state, clientInfo: action.info };

    case "SET_RETURNING_CLIENT":
      return { ...state, isReturningClient: action.isReturning };

    case "SET_PET_INFO":
      return { ...state, petInfo: action.pets };

    case "SET_AGREEMENT_FLAG":
      return {
        ...state,
        agreementFlags: {
          ...state.agreementFlags,
          [action.flag]: action.value,
        },
      };

    case "SET_IS_RECURRING":
      return { ...state, isRecurring: action.value };

    case "SET_RECURRENCE_PATTERN":
      return {
        ...state,
        recurrencePattern: action.pattern,
        recurringOccurrenceDates: [],
        recurringAvailabilityResults: [],
        recurringAvailableCount: 0,
      };

    case "SET_RECURRENCE_DAYS_OF_WEEK":
      return {
        ...state,
        recurrenceDaysOfWeek: action.days,
        recurringOccurrenceDates: [],
        recurringAvailabilityResults: [],
        recurringAvailableCount: 0,
      };

    case "SET_RECURRENCE_END_DATE":
      return {
        ...state,
        recurrenceEndDate: action.endDate,
        recurringOccurrenceDates: [],
        recurringAvailabilityResults: [],
        recurringAvailableCount: 0,
      };

    case "SET_RECURRENCE_OCCURRENCE_COUNT":
      return {
        ...state,
        recurrenceOccurrenceCount: action.count,
        recurringOccurrenceDates: [],
        recurringAvailabilityResults: [],
        recurringAvailableCount: 0,
      };

    case "SET_RECURRING_OCCURRENCE_DATES":
      return { ...state, recurringOccurrenceDates: action.dates };

    case "SET_RECURRING_AVAILABILITY_RESULTS": {
      const availCount = action.results.filter((r) => r.available).length;
      return {
        ...state,
        recurringAvailabilityResults: action.results,
        recurringAvailableCount: availCount,
      };
    }

    case "SET_RECURRING_GROUP_ID":
      return { ...state, recurringGroupId: action.groupId };

    case "REMOVE_CONFLICTING_OCCURRENCE_DATES": {
      const conflictSet = new Set(
        state.recurringAvailabilityResults
          .filter((r) => !r.available)
          .map((r) => {
            const d = new Date(Number(r.date / 1_000_000n));
            return d.toISOString().split("T")[0];
          }),
      );
      const filtered = state.recurringOccurrenceDates.filter(
        (d) => !conflictSet.has(d),
      );
      const filteredResults = state.recurringAvailabilityResults.filter(
        (r) => r.available,
      );
      return {
        ...state,
        recurringOccurrenceDates: filtered,
        recurringAvailabilityResults: filteredResults,
        recurringAvailableCount: filteredResults.length,
      };
    }

    case "GENERATE_IDEMPOTENCY_KEY": {
      const key = [
        state.clientInfo?.email ?? "",
        state.selectedSitterIds.join(","),
        state.selectedDate ?? "",
        state.selectedTime ?? "",
        state.selectedTimeWindow?.toString() ?? "",
        state.selectedService ?? "",
        (state.petInfo ?? []).map((p) => p.petName).join(","),
        Date.now().toString(),
      ].join("|");
      return { ...state, idempotencyKey: key };
    }

    case "RECORD_SUBMIT_ATTEMPT":
      return { ...state, lastSubmitAttemptAt: Date.now() };

    case "RESET_DRAFT":
      return { ...INITIAL_STATE };

    case "LOAD_PREBOOK":
      return { ...state, ...action.partial };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BookingDraftContextValue {
  draft: BookingDraftState;
  setZip: (zip: string) => void;
  setInScopeSitters: (ids: string[]) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setTimeWindow: (window: number | null) => void;
  setService: (service: string | null) => void;
  setAvailability: (
    count: number,
    availableIds: string[],
    suggestions: AlternativeSuggestion[],
  ) => void;
  setSelectedSitters: (ids: string[]) => void;
  setClientInfo: (info: BookingDraftClientInfo | null) => void;
  setReturningClient: (isReturning: boolean) => void;
  setPetInfo: (pets: Pet[] | null) => void;
  setAgreementFlag: (
    flag: keyof BookingDraftState["agreementFlags"],
    value: boolean,
  ) => void;
  // Recurring setters
  setIsRecurring: (value: boolean) => void;
  setRecurrencePattern: (pattern: "weekly" | "biweekly" | "monthly") => void;
  setRecurrenceDaysOfWeek: (days: number[]) => void;
  setRecurrenceEndDate: (endDate: string) => void;
  setRecurrenceOccurrenceCount: (count: number) => void;
  setRecurringOccurrenceDates: (dates: string[]) => void;
  setRecurringAvailabilityResults: (results: OccurrenceAvailability[]) => void;
  setRecurringGroupId: (groupId: string | null) => void;
  removeConflictingOccurrenceDates: () => void;
  generateIdempotencyKey: () => void;
  recordSubmitAttempt: () => void;
  resetDraft: () => void;
  loadPrebook: (partial: Partial<BookingDraftState>) => void;
  /** True when all booking criteria fields are filled */
  isCriteriaComplete: boolean;
}

const BookingDraftContext = createContext<BookingDraftContextValue | null>(
  null,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, INITIAL_STATE);

  const setZip = useCallback(
    (zip: string) => dispatch({ type: "SET_ZIP", zip }),
    [],
  );
  const setInScopeSitters = useCallback(
    (ids: string[]) => dispatch({ type: "SET_IN_SCOPE_SITTERS", ids }),
    [],
  );
  const setDate = useCallback(
    (date: string | null) => dispatch({ type: "SET_DATE", date }),
    [],
  );
  const setTime = useCallback(
    (time: string | null) => dispatch({ type: "SET_TIME", time }),
    [],
  );
  const setTimeWindow = useCallback(
    (window: number | null) => dispatch({ type: "SET_TIME_WINDOW", window }),
    [],
  );
  const setService = useCallback(
    (service: string | null) => dispatch({ type: "SET_SERVICE", service }),
    [],
  );
  const setAvailability = useCallback(
    (
      count: number,
      availableIds: string[],
      suggestions: AlternativeSuggestion[],
    ) =>
      dispatch({
        type: "SET_AVAILABILITY",
        count,
        availableIds,
        suggestions,
      }),
    [],
  );
  const setSelectedSitters = useCallback(
    (ids: string[]) => dispatch({ type: "SET_SELECTED_SITTERS", ids }),
    [],
  );
  const setClientInfo = useCallback(
    (info: BookingDraftClientInfo | null) =>
      dispatch({ type: "SET_CLIENT_INFO", info }),
    [],
  );
  const setReturningClient = useCallback(
    (isReturning: boolean) =>
      dispatch({ type: "SET_RETURNING_CLIENT", isReturning }),
    [],
  );
  const setPetInfo = useCallback(
    (pets: Pet[] | null) => dispatch({ type: "SET_PET_INFO", pets }),
    [],
  );
  const setAgreementFlag = useCallback(
    (flag: keyof BookingDraftState["agreementFlags"], value: boolean) =>
      dispatch({ type: "SET_AGREEMENT_FLAG", flag, value }),
    [],
  );
  const setIsRecurring = useCallback(
    (value: boolean) => dispatch({ type: "SET_IS_RECURRING", value }),
    [],
  );
  const setRecurrencePattern = useCallback(
    (pattern: "weekly" | "biweekly" | "monthly") =>
      dispatch({ type: "SET_RECURRENCE_PATTERN", pattern }),
    [],
  );
  const setRecurrenceDaysOfWeek = useCallback(
    (days: number[]) => dispatch({ type: "SET_RECURRENCE_DAYS_OF_WEEK", days }),
    [],
  );
  const setRecurrenceEndDate = useCallback(
    (endDate: string) => dispatch({ type: "SET_RECURRENCE_END_DATE", endDate }),
    [],
  );
  const setRecurrenceOccurrenceCount = useCallback(
    (count: number) =>
      dispatch({ type: "SET_RECURRENCE_OCCURRENCE_COUNT", count }),
    [],
  );
  const setRecurringOccurrenceDates = useCallback(
    (dates: string[]) =>
      dispatch({ type: "SET_RECURRING_OCCURRENCE_DATES", dates }),
    [],
  );
  const setRecurringAvailabilityResults = useCallback(
    (results: OccurrenceAvailability[]) =>
      dispatch({ type: "SET_RECURRING_AVAILABILITY_RESULTS", results }),
    [],
  );
  const setRecurringGroupId = useCallback(
    (groupId: string | null) =>
      dispatch({ type: "SET_RECURRING_GROUP_ID", groupId }),
    [],
  );
  const removeConflictingOccurrenceDates = useCallback(
    () => dispatch({ type: "REMOVE_CONFLICTING_OCCURRENCE_DATES" }),
    [],
  );
  const generateIdempotencyKey = useCallback(
    () => dispatch({ type: "GENERATE_IDEMPOTENCY_KEY" }),
    [],
  );
  const recordSubmitAttempt = useCallback(
    () => dispatch({ type: "RECORD_SUBMIT_ATTEMPT" }),
    [],
  );
  const resetDraft = useCallback(() => dispatch({ type: "RESET_DRAFT" }), []);
  const loadPrebook = useCallback(
    (partial: Partial<BookingDraftState>) =>
      dispatch({ type: "LOAD_PREBOOK", partial }),
    [],
  );

  const isCriteriaComplete =
    !!draft.selectedDate &&
    !!draft.selectedTime &&
    draft.selectedTimeWindow !== null &&
    !!draft.selectedService;

  const value: BookingDraftContextValue = {
    draft,
    setZip,
    setInScopeSitters,
    setDate,
    setTime,
    setTimeWindow,
    setService,
    setAvailability,
    setSelectedSitters,
    setClientInfo,
    setReturningClient,
    setPetInfo,
    setAgreementFlag,
    setIsRecurring,
    setRecurrencePattern,
    setRecurrenceDaysOfWeek,
    setRecurrenceEndDate,
    setRecurrenceOccurrenceCount,
    setRecurringOccurrenceDates,
    setRecurringAvailabilityResults,
    setRecurringGroupId,
    removeConflictingOccurrenceDates,
    generateIdempotencyKey,
    recordSubmitAttempt,
    resetDraft,
    loadPrebook,
    isCriteriaComplete,
  };

  return createElement(BookingDraftContext.Provider, { value }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBookingDraft(): BookingDraftContextValue {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) {
    throw new Error("useBookingDraft must be used within BookingDraftProvider");
  }
  return ctx;
}
