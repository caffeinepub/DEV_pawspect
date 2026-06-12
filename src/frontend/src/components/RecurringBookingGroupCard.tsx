/**
 * RecurringBookingGroupCard
 * Renders a grouped recurring booking series for the sitter portal.
 * Completely separate from single-booking BookingCard — only shown when
 * a group has isRecurring=true and a groupId.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  PawPrint,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Public__8 } from "../backend.d";
import type { BookingGroupPublic } from "../hooks/useQueries";
import {
  useMutationConfirmRecurringGroup,
  useMutationConfirmRecurringOccurrence,
  useMutationDeclineRecurringOccurrence,
} from "../hooks/useQueries";
import DeclineBookingModal from "./DeclineBookingModal";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime12(t: string): string {
  if (!t || !t.includes(":")) return t;
  const [hStr, mStr] = t.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function formatDateShort(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getOccurrenceStatusKey(booking: Public__8): string {
  if (typeof booking.status === "string") return booking.status;
  if (booking.status && typeof booking.status === "object")
    return Object.keys(booking.status as object)[0] ?? "pending";
  return "pending";
}

const STATUS_BADGE_CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-red-100 text-red-600 border-red-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function patternLabel(pattern: string, count: number): string {
  const freq =
    pattern === "weekly"
      ? "Weekly"
      : pattern === "biweekly"
        ? "Bi-weekly"
        : "Monthly";
  return `${freq} · ${count} session${count !== 1 ? "s" : ""}`;
}

// ─── component ───────────────────────────────────────────────────────────────

interface RecurringBookingGroupCardProps {
  group: BookingGroupPublic;
  /** Occurrence bookings fetched from the regular bookings list, matched by occurrenceIds */
  occurrenceBookings: Public__8[];
  index: number;
}

