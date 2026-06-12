import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Mail,
  PawPrint,
  Pencil,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Star,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { Public, Public__6, Public__8 } from "../backend.d";
import AddToCalendar from "../components/AddToCalendar";
import InvoiceModal from "../components/InvoiceModal";
import ServiceLogTimeline from "../components/ServiceLogTimeline";
import {
  useActiveSitters,
  useBookingsByEmail,
  useBookingsByPhone,
  useCancelBookingByClient,
  useClientNudgeSitter,
  usePaymentsByBookingIds,
  useSubmitReview,
} from "../hooks/useQueries";
import type { PrebookState } from "../pages/SitterDetailPage";

interface Props {
  navigate: (view: View) => void;
  navigateWithPrebook?: (sitterId: bigint, prebook: PrebookState) => void;
  initialEmail?: string;
  initialTab?: string;
}

type DashTab = "upcoming" | "past" | "invoices" | "drafts";

// ─── Date/time helpers ────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Tue, Apr 22" */
function formatDateShort(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/** Extract appointment time string like "9:00 AM – 12:00 PM" from a booking */
function getApptTime(booking: Public__8): string | null {
  if (booking.serviceSchedule && booking.serviceSchedule.length > 0) {
    const sorted = [...booking.serviceSchedule].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const firstSlot = sorted[0]?.slots?.[0];
    if (firstSlot) {
      return `${formatTime12(firstSlot.startTime)} – ${formatTime12(firstSlot.endTime)}`;
    }
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
      const sStr = `${sH.toString().padStart(2, "0")}:${sM.toString().padStart(2, "0")}`;
      const eStr = `${eH.toString().padStart(2, "0")}:${eM.toString().padStart(2, "0")}`;
      return `${formatTime12(sStr)} – ${formatTime12(eStr)}`;
    }
  }
  return null;
}

function getStatusKey(status: unknown): string {
  if (typeof status === "string") return status;
  if (status !== null && typeof status === "object")
    return Object.keys(status as object)[0] ?? "";
  return String(status ?? "");
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

const UPCOMING_STATUSES = new Set(["pending", "confirmed", "in_progress"]);
const PAST_STATUSES = new Set(["completed", "cancelled", "declined"]);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; badgeCls: string; stripeCls: string }
> = {
  pending: {
    label: "Awaiting Confirmation",
    badgeCls: "text-amber-700 bg-amber-50 border-amber-200",
    stripeCls: "bg-gradient-to-r from-amber-400 to-orange-400",
  },
  confirmed: {
    label: "Confirmed ✓",
    badgeCls: "text-blue-700 bg-blue-50 border-blue-200",
    stripeCls: "bg-gradient-to-r from-blue-500 to-indigo-500",
  },
  in_progress: {
    label: "Live Now",
    badgeCls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    stripeCls: "bg-gradient-to-r from-emerald-400 to-teal-400",
  },
  completed: {
    label: "Completed",
    badgeCls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    stripeCls: "bg-gradient-to-r from-emerald-300 to-teal-300",
  },
  cancelled: {
    label: "Cancelled",
    badgeCls: "text-muted-foreground bg-muted border-border",
    stripeCls: "bg-muted",
  },
  declined: {
    label: "Declined",
    badgeCls: "text-red-700 bg-red-50 border-red-200",
    stripeCls: "bg-gradient-to-r from-red-400 to-rose-500",
  },
};

