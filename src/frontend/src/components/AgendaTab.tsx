import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  PawPrint,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AvailabilityEntry } from "../backend.d";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BookingLike {
  id: bigint;
  clientName: string;
  pets: Array<{ name: string }>;
  services: string[];
  startDate: bigint;
  endDate: bigint;
  status: string;
  isRecurring?: boolean;
  isAdHoc?: boolean;
  groupId?: [] | [string];
  serviceSchedule?: Array<{
    date: string;
    slots: Array<{
      service: string;
      startTime: string;
      endTime: string;
      sitterId?: bigint;
    }>;
  }>;
  totalAmountCents?: bigint;
}

interface Props {
  bookings: BookingLike[];
  adHocJobs?: BookingLike[];
  availability: AvailabilityEntry[];
  sitterId: bigint | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TIMELINE_START = 7; // 7 AM
const TIMELINE_END = 21; // 9 PM
const HOURS = Array.from(
  { length: TIMELINE_END - TIMELINE_START },
  (_, i) => TIMELINE_START + i,
);
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  return startOfDay(addDays(d, -diff));
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const disp = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0
    ? `${disp} ${suffix}`
    : `${disp}:${String(m).padStart(2, "0")} ${suffix}`;
}

function timeStrToDecimal(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function minutesToDecimal(mins: number): number {
  return mins / 60;
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function jsToMonIndex(day: number): number {
  return (day + 6) % 7;
}

// ── Booking slot extraction ────────────────────────────────────────────────────

interface TimeSlot {
  bookingId: string;
  clientName: string;
  petNames: string[];
  service: string;
  startH: number;
  endH: number;
  status: string;
  isRecurring: boolean;
  isAdHoc: boolean;
  totalAmountCents?: bigint;
}

function getSlotsForDate(booking: BookingLike, dateIso: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const id = booking.id.toString();
  const isRecurring =
    booking.isRecurring === true ||
    (Array.isArray(booking.groupId) && booking.groupId.length > 0);
  const isAdHoc = booking.isAdHoc === true;

  const daySchedule = booking.serviceSchedule?.find((d) => d.date === dateIso);
  if (daySchedule?.slots?.length) {
    for (const slot of daySchedule.slots) {
      const startH = timeStrToDecimal(slot.startTime);
      const endH = timeStrToDecimal(slot.endTime);
      if (endH > startH) {
        slots.push({
          bookingId: id,
          clientName: booking.clientName,
          petNames: booking.pets.map((p) => p.name),
          service: slot.service,
          startH,
          endH,
          status: booking.status as string,
          isRecurring,
          isAdHoc,
          totalAmountCents: booking.totalAmountCents,
        });
      }
    }
    return slots;
  }

  const bookingStart = new Date(Number(booking.startDate / 1_000_000n));
  const bookingEnd = new Date(Number(booking.endDate / 1_000_000n));
  const targetDay = new Date(dateIso);
  if (
    targetDay >= startOfDay(bookingStart) &&
    targetDay <= startOfDay(bookingEnd)
  ) {
    const startH = isSameDay(bookingStart, targetDay)
      ? bookingStart.getHours() + bookingStart.getMinutes() / 60
      : 9;
    const endH = Math.min(startH + 2, 21);
    slots.push({
      bookingId: id,
      clientName: booking.clientName,
      petNames: booking.pets.map((p) => p.name),
      service: booking.services[0] ?? "Service",
      startH,
      endH,
      status: booking.status as string,
      isRecurring,
      isAdHoc,
      totalAmountCents: booking.totalAmountCents,
    });
  }

  return slots;
}

// ── Summary strip helpers ─────────────────────────────────────────────────────

function getWeekBookingCount(bookings: BookingLike[], mon: Date): number {
  const sun = addDays(mon, 6);
  return bookings.filter((b) => {
    const start = new Date(Number(b.startDate / 1_000_000n));
    const end = new Date(Number(b.endDate / 1_000_000n));
    return (
      !["cancelled"].includes(b.status as string) &&
      startOfDay(end) >= startOfDay(mon) &&
      startOfDay(start) <= startOfDay(sun)
    );
  }).length;
}

function getNextBookingTime(bookings: BookingLike[]): string | null {
  const now = new Date();
  const upcoming = bookings
    .filter((b) => {
      const s = new Date(Number(b.startDate / 1_000_000n));
      return (
        s > now && !["cancelled", "completed"].includes(b.status as string)
      );
    })
    .sort((a, b) => Number(a.startDate - b.startDate));
  if (!upcoming.length) return null;
  const next = new Date(Number(upcoming[0].startDate / 1_000_000n));
  return next.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Day view booking block ─────────────────────────────────────────────────────

function DayBlock({
  slot,
  totalHours,
  expanded,
  onToggle,
}: {
  slot: TimeSlot;
  totalHours: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pxPerHour = 56;
  const top = (slot.startH - TIMELINE_START) * pxPerHour;
  const height = Math.max((slot.endH - slot.startH) * pxPerHour, 28);
  const isConfirmed =
    slot.status === "confirmed" || slot.status === "in_progress";
  const isPending = slot.status === "pending";
  const isAdHoc = slot.isAdHoc;

  const bg = isAdHoc
    ? "bg-amber-100/90 border-amber-500"
    : isConfirmed
      ? "bg-primary/90 border-primary"
      : isPending
        ? "bg-amber-400/90 border-amber-500"
        : "bg-muted border-border";
  const text = isAdHoc
    ? "text-amber-900"
    : isConfirmed
      ? "text-primary-foreground"
      : isPending
        ? "text-amber-900"
        : "text-foreground";

  if (slot.startH >= TIMELINE_END || slot.endH <= TIMELINE_START || !totalHours)
    return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ top, height, left: 4, right: 4 }}
      className={`absolute rounded-lg border-l-4 px-2.5 py-1 text-left overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md z-10 ${bg}`}
      data-ocid={`agenda.booking_block.${slot.bookingId}`}
    >
      <p className={`text-xs font-bold leading-tight truncate ${text}`}>
        {slot.clientName}
      </p>
      {height > 32 && (
        <p className={`text-xs leading-tight truncate ${text} opacity-80`}>
          {slot.service}
        </p>
      )}
      {slot.isAdHoc ? (
        <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-px leading-none">
          Off-App
        </span>
      ) : slot.isRecurring ? (
        <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full px-1.5 py-px leading-none">
          Recurring
        </span>
      ) : null}
      {height > 48 && (
        <p className={`text-xs mt-0.5 ${text} opacity-70`}>
          {formatTime(
            `${Math.floor(slot.startH)}:${String(Math.round((slot.startH % 1) * 60)).padStart(2, "0")}`,
          )}
          –
          {formatTime(
            `${Math.floor(slot.endH)}:${String(Math.round((slot.endH % 1) * 60)).padStart(2, "0")}`,
          )}
        </p>
      )}
      {expanded && (
        <div
          className={`mt-1.5 pt-1.5 border-t ${
            isAdHoc
              ? "border-amber-600/30"
              : isConfirmed
                ? "border-primary-foreground/30"
                : "border-amber-600/30"
          } text-xs ${text} opacity-90 space-y-0.5`}
        >
          {slot.petNames.length > 0 && <p>Pets: {slot.petNames.join(", ")}</p>}
          {slot.isAdHoc && slot.totalAmountCents !== undefined && (
            <p className="font-bold">
              Total: ${(Number(slot.totalAmountCents) / 100).toFixed(2)}
            </p>
          )}
          {!slot.isAdHoc && (
            <Badge
              variant="outline"
              className={`text-[10px] capitalize ${isConfirmed ? "border-primary-foreground/40 text-primary-foreground" : "border-amber-700 text-amber-900"}`}
            >
              {slot.status}
            </Badge>
          )}
          {slot.isAdHoc && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-600 text-amber-800"
            >
              Off-App • Completed
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}

// ── Availability background band ───────────────────────────────────────────────

function AvailBand({ startH, endH }: { startH: number; endH: number }) {
  const pxPerHour = 56;
  const clampedStart = Math.max(startH, TIMELINE_START);
  const clampedEnd = Math.min(endH, TIMELINE_END);
  if (clampedEnd <= clampedStart) return null;
  const top = (clampedStart - TIMELINE_START) * pxPerHour;
  const height = (clampedEnd - clampedStart) * pxPerHour;
  return (
    <div
      style={{ top, height, left: 0, right: 0 }}
      className="absolute bg-emerald-400/10 border-l-2 border-emerald-400/40 pointer-events-none"
    />
  );
}

// ── Day view ─────────────────────────────────────────────────────────────────

function DayView({
  date,
  slots,
  availDayIndex,
  availability,
}: {
  date: Date;
  slots: TimeSlot[];
  availDayIndex: number;
  availability: AvailabilityEntry[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pxPerHour = 56;
  const totalHeight = HOURS.length * pxPerHour;

  const availEntry = availability.find(
    (e) => Number(e.dayOfWeek) === availDayIndex,
  );
  const availStartH = availEntry
    ? minutesToDecimal(Number(availEntry.startTime))
    : null;
  const availEndH = availEntry
    ? minutesToDecimal(Number(availEntry.endTime))
    : null;

  return (
    <div className="flex gap-0 w-full">
      {/* Hour labels */}
      <div
        className="w-14 shrink-0 select-none"
        style={{ height: totalHeight }}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            style={{ height: pxPerHour }}
            className="flex items-start justify-end pr-3 pt-1"
          >
            <span className="text-[10px] text-muted-foreground leading-none">
              {formatHour(h)}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline grid */}
      <div
        className="flex-1 min-w-0 relative border-l border-border"
        style={{ height: totalHeight }}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            style={{ top: (h - TIMELINE_START) * pxPerHour }}
            className="absolute left-0 right-0 border-t border-border/40"
          />
        ))}

        {availStartH !== null && availEndH !== null && (
          <AvailBand startH={availStartH} endH={availEndH} />
        )}

        {slots.map((slot) => (
          <DayBlock
            key={`${slot.bookingId}-${slot.service}`}
            slot={slot}
            totalHours={TIMELINE_END - TIMELINE_START}
            expanded={expandedId === `${slot.bookingId}-${slot.service}`}
            onToggle={() =>
              setExpandedId((prev) =>
                prev === `${slot.bookingId}-${slot.service}`
                  ? null
                  : `${slot.bookingId}-${slot.service}`,
              )
            }
          />
        ))}

        {isSameDay(date, new Date()) &&
          (() => {
            const now = new Date();
            const nowH = now.getHours() + now.getMinutes() / 60;
            if (nowH < TIMELINE_START || nowH > TIMELINE_END) return null;
            const top = (nowH - TIMELINE_START) * pxPerHour;
            return (
              <div
                style={{ top }}
                className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shrink-0" />
                <div className="flex-1 h-px bg-red-500/70" />
              </div>
            );
          })()}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({
  monday,
  bookings,
  availability,
  onDayClick,
}: {
  monday: Date;
  bookings: BookingLike[];
  availability: AvailabilityEntry[];
  onDayClick: (d: Date) => void;
}) {
  const pxPerHour = 40;
  const totalHeight = HOURS.length * pxPerHour;
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const slotsPerDay = useMemo(() => {
    return days.map((d) => {
      const iso = dateToIso(d);
      return bookings.flatMap((b) => getSlotsForDate(b, iso));
    });
  }, [days, bookings]);

  return (
    // outer: max-w-full + overflow-hidden prevents page overflow
    <div className="max-w-full overflow-hidden">
      {/* inner: overflow-x-auto for smooth horizontal scroll within container */}
      <div
        className="overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div style={{ minWidth: 560 }}>
          {/* Day header row */}
          <div className="flex border-b border-border">
            <div className="w-12 shrink-0" />
            {days.map((d, i) => {
              const isToday = isSameDay(d, today);
              const count = slotsPerDay[i].length;
              return (
                <button
                  key={dateToIso(d)}
                  type="button"
                  data-ocid={`agenda.week.day.${i + 1}`}
                  onClick={() => onDayClick(d)}
                  className={`flex-1 min-w-[80px] py-2 text-center transition-colors hover:bg-muted/40 ${isToday ? "bg-primary/5" : ""}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {DAY_NAMES[i]}
                  </p>
                  <p
                    className={`text-sm font-semibold mt-0.5 ${isToday ? "text-primary" : "text-foreground"}`}
                  >
                    {d.getDate()}
                  </p>
                  {count > 0 && (
                    <span className="inline-block mt-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid body */}
          <div className="flex">
            {/* Hour column */}
            <div
              className="w-12 shrink-0 select-none"
              style={{ height: totalHeight }}
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: pxPerHour }}
                  className="flex items-start justify-end pr-2 pt-0.5"
                >
                  <span className="text-[9px] text-muted-foreground leading-none">
                    {formatHour(h)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, colIdx) => {
              const isToday = isSameDay(d, today);
              const availEntry = availability.find(
                (e) => Number(e.dayOfWeek) === jsToMonIndex(d.getDay()),
              );
              const availStartH = availEntry
                ? minutesToDecimal(Number(availEntry.startTime))
                : null;
              const availEndH = availEntry
                ? minutesToDecimal(Number(availEntry.endTime))
                : null;

              return (
                <div
                  key={dateToIso(d)}
                  className={`flex-1 min-w-[80px] relative border-l border-border ${isToday ? "bg-primary/5" : ""}`}
                  style={{ height: totalHeight }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ top: (h - TIMELINE_START) * pxPerHour }}
                      className="absolute left-0 right-0 border-t border-border/30"
                    />
                  ))}

                  {availStartH !== null &&
                    availEndH !== null &&
                    (() => {
                      const cs = Math.max(availStartH, TIMELINE_START);
                      const ce = Math.min(availEndH, TIMELINE_END);
                      if (ce <= cs) return null;
                      return (
                        <div
                          style={{
                            top: (cs - TIMELINE_START) * pxPerHour,
                            height: (ce - cs) * pxPerHour,
                          }}
                          className="absolute left-0 right-0 bg-emerald-400/10 border-l-2 border-emerald-400/30 pointer-events-none"
                        />
                      );
                    })()}

                  {slotsPerDay[colIdx].map((slot) => {
                    const cs = Math.max(slot.startH, TIMELINE_START);
                    const ce = Math.min(slot.endH, TIMELINE_END);
                    if (ce <= cs) return null;
                    const top = (cs - TIMELINE_START) * pxPerHour;
                    const height = Math.max((ce - cs) * pxPerHour, 18);
                    const isConf =
                      slot.status === "confirmed" ||
                      slot.status === "in_progress";
                    const isPend = slot.status === "pending";
                    const isAdH = slot.isAdHoc;
                    const bg = isAdH
                      ? "bg-amber-100/90 border-amber-500"
                      : isConf
                        ? "bg-primary/85 border-primary"
                        : isPend
                          ? "bg-amber-400/85 border-amber-400"
                          : "bg-muted border-border";
                    const text = isAdH
                      ? "text-amber-900"
                      : isConf
                        ? "text-primary-foreground"
                        : isPend
                          ? "text-amber-900"
                          : "text-foreground";
                    return (
                      <div
                        key={`${slot.bookingId}-${slot.service}-${colIdx}`}
                        style={{ top, height, left: 2, right: 2 }}
                        className={`absolute rounded border-l-2 px-1 overflow-hidden ${bg}`}
                        data-ocid={`agenda.week.block.${slot.bookingId}`}
                      >
                        <p
                          className={`text-[10px] font-bold leading-tight truncate ${text}`}
                        >
                          {slot.clientName}
                        </p>
                        {height > 28 && (
                          <p
                            className={`text-[10px] leading-tight truncate ${text} opacity-75`}
                          >
                            {slot.service}
                          </p>
                        )}
                        {isAdH ? (
                          <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-500 text-white rounded-full px-1 py-px leading-none">
                            Off-App
                          </span>
                        ) : slot.isRecurring ? (
                          <span className="inline-block mt-0.5 text-[9px] font-bold bg-amber-400 text-amber-900 rounded-full px-1 py-px leading-none">
                            Recurring
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {isToday &&
                    (() => {
                      const now = new Date();
                      const nowH = now.getHours() + now.getMinutes() / 60;
                      if (nowH < TIMELINE_START || nowH > TIMELINE_END)
                        return null;
                      return (
                        <div
                          style={{ top: (nowH - TIMELINE_START) * pxPerHour }}
                          className="absolute left-0 right-0 h-px bg-red-500 z-20 pointer-events-none"
                        />
                      );
                    })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export default function AgendaTab({
  bookings,
  adHocJobs = [],
  availability,
  sitterId: _sitterId,
}: Props) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [currentDay, setCurrentDay] = useState<Date>(startOfDay(today));
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(
    mondayOf(today),
  );

  // Merge ad hoc jobs into bookings for the calendar view
  const allBookings = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adhocMapped = (adHocJobs as any[]).map((j) => ({
      ...j,
      isAdHoc: true,
      status: "completed",
      pets: ((j.pets as Array<{ petName?: string; name?: string }>) ?? []).map(
        (p) => ({ name: p.petName ?? p.name ?? "" }),
      ),
    })) as BookingLike[];
    return [...bookings, ...adhocMapped];
  }, [bookings, adHocJobs]);

  const activeBookings = useMemo(
    () =>
      allBookings.filter((b) => !["cancelled"].includes(b.status as string)),
    [allBookings],
  );

  const daySlots: TimeSlot[] = useMemo(() => {
    const iso = dateToIso(currentDay);
    return activeBookings.flatMap((b) => getSlotsForDate(b, iso));
  }, [activeBookings, currentDay]);

  const weekBookingCount = getWeekBookingCount(
    activeBookings,
    currentWeekMonday,
  );
  const nextBookingTime = getNextBookingTime(activeBookings);

  const currentDayAvailIndex = jsToMonIndex(currentDay.getDay());

  function prevDay() {
    setCurrentDay((d) => addDays(d, -1));
  }
  function nextDay() {
    setCurrentDay((d) => addDays(d, +1));
  }
  function prevWeek() {
    setCurrentWeekMonday((d) => addDays(d, -7));
  }
  function nextWeek() {
    setCurrentWeekMonday((d) => addDays(d, +7));
  }
  function goToday() {
    setCurrentDay(startOfDay(today));
    setCurrentWeekMonday(mondayOf(today));
  }

  const isCurrentWeek = isSameDay(currentWeekMonday, mondayOf(today));
  const isCurrentDay = isSameDay(currentDay, today);

  const dayLabel = currentDay.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const weekLabel = (() => {
    const sun = addDays(currentWeekMonday, 6);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${currentWeekMonday.toLocaleDateString("en-US", opts)} – ${sun.toLocaleDateString("en-US", opts)}, ${sun.getFullYear()}`;
  })();

  const isEmpty =
    viewMode === "day" ? daySlots.length === 0 : weekBookingCount === 0;

  return (
    <div
      className="space-y-4 max-w-full overflow-x-hidden"
      data-ocid="agenda.section"
    >
      {/* ── Summary strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 glass-panel rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <CalendarDays size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none mb-0.5">
              This Week
            </p>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              {weekBookingCount}{" "}
              <span className="hidden sm:inline">
                booking{weekBookingCount !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 glass-panel rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <DollarSign size={14} className="text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none mb-0.5">
              Earnings
            </p>
            <p className="text-[10px] sm:text-sm font-bold text-amber-800 dark:text-amber-400">
              Analytics tab
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 glass-panel rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
            <Clock size={14} className="text-emerald-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium leading-none mb-0.5">
              Next
            </p>
            <p className="text-[10px] sm:text-sm font-bold text-emerald-800 dark:text-emerald-400 truncate">
              {nextBookingTime ?? "None"}
            </p>
          </div>
        </div>
      </div>

      {/* ── View toggle + nav bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 frosted-nav rounded-2xl px-3 sm:px-4 py-3 shadow-sm border border-border/40">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View toggle */}
          <div className="flex gap-1 bg-muted rounded-full p-0.5 shrink-0">
            <button
              type="button"
              data-ocid="agenda.day_view.toggle"
              onClick={() => setViewMode("day")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[36px] min-w-[44px] ${
                viewMode === "day"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              data-ocid="agenda.week_view.toggle"
              onClick={() => setViewMode("week")}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-[36px] min-w-[44px] ${
                viewMode === "week"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Button
              size="icon"
              variant="ghost"
              data-ocid="agenda.nav.prev"
              onClick={viewMode === "day" ? prevDay : prevWeek}
              className="w-10 h-10 rounded-full shrink-0"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </Button>

            <p className="text-xs sm:text-sm font-semibold text-foreground flex-1 min-w-0 truncate text-center px-1">
              {viewMode === "day" ? dayLabel : weekLabel}
            </p>

            <Button
              size="icon"
              variant="ghost"
              data-ocid="agenda.nav.next"
              onClick={viewMode === "day" ? nextDay : nextWeek}
              className="w-10 h-10 rounded-full shrink-0"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </Button>
          </div>

          {/* Today button */}
          {(viewMode === "day" ? !isCurrentDay : !isCurrentWeek) && (
            <Button
              size="sm"
              variant="outline"
              data-ocid="agenda.today.button"
              onClick={goToday}
              className="rounded-full h-9 px-3 sm:px-4 text-xs font-semibold shrink-0"
            >
              Today
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 mt-2 pl-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary/80" />
            <span className="text-xs text-muted-foreground">Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400/80" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-500" />
            <span className="text-xs text-muted-foreground">Off-App</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-400/20 border border-emerald-400/50" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
        </div>
      </div>

      {/* ── Calendar content ────────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border/60 gloss-ring overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <PawPrint size={28} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                Your schedule is open
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Share your profile to get bookings! Confirmed and pending
                appointments will appear here.
              </p>
            </div>
          </div>
        ) : viewMode === "day" ? (
          <div
            className="p-3 sm:p-4 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 320px)", minHeight: 400 }}
          >
            <DayView
              date={currentDay}
              slots={daySlots}
              availDayIndex={currentDayAvailIndex}
              availability={availability}
            />
          </div>
        ) : (
          <div
            className="p-2 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 320px)", minHeight: 400 }}
          >
            <WeekView
              monday={currentWeekMonday}
              bookings={activeBookings}
              availability={availability}
              onDayClick={(d) => {
                setCurrentDay(d);
                setCurrentWeekMonday(mondayOf(d));
                setViewMode("day");
              }}
            />
          </div>
        )}
      </div>

      {availability.length === 0 && (
        <p className="text-xs text-muted-foreground text-center pb-1">
          No availability hours set yet. Go to the Availability tab to configure
          your schedule.
        </p>
      )}
    </div>
  );
}
