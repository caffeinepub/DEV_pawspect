import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Bird,
  CalendarDays,
  Car,
  Check,
  ClipboardList,
  Clock,
  Coffee,
  Copy,
  Droplets,
  FileCheck,
  Footprints,
  Ham,
  HandshakeIcon,
  Heart,
  Home,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Moon,
  PawPrint,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  APP_NAME,
  BOOKING_DEFAULTS,
  BUNDLE_DISCOUNT_MIN_SERVICES,
  BUNDLE_DISCOUNT_PERCENT,
  MEET_AND_GREET,
  zipToAreaName,
} from "../config/business";

/** Strip all non-digit characters, keep only digits */
function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}
import { toast } from "sonner";
import type { View } from "../App";
import type {
  AvailabilityEntry,
  DayServiceSchedule,
  Pet,
  Public,
  Public__8,
  RecurrencePattern,
  ServiceSlot,
} from "../backend.d";
import AddToCalendar from "../components/AddToCalendar";
import LegalModal from "../components/LegalModal";
import { parseBadges } from "../components/SitterCard";
import StatusBadge from "../components/StatusBadge";
import { useActorReady } from "../hooks/useBackend";
import { useBookingDraft } from "../hooks/useBookingDraft";
import {
  useActiveSitters,
  useAvailableHourlyWindows,
  useBookingsByEmail,
  useBookingsByPhone,
  useCheckSittersAvailabilityForRebook,
  useCreateBooking,
  useCreateRecurringBookingGroup,
  useSendBookingConfirmation,
  useSitterExtendedPublic,
  useSitterProfile,
  useValidateRecurringAvailability,
} from "../hooks/useQueries";
import { dateToIso, generateOccurrenceDates } from "../lib/bookingUtils";
import type { CredentialChecklist } from "../types/sitter-v2";
import { CREDENTIAL_ITEMS } from "../types/sitter-v2";

// Legal versioning — increment when Terms or Privacy Policy are updated
import { TERMS_VERSION } from "./TermsPage";

const CREDENTIAL_ICON_MAP: Record<string, React.ElementType> = {
  FileCheck,
  ShieldCheck,
  UserCheck,
  Users,
  ClipboardList,
  Award,
  BadgeCheck,
};

export interface PrebookState {
  prebookServices?: string[];
  prebookSitterId?: bigint;
  /** All sitter IDs in the original bundle (used for multi-sitter rebooks) */
  prebookSitterIds?: bigint[];
  prebookTimeWindow?: { startTime: string; endTime: string };
  prebookDate?: string;
  /** Pre-selected time in HH:MM format (used by "Book This Time" email deep links) */
  prebookTime?: string;
  /** True when this booking was initiated from a "Book Again" / rebook flow */
  isRebook?: boolean;
  /** Pets from the original booking — pre-fills Step 2 on rebook */
  prebookPets?: Pet[];
  /** Contact info from the original booking — pre-fills Step 3 on rebook */
  prebookClientName?: string;
  prebookClientEmail?: string;
  prebookClientPhone?: string;
  /** Full sitter object passed from FindSittersPage to avoid cold-start blank screen */
  prebookSitter?: Public;
}

interface Props {
  sitterId: bigint;
  navigate: (view: View, sitterId?: bigint) => void;
  prebookState?: PrebookState | null;
  /** Contact info carried from BookingLookupPage — fires returning-client detection on mount */
  initialClientEmail?: string;
  initialClientPhone?: string;
  /** When true, skip the sitter grid (Step 1) and pre-select this sitter from the storefront */
  preselectMode?: boolean;
}

const ALL_SERVICES: Array<{ name: string; Icon: React.ElementType }> = [
  { name: "Dog Walking", Icon: Footprints },
  { name: "Boarding", Icon: Home },
  { name: "Overnight Stay", Icon: Moon },
  { name: "Drop-In Visit", Icon: Home },
  { name: "Pet Feeding", Icon: UtensilsCrossed },
  { name: "Playtime & Hang Out", Icon: Sparkles },
  { name: "Cat Sitting", Icon: PawPrint },
  { name: "Pet Sitting", Icon: PawPrint },
  { name: "Small Pet Care", Icon: Ham },
  { name: "Bird Care", Icon: Bird },
  { name: "Dog Bath", Icon: Droplets },
];

const PET_TYPES = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Fish",
  "Small Animal",
  "Other",
];

// New step order: When & What → Pick a Sitter → Pets → Contact → Review
const STEPS = ["When & What", "Pick a Sitter", "Pets", "Contact", "Review"];

// Generate time options using config-driven operating hours and increment
function generateTimeOptions(): Array<{ value: string; label: string }> {
  const opts: Array<{ value: string; label: string }> = [];
  const start: number = BOOKING_DEFAULTS.operatingHoursStart;
  const end: number = BOOKING_DEFAULTS.operatingHoursEnd;
  const inc: number = BOOKING_DEFAULTS.timeSlotIncrementMinutes;
  for (let h = start; h <= end; h++) {
    for (let m = 0; m < 60; m += inc) {
      if (h === end && m > 0) break;
      const hh = h.toString().padStart(2, "0");
      const mm = m.toString().padStart(2, "0");
      const value = `${hh}:${mm}`;
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const label = `${displayH}:${mm} ${ampm}`;
      opts.push({ value, label });
    }
  }
  return opts;
}
const TIME_OPTIONS = generateTimeOptions();

/** Format minutes-since-midnight as "9:00 AM" */
function minutesToAmPm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  ocid,
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  ocid?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const displayLabel = value
    ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : placeholder;

  return (
    <div className="relative w-full group">
      <div
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 transition-all cursor-pointer min-h-[48px]",
          value
            ? "border-primary/40 bg-primary/5 text-foreground"
            : "border-input bg-background text-muted-foreground",
          "hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20",
        )}
      >
        <CalendarDays
          size={16}
          className={
            value ? "text-primary shrink-0" : "text-muted-foreground shrink-0"
          }
        />
        <span
          className={cn(
            "text-sm font-medium leading-tight truncate",
            !value && "text-muted-foreground",
          )}
        >
          {displayLabel}
        </span>
      </div>
      <input
        data-ocid={ocid}
        type="date"
        value={value}
        min={today}
        onChange={(e) => {
          const val = e.target.value;
          if (val && disabled) {
            const d = new Date(`${val}T12:00:00`);
            if (disabled(d)) return;
          }
          onChange(val);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ fontSize: "16px" }}
        aria-label={placeholder}
      />
    </div>
  );
}

function getDaysRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getDayOfWeek(dateStr: string): number {
  // Convert JS Date.getDay() (0=Sun, 1=Mon, ..., 6=Sat)
  // to backend's Tomohiko Sakamoto convention (0=Mon, 1=Tue, ..., 5=Sat, 6=Sun)
  // Conversion: (jsDay + 6) % 7
  const jsDay = new Date(`${dateStr}T12:00:00`).getDay();
  return (jsDay + 6) % 7;
}

function getSitterAvailForDate(
  sitterId: bigint,
  dateStr: string,
  availabilityBySitter: Record<string, AvailabilityEntry[]>,
): AvailabilityEntry | null {
  const entries = availabilityBySitter[sitterId?.toString() ?? ""] ?? [];
  const dow = getDayOfWeek(dateStr);
  return entries.find((e) => Number(e.dayOfWeek) === dow) ?? null;
}

function validateSlotTime(
  slot: ServiceSlot,
  dateStr: string,
  availabilityBySitter: Record<string, AvailabilityEntry[]>,
): string | null {
  if (slot.sitterId == null) return null;
  const avail = getSitterAvailForDate(
    slot.sitterId,
    dateStr,
    availabilityBySitter,
  );
  if (!avail) return null;
  const slotStart = timeStringToMinutes(slot.startTime);
  const slotEnd = timeStringToMinutes(slot.endTime);
  const availStart = Number(avail.startTime);
  const availEnd = Number(avail.endTime);
  if (slotStart < availStart || slotEnd > availEnd) {
    return `Available ${minutesToAmPm(availStart)}–${minutesToAmPm(availEnd)}`;
  }
  return null;
}

function getSlotCost(slot: ServiceSlot): number {
  const hours = Number(slot.durationMinutes) / 60;
  return hours * Number(slot.ratePerHour);
}

function calcDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + (sm || 0)));
}

interface DaySchedulerProps {
  startDate: string;
  endDate: string;
  selectedServices: string[];
  selectedSitterIds: bigint[];
  allSitters: Public[];
  sitter: Public;
  serviceSchedule: DayServiceSchedule[];
  onScheduleChange: (schedule: DayServiceSchedule[]) => void;
  availabilityBySitter: Record<string, AvailabilityEntry[]>;
  presetStartTime?: string;
  presetEndTime?: string;
}