// ─── Star picker ──────────────────────────────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="p-1 transition-transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`${i} star`}
        >
          <Star
            size={24}
            className={
              i <= (hovered || value)
                ? "fill-accent text-accent"
                : "text-muted-foreground"
            }
          />
        </button>
      ))}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({
  active,
  onClick,
  label,
  count,
  ocid,
  accent = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  ocid: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className={`flex-none flex items-center justify-center gap-1.5 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px] ${
        active
          ? "bg-card text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-card/60"
      }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
            active
              ? accent
                ? "bg-amber-100 text-amber-700"
                : "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  message,
  cta,
  onCta,
  ocid,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  cta?: string;
  onCta?: () => void;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="glass-card rounded-2xl p-8 text-center flex flex-col items-center gap-3"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Icon size={28} className="text-primary" />
      </div>
      <h3 className="font-display font-semibold text-base">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {message}
      </p>
      {cta && onCta && (
        <Button
          onClick={onCta}
          className="mt-1 rounded-full bg-primary text-primary-foreground min-h-[44px]"
          data-ocid={`${ocid}.cta`}
        >
          {cta}
        </Button>
      )}
    </div>
  );
}

// ─── LIVE NOW Hero Banner ─────────────────────────────────────────────────────
function LiveNowBanner({
  booking,
  sitterName,
  getSitterPhoto,
}: {
  booking: Public__8;
  sitterName: string;
  getSitterPhoto: (sid: bigint) => string | null;
}) {
  const photo = booking.sitterIds?.[0]
    ? getSitterPhoto(booking.sitterIds[0])
    : null;
  const petNames =
    booking.pets?.map((p) => p.petName).join(" & ") ?? "your pets";
  const services = booking.services?.join(", ") ?? "";
  const apptTime = getApptTime(booking);

  return (
    <div
      data-ocid="client.live_now.banner"
      className="relative overflow-hidden rounded-2xl mb-6 shadow-xl"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.32 0.22 265), oklch(0.42 0.18 280) 55%, oklch(0.38 0.2 295))",
        }}
      />
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.9 0.05 180 / 0.4), transparent)",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
      {/* Ring decorations */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.07] pointer-events-none">
        <div
          className="absolute top-3 right-3 w-40 h-40 rounded-full border-2 border-white animate-ping"
          style={{ animationDuration: "4s" }}
        />
        <div className="absolute top-9 right-9 w-24 h-24 rounded-full border border-white" />
      </div>

      <div className="relative p-5 sm:p-6">
        {/* LIVE badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1">
            <Radio size={11} />
            Live Right Now
          </span>
          <span className="ml-auto text-xs text-white/50 flex items-center gap-1">
            <Zap size={10} />
            Auto-updating
          </span>
        </div>

        <div className="flex items-start gap-4">
          {/* Sitter avatar */}
          <div className="shrink-0">
            {photo ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/30 shadow-lg">
                <img
                  src={photo}
                  alt={sitterName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {sitterName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-bold text-white leading-snug mb-0.5 break-words"
              style={{ fontSize: "clamp(1.05rem, 4vw, 1.35rem)" }}
            >
              {petNames} {petNames.includes("&") ? "are" : "is"} in great paws!
              🐾
            </h2>
            <p className="text-sm text-white/75 mb-2">
              {sitterName} is on the job
              {services ? ` · ${services}` : ""}
            </p>
            {/* Flight-tracker time row */}
            <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Started {formatTime(booking.startDate)}
              </span>
              {apptTime && (
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <CalendarDays size={11} />
                  {apptTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Warm message strip */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/15 text-sm text-white/80">
          Your furry family member is being well cared for. Updates appear below
          in real time.
        </div>

        {/* Inline service log */}
        {booking.sitterIds && booking.sitterIds.length > 0 && (
          <div className="mt-4 bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            {booking.sitterIds.slice(0, 1).map((sid) => (
              <ServiceLogTimeline
                key={sid.toString()}
                bookingId={booking.id}
                sitterId={sid}
                sitterName={sitterName}
                isActive
                autoRefresh
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Returns ms until booking start; negative means it's in the past */
function msUntilStart(startDate: bigint): number {
  return Number(startDate / 1_000_000n) - Date.now();
}

function isWithin24Hours(startDate: bigint): boolean {
  return msUntilStart(startDate) < 24 * 60 * 60 * 1000;
}

// ─── Cancellation Modal ───────────────────────────────────────────────────────
interface CancelModalProps {
  booking: Public__8;
  getSitterName: (id: bigint) => string;
  onClose: () => void;
  onSuccess: () => void;
}

function CancelBookingModal({
  booking,
  getSitterName,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = useState("");
  const [policy1, setPolicy1] = useState(false);
  const [policy2, setPolicy2] = useState(false);
  const within24 = isWithin24Hours(booking.startDate);
  const cancelMutation = useCancelBookingByClient();

  const sitterName = booking.sitterIds?.[0]
    ? getSitterName(booking.sitterIds[0])
    : "Your Sitter";
  const services = (booking.services ?? []).join(", ");
  const canSubmit =
    reason.trim().length >= 10 && policy1 && (within24 ? policy2 : true);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await cancelMutation.mutateAsync({
        bookingId: booking.id,
        cancelReason: reason.trim(),
      });
      toast.success("Booking cancelled. Confirmation email sent.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel booking.",
      );
    }
  };

  return (
    <dialog
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 m-0 max-w-none max-h-none w-full h-full border-0"
      open
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      data-ocid="client.cancel.dialog"
    >
      <div
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <XCircle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-base leading-tight">
                Cancel Booking
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sitterName} · {services || "Pet Care"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-ocid="client.cancel.close_button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Booking summary */}
          <div className="rounded-xl bg-muted/30 border border-border/60 px-4 py-3 text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="shrink-0" />
              <span>{formatDateShort(booking.startDate)}</span>
              {getApptTime(booking) && (
                <span className="text-primary font-medium">
                  · {getApptTime(booking)}
                </span>
              )}
            </div>
            {booking.pets && booking.pets.length > 0 && (
              <div className="flex items-center gap-2">
                <PawPrint size={13} className="shrink-0" />
                <span>{booking.pets.map((p) => p.petName).join(", ")}</span>
              </div>
            )}
          </div>

          {/* 24-hour warning */}
          {within24 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={15}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <p className="text-sm font-bold text-amber-800">
                  You are within the 24-hour cancellation window
                </p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed ml-5">
                Per your booking agreement, cancellations within 24 hours of the
                service may be{" "}
                <strong>fully charged at the sitter's discretion</strong>. This
                is entirely between you and {sitterName}. Pawspect is a software
                platform and is not a party to this arrangement.
              </p>
            </div>
          )}

          {/* Reason field */}
          <div className="space-y-1.5">
            <label
              htmlFor="cancel-reason"
              className="text-sm font-semibold text-foreground"
            >
              Reason for cancellation{" "}
              <span className="text-destructive">*</span>
            </label>
            <textarea
              id="cancel-reason"
              data-ocid="client.cancel.textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Something came up unexpectedly — my plans changed."
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ fontSize: "16px" }}
              rows={3}
            />
            {reason.length > 0 && reason.trim().length < 10 && (
              <p
                className="text-xs text-destructive"
                data-ocid="client.cancel.field_error"
              >
                Please provide at least 10 characters.
              </p>
            )}
          </div>

          {/* Policy acknowledgment */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              data-ocid="client.cancel.policy1.checkbox"
              checked={policy1}
              onChange={(e) => setPolicy1(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-primary shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
              I understand my booking will be cancelled and the sitter will be
              notified immediately.
            </span>
          </label>

          {within24 && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                data-ocid="client.cancel.policy2.checkbox"
                checked={policy2}
                onChange={(e) => setPolicy2(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-amber-500 shrink-0"
              />
              <span className="text-xs text-amber-700 leading-relaxed font-semibold group-hover:text-amber-800 transition-colors">
                I understand I may be charged the full service amount by the
                sitter even after cancelling.
              </span>
            </label>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full min-h-[44px]"
              data-ocid="client.cancel.cancel_button"
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || cancelMutation.isPending}
              data-ocid="client.cancel.confirm_button"
              className={`flex-1 rounded-full min-h-[44px] font-semibold ${
                within24
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              }`}
            >
              {cancelMutation.isPending
                ? "Cancelling…"
                : within24
                  ? "I Understand, Cancel Anyway"
                  : "Cancel Booking"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

// ─── Flight-ticket style upcoming card ───────────────────────────────────────
const PET_EMOJIS_CD: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Bird: "🦜",
  Rabbit: "🐰",
  Fish: "🐟",
  "Small Animal": "🐹",
  Other: "🐾",
};

function UpcomingCard({
  booking,
  idx,
  getSitterName,
  getSitterPhoto,
  paymentMap,
  onInvoice,
  navigate,
  navigateWithPrebook,
}: {
  booking: Public__8;
  idx: number;
  getSitterName: (id: bigint) => string;
  getSitterPhoto: (id: bigint) => string | null;
  paymentMap: Map<string, Public__6>;
  onInvoice: (id: string) => void;
  navigate: (v: View) => void;
  navigateWithPrebook?: (sitterId: bigint, prebook: PrebookState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const statusKey = getStatusKey(booking.status);
  const isInProgress = statusKey === "in_progress";
  const isConfirmed = statusKey === "confirmed";
  const bidStr = booking.id.toString();
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
  const sitterName = booking.sitterIds?.[0]
    ? getSitterName(booking.sitterIds[0])
    : "Your Sitter";
  const photo = booking.sitterIds?.[0]
    ? getSitterPhoto(booking.sitterIds[0])
    : null;
  const services = booking.services ?? [];
  const apptTime = getApptTime(booking);
  const payment = paymentMap.get(bidStr) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isPaid = payment !== null && (payment as any).status === "paid";

  const accentBarCls = isInProgress
    ? "h-[3px] w-full animate-shimmer-sweep"
    : isConfirmed
      ? "h-[3px] w-full bg-gradient-to-r from-blue-500 to-indigo-500"
      : "h-[3px] w-full bg-gradient-to-r from-amber-400 to-orange-400";

  const triggerRebook = () => {
    const sitterId = booking.sitterIds?.[0];
    const prebookServices = services.length > 0 ? services : undefined;
    const firstSlot = booking.serviceSchedule?.[0]?.slots?.[0];
    const prebookTimeWindow = firstSlot
      ? { startTime: firstSlot.startTime, endTime: firstSlot.endTime }
      : undefined;
    const prebookPets =
      Array.isArray(booking.pets) && booking.pets.length > 0
        ? booking.pets
        : undefined;
    if (
      sitterId &&
      navigateWithPrebook &&
      (prebookServices || prebookTimeWindow)
    ) {
      navigateWithPrebook(sitterId, {
        prebookServices,
        prebookSitterId: sitterId,
        prebookTimeWindow,
        prebookPets,
        prebookClientName: booking.clientName ?? undefined,
        prebookClientEmail: booking.clientEmail ?? undefined,
        prebookClientPhone: booking.clientPhone ?? undefined,
        prebookSitterIds:
          Array.isArray(booking.sitterIds) && booking.sitterIds.length > 0
            ? booking.sitterIds
            : undefined,
        isRebook: true,
      });
    } else {
      navigate("home");
    }
  };

  return (
    <div
      data-ocid={`client.upcoming.item.${idx + 1}`}
      className={`rounded-2xl overflow-hidden w-full transition-shadow duration-200 ${
        isInProgress
          ? "border border-emerald-200 shadow-lg ring-1 ring-emerald-400/20"
          : "border border-border/70 shadow-sm hover:shadow-md"
      } bg-card/80 backdrop-blur-sm`}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div className={accentBarCls} />

      {/* ── COLLAPSED CARD — tap to expand ── */}
      <button
        type="button"
        className="w-full text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* ROW 1: Date | Status pill | Time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display font-black text-foreground text-sm leading-tight truncate min-w-0">
            {formatDateShort(booking.startDate)}
          </span>
          {isInProgress ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Live Now
            </span>
          ) : (
            <span
              className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeCls}`}
            >
              {cfg.label}
            </span>
          )}
          {apptTime && (
            <span className="text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
              {apptTime}
            </span>
          )}
        </div>

        {/* ROW 2: Service pills + sitter */}
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
            <span className="text-[11px] text-muted-foreground shrink-0">
              +{services.length - 2}
            </span>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 ring-1 ring-primary/20 shrink-0">
              {photo ? (
                <img
                  src={photo}
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
            {booking.pets && booking.pets.length > 0 ? (
              booking.pets.slice(0, 3).map((p) => (
                <span
                  key={p.petName}
                  className="inline-flex items-center gap-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 shrink-0"
                >
                  {PET_EMOJIS_CD[p.petType] ?? "🐾"} {p.petName}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">
                No pets listed
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
              <>
                <Clock size={9} /> Unpaid
              </>
            )}
          </span>
        </div>

        {/* ROW 4: Expand hint */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
          {expanded ? (
            <>
              <ChevronUp size={12} className="shrink-0" /> Hide activity
            </>
          ) : (
            <>
              <ChevronDown size={12} className="shrink-0" /> View activity &amp;
              actions
            </>
          )}
        </div>
      </button>

      {/* ── EXPANDED PANEL — BELOW the header, never overlapping ── */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 flight-card-expand">
          {/* Activity log (confirmed or live) */}
          {(isConfirmed || isInProgress) &&
            booking.sitterIds &&
            booking.sitterIds.length > 0 && (
              <div className="px-4 pt-3 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Radio size={10} />
                  Activity
                </p>
                <div className="max-h-48 overflow-y-auto">
                  {booking.sitterIds.slice(0, 1).map((sid) => (
                    <ServiceLogTimeline
                      key={sid.toString()}
                      bookingId={booking.id}
                      sitterId={sid}
                      sitterName={getSitterName(sid)}
                      isActive={isInProgress}
                      autoRefresh={isInProgress}
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Action buttons */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            <button
              type="button"
              data-ocid={`client.invoice.button.${idx + 1}`}
              onClick={() => onInvoice(bidStr)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
            >
              <FileText size={14} />
              View Invoice
            </button>

            {isConfirmed && (
              <AddToCalendar
                title={`Pet Care — ${booking.pets?.map((p) => p.petName).join(" & ") ?? "your pets"} with ${sitterName}`}
                startDate={booking.startDate}
                endDate={booking.endDate}
                description={`Booking #${bidStr}. Services: ${services.join(", ")}.`}
                location="Service at home"
                size="sm"
                className="w-full rounded-xl min-h-[44px]"
              />
            )}

            <button
              type="button"
              data-ocid={`client.book_again.button.${idx + 1}`}
              onClick={triggerRebook}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl min-h-[44px] text-white"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
              }}
            >
              <Zap size={14} />
              Book Again — Same Services
            </button>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border/60 py-2 rounded-xl transition-colors min-h-[44px]"
            >
              <ChevronUp size={14} />
              Hide Details
            </button>

            {/* Cancel booking button */}
            {(statusKey === "pending" || statusKey === "confirmed") &&
              (isWithin24Hours(booking.startDate) ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    data-ocid={`client.cancel_window.button.${idx + 1}`}
                    disabled
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-amber-300/50 text-amber-600/60 bg-amber-50/40 cursor-not-allowed min-h-[40px]"
                  >
                    <AlertTriangle size={13} />
                    Past Cancellation Window
                  </button>
                  <button
                    type="button"
                    data-ocid={`client.cancel_anyway.button.${idx + 1}`}
                    onClick={() => setShowCancelModal(true)}
                    className="w-full text-center text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
                  >
                    Cancel anyway? (charges may apply)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-ocid={`client.cancel.button.${idx + 1}`}
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-300/60 text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  <XCircle size={14} />
                  Cancel Booking
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <CancelBookingModal
          booking={booking}
          getSitterName={getSitterName}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => setExpanded(false)}
        />
      )}
    </div>
  );
}

// ─── Past booking card ────────────────────────────────────────────────────────
function PastCard({
  booking,
  idx,
  getSitterName,
  getSitterPhoto,
  paymentMap,
  onInvoice,
  reviewedIds,
  reviewingId,
  setReviewingId,
  reviewRating,
  setReviewRating,
  reviewText,
  setReviewText,
  onReviewSubmit,
  submitPending,
  navigate,
  navigateWithPrebook,
}: {
  booking: Public__8;
  idx: number;
  getSitterName: (id: bigint) => string;
  getSitterPhoto: (id: bigint) => string | null;
  paymentMap: Map<string, Public__6>;
  onInvoice: (id: string) => void;
  reviewedIds: Set<string>;
  reviewingId: string | null;
  setReviewingId: (id: string | null) => void;
  reviewRating: number;
  setReviewRating: (v: number) => void;
  reviewText: string;
  setReviewText: (v: string) => void;
  onReviewSubmit: (b: Public__8) => void;
  submitPending: boolean;
  navigate: (v: View) => void;
  navigateWithPrebook?: (sitterId: bigint, prebook: PrebookState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const bidStr = booking.id.toString();
  const statusKey = getStatusKey(booking.status);
  const isCompleted = statusKey === "completed";
  const isDeclined = statusKey === "declined";
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.completed;
  const sitterName = booking.sitterIds?.[0]
    ? getSitterName(booking.sitterIds[0])
    : "Your Sitter";
  const photo = booking.sitterIds?.[0]
    ? getSitterPhoto(booking.sitterIds[0])
    : null;
  const payment = paymentMap.get(bidStr) ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isPaid = payment !== null && (payment as any).status === "paid";
  const alreadyReviewed = reviewedIds.has(bidStr);
  const isReviewing = reviewingId === bidStr;
  const apptTime = getApptTime(booking);
  const services = booking.services ?? [];

  const accentBarCls =
    statusKey === "completed"
      ? "h-[3px] w-full bg-gradient-to-r from-emerald-300 to-teal-300"
      : "h-[3px] w-full bg-muted";

  const triggerRebook = () => {
    const sitterId = booking.sitterIds?.[0];
    const prebookServices = services.length > 0 ? services : undefined;
    const firstSlot = booking.serviceSchedule?.[0]?.slots?.[0];
    const prebookTimeWindow = firstSlot
      ? { startTime: firstSlot.startTime, endTime: firstSlot.endTime }
      : undefined;
    const prebookPets =
      Array.isArray(booking.pets) && booking.pets.length > 0
        ? booking.pets
        : undefined;
    if (
      sitterId &&
      navigateWithPrebook &&
      (prebookServices || prebookTimeWindow)
    ) {
      navigateWithPrebook(sitterId, {
        prebookServices,
        prebookSitterId: sitterId,
        prebookTimeWindow,
        prebookPets,
        prebookClientName: booking.clientName ?? undefined,
        prebookClientEmail: booking.clientEmail ?? undefined,
        prebookClientPhone: booking.clientPhone ?? undefined,
        prebookSitterIds:
          Array.isArray(booking.sitterIds) && booking.sitterIds.length > 0
            ? booking.sitterIds
            : undefined,
        isRebook: true,
      });
    } else {
      navigate("home");
    }
  };

  return (
    <div
      data-ocid={`client.past.item.${idx + 1}`}
      className="rounded-2xl overflow-hidden w-full border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 bg-card/80 backdrop-blur-sm"
    >
      {/* ── TOP ACCENT BAR ── */}
      <div className={accentBarCls} />

      {/* ── COLLAPSED CARD ── */}
      <button
        type="button"
        className="w-full text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-none"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* ROW 1: Date | Status pill | Time */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display font-black text-foreground text-sm leading-tight truncate min-w-0">
            {formatDateShort(booking.startDate)}
          </span>
          <span
            className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeCls}`}
          >
            {cfg.label}
          </span>
          {apptTime && (
            <span className="text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap">
              {apptTime}
            </span>
          )}
        </div>

        {/* ROW 2: Service pills + sitter */}
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
            <span className="text-[11px] text-muted-foreground shrink-0">
              +{services.length - 2}
            </span>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 ring-1 ring-primary/20 shrink-0">
              {photo ? (
                <img
                  src={photo}
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
            {booking.pets && booking.pets.length > 0 ? (
              booking.pets.slice(0, 3).map((p) => (
                <span
                  key={p.petName}
                  className="inline-flex items-center gap-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 shrink-0"
                >
                  {PET_EMOJIS_CD[p.petType] ?? "🐾"} {p.petName}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">
                No pets listed
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
              <>
                <Clock size={9} /> Unpaid
              </>
            )}
          </span>
        </div>

        {/* ROW 4: Expand hint */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
          {expanded ? (
            <>
              <ChevronUp size={12} className="shrink-0" /> Hide activity
            </>
          ) : (
            <>
              <ChevronDown size={12} className="shrink-0" /> View details &amp;
              actions
            </>
          )}
        </div>
      </button>

      {/* ── EXPANDED PANEL — structurally separate, always below header ── */}
      {expanded && (
        <div className="border-t border-border/60 bg-muted/10 flight-card-expand">
          {/* Review section (before action buttons) */}
          {isCompleted && !alreadyReviewed && (
            <div className="px-4 pt-3 pb-2">
              {!isReviewing ? (
                <button
                  type="button"
                  data-ocid={`client.review.button.${idx + 1}`}
                  onClick={() => {
                    setReviewingId(bidStr);
                    setReviewRating(5);
                    setReviewText("");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-accent/30 text-accent hover:bg-accent/5 transition-colors min-h-[44px]"
                >
                  <Star size={14} />
                  Rate your experience
                </button>
              ) : (
                <div
                  data-ocid={`client.review.panel.${idx + 1}`}
                  className="p-4 bg-muted/30 rounded-xl space-y-3 border border-border"
                >
                  <p className="text-sm font-semibold">How was {sitterName}?</p>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    data-ocid="client.review.textarea"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share what made this service great (or how it could improve)..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-base resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ fontSize: "16px" }}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      data-ocid="client.review.submit_button"
                      onClick={() => onReviewSubmit(booking)}
                      disabled={submitPending}
                      className="rounded-full px-4 text-xs bg-primary text-primary-foreground min-h-[44px] sm:min-h-[32px]"
                    >
                      {submitPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-ocid="client.review.cancel_button"
                      onClick={() => {
                        setReviewingId(null);
                        setReviewText("");
                      }}
                      className="rounded-full px-3 text-xs min-h-[44px] sm:min-h-[32px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isCompleted && alreadyReviewed && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Star size={11} className="fill-emerald-600" />
                Thanks for your feedback! 🐾
              </p>
            </div>
          )}

          {/* Declined booking detail — reason + alternative windows */}
          {isDeclined &&
            (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const anyB = booking as any;
              const declineReason: string | null = anyB.declineReason ?? null;
              const altWindows: Array<{
                date: string;
                time: string;
                duration: string;
              }> | null = anyB.alternativeWindows ?? null;
              const sitterId = booking.sitterIds?.[0];

              return (
                <div className="px-4 pt-3 pb-2 space-y-3">
                  {/* Sitter's reason */}
                  {declineReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1.5 flex items-center gap-1">
                        <XCircle size={11} />
                        Sitter's Message
                      </p>
                      <p className="text-sm text-red-800 leading-relaxed break-words">
                        {declineReason}
                      </p>
                    </div>
                  )}

                  {/* Alternative windows */}
                  {altWindows && altWindows.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-primary" />
                        Alternative Times — Book fast before they fill up!
                      </p>
                      <div className="space-y-2">
                        {altWindows.map((w, wi) => {
                          const dateLabel = w.date
                            ? new Date(`${w.date}T12:00:00`).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "";
                          const timeLabel = w.time
                            ? (() => {
                                const [h, m] = w.time.split(":").map(Number);
                                const suffix = h >= 12 ? "PM" : "AM";
                                const h12 = h % 12 === 0 ? 12 : h % 12;
                                return `${h12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
                              })()
                            : "";
                          const deepLink =
                            sitterId && w.date && w.time
                              ? `/#/sitter-detail?preselectSitter=true&sitterId=${sitterId.toString()}&date=${w.date}&time=${w.time}`
                              : null;

                          return (
                            <div
                              key={`alt-${wi}`}
                              data-ocid={`client.past.alt_window.${wi + 1}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2 text-sm min-w-0">
                                <CalendarDays
                                  size={13}
                                  className="text-primary shrink-0"
                                />
                                <span className="font-semibold text-foreground truncate">
                                  {dateLabel}
                                </span>
                                {timeLabel && (
                                  <span className="flex items-center gap-1 text-primary font-medium shrink-0">
                                    <Clock size={11} />
                                    {timeLabel}
                                  </span>
                                )}
                                {w.duration && (
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    · {w.duration}
                                  </span>
                                )}
                              </div>
                              {deepLink && (
                                <a
                                  href={deepLink}
                                  data-ocid={`client.past.book_this_time.${wi + 1}`}
                                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white min-h-[36px] transition-all hover:opacity-90"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
                                  }}
                                >
                                  Book This Time
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                        ⚡ Book fast — these windows may fill up soon!
                      </p>
                    </div>
                  )}

                  {(!altWindows || altWindows.length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      Search for another sitter who's available.
                    </p>
                  )}
                </div>
              );
            })()}

          {/* Cancelled by client notice */}
          {statusKey === "cancelled" &&
            (() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const anyB = booking as any;
              const cancelReason: string | null =
                anyB.cancelReason ?? anyB.cancellationReason ?? null;
              const withinWindow: boolean =
                anyB.withinCancellationWindow ?? false;
              return (
                <div className="px-4 pt-3 pb-2 space-y-2">
                  {withinWindow && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle size={12} />
                        Late cancellation — charges may apply
                      </p>
                      <p className="text-xs text-amber-600 leading-relaxed">
                        This was cancelled within 24 hours of the service. The
                        sitter may charge the full amount at their discretion.
                      </p>
                    </div>
                  )}
                  {cancelReason && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Cancellation Reason
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {cancelReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

          {/* Action buttons */}
          <div className="px-4 pb-4 pt-2 flex flex-col gap-2">
            <button
              type="button"
              data-ocid={`client.past.invoice.button.${idx + 1}`}
              onClick={() => onInvoice(bidStr)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
            >
              <FileText size={14} />
              View Invoice
            </button>

            <button
              type="button"
              data-ocid={`client.past.book_again.button.${idx + 1}`}
              onClick={triggerRebook}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl min-h-[44px] text-white"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
              }}
            >
              <Zap size={14} />
              Book Again — Same Services
            </button>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground border border-border/60 py-2 rounded-xl transition-colors min-h-[44px]"
            >
              <ChevronUp size={14} />
              Hide Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice due card ─────────────────────────────────────────────────────────
function InvoiceCard({
  booking,
  idx,
  getSitterName,
  paymentMap,
  onInvoice,
  nudgeSent,
  nudgingId,
  onNudge,
}: {
  booking: Public__8;
  idx: number;
  getSitterName: (id: bigint) => string;
  paymentMap: Map<string, Public__6>;
  onInvoice: (id: string) => void;
  nudgeSent: Set<string>;
  nudgingId: string | null;
  onNudge: (id: string) => void;
}) {
  const bidStr = booking.id.toString();
  const payment = paymentMap.get(bidStr);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalAmount = payment ? (payment as any).totalAmount : null;
  const sitterName = booking.sitterIds?.[0]
    ? getSitterName(booking.sitterIds[0])
    : "Your Sitter";
  const petNames = booking.pets?.map((p) => p.petName).join(", ") ?? "—";
  const services = booking.services?.join(", ") ?? "—";
  const isNudged = nudgeSent.has(bidStr);
  const isNudging = nudgingId === bidStr;
  const apptTime = getApptTime(booking);

  return (
    <div
      data-ocid={`client.invoices.item.${idx + 1}`}
      className="bg-card rounded-2xl border border-amber-200/70 overflow-hidden gloss-ring hover:shadow-md transition-all duration-200 w-full"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-300" />

      <div className="p-4 sm:p-5">
        {/* Date + time */}
        <div className="mb-2.5 pb-2.5 border-b border-amber-100/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-base">
              {formatDateShort(booking.startDate)}
            </span>
            {apptTime && (
              <span className="flex items-center gap-1 text-primary font-semibold text-sm">
                <Clock size={13} className="shrink-0" />
                {apptTime}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="font-display font-bold truncate"
                title={sitterName}
              >
                {sitterName}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                ⏳ Payment Due
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 shrink-0">
                <CalendarDays size={11} />
                {formatDate(booking.startDate)}
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <PawPrint size={11} className="shrink-0" />
                <span className="truncate" title={petNames}>
                  {petNames}
                </span>
              </span>
            </div>
          </div>

          {totalAmount && (
            <div className="text-right shrink-0">
              <div className="text-2xl font-display font-bold text-foreground">
                ${(Number(totalAmount) / 100).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total Due</div>
            </div>
          )}
        </div>

        {/* Services */}
        {booking.services && booking.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {booking.services.map((svc) => (
              <span
                key={svc}
                className="text-xs bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-full font-medium"
              >
                {svc}
              </span>
            ))}
          </div>
        )}

        {/* Payment instructions */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-sm text-amber-800">
          <p className="font-semibold mb-0.5 text-amber-900">How to Pay</p>
          <p className="text-xs leading-relaxed">
            Pay directly to your sitter via <strong>Cash, Check, Venmo,</strong>{" "}
            or <strong>Apple Pay Cash</strong>.
            {services !== "—" && <> Services: {services}.</>}
          </p>
        </div>

        {/* Actions row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            data-ocid={`client.invoices.invoice.button.${idx + 1}`}
            onClick={() => onInvoice(bidStr)}
            className="rounded-full h-10 px-4 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5 w-full sm:w-auto"
          >
            <FileText size={12} />
            View Invoice
          </Button>

          <Button
            size="sm"
            data-ocid={`client.invoices.nudge.button.${idx + 1}`}
            onClick={() => onNudge(bidStr)}
            disabled={isNudging || isNudged}
            className={`rounded-full h-10 px-4 text-xs gap-1.5 w-full sm:w-auto ${
              isNudged
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isNudged ? (
              <>
                <CheckCircle size={12} />
                Message sent! 📧
              </>
            ) : isNudging ? (
              <>
                <Bell size={12} className="animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Bell size={12} />
                Send a friendly reminder 📧
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientDashboard({
  navigate,
  navigateWithPrebook,
  initialEmail = "",
  initialTab,
}: Props) {
  const [lookupMode, setLookupMode] = useState<"email" | "phone">("email");
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [submittedEmail, setSubmittedEmail] = useState(initialEmail);
  const [phoneInput, setPhoneInput] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [activeTab, setActiveTab] = useState<DashTab>(
    initialTab === "past"
      ? "past"
      : initialTab === "invoices"
        ? "invoices"
        : "upcoming",
  );
  const [phoneError, setPhoneError] = useState("");

  // Review state
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Invoice modal
  const [invoiceBookingId, setInvoiceBookingId] = useState<string | null>(null);

  // Nudge state per booking id
  const [nudgeSent, setNudgeSent] = useState<Set<string>>(new Set());
  const [nudgingId, setNudgingId] = useState<string | null>(null);

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
  const isLoading = lookupMode === "email" ? emailLoading : phoneLoading;
  const isQueryError =
    lookupMode === "email" ? emailQueryError : phoneQueryError;
  const submittedIdentifier =
    lookupMode === "email" ? submittedEmail : submittedPhone;

  const { data: allSittersRaw = [] } = useActiveSitters();
  const allSitters = allSittersRaw as Public[];

  const submitReview = useSubmitReview();
  const nudgeMutation = useClientNudgeSitter();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    if (initialEmail?.trim()) setSubmittedEmail(initialEmail.trim());
  }, []);

  const rawBookings = useMemo(
    () =>
      (lookupMode === "email" ? emailBookings : phoneBookings) as Public__8[],
    [lookupMode, emailBookings, phoneBookings],
  );

  // in_progress floats to top, then newest-first
  const upcomingBookings = useMemo(
    () =>
      rawBookings
        .filter((b) => UPCOMING_STATUSES.has(getStatusKey(b.status)))
        .sort((a, b) => {
          const aLive = getStatusKey(a.status) === "in_progress" ? 1 : 0;
          const bLive = getStatusKey(b.status) === "in_progress" ? 1 : 0;
          if (bLive !== aLive) return bLive - aLive;
          return Number(a.startDate - b.startDate);
        }),
    [rawBookings],
  );

  const pastBookings = useMemo(
    () =>
      rawBookings
        .filter((b) => PAST_STATUSES.has(getStatusKey(b.status)))
        .sort((a, b) => Number(b.startDate - a.startDate)),
    [rawBookings],
  );

  const bookingIds = useMemo(
    () => rawBookings.map((b) => b.id.toString()),
    [rawBookings],
  );
  const { data: paymentsRaw = [] } = usePaymentsByBookingIds(bookingIds);
  const allPayments = paymentsRaw as Public__6[];

  const paymentMap = useMemo(() => {
    const m = new Map<string, Public__6>();
    for (const p of allPayments) m.set(p.bookingId.toString(), p);
    return m;
  }, [allPayments]);

  const invoicesDue = useMemo(
    () =>
      rawBookings
        .filter((b) => {
          const payment = paymentMap.get(b.id.toString());
          if (!payment) return true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (payment as any).status !== "paid";
        })
        .sort((a, b) => Number(b.startDate - a.startDate)),
    [rawBookings, paymentMap],
  );

  const clientName = rawBookings[0]?.clientName ?? "";

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
          "Please enter a valid phone number (e.g. (555) 123-4567)",
        );
      }
    }
  };

  const handleReviewSubmit = async (booking: Public__8) => {
    const sitterId = booking.sitterIds?.[0];
    if (!sitterId) return;
    try {
      await submitReview.mutateAsync({
        sitterId,
        rating: reviewRating,
        reviewText: reviewText.trim(),
        bookingId: booking.id,
      });
      setReviewedIds((prev) => new Set([...prev, booking.id.toString()]));
      setReviewingId(null);
      setReviewRating(5);
      setReviewText("");
      toast.success("Thank you for your review! 🐾");
    } catch {
      toast.error("Failed to submit review.");
    }
  };

  const handleNudge = async (bookingId: string) => {
    setNudgingId(bookingId);
    try {
      await nudgeMutation.mutateAsync(BigInt(bookingId));
      setNudgeSent((prev) => new Set([...prev, bookingId]));
      setTimeout(
        () =>
          setNudgeSent((prev) => {
            const next = new Set(prev);
            next.delete(bookingId);
            return next;
          }),
        4000,
      );
    } catch {
      toast.error("Couldn't send message. Please try again.");
    } finally {
      setNudgingId(null);
    }
  };

  const liveBooking = useMemo(
    () =>
      rawBookings.find((b) => getStatusKey(b.status) === "in_progress") ?? null,
    [rawBookings],
  );

  const invoiceBooking = invoiceBookingId
    ? rawBookings.find((b) => b.id.toString() === invoiceBookingId)
    : null;

  const hasResults = rawBookings.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 frosted-nav">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="flex items-center gap-1 sm:gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity shrink-0"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Home</span>
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
              <span className="truncate">{clientName}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1
            className="font-display font-bold mb-1 break-words"
            style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)" }}
          >
            {clientName
              ? `Welcome back, ${clientName}! 🐾`
              : "Find Your Bookings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Use the contact info you provided when booking.
          </p>
        </div>

        {/* ── Lookup panel ──────────────────────────────────────────────────── */}
        <div className="glass-surface rounded-2xl p-4 sm:p-5 mb-6">
          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              data-ocid="client.lookup_email.toggle"
              onClick={() => {
                setLookupMode("email");
                setPhoneError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-all border min-h-[48px] ${
                lookupMode === "email"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              }`}
            >
              <Mail size={16} />
              <span>Email</span>
            </button>
            <button
              type="button"
              data-ocid="client.lookup_phone.toggle"
              onClick={() => {
                setLookupMode("phone");
                setPhoneError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 sm:px-4 rounded-xl text-sm font-semibold transition-all border min-h-[48px] ${
                lookupMode === "phone"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent border-border text-foreground hover:bg-muted"
              }`}
            >
              <Phone size={16} />
              <span>Phone</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {lookupMode === "email"
              ? "Enter the email address you used when booking"
              : "Enter the phone number you used when booking — any format works"}
          </p>

          <Label
            htmlFor={lookupMode === "email" ? "cd-email" : "cd-phone"}
            className="text-sm font-semibold mb-2 block"
          >
            {lookupMode === "email" ? "Email Address" : "Phone Number"}
          </Label>

          <div className="flex gap-2">
            {lookupMode === "email" ? (
              <Input
                data-ocid="client.email.input"
                id="cd-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="jane@example.com"
                className="rounded-full h-12"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            ) : (
              <Input
                data-ocid="client.phone.input"
                id="cd-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setPhoneError("");
                }}
                placeholder="(555) 123-4567"
                className="rounded-full h-12"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            )}
            <Button
              data-ocid="client.search.button"
              onClick={handleSearch}
              className="rounded-full bg-primary text-primary-foreground shrink-0 h-12 px-5"
            >
              <Search size={17} />
            </Button>
          </div>

          {lookupMode === "phone" && phoneError && (
            <p
              data-ocid="client.phone.field_error"
              className="text-xs text-destructive mt-2"
            >
              {phoneError}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            We use your contact info to keep you updated on your pet&apos;s
            care.
          </p>
        </div>

        {/* ── Loading skeletons ─────────────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Error state ───────────────────────────────────────────────────── */}
        {!isLoading && isQueryError && submittedIdentifier && (
          <div
            data-ocid="client.error_state"
            className="text-center py-10 bg-card rounded-2xl border border-destructive/20 px-4"
          >
            <p className="text-muted-foreground font-medium mb-3">
              Having trouble connecting. Please wait a moment.
            </p>
            <button
              type="button"
              onClick={handleSearch}
              className="text-sm font-semibold text-primary hover:underline underline-offset-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── No identifier yet ─────────────────────────────────────────────── */}
        {!isLoading && !submittedIdentifier && (
          <EmptyState
            icon={PawPrint}
            title="Your pet care portal"
            message="Enter your email or phone to see upcoming appointments, past services, and invoices."
            ocid="client.empty_state"
          />
        )}

        {/* ── No results ────────────────────────────────────────────────────── */}
        {!isLoading && submittedIdentifier && !hasResults && (
          <div
            data-ocid="client.no_results.empty_state"
            className="text-center py-12 bg-card rounded-2xl border border-border px-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-1">
              No bookings found
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              No bookings match <strong>{submittedIdentifier}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try looking up by{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2"
                onClick={() =>
                  setLookupMode(lookupMode === "email" ? "phone" : "email")
                }
              >
                {lookupMode === "email" ? "phone number" : "email address"}
              </button>{" "}
              instead.
            </p>
            <Button
              onClick={() => navigate("home")}
              className="mt-5 rounded-full bg-primary text-primary-foreground min-h-[44px]"
              data-ocid="client.find_sitter.button"
            >
              Find a Sitter
            </Button>
          </div>
        )}

        {/* ── Dashboard ─────────────────────────────────────────────────────── */}
        {!isLoading && hasResults && (
          <div>
            {/* Live Now Banner (shown above tabs) */}
            {liveBooking && (
              <LiveNowBanner
                booking={liveBooking}
                sitterName={
                  liveBooking.sitterIds?.[0]
                    ? getSitterName(liveBooking.sitterIds[0])
                    : "Your Sitter"
                }
                getSitterPhoto={getSitterPhoto}
              />
            )}

            {/* Tabs — horizontally scrollable */}
            <div className="-mx-4 px-4 overflow-x-auto pb-1 mb-5">
              <div
                className="flex gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border min-w-max"
                data-ocid="client.booking_tabs"
              >
                <TabBtn
                  active={activeTab === "upcoming"}
                  onClick={() => setActiveTab("upcoming")}
                  label="Upcoming"
                  count={upcomingBookings.length}
                  ocid="client.tab.upcoming"
                />
                <TabBtn
                  active={activeTab === "past"}
                  onClick={() => setActiveTab("past")}
                  label="Past"
                  count={pastBookings.length}
                  ocid="client.tab.past"
                />
                <TabBtn
                  active={activeTab === "invoices"}
                  onClick={() => setActiveTab("invoices")}
                  label="Invoices Due"
                  count={invoicesDue.length}
                  ocid="client.tab.invoices"
                  accent
                />
                <TabBtn
                  active={activeTab === "drafts"}
                  onClick={() => setActiveTab("drafts")}
                  label="Drafts"
                  count={0}
                  ocid="client.tab.drafts"
                />
              </div>
            </div>

            {/* ── Upcoming tab ──────────────────────────────────────────────── */}
            {activeTab === "upcoming" && (
              <div data-ocid="client.upcoming.section">
                {upcomingBookings.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="No upcoming appointments 🐾"
                    message="Ready to book? It only takes 60 seconds and there's no account needed!"
                    cta="Book a Sitter"
                    onCta={() => navigate("home")}
                    ocid="client.upcoming.empty_state"
                  />
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((b, i) => (
                      <UpcomingCard
                        key={b.id.toString()}
                        booking={b}
                        idx={i}
                        getSitterName={getSitterName}
                        getSitterPhoto={getSitterPhoto}
                        paymentMap={paymentMap}
                        onInvoice={setInvoiceBookingId}
                        navigate={navigate}
                        navigateWithPrebook={navigateWithPrebook}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Past tab ──────────────────────────────────────────────────── */}
            {activeTab === "past" && (
              <div data-ocid="client.past.section">
                {pastBookings.length === 0 ? (
                  <EmptyState
                    icon={PawPrint}
                    title="No past services yet"
                    message="You haven't had any services yet. Let's change that!"
                    cta="Book your first service"
                    onCta={() => navigate("home")}
                    ocid="client.past.empty_state"
                  />
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map((b, i) => (
                      <PastCard
                        key={b.id.toString()}
                        booking={b}
                        idx={i}
                        getSitterName={getSitterName}
                        getSitterPhoto={getSitterPhoto}
                        paymentMap={paymentMap}
                        onInvoice={setInvoiceBookingId}
                        reviewedIds={reviewedIds}
                        reviewingId={reviewingId}
                        setReviewingId={setReviewingId}
                        reviewRating={reviewRating}
                        setReviewRating={setReviewRating}
                        reviewText={reviewText}
                        setReviewText={setReviewText}
                        onReviewSubmit={handleReviewSubmit}
                        submitPending={submitReview.isPending}
                        navigate={navigate}
                        navigateWithPrebook={navigateWithPrebook}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Invoices Due tab ──────────────────────────────────────────── */}
            {activeTab === "invoices" && (
              <div data-ocid="client.invoices.section">
                {invoicesDue.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title="You're all paid up! 🎉"
                    message="No outstanding invoices. Nice work — your sitters appreciate you."
                    ocid="client.invoices.empty_state"
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {invoicesDue.length} unpaid{" "}
                      {invoicesDue.length === 1 ? "invoice" : "invoices"}
                    </p>
                    {invoicesDue.map((b, i) => (
                      <InvoiceCard
                        key={b.id.toString()}
                        booking={b}
                        idx={i}
                        getSitterName={getSitterName}
                        paymentMap={paymentMap}
                        onInvoice={setInvoiceBookingId}
                        nudgeSent={nudgeSent}
                        nudgingId={nudgingId}
                        onNudge={handleNudge}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Drafts tab ────────────────────────────────────────────────── */}
            {activeTab === "drafts" && (
              <div data-ocid="client.drafts.section">
                <EmptyState
                  icon={Pencil}
                  title="No saved drafts"
                  message="Start a new booking anytime — your pets deserve the best care!"
                  cta="Book a Sitter"
                  onCta={() => navigate("home")}
                  ocid="client.drafts.empty_state"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Invoice Modal ──────────────────────────────────────────────────────── */}
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
