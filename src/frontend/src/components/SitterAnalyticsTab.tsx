/**
 * SitterAnalyticsTab — split-awareness overlay for the sitter analytics tab.
 *
 * This component does NOT replace the existing AnalyticsTab function inside
 * SitterDashboard.tsx. It augments it by:
 *   1. Batching co-booking assignment queries for all visible bookings.
 *   2. Computing the sitter's split-aware earnings vs gross totals.
 *   3. Rendering a "Split Earnings" indicator card when co-bookings exist.
 *   4. Exporting helpers so SitterDashboard can pass them into AnalyticsTab.
 *
 * Usage in SitterDashboard.tsx (inside the analytics TabsContent, after AnalyticsTab):
 *   <SitterAnalyticsSplitCard bookings={bookings} sitterId={mySitter?.id ?? null} />
 */

import { useQueries } from "@tanstack/react-query";
import { Split, Users } from "lucide-react";
import { useMemo } from "react";
import type { Public__8 } from "../backend.d";
import { useActorReady } from "../hooks/useBackend";
import { teamKeys } from "../hooks/useTeamQueries";
import { getCoBookingSplitAmount } from "../utils/teamUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SplitEarningsSummary {
  /** Number of co-bookings in the sitter's booking list */
  coBookingCount: number;
  /** Sitter's split-aware total in cents (sum of split amounts for co-bookings) */
  splitTotalCents: number;
  /** Gross total of co-bookings in cents (what the client paid) */
  grossTotalCents: number;
  /** Whether co-booking data is still loading */
  isLoading: boolean;
}

// ─── Hook — batch all co-booking queries ──────────────────────────────────────

/**
 * Batches one `getCoBookingAssignment` query per booking.
 * Returns split-aware earnings summary for the current sitter.
 */
export function useSplitEarningsSummary(
  bookings: Public__8[],
  sitterId: bigint | null,
  payments: Array<{ bookingId: bigint; totalAmount: bigint; status: string }>,
): SplitEarningsSummary {
  const { actor, isReady } = useActorReady();

  // Batch one query per booking to check for co-booking assignment
  const results = useQueries({
    queries: bookings.map((b) => ({
      queryKey: teamKeys.coBooking(b.id),
      queryFn: async () => {
        if (!actor || !isReady) return null;
        return actor.getCoBookingAssignment(b.id);
      },
      enabled: !!actor && isReady,
      staleTime: 60_000,
      retry: 1,
    })),
  });

  return useMemo(() => {
    const isLoading = results.some((r) => r.isLoading);

    if (!sitterId || bookings.length === 0) {
      return {
        coBookingCount: 0,
        splitTotalCents: 0,
        grossTotalCents: 0,
        isLoading,
      };
    }

    const paymentByBooking = new Map(
      payments.map((p) => [p.bookingId.toString(), p]),
    );

    let coBookingCount = 0;
    let splitTotalCents = 0;
    let grossTotalCents = 0;

    for (let i = 0; i < bookings.length; i++) {
      const assignment = results[i]?.data;
      if (!assignment || (assignment.splitAmounts ?? []).length === 0) continue;

      // This is a co-booking
      const payment = paymentByBooking.get(bookings[i].id.toString());
      if (!payment) continue;

      const gross = Number(payment.totalAmount); // in cents
      const split = getCoBookingSplitAmount(assignment, sitterId); // in cents

      if (split > 0) {
        coBookingCount += 1;
        splitTotalCents += split;
        grossTotalCents += gross;
      }
    }

    return { coBookingCount, splitTotalCents, grossTotalCents, isLoading };
  }, [results, bookings, sitterId, payments]);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  bookings: Public__8[];
  payments: Array<{ bookingId: bigint; totalAmount: bigint; status: string }>;
  sitterId: bigint | null;
}

/**
 * Renders the split earnings indicator card.
 * Shows nothing if no co-bookings exist, or while loading.
 */
export default function SitterAnalyticsSplitCard({
  bookings,
  payments,
  sitterId,
}: Props) {
  const summary = useSplitEarningsSummary(bookings, sitterId, payments);

  if (summary.isLoading) {
    return (
      <div
        className="h-20 rounded-2xl bg-muted animate-pulse"
        data-ocid="analytics.split_earnings.loading_state"
      />
    );
  }

  if (summary.coBookingCount === 0) return null;

  const splitDollars = summary.splitTotalCents / 100;
  const grossDollars = summary.grossTotalCents / 100;

  return (
    <div
      className="split-earnings-card rounded-2xl border border-amber-300/60 bg-amber-50/80 px-4 py-3 flex items-center gap-3"
      data-ocid="analytics.split_earnings.card"
    >
      <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
        <Split size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Co-Booking Splits
          </span>
          <span className="flex items-center gap-1 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
            <Users size={10} />
            {summary.coBookingCount} booking
            {summary.coBookingCount !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="text-sm font-bold text-amber-900 mt-0.5">
          Your share:{" "}
          <span className="text-base">
            $
            {splitDollars.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-xs font-medium text-amber-700 ml-1">
            of $
            {grossDollars.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            total
          </span>
        </p>
      </div>
    </div>
  );
}
