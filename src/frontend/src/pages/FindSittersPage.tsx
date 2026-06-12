import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Lock,
  MapPin,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "../App";
import type { Public } from "../backend.d";
import NoAvailabilityModal from "../components/booking/NoAvailabilityModal";
import { APP_NAME, SERVICES_LIST, zipToAreaName } from "../config/business";
import {
  type AlternativeSuggestion,
  useBookingDraft,
} from "../hooks/useBookingDraft";
import {
  useAvailableSittersForWindow,
  useGetSitterStats,
  useSitterExtendedPublic,
  useSittersNearZip,
} from "../hooks/useQueries";
import type { CredentialChecklist } from "../types/sitter-v2";
import { recordUncoveredZipSearch } from "../utils/coverageTracking";
import { getTimezoneForZip, tomorrowIsoForZip } from "../utils/zipTimezone";
import SitterDetailPage, { type PrebookState } from "./SitterDetailPage";

// ─── ZIP → lat/lng geocoding cache (module-level, browser-side only) ─────────

const zipLatLngCache = new Map<string, { lat: number; lng: number } | null>();

async function getLatLngForZip(
  zip: string,
): Promise<{ lat: number; lng: number } | null> {
  if (zipLatLngCache.has(zip)) return zipLatLngCache.get(zip) ?? null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) {
      zipLatLngCache.set(zip, null);
      return null;
    }
    const data = (await res.json()) as {
      places: Array<{ latitude: string; longitude: string }>;
    };
    const place = data.places?.[0];
    if (!place) {
      zipLatLngCache.set(zip, null);
      return null;
    }
    const result = {
      lat: Number.parseFloat(place.latitude),
      lng: Number.parseFloat(place.longitude),
    };
    zipLatLngCache.set(zip, result);
    return result;
  } catch {
    zipLatLngCache.set(zip, null);
    return null;
  }
}

function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Time window options ──────────────────────────────────────────────────────

interface TimeSlot {
  label: string;
  value: string;
  startHour: number; // 24h
  endHour: number;
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "Morning", value: "morning", startHour: 8, endHour: 12 },
  { label: "Afternoon", value: "afternoon", startHour: 12, endHour: 17 },
  { label: "Evening", value: "evening", startHour: 17, endHour: 21 },
];

const WINDOW_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hrs", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4+ hours", value: 240 },
];

// ─── Color palette (light mode) ───────────────────────────────────────────────

const L = {
  bg: "oklch(0.97 0.005 265)",
  fg: "oklch(0.15 0.02 265)",
  fgMuted: "oklch(0.50 0.03 265)",
  fgSubtle: "oklch(0.58 0.03 265)",
  card: "oklch(1 0 0)",
  cardBorder: "oklch(0.88 0.015 255 / 0.7)",
  amber: "oklch(0.72 0.18 55)",
  amberLight: "oklch(0.72 0.18 55 / 0.14)",
  amberBorder: "oklch(0.72 0.18 55 / 0.35)",
  blue: "oklch(0.55 0.18 255)",
  blueLight: "oklch(0.55 0.18 255 / 0.08)",
  blueBorder: "oklch(0.55 0.18 255 / 0.35)",
  green: "oklch(0.52 0.16 145)",
  greenLight: "oklch(0.52 0.16 145 / 0.10)",
  greenBorder: "oklch(0.52 0.16 145 / 0.35)",
  red: "oklch(0.50 0.18 27)",
  redLight: "oklch(0.50 0.18 27 / 0.08)",
  redBorder: "oklch(0.50 0.18 27 / 0.30)",
  inputBg: "oklch(0.97 0.005 265)",
  inputBorder: "oklch(0.82 0.02 265)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeSlotToStartTime(slotValue: string): string {
  const slot = TIME_SLOTS.find((s) => s.value === slotValue);
  if (!slot) return "";
  return `${slot.startHour.toString().padStart(2, "0")}:00`;
}

function timeSlotToEndTime(slotValue: string, windowMinutes: number): string {
  const slot = TIME_SLOTS.find((s) => s.value === slotValue);
  if (!slot) return "";
  const startMinutes = slot.startHour * 60;
  const endMinutes = startMinutes + windowMinutes;
  const h = Math.floor(endMinutes / 60);
  const m = endMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Client-side sitter eligibility check against criteria.
 * Returns true if the sitter is eligible for the given booking criteria.
 */
function isSitterEligible(
  sitter: Public,
  service: string | null,
  _date: string | null,
  _timeSlot: string,
  _windowMinutes: number | null,
): boolean {
  // Service check: sitter must offer the selected service
  if (service) {
    const offersService = sitter.services.some((s) =>
      s.toLowerCase().includes(service.toLowerCase()),
    );
    if (!offersService) return false;
  }
  // Accepting new clients check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const acceptingNew = (sitter as any).acceptingNewClients;
  if (acceptingNew !== undefined && acceptingNew === false) return false;

  return true;
}

/**
 * Generate alternative suggestions when no sitters are available.
 * Returns adjacent time slots and/or next-day suggestions.
 */
function generateAlternatives(
  allSitters: Public[],
  service: string | null,
  _date: string | null,
  currentSlot: string,
  windowMinutes: number | null,
  zip: string,
): AlternativeSuggestion[] {
  const suggestions: AlternativeSuggestion[] = [];
  const tomorrow = tomorrowIsoForZip(zip);
  const window = windowMinutes ?? 60;

  // Try adjacent time slots on the same or next day
  for (const slot of TIME_SLOTS) {
    if (slot.value === currentSlot) continue;
    const count = allSitters.filter((s) =>
      isSitterEligible(s, service, tomorrow, slot.value, window),
    ).length;
    if (count > 0) {
      suggestions.push({
        date: tomorrow,
        timeSlot: slot.value,
        timeWindow: window,
        service: service ?? "",
        availableCount: count,
        label: `${slot.label} tomorrow — ${count} sitter${count !== 1 ? "s" : ""} available`,
      });
    }
  }

  // If no nearby alternatives, suggest with a different window
  if (suggestions.length === 0) {
    for (const w of [60, 120, 180]) {
      if (w === window) continue;
      const count = allSitters.filter((s) =>
        isSitterEligible(s, service, tomorrow, currentSlot, w),
      ).length;
      if (count > 0) {
        const wLabel =
          WINDOW_OPTIONS.find((o) => o.value === w)?.label ?? `${w}m`;
        suggestions.push({
          date: tomorrow,
          timeSlot: currentSlot,
          timeWindow: w,
          service: service ?? "",
          availableCount: count,
          label: `${wLabel} tomorrow — ${count} sitter${count !== 1 ? "s" : ""} available`,
        });
        break;
      }
    }
  }

  return suggestions.slice(0, 4);
}

// ─── Availability status component ───────────────────────────────────────────

function AvailabilityStatus({
  count,
  isLoading,
  isCriteriaComplete,
}: {
  count: number;
  isLoading: boolean;
  isCriteriaComplete: boolean;
}) {
  if (!isCriteriaComplete) return null;

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
        style={{
          background: L.blueLight,
          borderColor: L.blueBorder,
          color: L.blue,
        }}
        data-ocid="find-sitters.availability.loading_state"
      >
        <Loader2 size={14} className="animate-spin shrink-0" />
        Checking sitter availability…
      </div>
    );
  }

  if (count === 0) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
        style={{
          background: L.redLight,
          borderColor: L.redBorder,
          color: L.red,
        }}
      >
        <AlertCircle size={14} className="shrink-0" />
        No sitters available for this selection
      </div>
    );
  }

  if (count === 1) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
        style={{
          background: "oklch(0.72 0.18 55 / 0.10)",
          borderColor: "oklch(0.72 0.18 55 / 0.35)",
          color: "oklch(0.45 0.16 55)",
        }}
      >
        <Users size={14} className="shrink-0" />1 sitter available — book soon!
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
      style={{
        background: L.greenLight,
        borderColor: L.greenBorder,
        color: L.green,
      }}
    >
      <CheckCircle2 size={14} className="shrink-0" />
      {count} sitters available
    </div>
  );
}