function DayServiceScheduler({
  startDate,
  endDate,
  selectedServices,
  selectedSitterIds,
  allSitters,
  sitter,
  serviceSchedule,
  onScheduleChange,
  availabilityBySitter,
  presetStartTime,
  presetEndTime,
}: DaySchedulerProps) {
  const days = getDaysRange(startDate, endDate);

  const getOrCreateDay = useCallback(
    (date: string): DayServiceSchedule => {
      return (
        serviceSchedule.find((d) => d.date === date) ?? { date, slots: [] }
      );
    },
    [serviceSchedule],
  );

  const updateDay = useCallback(
    (date: string, slots: ServiceSlot[]) => {
      const existing = serviceSchedule.find((d) => d.date === date);
      if (existing) {
        onScheduleChange(
          serviceSchedule.map((d) => (d.date === date ? { ...d, slots } : d)),
        );
      } else {
        onScheduleChange([...serviceSchedule, { date, slots }]);
      }
    },
    [serviceSchedule, onScheduleChange],
  );

  const addSlot = useCallback(
    (date: string) => {
      const day = getOrCreateDay(date);
      const firstSitter =
        allSitters.find((s) => selectedSitterIds.includes(s.id)) ?? sitter;
      const firstService =
        selectedServices[0] ?? (sitter.services ?? [])[0] ?? "Dog Walking";
      const rateObj = firstSitter.serviceRates?.find(
        (r) => r.service === firstService,
      );
      if (!firstSitter) return;
      const ratePerHour = rateObj
        ? rateObj.ratePerHour
        : (firstSitter?.hourlyRate ?? BigInt(1500));

      let defaultStart = presetStartTime ?? "09:00";
      let defaultEnd = presetEndTime ?? "10:00";
      if (!presetStartTime) {
        const avail = getSitterAvailForDate(
          firstSitter.id,
          date,
          availabilityBySitter,
        );
        if (avail) {
          const startH = Math.floor(Number(avail.startTime) / 60);
          const startM = Number(avail.startTime) % 60;
          const endH = Math.min(
            startH + 1,
            Math.floor(Number(avail.endTime) / 60),
          );
          const endM = Number(avail.endTime) % 60;
          defaultStart = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
          defaultEnd = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
        }
      }

      const dur = calcDurationMinutes(defaultStart, defaultEnd);
      const newSlot: ServiceSlot = {
        service: firstService,
        sitterId: firstSitter.id,
        startTime: defaultStart,
        endTime: defaultEnd,
        durationMinutes: BigInt(Math.max(dur, 0)),
        ratePerHour,
      };
      updateDay(date, [...day.slots, newSlot]);
    },
    [
      allSitters,
      selectedSitterIds,
      sitter,
      selectedServices,
      presetStartTime,
      presetEndTime,
      availabilityBySitter,
      updateDay,
      getOrCreateDay,
    ],
  );

  const updateSlot = useCallback(
    (date: string, slotIdx: number, updates: Partial<ServiceSlot>) => {
      const day = getOrCreateDay(date);
      const updatedSlots = day.slots.map((s, i) => {
        if (i !== slotIdx) return s;
        const merged = { ...s, ...updates };
        const dur = calcDurationMinutes(merged.startTime, merged.endTime);
        const targetSitter =
          allSitters.find((as) => as.id === merged.sitterId) ?? sitter;
        if (!targetSitter) return s;
        const rateObj = targetSitter.serviceRates?.find(
          (r) => r.service === merged.service,
        );
        const ratePerHour = rateObj
          ? rateObj.ratePerHour
          : targetSitter.hourlyRate;
        return { ...merged, durationMinutes: BigInt(dur), ratePerHour };
      });
      updateDay(date, updatedSlots);
    },
    [allSitters, sitter, updateDay, getOrCreateDay],
  );

  const removeSlot = useCallback(
    (date: string, slotIdx: number) => {
      const day = getOrCreateDay(date);
      updateDay(
        date,
        day.slots.filter((_, i) => i !== slotIdx),
      );
    },
    [updateDay, getOrCreateDay],
  );

  // Stable slot-change handlers to prevent React error #185 (infinite render loop)
  const handleServiceChange = useCallback(
    (date: string, slotIdx: number, v: string) =>
      updateSlot(date, slotIdx, { service: v }),
    [updateSlot],
  );
  const handleSitterChange = useCallback(
    (date: string, slotIdx: number, v: string) =>
      updateSlot(date, slotIdx, { sitterId: BigInt(v) }),
    [updateSlot],
  );
  const handleStartTimeChange = useCallback(
    (date: string, slotIdx: number, v: string) =>
      updateSlot(date, slotIdx, { startTime: v }),
    [updateSlot],
  );
  const handleEndTimeChange = useCallback(
    (date: string, slotIdx: number, v: string) =>
      updateSlot(date, slotIdx, { endTime: v }),
    [updateSlot],
  );
  const handleRemoveSlot = useCallback(
    (date: string, slotIdx: number) => removeSlot(date, slotIdx),
    [removeSlot],
  );

  if (!sitter) return null;

  const allSlots = serviceSchedule.flatMap((d) =>
    d.slots.map((s) => ({ ...s, date: d.date })),
  );
  const subtotal = allSlots.reduce((sum, s) => sum + getSlotCost(s), 0);
  const bundleDiscount =
    allSlots.length >= BUNDLE_DISCOUNT_MIN_SERVICES
      ? subtotal * (BUNDLE_DISCOUNT_PERCENT / 100)
      : 0;
  const grandTotal = subtotal - bundleDiscount;

  const servicesToShow =
    selectedServices.length > 0 ? selectedServices : (sitter.services ?? []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {days.map((date) => {
          const day = getOrCreateDay(date);
          const d = new Date(`${date}T12:00:00`);
          const label = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          return (
            <div
              key={date}
              className="border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{label}</p>
                  {(() => {
                    const anyAvailable = selectedSitterIds.some(
                      (id) =>
                        getSitterAvailForDate(
                          id,
                          date,
                          availabilityBySitter,
                        ) !== null,
                    );
                    const hasAnyAvailData = Object.values(
                      availabilityBySitter,
                    ).some((arr) => arr.length > 0);
                    if (!anyAvailable && hasAnyAvailData) {
                      return (
                        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle size={10} /> Not available
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => addSlot(date)}
                  className="flex items-center gap-1 text-xs text-primary hover:opacity-80 font-medium min-h-[36px] px-2"
                >
                  <Plus size={13} /> Add Service
                </button>
              </div>
              {day.slots.length === 0 ? (
                <p className="text-xs text-muted-foreground px-4 py-3">
                  No services — click Add Service
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {day.slots.map((slot, slotIdx) => {
                    const slotError =
                      slot.sitterId != null
                        ? validateSlotTime(slot, date, availabilityBySitter)
                        : null;
                    return (
                      <div
                        key={`${slot.service}-${String(slot.sitterId ?? "")}-${slotIdx}`}
                        className="px-3 py-3 space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Select
                            value={slot.service}
                            onValueChange={(v) =>
                              handleServiceChange(date, slotIdx, v)
                            }
                          >
                            <SelectTrigger className="rounded-lg h-10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {servicesToShow.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={
                              slot.sitterId != null
                                ? slot.sitterId.toString()
                                : ""
                            }
                            onValueChange={(v) =>
                              handleSitterChange(date, slotIdx, v)
                            }
                          >
                            <SelectTrigger className="rounded-lg h-10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allSitters
                                .filter((s) => selectedSitterIds.includes(s.id))
                                .map((s) => (
                                  <SelectItem
                                    key={s.id.toString()}
                                    value={s.id.toString()}
                                  >
                                    {s.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-muted/40 rounded-lg px-3 py-2 border border-border">
                            <Clock
                              size={13}
                              className="text-muted-foreground shrink-0"
                            />
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
                                  From
                                </span>
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    handleStartTimeChange(
                                      date,
                                      slotIdx,
                                      e.target.value,
                                    )
                                  }
                                  className="bg-transparent border-none p-0 text-sm font-semibold text-foreground focus:outline-none w-full"
                                  style={{ fontSize: "14px" }}
                                />
                              </div>
                              <ArrowRight
                                size={12}
                                className="text-muted-foreground shrink-0"
                              />
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
                                  To
                                </span>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    handleEndTimeChange(
                                      date,
                                      slotIdx,
                                      e.target.value,
                                    )
                                  }
                                  className="bg-transparent border-none p-0 text-sm font-semibold text-foreground focus:outline-none w-full"
                                  style={{ fontSize: "14px" }}
                                />
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-primary shrink-0 min-w-[60px] text-right">
                            ${getSlotCost(slot).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(date, slotIdx)}
                            className="text-destructive hover:bg-destructive/10 rounded-full p-1.5 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                            aria-label="Remove service"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        {slotError && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>
                              ⚠{" "}
                              {allSitters.find((s) => s.id === slot.sitterId)
                                ?.name ?? "This sitter"}{" "}
                              may not be available at this time — {slotError}.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allSlots.length > 0 && (
        <div className="bg-indigo-950 text-white rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
            Your Order
          </p>
          <div className="space-y-2">
            {allSlots.map((slot, i) => {
              const cost = getSlotCost(slot);
              const sitterName =
                allSitters.find((s) => s.id === slot.sitterId)?.name ??
                "Sitter";
              const d = new Date(`${slot.date}T12:00:00`);
              const dayLabel = d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={`${slot.service}-${slot.date}-${i}`}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight truncate">
                      {slot.service}
                    </p>
                    <p className="text-indigo-300 text-xs">
                      {dayLabel} · {slot.startTime}–{slot.endTime} ·{" "}
                      {sitterName}
                    </p>
                  </div>
                  <span className="font-semibold shrink-0">
                    ${cost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-indigo-800 pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-300">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {bundleDiscount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Bundle discount ({BUNDLE_DISCOUNT_PERCENT}%)</span>
                <span>-${bundleDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-indigo-800">
              <span>Total</span>
              <span className="text-amber-400">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          {allSlots.length >= BUNDLE_DISCOUNT_MIN_SERVICES && (
            <p className="text-xs text-emerald-400 text-center flex items-center justify-center gap-1">
              <Sparkles size={12} /> Bundle discount applied!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface PetFormState {
  _id: number;
  petName: string;
  petType: string;
  breed: string;
  petNotes: string;
}

/** Sitter card for the sitter grid (Step 1) — single column on mobile */
function AvailableSitterCard({
  sitter,
  availabilityEntries,
  isSelected,
  isAvailable,
  unavailableReason,
  onSelect,
  justSelected,
  selectedServices,
  credentialChecklist,
}: {
  sitter: Public;
  availabilityEntries: AvailabilityEntry[];
  isSelected: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
  onSelect: () => void;
  justSelected?: boolean;
  selectedServices: string[];
  credentialChecklist?: CredentialChecklist;
}) {
  const { badges } = parseBadges(sitter.bio ?? "");
  void availabilityEntries; // availability check is done at parent level

  return (
    <div className="relative w-full">
      <button
        type="button"
        data-ocid={`sitter_grid.item.${sitter.id}`}
        {...(isAvailable ? { onClick: onSelect } : {})}
        className={cn(
          "relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200",
          isAvailable
            ? isSelected
              ? "border-primary gloss-ring-elevated bg-primary/5"
              : "border-border/60 gloss-ring bg-card hover:border-primary/50 hover:shadow-lg"
            : "border-border/30 bg-card/60 cursor-not-allowed pointer-events-none",
        )}
      >
        {/* Photo full-width crop */}
        <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
          {sitter.photoUrl ? (
            <img
              src={sitter.photoUrl}
              alt={sitter.name}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all",
                !isAvailable && "grayscale-[40%]",
              )}
            />
          ) : (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                isAvailable
                  ? "bg-gradient-to-br from-primary via-violet-700 to-indigo-900"
                  : "bg-gradient-to-br from-muted-foreground/40 via-muted-foreground/20 to-muted-foreground/30",
              )}
            >
              <span className="text-5xl font-bold text-white/30 font-display">
                {sitter.name[0]}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Unavailable glass overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 glass-unavailable flex flex-col items-center justify-center gap-2">
              <div
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl"
                style={{
                  background: "oklch(0 0 0 / 0.35)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <Lock size={18} className="text-white/80" />
                <p className="text-white font-semibold text-xs text-center leading-tight">
                  {unavailableReason ?? "Not available"}
                </p>
                <p className="text-white/65 text-[10px] text-center leading-tight">
                  {unavailableReason ? "" : "Try a different time"}
                </p>
              </div>
            </div>
          )}

          {isSelected && isAvailable && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Check size={16} className="text-primary-foreground" />
            </div>
          )}

          {/* Available badge */}
          {isAvailable && (
            <div className="absolute top-3 left-3 glass-badge flex items-center gap-1 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-[10px] font-semibold">
                Available
              </span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p
              className={cn(
                "font-display font-bold text-base leading-tight drop-shadow",
                isAvailable ? "text-white" : "text-white/60",
              )}
            >
              {sitter.name}
            </p>
            {sitter.location && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs mt-0.5",
                  isAvailable ? "text-white/75" : "text-white/45",
                )}
              >
                <MapPin size={11} />
                <span>{zipToAreaName(sitter.location)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          {/* Rating + rate */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i <= Math.round(Number(sitter.rating))
                        ? isAvailable
                          ? "fill-accent text-accent"
                          : "fill-muted-foreground/30 text-muted-foreground/30"
                        : "text-muted-foreground/30"
                    }
                  />
                ))}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  !isAvailable && "text-muted-foreground/60",
                )}
              >
                {Number(sitter.rating) > 0
                  ? Number(sitter.rating).toFixed(1)
                  : "New"}
              </span>
              {Number(sitter.reviewCount) > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  ({Number(sitter.reviewCount)})
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-bold shrink-0",
                isAvailable ? "text-primary" : "text-muted-foreground/50",
              )}
            >
              ${Number(sitter.hourlyRate)}/hr
            </span>
          </div>

          {/* Availability status — clean badge replacing raw text dump */}
          {isAvailable ? (
            <div className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <Check
                size={11}
                className="text-emerald-600 dark:text-emerald-400 shrink-0"
              />
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold leading-tight">
                Available for your booking window
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 bg-muted/20">
              <Clock size={11} className="text-muted-foreground/40 shrink-0" />
              <span className="text-muted-foreground/50 leading-tight">
                Not available for this time window
              </span>
            </div>
          )}

          {/* Per-service rates for selected services */}
          {isAvailable && selectedServices.length > 0 && (
            <div className="space-y-0.5">
              {selectedServices.slice(0, 2).map((svcName) => {
                const rateObj = sitter.serviceRates?.find(
                  (r) => r.service === svcName,
                );
                const rate = rateObj
                  ? Number(rateObj.ratePerHour)
                  : Number(sitter.hourlyRate);
                return (
                  <div
                    key={svcName}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-muted-foreground truncate">
                      {svcName}
                    </span>
                    <span className="font-semibold text-primary shrink-0 ml-2">
                      ${rate}/hr
                    </span>
                  </div>
                );
              })}
              {selectedServices.length > 2 && (
                <p className="text-[10px] text-muted-foreground">
                  +{selectedServices.length - 2} more services
                </p>
              )}
            </div>
          )}

          {/* Badges — only show when available */}
          {isAvailable && badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {badges.slice(0, 2).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                >
                  <ShieldCheck size={9} />
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Credential pills — amber/gold, shown when available */}
          {isAvailable &&
            credentialChecklist &&
            (() => {
              const checked = CREDENTIAL_ITEMS.filter(
                (item) => credentialChecklist[item.key] === true,
              );
              if (checked.length === 0) return null;
              const visible = checked.slice(0, 3);
              const extra = checked.length - visible.length;
              return (
                <div className="flex flex-wrap gap-1">
                  {visible.map((item) => {
                    const Icon = CREDENTIAL_ICON_MAP[item.icon] ?? ShieldCheck;
                    return (
                      <span
                        key={item.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      >
                        <Icon size={10} />
                        {item.shortLabel}
                      </span>
                    );
                  })}
                  {extra > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      +{extra}
                    </span>
                  )}
                </div>
              );
            })()}

          {/* Services */}
          <div className="flex flex-wrap gap-1">
            {(sitter.services ?? []).slice(0, 3).map((svc) => (
              <span
                key={svc}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                  isAvailable
                    ? "bg-secondary text-secondary-foreground border-border"
                    : "bg-muted/30 text-muted-foreground/50 border-border/30",
                )}
              >
                {svc}
              </span>
            ))}
            {(sitter.services ?? []).length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                +{(sitter.services ?? []).length - 3}
              </span>
            )}
          </div>

          {/* Select CTA for available sitters */}
          {isAvailable && (
            <div
              className={cn(
                "w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all mt-1",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {isSelected ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check size={14} /> Selected
                </span>
              ) : (
                "Select Sitter"
              )}
            </div>
          )}
        </div>
      </button>

      {/* "Great choice!" micro-toast shown briefly after selection */}
      {justSelected && isSelected && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce pointer-events-none">
          <PawPrint size={12} /> Great choice!
        </div>
      )}
    </div>
  );
}

/** Compact sticky cart bar for mobile, shown above the bottom nav */
function MobileCartBar({
  allSlots,
  grandTotal,
  bundleDiscount,
}: {
  allSlots: Array<ServiceSlot & { date: string }>;
  grandTotal: number;
  bundleDiscount: number;
}) {
  if (allSlots.length === 0) return null;
  return (
    <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-30 px-4 pb-2 pointer-events-none">
      <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between pointer-events-auto shadow-xl border border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint size={14} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none">
              {allSlots.length} {allSlots.length === 1 ? "service" : "services"}
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              ${grandTotal.toFixed(2)}
            </p>
          </div>
        </div>
        {bundleDiscount > 0 && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
            {BUNDLE_DISCOUNT_PERCENT}% bundle
          </span>
        )}
      </div>
    </div>
  );
}

class BookingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: Error): {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
  } {
    return { hasError: true, error, errorInfo: null };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("BOOKING CRASH:", error.message, error.stack);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            background: "#fff",
            color: "#000",
            fontFamily: "monospace",
            minHeight: "200px",
          }}
        >
          <h2 style={{ color: "#cc0000", marginBottom: "12px" }}>
            Booking Error
          </h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "11px",
              background: "#f5f5f5",
              padding: "10px",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "300px",
            }}
          >
            {this.state.error?.message || "Unknown error"}
            {"\n\n--- Component Stack ---\n"}
            {this.state.errorInfo?.componentStack || ""}
          </pre>
          <button
            type="button"
            onClick={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SitterDetailPage({
  sitterId,
  navigate,
  prebookState,
  initialClientEmail,
  initialClientPhone,
  preselectMode = false,
}: Props) {
  const { actor, isReady } = useActorReady();
  const { setAgreementFlag } = useBookingDraft();
  const { data: sitter, isLoading } = useSitterProfile(sitterId);
  const { data: allSitters = [] } = useActiveSitters();
  const allActiveSitters: Public[] = (allSitters as Public[]).filter(
    (s) => s.isActive,
  );
  const createBooking = useCreateBooking();
  const createRecurringGroup = useCreateRecurringBookingGroup();
  const sendConfirmation = useSendBookingConfirmation();

  // ── Credentials for the primary sitter (selected/pre-selected) ────────────
  const { data: primarySitterExtended } = useSitterExtendedPublic(
    sitterId ? Number(sitterId) : null,
  );
  const primaryCredentials = primarySitterExtended?.credentialChecklist;

  // Step state: 0=When&What, 1=PickSitter, 2=Pets, 3=Contact, 4=Review, 5=Success
  // When arriving from the new FindSittersPage sitter-selection flow, all
  // criteria (date, time, service, sitters) are already chosen — start at
  // Pets (step 2) to avoid forcing the user to re-select what they already picked.
  const isFromNewSitterSelectionFlow =
    !!prebookState?.prebookDate &&
    (prebookState?.prebookSitterIds?.length ?? 0) > 0;
  const [step, setStep] = useState(() =>
    isFromNewSitterSelectionFlow ? 2 : 0,
  );
  const [confirmedBooking, setConfirmedBooking] = useState<Public__8 | null>(
    null,
  );
  const [justSelectedSitterId, setJustSelectedSitterId] = useState<
    bigint | null
  >(null);

  // ── Meet & Greet mode ──────────────────────────────────────────────────────
  // When true, the booking is a free 30-min compatibility check (first visit).
  // Services and cost are replaced by "Meet & Greet" and zero rate.
  const [isMeetAndGreet, setIsMeetAndGreet] = useState(false);

  // ── Step 0: When & What ───────────────────────────────────────────────────
  const [windowDate, setWindowDate] = useState(prebookState?.prebookDate ?? "");
  const [windowStartTime, setWindowStartTime] = useState(
    prebookState?.prebookTimeWindow?.startTime ?? "09:00",
  );
  const [windowEndTime, setWindowEndTime] = useState(
    prebookState?.prebookTimeWindow?.endTime ?? "17:00",
  );
  // Multi-select services (was single-select)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    prebookState?.prebookServices ?? [],
  );
  const [windowSearched, setWindowSearched] = useState(false);
  void windowSearched;

  // ── Hourly slot grid: only active when a date is selected in step 0 ────────
  const { slots: hourlySlots, isLoading: hourlyLoading } =
    useAvailableHourlyWindows(step === 0 && windowDate ? windowDate : null);

  // ── Rebook mode ──────────────────────────────────────────────────────────
  // True when we arrived here via "Book Again" — availability is checked ONLY
  // when the user taps "Find Available Sitters" after choosing a NEW date.
  const [isRebookMode, setIsRebookMode] = useState(!!prebookState?.isRebook);
  // Sitter IDs from the original booking, used for the targeted availability check
  const [rebookOriginalSitterIds, setRebookOriginalSitterIds] = useState<
    bigint[]
  >(prebookState?.prebookSitterIds ?? []);
  // Availability check fire state: only set when user taps "Find Available Sitters"
  const [rebookCheckIds, setRebookCheckIds] = useState<bigint[]>([]);
  const [rebookCheckDates, setRebookCheckDates] = useState<string[]>([]);
  const [rebookCheckServices, setRebookCheckServices] = useState<string[]>([]);
  // Modal shown when original sitter isn't available on chosen date
  const [rebookUnavailableModal, setRebookUnavailableModal] = useState<{
    sitterNames: string[];
  } | null>(null);
  // Tracks whether we're waiting for the availability check to complete
  const [rebookChecking, setRebookChecking] = useState(false);

  // ── Step 1: Pick a Sitter ─────────────────────────────────────────────────
  const [selectedSitterIds, setSelectedSitterIds] = useState<bigint[]>(() => {
    // In rebook mode: start with an empty selection so the sitter is NOT
    // shown as selected until availability is confirmed for the chosen date.
    // rebookOriginalSitterIds holds the prior IDs as a "suggestion" only.
    if (prebookState?.isRebook) {
      return [];
    }
    // Support multi-sitter rebook bundles (non-rebook prebook flows)
    if (
      prebookState?.prebookSitterIds &&
      prebookState.prebookSitterIds.length > 0
    ) {
      return prebookState.prebookSitterIds;
    }
    return [sitterId];
  });

  // When the user changes the date in rebook mode, clear sitter selection so
  // the previously-booked sitter is NOT shown as selected until availability
  // is re-confirmed for the new date.
  const prevWindowDateRef = useRef(windowDate);
  useEffect(() => {
    if (!isRebookMode) return;
    if (windowDate === prevWindowDateRef.current) return;
    prevWindowDateRef.current = windowDate;
    // Date changed in rebook mode → deselect all sitters; availability must be
    // re-checked by clicking "Find Available Sitters"
    setSelectedSitterIds([]);
  }, [windowDate, isRebookMode]);

  // selectedServices is declared above in Step 0 state (multi-select from service grid)

  const sitterAvailabilityResults = useQueries({
    queries: selectedSitterIds.map((id) => ({
      queryKey: ["sitter-availability", id.toString()],
      queryFn: async () => {
        if (!actor) return [] as AvailabilityEntry[];
        return actor.getSitterAvailability(id) as Promise<AvailabilityEntry[]>;
      },
      enabled: !!actor && isReady,
    })),
  });
  const availabilityBySitter: Record<string, AvailabilityEntry[]> = {};
  selectedSitterIds.forEach((id, idx) => {
    availabilityBySitter[id.toString()] = (sitterAvailabilityResults[idx]
      ?.data ?? []) as AvailabilityEntry[];
  });

  // When arriving from the new sitter-selection flow (step starts at 2),
  // eagerly seed the service schedule so step 2 never renders with an empty schedule.
  const [serviceSchedule, setServiceSchedule] = useState<DayServiceSchedule[]>(
    () => {
      if (
        isFromNewSitterSelectionFlow &&
        prebookState?.prebookDate &&
        prebookState?.prebookServices &&
        prebookState.prebookServices.length > 0 &&
        prebookState?.prebookSitterIds &&
        prebookState.prebookSitterIds.length > 0 &&
        prebookState?.prebookTimeWindow
      ) {
        const { startTime: st, endTime: et } = prebookState.prebookTimeWindow;
        const [startH, startM] = st.split(":").map(Number);
        const [endH, endM] = et.split(":").map(Number);
        const durationMins = BigInt(
          Math.max(0, endH * 60 + endM - (startH * 60 + startM)),
        );
        // We seed with a placeholder rate of 0n — it will be overwritten once
        // allActiveSitters loads. The key thing is the schedule is non-empty so
        // the component never shows a blank screen on first render.
        const slots = prebookState.prebookSitterIds.flatMap((sid) =>
          (prebookState.prebookServices ?? []).map((service) => ({
            service,
            startTime: st,
            endTime: et,
            sitterId: sid,
            durationMinutes: durationMins,
            ratePerHour: 0n,
          })),
        );
        return [{ date: prebookState.prebookDate, slots }];
      }
      return [];
    },
  );
  // When arriving from the new sitter-selection flow, pre-seed start/end
  // from the prebook state so the Pets step and submit handler have correct dates.
  const [startDate, setStartDate] = useState(
    isFromNewSitterSelectionFlow ? (prebookState?.prebookDate ?? "") : "",
  );
  const [startTime, setStartTime] = useState(
    isFromNewSitterSelectionFlow
      ? (prebookState?.prebookTimeWindow?.startTime ?? "09:00")
      : "09:00",
  );
  const [endDate, setEndDate] = useState(
    isFromNewSitterSelectionFlow ? (prebookState?.prebookDate ?? "") : "",
  );
  const [endTime, setEndTime] = useState(
    isFromNewSitterSelectionFlow
      ? (prebookState?.prebookTimeWindow?.endTime ?? "17:00")
      : "17:00",
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<
    "weekly" | "biweekly" | "monthly"
  >("weekly");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  // Recurring: days of week (0=Sun, 1=Mon, ..., 6=Sat)
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(
    [],
  );
  // Recurring end condition: "count" or "date"
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<"count" | "date">(
    "count",
  );
  const [recurrenceOccurrenceCount, setRecurrenceOccurrenceCount] = useState(4);
  // Derived expanded dates (generated client-side from pattern + days + end condition)
  const [recurringOccurrenceDates, setRecurringOccurrenceDates] = useState<
    string[]
  >([]);
  // Whether the occurrence list is collapsed
  const [recurringListCollapsed, setRecurringListCollapsed] = useState(false);

  // ── Auto-seed daysOfWeek from the selected booking date ────────────────────
  // When the user picks a date and turns recurring ON, pre-select that day.
  useEffect(() => {
    if (!isRecurring || !windowDate) return;
    const jsDay = new Date(`${windowDate}T12:00:00`).getDay();
    setRecurrenceDaysOfWeek((prev) => (prev.length === 0 ? [jsDay] : prev));
  }, [isRecurring, windowDate]);

  // ── Re-generate occurrence dates whenever recurring config changes ──────────
  useEffect(() => {
    if (!isRecurring || !windowDate) {
      setRecurringOccurrenceDates([]);
      return;
    }
    if (recurrencePattern !== "monthly" && recurrenceDaysOfWeek.length === 0) {
      setRecurringOccurrenceDates([]);
      return;
    }
    const start = new Date(`${windowDate}T12:00:00`);
    const endDateObj =
      recurrenceEndMode === "date" && recurrenceEndDate
        ? new Date(`${recurrenceEndDate}T12:00:00`)
        : null;
    const occCount =
      recurrenceEndMode === "count" ? recurrenceOccurrenceCount : null;
    const dates = generateOccurrenceDates(
      recurrencePattern,
      recurrenceDaysOfWeek,
      start,
      endDateObj,
      occCount,
    );
    setRecurringOccurrenceDates(dates.map(dateToIso));
  }, [
    isRecurring,
    windowDate,
    recurrencePattern,
    recurrenceDaysOfWeek,
    recurrenceEndMode,
    recurrenceEndDate,
    recurrenceOccurrenceCount,
  ]);

  // ── Validate recurring availability for the selected sitter ────────────────
  const primaryRecurringSitterId =
    isRecurring && selectedSitterIds.length > 0 ? selectedSitterIds[0] : null;
  const {
    data: recurringAvailabilityData = [],
    isFetching: recurringAvailFetching,
  } = useValidateRecurringAvailability({
    sitterId: primaryRecurringSitterId ?? null,
    occurrenceDates: recurringOccurrenceDates,
    startTime: windowStartTime,
    endTime: windowEndTime,
    serviceIds: selectedServices,
    clientZip: sitter?.location ?? "",
    enabled:
      isRecurring &&
      recurringOccurrenceDates.length > 0 &&
      !!primaryRecurringSitterId,
  });

  // Map availability results by ISO date for quick lookup
  const recurringAvailByDate: Record<
    string,
    { available: boolean; reason: string }
  > = {};
  for (const r of recurringAvailabilityData) {
    const isoDate = new Date(Number(r.date / 1_000_000n))
      .toISOString()
      .split("T")[0];
    recurringAvailByDate[isoDate] = {
      available: r.available,
      reason: r.conflictReason.length > 0 ? (r.conflictReason[0] ?? "") : "",
    };
  }
  const recurringAvailableCount = recurringOccurrenceDates.filter(
    (d) => recurringAvailByDate[d]?.available !== false,
  ).length;
  const recurringConflictCount =
    recurringOccurrenceDates.length - recurringAvailableCount;
  const hasRecurringConflicts =
    recurringConflictCount > 0 && recurringAvailabilityData.length > 0;
  const [serviceLocation, setServiceLocation] = useState<"onsite" | "pickup">(
    "onsite",
  );

  // Pets — pre-populated from rebook if available, otherwise start with one empty pet
  const [pets, setPets] = useState<PetFormState[]>(() => {
    if (prebookState?.prebookPets && prebookState.prebookPets.length > 0) {
      return prebookState.prebookPets.map((p, i) => ({
        _id: i,
        petName: p.petName,
        petType: p.petType,
        breed: p.breed ?? "",
        petNotes: p.petNotes ?? "",
      }));
    }
    return [{ _id: 0, petName: "", petType: "", breed: "", petNotes: "" }];
  });
  const petIdCounter = React.useRef(
    prebookState?.prebookPets ? prebookState.prebookPets.length : 1,
  );
  const [addingPet, setAddingPet] = useState(false);
  const [newPet, setNewPet] = useState<PetFormState>({
    _id: -1,
    petName: "",
    petType: "",
    breed: "",
    petNotes: "",
  });
  const [notes, setNotes] = useState("");

  // Track whether the returning-client pet suggestion banner has been dismissed
  const [petSuggestDismissed, setPetSuggestDismissed] = useState(false);

  // Contact — pre-populated from rebook if available
  const [clientName, setClientName] = useState(
    prebookState?.prebookClientName ?? "",
  );
  const [clientEmail, setClientEmail] = useState(
    prebookState?.prebookClientEmail ?? "",
  );
  const [clientPhone, setClientPhone] = useState(
    prebookState?.prebookClientPhone ?? "",
  );

  // ── Phase 8: Returning-client detection in Contact step (step 3) ──────────
  // These lookup keys are only updated on onBlur so the backend is not hit
  // on every keystroke. The hooks are enabled only when the key is non-empty.
  const [contactEmailKey, setContactEmailKey] = useState("");
  const [contactPhoneKey, setContactPhoneKey] = useState("");
  const [contactMatchDismissed, setContactMatchDismissed] = useState(false);
  // Track whether pets were already prefilled from the contact step lookup
  const contactPetFilledRef = useRef(false);

  // Normalize helpers (same logic as Step 0 lookup)
  const normalizedContactEmail = contactEmailKey.includes("@")
    ? contactEmailKey.toLowerCase().trim()
    : "";
  const normalizedContactPhone = (() => {
    const digits = contactPhoneKey.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits;
  })();

  const { data: contactEmailBookings = [], isFetching: contactEmailFetching } =
    useBookingsByEmail(normalizedContactEmail);
  const { data: contactPhoneBookings = [], isFetching: contactPhoneFetching } =
    useBookingsByPhone(
      normalizedContactPhone.length >= 10 ? normalizedContactPhone : "",
    );

  // Resolve the best match: email is highest priority
  const contactMatchBookings = (() => {
    if ((contactEmailBookings as Public__8[]).length > 0)
      return contactEmailBookings as Public__8[];
    if ((contactPhoneBookings as Public__8[]).length > 0)
      return contactPhoneBookings as Public__8[];
    return null;
  })();
  const contactMatchSource: "email" | "phone" | null = (() => {
    if ((contactEmailBookings as Public__8[]).length > 0) return "email";
    if ((contactPhoneBookings as Public__8[]).length > 0) return "phone";
    return null;
  })();

  // Conflict detection: email matches one client, phone matches a DIFFERENT client
  const contactMatchConflict = (() => {
    const eb = contactEmailBookings as Public__8[];
    const pb = contactPhoneBookings as Public__8[];
    if (eb.length === 0 || pb.length === 0) return false;
    const emailClient = eb[0]?.clientEmail?.toLowerCase();
    const phoneClient = pb[0]?.clientEmail?.toLowerCase();
    return !!(emailClient && phoneClient && emailClient !== phoneClient);
  })();

  const contactLookupFetching = contactEmailFetching || contactPhoneFetching;

  // When a match is found in the Contact step, prefill name/email/phone (once)
  // and (Phase 9) also prefill pets if the user hasn't typed any pet info yet.
  const contactAutoAppliedRef = useRef(false);
  useEffect(() => {
    if (contactMatchDismissed) return;
    if (contactMatchConflict) return;
    if (!contactMatchBookings || contactMatchBookings.length === 0) return;
    const b = contactMatchBookings[0];
    // Only auto-apply contact fields once so edits are preserved
    if (!contactAutoAppliedRef.current) {
      contactAutoAppliedRef.current = true;
      if (b.clientName) setClientName((prev) => prev || b.clientName!);
      if (b.clientEmail) setClientEmail((prev) => prev || b.clientEmail!);
      if (b.clientPhone) setClientPhone((prev) => prev || b.clientPhone!);
    }
    // Phase 9: prefill pets from the matched booking (only once)
    if (!contactPetFilledRef.current) {
      const matchedPets = b.pets ?? [];
      if (matchedPets.length > 0) {
        setPets((prev) => {
          const petsAreEmpty =
            prev.length === 0 ||
            (prev.length === 1 && !prev[0].petName && !prev[0].petType);
          if (!petsAreEmpty) return prev;
          contactPetFilledRef.current = true;
          petIdCounter.current = matchedPets.length;
          return matchedPets.map((p, i) => ({
            _id: i,
            petName: p.petName,
            petType: p.petType,
            breed: p.breed ?? "",
            petNotes: p.petNotes ?? "",
          }));
        });
      }
    }
  }, [contactMatchBookings, contactMatchDismissed, contactMatchConflict]);

  // ── Returning-client detection (Step 0 passive lookup) ─────────────────────
  // Pre-seed from initialClientEmail/Phone (passed from BookingLookupPage) OR
  // let the user type into the field manually.
  const [returningInput, setReturningInput] = useState(() => {
    if (initialClientEmail) return initialClientEmail;
    if (initialClientPhone) return initialClientPhone;
    return "";
  });
  // debouncedReturning is pre-seeded immediately (no debounce delay) when
  // contact info was passed in from a prior lookup.
  const [debouncedReturning, setDebouncedReturning] = useState(() => {
    if (initialClientEmail) return initialClientEmail;
    if (initialClientPhone) return initialClientPhone;
    return "";
  });
  const [rebookBannerDismissed, setRebookBannerDismissed] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReturningInput = useCallback((val: string) => {
    setReturningInput(val);
    setRebookBannerDismissed(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedReturning(val.trim());
    }, 500);
  }, []);

  const handleWindowStartChange = useCallback(
    (v: string) => {
      setWindowStartTime(v);
      setWindowSearched(false);
      // Auto-calculate end time for meet & greet
      if (isMeetAndGreet) {
        const [h, m] = v.split(":").map(Number);
        const end = h * 60 + m + 30;
        const eh = Math.floor(end / 60);
        const em = end % 60;
        setWindowEndTime(
          `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`,
        );
      }
    },
    [isMeetAndGreet],
  );

  const handleWindowEndChange = useCallback((v: string) => {
    setWindowEndTime(v);
    setWindowSearched(false);
  }, []);

  // Determine whether the input looks like an email or phone
  const returningEmail = debouncedReturning.includes("@")
    ? debouncedReturning.toLowerCase().trim()
    : "";
  const returningPhone = !debouncedReturning.includes("@")
    ? (() => {
        const digits = debouncedReturning.replace(/\D/g, "");
        // Strip leading US country code '1' from 11-digit numbers so they
        // match stored 10-digit phone numbers in the backend.
        return digits.length === 11 && digits.startsWith("1")
          ? digits.slice(1)
          : digits;
      })()
    : "";

  // Use ALL bookings (not just completed) so returning clients see current
  // and past bookings as rebook options.
  const { data: emailRebookBookings = [], isLoading: emailRebookLoading } =
    useBookingsByEmail(returningEmail);
  const { data: phoneRebookBookings = [], isLoading: phoneRebookLoading } =
    useBookingsByPhone(returningPhone);

  // Pick the right result set based on what the user typed
  const completedBookings = (
    returningEmail ? emailRebookBookings : phoneRebookBookings
  ) as Public__8[];
  const completedLoading = returningEmail
    ? emailRebookLoading
    : phoneRebookLoading;

  // Auto-fill contact info from first returning-client booking (editable, not locked)
  const contactAutoFilledRef = useRef(false);
  useEffect(() => {
    if (contactAutoFilledRef.current) return;
    if (completedBookings.length === 0) return;
    contactAutoFilledRef.current = true;
    const b = completedBookings[0];
    setClientName((prev) => (prev ? prev : (b.clientName ?? "")));
    setClientEmail((prev) => (prev ? prev : (b.clientEmail ?? "")));
    setClientPhone((prev) => (prev ? prev : (b.clientPhone ?? "")));
  }, [completedBookings]);

  // Availability check for rebook — only fires when triggered programmatically
  // after the user has selected a new date in Step 0 and clicked "Find Sitters"
  const { data: rebookAvailability = [] } =
    useCheckSittersAvailabilityForRebook(
      rebookCheckIds,
      rebookCheckDates,
      rebookCheckServices,
    );

  // When availability results arrive, handle navigation or show modal
  useEffect(() => {
    if (rebookCheckIds.length === 0 || rebookAvailability.length === 0) return;
    setRebookChecking(false);
    const allAvail = rebookAvailability.every((r) => r.available);
    if (allAvail) {
      // All sitters confirmed available for the new date — restore sitter
      // selection from the original booking IDs and proceed to sitter step.
      setSelectedSitterIds(rebookOriginalSitterIds);
      setStep(1);
      setRebookCheckIds([]);
    } else {
      // Some sitters unavailable — show the modal; leave selectedSitterIds
      // empty so nothing appears selected in an inconsistent state.
      const unavailNames = rebookAvailability
        .filter((r) => !r.available)
        .map((r) => {
          const s = (allSitters as Public[]).find((st) => st.id === r.sitterId);
          return s?.name ?? `Sitter #${r.sitterId}`;
        });
      setRebookUnavailableModal({ sitterNames: unavailNames });
      setRebookCheckIds([]);
    }
  }, [
    rebookAvailability,
    rebookCheckIds.length,
    allSitters,
    rebookOriginalSitterIds,
  ]);

  // NOTE: step is initialized directly to 2 for isFromNewSitterSelectionFlow
  // (see useState initializer above). No effect needed to advance step.

  // Legal acceptance
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToCommunications, setAgreedToCommunications] = useState(false);
  const [agreedToCancellation, setAgreedToCancellation] = useState(false);
  const [callRequestChecked, setCallRequestChecked] = useState(false);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(
    null,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute booking duration in hours from the actual time window (HH:mm strings).
  // Reuses the same pattern as the recurring booking handler (lines 1792-1809).
  // Falls back to 1 hour when times are not yet set (avoids showing $0 before
  // the user reaches the review step).
  const { totalCost, billedHours, billedRate, billedSitterCount } = (() => {
    if (!sitter)
      return {
        totalCost: 0,
        billedHours: 0,
        billedRate: 0,
        billedSitterCount: 1,
      };
    const rate = Number(sitter.hourlyRate);
    const count = Math.max(1, selectedSitterIds.length);
    if (!windowStartTime || !windowEndTime) {
      return {
        totalCost: 0,
        billedHours: 0,
        billedRate: rate,
        billedSitterCount: count,
      };
    }
    const [sh, sm] = windowStartTime.split(":").map(Number);
    const [eh, em] = windowEndTime.split(":").map(Number);
    const durationMinutes = Math.max(0, eh * 60 + em - (sh * 60 + (sm || 0)));
    const durationHours = durationMinutes / 60;
    return {
      totalCost: rate * durationHours * count,
      billedHours: durationHours,
      billedRate: rate,
      billedSitterCount: count,
    };
  })();

  const removePet = (idx: number) => {
    setPets((prev) => prev.filter((_, i) => i !== idx));
  };

  const addNewPet = () => {
    if (!newPet.petName || !newPet.petType) return;
    const id = petIdCounter.current++;
    setPets((prev) => [...prev, { ...newPet, _id: id }]);
    setNewPet({ _id: -1, petName: "", petType: "", breed: "", petNotes: "" });
    setAddingPet(false);
  };

  const updatePet = useCallback(
    (idx: number, field: keyof PetFormState, val: string) => {
      setPets((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)),
      );
    },
    [],
  );

  // Seed service schedule from selected sitters and Step 0 choices.
  // PATCH 2: Accepts an optional `services` parameter so callers can supply the
  // prebook services array before React state has settled (avoids the empty-guard
  // firing before selectedServices is populated).
  const seedServiceSchedule = (ids: bigint[], services?: string[]) => {
    const servicesSource = services ?? selectedServices;
    const dateSource = windowDate || startDate;
    // FIX 1: When servicesSource is empty, fall back to the sitter's offered services
    const effectiveServices =
      servicesSource.length > 0
        ? servicesSource
        : (sitter?.services
            ?.slice(0, 1)
            .map((s) => (typeof s === "string" ? s : String(s))) ?? []);
    if (!effectiveServices.length || !dateSource) {
      return;
    }
    const [startH, startM] = windowStartTime.split(":").map(Number);
    const [endH, endM] = windowEndTime.split(":").map(Number);
    const durationMins = BigInt(
      Math.max(0, endH * 60 + endM - (startH * 60 + startM)),
    );
    const slots: ServiceSlot[] = ids.flatMap((sid) => {
      // FIX C: Fallback to the page-level `sitter` object when allActiveSitters
      // hasn't loaded yet (or doesn't contain this sitter). This prevents an
      // empty result that would cause a blank Step 2 screen.
      const ts =
        allActiveSitters.find((s) => s.id === sid) ??
        (sitter?.id === sid ? sitter : undefined);
      if (!ts) return [];
      return effectiveServices.map((service) => ({
        service,
        startTime: windowStartTime,
        endTime: windowEndTime,
        sitterId: sid,
        durationMinutes: durationMins,
        ratePerHour: ts.hourlyRate,
      }));
    });
    setServiceSchedule([{ date: dateSource, slots }]);
  };

  const handleSelectSitter = (id: bigint) => {
    // Guard: only allow selection of actually available sitters
    const targetSitter = allActiveSitters.find((s) => s.id === id);
    if (!targetSitter || !isSitterAvailableForWindow(targetSitter)) return;

    // Toggle: add if not selected, remove if already selected
    const alreadySelected = selectedSitterIds.includes(id);
    const newIds = alreadySelected
      ? selectedSitterIds.filter((sid) => sid !== id)
      : [...selectedSitterIds, id];

    setJustSelectedSitterId(alreadySelected ? null : id);
    if (!alreadySelected) setTimeout(() => setJustSelectedSitterId(null), 1800);
    setSelectedSitterIds(newIds);

    // Sync booking dates from Step 0 whenever selection changes
    if (windowDate) {
      setStartDate(windowDate);
      setEndDate(windowDate);
      setStartTime(windowStartTime);
      setEndTime(windowEndTime);
    }
    // Clear schedule — will be re-seeded when user clicks Next
    setServiceSchedule([]);
  };

  const handleProceedFromSitterStep = () => {
    if (selectedSitterIds.length === 0) return;

    // Determine the services to use
    const services = isFromNewSitterSelectionFlow
      ? (prebookState?.prebookServices ?? selectedServices ?? [])
      : (selectedServices ?? []);
    const effectiveServices =
      services.length > 0
        ? services
        : (sitter?.services?.slice(0, 1).map((s) => String(s)) ?? []);

    // Determine the date to use
    const dateSource =
      windowDate || startDate || new Date().toISOString().split("T")[0];

    // Sync date/time state so Step 2 has correct values
    if (windowDate) {
      setStartDate(windowDate);
      setEndDate(windowDate);
      setStartTime(windowStartTime);
      setEndTime(windowEndTime);
    }

    // Build a minimal service schedule synchronously
    if (effectiveServices.length > 0 && selectedSitterIds.length > 0) {
      const [startH, startM] = (windowStartTime || "09:00")
        .split(":")
        .map(Number);
      const [endH, endM] = (windowEndTime || "10:00").split(":").map(Number);
      const durationMins = BigInt(
        Math.max(60, endH * 60 + endM - (startH * 60 + startM)),
      );
      const slots: ServiceSlot[] = selectedSitterIds.flatMap((sid) => {
        const ts =
          allActiveSitters.find((s) => s.id === sid) ??
          (sitter?.id === sid ? sitter : undefined);
        if (!ts) return [];
        return effectiveServices.map((service) => ({
          service,
          startTime: windowStartTime || "09:00",
          endTime: windowEndTime || "10:00",
          sitterId: sid,
          durationMinutes: durationMins,
          ratePerHour: ts.hourlyRate,
        }));
      });
      if (slots.length > 0) {
        setServiceSchedule([{ date: dateSource, slots }]);
      }
    }

    // Ensure serviceSchedule is populated before rendering step 2
    setServiceSchedule((prev) => {
      if (prev.length > 0) return prev;
      const fallbackService =
        effectiveServices[0] ?? String(sitter?.services?.[0] ?? "Dog Walking");
      const fallbackSitterId = selectedSitterIds[0] ?? sitter?.id ?? "";
      if (!fallbackSitterId) return prev;
      return [
        {
          date: dateSource,
          slots: [
            {
              service: fallbackService,
              startTime: windowStartTime || "09:00",
              endTime: windowEndTime || "10:00",
              sitterId: fallbackSitterId,
              durationMinutes: BigInt(60),
              ratePerHour: sitter?.hourlyRate ?? BigInt(1500),
            },
          ],
        },
      ];
    });
    // Advance synchronously — guaranteed, no race conditions
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!sitter) return;
    // Idempotency guard: prevent double-submit while pending
    if (createBooking.isPending || createRecurringGroup.isPending) return;

    // ── Recurring booking path ──────────────────────────────────────────────
    if (isRecurring && !isMeetAndGreet) {
      const activeSitterRecurring =
        (allSitters as Public[]).find((s) =>
          selectedSitterIds.includes(s.id),
        ) ?? sitter;
      const mappedPets: Pet[] = pets.map((p) => ({
        petName: p.petName,
        petType: p.petType,
        breed: p.breed || undefined,
        petNotes: p.petNotes || undefined,
      }));

      if (recurringOccurrenceDates.length < 2) {
        toast.error(
          "At least 2 occurrence dates are required for a recurring booking.",
        );
        return;
      }

      try {
        const patternObj =
          recurrencePattern === "weekly"
            ? { weekly: null as null }
            : recurrencePattern === "biweekly"
              ? { biweekly: null as null }
              : { monthly: null as null };

        const startIso = recurringOccurrenceDates[0];
        const endIso =
          recurrenceEndMode === "date" && recurrenceEndDate
            ? recurrenceEndDate
            : null;

        const toNs = (iso: string) =>
          BigInt(new Date(`${iso}T00:00:00`).getTime()) * 1_000_000n;

        const [sh, sm] = windowStartTime.split(":").map(Number);
        const [eh, em] = windowEndTime.split(":").map(Number);
        const durationMinutes = Math.max(
          0,
          eh * 60 + em - (sh * 60 + (sm || 0)),
        );

        const hourlyRateCents =
          Number(
            activeSitterRecurring.serviceRates?.find((r) =>
              selectedServices.includes(r.service),
            )?.ratePerHour ?? activeSitterRecurring.hourlyRate,
          ) * 100;
        const occCount = recurringOccurrenceDates.length;
        const durationHours = durationMinutes / 60;
        const totalCostCents = BigInt(
          Math.round(durationHours * (hourlyRateCents / 100) * occCount * 100),
        );

        const _result = await createRecurringGroup.mutateAsync({
          sitterId: activeSitterRecurring.id,
          clientInfo: {
            clientName: clientName.trim(),
            clientEmail: clientEmail.toLowerCase().trim(),
            clientPhone: normalizePhone(clientPhone),
          },
          petInfo: mappedPets,
          serviceIds: selectedServices,
          recurrenceRule: {
            pattern: patternObj,
            daysOfWeek: recurrenceDaysOfWeek,
            startDate: toNs(startIso),
            endDate: endIso ? [toNs(endIso)] : [],
            occurrenceCount:
              recurrenceEndMode === "count"
                ? [BigInt(recurrenceOccurrenceCount)]
                : [],
          },
          startTime: windowStartTime,
          endTime: windowEndTime,
          serviceDuration: BigInt(durationMinutes),
          totalCostCents,
          agreements: {
            terms: agreedToTerms,
            privacy: agreedToPrivacy,
            communications: agreedToCommunications,
            callRequest: callRequestChecked,
            cancellationPolicy: agreedToCancellation,
            nonEmploymentAck: false, // nonEmploymentAck: N/A for client bookings, always false
            termsVersion: BigInt(TERMS_VERSION),
          },
          occurrenceDates: recurringOccurrenceDates.map(toNs),
        });

        setConfirmedBooking({
          id: BigInt(Date.now()),
          clientName,
          pets: pets.map((p) => ({
            petName: p.petName,
            petType: p.petType,
            breed: p.breed || undefined,
            petNotes: p.petNotes || undefined,
          })),
          services: selectedServices,
          status: "pending" as const,
          sitterIds: selectedSitterIds,
        } as unknown as Public__8);
        setStep(5);
        // No single booking to send confirmation for — the backend sends the group email
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          "[handleSubmit/recurring] Booking submission failed:",
          msg,
          { err },
        );
        toast.error("Failed to submit recurring booking. Please try again.");
      }
      return;
    }

    // ── Single booking path (unchanged) ────────────────────────────────────

    const activeSitter =
      (allSitters as Public[]).find((s) => selectedSitterIds.includes(s.id)) ??
      sitter;
    try {
      // Use window values as canonical fallback if startDate/endDate not set
      const resolvedStartDate = startDate || windowDate;
      const resolvedEndDate = endDate || windowDate;
      const resolvedStartTime = startTime || windowStartTime;
      const resolvedEndTime = endTime || windowEndTime;

      const startNs =
        BigInt(
          new Date(`${resolvedStartDate}T${resolvedStartTime}`).getTime(),
        ) * 1_000_000n;
      const endNs =
        BigInt(new Date(`${resolvedEndDate}T${resolvedEndTime}`).getTime()) *
        1_000_000n;
      const recEndNs = recurrenceEndDate
        ? BigInt(new Date(recurrenceEndDate).getTime()) * 1_000_000n
        : undefined;

      const mappedPets: Pet[] = pets.map((p) => ({
        petName: p.petName,
        petType: p.petType,
        breed: p.breed || undefined,
        petNotes: p.petNotes || undefined,
      }));

      // Meet & Greet: no service schedule, free visit tagged in notes
      const meetGreetNotePrefix = isMeetAndGreet
        ? `[${MEET_AND_GREET.name.toUpperCase()} — ${MEET_AND_GREET.description.toUpperCase()}] `
        : "";
      // Rebook analytics tag — lets admin/sitter analytics count returning bookings
      const rebookNotePrefix = isRebookMode ? "[REBOOK] " : "";

      const scheduleServices = isMeetAndGreet
        ? [MEET_AND_GREET.name]
        : serviceSchedule.length > 0
          ? [
              ...new Set(
                serviceSchedule.flatMap((d) => d.slots.map((s) => s.service)),
              ),
            ]
          : selectedServices;

      const booking = await createBooking.mutateAsync({
        sitterIds: selectedSitterIds,
        services: scheduleServices,
        serviceSchedule: isMeetAndGreet
          ? undefined
          : serviceSchedule.length > 0
            ? serviceSchedule
            : undefined,
        startDate: startNs,
        endDate: endNs,
        pets: mappedPets,
        clientName,
        clientEmail,
        clientPhone: normalizePhone(clientPhone),
        notes:
          `${rebookNotePrefix}${meetGreetNotePrefix}[Location: ${serviceLocation === "onsite" ? "At My Home" : "Sitter Picks Up"}] ${notes}`.trim(),
        isRecurring: isMeetAndGreet ? false : isRecurring,
        recurrencePattern:
          !isMeetAndGreet && isRecurring
            ? (recurrencePattern as RecurrencePattern)
            : undefined,
        recurrenceEndDate:
          !isMeetAndGreet && isRecurring ? recEndNs : undefined,
        callRequest: callRequestChecked,
        agreementFlags: {
          terms: agreedToTerms,
          privacy: agreedToPrivacy,
          communications: agreedToCommunications,
          callRequest: callRequestChecked,
          cancellationPolicy: agreedToCancellation,
          nonEmploymentAck: false, // nonEmploymentAck: N/A for client bookings, always false
          termsVersion: BigInt(TERMS_VERSION),
        },
      });
      void activeSitter;
      setConfirmedBooking(booking);
      setStep(5);
      try {
        await sendConfirmation.mutateAsync(booking.id);
      } catch {
        // Silently ignore email errors
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[handleSubmit] Booking submission failed:", msg, { err });
      const userMsg = msg.includes("frozen")
        ? "This account is currently inactive. Please contact your sitter."
        : msg.length > 0 && msg.length < 200
          ? `Booking failed: ${msg}`
          : "Booking failed. Please try again or contact your sitter.";
      toast.error(userMsg);
    }
  };

  const validPets = pets.filter((p) => p.petName && p.petType);

  const hasAvailabilityConflict = serviceSchedule.some((day) =>
    day.slots.some(
      (slot) => validateSlotTime(slot, day.date, availabilityBySitter) !== null,
    ),
  );

  const step0Valid =
    !!windowDate &&
    !!windowStartTime &&
    !!windowEndTime &&
    (isMeetAndGreet || selectedServices.length > 0) &&
    // When recurring is ON: need at least 2 valid occurrence dates and no unresolved conflicts
    (!isRecurring ||
      (recurringOccurrenceDates.length >= 2 &&
        !hasRecurringConflicts &&
        (recurrencePattern === "monthly" || recurrenceDaysOfWeek.length > 0)));

  const canNext = () => {
    if (step === 0) return step0Valid;
    if (step === 1) {
      if (selectedSitterIds.length === 0) return false;
      // ALL selected sitters must pass the availability check
      return selectedSitterIds.every((id) => {
        const s = allActiveSitters.find((as) => as.id === id);
        return !!s && isSitterAvailableForWindow(s);
      });
    }
    if (step === 2) return validPets.length > 0;
    if (step === 3)
      return (
        !!clientName &&
        !!clientEmail &&
        normalizePhone(clientPhone).length >= 10
      );
    return true;
  };

  const canSubmitBooking =
    agreedToTerms &&
    agreedToPrivacy &&
    agreedToCommunications &&
    agreedToCancellation;
  // callRequest is optional — does not block booking

  // FIX 2 (defence) + FIX 3 (recovery): When step is 2 and schedule is empty,
  // re-seed once. The previous implementation had the guard wrong ("if step !== 2
  // return" which prevented re-seeding when step was already 2). Fixed below.
  // Also guards the defensive spinner path so it never shows permanently.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional retry on data arrival
  useEffect(() => {
    // FIX 3: Guard is now "step === 2" (was "step !== 2" — that was the bug).
    if (step !== 2) return;
    // FIX 2: Also require sitter to be loaded before retrying
    if (!sitter) return;
    const hasEmptySlots =
      serviceSchedule.length === 0 ||
      serviceSchedule.every((d) => d.slots.length === 0);
    if (!hasEmptySlots) return;
    const sitterIds =
      (prebookState?.prebookSitterIds ?? []).length > 0
        ? (prebookState!.prebookSitterIds as bigint[])
        : selectedSitterIds;
    const services =
      (prebookState?.prebookServices?.length ?? 0) > 0
        ? prebookState!.prebookServices!
        : selectedServices;
    if (sitterIds.length > 0 && services.length > 0) {
      seedServiceSchedule(sitterIds, services);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sitter, allActiveSitters]);

  const filteredAvailResults = useQueries({
    queries: allActiveSitters.map((s) => ({
      queryKey: ["sitter-availability", s.id.toString()],
      queryFn: async () => {
        if (!actor) return [] as AvailabilityEntry[];
        return actor.getSitterAvailability(s.id) as Promise<
          AvailabilityEntry[]
        >;
      },
      enabled: !!actor && isReady,
    })),
  });
  const filteredAvailMap: Record<string, AvailabilityEntry[]> = {};
  // Track which sitters still have pending availability queries
  const filteredAvailLoadingSet = new Set<string>();
  allActiveSitters.forEach((s, idx) => {
    filteredAvailMap[s.id.toString()] = (filteredAvailResults[idx]?.data ??
      []) as AvailabilityEntry[];
    if (
      filteredAvailResults[idx]?.isLoading ||
      filteredAvailResults[idx]?.isFetching
    ) {
      filteredAvailLoadingSet.add(s.id.toString());
    }
  });

  function isSitterAvailableForWindow(s: Public): boolean {
    if (!windowDate || !windowStartTime || !windowEndTime) return true;
    const entries = filteredAvailMap[s.id.toString()] ?? [];
    // If availability data is still loading for this sitter, treat as available
    // so we don't flash "0 available" while queries settle (especially in rebook mode).
    if (entries.length === 0) {
      return true; // No schedule set means available by default
    }
    const dow = getDayOfWeek(windowDate);
    const entry = entries.find((e) => Number(e.dayOfWeek) === dow);
    if (!entry) return false;
    const reqStart = timeStringToMinutes(windowStartTime);
    const reqEnd = timeStringToMinutes(windowEndTime);
    return (
      reqStart >= Number(entry.startTime) && reqEnd <= Number(entry.endTime)
    );
  }

  // Check if a sitter offers ALL the selected services
  function sitterOffersServices(s: Public): boolean {
    if (selectedServices.length === 0) return true;
    return selectedServices.every((svc) =>
      s.services.some((sv) => sv.toLowerCase() === svc.toLowerCase()),
    );
  }

  const sortedSitters = [...allActiveSitters].sort((a, b) => {
    const aAvail = isSitterAvailableForWindow(a) && sitterOffersServices(a);
    const bAvail = isSitterAvailableForWindow(b) && sitterOffersServices(b);
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return 0;
  });

  const availableCount = sortedSitters.filter(
    (s) => isSitterAvailableForWindow(s) && sitterOffersServices(s),
  ).length;

  // Hydrate real sitter rates once allActiveSitters loads (replaces 0n placeholder from lazy init)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only fire when allActiveSitters loads
  useEffect(() => {
    if (
      (allActiveSitters.length > 0 || !!sitter) &&
      selectedSitterIds.length > 0 &&
      serviceSchedule.some((d) => d.slots.some((s) => s.ratePerHour === 0n))
    ) {
      seedServiceSchedule(selectedSitterIds);
    }
  }, [allActiveSitters.length]);

  // Compute cart for mobile sticky bar (Step 2 - Pets / scheduler)
  const allScheduledSlots = serviceSchedule.flatMap((d) =>
    d.slots.map((s) => ({ ...s, date: d.date })),
  );
  const scheduleSubtotal = allScheduledSlots.reduce(
    (sum, s) => sum + getSlotCost(s),
    0,
  );
  const scheduleBundleDiscount =
    allScheduledSlots.length >= 3 ? scheduleSubtotal * 0.1 : 0;
  const scheduleGrandTotal = scheduleSubtotal - scheduleBundleDiscount;

  if (
    (!actor && step < 2 && !prebookState?.prebookSitter) ||
    (step < 2 && isLoading) ||
    (step < 2 &&
      isFromNewSitterSelectionFlow &&
      !sitter &&
      !prebookState?.prebookSitter)
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Skeleton className="w-full max-w-xl h-96 rounded-2xl" />
      </div>
    );
  }

  if (step < 2 && !sitter && !prebookState?.prebookSitter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-muted-foreground">Sitter not found.</p>
      </div>
    );
  }

  const activeSitterForDisplay =
    ((allSitters ?? []) as Public[]).find((s) =>
      selectedSitterIds.includes(s.id),
    ) ??
    sitter ??
    prebookState?.prebookSitter;

  // Progress bar fill width per step
  const progressPct = step >= 5 ? 100 : Math.round((step / 4) * 100);

  return (
    <BookingErrorBoundary>
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Sticky header */}
        <header className="sticky top-0 z-50 frosted-nav">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              data-ocid="booking.back.button"
              onClick={() => {
                if (step === 0) {
                  navigate("home");
                } else if (step === 2 && isFromNewSitterSelectionFlow) {
                  // Came from sitter selection flow — go back to find-sitters
                  navigate("find-sitters");
                } else {
                  setStep((s) => s - 1);
                }
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm truncate">
                {step < 5 ? STEPS[step] : "Confirmed! 🎉"}
              </p>
            </div>
            {step < 5 && (
              <span className="text-xs text-muted-foreground shrink-0 sm:hidden">
                {step + 1} of 5
              </span>
            )}
          </div>

          {/* Animated progress bar */}
          {step < 5 && (
            <div className="h-1 bg-border">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </header>

        <div className="max-w-3xl mx-auto px-4 pt-6 pb-36 md:pb-12">
          {/* Step dots — mobile only shows "Step N of 5", desktop shows full names */}
          {step < 5 && (
            <div className="mb-6">
              {/* Desktop step labels */}
              <div className="hidden sm:flex items-center gap-1">
                {STEPS.map((label, idx) => (
                  <div key={label} className="flex items-center gap-1 shrink-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                        idx < step
                          ? "bg-primary text-primary-foreground"
                          : idx === step
                            ? "bg-accent text-accent-foreground scale-110"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {idx < step ? <Check size={12} /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        idx === step
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "w-4 h-0.5 shrink-0",
                          idx < step ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile step dots */}
              <div className="flex sm:hidden items-center justify-center gap-2">
                {STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      idx < step
                        ? "w-2 h-2 bg-primary"
                        : idx === step
                          ? "w-4 h-2 bg-accent rounded-full"
                          : "w-2 h-2 bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-6 md:p-8">
            {/* ── STEP 0: When & What ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    When do you need care? 🐾
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isMeetAndGreet
                      ? "Set a date and time for a short 30-min meet & greet with the sitter."
                      : "Choose a date, time window, and service — we'll show you who's available."}
                  </p>
                </div>

                {/* ── Rebook mode banner (arriving from Book Again) ──────────── */}
                {isRebookMode && (
                  <div
                    data-ocid="booking.rebook_mode_banner"
                    className="flex items-start gap-3 p-3 rounded-xl border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700/40"
                  >
                    <RefreshCw
                      size={15}
                      className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                        Rebooking your previous services
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        Services and time are pre-filled from your last booking.
                        Pick a new date below and we'll confirm your sitter is
                        available.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss rebook banner"
                      onClick={() => setIsRebookMode(false)}
                      className="shrink-0 text-amber-500 hover:text-amber-700 p-1 rounded-full min-w-[28px] min-h-[28px] flex items-center justify-center"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                {/* ── Returning client passive field ────────────────────────── */}
                <div className="space-y-1.5">
                  {" "}
                  <label
                    htmlFor="returning-client-input"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
                  >
                    <RefreshCw size={11} className="text-primary" />
                    Returning client? Enter your email or phone
                  </label>
                  <Input
                    id="returning-client-input"
                    data-ocid="booking.returning_client.input"
                    type="text"
                    value={returningInput}
                    onChange={(e) => handleReturningInput(e.target.value)}
                    placeholder="jane@example.com or (555) 123-4567"
                    className="rounded-xl h-11 text-sm"
                    style={{ fontSize: "16px" }}
                  />
                </div>

                {/* ── Welcome back rebook banner ────────────────────────────── */}
                {!rebookBannerDismissed && completedBookings.length > 0 && (
                  <div
                    data-ocid="booking.rebook_banner"
                    className="rounded-2xl border border-white/30 bg-white/70 dark:bg-indigo-950/60 dark:border-indigo-700/40 backdrop-blur-md shadow-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-indigo-700 dark:text-indigo-300 text-base flex items-center gap-2">
                        <Sparkles size={15} className="text-amber-500" />
                        Welcome back! Book your favorites again
                      </h3>
                      <button
                        type="button"
                        onClick={() => setRebookBannerDismissed(true)}
                        className="text-muted-foreground hover:text-foreground rounded-full p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        aria-label="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We found past bookings for this contact. Tap a card to
                      pre-fill your cart.
                    </p>
                    <div className="space-y-2">
                      {(completedBookings as Public__8[])
                        .slice(0, 3)
                        .map((b, idx) => {
                          const bSitterName =
                            Array.isArray(b.sitterIds) && b.sitterIds.length > 0
                              ? b.sitterIds
                                  .map((sid) => {
                                    const s = (allSitters as Public[]).find(
                                      (st) => st.id === sid,
                                    );
                                    return s?.name ?? `Sitter #${sid}`;
                                  })
                                  .join(" & ")
                              : "Your sitter";
                          const lastBookedDate = b.startDate
                            ? new Date(
                                Number(b.startDate / 1_000_000n),
                              ).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })
                            : "—";
                          return (
                            <div
                              key={b.id.toString()}
                              data-ocid={`booking.rebook_card.${idx + 1}`}
                              className="flex items-start gap-3 rounded-xl border border-indigo-100 dark:border-indigo-800/60 bg-white/60 dark:bg-indigo-900/30 p-3 shadow-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {bSitterName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {Array.isArray(b.services) &&
                                  b.services.length > 0
                                    ? b.services.join(" · ")
                                    : "Previous booking"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Last booked {lastBookedDate}
                                </p>
                              </div>
                              <button
                                type="button"
                                data-ocid={`booking.rebook_this.${idx + 1}`}
                                onClick={() => {
                                  if (
                                    !Array.isArray(b.sitterIds) ||
                                    b.sitterIds.length === 0
                                  )
                                    return;
                                  // Pre-fill form state — NO availability check
                                  // here. Availability is checked only when the
                                  // client picks a new date and taps "Find Sitters".
                                  // Do NOT set selectedSitterIds yet — sitter must
                                  // not appear selected until availability is confirmed
                                  // for the new date the client is about to pick.
                                  const sched = Array.isArray(b.serviceSchedule)
                                    ? b.serviceSchedule
                                    : [];
                                  const firstSlot = sched[0]?.slots?.[0];
                                  const svcs = Array.isArray(b.services)
                                    ? b.services
                                    : [];
                                  if (svcs.length > 0)
                                    setSelectedServices(svcs);
                                  if (firstSlot) {
                                    setWindowStartTime(firstSlot.startTime);
                                    setWindowEndTime(firstSlot.endTime);
                                  }
                                  // Store original sitter IDs as a hint for availability check;
                                  // clear current selection until availability is confirmed.
                                  setRebookOriginalSitterIds(b.sitterIds);
                                  setSelectedSitterIds([]);
                                  setIsRebookMode(true);
                                  setWindowDate(""); // client must pick a new date
                                  setRebookBannerDismissed(true);
                                  // Pre-fill pets from this booking
                                  if (
                                    Array.isArray(b.pets) &&
                                    b.pets.length > 0
                                  ) {
                                    const filledPets = b.pets.map((p, i) => ({
                                      _id: i,
                                      petName: p.petName,
                                      petType: p.petType,
                                      breed: p.breed ?? "",
                                      petNotes: p.petNotes ?? "",
                                    }));
                                    petIdCounter.current = filledPets.length;
                                    setPets(filledPets);
                                    setPetSuggestDismissed(true);
                                  }
                                  // Pre-fill contact info from this booking
                                  if (b.clientName) setClientName(b.clientName);
                                  if (b.clientEmail)
                                    setClientEmail(b.clientEmail);
                                  if (b.clientPhone)
                                    setClientPhone(b.clientPhone);
                                  toast.success(
                                    "Great! Services and pets pre-filled — just pick a new date above.",
                                  );
                                }}
                                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-amber-400 hover:bg-amber-500 transition-colors min-h-[44px] flex items-center gap-1.5"
                              >
                                <RefreshCw size={13} />
                                Rebook
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                {completedLoading && debouncedReturning.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 size={12} className="animate-spin" />
                    Checking your booking history…
                  </div>
                )}

                {/* ── Meet & Greet / Regular Booking Toggle ────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    data-ocid="booking.regular_booking.toggle"
                    onClick={() => {
                      setIsMeetAndGreet(false);
                      setWindowEndTime("17:00");
                      // Keep selectedServices, don't clear them
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      !isMeetAndGreet
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${!isMeetAndGreet ? "bg-primary/15" : "bg-muted"}`}
                    >
                      <PawPrint
                        size={18}
                        className={
                          !isMeetAndGreet
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold leading-tight ${!isMeetAndGreet ? "text-primary" : "text-foreground"}`}
                      >
                        Book Service
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        Schedule full pet care
                      </p>
                    </div>
                    {!isMeetAndGreet && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-primary-foreground" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    data-ocid="booking.meet_and_greet.toggle"
                    onClick={() => {
                      setIsMeetAndGreet(true);
                      setWindowEndTime(
                        windowStartTime
                          ? (() => {
                              const [h, m] = windowStartTime
                                .split(":")
                                .map(Number);
                              const end = h * 60 + m + 30;
                              const eh = Math.floor(end / 60);
                              const em = end % 60;
                              return `${eh.toString().padStart(2, "0")}:${em.toString().padStart(2, "0")}`;
                            })()
                          : "09:30",
                      );
                      // Meet & Greet uses its own service label, not selectedServices
                    }}
                    className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      isMeetAndGreet
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm"
                        : "border-border bg-card hover:border-emerald-400/60"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${isMeetAndGreet ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-muted"}`}
                    >
                      <HandshakeIcon
                        size={18}
                        className={
                          isMeetAndGreet
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }
                      />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold leading-tight ${isMeetAndGreet ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
                      >
                        {MEET_AND_GREET.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {MEET_AND_GREET.description}
                      </p>
                    </div>
                    {isMeetAndGreet && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Meet & Greet explanation banner */}
                {isMeetAndGreet && (
                  <div className="flex gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <Heart
                      size={16}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        About {MEET_AND_GREET.name}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed mt-0.5">
                        A free, 30-minute introduction visit to confirm the
                        sitter is the right fit for your pets before committing
                        to a full booking. No charge — just peace of mind.
                      </p>
                    </div>
                  </div>
                )}

                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CalendarDays size={15} className="text-primary" />
                    {isMeetAndGreet
                      ? `${MEET_AND_GREET.name} Date`
                      : "Service Date"}
                  </Label>
                  <DatePicker
                    value={windowDate}
                    onChange={(iso) => {
                      setWindowDate(iso);
                      setWindowSearched(false);
                    }}
                    placeholder="Pick a date"
                    disabled={(d) => {
                      const t = new Date();
                      t.setHours(0, 0, 0, 0);
                      return d < t;
                    }}
                    ocid="booking.window_date.input"
                  />
                </div>

                {/* Time window */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Clock size={15} className="text-primary" />
                    {isMeetAndGreet
                      ? "Preferred Start Time (30 min)"
                      : "Time Window"}
                  </Label>

                  {/* ── Hourly slot grid ──────────────────────────────────── */}
                  {!windowDate ? (
                    <p className="text-sm text-muted-foreground py-2 px-1 flex items-center gap-2">
                      <CalendarDays
                        size={14}
                        className="shrink-0 text-muted-foreground/60"
                      />
                      Select a date above to see available times.
                    </p>
                  ) : hourlyLoading ? (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={`skel-${i}`}
                          className="h-10 rounded-xl bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {hourlySlots.map((slot) => {
                        const label =
                          slot.hour < 12
                            ? `${slot.hour} AM`
                            : slot.hour === 12
                              ? "12 PM"
                              : `${slot.hour - 12} PM`;
                        const isSelected = windowStartTime === slot.startTime;
                        const available = slot.availableSitterCount > 0;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            disabled={!available}
                            aria-pressed={isSelected}
                            aria-label={`${label}${available ? ` — ${slot.availableSitterCount} sitter${slot.availableSitterCount !== 1 ? "s" : ""} available` : " — unavailable"}`}
                            onClick={() => {
                              if (!available) return;
                              setWindowStartTime(slot.startTime);
                              if (isMeetAndGreet) {
                                setWindowEndTime(slot.endTime);
                              } else {
                                // For regular bookings: set end time to slot+1 (minimum 1 hr)
                                if (
                                  !windowEndTime ||
                                  windowEndTime <= slot.startTime
                                ) {
                                  setWindowEndTime(slot.endTime);
                                }
                              }
                              setWindowSearched(false);
                            }}
                            className={cn(
                              "relative h-10 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5",
                              isSelected && available
                                ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                                : available
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                  : "bg-muted/50 text-muted-foreground/50 border border-border/40 opacity-50 cursor-not-allowed",
                            )}
                          >
                            <span>{label}</span>
                            {available && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1.5" />
                            )}
                            {!available && (
                              <Lock size={9} className="absolute bottom-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* ── Fine-grained time dropdowns (secondary / fallback) ─── */}
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Or fine-tune times manually:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden transition-all hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-md">
                      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Start Time
                        </span>
                      </div>
                      <div className="px-3 pb-3">
                        <Select
                          value={windowStartTime}
                          onValueChange={handleWindowStartChange}
                        >
                          <SelectTrigger
                            className="rounded-lg h-10 text-sm font-semibold"
                            data-ocid="booking.window_start.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TIME_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden transition-all hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-md">
                      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock size={12} className="text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {isMeetAndGreet ? "End Time (auto)" : "End Time"}
                        </span>
                      </div>
                      <div className="px-3 pb-3">
                        {isMeetAndGreet ? (
                          <div className="h-10 flex items-center px-2 text-sm font-semibold text-muted-foreground bg-muted/40 rounded-lg border border-border">
                            {TIME_OPTIONS.find((o) => o.value === windowEndTime)
                              ?.label ?? windowEndTime}
                            <span className="ml-2 text-xs text-emerald-600 font-normal">
                              (+30 min)
                            </span>
                          </div>
                        ) : (
                          <Select
                            value={windowEndTime}
                            onValueChange={handleWindowEndChange}
                          >
                            <SelectTrigger
                              className="rounded-lg h-10 text-sm font-semibold"
                              data-ocid="booking.window_end.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {TIME_OPTIONS.filter(
                                (o) => o.value > windowStartTime,
                              ).map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service type — multi-select, hidden for meet & greet */}
                {!isMeetAndGreet && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <PawPrint size={15} className="text-primary" />
                      Services
                      <span className="text-xs font-normal text-muted-foreground">
                        (select all that apply)
                      </span>
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_SERVICES.map((svc) => {
                        const sel = selectedServices.includes(svc.name);
                        return (
                          <button
                            key={svc.name}
                            type="button"
                            data-ocid={`booking.service_chip.${svc.name.replace(/\s+/g, "_").toLowerCase()}`}
                            onClick={() => {
                              setSelectedServices((prev) =>
                                prev.includes(svc.name)
                                  ? prev.filter((s) => s !== svc.name)
                                  : [...prev, svc.name],
                              );
                              setWindowSearched(false);
                            }}
                            className={cn(
                              "relative flex flex-col items-center text-center gap-1.5 p-3 rounded-xl border-2 transition-all min-h-[72px] justify-center btn-press",
                              sel
                                ? "border-primary bg-primary/8 shadow-xs"
                                : "border-border bg-card hover:border-primary/40",
                            )}
                          >
                            {sel && (
                              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <Check
                                  size={10}
                                  className="text-primary-foreground"
                                />
                              </span>
                            )}
                            <svc.Icon
                              size={20}
                              className={
                                sel ? "text-primary" : "text-muted-foreground"
                              }
                            />
                            <span
                              className={cn(
                                "text-xs font-semibold leading-tight",
                                sel ? "text-primary" : "text-foreground",
                              )}
                            >
                              {svc.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mini cart summary */}
                    {selectedServices.length > 0 && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <PawPrint
                            size={14}
                            className="text-primary shrink-0"
                          />
                          <span className="text-sm font-semibold text-primary truncate">
                            {selectedServices.length === 1
                              ? selectedServices[0]
                              : `${selectedServices.length} services selected`}
                          </span>
                          {selectedServices.length >= 3 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                              10% bundle discount
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedServices([])}
                          className="text-muted-foreground hover:text-foreground text-xs shrink-0 underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Recurring booking toggle ──────────────────────────────── */}
                {!isMeetAndGreet && (
                  <div className="space-y-4">
                    {/* Toggle row */}
                    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border-2 border-border bg-card transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Repeat size={18} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            Make this a recurring booking
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Weekly, bi-weekly, or monthly schedule
                          </p>
                        </div>
                      </div>
                      <Switch
                        data-ocid="booking.recurring.toggle"
                        checked={isRecurring}
                        onCheckedChange={(v) => {
                          setIsRecurring(v);
                          if (!v) {
                            setRecurrenceDaysOfWeek([]);
                            setRecurringOccurrenceDates([]);
                          }
                        }}
                      />
                    </div>

                    {/* Recurring configuration UI */}
                    {isRecurring && (
                      <div className="space-y-4 p-4 rounded-2xl border border-primary/20 bg-primary/3">
                        {/* Frequency */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Frequency
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {(
                              [
                                { value: "weekly", label: "Weekly" },
                                { value: "biweekly", label: "Every 2 Weeks" },
                                { value: "monthly", label: "Monthly" },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                data-ocid={`booking.recurring_pattern.${opt.value}`}
                                onClick={() => {
                                  setRecurrencePattern(opt.value);
                                  setRecurrenceDaysOfWeek([]);
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all",
                                  recurrencePattern === opt.value
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:border-primary/50",
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Days of week */}
                        {recurrencePattern !== "monthly" && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Days of the week
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {["S", "M", "T", "W", "T", "F", "S"].map(
                                (label, idx) => {
                                  const sel =
                                    recurrenceDaysOfWeek.includes(idx);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      data-ocid={`booking.recurring_day.${idx}`}
                                      onClick={() =>
                                        setRecurrenceDaysOfWeek((prev) =>
                                          prev.includes(idx)
                                            ? prev.filter((d) => d !== idx)
                                            : [...prev, idx],
                                        )
                                      }
                                      className={cn(
                                        "w-10 h-10 rounded-full text-sm font-bold border-2 transition-all",
                                        sel
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-card text-foreground hover:border-primary/50",
                                      )}
                                    >
                                      {label}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                            {recurrenceDaysOfWeek.length === 0 && (
                              <p className="text-xs text-amber-600">
                                Select at least one day
                              </p>
                            )}
                          </div>
                        )}

                        {/* End condition */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Schedule end
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="recurrence-end"
                                value="count"
                                checked={recurrenceEndMode === "count"}
                                onChange={() => setRecurrenceEndMode("count")}
                                className="accent-primary"
                              />
                              <span className="text-sm">End after</span>
                              <input
                                type="number"
                                min={2}
                                max={26}
                                value={recurrenceOccurrenceCount}
                                disabled={recurrenceEndMode !== "count"}
                                onChange={(e) =>
                                  setRecurrenceOccurrenceCount(
                                    Math.min(
                                      26,
                                      Math.max(2, Number(e.target.value) || 2),
                                    ),
                                  )
                                }
                                data-ocid="booking.recurring_count.input"
                                className="w-16 h-8 rounded-lg border border-input px-2 text-sm text-center bg-background disabled:opacity-50"
                              />
                              <span className="text-sm">sessions</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="recurrence-end"
                                value="date"
                                checked={recurrenceEndMode === "date"}
                                onChange={() => setRecurrenceEndMode("date")}
                                className="accent-primary"
                              />
                              <span className="text-sm">End on date</span>
                              <input
                                type="date"
                                value={recurrenceEndDate}
                                disabled={recurrenceEndMode !== "date"}
                                min={
                                  windowDate
                                    ? (() => {
                                        const d = new Date(
                                          `${windowDate}T12:00:00`,
                                        );
                                        d.setDate(d.getDate() + 7);
                                        return d.toISOString().split("T")[0];
                                      })()
                                    : ""
                                }
                                onChange={(e) =>
                                  setRecurrenceEndDate(e.target.value)
                                }
                                data-ocid="booking.recurring_end_date.input"
                                className="h-8 rounded-lg border border-input px-2 text-sm bg-background disabled:opacity-50"
                                style={{ fontSize: "14px" }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Occurrence preview list */}
                        {recurringOccurrenceDates.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {recurringOccurrenceDates.length} appointment
                                {recurringOccurrenceDates.length !== 1
                                  ? "s"
                                  : ""}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setRecurringListCollapsed((p) => !p)
                                }
                                className="text-xs text-primary underline"
                              >
                                {recurringListCollapsed ? "Show" : "Hide"}
                              </button>
                            </div>
                            {!recurringListCollapsed && (
                              <div className="rounded-xl border border-border overflow-hidden">
                                {recurringAvailFetching ? (
                                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />{" "}
                                    Checking availability…
                                  </div>
                                ) : (
                                  recurringOccurrenceDates.map((iso, idx) => {
                                    const avail = recurringAvailByDate[iso];
                                    const isAvailable =
                                      avail?.available !== false;
                                    const conflictReason = avail?.reason ?? "";
                                    const dateLabel = new Date(
                                      `${iso}T12:00:00`,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    });
                                    const startLabel =
                                      TIME_OPTIONS.find(
                                        (o) => o.value === windowStartTime,
                                      )?.label ?? windowStartTime;
                                    const endLabel =
                                      TIME_OPTIONS.find(
                                        (o) => o.value === windowEndTime,
                                      )?.label ?? windowEndTime;
                                    return (
                                      <div
                                        key={iso}
                                        data-ocid={`booking.recurring_occurrence.${idx + 1}`}
                                        className={cn(
                                          "flex items-center justify-between gap-3 px-3 py-2.5 text-sm border-b border-border last:border-0",
                                          !isAvailable
                                            ? "bg-destructive/5"
                                            : idx % 2 === 1
                                              ? "bg-muted/20"
                                              : "bg-background",
                                        )}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {isAvailable ? (
                                            <Check
                                              size={14}
                                              className="text-emerald-500 shrink-0"
                                            />
                                          ) : (
                                            <X
                                              size={14}
                                              className="text-destructive shrink-0"
                                            />
                                          )}
                                          <span className="truncate font-medium">
                                            {dateLabel}
                                          </span>
                                          <span className="text-muted-foreground shrink-0 text-xs">
                                            {startLabel} – {endLabel}
                                          </span>
                                        </div>
                                        <span
                                          className={cn(
                                            "text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full",
                                            isAvailable
                                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                              : "bg-destructive/10 text-destructive",
                                          )}
                                          title={conflictReason}
                                        >
                                          {isAvailable
                                            ? "Available"
                                            : "Conflict"}
                                        </span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}

                            {recurringAvailabilityData.length > 0 && (
                              <p
                                className={cn(
                                  "text-xs font-semibold",
                                  hasRecurringConflicts
                                    ? "text-amber-600"
                                    : "text-emerald-600",
                                )}
                              >
                                {recurringAvailableCount} of{" "}
                                {recurringOccurrenceDates.length} dates
                                available
                              </p>
                            )}

                            {hasRecurringConflicts && (
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle
                                  size={14}
                                  className="text-amber-600 shrink-0 mt-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                                    Some dates have conflicts
                                  </p>
                                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    Remove conflicting dates or choose a
                                    different schedule.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  data-ocid="booking.recurring_remove_conflicts.button"
                                  onClick={() => {
                                    const conflictDates = new Set(
                                      recurringOccurrenceDates.filter(
                                        (d) =>
                                          recurringAvailByDate[d]?.available ===
                                          false,
                                      ),
                                    );
                                    const filtered =
                                      recurringOccurrenceDates.filter(
                                        (d) => !conflictDates.has(d),
                                      );
                                    if (filtered.length < 2)
                                      toast.info(
                                        "Only 1 date remains. Consider switching to a single booking.",
                                      );
                                    setRecurringOccurrenceDates(filtered);
                                  }}
                                  className="shrink-0 text-xs text-amber-700 underline whitespace-nowrap"
                                >
                                  Remove conflicts
                                </button>
                              </div>
                            )}

                            {recurringOccurrenceDates.length === 1 && (
                              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-xl">
                                <Info size={13} /> Only 1 date selected.
                                Recurring requires at least 2.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Find sitters CTA */}
                <Button
                  data-ocid="booking.find_sitters.button"
                  onClick={() => {
                    if (!step0Valid) return;
                    setWindowSearched(true);
                    if (isRebookMode && rebookOriginalSitterIds.length > 0) {
                      // Rebook mode: check if ORIGINAL sitters are available on
                      // the NEW date the client just selected — THEN advance step
                      setRebookChecking(true);
                      setRebookCheckIds(rebookOriginalSitterIds);
                      setRebookCheckDates([windowDate]);
                      setRebookCheckServices(selectedServices);
                      // Step advances in useEffect when availability resolves
                    } else if (preselectMode) {
                      // Storefront preselect mode: jump to step 1 with the preselected sitter
                      // highlighted. Auto-advance to step 2 if the sitter is available.
                      const preselectSitter = allActiveSitters.find(
                        (s) => s.id === sitterId,
                      );
                      if (
                        preselectSitter &&
                        isSitterAvailableForWindow(preselectSitter)
                      ) {
                        handleSelectSitter(sitterId);
                      } else {
                        // Sitter unavailable — show the grid so client can pick an alternative
                        setStep(1);
                      }
                    } else {
                      // Normal flow — advance immediately
                      setStep(1);
                    }
                  }}
                  disabled={!step0Valid || rebookChecking}
                  className={cn(
                    "w-full rounded-2xl font-bold text-base shadow-md hover:shadow-lg transition-all btn-press",
                    isMeetAndGreet
                      ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                      : "bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                  style={{ height: "52px" }}
                >
                  {rebookChecking ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />{" "}
                      Checking Availability…
                    </>
                  ) : isMeetAndGreet ? (
                    <>
                      <HandshakeIcon size={18} className="mr-2" /> Find
                      Available Sitters for {MEET_AND_GREET.name}
                    </>
                  ) : (
                    <>
                      <Search size={18} className="mr-2" /> Find Available
                      Sitters
                    </>
                  )}
                </Button>
              </div>
            )}
            {/* ── STEP 1: Pick a Sitter ────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    Choose Your Sitter
                  </h2>
                  {windowDate && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {new Date(`${windowDate}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { weekday: "long", month: "long", day: "numeric" },
                      )}{" "}
                      ·{" "}
                      {TIME_OPTIONS.find((o) => o.value === windowStartTime)
                        ?.label ?? windowStartTime}{" "}
                      –{" "}
                      {TIME_OPTIONS.find((o) => o.value === windowEndTime)
                        ?.label ?? windowEndTime}{" "}
                      {isMeetAndGreet
                        ? `· ${MEET_AND_GREET.name}`
                        : selectedServices.length > 0
                          ? `· ${selectedServices.join(", ")}`
                          : ""}
                    </p>
                  )}
                  {sortedSitters.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {isRecurring ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          <Repeat size={11} />
                          Recurring: {recurrencePattern} ·{" "}
                          {recurringOccurrenceDates.length} sessions ·{" "}
                          {recurringAvailableCount}/
                          {recurringOccurrenceDates.length} dates available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {availableCount} available for your window
                        </span>
                      )}
                      {sortedSitters.length - availableCount > 0 &&
                        !isRecurring && (
                          <span className="text-xs text-muted-foreground">
                            · {sortedSitters.length - availableCount}{" "}
                            unavailable shown below
                          </span>
                        )}
                    </div>
                  )}
                </div>

                {/* Pre-selected sitter banner (storefront "Book Me" flow) */}
                {preselectMode &&
                  (() => {
                    const preselected = (allSitters as Public[]).find(
                      (s) => s.id === sitterId,
                    );
                    if (!preselected) return null;
                    const isAvailable = isSitterAvailableForWindow(preselected);
                    return (
                      <div
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${isAvailable ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800" : "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"}`}
                        data-ocid="booking.preselect_sitter.banner"
                      >
                        {preselected.photoUrl ? (
                          <img
                            src={preselected.photoUrl}
                            alt={preselected.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary-foreground">
                              {preselected.name?.[0] ?? "?"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold leading-tight ${isAvailable ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}
                          >
                            {isAvailable
                              ? `${preselected.name} is available for this time!`
                              : `${preselected.name} isn't available for this window`}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${isAvailable ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            {isAvailable
                              ? "Select them below to continue."
                              : "Choose another sitter or try a different time."}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                {sortedSitters.length === 0 ? (
                  <div
                    data-ocid="sitter_grid.empty_state"
                    className="text-center py-12 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <PawPrint
                        size={28}
                        className="text-muted-foreground/50"
                      />
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold">
                        No sitters available for this time
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try a different time window — a sitter is waiting for
                        you! 🐾
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWindowSearched(false);
                        setStep(0);
                      }}
                      className="rounded-full"
                    >
                      <ArrowLeft size={15} className="mr-1" /> Change Date &amp;
                      Time
                    </Button>
                  </div>
                ) : (
                  <div
                    data-ocid="sitter_grid.list"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {sortedSitters.map((s) => {
                      const timeAvail = isSitterAvailableForWindow(s);
                      const offersService = sitterOffersServices(s);
                      const avail = timeAvail && offersService;
                      const unavailableReason = !offersService
                        ? "Service not offered"
                        : !timeAvail
                          ? "Not available this time"
                          : undefined;
                      return (
                        <AvailableSitterCard
                          key={s.id.toString()}
                          sitter={s}
                          availabilityEntries={
                            filteredAvailMap[s.id.toString()] ?? []
                          }
                          isSelected={selectedSitterIds.includes(s.id)}
                          isAvailable={avail}
                          unavailableReason={unavailableReason}
                          onSelect={() => handleSelectSitter(s.id)}
                          justSelected={justSelectedSitterId === s.id}
                          selectedServices={selectedServices}
                          credentialChecklist={
                            s.id === sitterId ? primaryCredentials : undefined
                          }
                        />
                      );
                    })}
                  </div>
                )}

                {/* Multi-sitter selection summary + Next CTA */}
                {sortedSitters.length > 0 && selectedSitterIds.length > 0 && (
                  <div
                    data-ocid="sitter_grid.selection_summary"
                    className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Check size={14} className="text-primary shrink-0" />
                          {selectedSitterIds.length === 1
                            ? "1 sitter selected"
                            : `${selectedSitterIds.length} sitters selected`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {selectedSitterIds
                            .map(
                              (id) =>
                                allActiveSitters.find((s) => s.id === id)
                                  ?.name ?? `Sitter #${id}`,
                            )
                            .join(" & ")}
                        </p>
                      </div>
                      <Button
                        data-ocid="sitter_grid.confirm_selection.button"
                        onClick={handleProceedFromSitterStep}
                        disabled={!canNext()}
                        className="rounded-xl font-bold shrink-0"
                      >
                        Continue
                        <ArrowRight size={15} className="ml-1.5" />
                      </Button>
                    </div>
                    {selectedSitterIds.length > 1 && (
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">
                        Each selected sitter has been verified as available for
                        your date, time, and service selections.
                      </p>
                    )}
                  </div>
                )}

                {sortedSitters.length > 0 && selectedSitterIds.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Tap an available sitter to select them. You can pick more
                    than one.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 2: Pets ─────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    Your Pets 🐾
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Add all pets that need care
                  </p>
                </div>

                {/* Pet suitability notice */}
                <div className="flex gap-3 p-3 sm:p-4 rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500/40">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Pet Suitability Requirement
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Your pet must be suitable for pet sitting. Pets that are
                      aggressive, dangerous, or have behavioral issues that may
                      harm the sitter or other animals are not eligible for our
                      services. By proceeding, you confirm your pet is safe,
                      well-behaved, and appropriate for the care requested.
                    </p>
                  </div>
                </div>

                {/* Selected sitter reminder */}
                {activeSitterForDisplay && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      {activeSitterForDisplay?.photoUrl ? (
                        <img
                          src={activeSitterForDisplay?.photoUrl}
                          alt={activeSitterForDisplay?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-sm">
                            {activeSitterForDisplay?.name?.[0] ?? "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        Your sitter
                      </p>
                      <p className="font-semibold text-sm truncate">
                        {activeSitterForDisplay?.name ?? "Your sitter"}
                      </p>
                    </div>
                    <span className="text-xs text-primary font-semibold shrink-0">
                      {windowDate
                        ? new Date(`${windowDate}T12:00:00`).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : ""}
                    </span>
                  </div>
                )}

                {/* Professional Credentials — shown when primary sitter has any checked */}
                {primaryCredentials &&
                  (() => {
                    const checked = CREDENTIAL_ITEMS.filter(
                      (item) => primaryCredentials[item.key] === true,
                    );
                    if (checked.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground italic">
                          No professional credentials listed.
                        </p>
                      );
                    }
                    return (
                      <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 space-y-2">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1.5">
                          Professional Credentials
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {checked.map((item) => {
                            const Icon =
                              CREDENTIAL_ICON_MAP[item.icon] ?? ShieldCheck;
                            return (
                              <span
                                key={item.key}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              >
                                <Icon size={10} />
                                {item.shortLabel}
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-amber-400/70 leading-relaxed">
                          Self-reported by the sitter. Pawspect does not verify
                          these credentials.
                        </p>
                      </div>
                    );
                  })()}

                {/* ── Security / location notice ──────────────────────────── */}
                <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700/40">
                  <ShieldCheck
                    size={16}
                    className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Your sitter and you will arrange the appropriate location
                    and access details outside of this app for your security.
                  </p>
                </div>

                {/* ── Returning-client pet suggestion banner ──────────────── */}
                {!petSuggestDismissed &&
                  !isRebookMode &&
                  completedBookings.length > 0 &&
                  (() => {
                    const lastPets = completedBookings[0]?.pets ?? [];
                    if (lastPets.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground italic">
                          No pets found in your last booking.
                        </p>
                      );
                    }
                    const petNames = lastPets
                      .map((p) => p.petName)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div
                        data-ocid="booking.pet_suggest_banner"
                        className="flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-700/50 p-3 shadow-sm"
                      >
                        <PawPrint
                          size={16}
                          className="text-indigo-500 shrink-0 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 leading-snug">
                            Use your pets from last time?
                          </p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {petNames}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            data-ocid="booking.pet_suggest.accept_button"
                            onClick={() => {
                              const fromPets = lastPets.map((p, i) => ({
                                _id: i,
                                petName: p.petName,
                                petType: p.petType,
                                breed: p.breed ?? "",
                                petNotes: p.petNotes ?? "",
                              }));
                              petIdCounter.current = fromPets.length;
                              setPets(fromPets);
                              setPetSuggestDismissed(true);
                              toast.success(
                                "Pets pre-filled from your last booking!",
                              );
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors min-h-[36px]"
                          >
                            Yes, use these
                          </button>
                          <button
                            type="button"
                            data-ocid="booking.pet_suggest.dismiss_button"
                            onClick={() => setPetSuggestDismissed(true)}
                            className="text-indigo-400 hover:text-indigo-600 rounded-full p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
                            aria-label="Dismiss"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                {/* ── Rebook pets confirmation banner ─────────────────────── */}
                {isRebookMode &&
                  prebookState?.prebookPets &&
                  prebookState.prebookPets.length > 0 && (
                    <div
                      data-ocid="booking.rebook_pets_banner"
                      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700/50 p-3"
                    >
                      <Check
                        size={15}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0"
                      />
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium flex-1 min-w-0">
                        Pets pre-filled:{" "}
                        <span className="font-semibold">
                          {prebookState.prebookPets
                            .map((p) => p.petName)
                            .join(", ")}
                        </span>{" "}
                        — adjust below if needed.
                      </p>
                    </div>
                  )}

                {/* ── Phase 9: Contact-step pet prefill notice ─────────────── */}
                {!isRebookMode &&
                  contactPetFilledRef.current &&
                  !petSuggestDismissed &&
                  pets.some((p) => p.petName) && (
                    <div
                      data-ocid="booking.contact_pet_prefill.banner"
                      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600/40 p-3"
                    >
                      <PawPrint
                        size={15}
                        className="text-amber-600 dark:text-amber-400 shrink-0"
                      />
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex-1 min-w-0">
                        Pets from your last booking —{" "}
                        <span className="font-semibold">
                          {pets
                            .filter((p) => p.petName)
                            .map((p) => p.petName)
                            .join(", ")}
                        </span>{" "}
                        — edit as needed below.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPetSuggestDismissed(true)}
                        className="shrink-0 text-amber-400 hover:text-amber-600 rounded-full p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                        aria-label="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                {pets.map((pet, idx) => (
                  <div
                    key={pet._id}
                    className="border border-border rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {pet.petName || `Pet ${idx + 1}`}
                        {pet.petType && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {pet.petType}
                          </span>
                        )}
                      </p>
                      {pets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePet(idx)}
                          className="text-destructive hover:bg-destructive/10 rounded-full p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Name *</Label>
                        <Input
                          value={pet.petName}
                          onChange={(e) =>
                            updatePet(idx, "petName", e.target.value)
                          }
                          placeholder="e.g. Buddy"
                          className="rounded-lg h-11"
                          data-ocid="booking.pet_name.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Type *</Label>
                        <Select
                          value={pet.petType}
                          onValueChange={(v: string) =>
                            updatePet(idx, "petType", v)
                          }
                        >
                          <SelectTrigger
                            className="rounded-lg h-11"
                            data-ocid="booking.pet_type.select"
                          >
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PET_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Breed (optional)
                        </Label>
                        <Input
                          value={pet.breed}
                          onChange={(e) =>
                            updatePet(idx, "breed", e.target.value)
                          }
                          placeholder="e.g. Golden Retriever"
                          className="rounded-lg h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Notes (optional)
                        </Label>
                        <Input
                          value={pet.petNotes}
                          onChange={(e) =>
                            updatePet(idx, "petNotes", e.target.value)
                          }
                          placeholder="e.g. needs medication"
                          className="rounded-lg h-11"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {addingPet ? (
                  <div className="border border-dashed border-primary/40 rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-sm">New Pet</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Name *</Label>
                        <Input
                          value={newPet.petName}
                          onChange={(e) =>
                            setNewPet((p) => ({
                              ...p,
                              petName: e.target.value,
                            }))
                          }
                          placeholder="e.g. Luna"
                          className="rounded-lg h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Type *</Label>
                        <Select
                          value={newPet.petType}
                          onValueChange={(v: string) =>
                            setNewPet((p) => ({ ...p, petType: v }))
                          }
                        >
                          <SelectTrigger className="rounded-lg h-11">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PET_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Breed (optional)
                        </Label>
                        <Input
                          value={newPet.breed}
                          onChange={(e) =>
                            setNewPet((p) => ({
                              ...p,
                              breed: e.target.value,
                            }))
                          }
                          placeholder="Breed..."
                          className="rounded-lg h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Notes (optional)
                        </Label>
                        <Input
                          value={newPet.petNotes}
                          onChange={(e) =>
                            setNewPet((p) => ({
                              ...p,
                              petNotes: e.target.value,
                            }))
                          }
                          placeholder="Notes..."
                          className="rounded-lg h-11"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="rounded-full bg-primary text-primary-foreground"
                        onClick={addNewPet}
                        disabled={!newPet.petName || !newPet.petType}
                      >
                        <Check size={14} className="mr-1" /> Add Pet
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => setAddingPet(false)}
                      >
                        <X size={14} className="mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5"
                    onClick={() => setAddingPet(true)}
                  >
                    <Plus size={16} className="mr-2" /> Add Another Pet
                  </Button>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Special Instructions
                  </Label>
                  <Textarea
                    data-ocid="booking.notes.textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dietary needs, medications, favourite toys..."
                    className="rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                {/* Service location */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Service Location
                  </Label>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setServiceLocation("onsite")}
                      data-ocid="booking.onsite.toggle"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors min-h-[48px]",
                        serviceLocation === "onsite"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Home size={16} />
                      At My Home
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceLocation("pickup")}
                      data-ocid="booking.pickup.toggle"
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-l border-border min-h-[48px]",
                        serviceLocation === "pickup"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Car size={16} />
                      Sitter Picks Up
                    </button>
                  </div>
                </div>

                {/* Scheduler (multi-day / slots) */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">
                      Schedule &amp; Services
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add services for each day. Times pre-filled from your
                      chosen window.
                    </p>
                  </div>

                  {/* For one-time non-recurring bookings: show the date as read-only instead
                    of asking the client to pick it again (they already picked it in Step 0). */}
                  {!isRecurring ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <CalendarDays
                        size={15}
                        className="text-primary shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">
                          Service Date
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {startDate
                            ? new Date(
                                `${startDate}T12:00:00`,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : windowDate
                              ? new Date(
                                  `${windowDate}T12:00:00`,
                                ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                        </p>
                        {(windowStartTime || startTime) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {TIME_OPTIONS.find(
                              (o) => o.value === (windowStartTime || startTime),
                            )?.label ??
                              (windowStartTime || startTime)}
                            {" – "}
                            {TIME_OPTIONS.find(
                              (o) => o.value === (windowEndTime || endTime),
                            )?.label ??
                              (windowEndTime || endTime)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="ml-auto text-xs text-primary font-semibold hover:opacity-80 shrink-0 min-h-[36px] px-2"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    /* Multi-day: show start/end date pickers */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden hover:border-primary/40">
                        <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CalendarDays size={12} className="text-primary" />
                          </div>
                          <span className="text-xs font-semibold">
                            Start Date
                          </span>
                        </div>
                        <div className="px-3 pb-3">
                          <DatePicker
                            value={startDate}
                            onChange={(iso) => {
                              setStartDate(iso);
                              if (endDate && endDate < iso) setEndDate("");
                              setServiceSchedule([]);
                            }}
                            placeholder="Pick start date"
                            disabled={(d) => d < today}
                            ocid="booking.start_date.button"
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border-2 border-border bg-card shadow-sm overflow-hidden hover:border-primary/40">
                        <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CalendarDays size={12} className="text-primary" />
                          </div>
                          <span className="text-xs font-semibold">
                            End Date
                          </span>
                        </div>
                        <div className="px-3 pb-3">
                          <DatePicker
                            value={endDate}
                            onChange={(iso) => {
                              setEndDate(iso);
                              setServiceSchedule([]);
                            }}
                            placeholder="Pick end date"
                            disabled={(d) => {
                              if (d < today) return true;
                              if (
                                startDate &&
                                d < new Date(`${startDate}T12:00:00`)
                              )
                                return true;
                              return false;
                            }}
                            ocid="booking.end_date.button"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Use windowDate/today as fallback so the scheduler ALWAYS renders — never a blank screen */}
                  {activeSitterForDisplay ? (
                    (() => {
                      const today = new Date().toISOString().split("T")[0];
                      const sDate = startDate || windowDate || today;
                      const eDate = endDate || windowDate || today;
                      return (
                        <DayServiceScheduler
                          startDate={sDate}
                          endDate={eDate}
                          selectedServices={selectedServices}
                          selectedSitterIds={selectedSitterIds}
                          allSitters={allSitters as Public[]}
                          sitter={activeSitterForDisplay}
                          serviceSchedule={serviceSchedule}
                          onScheduleChange={setServiceSchedule}
                          availabilityBySitter={availabilityBySitter}
                          presetStartTime={windowStartTime}
                          presetEndTime={windowEndTime}
                        />
                      );
                    })()
                  ) : (
                    <div className="animate-pulse bg-muted rounded-lg h-32" />
                  )}

                  {/* Recurring */}
                  <div className="border border-border rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <RefreshCw size={15} className="text-primary" />{" "}
                          Recurring Booking
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Schedule this to repeat automatically
                        </p>
                      </div>
                      <Switch
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                      />
                    </div>
                    {isRecurring && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="space-y-2">
                          <Label>Repeat Every</Label>
                          <Select
                            value={recurrencePattern}
                            onValueChange={
                              setRecurrencePattern as (v: string) => void
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">
                                Every 2 Weeks
                              </SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Recurring Until (optional)</Label>
                          <DatePicker
                            value={recurrenceEndDate}
                            onChange={setRecurrenceEndDate}
                            placeholder="No end date"
                            disabled={(d) => d < today}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Safety net: if Step 2 reached but none of the data conditions matched, show error instead of blank */}
            {step === 2 &&
              !sitter &&
              !prebookState?.prebookSitter &&
              !isFromNewSitterSelectionFlow && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <p className="text-sm text-muted-foreground">
                    Something went wrong, please go back
                  </p>
                  <button
                    type="button"
                    className="text-sm text-primary underline"
                    onClick={() => setStep(0)}
                  >
                    Go back
                  </button>
                </div>
              )}

            {/* ── STEP 3: Contact ──────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    Your Contact Info
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    No account needed. We'll use this to keep you updated.
                  </p>
                </div>

                {/* ── Returning client "Welcome back!" banner ────────────── */}
                {!contactMatchDismissed &&
                  !contactMatchConflict &&
                  contactMatchBookings &&
                  contactMatchBookings.length > 0 && (
                    <div
                      data-ocid="contact.returning_client.banner"
                      className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600/40 p-4 shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                        <Sparkles
                          size={17}
                          className="text-amber-600 dark:text-amber-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm leading-snug">
                          Welcome back
                          {contactMatchBookings[0].clientName
                            ? `, ${contactMatchBookings[0].clientName}`
                            : ""}
                          !
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                          We found your previous booking
                          {contactMatchSource === "email"
                            ? " by email"
                            : " by phone"}
                          . Your details have been pre-filled — edit anything
                          that's changed.
                          {contactPetFilledRef.current &&
                            " Your pets have also been pre-filled from your last booking."}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-ocid="contact.returning_client.dismiss_button"
                        onClick={() => {
                          setContactMatchDismissed(true);
                          contactAutoAppliedRef.current = false;
                        }}
                        className="shrink-0 text-amber-500 hover:text-amber-700 rounded-full p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
                        aria-label="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                {/* ── Conflict warning: two different clients matched ─────── */}
                {contactMatchConflict && (
                  <div
                    data-ocid="contact.identity_conflict.banner"
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <AlertCircle
                      size={16}
                      className="text-destructive shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-destructive leading-snug">
                        We couldn't verify your identity
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        The email and phone number you entered match two
                        different accounts. Please confirm your details below —
                        we'll use exactly what you provide.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Lookup loading indicator ────────────────────────────── */}
                {contactLookupFetching && !contactMatchDismissed && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <Loader2 size={12} className="animate-spin" />
                    Checking for a returning account…
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cname" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    data-ocid="booking.name.input"
                    id="cname"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Smith"
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cemail" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    data-ocid="booking.email.input"
                    id="cemail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    onBlur={(e) => {
                      const val = e.target.value.trim().toLowerCase();
                      if (val.includes("@") && val.length > 4) {
                        setContactEmailKey(val);
                        setContactMatchDismissed(false);
                        contactAutoAppliedRef.current = false;
                      }
                    }}
                    placeholder="jane@example.com"
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cphone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    data-ocid="booking.phone.input"
                    id="cphone"
                    type="tel"
                    inputMode="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    onBlur={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const normalized =
                        digits.length === 11 && digits.startsWith("1")
                          ? digits.slice(1)
                          : digits;
                      if (normalized.length >= 10) {
                        setContactPhoneKey(e.target.value);
                        setContactMatchDismissed(false);
                        contactAutoAppliedRef.current = false;
                      }
                    }}
                    placeholder="(555) 000-0000"
                    className="rounded-xl h-12"
                  />
                  {clientPhone && normalizePhone(clientPhone).length < 10 && (
                    <p className="text-xs text-destructive mt-1">
                      Enter a valid 10-digit phone number
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to track your bookings and allow your sitter to reach
                    you.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ───────────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    Review Your Booking
                  </h2>
                  {isRecurring && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <Repeat size={12} /> Recurring Booking
                    </span>
                  )}
                </div>

                {/* Recurring summary */}
                {isRecurring && recurringOccurrenceDates.length > 0 && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                    <p className="text-sm font-semibold text-primary">
                      {recurrencePattern.charAt(0).toUpperCase() +
                        recurrencePattern.slice(1)}{" "}
                      schedule · {recurringOccurrenceDates.length} sessions
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {recurringOccurrenceDates.map((iso, idx) => {
                        const dateLabel = new Date(
                          `${iso}T12:00:00`,
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                        const startLabel =
                          TIME_OPTIONS.find((o) => o.value === windowStartTime)
                            ?.label ?? windowStartTime;
                        const endLabel =
                          TIME_OPTIONS.find((o) => o.value === windowEndTime)
                            ?.label ?? windowEndTime;
                        return (
                          <div
                            key={iso}
                            className="flex items-center gap-2 text-xs text-foreground"
                          >
                            <span className="text-muted-foreground w-5 shrink-0">
                              {idx + 1}.
                            </span>
                            <span>{dateLabel}</span>
                            <span className="text-muted-foreground">
                              · {startLabel} – {endLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimated total: ${(() => {
                        const s =
                          (allSitters as Public[]).find((x) =>
                            selectedSitterIds.includes(x.id),
                          ) ?? sitter;
                        const rate = Number(
                          s?.serviceRates?.find((r) =>
                            selectedServices.includes(r.service),
                          )?.ratePerHour ??
                            s?.hourlyRate ??
                            0,
                        );
                        const [sh, sm] = windowStartTime.split(":").map(Number);
                        const [eh, em] = windowEndTime.split(":").map(Number);
                        const durationHours =
                          Math.max(0, eh * 60 + em - (sh * 60 + (sm || 0))) /
                          60;
                        return (
                          rate *
                          durationHours *
                          recurringOccurrenceDates.length
                        ).toFixed(2);
                      })()}
                    </p>
                  </div>
                )}

                {/* One-tap rebook confirmation banner */}
                {isRebookMode &&
                  !!clientName &&
                  !!clientEmail &&
                  normalizePhone(clientPhone).length >= 10 &&
                  validPets.length > 0 && (
                    <div
                      data-ocid="booking.rebook_ready_banner"
                      className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-700/50 p-4 shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <Sparkles
                          size={18}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm leading-snug">
                          Everything looks good — you&apos;re all set!
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                          Your details are pre-filled from your previous
                          booking. Just agree below and confirm with one tap. 🐾
                        </p>
                      </div>
                    </div>
                  )}

                {/* Booking summary */}
                <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm">
                  {[
                    [
                      "Sitter",
                      `${activeSitterForDisplay?.name}${selectedSitterIds.length > 1 ? ` + ${selectedSitterIds.length - 1} more` : ""}`,
                    ],
                    [
                      "Service",
                      isMeetAndGreet
                        ? MEET_AND_GREET.name
                        : selectedServices.join(", ") || "Not specified",
                    ],
                    [
                      "Date & Time",
                      `${windowDate ? new Date(`${windowDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : startDate ? format(new Date(`${startDate}T${startTime}`), "MMM d, yyyy h:mm a") : "—"} ${windowStartTime && windowDate ? `· ${TIME_OPTIONS.find((o) => o.value === windowStartTime)?.label ?? windowStartTime}–${TIME_OPTIONS.find((o) => o.value === windowEndTime)?.label ?? windowEndTime}` : ""}`,
                    ],
                    [
                      "Recurring",
                      isRecurring ? `Yes, ${recurrencePattern}` : "One-time",
                    ],
                    [
                      "Pets",
                      validPets
                        .map((p) => `${p.petName} (${p.petType})`)
                        .join(", "),
                    ],
                    ["Contact", `${clientName} · ${clientEmail}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-3 min-w-0"
                    >
                      <span className="text-muted-foreground shrink-0">
                        {label}
                      </span>
                      <span className="font-medium text-right min-w-0 break-words">
                        {value}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Price breakdown</span>
                      <span>
                        ${billedRate}/hr × {(() => {
                          const totalMins = Math.round(billedHours * 60);
                          if (totalMins < 60) return `${totalMins} min`;
                          const hrs = totalMins / 60;
                          return hrs === 1
                            ? "1 hr"
                            : `${hrs % 1 === 0 ? hrs : hrs.toFixed(2)} hrs`;
                        })()}
                        {billedSitterCount > 1
                          ? ` × ${billedSitterCount} sitters`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="font-bold">Estimated Total</span>
                      <span className="font-bold text-primary">
                        ${Number(totalCost).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security reassurance */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                    Your booking is secure and handled with care. All services
                    are agreed directly with your sitter.
                  </p>
                </div>

                {/* THREE required checkboxes */}
                <div className="space-y-3">
                  {/* Accept All Agreements button — GAP 6 */}
                  <button
                    type="button"
                    data-ocid="booking.accept_all_button"
                    onClick={() => {
                      setAgreedToTerms(true);
                      setAgreedToPrivacy(true);
                      setAgreedToCommunications(true);
                      setAgreedToCancellation(true);
                      setAgreementFlag("terms", true);
                      setAgreementFlag("privacy", true);
                      setAgreementFlag("communications", true);
                      setAgreementFlag("cancellationPolicy", true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-sm transition-all"
                  >
                    <Check size={16} className="shrink-0" />✓ Accept All
                    Agreements
                  </button>
                  <p className="text-xs text-muted-foreground/70 text-center -mt-1">
                    Or review and check each item individually:
                  </p>

                  {/* T&C */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                    <input
                      id="booking-terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        setAgreementFlag("terms", e.target.checked);
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-border accent-primary cursor-pointer shrink-0"
                      data-ocid="booking.terms_checkbox"
                    />
                    <label
                      htmlFor="booking-terms"
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      I agree to {APP_NAME}&apos;s{" "}
                      <button
                        type="button"
                        onClick={() => setLegalModal("terms")}
                        className="text-primary underline hover:text-primary/80 transition-colors"
                      >
                        Terms &amp; Conditions
                      </button>{" "}
                      <span className="text-destructive font-semibold">*</span>
                      {!agreedToTerms && (
                        <span className="text-muted-foreground/60 text-xs ml-1">
                          (click to read)
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Privacy */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                    <input
                      id="booking-privacy"
                      type="checkbox"
                      checked={agreedToPrivacy}
                      onChange={(e) => {
                        setAgreedToPrivacy(e.target.checked);
                        setAgreementFlag("privacy", e.target.checked);
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-border accent-primary cursor-pointer shrink-0"
                      data-ocid="booking.privacy_checkbox"
                    />
                    <label
                      htmlFor="booking-privacy"
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      I agree to {APP_NAME}&apos;s{" "}
                      <button
                        type="button"
                        onClick={() => setLegalModal("privacy")}
                        className="text-primary underline hover:text-primary/80 transition-colors"
                      >
                        Privacy Policy
                      </button>{" "}
                      <span className="text-destructive font-semibold">*</span>
                      {!agreedToPrivacy && (
                        <span className="text-muted-foreground/60 text-xs ml-1">
                          (click to read)
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Communications consent — GAP 2: now required */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                    <input
                      id="booking-communications"
                      type="checkbox"
                      checked={agreedToCommunications}
                      onChange={(e) => {
                        setAgreedToCommunications(e.target.checked);
                        setAgreementFlag("communications", e.target.checked);
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-border accent-primary cursor-pointer shrink-0"
                      data-ocid="booking.communications_checkbox"
                    />
                    <label
                      htmlFor="booking-communications"
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      I agree to receive booking confirmations, reminders, and
                      service updates from my sitter and {APP_NAME}.{" "}
                      <span className="text-destructive font-semibold">
                        (Required)
                      </span>
                    </label>
                  </div>

                  {/* Cancellation policy — GAP 4: new required checkbox */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                    <input
                      id="booking-cancellation"
                      type="checkbox"
                      checked={agreedToCancellation}
                      onChange={(e) => {
                        setAgreedToCancellation(e.target.checked);
                        setAgreementFlag(
                          "cancellationPolicy",
                          e.target.checked,
                        );
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-border accent-primary cursor-pointer shrink-0"
                      data-ocid="booking.cancellation_checkbox"
                    />
                    <label
                      htmlFor="booking-cancellation"
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
                    >
                      I understand and agree to {APP_NAME}&apos;s cancellation
                      policy. Cancellations affect invoice totals per sitter
                      discretion.{" "}
                      <span className="text-destructive font-semibold">
                        (Required)
                      </span>
                    </label>
                  </div>

                  {/* Call request — optional */}
                  <div
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      callRequestChecked
                        ? "bg-amber-500/10 border-amber-400/40"
                        : "bg-muted/40 border-border"
                    }`}
                  >
                    <input
                      id="booking-call-request"
                      type="checkbox"
                      checked={callRequestChecked}
                      onChange={(e) => {
                        setCallRequestChecked(e.target.checked);
                        setAgreementFlag("callRequest", e.target.checked);
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-border accent-amber-500 cursor-pointer shrink-0"
                      data-ocid="booking.call_request_checkbox"
                    />
                    <label
                      htmlFor="booking-call-request"
                      className="cursor-pointer select-none"
                    >
                      <span className="text-sm text-foreground leading-relaxed font-medium block">
                        Please call me to discuss this booking before confirming
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        Your sitter will be notified to contact you before
                        accepting
                      </span>
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground/70 px-1">
                    {APP_NAME} is a marketplace platform only. All liability and
                    contractual responsibility is between the sitter and client.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 5: Success ──────────────────────────────────────────── */}
            {step === 5 && confirmedBooking && (
              <div data-ocid="booking.success_state">
                {/* CSS keyframes for the celebration */}
                <style>{`
                @keyframes confettiFall {
                  0%   { transform: translateY(-20px) rotate(0deg) scale(0.8); opacity: 1; }
                  100% { transform: translateY(110vh) rotate(720deg) scale(1.1); opacity: 0; }
                }
                @keyframes pawFloat {
                  0%   { transform: translateY(0) scale(1); opacity: 0.9; }
                  50%  { transform: translateY(-32px) scale(1.15) rotate(-8deg); opacity: 1; }
                  100% { transform: translateY(-80px) scale(0.7); opacity: 0; }
                }
                @keyframes heroScaleIn {
                  0%   { transform: scale(0.6) translateY(20px); opacity: 0; }
                  70%  { transform: scale(1.05) translateY(-4px); opacity: 1; }
                  100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes cardSlideUp {
                  0%   { transform: translateY(40px); opacity: 0; }
                  100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes buttonsFadeIn {
                  0%   { opacity: 0; transform: translateY(16px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes checkBounce {
                  0%   { transform: scale(0); opacity: 0; }
                  55%  { transform: scale(1.25); opacity: 1; }
                  75%  { transform: scale(0.9); }
                  100% { transform: scale(1); }
                }
              `}</style>

                {/* Full-screen celebration wrapper */}
                <div className="relative min-h-[70dvh] flex flex-col items-center justify-center overflow-hidden py-8 px-4">
                  {/* Confetti particles — pure CSS, brand colors */}
                  {[
                    {
                      color: "oklch(0.72 0.18 55)",
                      left: "12%",
                      delay: "0s",
                      dur: "2.8s",
                      size: 10,
                    },
                    {
                      color: "oklch(0.55 0.18 255)",
                      left: "25%",
                      delay: "0.15s",
                      dur: "3.1s",
                      size: 8,
                    },
                    {
                      color: "oklch(0.78 0.20 45)",
                      left: "38%",
                      delay: "0.3s",
                      dur: "2.6s",
                      size: 12,
                    },
                    {
                      color: "oklch(0.72 0.18 55)",
                      left: "52%",
                      delay: "0.05s",
                      dur: "3.4s",
                      size: 7,
                    },
                    {
                      color: "oklch(0.85 0.12 75)",
                      left: "65%",
                      delay: "0.45s",
                      dur: "2.9s",
                      size: 9,
                    },
                    {
                      color: "oklch(0.55 0.18 255)",
                      left: "78%",
                      delay: "0.2s",
                      dur: "3.2s",
                      size: 11,
                    },
                    {
                      color: "oklch(0.72 0.18 55)",
                      left: "88%",
                      delay: "0.6s",
                      dur: "2.7s",
                      size: 8,
                    },
                    {
                      color: "oklch(0.78 0.20 45)",
                      left: "6%",
                      delay: "0.35s",
                      dur: "3.0s",
                      size: 10,
                    },
                    {
                      color: "oklch(0.85 0.12 75)",
                      left: "44%",
                      delay: "0.55s",
                      dur: "2.5s",
                      size: 13,
                    },
                    {
                      color: "oklch(0.55 0.18 255)",
                      left: "58%",
                      delay: "0.1s",
                      dur: "3.3s",
                      size: 9,
                    },
                    {
                      color: "oklch(0.72 0.18 55)",
                      left: "72%",
                      delay: "0.7s",
                      dur: "2.8s",
                      size: 7,
                    },
                    {
                      color: "oklch(0.78 0.20 45)",
                      left: "18%",
                      delay: "0.4s",
                      dur: "3.1s",
                      size: 11,
                    },
                  ].map((c, i) => (
                    <div
                      key={`confetti-${i}`}
                      className="fixed pointer-events-none z-50"
                      style={{
                        left: c.left,
                        top: "-16px",
                        width: c.size,
                        height: c.size * 1.6,
                        borderRadius: "2px",
                        background: c.color,
                        animation: `confettiFall ${c.dur} ${c.delay} cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                      }}
                    />
                  ))}

                  {/* Floating paw prints from bottom */}
                  {[
                    { left: "15%", delay: "0.4s", size: 28 },
                    { left: "50%", delay: "0.7s", size: 22 },
                    { left: "82%", delay: "0.2s", size: 26 },
                  ].map((p, i) => (
                    <div
                      key={`paw-${i}`}
                      className="fixed bottom-16 pointer-events-none z-40"
                      style={{
                        left: p.left,
                        animation: `pawFloat 2.4s ${p.delay} ease-out both`,
                        color: "oklch(0.72 0.18 55 / 0.65)",
                      }}
                    >
                      <PawPrint size={p.size} />
                    </div>
                  ))}

                  {/* Hero checkmark */}
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.45 0.16 255), oklch(0.55 0.20 285))",
                      animation:
                        "heroScaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
                    }}
                  >
                    <div
                      style={{
                        animation:
                          "checkBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both",
                      }}
                    >
                      <Check size={48} className="text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Hero text */}
                  <div
                    className="text-center mb-6"
                    style={{ animation: "heroScaleIn 0.5s ease-out 0.3s both" }}
                  >
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mb-2">
                      {isMeetAndGreet
                        ? `${MEET_AND_GREET.name} Scheduled! 🤝`
                        : "Booking Confirmed! 🐾"}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {isMeetAndGreet
                        ? `Your free intro visit with ${activeSitterForDisplay?.name} is set.`
                        : confirmedBooking.clientName
                          ? `${activeSitterForDisplay?.name} is all set for ${confirmedBooking.clientName}'s pets!`
                          : `${activeSitterForDisplay?.name} will take great care of your pets.`}
                    </p>
                  </div>

                  {/* Booking summary card — slides up */}
                  <div
                    className="w-full max-w-sm mx-auto mb-6"
                    style={{
                      animation: "cardSlideUp 0.5s ease-out 0.55s both",
                    }}
                  >
                    <div
                      className="rounded-2xl p-5 border shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.45 0.16 255 / 0.08), oklch(0.72 0.18 55 / 0.05))",
                        borderColor: "oklch(0.45 0.16 255 / 0.2)",
                      }}
                    >
                      {/* Sitter row */}
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          {activeSitterForDisplay?.photoUrl ? (
                            <img
                              src={activeSitterForDisplay?.photoUrl}
                              alt={activeSitterForDisplay?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-violet-700 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {activeSitterForDisplay?.name?.[0] ?? "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {activeSitterForDisplay?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Your confirmed sitter
                          </p>
                        </div>
                        <div className="ml-auto shrink-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Check size={15} className="text-emerald-600" />
                          </div>
                        </div>
                      </div>

                      {/* Booking ref + details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Booking #
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-primary text-base">
                              {confirmedBooking.id.toString()}
                            </span>
                            <button
                              type="button"
                              data-ocid="confirmation.copy.button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  confirmedBooking.id.toString(),
                                );
                                toast.success("Booking ID copied!");
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Copy booking ID"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <StatusBadge
                            status={confirmedBooking.status as string}
                          />
                        </div>
                        {confirmedBooking.pets &&
                          confirmedBooking.pets.length > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Pets
                              </span>
                              <span className="font-medium text-right">
                                {confirmedBooking.pets
                                  .map((p) => p.petName)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        {confirmedBooking.services?.length > 0 && (
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">
                              Services
                            </span>
                            <span className="font-medium text-right text-xs">
                              {confirmedBooking.services
                                .slice(0, 3)
                                .join(" · ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mb-6 px-4">
                    A confirmation email is on its way! Save your Booking ID to
                    track status anytime.
                  </p>

                  {/* Action buttons — fade in last */}
                  <div
                    className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm mx-auto"
                    style={{
                      animation: "buttonsFadeIn 0.5s ease-out 0.8s both",
                    }}
                  >
                    <AddToCalendar
                      title={`Pet Care — ${confirmedBooking.pets?.map((p) => p.petName).join(", ") ?? "Pets"} with ${activeSitterForDisplay?.name}`}
                      startDate={confirmedBooking.startDate}
                      endDate={confirmedBooking.endDate}
                      description={`Booked via ${APP_NAME}. Services: ${confirmedBooking.services?.join(", ") ?? ""}. Booking #${confirmedBooking.id}.`}
                      location="Service at home"
                      size="default"
                    />
                    <Button
                      data-ocid="confirmation.lookup.button"
                      variant="outline"
                      onClick={() => navigate("booking-lookup")}
                      className="rounded-full border-primary text-primary"
                    >
                      View My Booking
                    </Button>
                    <Button
                      data-ocid="confirmation.book_another.button"
                      variant="outline"
                      onClick={() => navigate("find-sitters")}
                      className="rounded-full border-border text-foreground hover:bg-muted"
                    >
                      Book Another Service
                    </Button>
                    <Button
                      data-ocid="confirmation.home.button"
                      onClick={() => navigate("home")}
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Inline navigation — desktop (md+) only ──────────────────── */}
            {step > 0 && step < 5 && (
              <div className="hidden md:flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-full border-border hover:bg-muted"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back
                </Button>
                {step < 4 ? (
                  <div className="flex flex-col items-end gap-1">
                    {step === 1 ? (
                      <>
                        <Button
                          data-ocid="booking.next.button"
                          onClick={handleProceedFromSitterStep}
                          disabled={!canNext()}
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          Continue{" "}
                          {selectedSitterIds.length > 1
                            ? `(${selectedSitterIds.length} sitters)`
                            : selectedSitterIds.length === 1
                              ? `with ${activeSitterForDisplay?.name}`
                              : ""}
                          <ArrowRight size={16} className="ml-1" />
                        </Button>
                        {selectedSitterIds.length === 0 && (
                          <p className="text-xs text-muted-foreground text-right">
                            Select at least one available sitter to continue
                          </p>
                        )}
                      </>
                    ) : (
                      <Button
                        data-ocid="booking.next.button"
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canNext()}
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Continue <ArrowRight size={16} className="ml-1" />
                      </Button>
                    )}
                    {step === 2 && hasAvailabilityConflict && (
                      <p className="text-xs text-destructive text-center">
                        One or more services are outside the sitter&apos;s
                        available hours.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1.5">
                    <Button
                      data-ocid="booking.submit_button"
                      onClick={handleSubmit}
                      disabled={createBooking.isPending || !canSubmitBooking}
                      className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-12 px-6"
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <PawPrint size={15} className="mr-1.5" />
                          Confirm Booking 🐾
                        </>
                      )}
                    </Button>
                    {!canSubmitBooking && (
                      <p className="text-xs text-muted-foreground text-right">
                        Please agree to all required terms above to continue
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile sticky cart bar (Step 2 - Pets) ─────────────────────── */}
        {step === 2 && (
          <MobileCartBar
            allSlots={allScheduledSlots}
            grandTotal={scheduleGrandTotal}
            bundleDiscount={scheduleBundleDiscount}
          />
        )}

        {/* ── Mobile sticky Continue/Submit bar ───────────────────────────── */}
        {step > 0 && step < 5 && (
          <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 px-4 py-3 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
            {step === 1 ? (
              /* Step 1: multi-sitter toggle — show summary or hint */
              selectedSitterIds.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground leading-none">
                      {selectedSitterIds.length === 1
                        ? "1 sitter selected"
                        : `${selectedSitterIds.length} sitters`}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedSitterIds
                        .map(
                          (id) =>
                            allActiveSitters.find((s) => s.id === id)?.name ??
                            `Sitter #${id}`,
                        )
                        .join(" & ")}
                    </p>
                  </div>
                  <Button
                    data-ocid="booking.next.button"
                    onClick={handleProceedFromSitterStep}
                    disabled={!canNext()}
                    className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 shrink-0 btn-press"
                  >
                    Continue <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Tap an available sitter to select — you can pick more than one
                </p>
              )
            ) : step === 4 ? (
              <Button
                data-ocid="booking.submit_button"
                onClick={handleSubmit}
                disabled={createBooking.isPending || !canSubmitBooking}
                className="w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base h-14 btn-press"
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : !canSubmitBooking ? (
                  <>
                    <PawPrint size={16} className="mr-2" />
                    Accept all required agreements to book
                  </>
                ) : (
                  <>
                    <PawPrint size={16} className="mr-2" />
                    Confirm Booking 🐾
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl border-border h-12 px-4 shrink-0"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  data-ocid="booking.next.button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="flex-1 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base h-12 btn-press"
                >
                  Continue <ArrowRight size={16} className="ml-1.5" />
                </Button>
              </div>
            )}
            {step === 2 && hasAvailabilityConflict && (
              <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-1.5">
                ⚠ Some services are outside sitter availability
              </p>
            )}
          </div>
        )}

        {/* Legal modals */}
        <LegalModal
          open={legalModal === "terms"}
          type="terms"
          onAgree={() => {
            setAgreedToTerms(true);
            setAgreementFlag("terms", true);
          }}
          onClose={() => setLegalModal(null)}
        />
        <LegalModal
          open={legalModal === "privacy"}
          type="privacy"
          onAgree={() => {
            setAgreedToPrivacy(true);
            setAgreementFlag("privacy", true);
          }}
          onClose={() => setLegalModal(null)}
        />

        {/* ── Rebook: Sitter Unavailable Modal ──────────────────────────────── */}
        {rebookUnavailableModal && (
          <div
            data-ocid="booking.rebook_unavailable.dialog"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
              onClick={() => setRebookUnavailableModal(null)}
            />
            {/* Glass panel */}
            <div className="relative w-full max-w-sm rounded-3xl border border-white/30 bg-white/80 dark:bg-indigo-950/80 backdrop-blur-xl shadow-2xl p-6 space-y-5 z-10 max-h-[90dvh] overflow-y-auto">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
                <AlertCircle
                  size={28}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              {/* Title */}
              <div className="text-center space-y-1.5">
                <h3 className="font-display font-bold text-lg text-foreground">
                  {rebookUnavailableModal.sitterNames.length === 1
                    ? `${rebookUnavailableModal.sitterNames[0]} isn't available`
                    : "Some sitters aren't available"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {rebookUnavailableModal.sitterNames.join(", ")}{" "}
                  {rebookUnavailableModal.sitterNames.length === 1
                    ? "is"
                    : "are"}{" "}
                  not available on{" "}
                  <strong>
                    {windowDate
                      ? new Date(`${windowDate}T12:00:00`).toLocaleDateString(
                          "en-US",
                          { weekday: "long", month: "long", day: "numeric" },
                        )
                      : "the selected date"}
                  </strong>
                  . Here&rsquo;s what you can do:
                </p>
              </div>
              {/* Actions */}
              <div className="space-y-2.5">
                <Button
                  data-ocid="booking.rebook_unavailable.pick_date_button"
                  onClick={() => {
                    // Go back to Step 0 and clear the date — keep other pre-fills
                    setWindowDate("");
                    setRebookUnavailableModal(null);
                  }}
                  className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-h-[48px]"
                >
                  <CalendarDays size={16} className="mr-2" />
                  Pick a different date
                </Button>
                <Button
                  data-ocid="booking.rebook_unavailable.any_sitter_button"
                  variant="outline"
                  onClick={() => {
                    // Clear rebook mode so any available sitter is shown
                    setIsRebookMode(false);
                    setRebookOriginalSitterIds([]);
                    setRebookUnavailableModal(null);
                    setStep(1);
                  }}
                  className="w-full rounded-2xl border-border font-semibold min-h-[48px]"
                >
                  <Search size={16} className="mr-2" />
                  Choose a different sitter
                </Button>
                <button
                  type="button"
                  data-ocid="booking.rebook_unavailable.cancel_button"
                  onClick={() => {
                    setRebookUnavailableModal(null);
                    navigate("booking-lookup");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 py-2 min-h-[44px]"
                >
                  Cancel — go back to my bookings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BookingErrorBoundary>
  );
}
