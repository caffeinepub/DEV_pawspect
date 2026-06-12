import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Mail,
  PawPrint,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { View } from "../App";
import type { Public, Public__6, Public__8 } from "../backend.d";
import { PaymentStatus } from "../backend.d";
import InvoiceModal from "../components/InvoiceModal";
import ServiceLogTimeline from "../components/ServiceLogTimeline";
import {
  useActiveSitters,
  useBookingsByEmail,
  useBookingsByPhone,
  useCompletedBookingsByContact,
  useGetRecurringGroupsByClient,
  useMutationCancelRecurringGroup,
  usePaymentsByBookingIds,
} from "../hooks/useQueries";
import type { BookingGroupPublic } from "../hooks/useQueries";
import type { PrebookState } from "./SitterDetailPage";

interface Props {
  navigate: (
    view: View,
    sitterId?: bigint,
    email?: string,
    phone?: string,
  ) => void;
  navigateWithPrebook?: (
    sitterId: bigint,
    prebook: PrebookState,
    contactEmail?: string,
    contactPhone?: string,
  ) => void;
  initialEmail?: string;
  initialTab?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeDate(ts: bigint): string {
  const now = Date.now();
  const then = Number(ts / 1_000_000n);
  const diff = now - then;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function getApptTime(booking: Public__8): string | null {
  if (booking.serviceSchedule && booking.serviceSchedule.length > 0) {
    const sorted = [...booking.serviceSchedule].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const slot = sorted[0]?.slots?.[0];
    if (slot)
      return `${formatTime12(slot.startTime)} – ${formatTime12(slot.endTime)}`;
  }
  if (booking.schedule && booking.schedule.length > 0) {
    const sorted = [...booking.schedule].sort((a, b) =>
      Number(a.date - b.date),
    );
    const slot = sorted[0]?.slots?.[0];
    if (slot) {
      const sH = Math.floor(Number(slot.startTime) / 60);
      const sM = Number(slot.startTime) % 60;
      const eH = Math.floor(Number(slot.endTime) / 60);
      const eM = Number(slot.endTime) % 60;
      const s = `${sH.toString().padStart(2, "0")}:${sM.toString().padStart(2, "0")}`;
      const e = `${eH.toString().padStart(2, "0")}:${eM.toString().padStart(2, "0")}`;
      return `${formatTime12(s)} – ${formatTime12(e)}`;
    }
  }
  return null;
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function getStatusKey(status: unknown): string {
  if (typeof status === "string") return status;
  if (status !== null && typeof status === "object")
    return Object.keys(status as object)[0] ?? "";
  return String(status ?? "");
}

const CURRENT_STATUSES = new Set(["pending", "confirmed", "in_progress"]);
const PAST_STATUSES = new Set(["completed", "cancelled"]);

const PET_EMOJIS: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Bird: "🦜",
  Rabbit: "🐰",
  Fish: "🐟",
  "Small Animal": "🐹",
  Other: "🐾",
};

// Status config — left accent stripe color
const STATUS_CFG: Record<
  string,
  { label: string; badgeCls: string; stripeCls: string }
> = {
  pending: {
    label: "Awaiting Confirmation",
    badgeCls: "text-amber-700 bg-amber-50 border-amber-200",
    stripeCls: "bg-gradient-to-b from-amber-400 to-orange-400",
  },
  confirmed: {
    label: "Confirmed ✓",
    badgeCls: "text-blue-700 bg-blue-50 border-blue-200",
    stripeCls: "bg-gradient-to-b from-blue-500 to-indigo-500",
  },
  in_progress: {
    label: "Live Now",
    badgeCls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    stripeCls: "bg-gradient-to-b from-emerald-400 to-teal-400",
  },
  completed: {
    label: "Completed",
    badgeCls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    stripeCls: "bg-gradient-to-b from-emerald-300 to-teal-300",
  },
  cancelled: {
    label: "Cancelled",
    badgeCls: "text-muted-foreground bg-muted border-border",
    stripeCls: "bg-muted",
  },
};

// ─── Quick Rebook card (amber gradient, distinct from history) ────────────────
function QuickRebookCard({
  booking,
  index,
  allSitters,
  onRebook,
}: {
  booking: Public__8;
  index: number;
  allSitters: Public[];
  onRebook: () => void;
}) {
  const sitterNames =
    Array.isArray(booking.sitterIds) && booking.sitterIds.length > 0
      ? booking.sitterIds
          .map((sid) => {
            const s = allSitters.find((st) => st.id === sid);
            return s?.name ?? `Sitter #${sid}`;
          })
          .join(" & ")
      : "Your sitter";

  const sitterPhoto = (() => {
    if (!Array.isArray(booking.sitterIds) || booking.sitterIds.length === 0)
      return null;
    const s = allSitters.find((st) => st.id === booking.sitterIds[0]);
    if (!s) return null;
    const p = (s as unknown as Record<string, unknown>).photoUrl;
    return typeof p === "string" ? p : null;
  })();

  const servicesLabel =
    Array.isArray(booking.services) && booking.services.length > 0
      ? booking.services.join(" + ")
      : "Previous booking";

  // Calculate approx total from service schedule
  const total = (() => {
    if (!Array.isArray(booking.serviceSchedule)) return null;
    let sum = 0;
    for (const day of booking.serviceSchedule) {
      if (Array.isArray(day.slots)) {
        for (const slot of day.slots) {
          sum += (Number(slot.ratePerHour) * Number(slot.durationMinutes)) / 60;
        }
      }
    }
    return sum > 0 ? sum : null;
  })();

  return (
    <div
      data-ocid={`lookup.rebook_card.${index + 1}`}
      className="min-w-[240px] max-w-[280px] flex-shrink-0 rounded-2xl overflow-hidden shadow-md"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.92) 0%, oklch(0.65 0.20 40 / 0.95) 100%)",
      }}
    >
      {/* Sitter row */}
      <div className="p-3 pb-2 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/30 shrink-0 ring-2 ring-white/40">
          {sitterPhoto ? (
            <img
              src={sitterPhoto}
              alt={sitterNames}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm">
              {sitterNames.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">
            {sitterNames}
          </p>
          <p className="text-white/80 text-xs truncate">{servicesLabel}</p>
        </div>
      </div>

      {/* Last booked + price */}
      <div className="px-3 pb-2 flex items-center justify-between gap-2">
        <span className="text-white/75 text-xs">
          Last booked {formatRelativeDate(booking.startDate)}
        </span>
        {total !== null && (
          <span className="text-white font-bold text-xs">
            ${total.toFixed(0)}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="px-3 pb-3">
        <button
          type="button"
          data-ocid={`lookup.book_again.${index + 1}`}
          onClick={onRebook}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-white text-amber-600 hover:bg-amber-50 transition-colors shadow-sm min-h-[44px]"
        >
          <Zap size={14} />
          Book Again
        </button>
      </div>
    </div>
  );
}

// ─── Status pill with live pulsing dot ────────────────────────────────────────
function StatusPill({
  statusKey,
  cfg,
}: {
  statusKey: string;
  cfg: { label: string; badgeCls: string };
}) {
  if (statusKey === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        Live Now
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeCls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Flight-style timeline entry ─────────────────────────────────────────────
// (used inside expanded panel for a compact inline activity list)

// ─── Premium flight-tracker booking card ─────────────────────────────────────
function BookingActivityCard({
  booking,
  payment,
  sitterName,
  sitterPhoto,
  onViewInvoice,
  onBookAgain,
  showBookAgain,
}: {
  booking: Public__8;
  payment: Public__6 | null;
  sitterName: string;
  sitterPhoto: string | null;
  onViewInvoice: () => void;
  onBookAgain?: () => void;
  showBookAgain?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusKey = getStatusKey(booking.status);
  const isActive = statusKey === "confirmed";
  const isInProgress = statusKey === "in_progress";
  const isCompleted = statusKey === "completed";
  const isPaid = payment !== null && payment?.status === PaymentStatus.paid;
  const cfg = STATUS_CFG[statusKey] ?? STATUS_CFG.pending;
  const apptTime = getApptTime(booking);

  const pets = booking.pets ?? [];
  const services = booking.services ?? [];

  // Top accent bar classes
  const accentBarCls = isInProgress
    ? "h-[3px] w-full animate-shimmer-sweep"
    : statusKey === "confirmed"
      ? "h-[3px] w-full bg-gradient-to-r from-blue-500 to-indigo-500"
      : statusKey === "completed"
        ? "h-[3px] w-full bg-gradient-to-r from-emerald-300 to-teal-300"
        : statusKey === "cancelled"
          ? "h-[3px] w-full bg-muted"
          : "h-[3px] w-full bg-gradient-to-r from-amber-400 to-orange-400";

  return (
    <div
      className={`rounded-2xl overflow-hidden w-full max-w-full transition-shadow duration-200 ${
        isInProgress
          ? "border border-emerald-200 shadow-md ring-1 ring-emerald-400/20"
          : "border border-border/70 shadow-sm hover:shadow-md"
      } bg-card/80 backdrop-blur-sm`}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div className={accentBarCls} />

      {/* ── COLLAPSED CONTENT — tap to toggle expand ── */}
      <button
        type="button"
        className="w-full text-left px-4 py-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* ROW 1: Date | Status pill | Time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display font-black text-foreground text-sm leading-tight truncate min-w-0">
            {formatDateShort(booking.startDate)}
          </span>
          <StatusPill statusKey={statusKey} cfg={cfg} />
          {apptTime && (
            <span className="text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
              {apptTime}
            </span>
          )}
        </div>

        {/* ROW 2: Service pill + sitter avatar + name */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {services.slice(0, 2).map((svc) => (
            <span
              key={svc}
              className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 shrink-0"
            >
              {svc}
            </span>
          ))}
          {services.length > 2 && (
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">
              +{services.length - 2}
            </span>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 ring-1 ring-primary/20 shrink-0">
              {sitterPhoto ? (
                <img
                  src={sitterPhoto}
                  alt={sitterName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-primary text-[10px]">
                  {sitterName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-foreground truncate max-w-[100px] sm:max-w-[140px]">
              {sitterName.split(" ")[0]}
            </span>
          </div>
        </div>

        {/* ROW 3: Pets | Payment badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {pets.length > 0 ? (
              pets.slice(0, 3).map((pet) => (
                <span
                  key={pet.petName}
                  className="inline-flex items-center gap-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 shrink-0"
                >
                  {PET_EMOJIS[pet.petType] ?? "🐾"} {pet.petName}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">
                No pets listed
              </span>
            )}
            {pets.length > 3 && (
              <span className="text-[11px] text-muted-foreground">
                +{pets.length - 3}
              </span>
            )}
          </div>
          <span
            className={
              isPaid
                ? "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0"
                : "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0"
            }
          >
            {isPaid ? (
              <>
                <CheckCircle size={9} /> Paid
              </>
            ) : (
              <>⏳ Unpaid</>
            )}
          </span>
        </div>

        {/* ROW 4: Footer — expand hint + book again shortcut */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {expanded ? (
              <>
                <ChevronUp size={13} className="shrink-0" /> Hide activity
              </>
            ) : (
              <>
                <ChevronDown size={13} className="shrink-0" /> View activity
              </>
            )}
          </div>
          {isCompleted && showBookAgain && onBookAgain && (
            <button
              type="button"
              data-ocid="lookup.card_book_again.button"
              onClick={(e) => {
                e.stopPropagation();
                onBookAgain();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors shrink-0 min-h-[28px]"
            >
              <RefreshCw size={11} />
              Book Again
            </button>
          )}
        </div>
      </button>

      {/* ── EXPANDED PANEL — fully separate from collapsed header ── */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 flight-card-expand">
          {/* Activity / Service Log */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Radio size={10} />
              Activity
            </p>
            <div className="max-h-48 overflow-y-auto">
              {booking.sitterIds?.length > 0 ? (
                booking.sitterIds.map((sid) => (
                  <ServiceLogTimeline
                    key={sid.toString()}
                    bookingId={booking.id}
                    sitterId={sid}
                    sitterName={sitterName}
                    isActive={false}
                    autoRefresh={isActive || isInProgress}
                  />
                ))
              ) : (
                <ServiceLogTimeline
                  bookingId={booking.id}
                  sitterId={0n}
                  sitterName="Your sitter"
                  isActive={false}
                  autoRefresh={isActive || isInProgress}
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            {(isCompleted || isActive || isInProgress) && (
              <button
                type="button"
                data-ocid="lookup.invoice.button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewInvoice();
                }}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
              >
                <FileText size={14} />
                View Invoice
              </button>
            )}
            {showBookAgain && onBookAgain && (
              <button
                type="button"
                data-ocid="lookup.expand_book_again.button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookAgain();
                }}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl min-h-[44px] text-white"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
                }}
              >
                <Zap size={14} />
                Book Again
              </button>
            )}
            <button
              type="button"
              data-ocid="lookup.hide_details.button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border/60 py-2 rounded-xl transition-colors min-h-[44px]"
            >
              <ChevronUp size={14} />
              Hide Details
            </button>
          </div>
        </div>
      )}

      {/* Recurring badge */}
      {booking.isRecurring && !expanded && (
        <div className="px-4 pb-2.5">
          <Badge
            variant="outline"
            className="text-[11px] gap-1 border-primary/30 text-primary"
          >
            <RefreshCw size={9} /> Recurring
          </Badge>
        </div>
      )}
    </div>
  );
}

// ─── Recurring group view (client portal) ────────────────────────────────────

function formatTime12Lookup(t: string): string {
  if (!t || !t.includes(":")) return t;
  const [hStr, mStr] = t.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

const OCCURRENCE_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  declined: { label: "Declined", cls: "bg-red-50 text-red-600 border-red-200" },
  cancelled: {
    label: "Cancelled",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

function getOccurrenceStatus(occurrence: Public__8): string {
  if (typeof occurrence.status === "string") return occurrence.status;
  if (occurrence.status && typeof occurrence.status === "object")
    return Object.keys(occurrence.status as object)[0] ?? "pending";
  return "pending";
}

function RecurringGroupClientView({
  group,
  allSitters,
  occurrenceBookings,
  groupIndex,
  onBookAgainSameSchedule,
  submittedEmail,
}: {
  group: BookingGroupPublic;
  allSitters: Public[];
  occurrenceBookings: Public__8[];
  groupIndex: number;
  onBookAgainSameSchedule?: (group: BookingGroupPublic) => void;
  submittedEmail: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const cancelGroup = useMutationCancelRecurringGroup();

  const sitter = allSitters.find((s) => s.id === group.sitterId);
  const sitterName = sitter?.name ?? `Sitter #${group.sitterId}`;

  const sortedOccurrences = [...occurrenceBookings].sort((a, b) =>
    Number(a.startDate - b.startDate),
  );

  const statusCounts = sortedOccurrences.reduce(
    (acc, b) => {
      const st = getOccurrenceStatus(b);
      acc[st] = (acc[st] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const patternLabel =
    group.recurrenceRule.pattern === "weekly"
      ? "Weekly"
      : group.recurrenceRule.pattern === "biweekly"
        ? "Bi-weekly"
        : "Monthly";

  const timeLabel = `${formatTime12Lookup(group.startTime)} – ${formatTime12Lookup(group.endTime)}`;
  const serviceLabel =
    group.serviceIds.length > 0 ? group.serviceIds.join(" + ") : "Pet Care";

  const handleCancelOccurrence = async (occurrence: Public__8) => {
    const hoursUntil =
      (Number(occurrence.startDate / 1_000_000n) - Date.now()) / 3_600_000;
    if (hoursUntil < 24) {
      alert(
        "Cancellations within 24 hours of the appointment are not available online. Please contact your sitter directly.",
      );
      return;
    }
    if (!window.confirm("Cancel this occurrence? This cannot be undone."))
      return;
    try {
      await cancelGroup.mutateAsync({
        groupId: group.groupId,
        cancelledBy: submittedEmail,
      });
    } catch {
      alert("Failed to cancel. Please try again or contact your sitter.");
    }
  };

  return (
    <div
      data-ocid={`lookup.recurring_group.item.${groupIndex + 1}`}
      className="rounded-2xl overflow-hidden border border-amber-200/70 bg-card/80 shadow-sm"
    >
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-400 to-orange-400" />

      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-display font-bold text-foreground text-sm truncate">
                {serviceLabel} with {sitterName.split(" ")[0]}
              </span>
              <Badge className="shrink-0 bg-amber-100 text-amber-700 border border-amber-300 text-[11px] gap-1 hover:bg-amber-100">
                <RefreshCw size={9} />
                Recurring
              </Badge>
            </div>
            <p className="text-xs text-amber-600 font-semibold">
              {patternLabel} ·{" "}
              {sortedOccurrences.length || group.occurrenceIds.length} sessions
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={10} className="shrink-0" />
                {timeLabel}
              </span>
            </div>
          </div>
          {/* Status summary */}
          <div className="shrink-0 text-right text-xs space-y-0.5">
            {Object.entries(statusCounts).map(([st, ct]) => {
              const cfg =
                OCCURRENCE_STATUS_CFG[st] ?? OCCURRENCE_STATUS_CFG.pending;
              return (
                <span
                  key={st}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ml-1 ${cfg.cls}`}
                >
                  {ct} {cfg.label}
                </span>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          data-ocid={`lookup.recurring_group.item.${groupIndex + 1}.toggle`}
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors mt-1"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} /> Hide sessions
            </>
          ) : (
            <>
              <ChevronDown size={12} /> View all sessions
            </>
          )}
        </button>
      </div>

      {/* Expanded occurrence table (read-only for client) */}
      {expanded && (
        <div className="border-t border-amber-100 px-4 pb-4">
          {sortedOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading session details…
            </p>
          ) : (
            <div className="overflow-x-auto -mx-1 mt-3">
              <table className="w-full text-xs min-w-[360px]">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-wide">
                      Date
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
                  {sortedOccurrences.map((occ, oIdx) => {
                    const st = getOccurrenceStatus(occ);
                    const cfg =
                      OCCURRENCE_STATUS_CFG[st] ??
                      OCCURRENCE_STATUS_CFG.pending;
                    const hoursUntil =
                      (Number(occ.startDate / 1_000_000n) - Date.now()) /
                      3_600_000;
                    const canCancel =
                      (st === "pending" || st === "confirmed") &&
                      hoursUntil >= 24;
                    return (
                      <tr
                        key={occ.id.toString()}
                        data-ocid={`lookup.recurring_group.item.${groupIndex + 1}.occurrence.${oIdx + 1}`}
                        className="hover:bg-muted/10"
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                          {new Date(
                            Number(occ.startDate / 1_000_000n),
                          ).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {canCancel ? (
                            <button
                              type="button"
                              data-ocid={`lookup.recurring_group.item.${groupIndex + 1}.cancel_button.${oIdx + 1}`}
                              onClick={() => handleCancelOccurrence(occ)}
                              className="text-[11px] text-destructive hover:underline font-semibold min-h-[28px]"
                            >
                              Cancel
                            </button>
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

          {/* Book Again Same Schedule */}
          {onBookAgainSameSchedule && (
            <button
              type="button"
              data-ocid={`lookup.recurring_group.item.${groupIndex + 1}.book_again_button`}
              onClick={() => onBookAgainSameSchedule(group)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white min-h-[44px] transition-all hover:opacity-90"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
              }}
            >
              <RefreshCw size={14} />
              Book Again (Same Schedule)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Deduplication for Quick Rebook ──────────────────────────────────────────
function dedupeBookings(bookings: Public__8[]): Public__8[] {
  const seen = new Set<string>();
  const out: Public__8[] = [];
  for (const b of bookings) {
    const key = [
      ...(b.sitterIds ?? []).map(String).sort(),
      ...(b.services ?? []).sort(),
    ].join("|");
    if (!seen.has(key)) {
      seen.add(key);
      out.push(b);
    }
  }
  return out;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingLookupPage({
  navigate,
  navigateWithPrebook,
  initialEmail,
  initialTab,
}: Props) {
  const [lookupMode, setLookupMode] = useState<"email" | "phone">("email");
  const [emailInput, setEmailInput] = useState(initialEmail ?? "");
  const [submittedEmail, setSubmittedEmail] = useState(initialEmail ?? "");
  const [phoneInput, setPhoneInput] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "past">(
    initialTab === "past" ? "past" : "current",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSearch = (
    mode: "email" | "phone",
    rawEmail: string,
    rawPhone: string,
  ) => {
    if (mode === "email") {
      const val = rawEmail.trim().toLowerCase();
      if (val) setSubmittedEmail(val);
    } else {
      const val = normalizePhone(rawPhone);
      if (val.length >= 10) {
        setPhoneError("");
        setSubmittedPhone(val);
      }
    }
  };

  const handleEmailChange = (val: string) => {
    setEmailInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commitSearch("email", val, phoneInput);
    }, 500);
  };

  const handlePhoneChange = (val: string) => {
    setPhoneInput(val);
    setPhoneError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commitSearch("phone", emailInput, val);
    }, 500);
  };

  const {
    data: emailBookings = [],
    isLoading: emailLoading,
    isError: emailQueryError,
  } = useBookingsByEmail(submittedEmail);
  const {
    data: phoneBookings = [],
    isLoading: phoneLoading,
    isError: phoneQueryError,
  } = useBookingsByPhone(submittedPhone);

  const { data: allSittersRaw = [] } = useActiveSitters();
  const allSitters = allSittersRaw as Public[];

  const completedEmail = submittedEmail;
  const completedPhone = submittedPhone;
  const { data: completedBookingsRaw = [], isLoading: completedLoading } =
    useCompletedBookingsByContact(completedEmail, completedPhone);
  const completedBookings = completedBookingsRaw as Public__8[];

  // Recurring groups — fetched by email (primary lookup method)
  const { data: recurringGroupsRaw = [] } =
    useGetRecurringGroupsByClient(submittedEmail);

  const rawBookings = (
    lookupMode === "email" ? emailBookings : phoneBookings
  ) as Public__8[];

  const sortedBookings = useMemo(
    () => [...rawBookings].sort((a, b) => Number(b.startDate - a.startDate)),
    [rawBookings],
  );

  const currentBookings = useMemo(
    () =>
      sortedBookings.filter((b) =>
        CURRENT_STATUSES.has(getStatusKey(b.status)),
      ),
    [sortedBookings],
  );
  const pastBookings = useMemo(
    () =>
      sortedBookings.filter((b) => PAST_STATUSES.has(getStatusKey(b.status))),
    [sortedBookings],
  );

  // Top 2–3 unique completed bundles for Quick Rebook
  const quickRebookCards = useMemo(() => {
    const sorted = [...completedBookings].sort((a, b) =>
      Number(b.startDate - a.startDate),
    );
    return dedupeBookings(sorted).slice(0, 3);
  }, [completedBookings]);

  const bookingIds = useMemo(
    () => sortedBookings.map((b) => b.id.toString()),
    [sortedBookings],
  );
  const { data: paymentsRaw = [] } = usePaymentsByBookingIds(bookingIds);
  const allPayments = paymentsRaw as Public__6[];
  const paymentMap = useMemo(() => {
    const m = new Map<string, Public__6>();
    for (const p of allPayments) m.set(p.bookingId.toString(), p);
    return m;
  }, [allPayments]);

  const isLoading =
    (lookupMode === "email" ? emailLoading : phoneLoading) || completedLoading;
  const isQueryError =
    lookupMode === "email" ? emailQueryError : phoneQueryError;
  const submittedIdentifier =
    lookupMode === "email" ? submittedEmail : submittedPhone;
  const hasSubmitted = !!submittedIdentifier;
  const clientName =
    sortedBookings[0]?.clientName ?? completedBookings[0]?.clientName ?? "";

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    if (initialEmail?.trim()) setSubmittedEmail(initialEmail.trim());
  }, []);

  const handleSearch = () => {
    if (lookupMode === "email") {
      if (emailInput.trim()) setSubmittedEmail(emailInput.trim());
    } else {
      const normalized = normalizePhone(phoneInput.trim());
      if (normalized.length >= 10) {
        setPhoneError("");
        setSubmittedPhone(normalized);
      } else {
        setPhoneError(
          "Please enter a valid phone number (e.g. 555-123-4567 or 5551234567)",
        );
      }
    }
  };

  const getSitterName = (sid: bigint) => {
    const s = allSitters.find((st) => st.id === sid);
    return s?.name ?? `Sitter #${sid.toString()}`;
  };

  const getSitterPhoto = (sid: bigint): string | null => {
    const s = allSitters.find((st) => st.id === sid);
    if (!s) return null;
    const photoUrl = (s as unknown as Record<string, unknown>).photoUrl;
    return typeof photoUrl === "string" ? photoUrl : null;
  };

  const invoiceBooking = invoiceBookingId
    ? sortedBookings.find((b) => b.id.toString() === invoiceBookingId)
    : null;

  const displayedBookings =
    activeTab === "current" ? currentBookings : pastBookings;

  const triggerRebook = (b: Public__8) => {
    if (
      !Array.isArray(b.sitterIds) ||
      b.sitterIds.length === 0 ||
      !navigateWithPrebook
    )
      return;
    const firstSitterId = b.sitterIds[0];
    const sched = Array.isArray(b.serviceSchedule) ? b.serviceSchedule : [];
    const firstSlot = sched[0]?.slots?.[0];

    // Never copy the old booking date — always default to tomorrow so the
    // client must explicitly confirm their new date.
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    })();

    navigateWithPrebook(
      firstSitterId,
      {
        prebookServices: Array.isArray(b.services) ? b.services : [],
        prebookSitterId: firstSitterId,
        prebookSitterIds: b.sitterIds,
        prebookTimeWindow: firstSlot
          ? { startTime: firstSlot.startTime, endTime: firstSlot.endTime }
          : undefined,
        // Set tomorrow as the starting point — user must confirm a valid future date
        prebookDate: tomorrow,
        isRebook: true,
        prebookPets: Array.isArray(b.pets) ? b.pets : [],
        prebookClientName: b.clientName ?? undefined,
        prebookClientEmail: b.clientEmail ?? undefined,
        prebookClientPhone: b.clientPhone ?? undefined,
      },
      lookupMode === "email" ? submittedEmail : undefined,
      lookupMode === "phone" ? submittedPhone : undefined,
    );
  };

  /** Book Again (Same Schedule) for a recurring group — prefills the same service,
   *  sitter, and time window but requires the user to pick a new start date. */
  const triggerRebookSameSchedule = (group: BookingGroupPublic) => {
    if (!navigateWithPrebook) return;
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const dy = String(d.getDate()).padStart(2, "0");
      return `${y}-${mo}-${dy}`;
    })();
    navigateWithPrebook(
      group.sitterId,
      {
        prebookServices: group.serviceIds,
        prebookSitterId: group.sitterId,
        prebookSitterIds: [group.sitterId],
        prebookTimeWindow: group.startTime
          ? { startTime: group.startTime, endTime: group.endTime }
          : undefined,
        prebookDate: tomorrow,
        isRebook: true,
        prebookPets: group.petInfo.map((p) => ({
          petName: p.petName,
          petType: p.petType,
          breed: p.breed ?? "",
          notes: "",
        })),
        prebookClientName: group.clientInfo.name ?? undefined,
        prebookClientEmail: group.clientInfo.email ?? undefined,
        prebookClientPhone: group.clientInfo.phone ?? undefined,
      },
      submittedEmail || undefined,
      submittedPhone || undefined,
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 frosted-nav">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 shrink-0"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="font-display font-semibold truncate">
              My Bookings
            </span>
          </div>
          {clientName && (
            <div className="flex items-center gap-2 text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full max-w-[180px] shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {clientName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline truncate">{clientName}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <PawPrint size={26} className="text-primary-foreground" />
          </div>
          {clientName ? (
            <>
              <h1
                className="font-display font-bold break-words"
                style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)" }}
              >
                Welcome back, {clientName}! 🐾
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Here are your bookings
                {submittedIdentifier && (
                  <>
                    {" "}
                    for <strong>{submittedIdentifier}</strong>
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <h1
                className="font-display font-bold"
                style={{ fontSize: "clamp(1.6rem, 5vw, 2.2rem)" }}
              >
                Find Your Bookings
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Enter the email or phone number you used when booking.
              </p>
            </>
          )}
        </div>

        {/* ── Lookup form ──────────────────────────────────────────────────── */}
        <div className="glass-surface rounded-2xl p-4 sm:p-6 mb-7">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              data-ocid="lookup.toggle_email"
              onClick={() => {
                setLookupMode("email");
                setPhoneError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-colors border min-h-[48px] ${
                lookupMode === "email"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              }`}
            >
              <Mail size={15} />
              <span>Email</span>
            </button>
            <button
              type="button"
              data-ocid="lookup.toggle_phone"
              onClick={() => {
                setLookupMode("phone");
                setPhoneError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-colors border min-h-[48px] ${
                lookupMode === "phone"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              }`}
            >
              <Phone size={15} />
              <span>Phone</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {lookupMode === "phone"
              ? "Any format works — (555) 123-4567, 555-123-4567, or 5551234567"
              : "Use the email or phone you used when booking"}
          </p>

          <Label
            htmlFor={lookupMode === "email" ? "lookup-email" : "lookup-phone"}
            className="block mb-2 font-semibold text-sm"
          >
            {lookupMode === "email"
              ? "Your Email Address"
              : "Your Phone Number"}
          </Label>

          <div className="flex gap-2">
            {lookupMode === "email" ? (
              <Input
                data-ocid="lookup.email.input"
                id="lookup-email"
                type="email"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="jane@example.com"
                className="rounded-full h-12"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            ) : (
              <Input
                data-ocid="lookup.phone.input"
                id="lookup-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                className="rounded-full h-12"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            )}
            <Button
              data-ocid="lookup.search.button"
              onClick={handleSearch}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-12 px-5 font-semibold"
            >
              <Search size={16} />
            </Button>
          </div>

          {lookupMode === "phone" && phoneError && (
            <p
              data-ocid="lookup.phone.field_error"
              className="text-xs text-destructive mt-2"
            >
              {phoneError}
            </p>
          )}

          <div className="mt-3 flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5">
            <Mail size={13} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                Check your email
              </span>{" "}
              for a booking confirmation — use the link inside to come back here
              any time.
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="text-sm text-primary hover:underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              First time here? Book your first service →
            </button>
          </div>
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {isLoading && hasSubmitted && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {!isLoading && isQueryError && hasSubmitted && (
          <div
            data-ocid="lookup.error_state"
            className="text-center py-10 bg-card rounded-2xl border border-destructive/20 px-4"
          >
            <p className="text-muted-foreground font-medium mb-3">
              Having trouble connecting. Please wait a moment.
            </p>
            <button
              type="button"
              onClick={handleSearch}
              className="text-sm font-semibold text-primary hover:underline underline-offset-2 flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw size={13} />
              Try Again
            </button>
          </div>
        )}

        {/* ── No results ───────────────────────────────────────────────────── */}
        {!isLoading &&
          hasSubmitted &&
          sortedBookings.length === 0 &&
          completedBookings.length === 0 && (
            <div
              data-ocid="lookup.empty_state"
              className="text-center py-14 bg-card rounded-2xl border border-border px-4"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <PawPrint size={30} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">
                No bookings found
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                No bookings found for <strong>{submittedIdentifier}</strong>
              </p>
              {lookupMode === "phone" ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Try switching to{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => setLookupMode("email")}
                  >
                    email lookup
                  </button>{" "}
                  instead.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  Try switching to{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => setLookupMode("phone")}
                  >
                    phone lookup
                  </button>{" "}
                  instead.
                </p>
              )}
              <Button
                onClick={() =>
                  navigate(
                    "home",
                    undefined,
                    lookupMode === "email" ? submittedEmail : undefined,
                    lookupMode === "phone" ? submittedPhone : undefined,
                  )
                }
                className="mt-5 rounded-full bg-primary text-primary-foreground min-h-[44px]"
                data-ocid="lookup.book_sitter.button"
              >
                Book a Sitter
              </Button>
            </div>
          )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {!isLoading &&
          hasSubmitted &&
          (sortedBookings.length > 0 ||
            completedBookings.length > 0 ||
            recurringGroupsRaw.length > 0) && (
            <div>
              {/* ══ RECURRING GROUPS SECTION — shown first when client has recurring bookings ══ */}
              {recurringGroupsRaw.length > 0 && (
                <div
                  data-ocid="lookup.recurring_groups_section"
                  className="mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-200 rounded-full px-3 py-1">
                      <RefreshCw size={12} className="text-amber-700" />
                      <span className="text-xs font-bold text-amber-700">
                        Recurring Series
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {recurringGroupsRaw.length} active recurring series
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {recurringGroupsRaw.map((group, gIdx) => {
                      // Match occurrence bookings from the email/phone lookup
                      const occurrenceSet = new Set(
                        group.occurrenceIds.map((id) => id.toString()),
                      );
                      const occurrenceBookings = sortedBookings.filter((b) =>
                        occurrenceSet.has(
                          (b as unknown as { id: bigint }).id.toString(),
                        ),
                      );
                      return (
                        <RecurringGroupClientView
                          key={group.groupId}
                          group={group}
                          allSitters={allSitters}
                          occurrenceBookings={occurrenceBookings}
                          groupIndex={gIdx}
                          submittedEmail={submittedEmail}
                          onBookAgainSameSchedule={
                            navigateWithPrebook
                              ? triggerRebookSameSchedule
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                  {/* Divider */}
                  <div className="flex items-center gap-3 mt-5 mb-4">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      Individual Bookings
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                </div>
              )}

              {/* ══ QUICK REBOOK SECTION — amber gradient, distinct shortcut cards ══ */}
              {quickRebookCards.length > 0 && (
                <div data-ocid="lookup.book_again_section" className="mb-6">
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-accent/15 border border-accent/30 rounded-full px-3 py-1">
                      <Zap size={13} className="text-accent-foreground" />
                      <span className="text-xs font-bold text-accent-foreground">
                        Quick Rebook
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Your recent services — tap to rebook
                    </span>
                  </div>

                  {/* Horizontally scrollable card row */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                    {quickRebookCards.map((b, idx) => (
                      <div
                        key={b.id.toString()}
                        className="snap-start flex-shrink-0"
                      >
                        <QuickRebookCard
                          booking={b}
                          index={idx}
                          allSitters={allSitters}
                          onRebook={() => triggerRebook(b)}
                        />
                      </div>
                    ))}
                    {!navigateWithPrebook && (
                      <div className="snap-start flex-shrink-0 min-w-[220px] flex items-center justify-center rounded-2xl border-2 border-dashed border-border/60 p-4">
                        <div className="text-center">
                          <Sparkles
                            size={20}
                            className="text-muted-foreground mx-auto mb-2"
                          />
                          <p className="text-xs text-muted-foreground font-medium">
                            Tap any card to rebook
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mt-5 mb-4">
                    <div className="h-px flex-1 bg-border/60" />
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      Booking History
                    </span>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                </div>
              )}

              {/* ── Booking History header when no Quick Rebook ── */}
              {quickRebookCards.length === 0 && sortedBookings.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    Booking History
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
              )}

              {/* Current / Past tabs */}
              {sortedBookings.length > 0 && (
                <>
                  <div
                    className="flex items-center justify-between mb-4"
                    data-ocid="lookup.tabs"
                  >
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-ocid="lookup.tab.current"
                        onClick={() => setActiveTab("current")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border whitespace-nowrap min-h-[44px] ${
                          activeTab === "current"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        Current
                        {currentBookings.length > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                              activeTab === "current"
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {currentBookings.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        data-ocid="lookup.tab.past"
                        onClick={() => setActiveTab("past")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border whitespace-nowrap min-h-[44px] ${
                          activeTab === "past"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-card text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        Past
                        {pastBookings.length > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                              activeTab === "past"
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {pastBookings.length}
                          </span>
                        )}
                      </button>
                    </div>
                    {/* Total count badge */}
                    <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-3 py-1 rounded-full">
                      {sortedBookings.length} total
                    </span>
                  </div>

                  {displayedBookings.length === 0 ? (
                    <div
                      data-ocid="lookup.history.empty_state"
                      className="text-center py-12 bg-card rounded-2xl border border-border px-4"
                    >
                      <PawPrint
                        size={32}
                        className="text-muted-foreground mx-auto mb-3"
                      />
                      <p className="text-muted-foreground font-medium">
                        No {activeTab === "current" ? "current" : "past"}{" "}
                        bookings
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === "current"
                          ? "You have no active or pending bookings right now."
                          : "Completed and cancelled bookings will appear here."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {displayedBookings.map((b, idx) => (
                        <BookingActivityCard
                          key={b.id.toString()}
                          booking={b}
                          payment={paymentMap.get(b.id.toString()) ?? null}
                          sitterName={
                            b.sitterIds?.[0]
                              ? getSitterName(b.sitterIds[0])
                              : "Your sitter"
                          }
                          sitterPhoto={
                            b.sitterIds?.[0]
                              ? getSitterPhoto(b.sitterIds[0])
                              : null
                          }
                          onViewInvoice={() =>
                            setInvoiceBookingId(b.id.toString())
                          }
                          showBookAgain={
                            !!navigateWithPrebook &&
                            Array.isArray(b.sitterIds) &&
                            b.sitterIds.length > 0
                          }
                          onBookAgain={() => triggerRebook(b)}
                          data-ocid={`lookup.history.item.${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Only completed bookings with no current — show a new booking CTA */}
              {sortedBookings.length === 0 && completedBookings.length > 0 && (
                <div className="pt-2">
                  <Button
                    onClick={() =>
                      navigate(
                        "home",
                        undefined,
                        lookupMode === "email" ? submittedEmail : undefined,
                        lookupMode === "phone" ? submittedPhone : undefined,
                      )
                    }
                    variant="outline"
                    className="w-full rounded-full min-h-[44px] border-primary/30 text-primary hover:bg-primary/5"
                    data-ocid="lookup.book_new.button"
                  >
                    Or book something new →
                  </Button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Invoice Modal */}
      {invoiceBooking && (
        <InvoiceModal
          booking={invoiceBooking}
          sitterName={
            invoiceBooking.sitterIds?.[0]
              ? getSitterName(invoiceBooking.sitterIds[0])
              : "Your Sitter"
          }
          allSitters={allSitters}
          open={!!invoiceBookingId}
          onClose={() => setInvoiceBookingId(null)}
          viewerRole="client"
        />
      )}
    </div>
  );
}
