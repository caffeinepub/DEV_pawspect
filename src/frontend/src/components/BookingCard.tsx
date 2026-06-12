import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  PawPrint,
  Phone,
  Printer,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Public, Public__8 } from "../backend.d";
import { useCoBookingAssignment, useMyTeams } from "../hooks/useTeamQueries";
import AddToCalendar from "./AddToCalendar";
import CoBookingBadge from "./CoBookingBadge";
import CoBookingModal from "./CoBookingModal";
import InvoiceModal from "./InvoiceModal";
import MessageThread from "./MessageThread";
import StatusBadge from "./StatusBadge";

export interface AlternativeWindowDisplay {
  date: string;
  time: string;
  duration: string;
}

interface BookingCardProps {
  booking: Public__8;
  senderName: string;
  onConfirm?: (id: bigint) => void;
  onComplete?: (id: bigint) => void;
  onCancel?: (id: bigint) => void;
  /** Called when sitter clicks Decline — opens the DeclineBookingModal */
  onDecline?: (booking: Public__8) => void;
  index?: number;
  extraContent?: React.ReactNode;
  allSitters?: Public[];
  /** Optional payment record for paid/unpaid badge */
  payment?: { status?: string; totalAmount?: bigint } | null;
  /** Optional Book Again handler for client-facing views */
  onBookAgain?: () => void;
  /** For client view: sitter ID used for deep-link URLs */
  sitterId?: bigint;
  /** Current sitter's ID — enables co-booking controls when present */
  currentSitterId?: bigint;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

/** Returns the earliest service time window, e.g. "9:00 AM – 11:00 AM" */
function getServiceTimeLabel(booking: Public__8): string | null {
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
    const firstDay = sorted[0];
    const slot = firstDay?.slots?.[0];
    if (slot) {
      const startH = Math.floor(Number(slot.startTime) / 60);
      const startM = Number(slot.startTime) % 60;
      const endH = Math.floor(Number(slot.endTime) / 60);
      const endM = Number(slot.endTime) % 60;
      const startStr = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
      const endStr = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
      return `${formatTime12(startStr)} – ${formatTime12(endStr)}`;
    }
  }
  return null;
}

const PET_EMOJIS: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Bird: "🦜",
  Rabbit: "🐰",
  Fish: "🐟",
  "Small Animal": "🐹",
  Other: "🐾",
};

const STATUS_STRIPE: Record<string, string> = {
  in_progress: "bg-gradient-to-r from-emerald-400 to-teal-400",
  confirmed: "bg-gradient-to-r from-blue-500 to-indigo-500",
  completed: "bg-gradient-to-r from-emerald-300 to-teal-300",
  cancelled: "bg-muted",
  declined: "bg-gradient-to-r from-red-400 to-rose-500",
  pending: "bg-gradient-to-r from-amber-400 to-orange-400",
};

