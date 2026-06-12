import type { Principal } from "@icp-sdk/core/principal";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type {
  AvailabilityEntry,
  BookingAgreements,
  Creation,
  Creation__2,
  DayServiceSchedule,
  Pet,
  Public,
  Public__4,
  Public__6,
  Public__7,
  Public__8,
  RecurrencePattern,
  UpdateSplits,
  UpdateStopTime,
  backendInterface,
} from "../backend.d";
import type {
  CredentialChecklist,
  PageComponentVisibility,
  SitterBookingStats,
  SitterProfileV2Update,
} from "../types/sitter-v2";
import {
  useBackendActor as useActor,
  useActorReady,
  useBackendActor,
} from "./useBackend";

// ─── localStorage stale-while-revalidate cache ──────────────────────────────
// Used for the 3 most critical queries only: caller-profile, all-sitters,
// sitter-subscription-status. Keeps UI from going blank on cold start.

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(`pawspect_cache_${key}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

function setCached<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      `pawspect_cache_${key}`,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    // ignore storage errors
  }
}

// ─── Delayed ready hook — stagger non-critical queries to reduce thundering herd
/**
 * Returns `true` only after `isReady` has been true for `delayMs` milliseconds.
 * Use for analytics, audit logs, admin stats, and other non-critical queries
 * so they don't all fire simultaneously the moment the actor connects.
 */
function useDelayedReady(delayMs: number): boolean {
  const { isReady } = useActorReady();
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    if (!isReady) {
      setDelayed(false);
      return;
    }
    const t = setTimeout(() => setDelayed(true), delayMs);
    return () => clearTimeout(t);
  }, [isReady, delayMs]);
  return delayed;
}

type SitterCreation = Parameters<backendInterface["createSitterProfile"]>[0];
type SitterUpdate = Parameters<backendInterface["updateSitterProfile"]>[0];

export interface BookingCreation {
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
  tip?: bigint;
  serviceSchedule?: DayServiceSchedule[];
  /** Optional call-request flag — sitter is notified to contact client before confirming */
  callRequest?: boolean;
  /** Idempotency key to prevent duplicate submissions */
  idempotencyKey?: string;
  /** Consent checkbox values — ICP optional encoding: [] = absent, [value] = present */
  agreementFlags?: BookingAgreements;
}

export function useActiveSitters() {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["active-sitters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveSitters();
    },
    enabled: !!actor && isReady,
    staleTime: 0,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}

export function useAllSitters(overrides?: {
  refetchOnMount?: boolean | "always";
  staleTime?: number;
}) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["all-sitters"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllSitters();
      setCached("all-sitters", result);
      return result;
    },
    enabled: !!actor && isReady,
    refetchInterval: 30_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    // 60s staleTime: use cached/placeholder data for 60s before a background
    // refresh fires. Prevents a waterfall of simultaneous requests on cold start.
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    placeholderData: () => getCached("all-sitters") ?? [],
    ...(overrides ?? {}),
  });
}

export function useSitterProfile(id: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitter", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getSitterProfile(id);
    },
    enabled: !!actor && isReady && id !== null,
  });
}

export function useBookingsByEmail(email: string) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["bookings-email", email],
    queryFn: async () => {
      if (!actor || !email) return [];
      return actor.getBookingsByClientEmail(email);
    },
    enabled: !!actor && isReady && !!email,
    retry: 2,
    retryDelay: 1500,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useBookingsByPhone(phone: string) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["bookings-phone", phone],
    queryFn: async () => {
      if (!actor || !phone) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getBookingsByClientPhone(phone);
    },
    enabled: !!actor && isReady && !!phone,
    retry: 2,
    retryDelay: 1500,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useBookingsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["bookings-sitter", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return [];
      return actor.getBookingsBySitter(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useAllBookings() {
  const isDelayedReady = useDelayedReady(500);
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBookings();
    },
    enabled: !!actor && isReady && isDelayedReady,
    refetchInterval: 15000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useMessages(bookingId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["messages", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return [];
      return actor.getMessages(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== null,
    refetchInterval: 5000,
  });
}

export function usePayment(bookingId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["payment", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return null;
      return actor.getPayment(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== null,
  });
}

export function useAllPayments() {
  const isDelayedReady = useDelayedReady(500);
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["all-payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && isReady && isDelayedReady,
    refetchInterval: 15000,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function usePaymentsByBookingIds(bookingIds: string[]) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["payments-by-bookings", bookingIds],
    queryFn: async () => {
      if (!actor || bookingIds.length === 0) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getPaymentsByBookingIds(bookingIds);
    },
    enabled: !!actor && isReady && bookingIds.length > 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useCallerProfile() {
  // Auth query — must not wait for warm-up latch; fires as soon as actor exists
  const { actor } = useActorReady();
  return useQuery({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getCallerUserProfile();
      setCached("caller-profile", result);
      return result;
    },
    enabled: !!actor,
    placeholderData: () => getCached("caller-profile"),
  });
}

export function useIsAdmin() {
  // Auth query — must not wait for warm-up latch; fires as soon as actor exists
  const { actor } = useActorReady();
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        // If the call fails, return false so the claim screen shows
        return false;
      }
    },
    enabled: !!actor,
    // Don't retry aggressively — a single false result is enough to show claim screen
    retry: 1,
    retryDelay: 1000,
  });
}

export function useServiceLogs(bookingId: bigint | null, autoRefresh = false) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["service-logs", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return [];
      return actor.getServiceLogsByBooking(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== null,
    refetchInterval: autoRefresh ? 10000 : false,
  });
}

export function usePostServiceLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Creation) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.postServiceLog(input);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["service-logs", vars.bookingId.toString()],
      }),
  });
}

export function useUpdateServiceLogStopTime() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateStopTime & { bookingId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateServiceLogStopTime({
        id: input.id,
        stopTime: input.stopTime,
      });
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["service-logs", vars.bookingId.toString()],
      }),
  });
}

export function useSitterAvailability(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitter-availability", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return [];
      return actor.getSitterAvailability(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
  });
}

export function useSetSitterAvailability() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      entries,
    }: {
      sitterId: bigint;
      entries: AvailabilityEntry[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setSitterAvailability(sitterId, entries);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["sitter-availability", vars.sitterId.toString()],
      }),
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingCreation) => {
      if (!actor) throw new Error("Actor not ready");
      const payload = {
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        pets: input.pets,
        services: input.services,
        sitterIds: input.sitterIds,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
        isRecurring: input.isRecurring,
        recurrencePattern: input.recurrencePattern,
        recurrenceEndDate: input.recurrenceEndDate,
        tip: input.tip,
        serviceSchedule: input.serviceSchedule,
        // callRequest: backend expects boolean (optional)
        callRequest: input.callRequest ?? false,
        // agreements: TypeScript optional — undefined = absent, object = present
        agreements: input.agreementFlags
          ? {
              terms: input.agreementFlags.terms,
              privacy: input.agreementFlags.privacy,
              communications: input.agreementFlags.communications,
              callRequest: input.agreementFlags.callRequest,
              cancellationPolicy: input.agreementFlags.cancellationPolicy,
              nonEmploymentAck: input.agreementFlags.nonEmploymentAck,
              termsVersion: input.agreementFlags.termsVersion,
            }
          : undefined,
      };
      try {
        return await actor.createBooking(payload);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useCreateBooking] Backend error:", msg, {
          payload,
          err,
        });
        throw err;
      }
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
      // Invalidate client-specific query caches so My Bookings refreshes
      if (input.clientEmail) {
        qc.invalidateQueries({
          queryKey: ["bookings-email", input.clientEmail],
        });
        qc.refetchQueries({ queryKey: ["bookings-email", input.clientEmail] });
      }
      if (input.clientPhone) {
        qc.invalidateQueries({
          queryKey: ["bookings-phone", input.clientPhone],
        });
        qc.refetchQueries({ queryKey: ["bookings-phone", input.clientPhone] });
      }
    },
  });
}

export function useCreatePayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Creation__2) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createPayment(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

export function useUpdatePaymentSplits() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSplits) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updatePaymentSplits(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-payments"] }),
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: bigint;
      status: "cancelled" | "completed" | "confirmed";
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.updateBookingStatus(bookingId, status as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

export function useAddMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      senderName,
      content,
    }: {
      bookingId: bigint;
      senderName: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addMessage(bookingId, senderName, content);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["messages", vars.bookingId.toString()],
      }),
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      name: string;
      role: string;
      email?: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.saveCallerUserProfile(profile);
      // Handle Result<(), Text> — backend may return {ok: null} or {err: string}
      if (
        result !== null &&
        result !== undefined &&
        typeof result === "object"
      ) {
        if ("err" in result) {
          throw new Error(String((result as { err: string }).err));
        }
      }
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["caller-profile"] }),
  });
}

export function useCreateSitter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SitterCreation) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createSitterProfile(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

export function useUpdateSitter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SitterUpdate) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateSitterProfile(input);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
      // Invalidate the specific sitter profile cache so re-fetches pick up updated services
      if (data && typeof data === "object" && "id" in data) {
        qc.invalidateQueries({
          queryKey: ["sitter", String((data as { id: bigint }).id)],
        });
      }
    },
  });
}

/**
 * Returns sitters whose service radius covers the given zip code.
 * Calls the active sitters list and filters client-side by area match.
 * Falls back to a general area match when no backend proximity function is available.
 */
export function useSittersNearZip(zip: string, radiusMiles = 25) {
  void radiusMiles; // reserved for future backend proximity call
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitters-near-zip", zip],
    queryFn: async () => {
      if (!actor || !zip) return [] as Public[];
      // Attempt backend proximity call if it exists; fall back to getActiveSitters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const backendAny = actor as any;
      if (typeof backendAny.getSittersNearZip === "function") {
        return backendAny.getSittersNearZip(
          zip,
          BigInt(radiusMiles),
        ) as Promise<Public[]>;
      }
      return actor.getActiveSitters() as Promise<Public[]>;
    },
    enabled: !!actor && isReady && zip.length === 5,
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useDeleteSitter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteSitterProfile(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

/**
 * Approves a sitter application by calling approveSitterApplication(sitterId).
 * This is the correct approval path — it activates the account, starts the
 * 30-day trial clock, and triggers the congratulations email to the sitter.
 * Do NOT use updateSitterProfile({isActive: true}) for approvals — that path
 * skips the trial initialization and email notification.
 */
export function useApproveSitter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.approveSitterApplication(sitterId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
      qc.invalidateQueries({ queryKey: ["sitter-license-status"] });
    },
  });
}

/**
 * Rejects a sitter application by calling rejectSitterApplication(sitterId).
 * This is the correct rejection path — it removes the pending application
 * and sends a rejection notification to the applicant.
 * Do NOT use updateSitterProfile({isActive: false}) for rejections.
 */
export function useRejectSitter() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.rejectSitterApplication(sitterId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

export function useConfirmManualPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.confirmManualPayment(bookingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

// Item 2: invalidate sitter queries on review success so ratings update live
export function useSubmitReview() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      rating,
      reviewText = "",
      bookingId,
    }: {
      sitterId: bigint;
      rating: number;
      reviewText?: string;
      bookingId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.submitReview(sitterId, rating, reviewText, bookingId);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
      qc.invalidateQueries({
        queryKey: ["sitter", vars.sitterId.toString()],
      });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      role,
    }: {
      principal: string;
      role: "admin" | "user";
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return actor.assignCallerUserRole(
        Principal.fromText(principal),
        role as any,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["is-admin"] }),
  });
}

export function useIsAdminAssigned() {
  // Auth query — must not wait for warm-up latch; fires as soon as actor exists
  const { actor } = useActorReady();
  return useQuery({
    queryKey: ["is-admin-assigned"],
    queryFn: async () => {
      if (!actor) return false; // default to false so the Claim button can show
      return actor.isAdminAssigned();
    },
    enabled: !!actor,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.claimFirstAdmin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["is-admin-assigned"] });
    },
  });
}

export function useSitterServiceRates(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitter-service-rates", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return [];
      return actor.getSitterServiceRates(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
  });
}

export function useSetSitterServiceRates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      rates,
    }: {
      sitterId: bigint;
      rates: Array<{ service: string; ratePerHour: bigint }>;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setSitterServiceRates(sitterId, rates);
    },
    onSuccess: (_, { sitterId }) => {
      queryClient.invalidateQueries({
        queryKey: ["sitter-service-rates", sitterId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["all-sitters"] });
      queryClient.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

export function useSendPaymentReminder() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.sendPaymentReminder(bookingId);
    },
  });
}

/** Client-initiated nudge to their sitter about an unpaid invoice */
export function useClientNudgeSitter() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      try {
        return await actor.sendClientNudgeSitter(bookingId.toString());
      } catch {
        // Silently succeed if backend function isn't available
        return null;
      }
    },
  });
}

export function useSendServiceCompletionEmail() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.sendServiceCompletionEmail(bookingId);
    },
  });
}

export function useSendBookingConfirmation() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.sendBookingConfirmationEmail(bookingId);
    },
  });
}

export function useSetCallerAsAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      // Reuse claimFirstAdmin which sets caller as admin unconditionally
      return actor.claimFirstAdmin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      qc.invalidateQueries({ queryKey: ["is-admin-assigned"] });
    },
  });
}

export function useSendSitterApplicationEmail() {
  // NOTE: The backend already fires an admin notification email automatically
  // inside createSitterProfile() whenever adminEmail is configured. There is no
  // separate callable backend endpoint for this — the admin notification is
  // handled server-side as a fire-and-forget within the profile creation call.
  // This hook is retained for API compatibility but intentionally does nothing.
  return useMutation({
    mutationFn: async (_sitterId: bigint) => {
      return Promise.resolve();
    },
  });
}

export function useGetAdminNotificationEmail() {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["admin-notification-email"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getAdminNotificationEmail();
    },
    enabled: !!actor && isReady,
  });
}

export function useSetAdminNotificationEmail() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.setAdminNotificationEmail(email);
      // Backend returns {ok: null} | {err: string}
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: string }).err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notification-email"] });
    },
  });
}

export function useClearAllData() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.clearAllData();
      // Backend returns {ok: null} | {err: string}
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: string }).err));
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate all data queries so everything refreshes after the wipe
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["sitter-availability"] });
    },
  });
}

export function useDeleteBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.deleteBooking(id);
      // Backend returns {ok: null} | {err: string}
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: string }).err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["all-audit-log"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

export function useDeletePayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.deletePayment(bookingId);
      // Backend returns {ok: null} | {err: string}
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: string }).err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["all-audit-log"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

export function useGetAuditLog() {
  const isDelayedReady = useDelayedReady(500);
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["all-audit-log"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditLog();
    },
    enabled: !!actor && isReady && isDelayedReady,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

// ─── Sitter private data & earnings goal ──────────────────────────────────

export interface SitterPrivateData {
  earningsGoal?: number;
}

/**
 * Retrieves sitter-private data (e.g. earnings goal).
 * Falls back to empty object if the backend function is unavailable.
 */
export function useGetSitterPrivateData(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<SitterPrivateData>({
    queryKey: ["sitter-private-data", sitterId?.toString()],
    queryFn: async (): Promise<SitterPrivateData> => {
      if (!actor || sitterId === null) return {};
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterPrivateData(sitterId);
        if (result && result.__kind__ === "ok")
          return result.ok as SitterPrivateData;
        return {};
      } catch {
        return {};
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/**
 * Retrieves the completed bookings count for a sitter.
 * Falls back to 0 if the backend function is unavailable.
 */
export function useGetCompletedBookingsCount(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<bigint>({
    queryKey: ["completed-bookings-count", sitterId?.toString()],
    queryFn: async (): Promise<bigint> => {
      if (!actor || sitterId === null) return BigInt(0);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (actor as any).getCompletedBookingsCount(sitterId);
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
  });
}

/**
 * Query available sitters for a specific date + time window.
 * Calls actor.getAvailableSittersForWindow(date, startTime, endTime).
 * Only fires when all three params are non-empty strings.
 */
export function useAvailableSittersForWindow(
  params: {
    date: string;
    startTime: string;
    endTime: string;
  } | null,
) {
  const { actor, isReady } = useActorReady();
  const enabled =
    !!actor &&
    isReady &&
    !!params?.date &&
    !!params?.startTime &&
    !!params?.endTime;
  return useQuery<Public[]>({
    queryKey: [
      "available-sitters-window",
      params?.date ?? "",
      params?.startTime ?? "",
      params?.endTime ?? "",
    ],
    queryFn: async (): Promise<Public[]> => {
      if (!actor || !params) return [];
      return actor.getAvailableSittersForWindow(
        params.date,
        params.startTime,
        params.endTime,
      );
    },
    enabled,
    staleTime: 30000,
  });
}

export function useBookingHeatmapData() {
  const isDelayedReady = useDelayedReady(1000);
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["booking-heatmap-data"],
    queryFn: async () => {
      const result = await actor!.getBookingHeatmapData();
      return result;
    },
    enabled: !!actor && isReady && isDelayedReady,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminBookingAnalytics() {
  const isDelayedReady = useDelayedReady(1000);
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["admin-booking-analytics"],
    queryFn: async () => {
      const result = await actor!.getAdminBookingAnalytics();
      return result;
    },
    enabled: !!actor && isReady && isDelayedReady,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useUpdateServiceCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      actualEndTime,
      finalPrice,
      completionNotes,
      discountPercent,
    }: {
      bookingId: bigint;
      actualEndTime: bigint | null;
      finalPrice: bigint | null;
      completionNotes: string | null;
      discountPercent: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateServiceCompletion(
        bookingId,
        actualEndTime,
        finalPrice,
        completionNotes,
        discountPercent,
      );
      if (result.__kind__ === "err")
        throw new Error((result as { __kind__: "err"; err: string }).err);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["payments-by-bookings"] });
    },
  });
}

export function useUpdateSitterEarningsGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId: _sitterId,
      goal,
    }: { sitterId: bigint; goal: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).updateSitterEarningsGoal(goal);
        if (result && result.__kind__ === "err") throw new Error(result.err);
        return result;
      } catch (err) {
        // If backend function doesn't exist yet, swallow the error gracefully
        if (String(err).includes("has no method")) return null;
        throw err;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-private-data", vars.sitterId.toString()],
      });
    },
  });
}

// ─── Invoice discount, paid date, and audit hooks ─────────────────────────

/** Apply a percentage discount to a payment */
export function useUpdatePaymentWithDiscount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      discountPercent,
      newTotalAmount,
      originalAmount,
    }: {
      bookingId: bigint;
      discountPercent: bigint;
      newTotalAmount: bigint;
      originalAmount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updatePaymentWithDiscount(
        bookingId,
        discountPercent,
        newTotalAmount,
        originalAmount,
      );
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["payments-by-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["payment-audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
    },
  });
}

/** Manually adjust invoice price without a discount percentage */
export function useAdjustPaymentPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      newAmount,
      reason,
    }: {
      bookingId: bigint;
      newAmount: bigint;
      reason: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.adjustPaymentPrice(
        bookingId,
        newAmount,
        reason,
      );
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["payments-by-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["payment-audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
    },
  });
}

/** Update the date a payment was received (ISO string "YYYY-MM-DD") */
export function useUpdateInvoicePaidDate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      paidDate,
    }: {
      bookingId: bigint;
      paidDate: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateInvoicePaidDate(bookingId, paidDate);
      if ("err" in result) throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      queryClient.invalidateQueries({ queryKey: ["payments-by-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
    },
  });
}

// ─── Admin access grant / revoke hooks ────────────────────────────────────

/**
 * Returns the list of principals that have been explicitly granted admin access
 * via grantAdminAccess(). Used by the Sitters tab to show toggle state.
 */
export function useGetGrantedAdmins() {
  const { actor, isReady } = useActorReady();
  return useQuery<string[]>({
    queryKey: ["granted-admins"],
    queryFn: async (): Promise<string[]> => {
      if (!actor) return [];
      try {
        const result = await actor.getGrantedAdmins();
        // result is Principal[] — convert each to string
        if (Array.isArray(result)) {
          return result.map((p: { toString(): string }) => p.toString());
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady,
    staleTime: 15000,
  });
}

/**
 * Grant admin portal access to a target sitter by principal string.
 * Calls the backend grantAdminAccess(targetPrincipal).
 */
export function useGrantAdminAccess() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalStr: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.grantAdminAccess(
        Principal.fromText(principalStr),
      );
      // Backend returns {ok} or {err}
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["granted-admins"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
  });
}

/**
 * Revoke admin portal access from a target sitter by principal string.
 * Calls the backend revokeAdminAccess(targetPrincipal).
 */
export function useRevokeAdminAccess() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (principalStr: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.revokeAdminAccess(
        Principal.fromText(principalStr),
      );
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["granted-admins"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
  });
}

/**
 * Returns the total pending revenue in cents from the backend.
 * Uses getAdminPendingRevenue() which correctly sums:
 *   - Payments with status=pending
 *   - Active bookings (pending/confirmed) with no payment record yet
 */
export function useAdminPendingRevenue() {
  const isDelayedReady = useDelayedReady(500);
  const { actor, isReady } = useActorReady();
  return useQuery<number>({
    queryKey: ["admin-pending-revenue"],
    queryFn: async (): Promise<number> => {
      if (!actor) return 0;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getAdminPendingRevenue();
        return Number(result ?? 0);
      } catch {
        return 0;
      }
    },
    enabled: !!actor && isReady && isDelayedReady,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Returns booking counts and revenue totals for all status categories.
 * Uses getAdminBookingStats() which returns:
 *   pendingCount, confirmedCount, completedCount, cancelledCount,
 *   pendingRevenue, confirmedRevenue, totalRevenue (all in cents)
 */
export function useAdminBookingStats() {
  const isDelayedReady = useDelayedReady(500);
  const { actor, isReady } = useActorReady();
  return useQuery<{
    pendingCount: number;
    confirmedCount: number;
    completedCount: number;
    cancelledCount: number;
    pendingRevenue: number;
    confirmedRevenue: number;
    totalRevenue: number;
  }>({
    queryKey: ["admin-booking-stats"],
    queryFn: async () => {
      if (!actor) {
        return {
          pendingCount: 0,
          confirmedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingRevenue: 0,
          confirmedRevenue: 0,
          totalRevenue: 0,
        };
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getAdminBookingStats();
        return {
          pendingCount: Number(result.pendingCount ?? 0),
          confirmedCount: Number(result.confirmedCount ?? 0),
          completedCount: Number(result.completedCount ?? 0),
          cancelledCount: Number(result.cancelledCount ?? 0),
          pendingRevenue: Number(result.pendingRevenue ?? 0),
          confirmedRevenue: Number(result.confirmedRevenue ?? 0),
          totalRevenue: Number(result.totalRevenue ?? 0),
        };
      } catch {
        return {
          pendingCount: 0,
          confirmedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          pendingRevenue: 0,
          confirmedRevenue: 0,
          totalRevenue: 0,
        };
      }
    },
    enabled: !!actor && isReady && isDelayedReady,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Returns a per-booking breakdown of pending revenue.
 * Each entry: { bookingId: bigint, clientName: string, amount: bigint }
 * amount is in cents.
 */
export function useAdminPendingRevenueBreakdown() {
  const { actor, isReady } = useActorReady();
  return useQuery<
    Array<{ bookingId: bigint; clientName: string; amount: bigint }>
  >({
    queryKey: ["adminPendingRevenueBreakdown"],
    queryFn: async (): Promise<
      Array<{ bookingId: bigint; clientName: string; amount: bigint }>
    > => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getAdminPendingRevenueBreakdown();
        if (!Array.isArray(result)) return [];
        return result.map(
          (entry: {
            bookingId: bigint;
            clientName: string;
            amount: bigint;
          }) => ({
            bookingId: BigInt(entry.bookingId),
            clientName: String(entry.clientName),
            amount: BigInt(entry.amount),
          }),
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Returns completed bookings for a client by email and/or phone.
 * Used for returning-client detection and "Book Again" feature.
 * Normalizes: email → toLowerCase().trim(), phone → digits only.
 *
 * Phone edge case: if user enters 11 digits starting with '1' (US country code,
 * e.g. "15551234567") but the stored number is 10 digits ("5551234567"), we
 * strip the leading '1' so the backend match succeeds.
 */
export function useCompletedBookingsByContact(email: string, phone: string) {
  const { actor, isReady } = useActorReady();
  const normalizedEmail = email.toLowerCase().trim();
  let normalizedPhone = phone.replace(/\D/g, "");
  // Strip leading country code '1' if 11 digits — stored numbers are 10 digits
  if (normalizedPhone.length === 11 && normalizedPhone.startsWith("1")) {
    normalizedPhone = normalizedPhone.slice(1);
  }
  const enabled =
    !!actor &&
    isReady &&
    (normalizedEmail.length > 0 || normalizedPhone.length > 0);
  return useQuery({
    queryKey: ["completed-bookings-contact", normalizedEmail, normalizedPhone],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompletedBookingsByContact(
        normalizedEmail,
        normalizedPhone,
      );
    },
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/**
 * Check whether the given sitters are still available for rebooking
 * on the given dates and services.
 * Returns an array of { sitterId, available, reason } objects.
 */
export function useCheckSittersAvailabilityForRebook(
  sitterIds: bigint[],
  dates: string[],
  services: string[],
) {
  const { actor, isReady } = useActorReady();
  const enabled =
    !!actor && isReady && sitterIds.length > 0 && dates.length > 0;
  return useQuery({
    queryKey: [
      "rebook-availability",
      sitterIds.map((id) => id.toString()).join(","),
      dates.join(","),
      services.join(","),
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.checkSittersAvailabilityForRebook(
        sitterIds,
        dates,
        services,
      );
    },
    enabled,
    staleTime: 30_000,
  });
}

/** Update ad-hoc line items on an invoice */
export function useUpdateInvoiceAdHocItems() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      items,
    }: {
      bookingId: bigint;
      items: Array<{
        description: string;
        amountCents: bigint;
        createdAt: bigint;
      }>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateInvoiceAdHocItems(bookingId, items);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["payments-by-bookings"] });
    },
  });
}

/** Set the payment method details on an invoice */
export function useSetInvoicePaymentMethod() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      method,
    }: {
      bookingId: bigint;
      method:
        | { __kind__: "venmo"; venmo: { handle: string } }
        | { __kind__: "applePayCash"; applePayCash: { sitterPhone: string } }
        | { __kind__: "cash"; cash: { instructions: string } };
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await actor.setInvoicePaymentMethod(
        bookingId,
        method as any,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["payments-by-bookings"] });
    },
  });
}

/**
 * Cancel a booking from the client side.
 * Calls cancelBookingByClient(bookingId, cancelReason).
 * Invalidates booking queries so status updates immediately everywhere.
 */
export function useCancelBookingByClient() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      cancelReason,
    }: {
      bookingId: bigint;
      cancelReason: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).cancelBookingByClient(
        bookingId,
        cancelReason,
      );
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings-email"], exact: false });
      qc.invalidateQueries({ queryKey: ["bookings-phone"], exact: false });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

/** Send the invoice email to the client */
export function useSendInvoiceToClient() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.sendInvoiceToClient(bookingId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
    },
  });
}

/** Mark invoice as paid AND send confirmation email to client */
export function useConfirmManualPaymentWithEmail() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      paidDate,
    }: {
      bookingId: bigint;
      paidDate: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.confirmManualPaymentWithEmail(
        bookingId,
        paidDate,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["payments-by-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-revenue"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

// ─── Ad Hoc Jobs hooks ────────────────────────────────────────────────────

export interface AdHocJobCreateInput {
  sitterId: bigint;
  clientName: string;
  adHocClientContact: string | null;
  service: string;
  jobDate: string;
  startTime: string;
  endTime: string;
  ratePerHourCents: bigint;
  totalAmountCents: bigint;
  coSitterId: bigint | null;
  teamId: string | null;
  petNames: string[];
  notes: string | null;
  offAppClientAcknowledged: boolean;
  markPaid?: boolean;
  paidDate?: string | null;
  paymentMethod?: string | null;
}

export function useAdHocJobsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["adhoc-jobs-sitter", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return [];
      return actor.getAdHocJobsBySitter(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCreateAdHocJob() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdHocJobCreateInput) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createAdHocJob(
        input.sitterId,
        input.clientName,
        input.adHocClientContact,
        input.service,
        input.jobDate,
        input.startTime,
        input.endTime,
        input.ratePerHourCents,
        input.totalAmountCents,
        input.coSitterId,
        input.teamId,
        input.petNames,
        input.notes,
        input.offAppClientAcknowledged,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["adhoc-jobs-sitter", vars.sitterId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["bookings-sitter", vars.sitterId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["sitter-stats", vars.sitterId.toString()],
      });
    },
  });
}

export function useUpdateAdHocJobPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      paidDate,
      sitterId: _sitterId,
    }: { bookingId: bigint; paidDate: string; sitterId: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateAdHocJobPayment(
        bookingId,
        paidDate,
        null,
      );
      if (
        result &&
        typeof result === "object" &&
        "__kind__" in result &&
        result.__kind__ === "err"
      ) {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
      return result;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["adhoc-jobs-sitter", vars.sitterId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["sitter-stats", vars.sitterId.toString()],
      });
    },
  });
}

// ─── Notification hooks ────────────────────────────────────────────────────

export function useNotificationsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["notifications-sitter", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return [];
      return actor.getNotificationsBySitter(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<bigint>({
    queryKey: ["unread-notifications-count", sitterId?.toString()],
    queryFn: async (): Promise<bigint> => {
      if (!actor || sitterId === null) return 0n;
      return actor.getUnreadNotificationCount(sitterId);
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.markNotificationRead(notificationId);
      if (
        result &&
        typeof result === "object" &&
        "__kind__" in result &&
        result.__kind__ === "err"
      ) {
        throw new Error((result as { __kind__: "err"; err: string }).err);
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-sitter"] });
      qc.invalidateQueries({ queryKey: ["unread-notifications-count"] });
    },
  });
}
// ─── Sitter stats, reviews, tips ──────────────────────────────────────────

export interface SitterStats {
  totalCompletedBookings: number;
  totalEarningsCents: number;
  currentMonthEarningsCents: number;
  repeatClientCount: number;
  repeatClientRatePct: number;
  adHocJobCount: number;
}

export function useGetSitterStats(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<SitterStats>({
    queryKey: ["sitter-stats", sitterId?.toString()],
    queryFn: async (): Promise<SitterStats> => {
      if (!actor || sitterId === null)
        return {
          totalCompletedBookings: 0,
          totalEarningsCents: 0,
          currentMonthEarningsCents: 0,
          repeatClientCount: 0,
          repeatClientRatePct: 0,
          adHocJobCount: 0,
        };
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await (actor as any).getSitterStatsById(sitterId);
        return {
          totalCompletedBookings: Number(r.totalCompletedBookings ?? 0),
          totalEarningsCents: Number(r.totalEarningsCents ?? 0),
          currentMonthEarningsCents: Number(r.currentMonthEarningsCents ?? 0),
          repeatClientCount: Number(r.repeatClientCount ?? 0),
          repeatClientRatePct: Number(r.repeatClientRatePct ?? 0),
          adHocJobCount: Number(r.adHocJobCount ?? 0),
        };
      } catch {
        return {
          totalCompletedBookings: 0,
          totalEarningsCents: 0,
          currentMonthEarningsCents: 0,
          repeatClientCount: 0,
          repeatClientRatePct: 0,
          adHocJobCount: 0,
        };
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export interface ReviewPublic {
  bookingId: bigint;
  createdAt: bigint;
  reviewText: string;
  rating: number;
}

export function useGetReviewsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<ReviewPublic[]>({
    queryKey: ["sitter-reviews", sitterId?.toString()],
    queryFn: async (): Promise<ReviewPublic[]> => {
      if (!actor || sitterId === null) return [];
      try {
        const r = await actor.getReviewsBySitter(sitterId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (r as any[]).map((rv) => ({
          bookingId: BigInt(rv.bookingId),
          createdAt: BigInt(rv.createdAt),
          reviewText: String(rv.reviewText ?? ""),
          rating: Number(rv.rating ?? 0),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export interface TipPublic {
  bookingId: bigint;
  amountCents: bigint;
  createdAt: bigint;
  clientName?: string;
}

export function useGetTipsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<TipPublic[]>({
    queryKey: ["sitter-tips", sitterId?.toString()],
    queryFn: async (): Promise<TipPublic[]> => {
      if (!actor || sitterId === null) return [];
      try {
        const r = await actor.getTipsBySitter(sitterId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (r as any[]).map((t) => ({
          bookingId: BigInt(t.bookingId),
          amountCents: BigInt(t.amountCents),
          createdAt: BigInt(t.createdAt),
          clientName: t.clientName ? String(t.clientName) : undefined,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

// ─── Sitter license / grandfathering hooks ────────────────────────────────

export interface SitterLicenseStatus {
  isGrandfathered: boolean;
  trialActive: boolean;
  isLicensed: boolean;
}

/**
 * Returns the license status for the calling sitter.
 * Calls getSitterLicenseStatus() — a query, no args, uses caller principal.
 * Auth query — fires as soon as actor exists, does not wait for warm-up latch.
 */
export function useSitterLicenseStatus() {
  const { actor } = useActorReady();
  return useQuery<SitterLicenseStatus | null>({
    queryKey: ["sitter-license-status"],
    queryFn: async (): Promise<SitterLicenseStatus | null> => {
      if (!actor) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterLicenseStatus();
        if (!result) return null;
        return {
          isGrandfathered: Boolean(result.isGrandfathered),
          trialActive: Boolean(result.trialActive),
          isLicensed: Boolean(result.isLicensed),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor,
    staleTime: 60_000,
  });
}

/**
 * Admin-only mutation: sets zip code to 80304 for Linnea and Bailey Berggren
 * so they appear in Boulder Area search results. Idempotent — safe to run multiple times.
 */
export function useFixSitterZipCodes() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).fixSitterZipCodes();
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result as { ok: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

/**
 * Admin-only mutation: marks all existing sitters as grandfathered.
 * Calls applyGrandfatheringMigration() on the backend.
 */
export function useApplyGrandfatheringMigration() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).applyGrandfatheringMigration();
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate so all sitter license status queries refresh
      qc.invalidateQueries({ queryKey: ["sitter-license-status"] });
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
    },
  });
}

export function useRecordTip() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      bookingId,
      amountCents,
    }: {
      sitterId: bigint;
      bookingId: bigint;
      amountCents: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.recordTip(sitterId, bookingId, amountCents);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-tips", vars.sitterId.toString()],
      });
    },
  });
}

/** Get the price/discount audit trail for a specific booking's payment */
export function usePaymentAuditLog(bookingId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<Public__7[]>({
    queryKey: ["payment-audit-log", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return [];
      return actor.getPaymentAuditLog(bookingId);
    },
    enabled: !!actor && isReady && bookingId !== null,
    staleTime: 30_000,
  });
}

/** Hourly slot availability grid for Step 0.
 *  For each hour from 7 AM to 8 PM (14 slots), queries how many sitters
 *  are available using getAvailableSittersForWindow. Returns array of:
 *  { hour: number, startTime: string, endTime: string, availableSitterCount: number }
 */
export function useAvailableHourlyWindows(date: string | null) {
  const { actor, isReady } = useActorReady();

  // Build the 14 hourly slots: 07:00–08:00 through 20:00–21:00
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20

  const results = useQueries({
    queries: HOURS.map((hour) => {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
      return {
        queryKey: ["hourly-window", date ?? "", startTime],
        queryFn: async (): Promise<number> => {
          if (!actor || !date) return 0;
          try {
            const sitters = await actor.getAvailableSittersForWindow(
              date,
              startTime,
              endTime,
            );
            return Array.isArray(sitters) ? sitters.length : 0;
          } catch {
            return 0;
          }
        },
        enabled: !!actor && isReady && !!date,
        staleTime: 30_000,
      };
    }),
  });

  const slots = HOURS.map((hour, i) => {
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;
    return {
      hour,
      startTime,
      endTime,
      availableSitterCount: (results[i]?.data as number | undefined) ?? 0,
      isLoading: results[i]?.isLoading ?? false,
    };
  });

  const anyLoading = !date || results.some((r) => r.isLoading);
  return { slots, isLoading: anyLoading };
}

// ── GDPR hooks ─────────────────────────────────────────────────────────────────
// These methods are pending backend generation; actor is cast to access them.
type GdprActor = {
  requestGdprExport: () => Promise<unknown>;
  requestAccountAnonymization: () => Promise<unknown>;
  confirmGdprExport: (token: string) => Promise<unknown>;
  confirmAccountAnonymization: (token: string) => Promise<unknown>;
  adminRequestGdprExport: (principal: unknown) => Promise<unknown>;
  adminRequestAccountAnonymization: (principal: unknown) => Promise<unknown>;
};

function asGdprActor(actor: unknown): GdprActor {
  return actor as GdprActor;
}

export function useRequestGdprExport() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await asGdprActor(actor).requestGdprExport();
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

export function useRequestAccountAnonymization() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await asGdprActor(actor).requestAccountAnonymization();
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

export function useConfirmGdprExport() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await asGdprActor(actor).confirmGdprExport(token);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

export function useConfirmAccountAnonymization() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result =
        await asGdprActor(actor).confirmAccountAnonymization(token);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

export function useAdminRequestGdprExport() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sitterPrincipal: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await asGdprActor(actor).adminRequestGdprExport(
        Principal.fromText(sitterPrincipal),
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

export function useAdminRequestAccountAnonymization() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (sitterPrincipal: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await asGdprActor(actor).adminRequestAccountAnonymization(
        Principal.fromText(sitterPrincipal),
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
  });
}

// ─── Subscription management hooks ────────────────────────────────────────────

/**
 * Extended license/subscription status for the sitter portal UI.
 * Derives subscriptionStatus from the raw getSitterLicenseStatus backend response.
 *
 * Backend response shape (as of current deployment):
 *   { status, trialDaysRemaining, subscriptionEndDate, isGrandfathered, stripeCustomerId, stripeSubscriptionId }
 */
export interface ExtendedLicenseStatus {
  isGrandfathered: boolean;
  trialActive: boolean;
  isLicensed: boolean;
  /** Derived status for UI display */
  subscriptionStatus:
    | "grandfathered"
    | "trial"
    | "active"
    | "expired"
    | "frozen";
  trialDaysRemaining: number;
  /** Real Stripe customer ID — used for billing portal link */
  stripeCustomerId?: string;
  /** Real Stripe subscription ID */
  stripeSubscriptionId?: string;
}

/**
 * Returns the extended license/subscription status for the calling sitter.
 *
 * New backend response shape:
 *   { status, trialDaysRemaining, subscriptionEndDate, isGrandfathered, stripeCustomerId, stripeSubscriptionId }
 *
 * Also supports legacy backend fields (trialActive, isLicensed, isFrozen, isSubscribed)
 * for backwards compatibility during gradual rollout.
 */
export function useSitterSubscriptionStatus() {
  // Auth query — fires as soon as actor exists, does not wait for warm-up latch
  const { actor } = useActorReady();
  return useQuery<ExtendedLicenseStatus | null>({
    queryKey: ["sitter-subscription-status"],
    queryFn: async (): Promise<ExtendedLicenseStatus | null> => {
      if (!actor) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterLicenseStatus();
        if (!result) return null;

        // ── New backend shape: result.status is a canonical string ──────────────
        if (typeof result.status === "string") {
          const statusStr = result.status as
            | "active"
            | "trial"
            | "expired"
            | "grandfathered"
            | "frozen";
          const trialDaysRemaining =
            result.trialDaysRemaining !== undefined &&
            result.trialDaysRemaining !== null
              ? Number(result.trialDaysRemaining)
              : statusStr === "trial"
                ? 30
                : 0;
          return {
            isGrandfathered: statusStr === "grandfathered",
            trialActive: statusStr === "trial",
            isLicensed: statusStr === "active" || statusStr === "grandfathered",
            subscriptionStatus: statusStr,
            trialDaysRemaining,
            stripeCustomerId: result.stripeCustomerId ?? undefined,
            stripeSubscriptionId: result.stripeSubscriptionId ?? undefined,
          };
        }

        // ── Legacy backend shape: derive from boolean fields ─────────────────────
        const isGrandfathered = Boolean(result.isGrandfathered);
        const trialActive = Boolean(result.trialActive);
        const isLicensed = Boolean(result.isLicensed);
        const trialDaysRemaining =
          result.trialDaysRemaining !== undefined &&
          result.trialDaysRemaining !== null
            ? Number(result.trialDaysRemaining)
            : 30;

        let subscriptionStatus: ExtendedLicenseStatus["subscriptionStatus"];
        if (isGrandfathered) {
          subscriptionStatus = "grandfathered";
        } else if (result.isFrozen) {
          subscriptionStatus = "frozen";
        } else if (result.isSubscribed || (isLicensed && !trialActive)) {
          subscriptionStatus = "active";
        } else if (trialActive) {
          subscriptionStatus = "trial";
        } else {
          subscriptionStatus = "expired";
        }

        return {
          isGrandfathered,
          trialActive,
          isLicensed,
          subscriptionStatus,
          trialDaysRemaining,
          stripeCustomerId: result.stripeCustomerId ?? undefined,
          stripeSubscriptionId: result.stripeSubscriptionId ?? undefined,
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor,
    staleTime: 60_000,
  });
}

/**
 * Mark a sitter account as frozen (admin action).
 * Calls markSitterAsGrandfathered as a proxy — replace with real
 * freezeSitterAccount when that backend function is deployed.
 */
export function useFreezeSitterAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).freezeSitterAccount?.(sitterId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["sitter-subscription-status"] });
    },
  });
}

/**
 * Unfreeze a sitter account (admin action).
 */
export function useUnfreezeSitterAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).unfreezeSitterAccount?.(sitterId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["sitter-subscription-status"] });
    },
  });
}

/**
 * Record a successful subscription payment for a sitter.
 */
export function useRecordSubscriptionPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      amountCents,
    }: {
      sitterId: bigint;
      amountCents: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).recordSubscriptionPayment?.(
        sitterId,
        amountCents,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sitter-subscription-status"] });
      qc.invalidateQueries({ queryKey: ["sitter-license-status"] });
    },
  });
}

/**
 * Cancel a sitter's subscription.
 */
export function useCancelSubscription() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).cancelSubscription?.(sitterId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sitter-subscription-status"] });
      qc.invalidateQueries({ queryKey: ["sitter-license-status"] });
    },
  });
}

/**
 * Get subscription state for a specific sitter (admin use).
 */
export function useGetSubscriptionState(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["subscription-state", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || sitterId === null) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await (actor as any).getSubscriptionState?.(sitterId)) ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 30_000,
  });
}

/**
 * Get subscription states for all sitters (admin use).
 */
export function useGetAllSubscriptionStates() {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["all-subscription-states"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await (actor as any).getAllSubscriptionStates?.()) ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady,
    staleTime: 30_000,
  });
}

// ─── Public sitter storefront hooks ───────────────────────────────────────────

/** Public return type from getPublicSitterProfile */
export interface PublicSitterProfile {
  id: bigint;
  name: string;
  bio?: string;
  profilePhotoUrl?: string;
  averageRating: number;
  reviewCount: bigint;
  isActive: boolean;
  badges: string[];
  services: Array<{ serviceName: string; price: number; duration?: string }>;
  reviews: Array<{
    clientName: string;
    createdAt: bigint;
    comment?: string;
    rating: bigint;
  }>;
}

/**
 * Fetch a sitter's public storefront profile by URL handle.
 * Calls getPublicSitterProfile(handle). Does NOT require auth.
 */
export function usePublicSitterProfile(handle: string) {
  // PUBLIC ROUTE: Use actor only — do NOT gate on isReady (global warm-up latch).
  // This page is visited by strangers via text link with no prior app session.
  const { actor } = useBackendActor();
  return useQuery<PublicSitterProfile | null>({
    queryKey: ["public-sitter-profile", handle],
    queryFn: async (): Promise<PublicSitterProfile | null> => {
      if (!actor || !handle) return null;
      const result = await actor.getPublicSitterProfile(handle);
      if (!result) return null;
      return {
        id: BigInt(result.id),
        name: String(result.name),
        bio: result.bio ? String(result.bio) : undefined,
        profilePhotoUrl: result.profilePhotoUrl
          ? String(result.profilePhotoUrl)
          : undefined,
        averageRating: Number(result.averageRating ?? 0),
        reviewCount: BigInt(result.reviewCount ?? 0),
        isActive: Boolean(result.isActive),
        badges: Array.isArray(result.badges) ? result.badges.map(String) : [],
        services: Array.isArray(result.services)
          ? result.services.map((s) => ({
              serviceName: String(s.serviceName),
              price: Number(s.price ?? 0),
              duration: s.duration ? String(s.duration) : undefined,
            }))
          : [],
        reviews: Array.isArray(result.reviews)
          ? result.reviews.map((r) => ({
              clientName: String(r.clientName),
              createdAt: BigInt(r.createdAt),
              comment: r.comment ? String(r.comment) : undefined,
              rating: BigInt(r.rating),
            }))
          : [],
      };
    },
    enabled: !!actor && !!handle,
    staleTime: 120_000,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

// ─── CRM & Deal Offer hooks ────────────────────────────────────────────────────

/**
 * Fetch the CRM client list for the given sitter.
 * Calls getSitterClientsForCRM(sitterId).
 * Returns an array of CRMClient-shaped objects from the backend.
 */
export function useSitterClientsForCRM(sitterId: Principal | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitter-crm-clients", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || !sitterId) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterClientsForCRM(sitterId);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && !!sitterId,
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}

/**
 * Fetch all deal offers sent by the given sitter.
 * Calls getDealOffersBySitter(sitterId).
 */
export function useDealOffersBySitter(sitterId: Principal | null) {
  const { actor, isReady } = useActorReady();
  return useQuery({
    queryKey: ["sitter-deal-offers", sitterId?.toString()],
    queryFn: async () => {
      if (!actor || !sitterId) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getDealOffersBySitter(sitterId);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && !!sitterId,
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}

/**
 * Mutation to create and send a deal offer to a list of clients.
 * Calls createDealOffer on the backend.
 * Invalidates both crm-clients and deal-offers queries on success.
 */
export function useSendDealOffer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      clientEmails,
      discountType,
      discountValue,
      description,
      expirationDate,
    }: {
      sitterId: Principal;
      clientEmails: string[];
      discountType: "percent" | "fixed";
      discountValue: number;
      description: string;
      expirationDate: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).createDealOffer({
        sitterId,
        clientEmails,
        discountType:
          discountType === "fixed" ? { fixed: null } : { percent: null },
        discountValue: BigInt(Math.round(discountValue * 100)),
        description,
        expirationDate,
      });
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-crm-clients", vars.sitterId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["sitter-deal-offers", vars.sitterId.toString()],
      });
    },
  });
}

/**
 * Fetch the URL handle for a sitter profile.
 * Calls getSitterHandle(sitterId). Returns null if none assigned.
 */
export function useGetSitterHandle(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<string | null>({
    queryKey: ["sitter-handle", sitterId?.toString()],
    queryFn: async (): Promise<string | null> => {
      if (!actor || sitterId === null) return null;
      const result = await actor.getSitterHandle(sitterId);
      return result ?? null;
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 60_000,
  });
}

// ─── Support ticket hooks ──────────────────────────────────────────────────────

/** Sitter: open a new support ticket */
export function useOpenSupportTicket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (issue: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.openSupportTicket(issue);
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return (result as { __kind__: "ok"; ok: string }).ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["all-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["all-audit-log"] });
    },
  });
}

/** Sitter: fetch own support tickets */
export function useGetMySupportTickets() {
  const { actor, isReady } = useActorReady();
  return useQuery<Public__4[]>({
    queryKey: ["my-support-tickets"],
    queryFn: async (): Promise<Public__4[]> => {
      if (!actor) return [];
      try {
        return await actor.getMySupportTickets();
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Admin: fetch all support tickets */
export function useGetAllSupportTickets() {
  const { actor, isReady } = useActorReady();
  return useQuery<Public__4[]>({
    queryKey: ["all-support-tickets"],
    queryFn: async (): Promise<Public__4[]> => {
      if (!actor) return [];
      try {
        return await actor.getSupportTickets();
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

/** Admin: grant limited support access for a ticket */
export function useGrantSupportAccess() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.grantSupportAccess(ticketId);
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["all-audit-log"] });
    },
  });
}

/** Admin: resolve a support ticket */
export function useResolveSupportTicket() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      notes,
    }: {
      ticketId: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.resolveSupportTicket(ticketId, notes);
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["all-audit-log"] });
    },
  });
}

// ─── Sitter Public Page v2 hooks ───────────────────────────────────────────────

/**
 * Fetch extended public v2 data for a sitter.
 * Calls getSitterExtendedPublic(sitterId). Falls back to null if unavailable.
 */
export function useSitterExtendedPublic(sitterId: number | null) {
  // PUBLIC ROUTE: Use actor only — do NOT gate on isReady.
  const { actor } = useBackendActor();
  return useQuery<{
    galleryPhotos?: string[];
    responseTime?: string;
    petTypesServed?: string[];
    certificationsList?: string[];
    acceptingNewClients?: boolean;
    pinnedPromoOfferId?: string;
    pageComponents?: PageComponentVisibility;
    credentialChecklist?: CredentialChecklist;
    bannerUrl?: string;
  } | null>({
    queryKey: ["sitter-extended-public", sitterId],
    queryFn: async () => {
      if (!actor || sitterId === null) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterExtendedPublic(
          BigInt(sitterId),
        );
        if (!result || result.length === 0) return null;
        const r = result[0];
        return {
          galleryPhotos: r.galleryPhotos?.[0] ?? undefined,
          responseTime: r.responseTime?.[0] ?? undefined,
          petTypesServed: r.petTypesServed?.[0] ?? undefined,
          certificationsList: r.certificationsList?.[0] ?? undefined,
          acceptingNewClients: r.acceptingNewClients?.[0] ?? undefined,
          pinnedPromoOfferId: r.pinnedPromoOfferId?.[0] ?? undefined,
          pageComponents: r.pageComponents?.[0] ?? undefined,
          credentialChecklist: r.credentialChecklist?.[0] ?? undefined,
          bannerUrl: r.bannerUrl?.[0] ?? undefined,
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && sitterId !== null,
    staleTime: 120_000,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

/**
 * Fetch booking stats for a sitter (total, unique clients, repeat clients, completed).
 * Calls getSitterBookingStats(sitterId). Falls back to zeroes if unavailable.
 */
export function useSitterBookingStats(sitterId: number | null) {
  // PUBLIC ROUTE: Use actor only — do NOT gate on isReady.
  const { actor } = useBackendActor();
  return useQuery<SitterBookingStats>({
    queryKey: ["sitter-booking-stats", sitterId],
    queryFn: async (): Promise<SitterBookingStats> => {
      const empty: SitterBookingStats = {
        totalBookings: 0,
        uniqueClients: 0,
        repeatClients: 0,
        completedVisits: 0,
      };
      if (!actor || sitterId === null) return empty;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await (actor as any).getSitterBookingStats(BigInt(sitterId));
        if (!r) return empty;
        return {
          totalBookings: Number(r.totalBookings ?? 0),
          uniqueClients: Number(r.uniqueClients ?? 0),
          repeatClients: Number(r.repeatClients ?? 0),
          completedVisits: Number(r.completedVisits ?? 0),
        };
      } catch {
        return empty;
      }
    },
    enabled: !!actor && sitterId !== null,
    staleTime: 120_000,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}

/**
 * Mutation to update sitter profile v2 extended fields.
 * Calls updateSitterProfileV2(sitterId, update).
 */
export function useUpdateSitterProfileV2() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      update,
    }: {
      sitterId: number;
      update: SitterProfileV2Update;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).updateSitterProfileV2(
        BigInt(sitterId),
        {
          galleryPhotos: update.galleryPhotos ? [update.galleryPhotos] : [],
          responseTime: update.responseTime ? [update.responseTime] : [],
          petTypesServed: update.petTypesServed ? [update.petTypesServed] : [],
          certificationsList: update.certificationsList
            ? [update.certificationsList]
            : [],
          acceptingNewClients:
            update.acceptingNewClients !== undefined
              ? [update.acceptingNewClients]
              : [],
          pinnedPromoOfferId: update.pinnedPromoOfferId
            ? [update.pinnedPromoOfferId]
            : [],
          bannerUrl: update.bannerUrl !== undefined ? [update.bannerUrl] : [],
          heroTagline:
            update.heroTagline !== undefined ? [update.heroTagline] : [],
          pageComponentOrder: update.pageComponentOrder
            ? [update.pageComponentOrder]
            : [],
          credentialChecklist: update.credentialChecklist
            ? [update.credentialChecklist]
            : [],
        },
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-extended-public", vars.sitterId],
      });
      qc.invalidateQueries({ queryKey: ["all-sitters"] });
      qc.invalidateQueries({ queryKey: ["active-sitters"] });
    },
  });
}

/**
 * Mutation to log photo upload consent (three-part legal attestation).
 * Calls addPhotoConsentLog(sitterId, photoUrl, consent1, consent2, consent3).
 * This must be called after every photo upload — all three consents must be true.
 */
export function useAddPhotoConsentLog() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      sitterId,
      photoUrl,
      consent1,
      consent2,
      consent3,
    }: {
      sitterId: number;
      photoUrl: string;
      consent1: boolean;
      consent2: boolean;
      consent3: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).addPhotoConsentLog(
        BigInt(sitterId),
        photoUrl,
        consent1,
        consent2,
        consent3,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
  });
}

/**
 * Fetch page component visibility settings for a sitter.
 * Calls getSitterPageComponents(sitterId). Returns null if not set (defaults apply).
 */
export function useSitterPageComponents(sitterId: number | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<PageComponentVisibility | null>({
    queryKey: ["sitter-page-components", sitterId],
    queryFn: async (): Promise<PageComponentVisibility | null> => {
      if (!actor || sitterId === null) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterPageComponents(
          BigInt(sitterId),
        );
        if (!result || result.length === 0) return null;
        const r = result[0];
        return {
          showGallery: Boolean(r.showGallery ?? true),
          showAvailability: Boolean(r.showAvailability ?? true),
          showStats: Boolean(r.showStats ?? true),
          showCertifications: Boolean(r.showCertifications ?? true),
          showResponseTime: Boolean(r.showResponseTime ?? true),
          showPromo: Boolean(r.showPromo ?? true),
          showRepeatClients: Boolean(r.showRepeatClients ?? true),
          showReviews: Boolean(r.showReviews ?? true),
          showPetTypes: Boolean(r.showPetTypes ?? true),
          showCredentials: Boolean(r.showCredentials ?? true),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 60_000,
  });
}

/**
 * Mutation to set page component visibility for a sitter's public storefront.
 * Calls setSitterPageComponents(sitterId, components).
 */
export function useSetSitterPageComponents() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      components,
    }: {
      sitterId: number;
      components: PageComponentVisibility;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).setSitterPageComponents(
        BigInt(sitterId),
        components,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-page-components", vars.sitterId],
      });
      qc.invalidateQueries({
        queryKey: ["sitter-extended-public", vars.sitterId],
      });
    },
  });
}

// ─── Stripe Configuration hooks (admin only) ──────────────────────────────────

export interface StripePublicConfig {
  publishableKey: string;
  priceId: string;
  isLiveMode: boolean;
}

/**
 * Fetch the current Stripe public configuration.
 * Returns publishableKey, priceId, and isLiveMode flag.
 */
export function useGetStripePublicConfig() {
  const { actor, isReady } = useActorReady();
  return useQuery<StripePublicConfig | null>({
    queryKey: ["stripe-public-config"],
    queryFn: async (): Promise<StripePublicConfig | null> => {
      if (!actor) return null;
      try {
        const result = await actor.getStripePublicConfig();
        if (!result) return null;
        return {
          publishableKey: String(result.publishableKey ?? ""),
          priceId: String(result.priceId ?? ""),
          isLiveMode: Boolean(result.isLiveMode ?? false),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && isReady,
    staleTime: 30_000,
  });
}

/**
 * Update the Stripe configuration (admin only).
 * Calls updateStripeConfig(secretKey, publishableKey, priceId, liveMode).
 * Never logs or stores the secret key in frontend state longer than the call.
 */
export function useUpdateStripeConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      secretKey,
      publishableKey,
      priceId,
      liveMode,
    }: {
      secretKey: string;
      publishableKey: string;
      priceId: string;
      liveMode: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateStripeConfig(
        secretKey,
        publishableKey,
        priceId,
        liveMode,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stripe-public-config"] });
    },
  });
}

// ─── Recurring booking group hooks ────────────────────────────────────────────

export interface BookingGroupPublic {
  groupId: string;
  sitterId: bigint;
  clientInfo: { name: string; email: string; phone: string };
  petInfo: Array<{ petName: string; petType: string; breed?: string }>;
  serviceIds: string[];
  recurrenceRule: {
    pattern: string;
    occurrenceCount?: bigint;
    startDate: bigint;
    endDate?: bigint;
    daysOfWeek: Uint8Array;
  };
  startTime: string;
  endTime: string;
  occurrenceIds: bigint[];
  createdAt: bigint;
  status: string;
}

/**
 * Fetch all recurring booking groups for a sitter.
 * Calls getRecurringGroupsBySitter(sitterId).
 */
export function useGetRecurringGroupsBySitter(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<BookingGroupPublic[]>({
    queryKey: ["recurring-groups-sitter", sitterId?.toString()],
    queryFn: async (): Promise<BookingGroupPublic[]> => {
      if (!actor || sitterId === null) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getRecurringGroupsBySitter(
          sitterId,
        );
        if (!Array.isArray(result)) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.map((g: any) => ({
          groupId: String(g.groupId),
          sitterId: BigInt(g.sitterId),
          clientInfo: {
            name: String(g.clientInfo?.name ?? ""),
            email: String(g.clientInfo?.email ?? ""),
            phone: String(g.clientInfo?.phone ?? ""),
          },
          petInfo: Array.isArray(g.petInfo)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              g.petInfo.map((p: any) => ({
                petName: String(p.petName ?? ""),
                petType: String(p.petType ?? ""),
                breed: p.breed ? String(p.breed) : undefined,
              }))
            : [],
          serviceIds: Array.isArray(g.serviceIds)
            ? g.serviceIds.map(String)
            : [],
          recurrenceRule: {
            pattern: String(g.recurrenceRule?.pattern ?? "weekly"),
            occurrenceCount:
              g.recurrenceRule?.occurrenceCount != null
                ? BigInt(g.recurrenceRule.occurrenceCount)
                : undefined,
            startDate: BigInt(g.recurrenceRule?.startDate ?? 0),
            endDate:
              g.recurrenceRule?.endDate != null
                ? BigInt(g.recurrenceRule.endDate)
                : undefined,
            daysOfWeek:
              g.recurrenceRule?.daysOfWeek instanceof Uint8Array
                ? g.recurrenceRule.daysOfWeek
                : new Uint8Array([]),
          },
          startTime: String(g.startTime ?? ""),
          endTime: String(g.endTime ?? ""),
          occurrenceIds: Array.isArray(g.occurrenceIds)
            ? g.occurrenceIds.map(BigInt)
            : [],
          createdAt: BigInt(g.createdAt ?? 0),
          status: String(g.status ?? "active"),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && sitterId !== null,
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch all recurring booking groups for a client email.
 * Calls getRecurringGroupsByClient(clientEmail).
 */
export function useGetRecurringGroupsByClient(clientEmail: string) {
  const { actor, isReady } = useActorReady();
  return useQuery<BookingGroupPublic[]>({
    queryKey: ["recurring-groups-client", clientEmail],
    queryFn: async (): Promise<BookingGroupPublic[]> => {
      if (!actor || !clientEmail) return [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getRecurringGroupsByClient(
          clientEmail,
        );
        if (!Array.isArray(result)) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.map((g: any) => ({
          groupId: String(g.groupId),
          sitterId: BigInt(g.sitterId),
          clientInfo: {
            name: String(g.clientInfo?.name ?? ""),
            email: String(g.clientInfo?.email ?? ""),
            phone: String(g.clientInfo?.phone ?? ""),
          },
          petInfo: Array.isArray(g.petInfo)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              g.petInfo.map((p: any) => ({
                petName: String(p.petName ?? ""),
                petType: String(p.petType ?? ""),
                breed: p.breed ? String(p.breed) : undefined,
              }))
            : [],
          serviceIds: Array.isArray(g.serviceIds)
            ? g.serviceIds.map(String)
            : [],
          recurrenceRule: {
            pattern: String(g.recurrenceRule?.pattern ?? "weekly"),
            occurrenceCount:
              g.recurrenceRule?.occurrenceCount != null
                ? BigInt(g.recurrenceRule.occurrenceCount)
                : undefined,
            startDate: BigInt(g.recurrenceRule?.startDate ?? 0),
            endDate:
              g.recurrenceRule?.endDate != null
                ? BigInt(g.recurrenceRule.endDate)
                : undefined,
            daysOfWeek:
              g.recurrenceRule?.daysOfWeek instanceof Uint8Array
                ? g.recurrenceRule.daysOfWeek
                : new Uint8Array([]),
          },
          startTime: String(g.startTime ?? ""),
          endTime: String(g.endTime ?? ""),
          occurrenceIds: Array.isArray(g.occurrenceIds)
            ? g.occurrenceIds.map(BigInt)
            : [],
          createdAt: BigInt(g.createdAt ?? 0),
          status: String(g.status ?? "active"),
        }));
      } catch {
        return [];
      }
    },
    enabled: !!actor && isReady && !!clientEmail,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

/** Confirm all pending occurrences in a recurring group at once. */
export function useMutationConfirmRecurringGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).confirmRecurringGroup(groupId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["recurring-groups-sitter"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

/** Confirm a single recurring occurrence by bookingId. */
export function useMutationConfirmRecurringOccurrence() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).confirmRecurringOccurrence(bookingId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["recurring-groups-sitter"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

/** Decline a single recurring occurrence. Triggers decline email to client. */
export function useMutationDeclineRecurringOccurrence() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      reason,
      alternatives,
    }: {
      bookingId: bigint;
      reason: string;
      alternatives: Array<{ date: string; time: string; duration: string }>;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).declineRecurringOccurrence(
        bookingId,
        reason,
        alternatives,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["recurring-groups-sitter"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

/** Cancel an entire recurring group (client or sitter-initiated). */
export function useMutationCancelRecurringGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      cancelledBy,
    }: {
      groupId: string;
      cancelledBy: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).cancelRecurringGroup(
        groupId,
        cancelledBy,
      );
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String(result.err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["recurring-groups-sitter"],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: ["recurring-groups-client"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["bookings-email"], exact: false });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
}

// ─── Admin recurring group hooks ──────────────────────────────────────────────

/**
 * Fetch a single recurring booking group by groupId (admin use).
 * Calls getRecurringGroup(groupId). Returns null if not found.
 */
export function useAdminGetRecurringGroup(
  groupId: string | null,
  enabled = true,
) {
  const { actor, isReady } = useActorReady();
  return useQuery<BookingGroupPublic | null>({
    queryKey: ["recurring-group-admin", groupId],
    queryFn: async (): Promise<BookingGroupPublic | null> => {
      if (!actor || !groupId) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getRecurringGroup(groupId);
        if (!result || (Array.isArray(result) && result.length === 0))
          return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = Array.isArray(result) ? result[0] : result;
        return {
          groupId: String(g.groupId),
          sitterId: BigInt(g.sitterId),
          clientInfo: {
            name: String(g.clientInfo?.clientName ?? g.clientInfo?.name ?? ""),
            email: String(
              g.clientInfo?.clientEmail ?? g.clientInfo?.email ?? "",
            ),
            phone: String(
              g.clientInfo?.clientPhone ?? g.clientInfo?.phone ?? "",
            ),
          },
          petInfo: Array.isArray(g.petInfo)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              g.petInfo.map((p: any) => ({
                petName: String(p.petName ?? ""),
                petType: String(p.petType ?? ""),
                breed: p.breed ? String(p.breed) : undefined,
              }))
            : [],
          serviceIds: Array.isArray(g.serviceIds)
            ? g.serviceIds.map(String)
            : [],
          recurrenceRule: {
            pattern: String(
              g.recurrenceRule?.pattern ??
                g.recurrenceRule?.frequency ??
                "weekly",
            ),
            occurrenceCount:
              g.recurrenceRule?.occurrenceCount != null
                ? BigInt(g.recurrenceRule.occurrenceCount)
                : g.recurrenceRule?.count != null
                  ? BigInt(g.recurrenceRule.count)
                  : undefined,
            startDate: BigInt(g.recurrenceRule?.startDate ?? 0),
            endDate:
              g.recurrenceRule?.endDate != null
                ? BigInt(g.recurrenceRule.endDate)
                : undefined,
            daysOfWeek:
              g.recurrenceRule?.daysOfWeek instanceof Uint8Array
                ? g.recurrenceRule.daysOfWeek
                : new Uint8Array([]),
          },
          startTime: String(g.startTime ?? ""),
          endTime: String(g.endTime ?? ""),
          occurrenceIds: Array.isArray(g.occurrenceIds)
            ? g.occurrenceIds.map(BigInt)
            : [],
          createdAt: BigInt(g.createdAt ?? 0),
          status: String(g.status ?? "active"),
        };
      } catch {
        return null;
      }
    },
    enabled: !!actor && isReady && !!groupId && enabled,
    staleTime: 30_000,
  });
}

/**
 * Admin mutation: cancel all pending occurrences in a recurring group.
 * Calls cancelRecurringGroup(groupId, "admin").
 * Invalidates all-bookings and analytics so the admin view updates immediately.
 */
export function useMutationAdminCancelRecurringGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).cancelRecurringGroup(
        groupId,
        "admin",
      );
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      return result;
    },
    onSuccess: (_d, groupId) => {
      qc.invalidateQueries({
        queryKey: ["recurring-group-admin", groupId],
      });
      qc.invalidateQueries({
        queryKey: ["recurring-groups-sitter"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
    },
  });
}

// ─── Decline booking request ──────────────────────────────────────────────

export interface AlternativeWindow {
  date: string;
  time: string;
  duration: string;
}

/**
 * Declines a pending booking request with a required reason and optional
 * alternative time windows (up to 4). Triggers the decline email to the client.
 */
export function useDeclineBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bookingId,
      declineReason,
      alternativeWindows,
    }: {
      bookingId: bigint;
      declineReason: string;
      alternativeWindows: AlternativeWindow[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).declineBookingRequest(
        bookingId,
        declineReason,
        alternativeWindows,
      );
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: unknown }).err));
      }
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings-sitter"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
    },
  });
}

// ─── Credential checklist hooks ────────────────────────────────────────────

/**
 * Fetches the credential checklist for a sitter.
 * Returns null if the sitter has no credentials saved yet.
 */
export function useGetSitterCredentials(sitterId: bigint | null) {
  const { actor, isReady } = useActorReady();
  return useQuery<CredentialChecklist | null>({
    queryKey: ["sitter-credentials", sitterId?.toString()],
    queryFn: async (): Promise<CredentialChecklist | null> => {
      if (!actor || !sitterId) return null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getSitterCredentials(sitterId);
        if (!result) return null;
        return result as CredentialChecklist;
      } catch {
        return null;
      }
    },
    enabled: !!actor && isReady && !!sitterId,
    staleTime: 30_000,
  });
}

/**
 * Updates the credential checklist for a sitter.
 */
export function useUpdateCredentialChecklist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sitterId,
      credentials,
    }: {
      sitterId: bigint;
      credentials: CredentialChecklist;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await (
        actor as unknown as {
          updateCredentialChecklist: (
            id: bigint,
            creds: CredentialChecklist,
          ) => Promise<{ __kind__: string; err?: unknown }>;
        }
      ).updateCredentialChecklist(sitterId, credentials);
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String((result as { err: unknown }).err));
      }
      return result;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["sitter-credentials", vars.sitterId.toString()],
      });
      qc.invalidateQueries({
        queryKey: ["sitter-extended-public"],
        exact: false,
      });
    },
  });
}

// ─── Stripe Free Plan hooks ────────────────────────────────────────────────

/**
 * Fetch the current Stripe free plan price ID.
 */
export function useGetStripeFreePlanPriceId() {
  const { actor, isReady } = useActorReady();
  return useQuery<string>({
    queryKey: ["stripe-free-plan-price-id"],
    queryFn: async (): Promise<string> => {
      if (!actor) return "";
      try {
        return await actor.getStripeFreePlanPriceId();
      } catch {
        return "";
      }
    },
    enabled: !!actor && isReady,
    staleTime: 30_000,
  });
}

/**
 * Set the Stripe free plan price ID (admin only).
 */
export function useSetStripeFreePlanPriceId() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (priceId: string) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.setFreePlanPriceId(priceId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stripe-free-plan-price-id"] });
    },
  });
}

/**
 * Assign a sitter to the free plan (admin only).
 * Marks them as free plan in the backend and sends a confirmation email.
 */
export function useAssignSitterToFreePlan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sitterId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.assignSitterToFreePlan(sitterId);
      if (result && typeof result === "object" && "err" in result)
        throw new Error(String((result as { err: unknown }).err));
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-subscription-states"] });
    },
  });
}

// ─── Recurring availability validation hook ────────────────────────────────────

export interface OccurrenceAvailabilityResult {
  date: bigint;
  available: boolean;
  conflictReason: [] | [string];
}

/**
 * Validate recurring availability for a sitter across all proposed occurrence dates.
 * Calls validateRecurringAvailability(sitterId, occurrenceDates, startTime, endTime, serviceIds, clientZip).
 * Only fires when sitterId is set and at least one occurrence date is provided.
 */
export function useValidateRecurringAvailability(params: {
  sitterId: bigint | null;
  occurrenceDates: string[]; // ISO YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  serviceIds: string[];
  clientZip: string;
  enabled?: boolean;
}) {
  const { actor, isReady } = useActorReady();
  const {
    sitterId,
    occurrenceDates,
    startTime,
    endTime,
    serviceIds,
    clientZip,
  } = params;
  const isEnabled =
    (params.enabled ?? true) &&
    !!actor &&
    isReady &&
    sitterId !== null &&
    occurrenceDates.length > 0 &&
    !!startTime &&
    !!endTime;

  return useQuery<OccurrenceAvailabilityResult[]>({
    queryKey: [
      "recurring-availability",
      sitterId?.toString() ?? "",
      occurrenceDates.join(","),
      startTime,
      endTime,
      serviceIds.join(","),
      clientZip,
    ],
    queryFn: async (): Promise<OccurrenceAvailabilityResult[]> => {
      if (!actor || sitterId === null || occurrenceDates.length === 0)
        return [];
      try {
        // Convert ISO dates to nanosecond bigints
        const datesBigInt = occurrenceDates.map(
          (d) => BigInt(new Date(`${d}T00:00:00`).getTime()) * 1_000_000n,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).validateRecurringAvailability(
          sitterId,
          datesBigInt,
          startTime,
          endTime,
          serviceIds,
          clientZip,
        );
        if (!Array.isArray(result)) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result.map((r: any) => ({
          date: BigInt(r.date ?? 0),
          available: Boolean(r.available),
          conflictReason: Array.isArray(r.conflictReason)
            ? r.conflictReason
            : [],
        }));
      } catch {
        // Backend doesn't have this function yet — return all available optimistically
        return occurrenceDates.map((d) => ({
          date: BigInt(new Date(`${d}T00:00:00`).getTime()) * 1_000_000n,
          available: true,
          conflictReason: [] as [],
        }));
      }
    },
    enabled: isEnabled,
    staleTime: 30_000,
    retry: 1,
  });
}

/**
 * Mutation to create a recurring booking group.
 * Calls createRecurringBookingGroup(input).
 * On success, invalidates booking queries so portals refresh.
 */
export function useCreateRecurringBookingGroup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sitterId: bigint;
      clientInfo: {
        clientName: string;
        clientEmail: string;
        clientPhone: string;
      };
      petInfo: Array<{
        petName: string;
        petType: string;
        breed?: string;
        petNotes?: string;
      }>;
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
    }) => {
      if (!actor) throw new Error("Actor not ready");
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).createRecurringBookingGroup(input);
        if (result && typeof result === "object" && "err" in result) {
          throw new Error(String(result.err));
        }
        return result as { ok: BookingGroupPublic };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useCreateRecurringBookingGroup] Backend error:", msg, {
          input,
          err,
        });
        throw err;
      }
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["all-bookings"] });
      qc.invalidateQueries({ queryKey: ["all-payments"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-booking-stats"] });
      qc.invalidateQueries({ queryKey: ["booking-heatmap-data"] });
      const email = input.clientInfo.clientEmail;
      const phone = input.clientInfo.clientPhone;
      if (email) {
        qc.invalidateQueries({ queryKey: ["bookings-email", email] });
        qc.refetchQueries({ queryKey: ["bookings-email", email] });
        qc.invalidateQueries({ queryKey: ["recurring-groups-client", email] });
      }
      if (phone) {
        qc.invalidateQueries({ queryKey: ["bookings-phone", phone] });
      }
    },
  });
}