export default function RecurringBookingGroupCard({
  group,
  occurrenceBookings,
  index,
}: RecurringBookingGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [clientInfoOpen, setClientInfoOpen] = useState(false);
  const [declineOccurrenceBooking, setDeclineOccurrenceBooking] =
    useState<Public__8 | null>(null);

  const confirmGroup = useMutationConfirmRecurringGroup();
  const confirmOccurrence = useMutationConfirmRecurringOccurrence();
  const declineOccurrence = useMutationDeclineRecurringOccurrence();

  // Sort occurrences by startDate ascending
  const sortedOccurrences = [...occurrenceBookings].sort((a, b) =>
    Number(a.startDate - b.startDate),
  );

  const confirmedCount = sortedOccurrences.filter(
    (b) => getOccurrenceStatusKey(b) === "confirmed",
  ).length;
  const pendingCount = sortedOccurrences.filter(
    (b) => getOccurrenceStatusKey(b) === "pending",
  ).length;

  const handleConfirmAll = async () => {
    try {
      await confirmGroup.mutateAsync(group.groupId);
      toast.success("All pending sessions confirmed!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm all sessions",
      );
    }
  };

  const handleConfirmOne = async (bookingId: bigint) => {
    try {
      await confirmOccurrence.mutateAsync(bookingId);
      toast.success("Session confirmed!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm session",
      );
    }
  };

  const handleDeclineSubmit = async (
    _bookingId: bigint,
    reason: string,
    alternatives: Array<{ date: string; time: string; duration: string }>,
  ) => {
    if (!declineOccurrenceBooking) return;
    try {
      await declineOccurrence.mutateAsync({
        bookingId: declineOccurrenceBooking.id,
        reason,
        alternatives,
      });
      toast.success("Session declined and client notified.");
      setDeclineOccurrenceBooking(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to decline session",
      );
    }
  };

  const petNames = group.petInfo.map((p) => p.petName).join(", ");
  const serviceLabel =
    group.serviceIds.length > 0 ? group.serviceIds.join(" · ") : "Pet Care";
  const timeLabel = `${formatTime12(group.startTime)} – ${formatTime12(group.endTime)}`;
  const totalSessions = sortedOccurrences.length || group.occurrenceIds.length;

  return (
    <>
      <div
        data-ocid={`sitter.recurring_group.item.${index + 1}`}
        className="bg-card rounded-2xl border border-amber-200/60 overflow-hidden gloss-ring"
      >
        {/* Amber accent stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

        {/* Header — always visible */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <h3 className="font-display font-bold text-foreground text-sm leading-tight">
                  {group.clientInfo.name}&apos;s Recurring {serviceLabel}
                </h3>
                <Badge className="shrink-0 bg-amber-100 text-amber-700 border border-amber-300 text-[11px] gap-1 hover:bg-amber-100">
                  <RefreshCw size={9} />
                  Recurring
                </Badge>
              </div>
              {/* Frequency + sessions */}
              <p className="text-xs text-amber-700 font-semibold mb-2">
                {patternLabel(group.recurrenceRule.pattern, totalSessions)}
              </p>
              {/* Pet + time */}
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                {petNames && (
                  <span className="flex items-center gap-1">
                    <PawPrint size={11} className="shrink-0" />
                    {petNames}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={11} className="shrink-0" />
                  {timeLabel}
                </span>
              </div>
            </div>

            {/* Confirmed count badge */}
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${
                  confirmedCount === totalSessions
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {confirmedCount}/{totalSessions} confirmed
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            type="button"
            data-ocid={`sitter.recurring_group.item.${index + 1}.toggle`}
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> Hide sessions
              </>
            ) : (
              <>
                <ChevronDown size={13} /> View all {totalSessions} sessions
              </>
            )}
          </button>
        </div>

        {/* Expanded: occurrence table */}
        {expanded && (
          <div className="border-t border-amber-100 px-4 sm:px-5 pb-5">
            {sortedOccurrences.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Session details loading…
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1 mt-4">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wide">
                        Time
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-muted-foreground uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedOccurrences.map((booking, oIdx) => {
                      const statusKey = getOccurrenceStatusKey(booking);
                      const isPending = statusKey === "pending";
                      const badgeCls =
                        STATUS_BADGE_CLS[statusKey] ?? STATUS_BADGE_CLS.pending;
                      const confirmPending =
                        confirmOccurrence.isPending &&
                        confirmOccurrence.variables === booking.id;

                      return (
                        <tr
                          key={booking.id.toString()}
                          data-ocid={`sitter.recurring_group.item.${index + 1}.occurrence.${oIdx + 1}`}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                            {formatDateShort(booking.startDate)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {timeLabel}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}
                            >
                              {statusKey.charAt(0).toUpperCase() +
                                statusKey.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  data-ocid={`sitter.recurring_group.item.${index + 1}.confirm_button.${oIdx + 1}`}
                                  onClick={() => handleConfirmOne(booking.id)}
                                  disabled={confirmPending}
                                  title="Confirm this session"
                                  className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-60"
                                >
                                  {confirmPending ? (
                                    <Loader2
                                      size={11}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Check size={11} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  data-ocid={`sitter.recurring_group.item.${index + 1}.decline_button.${oIdx + 1}`}
                                  onClick={() =>
                                    setDeclineOccurrenceBooking(booking)
                                  }
                                  title="Decline this session"
                                  className="w-7 h-7 rounded-full bg-red-100 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-200 transition-colors"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-4 pt-4 border-t border-amber-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {pendingCount > 0 && (
                <Button
                  data-ocid={`sitter.recurring_group.item.${index + 1}.confirm_all_button`}
                  size="sm"
                  onClick={handleConfirmAll}
                  disabled={confirmGroup.isPending}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm min-h-[40px] px-5"
                >
                  {confirmGroup.isPending ? (
                    <>
                      <Loader2 size={13} className="mr-1.5 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      <Check size={13} className="mr-1.5" />
                      Confirm All Pending ({pendingCount})
                    </>
                  )}
                </Button>
              )}
              <button
                type="button"
                data-ocid={`sitter.recurring_group.item.${index + 1}.client_info_button`}
                onClick={() => setClientInfoOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors min-h-[36px] px-2"
              >
                <User size={13} />
                {clientInfoOpen ? "Hide Client Info" : "View Client Info"}
              </button>
            </div>

            {/* Client info panel */}
            {clientInfoOpen && (
              <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/50 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <User size={12} className="text-muted-foreground shrink-0" />
                  <span className="font-semibold text-foreground">
                    {group.clientInfo.name}
                  </span>
                </div>
                {group.clientInfo.email && (
                  <p className="text-muted-foreground text-xs break-all pl-5">
                    {group.clientInfo.email}
                  </p>
                )}
                {group.clientInfo.phone && (
                  <p className="text-muted-foreground text-xs pl-5">
                    {group.clientInfo.phone}
                  </p>
                )}
                {group.petInfo.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-5">
                    {group.petInfo.map((pet) => (
                      <span
                        key={pet.petName}
                        className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5"
                      >
                        <PawPrint size={9} />
                        {pet.petName}
                        {pet.petType ? ` (${pet.petType})` : ""}
                      </span>
                    ))}
                  </div>
                )}
                <div className="pl-5 mt-1">
                  <p className="text-xs text-muted-foreground">
                    <Calendar size={10} className="inline mr-1 mb-px" />
                    Series started{" "}
                    {new Date(
                      Number(group.recurrenceRule.startDate) / 1_000_000,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decline modal — reuses existing DeclineBookingModal */}
      {declineOccurrenceBooking && (
        <DeclineBookingModal
          open={!!declineOccurrenceBooking}
          booking={declineOccurrenceBooking}
          onClose={() => setDeclineOccurrenceBooking(null)}
          onConfirm={handleDeclineSubmit}
        />
      )}
    </>
  );
}