export default function BookingCard({
  booking,
  senderName,
  onConfirm,
  onComplete,
  onCancel,
  onDecline,
  index = 0,
  extraContent,
  allSitters = [],
  payment = null,
  onBookAgain,
  sitterId,
  currentSitterId,
}: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [coBookingOpen, setCoBookingOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Co-booking data — only fetched when currentSitterId is provided (sitter portal)
  const { data: coAssignment } = useCoBookingAssignment(
    currentSitterId !== undefined ? booking.id : undefined,
  );
  const { data: myTeams = [] } = useMyTeams();
  const hasTeam = Array.isArray(myTeams) && myTeams.length > 0;
  const hasCoBooking =
    !!coAssignment &&
    Array.isArray(coAssignment.assignments) &&
    coAssignment.assignments.length > 0;

  // Resolve co-sitter names for the badge
  const coSitterNames: string[] = hasCoBooking
    ? coAssignment.assignments.map(([id]) => {
        const found = allSitters.find((s) => s.id === id);
        return found?.name?.split(" ")?.[0] ?? "Co-sitter";
      })
    : [];

  // Scroll top of card into view when expanded, and trigger sparkle
  useEffect(() => {
    if (expanded) {
      setSparkle(true);
      const timer = setTimeout(() => {
        const card = cardRef.current;
        if (card) {
          // Use scrollIntoView with block: "nearest" first, then fine-tune
          card.scrollIntoView({ behavior: "smooth", block: "start" });
          // Additional scroll to add header clearance (64px header + 16px gap)
          setTimeout(() => {
            window.scrollBy({ top: -88, behavior: "smooth" });
          }, 80);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [expanded]);

  const statusKey =
    typeof booking.status === "string"
      ? booking.status
      : booking.status !== null && typeof booking.status === "object"
        ? (Object.keys(booking.status as object)[0] ?? "")
        : String(booking.status ?? "");

  const isInProgress = statusKey === "in_progress";
  const isCompleted = statusKey === "completed";
  const isDeclined = statusKey === "declined";
  const isPaid = payment !== null && payment?.status === "paid";

  // callRequest arrives as ?Bool — [true] or [] or undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyBooking = booking as any;
  const callRequested: boolean =
    anyBooking.callRequest === true ||
    (Array.isArray(anyBooking.callRequest) &&
      anyBooking.callRequest[0] === true);

  const servicesLabel =
    booking.services?.length > 0
      ? booking.services.join(" · ")
      : "General Care";

  const petsLabel =
    booking.pets?.length > 0
      ? booking.pets
          .map((p) => `${PET_EMOJIS[p.petType] ?? "🐾"} ${p.petName}`)
          .join(", ")
      : "No pets listed";

  const serviceTimeLabel = getServiceTimeLabel(booking);
  const accentStripe = STATUS_STRIPE[statusKey] ?? STATUS_STRIPE.pending;

  return (
    <>
      <div
        ref={cardRef}
        data-ocid={`bookings.item.${index + 1}`}
        onAnimationEnd={() => setSparkle(false)}
        className={`bg-card rounded-2xl overflow-hidden transition-all duration-200 w-full max-w-full ${
          isInProgress
            ? "border-l-4 border-l-emerald-400 border border-emerald-100 shadow-md ring-2 ring-emerald-400/10"
            : "border border-border/60 gloss-ring hover:-translate-y-0.5 hover:shadow-md"
        }${sparkle ? " animate-sparkle-border" : ""}`}
      >
        {/* Status accent stripe */}
        <div className={`h-1 w-full ${accentStripe}`} />

        <button
          type="button"
          className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex-1 min-w-0">
            {/* Live indicator */}
            {isInProgress && (
              <div className="flex items-center gap-1.5 mb-2 text-emerald-600 text-xs font-bold">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                LIVE — Service In Progress
              </div>
            )}

            {/* ★ APPOINTMENT DATE + TIME — most prominent */}
            <div className="mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-black text-foreground text-base leading-tight">
                  {formatDate(booking.startDate)}
                </span>
                {serviceTimeLabel && (
                  <span className="flex items-center gap-1 text-primary font-bold text-base">
                    <Clock size={14} className="shrink-0" />
                    {serviceTimeLabel}
                  </span>
                )}
              </div>
              {booking.startDate !== booking.endDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Calendar size={11} className="inline mr-1 mb-px" />
                  {formatDate(booking.startDate)} —{" "}
                  {formatDate(booking.endDate)}
                </p>
              )}
            </div>

            {/* Service type label */}
            {booking.services?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-2">
                {booking.services.slice(0, 3).map((svc) => (
                  <span
                    key={svc}
                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15"
                  >
                    {svc}
                  </span>
                ))}
                {booking.services.length > 3 && (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    +{booking.services.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Status + payment badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <StatusBadge status={booking.status as string} />
              <span
                className={
                  isPaid
                    ? "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0"
                    : "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0"
                }
              >
                {isPaid ? "✓ Paid" : "⏳ Unpaid"}
              </span>
              {booking.isRecurring && (
                <Badge
                  variant="outline"
                  className="text-xs gap-1 border-amber-300 text-amber-700 bg-amber-50 shrink-0"
                >
                  <RefreshCw size={10} /> Recurring
                </Badge>
              )}
              {booking.sitterIds?.length > 1 && (
                <Badge variant="outline" className="text-xs gap-1 shrink-0">
                  <Users size={10} /> {booking.sitterIds.length} sitters
                </Badge>
              )}
              {callRequested && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-400/30 shrink-0">
                  <Phone size={10} />
                  Call Requested
                </span>
              )}
            </div>

            {/* Recurring series subtitle */}
            {booking.isRecurring &&
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (booking as any).groupId && (
                <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mb-1">
                  <RefreshCw size={9} className="shrink-0" />
                  Part of a recurring series
                </p>
              )}

            {/* Pets + client name summary */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 min-w-0">
                <PawPrint size={12} className="shrink-0" />
                <span className="truncate">{petsLabel}</span>
              </span>
              <span className="shrink-0 text-muted-foreground/60">
                · {booking.clientName}
              </span>
            </div>
          </div>

          {expanded ? (
            <ChevronUp
              size={16}
              className="text-muted-foreground shrink-0 mt-1"
            />
          ) : (
            <ChevronDown
              size={16}
              className="text-muted-foreground shrink-0 mt-1"
            />
          )}
        </button>

        {/* Book Again — shown on completed bookings */}
        {isCompleted && onBookAgain && (
          <div className="px-4 pb-3 pt-0 border-t border-border/40">
            <button
              type="button"
              data-ocid={`bookings.item.${index + 1}.book_again_button`}
              onClick={onBookAgain}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 transition-all shadow-sm min-h-[44px]"
            >
              <RefreshCw size={14} />
              Book Again
            </button>
          </div>
        )}

        {expanded && (
          <div className="px-3 sm:px-5 pb-4 border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  Services
                </p>
                <p className="text-foreground break-words">{servicesLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  Contact
                </p>
                <p className="text-foreground break-all text-sm">
                  {booking.clientEmail}
                </p>
                {booking.clientPhone ? (
                  <a
                    href={`sms:${booking.clientPhone}`}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-0.5"
                    aria-label="Send text message"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="break-all">{booking.clientPhone}</span>
                  </a>
                ) : null}
                {callRequested && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-400/25 rounded-lg px-2.5 py-2 leading-snug">
                    <Phone size={12} className="shrink-0 mt-px" />
                    Client requested a call before confirmation — please call{" "}
                    {booking.clientPhone ? (
                      <a
                        href={`tel:${booking.clientPhone}`}
                        className="underline hover:no-underline break-all"
                      >
                        {booking.clientPhone}
                      </a>
                    ) : (
                      booking.clientEmail
                    )}
                  </p>
                )}
              </div>
              {/* Service schedule with per-day times */}
              {booking.serviceSchedule &&
                booking.serviceSchedule.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">
                      Service Schedule
                    </p>
                    <div className="space-y-1.5">
                      {[...booking.serviceSchedule]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((day, di) => (
                          <div
                            key={`day-${di}`}
                            className="text-xs bg-primary/5 border border-primary/10 rounded-lg px-3 py-2"
                          >
                            <span className="font-semibold text-foreground">
                              {new Date(
                                `${day.date}T12:00:00`,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {day.slots.map((slot, si) => (
                              <span
                                key={`slot-${si}`}
                                className="ml-2 text-primary font-medium"
                              >
                                <Clock
                                  size={10}
                                  className="inline mr-0.5 mb-px"
                                />
                                {formatTime12(slot.startTime)}–
                                {formatTime12(slot.endTime)}
                                {slot.service ? ` · ${slot.service}` : ""}
                              </span>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              {booking.pets?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">
                    Pets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {booking.pets.map((pet, pi) => (
                      <div
                        key={`${pet.petName}-${pi}`}
                        className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-3 py-1 text-xs"
                      >
                        <span>{PET_EMOJIS[pet.petType] ?? "🐾"}</span>
                        <span className="font-medium">{pet.petName}</span>
                        <span className="text-muted-foreground">
                          ({pet.petType})
                        </span>
                        {pet.breed && (
                          <span className="text-muted-foreground">
                            · {pet.breed}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {booking.isRecurring && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">
                    Recurrence
                  </p>
                  <p className="capitalize text-foreground">
                    {booking.recurrencePattern ?? "—"}
                  </p>
                </div>
              )}
            </div>

            {booking.notes && (
              <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 break-words">
                <span className="font-medium">Notes:</span> {booking.notes}
              </p>
            )}

            {/* Declined details — shown for client view (no onDecline) and sitter view */}
            {isDeclined &&
              (() => {
                const declineReason: string | null =
                  anyBooking.declineReason ?? null;
                const altWindows: AlternativeWindowDisplay[] | null =
                  anyBooking.alternativeWindows ?? null;
                const hasSitterId =
                  sitterId !== undefined ||
                  booking.sitterIds?.[0] !== undefined;
                const resolvedSitterId = sitterId ?? booking.sitterIds?.[0];

                return (
                  <div className="space-y-3">
                    {/* Sitter's message */}
                    {declineReason && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1.5 flex items-center gap-1">
                          <XCircle size={11} />
                          {onDecline
                            ? "Decline reason sent to client"
                            : "Sitter's Message"}
                        </p>
                        <p className="text-sm text-red-800 leading-relaxed break-words">
                          {declineReason}
                        </p>
                      </div>
                    )}

                    {/* Alternative windows — client view only */}
                    {!onDecline && altWindows && altWindows.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <CalendarClock size={13} className="text-primary" />
                          Alternative Times Suggested
                        </p>
                        <div className="space-y-2">
                          {altWindows.map((w, wi) => {
                            const dateStr = w.date
                              ? new Date(
                                  `${w.date}T12:00:00`,
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "";
                            const timeStr = w.time
                              ? (() => {
                                  const [h, m] = w.time.split(":").map(Number);
                                  const suffix = h >= 12 ? "PM" : "AM";
                                  const h12 = h % 12 === 0 ? 12 : h % 12;
                                  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
                                })()
                              : "";
                            const deepLink =
                              hasSitterId && w.date && w.time
                                ? `/#/sitter-detail?preselectSitter=true&sitterId=${resolvedSitterId?.toString() ?? ""}&date=${w.date}&time=${w.time}`
                                : null;

                            return (
                              <div
                                key={`alt-${wi}`}
                                data-ocid={`bookings.item.${index + 1}.alt_window.${wi + 1}`}
                                className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5"
                              >
                                <div className="flex items-center gap-2 text-sm min-w-0">
                                  <Calendar
                                    size={13}
                                    className="text-primary shrink-0"
                                  />
                                  <span className="font-semibold text-foreground truncate">
                                    {dateStr}
                                  </span>
                                  {timeStr && (
                                    <span className="flex items-center gap-1 text-primary font-medium shrink-0">
                                      <Clock size={11} />
                                      {timeStr}
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
                                    data-ocid={`bookings.item.${index + 1}.book_this_time.${wi + 1}`}
                                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white min-h-[36px] transition-all hover:opacity-90"
                                    style={{
                                      background:
                                        "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.65 0.20 40))",
                                    }}
                                  >
                                    <CalendarClock size={11} />
                                    Book This Time
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* No windows fallback — client view */}
                    {!onDecline && (!altWindows || altWindows.length === 0) && (
                      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                        Search for another sitter who's available.
                      </div>
                    )}
                  </div>
                );
              })()}

            {(onConfirm || onComplete || onCancel || onDecline) && (
              <div className="flex flex-col sm:flex-row gap-2">
                {onConfirm && (booking.status as string) === "pending" && (
                  <Button
                    data-ocid={`bookings.item.${index + 1}.confirm_button`}
                    size="sm"
                    className="w-full sm:w-auto bg-emerald-600 text-white hover:bg-emerald-700 rounded-full min-h-[44px]"
                    onClick={() => onConfirm(booking.id)}
                  >
                    Confirm Booking
                  </Button>
                )}
                {onDecline && (booking.status as string) === "pending" && (
                  <Button
                    data-ocid={`bookings.item.${index + 1}.delete_button`}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto border-amber-400 text-amber-600 hover:bg-amber-50 rounded-full min-h-[44px]"
                    onClick={() => onDecline(booking)}
                  >
                    <XCircle size={13} className="mr-1.5" />
                    Decline
                  </Button>
                )}
                {onComplete && (booking.status as string) === "confirmed" && (
                  <Button
                    data-ocid={`bookings.item.${index + 1}.secondary_button`}
                    size="sm"
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 rounded-full min-h-[44px]"
                    onClick={() => onComplete(booking.id)}
                  >
                    Mark Complete
                  </Button>
                )}
                {onCancel &&
                  !(
                    ["cancelled", "completed", "declined"] as string[]
                  ).includes(booking.status as string) && (
                    <Button
                      data-ocid={`bookings.item.${index + 1}.cancel_button`}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 rounded-full min-h-[44px]"
                      onClick={() => onCancel(booking.id)}
                    >
                      Cancel
                    </Button>
                  )}
              </div>
            )}

            {extraContent}

            {/* ── Co-booking section (sitter portal only) ── */}
            {currentSitterId !== undefined && (
              <div className="pt-1">
                {hasCoBooking && (
                  <div className="mb-2">
                    <CoBookingBadge
                      bookingId={booking.id}
                      sitterNames={coSitterNames}
                    />
                  </div>
                )}
                {hasTeam && !hasCoBooking && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-ocid={`bookings.item.${index + 1}.add_co_sitter_button`}
                    onClick={() => setCoBookingOpen(true)}
                    className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5 min-h-[40px]"
                  >
                    <UserPlus size={13} />
                    Add Co-Sitter
                  </Button>
                )}
              </div>
            )}

            {/* Invoice + Calendar buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto rounded-full gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 min-h-[44px]"
                onClick={() => setInvoiceOpen(true)}
              >
                <Printer size={13} />
                Invoice / Mark Paid
              </Button>
              <AddToCalendar
                title={`Pet Care — ${booking.pets?.map((p) => p.petName).join(", ") ?? "Pets"} with ${senderName}`}
                startDate={booking.startDate}
                endDate={booking.endDate}
                description={`Booking #${booking.id}. Services: ${booking.services?.join(", ") ?? ""}.`}
                location="Service at home"
                size="sm"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Messages</h4>
              <MessageThread bookingId={booking.id} senderName={senderName} />
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        booking={booking}
        sitterName={senderName}
        allSitters={allSitters}
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />

      {currentSitterId !== undefined && (
        <CoBookingModal
          open={coBookingOpen}
          onClose={() => setCoBookingOpen(false)}
          booking={booking}
          currentSitterId={currentSitterId}
          allSitters={allSitters.map((s) => ({
            id: s.id,
            name: s.name,
          }))}
        />
      )}
    </>
  );
}