// ─── Credential badge pill ────────────────────────────────────────────────────

function CredBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border select-none"
      style={{
        background: "oklch(0.96 0.03 145 / 0.5)",
        borderColor: "oklch(0.52 0.16 145 / 0.30)",
        color: "oklch(0.36 0.12 145)",
      }}
    >
      <Check size={9} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ─── Sitter selection card ────────────────────────────────────────────────────

function SitterPickCard({
  sitter,
  isSelected,
  onToggle,
  index,
  clientZip,
}: {
  sitter: Public;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
  clientZip: string;
}) {
  const ratingNum = Number(sitter.rating);
  const reviewNum = Number(sitter.reviewCount);

  // Fetch enrichment data — all optional, never blocks render
  const sitterNumId = Number(sitter.id);
  const { data: extData } = useSitterExtendedPublic(sitterNumId);
  const { data: statsData } = useGetSitterStats(sitter.id);

  // Distance calculation — async, state starts as null (shows "nearby" fallback)
  const [distanceMi, setDistanceMi] = useState<number | null>(null);
  useEffect(() => {
    if (!clientZip || !sitter.location) return;
    let cancelled = false;
    (async () => {
      const [clientCoords, sitterCoords] = await Promise.all([
        getLatLngForZip(clientZip),
        getLatLngForZip(sitter.location),
      ]);
      if (!cancelled && clientCoords && sitterCoords) {
        setDistanceMi(
          haversineDistanceMiles(
            clientCoords.lat,
            clientCoords.lng,
            sitterCoords.lat,
            sitterCoords.lng,
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientZip, sitter.location]);

  // Credential badges — show up to 4 truthy items
  const creds: CredentialChecklist = extData?.credentialChecklist ?? {};
  const activeBadges: { key: string; label: string }[] = [
    { key: "isInsuredAndBonded", label: "Insured" },
    { key: "hasBackgroundCheck", label: "BG Check" },
    { key: "hasCertificationOrTraining", label: "Certified" },
    { key: "isProfessionalMember", label: "Pro Member" },
    { key: "hasBusinessLicense", label: "Licensed" },
    { key: "hasReferences", label: "References" },
    { key: "usesServiceAgreement", label: "Agreement" },
  ].filter((b) => creds[b.key as keyof CredentialChecklist] === true);

  const visibleBadges = activeBadges.slice(0, 4);

  // Analytics row
  const completedBookings = statsData?.totalCompletedBookings ?? 0;
  const repeatRate = statsData?.repeatClientRatePct ?? 0;
  const showAnalytics = completedBookings > 0 || repeatRate > 0;

  // Top service for rate row
  const topService = sitter.services[0] ?? "";
  const hourlyRate = Number(sitter.hourlyRate);

  // Response time
  const responseTime = extData?.responseTime;

  return (
    <button
      type="button"
      data-ocid={`sitter_selection.item.${index + 1}`}
      onClick={onToggle}
      className="relative w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-200"
      style={
        isSelected
          ? {
              borderColor: "oklch(0.72 0.18 55 / 0.7)",
              background: "oklch(0.72 0.18 55 / 0.06)",
              boxShadow: "0 0 0 4px oklch(0.72 0.18 55 / 0.12)",
            }
          : {
              borderColor: L.cardBorder,
              background: L.card,
              boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)",
            }
      }
    >
      {/* Photo area */}
      <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
        {sitter.photoUrl ? (
          <img
            src={sitter.photoUrl}
            alt={sitter.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.18 255), oklch(0.50 0.20 280))",
            }}
          >
            <span className="text-4xl font-bold text-white/25 font-display">
              {sitter.name[0]}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />

        {/* Available badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-[10px] font-semibold">
            Available
          </span>
        </div>

        {/* Selection checkmark */}
        {isSelected && (
          <div
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.18 55)",
              boxShadow: "0 2px 8px oklch(0.72 0.18 55 / 0.5)",
            }}
          >
            <Check size={14} style={{ color: "oklch(0.15 0.02 55)" }} />
          </div>
        )}

        {/* Name and location overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-display font-bold text-base text-white leading-tight drop-shadow">
            {sitter.name}
          </p>
          {sitter.location && (
            <div className="flex items-center gap-1 text-white/70 text-xs mt-0.5">
              <MapPin size={10} />
              <span>{zipToAreaName(sitter.location)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2">
        {/* ── Row 1: Rating + credential badges ── */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          {/* Stars + count */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={11}
                  className={
                    i <= Math.round(ratingNum)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/25"
                  }
                />
              ))}
            </div>
            <span className="text-xs font-semibold" style={{ color: L.fg }}>
              {ratingNum > 0 ? ratingNum.toFixed(1) : "New"}
            </span>
            {reviewNum > 0 && (
              <span className="text-xs" style={{ color: L.fgMuted }}>
                ({reviewNum})
              </span>
            )}
          </div>

          {/* Credential badges */}
          {visibleBadges.length > 0 && (
            <div className="flex flex-wrap justify-end gap-0.5 min-w-0">
              {visibleBadges.map((b) => (
                <CredBadge key={b.key} label={b.label} />
              ))}
            </div>
          )}
        </div>

        {/* ── Row 2: Distance + rate ── */}
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-1 text-[11px] shrink-0"
            style={{ color: L.fgMuted }}
          >
            <MapPin size={10} className="shrink-0" />
            {distanceMi !== null ? (
              <span>{distanceMi.toFixed(1)} mi away</span>
            ) : (
              <span>nearby</span>
            )}
          </div>
          {topService && hourlyRate > 0 && (
            <span
              className="text-xs font-bold shrink-0 truncate max-w-[50%]"
              style={{ color: "oklch(0.45 0.18 255)" }}
            >
              ${hourlyRate}/hr · {topService}
            </span>
          )}
          {(!topService || hourlyRate === 0) && hourlyRate > 0 && (
            <span
              className="text-xs font-bold shrink-0"
              style={{ color: "oklch(0.45 0.18 255)" }}
            >
              ${hourlyRate}/hr
            </span>
          )}
        </div>

        {/* ── Row 3: Analytics ── */}
        {showAnalytics && (
          <div
            className="flex items-center gap-1 text-[11px] truncate"
            style={{ color: L.fgSubtle }}
          >
            <TrendingUp size={10} className="shrink-0" />
            <span className="truncate">
              {completedBookings > 0 && (
                <>
                  {completedBookings} booking
                  {completedBookings !== 1 ? "s" : ""}
                </>
              )}
              {completedBookings > 0 && repeatRate > 0 && (
                <span className="mx-1 opacity-50">·</span>
              )}
              {repeatRate > 0 && <>{repeatRate}% repeat clients</>}
            </span>
          </div>
        )}

        {/* ── Row 4: Response time (if available) ── */}
        {responseTime && (
          <div
            className="flex items-center gap-1 text-[11px]"
            style={{ color: L.fgSubtle }}
          >
            <Clock size={10} className="shrink-0" />
            <span>Responds {responseTime.toLowerCase()}</span>
          </div>
        )}

        {/* ── Row 5: Services ── */}
        <div className="flex flex-wrap gap-1">
          {sitter.services.slice(0, 3).map((svc) => (
            <span
              key={svc}
              className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{
                background: L.blueLight,
                borderColor: L.blueBorder,
                color: "oklch(0.38 0.14 255)",
              }}
            >
              {svc}
            </span>
          ))}
          {sitter.services.length > 3 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
              style={{
                background: "oklch(0.93 0.01 265)",
                borderColor: "oklch(0.85 0.015 265)",
                color: L.fgMuted,
              }}
            >
              +{sitter.services.length - 3}
            </span>
          )}
        </div>

        {/* ── Select CTA (unchanged) ── */}
        <div
          className="w-full rounded-xl py-2.5 text-center text-sm font-semibold mt-0.5 transition-all"
          style={
            isSelected
              ? {
                  background: "oklch(0.72 0.18 55)",
                  color: "oklch(0.12 0.02 50)",
                }
              : {
                  background: "oklch(0.93 0.01 265)",
                  color: "oklch(0.35 0.03 265)",
                }
          }
        >
          {isSelected ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check size={13} /> Selected
            </span>
          ) : (
            "Select Sitter"
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Inline booking state ─────────────────────────────────────────────────────

interface InlineBookingState {
  sitterId: bigint;
  prebook: PrebookState;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  navigate: (view: View, sitterId?: bigint) => void;
  navigateWithPrebook?: (sitterId: bigint, prebook: PrebookState) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FindSittersPage({
  navigate,
  navigateWithPrebook: _navigateWithPrebook,
}: Props) {
  // ── Inline booking wizard state ──────────────────────────────────────────
  // When set, renders SitterDetailPage INLINE instead of navigating away.
  // This is the fix for the blank screen: never unmount/remount this component.
  const [inlineBooking, setInlineBooking] = useState<InlineBookingState | null>(
    null,
  );
  const {
    draft,
    setZip,
    setInScopeSitters,
    setDate,
    setTime,
    setTimeWindow,
    setService,
    setAvailability,
    setSelectedSitters,
    isCriteriaComplete,
  } = useBookingDraft();

  // Local UI state
  const [step, setStep] = useState<"zip" | "criteria" | "sitter-selection">(
    "zip",
  );
  const [transitioning, setTransitioning] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Sitter selection state (Phase 7)
  const [localSelectedSitterIds, setLocalSelectedSitterIds] = useState<
    string[]
  >([]);

  // Time slot selection (maps to time string)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  const zipValid = /^\d{5}$/.test(zipInput);
  const areaName = draft.zip ? zipToAreaName(draft.zip) : "";

  // Fetch in-scope sitters based on submitted ZIP
  const { data: nearbySitters = [], isLoading: sittersLoading } =
    useSittersNearZip(draft.zip, 25);

  // Sync in-scope sitter IDs to draft when data arrives
  useEffect(() => {
    if (draft.zip && !sittersLoading && Array.isArray(nearbySitters)) {
      const ids = (nearbySitters as Public[]).map((s) => s.id.toString());
      setInScopeSitters(ids);
    }
  }, [nearbySitters, sittersLoading, draft.zip, setInScopeSitters]);

  // Record uncovered ZIP demand when a validated ZIP returns 0 sitters
  const demandTrackedZipRef = useRef<string>("");
  useEffect(() => {
    if (
      draft.zip &&
      /^\d{5}$/.test(draft.zip) &&
      !sittersLoading &&
      Array.isArray(nearbySitters) &&
      (nearbySitters as Public[]).length === 0 &&
      demandTrackedZipRef.current !== draft.zip
    ) {
      demandTrackedZipRef.current = draft.zip;
      recordUncoveredZipSearch(draft.zip);
    }
  }, [draft.zip, nearbySitters, sittersLoading]);

  // ── Backend availability query ────────────────────────────────────────────
  // Build query params only when all criteria are complete.
  // startTime comes from the selected time slot; endTime = startTime + window.
  const backendAvailabilityParams = isCriteriaComplete
    ? (() => {
        const startTime = draft.selectedTime ?? "";
        const endTime =
          draft.selectedTimeWindow && selectedTimeSlot
            ? timeSlotToEndTime(selectedTimeSlot, draft.selectedTimeWindow)
            : "";
        if (!startTime || !endTime) return null;
        return {
          date: draft.selectedDate ?? "",
          startTime,
          endTime,
        };
      })()
    : null;

  const { data: backendAvailableSitters, isFetching: isBackendFetching } =
    useAvailableSittersForWindow(backendAvailabilityParams);

  // isComputingAvailability: true while backend query is in flight after criteria complete
  const isComputingAvailability = isCriteriaComplete && isBackendFetching;

  // Sync backend availability result into draft whenever it changes.
  // KEY FIX: Remove the criteriaKey deduplication guard — it was preventing
  // re-fires that are needed when navigating back from sitter-selection.
  // Instead, only skip when the query params aren't ready or fetching is active.
  useEffect(() => {
    if (!isCriteriaComplete) return;
    if (isBackendFetching) return; // wait for result
    // Guard: only update if we have valid params (prevents wipe when params are null)
    if (!backendAvailabilityParams) return;

    const sittersArray = nearbySitters as Public[];

    // backendAvailableSitters is the backend result.
    // If it's undefined (query hasn't resolved yet), skip.
    if (backendAvailableSitters === undefined) return;

    // Intersect backend-confirmed sitters with client-side service filter
    let eligible = backendAvailableSitters.filter((s) =>
      isSitterEligible(
        s,
        draft.selectedService,
        draft.selectedDate,
        selectedTimeSlot,
        draft.selectedTimeWindow,
      ),
    );

    // FALLBACK: If the backend returned 0 sitters but we have nearbySitters,
    // the backend may be rejecting sitters because they haven't set an explicit
    // availability schedule. Fall back to all nearbySitters passing the service
    // check — this ensures Bailey/Linnea/Marcus always appear when they're
    // active and offer the selected service.
    if (eligible.length === 0 && sittersArray.length > 0) {
      eligible = sittersArray.filter((s) =>
        isSitterEligible(
          s,
          draft.selectedService,
          draft.selectedDate,
          selectedTimeSlot,
          draft.selectedTimeWindow,
        ),
      );
    }

    const eligibleIds = eligible.map((s) => s.id.toString());

    const suggestions =
      eligibleIds.length === 0
        ? generateAlternatives(
            sittersArray,
            draft.selectedService,
            draft.selectedDate,
            selectedTimeSlot,
            draft.selectedTimeWindow,
            draft.zip,
          )
        : [];

    setAvailability(eligibleIds.length, eligibleIds, suggestions);
  }, [
    isCriteriaComplete,
    isBackendFetching,
    backendAvailabilityParams,
    backendAvailableSitters,
    draft.selectedDate,
    draft.selectedTimeWindow,
    draft.selectedService,
    nearbySitters,
    selectedTimeSlot,
    draft.zip,
    setAvailability,
  ]);

  // Reset availability when criteria are cleared
  useEffect(() => {
    if (!isCriteriaComplete) {
      setAvailability(0, [], []);
    }
  }, [isCriteriaComplete, setAvailability]);
  // Reset sitter selection when criteria change (Phase 7)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on any criteria change
  useEffect(() => {
    setLocalSelectedSitterIds([]);
  }, [
    draft.selectedDate,
    draft.selectedTime,
    draft.selectedTimeWindow,
    draft.selectedService,
  ]);

  const handleSearch = useCallback(() => {
    if (!zipValid) return;
    setZip(zipInput);
    setDate(tomorrowIsoForZip(zipInput));
    setTransitioning(true);
    setTimeout(() => {
      setStep("criteria");
      setTransitioning(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 400);
  }, [zipValid, zipInput, setZip, setDate]);

  const handleTimeSlotSelect = useCallback(
    (slot: string) => {
      const newSlot = selectedTimeSlot === slot ? "" : slot;
      setSelectedTimeSlot(newSlot);
      setTime(newSlot ? timeSlotToStartTime(newSlot) : null);
    },
    [selectedTimeSlot, setTime],
  );

  const handleWindowSelect = useCallback(
    (w: number) => {
      setTimeWindow(draft.selectedTimeWindow === w ? null : w);
    },
    [draft.selectedTimeWindow, setTimeWindow],
  );

  // Compute "Find a Sitter" button state
  const missingFields: string[] = [];
  if (!draft.selectedDate) missingFields.push("date");
  if (!selectedTimeSlot) missingFields.push("time of day");
  if (!draft.selectedTimeWindow) missingFields.push("duration");
  if (!draft.selectedService) missingFields.push("service");

  const canProceed =
    isCriteriaComplete &&
    !isComputingAvailability &&
    draft.liveAvailabilityCount > 0;

  const noAvailability =
    isCriteriaComplete &&
    !isComputingAvailability &&
    draft.liveAvailabilityCount === 0;

  const handleFindSitter = useCallback(() => {
    if (noAvailability) {
      setShowAlternatives(true);
      return;
    }
    if (!canProceed) return;

    // Phase 7: Move to sitter selection step
    setLocalSelectedSitterIds([]);
    setStep("sitter-selection");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [canProceed, noAvailability]);

  const handleAlternativeSelect = useCallback(
    (s: AlternativeSuggestion) => {
      setDate(s.date);
      setSelectedTimeSlot(s.timeSlot);
      setTime(timeSlotToStartTime(s.timeSlot));
      setTimeWindow(s.timeWindow);
      setShowAlternatives(false);

      // If the alternative has sitters, proceed to selection
      if (s.availableCount > 0) {
        setLocalSelectedSitterIds([]);
        setStep("sitter-selection");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setDate, setTime, setTimeWindow],
  );

  // Phase 7: Toggle a sitter in the local selection
  const handleSitterToggle = useCallback((sitterId: string) => {
    setLocalSelectedSitterIds((prev) =>
      prev.includes(sitterId)
        ? prev.filter((id) => id !== sitterId)
        : [...prev, sitterId],
    );
  }, []);

  // Available sitters for Phase 7 sitter selection step.
  // Derived from draft.availableSitterIds — the single source of truth.
  // Must be declared before handleContinueWithSitters (const is not hoisted).
  const availableSittersForSelection = (nearbySitters as Public[]).filter((s) =>
    draft.availableSitterIds.includes(s.id.toString()),
  );

  // Phase 7: Proceed from sitter selection to booking wizard (INLINE — no navigation)
  const handleContinueWithSitters = useCallback(() => {
    if (localSelectedSitterIds.length === 0) return;

    // Sync selected sitter IDs to the draft
    setSelectedSitters(localSelectedSitterIds);

    // Get the full sitter objects for the selected IDs
    const availableSitters = availableSittersForSelection.filter((s) =>
      localSelectedSitterIds.includes(s.id.toString()),
    );
    if (availableSitters.length === 0) return;

    const firstSitter = availableSitters[0];

    // Build prebook state for the wizard (pre-populates Step 0 / starts at Pets)
    const startTime = timeSlotToStartTime(selectedTimeSlot);
    const endTime = draft.selectedTimeWindow
      ? timeSlotToEndTime(selectedTimeSlot, draft.selectedTimeWindow)
      : "";

    const prebook: PrebookState = {
      prebookDate: draft.selectedDate ?? undefined,
      prebookServices: draft.selectedService
        ? [draft.selectedService]
        : undefined,
      prebookTimeWindow: {
        startTime: startTime || "09:00",
        endTime: endTime || "17:00",
      },
      prebookTime: startTime || undefined,
      prebookSitterIds: availableSitters.map((s) => s.id),
      prebookSitter: firstSitter,
    };

    // ── INLINE RENDER — never navigate away ──────────────────────────────────
    // The root cause of the blank screen was navigating to SitterDetailPage as
    // a new view, which unmounted this component and remounted SitterDetailPage
    // with actor=null. By rendering SitterDetailPage inline here, the actor is
    // already warm and the component never loses its React tree context.
    setInlineBooking({ sitterId: firstSitter.id, prebook });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    localSelectedSitterIds,
    availableSittersForSelection,
    draft.selectedDate,
    draft.selectedService,
    draft.selectedTimeWindow,
    selectedTimeSlot,
    setSelectedSitters,
  ]);

  // Allow today and all future dates — sitters can accept or decline same-day bookings
  const todayMin = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  // Timezone label for display
  const timezoneAbbr = (() => {
    if (!draft.zip) return "";
    try {
      const tz = getTimezoneForZip(draft.zip);
      return (
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          timeZoneName: "short",
        })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value ?? ""
      );
    } catch {
      return "";
    }
  })();

  // Back button handler
  const handleBack = useCallback(() => {
    if (step === "sitter-selection") {
      setStep("criteria");
    } else if (step === "criteria") {
      setStep("zip");
    } else {
      navigate("home");
    }
  }, [step, navigate]);

  // Back label
  const backLabel =
    step === "sitter-selection"
      ? "Back to Criteria"
      : step === "criteria"
        ? "Change Zip"
        : "Home";

  // ── When inline booking is active, render SitterDetailPage directly ────────
  if (inlineBooking) {
    return (
      <SitterDetailPage
        sitterId={inlineBooking.sitterId}
        navigate={(view, sitterId) => {
          // If navigating away (e.g., after confirmation), clear inline state
          // and propagate to the parent router
          setInlineBooking(null);
          navigate(view, sitterId);
        }}
        prebookState={inlineBooking.prebook}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: L.bg, color: L.fg }}
    >
      {/* ── Premium transition overlay ─────────────────────────────── */}
      {transitioning && (
        <div
          className="fixed inset-0 z-[200] pointer-events-none"
          style={{
            animation:
              "findSitterTransition 0.4s cubic-bezier(0.4,0,0.2,1) both",
          }}
        />
      )}

      <style>{`
        @keyframes findSitterTransition {
          0%   { opacity: 0; background: oklch(0.72 0.18 55 / 0.12); transform: scale(1.02); }
          40%  { opacity: 1; }
          100% { opacity: 0; background: oklch(0.72 0.18 55 / 0); transform: scale(1); }
        }
        @keyframes criteriaFadeIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sectionSlideIn {
          0%   { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes sitterCardIn {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "oklch(1 0 0 / 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderColor: "oklch(0.88 0.015 255 / 0.6)",
          boxShadow:
            "0 1px 0 oklch(1 0 0 / 0.5), 0 2px 12px oklch(0 0 0 / 0.06)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            type="button"
            data-ocid="find-sitters.back.button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium min-h-[44px] min-w-[44px] transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.35 0.04 265)" }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: L.amberLight,
                border: `1px solid ${L.amberBorder}`,
              }}
            >
              <PawPrint size={13} style={{ color: "oklch(0.55 0.18 55)" }} />
            </div>
            <p
              className="font-display font-semibold text-sm truncate"
              style={{ color: L.fg }}
            >
              {step === "sitter-selection"
                ? "Choose Your Sitter"
                : step === "criteria" && draft.zip
                  ? `Book a Sitter in ${areaName}`
                  : "Find a Sitter"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("home")}
            className="text-xs transition-opacity hover:opacity-70 hidden sm:block"
            style={{ color: L.fgMuted }}
          >
            {APP_NAME}
          </button>
        </div>

        {/* Progress indicator */}
        {step !== "zip" && (
          <div
            className="h-1 flex"
            style={{ background: "oklch(0.92 0.01 265)" }}
          >
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: step === "criteria" ? "40%" : "70%",
                background:
                  "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
              }}
            />
          </div>
        )}
      </header>

      {/* pb-[calc(8rem+env(safe-area-inset-bottom,0px))] on mobile clears the
          sticky CTA bar (≈4.5rem) + bottom tab nav (≈4.5rem) + notch. */}
      <main className="flex-1 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        {/* ── STEP 1: ZIP ENTRY ──────────────────────────────────────── */}
        {step === "zip" && (
          <div className="flex items-center justify-center min-h-[calc(100vh-56px)] px-4 py-12">
            <div className="w-full max-w-md">
              {/* Hero accent glow */}
              <div
                className="absolute inset-x-0 top-0 h-[40vh] pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 50% 0%, oklch(0.92 0.12 55 / 0.5) 0%, transparent 60%)",
                }}
              />

              <div className="relative text-center mb-10">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.18), oklch(0.72 0.18 55 / 0.08))",
                    border: `1px solid ${L.amberBorder}`,
                  }}
                >
                  <MapPin size={28} style={{ color: "oklch(0.55 0.18 55)" }} />
                </div>
                <h1
                  className="font-display font-extrabold mb-3 tracking-tight"
                  style={{
                    fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
                    color: "oklch(0.12 0.02 265)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Find Sitters Near You
                </h1>
                <p
                  className="text-base leading-relaxed max-w-sm mx-auto"
                  style={{ color: L.fgMuted }}
                >
                  Enter your zip code to find trusted independent pet sitters in
                  your area — no account needed.
                </p>
              </div>

              {/* Zip input card */}
              <div
                className="rounded-2xl p-6 sm:p-8 border"
                style={{
                  background: L.card,
                  borderColor: L.cardBorder,
                  boxShadow:
                    "0 4px 24px oklch(0 0 0 / 0.08), 0 1px 4px oklch(0 0 0 / 0.04)",
                }}
              >
                <label
                  htmlFor="zip-input"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "oklch(0.35 0.03 265)" }}
                >
                  Your Zip Code
                </label>
                <div className="flex gap-3">
                  <Input
                    id="zip-input"
                    data-ocid="find-sitters.zip.input"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="e.g. 80210"
                    value={zipInput}
                    onChange={(e) =>
                      setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && zipValid && handleSearch()
                    }
                    className="flex-1 h-13 text-base rounded-xl"
                    style={{
                      background: L.inputBg,
                      borderColor: L.inputBorder,
                      color: L.fg,
                    }}
                    autoFocus
                  />
                  <Button
                    data-ocid="find-sitters.search.button"
                    onClick={handleSearch}
                    disabled={!zipValid}
                    className="h-13 px-6 rounded-xl font-bold shrink-0 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: zipValid
                        ? "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))"
                        : "oklch(0.88 0.01 265)",
                      color: zipValid
                        ? "oklch(0.12 0.02 50)"
                        : "oklch(0.5 0.01 265)",
                      boxShadow: zipValid
                        ? "0 4px 16px oklch(0.72 0.18 55 / 0.35)"
                        : undefined,
                    }}
                  >
                    <Search size={16} className="mr-1.5" />
                    Search
                  </Button>
                </div>

                {zipInput.length > 0 && !zipValid && (
                  <p
                    data-ocid="find-sitters.zip.field_error"
                    className="mt-2 text-xs font-medium"
                    style={{ color: L.red }}
                  >
                    Please enter a valid 5-digit zip code.
                  </p>
                )}
                {zipValid && (
                  <p
                    className="mt-2 text-xs flex items-center gap-1 font-medium"
                    style={{ color: "oklch(0.42 0.12 145)" }}
                  >
                    <MapPin size={11} className="shrink-0" />
                    {zipToAreaName(zipInput)}
                  </p>
                )}
              </div>

              {/* Returning customer link */}
              <div className="text-center mt-5">
                <button
                  type="button"
                  data-ocid="find-sitters.returning_customer.link"
                  onClick={() => navigate("booking-lookup")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "oklch(0.42 0.14 255)" }}
                >
                  <RefreshCw size={13} />
                  Returning Customer? Book Again →
                </button>
              </div>

              <p
                className="text-center text-xs mt-4 leading-relaxed"
                style={{ color: L.fgSubtle }}
              >
                We use your zip code to match you with nearby sitters. Your
                location is never stored or shared.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: BOOKING CRITERIA ───────────────────────────────── */}
        {step === "criteria" && (
          <div
            className="max-w-3xl mx-auto px-4 pt-6"
            style={{
              animation: "criteriaFadeIn 0.4s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            {/* Header card with location + returning customer link */}
            <div
              className="rounded-2xl border mb-5 px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap"
              style={{
                background: L.card,
                borderColor: L.cardBorder,
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: "oklch(0.55 0.18 55)" }} />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.45 0.16 55)" }}
                >
                  {areaName}
                </span>
                <span className="text-xs" style={{ color: L.fgMuted }}>
                  · {draft.zip}
                  {timezoneAbbr && ` · ${timezoneAbbr}`}
                </span>
              </div>
              <button
                type="button"
                data-ocid="find-sitters.returning_customer.link"
                onClick={() => navigate("booking-lookup")}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:opacity-80 shrink-0"
                style={{
                  borderColor: "oklch(0.55 0.18 255 / 0.4)",
                  color: "oklch(0.38 0.14 255)",
                  background: L.blueLight,
                }}
              >
                <RefreshCw size={11} />
                Returning Customer? Book Again →
              </button>
            </div>

            {/* Criteria form */}
            <div
              data-ocid="find-sitters.booking_criteria.panel"
              className="rounded-2xl border"
              style={{
                background: L.card,
                borderColor: L.cardBorder,
                boxShadow: "0 4px 20px oklch(0 0 0 / 0.07)",
              }}
            >
              <div
                className="px-5 pt-5 pb-4 border-b"
                style={{ borderColor: "oklch(0.88 0.015 255 / 0.5)" }}
              >
                <h2
                  className="font-display font-bold text-lg"
                  style={{ color: L.fg }}
                >
                  What are you looking for?
                </h2>
                <p className="text-xs mt-0.5" style={{ color: L.fgMuted }}>
                  Fill in all four fields to see available sitters.
                </p>
              </div>

              <div className="p-5 flex flex-col gap-6">
                {/* ─ Service ─ */}
                <div
                  style={{
                    animation: "sectionSlideIn 0.3s 0.05s ease-out both",
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: L.fgMuted }}
                  >
                    <PawPrint size={10} className="inline mr-1 mb-0.5" />
                    Service Type <span style={{ color: L.red }}>*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES_LIST.slice(0, 10).map((svc) => {
                      const isSelected = draft.selectedService === svc;
                      return (
                        <button
                          key={svc}
                          type="button"
                          data-ocid={`find-sitters.service.${svc.toLowerCase().replace(/[^a-z0-9]/g, "_")}.tab`}
                          onClick={() => setService(isSelected ? null : svc)}
                          className="h-9 px-3.5 rounded-xl text-xs font-semibold transition-all duration-150 border"
                          style={
                            isSelected
                              ? {
                                  background: L.amberLight,
                                  borderColor: L.amberBorder,
                                  color: "oklch(0.45 0.16 55)",
                                  boxShadow:
                                    "0 2px 8px oklch(0.72 0.18 55 / 0.18)",
                                }
                              : {
                                  background: "oklch(0.97 0.005 265)",
                                  borderColor: "oklch(0.85 0.015 265)",
                                  color: "oklch(0.40 0.03 265)",
                                }
                          }
                        >
                          {svc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Date ─ */}
                <div
                  style={{
                    animation: "sectionSlideIn 0.3s 0.1s ease-out both",
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: L.fgMuted }}
                  >
                    <CalendarDays size={10} className="inline mr-1 mb-0.5" />
                    Date Needed <span style={{ color: L.red }}>*</span>
                  </p>
                  <div className="relative max-w-xs">
                    <input
                      type="date"
                      data-ocid="find-sitters.date.input"
                      value={draft.selectedDate ?? ""}
                      min={todayMin}
                      onChange={(e) => setDate(e.target.value || null)}
                      className="w-full h-11 px-3 rounded-xl text-sm border focus:outline-none focus:ring-2 [color-scheme:light] font-medium"
                      style={{
                        background: L.inputBg,
                        borderColor: draft.selectedDate
                          ? "oklch(0.72 0.18 55 / 0.6)"
                          : L.inputBorder,
                        color: L.fg,
                        boxShadow: draft.selectedDate
                          ? "0 0 0 3px oklch(0.72 0.18 55 / 0.12)"
                          : undefined,
                      }}
                      aria-label="Date needed"
                    />
                  </div>
                  <p
                    className="text-[10px] mt-1.5 leading-snug"
                    style={{ color: L.fgSubtle }}
                  >
                    Today or later
                    {timezoneAbbr && ` · Times shown in ${timezoneAbbr}`}
                  </p>
                </div>

                {/* ─ Time of Day ─ */}
                <div
                  style={{
                    animation: "sectionSlideIn 0.3s 0.15s ease-out both",
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: L.fgMuted }}
                  >
                    <Clock size={10} className="inline mr-1 mb-0.5" />
                    Time of Day <span style={{ color: L.red }}>*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(({ label, value, startHour, endHour }) => {
                      const isSelected = selectedTimeSlot === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          data-ocid={`find-sitters.time.${value}.tab`}
                          onClick={() => handleTimeSlotSelect(value)}
                          className="h-10 px-4 rounded-xl text-xs font-semibold transition-all duration-150 border"
                          style={
                            isSelected
                              ? {
                                  background: L.blueLight,
                                  borderColor: "oklch(0.55 0.18 255 / 0.40)",
                                  color: "oklch(0.38 0.14 255)",
                                  boxShadow:
                                    "0 2px 8px oklch(0.55 0.18 255 / 0.15)",
                                }
                              : {
                                  background: "oklch(0.97 0.005 265)",
                                  borderColor: "oklch(0.85 0.015 265)",
                                  color: "oklch(0.40 0.03 265)",
                                }
                          }
                          title={`${startHour % 12 || 12}:00 ${startHour < 12 ? "AM" : "PM"} – ${endHour % 12 || 12}:00 ${endHour < 12 ? "AM" : "PM"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTimeSlot && (
                    <p
                      className="text-[10px] mt-1.5"
                      style={{ color: L.fgSubtle }}
                    >
                      {(() => {
                        const s = TIME_SLOTS.find(
                          (t) => t.value === selectedTimeSlot,
                        );
                        if (!s) return "";
                        const fmt = (h: number) =>
                          `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
                        return `${fmt(s.startHour)} – ${fmt(s.endHour)}`;
                      })()}
                    </p>
                  )}
                </div>

                {/* ─ Duration ─ */}
                <div
                  style={{
                    animation: "sectionSlideIn 0.3s 0.2s ease-out both",
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: L.fgMuted }}
                  >
                    <Clock size={10} className="inline mr-1 mb-0.5" />
                    Duration <span style={{ color: L.red }}>*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WINDOW_OPTIONS.map(({ label, value }) => {
                      const isSelected = draft.selectedTimeWindow === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          data-ocid={`find-sitters.window.${value}.tab`}
                          onClick={() => handleWindowSelect(value)}
                          className="h-9 px-3.5 rounded-xl text-xs font-semibold transition-all duration-150 border"
                          style={
                            isSelected
                              ? {
                                  background: L.amberLight,
                                  borderColor: L.amberBorder,
                                  color: "oklch(0.45 0.16 55)",
                                }
                              : {
                                  background: "oklch(0.97 0.005 265)",
                                  borderColor: "oklch(0.85 0.015 265)",
                                  color: "oklch(0.40 0.03 265)",
                                }
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─ Live availability status ─ */}
                {isCriteriaComplete && (
                  <div
                    style={{ animation: "criteriaFadeIn 0.25s ease-out both" }}
                  >
                    <AvailabilityStatus
                      count={draft.liveAvailabilityCount}
                      isLoading={isComputingAvailability || sittersLoading}
                      isCriteriaComplete={isCriteriaComplete}
                    />
                  </div>
                )}
              </div>

              {/* CTA footer */}
              <div
                className="px-5 py-4 border-t flex flex-col gap-3"
                style={{
                  borderColor: "oklch(0.88 0.015 255 / 0.5)",
                  background: "oklch(0.97 0.005 265)",
                  borderRadius: "0 0 1rem 1rem",
                }}
              >
                {/* Missing fields hint */}
                {missingFields.length > 0 && !isCriteriaComplete && (
                  <p
                    className="text-xs text-center"
                    style={{ color: L.fgSubtle }}
                  >
                    Please select: {missingFields.join(", ")}
                  </p>
                )}

                {/* Find a Sitter CTA */}
                {noAvailability ? (
                  <Button
                    data-ocid="find-sitters.find_sitter.button"
                    onClick={() => setShowAlternatives(true)}
                    className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.58 0.14 27), oklch(0.50 0.18 27))",
                      color: "oklch(0.96 0.005 265)",
                      boxShadow: "0 4px 16px oklch(0.50 0.18 27 / 0.30)",
                    }}
                  >
                    <AlertCircle size={16} className="mr-2" />
                    No Sitters Available — Try Alternatives
                  </Button>
                ) : (
                  <Button
                    data-ocid="find-sitters.find_sitter.button"
                    onClick={handleFindSitter}
                    disabled={!canProceed}
                    className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                      canProceed
                        ? {
                            background:
                              "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
                            color: "oklch(0.12 0.02 50)",
                            boxShadow: "0 4px 16px oklch(0.72 0.18 55 / 0.35)",
                          }
                        : {
                            background: "oklch(0.88 0.01 265)",
                            color: "oklch(0.5 0.01 265)",
                          }
                    }
                  >
                    {isComputingAvailability || sittersLoading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Checking availability…
                      </>
                    ) : (
                      <>
                        <Search size={16} className="mr-2" />
                        Find a Sitter
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: SITTER SELECTION (Phase 7) ─────────────────────── */}
        {step === "sitter-selection" && (
          <div
            className="max-w-3xl mx-auto px-4 pt-6"
            style={{
              animation: "criteriaFadeIn 0.35s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            {/* Booking summary card */}
            <div
              className="rounded-2xl border mb-5 px-5 py-4"
              style={{
                background: L.card,
                borderColor: L.cardBorder,
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
              }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                  style={{ color: L.fg }}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={13}
                      style={{ color: "oklch(0.55 0.18 55)" }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: "oklch(0.45 0.16 55)" }}
                    >
                      {areaName}
                    </span>
                  </div>
                  {draft.selectedDate && (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={13} style={{ color: L.fgMuted }} />
                      <span className="text-xs" style={{ color: L.fgMuted }}>
                        {new Date(
                          `${draft.selectedDate}T12:00:00`,
                        ).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {selectedTimeSlot && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: L.fgMuted }} />
                      <span
                        className="text-xs capitalize"
                        style={{ color: L.fgMuted }}
                      >
                        {selectedTimeSlot}
                      </span>
                    </div>
                  )}
                  {draft.selectedService && (
                    <div className="flex items-center gap-1.5">
                      <PawPrint size={13} style={{ color: L.fgMuted }} />
                      <span className="text-xs" style={{ color: L.fgMuted }}>
                        {draft.selectedService}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid="find-sitters.returning_customer.link"
                  onClick={() => navigate("booking-lookup")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:opacity-80 shrink-0"
                  style={{
                    borderColor: "oklch(0.55 0.18 255 / 0.4)",
                    color: "oklch(0.38 0.14 255)",
                    background: L.blueLight,
                  }}
                >
                  <RefreshCw size={11} />
                  Returning Customer?
                </button>
              </div>
            </div>

            {/* Sitter grid header */}
            <div className="mb-4">
              <h2
                className="font-display font-bold text-xl"
                style={{ color: L.fg, letterSpacing: "-0.02em" }}
              >
                Choose Your Sitter
                {availableSittersForSelection.length > 1 ? "s" : ""}
              </h2>
              <p className="text-sm mt-1" style={{ color: L.fgMuted }}>
                {draft.availabilityReady
                  ? `${availableSittersForSelection.length} sitter${availableSittersForSelection.length !== 1 ? "s" : ""} available for your request. You can select more than one.`
                  : "Confirming sitter availability…"}
              </p>
            </div>

            {/* FIX 1: Gate rendering behind availabilityReady.
                Show skeleton while availability is not yet confirmed.
                Only show "No sitters found" after availabilityReady=true AND list is empty. */}
            {sittersLoading || !draft.availabilityReady ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                data-ocid="sitter_selection.loading_state"
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border"
                    style={{ borderColor: L.cardBorder }}
                  >
                    <div className="animate-pulse">
                      <div
                        className="w-full bg-muted"
                        style={{ aspectRatio: "3/2" }}
                      />
                      <div className="p-3.5 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-8 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : availableSittersForSelection.length === 0 ? (
              <div
                className="rounded-2xl border px-6 py-10 text-center"
                data-ocid="sitter_selection.empty_state"
                style={{
                  background: L.card,
                  borderColor: L.cardBorder,
                }}
              >
                <Info
                  size={36}
                  className="mx-auto mb-3"
                  style={{ color: L.fgSubtle }}
                />
                <p className="text-sm font-medium" style={{ color: L.fgMuted }}>
                  No sitters found for this criteria.
                </p>
                <button
                  type="button"
                  onClick={() => setStep("criteria")}
                  className="mt-4 text-xs font-semibold underline"
                  style={{ color: L.blue }}
                >
                  Go back and adjust criteria
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableSittersForSelection.map((sitter, index) => (
                  <div
                    key={sitter.id.toString()}
                    style={{
                      animation: `sitterCardIn 0.3s ${index * 0.07}s ease-out both`,
                    }}
                  >
                    <SitterPickCard
                      sitter={sitter}
                      isSelected={localSelectedSitterIds.includes(
                        sitter.id.toString(),
                      )}
                      onToggle={() => handleSitterToggle(sitter.id.toString())}
                      index={index}
                      clientZip={draft.zip}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Bottom spacer — extra visual breathing room below cards */}
            <div className="h-4" />
          </div>
        )}
      </main>

      {/* ── Sticky sitter selection CTA ──────────────────────────────── */}
      {step === "sitter-selection" && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[140] px-4 pt-3 border-t"
          style={{
            background: "oklch(1 0 0 / 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "oklch(0.88 0.015 255 / 0.6)",
            boxShadow: "0 -4px 24px oklch(0 0 0 / 0.08)",
            /* On mobile: sit above the bottom tab nav (≈72px) + notch safe area.
               On desktop (md+): just 1rem bottom padding — no tab nav present. */
            paddingBottom:
              "max(1rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {localSelectedSitterIds.length > 0 && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: L.fg }}>
                  {localSelectedSitterIds.length} sitter
                  {localSelectedSitterIds.length !== 1 ? "s" : ""} selected
                </p>
                <p className="text-[10px]" style={{ color: L.fgMuted }}>
                  {localSelectedSitterIds
                    .map(
                      (id) =>
                        availableSittersForSelection.find(
                          (s) => s.id.toString() === id,
                        )?.name ?? "",
                    )
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            <Button
              data-ocid="sitter_selection.continue_button"
              onClick={handleContinueWithSitters}
              disabled={localSelectedSitterIds.length === 0}
              className="rounded-xl font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed h-12 px-6"
              style={
                localSelectedSitterIds.length > 0
                  ? {
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
                      color: "oklch(0.12 0.02 50)",
                      boxShadow: "0 4px 16px oklch(0.72 0.18 55 / 0.35)",
                      flex: "none",
                    }
                  : {
                      background: "oklch(0.88 0.01 265)",
                      color: "oklch(0.5 0.01 265)",
                      flex: localSelectedSitterIds.length === 0 ? "1" : "none",
                    }
              }
            >
              {localSelectedSitterIds.length > 0 ? (
                <>
                  <ShieldCheck size={15} className="mr-2 shrink-0" />
                  Continue with {localSelectedSitterIds.length} Sitter
                  {localSelectedSitterIds.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <Lock size={15} className="mr-2 shrink-0" />
                  Select a Sitter to Continue
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── No-availability alternatives modal ──────────────────────── */}
      {showAlternatives && (
        <NoAvailabilityModal
          suggestions={draft.alternativeSuggestions}
          onSelect={handleAlternativeSelect}
          onClose={() => setShowAlternatives(false)}
        />
      )}
    </div>
  );
}
