/**
 * BookingWizard.tsx
 *
 * Inline booking wizard — rendered INSIDE FindSittersPage, never navigated away.
 * This is the core fix for the blank screen bug: navigating to SitterDetailPage
 * remounts the component fresh with no actor, causing every !actor guard to
 * return null. This component renders in-place within the already-mounted
 * FindSittersPage tree where the actor is already warm.
 *
 * Steps: Pets (0) → Contact (1) → Review (2) → Confirmation (3)
 */

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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PawPrint,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { View } from "../../App";
import type { Public } from "../../backend.d";
import { APP_NAME, zipToAreaName } from "../../config/business";
import { useActorReady } from "../../hooks/useBackend";
import {
  useCreateBooking,
  useSendBookingConfirmation,
} from "../../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PetState {
  _id: number;
  petName: string;
  petType: string;
  breed: string;
  petNotes: string;
}

export interface BookingWizardProps {
  /** The sitters selected from FindSittersPage */
  selectedSitters: Public[];
  /** Booking criteria from the draft */
  date: string; // ISO YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  service: string;
  zip: string;
  navigate: (view: View) => void;
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PET_TYPES = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Fish",
  "Small Animal",
  "Other",
];
const STEPS = ["Your Pets", "Your Info", "Review", "Confirmation"];

// Light-mode color tokens (matching FindSittersPage)
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

function formatTime(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

let petIdCounter = 0;
function newPet(): PetState {
  return {
    _id: ++petIdCounter,
    petName: "",
    petType: "Dog",
    breed: "",
    petNotes: "",
  };
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.slice(0, 3).map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={
                i < step
                  ? { background: L.green, color: "white" }
                  : i === step
                    ? {
                        background: L.amber,
                        color: "oklch(0.12 0.02 50)",
                        boxShadow: `0 0 0 4px ${L.amberLight}`,
                      }
                    : {
                        background: "oklch(0.92 0.01 265)",
                        color: L.fgMuted,
                      }
              }
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span
              className="text-[10px] font-semibold mt-1 whitespace-nowrap"
              style={{ color: i === step ? L.fg : L.fgSubtle }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 2 && (
            <div
              className="flex-1 h-0.5 mx-1 mt-[-12px]"
              style={{
                background: i < step ? L.green : "oklch(0.90 0.01 265)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Booking summary card ─────────────────────────────────────────────────────

function BookingSummaryCard({
  sitters,
  date,
  startTime,
  endTime,
  service,
  zip,
}: {
  sitters: Public[];
  date: string;
  startTime: string;
  endTime: string;
  service: string;
  zip: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 mb-5"
      style={{
        background: L.card,
        borderColor: L.cardBorder,
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <PawPrint size={13} style={{ color: L.amber }} />
          <span
            className="font-semibold"
            style={{ color: "oklch(0.45 0.16 55)" }}
          >
            {sitters.map((s) => s.name).join(" & ")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: L.fgMuted }} />
          <span className="text-xs" style={{ color: L.fgMuted }}>
            {zipToAreaName(zip)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays size={13} style={{ color: L.fgMuted }} />
          <span className="text-xs" style={{ color: L.fgMuted }}>
            {formatDate(date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} style={{ color: L.fgMuted }} />
          <span className="text-xs" style={{ color: L.fgMuted }}>
            {formatTime(startTime)} – {formatTime(endTime)}
          </span>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full border font-medium"
          style={{
            background: L.blueLight,
            borderColor: L.blueBorder,
            color: "oklch(0.38 0.14 255)",
          }}
        >
          {service}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingWizard({
  selectedSitters,
  date,
  startTime,
  endTime,
  service,
  zip,
  navigate,
  onBack,
}: BookingWizardProps) {
  const { actor } = useActorReady();
  const [step, setStep] = useState(0);

  // ── Step 0: Pets ──────────────────────────────────────────────────────────
  const [pets, setPets] = useState<PetState[]>(() => [newPet()]);
  const [notes, setNotes] = useState("");

  // ── Step 1: Contact ───────────────────────────────────────────────────────
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [returningClient, _setReturningClient] = useState(false);
  const [consentComms, setConsentComms] = useState(false);

  // ── Step 2: Review ────────────────────────────────────────────────────────
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentLiability, setConsentLiability] = useState(false);
  const [consentCancellation, setConsentCancellation] = useState(false);

  // ── Submission ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<bigint | null>(
    null,
  );
  const idempotencyRef = useRef<string | null>(null);

  const createBooking = useCreateBooking();
  const sendConfirmation = useSendBookingConfirmation();

  // ── Pet helpers ───────────────────────────────────────────────────────────
  const updatePet = useCallback(
    (idx: number, field: keyof PetState, value: string) =>
      setPets((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
      ),
    [],
  );
  const removePet = useCallback(
    (idx: number) => setPets((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );
  const addPet = useCallback(() => setPets((prev) => [...prev, newPet()]), []);

  // ── Validation ────────────────────────────────────────────────────────────
  const petsValid =
    pets.length > 0 && pets.every((p) => p.petName.trim() && p.petType);
  const contactValid =
    clientName.trim().length >= 2 &&
    clientEmail.includes("@") &&
    normalizePhone(clientPhone).length === 10 &&
    consentComms;
  const reviewValid = consentTerms && consentLiability && consentCancellation;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!actor || submitting) return;
    if (!reviewValid || !petsValid || !contactValid) return;
    setSubmitting(true);
    setSubmitError(null);

    // Generate idempotency key once
    if (!idempotencyRef.current) {
      idempotencyRef.current = [
        clientEmail,
        selectedSitters.map((s) => s.id.toString()).join(","),
        date,
        startTime,
        service,
        pets.map((p) => p.petName).join(","),
        Date.now().toString(),
      ].join("|");
    }

    try {
      // Convert start/end times to epoch nanoseconds for the day
      const dayMs = new Date(`${date}T00:00:00`).getTime();
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      const startMs = dayMs + (sh * 60 + sm) * 60_000;
      const endMs = dayMs + (eh * 60 + em) * 60_000;
      const startNs = BigInt(startMs) * 1_000_000n;
      const endNs = BigInt(endMs) * 1_000_000n;

      const petPayload = pets.map((p) => ({
        petName: p.petName.trim(),
        petType: p.petType,
        breed: p.breed.trim(),
        petNotes: p.petNotes.trim(),
      }));

      const bookingData = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: normalizePhone(clientPhone),
        pets: petPayload,
        services: [service],
        sitterIds: selectedSitters.map((s) => s.id),
        startDate: startNs,
        endDate: endNs,
        notes: notes.trim(),
        isRecurring: false,
        agreementFlags: {
          terms: consentTerms,
          termsVersion: BigInt(1),
          privacy: consentLiability,
          communications: consentComms,
          cancellationPolicy: consentCancellation,
          nonEmploymentAck: consentTerms,
          callRequest: false,
        },
      };

      const result = await createBooking.mutateAsync(bookingData);

      // Extract booking ID
      let bookingId: bigint | null = null;
      if (result && typeof result === "object") {
        if ("ok" in result) {
          const ok = (result as { ok: { id?: bigint } }).ok;
          bookingId = ok?.id ?? null;
        } else if ("id" in result) {
          bookingId = (result as { id: bigint }).id;
        }
      }

      if (bookingId !== null) {
        // Send confirmation email — non-blocking
        sendConfirmation.mutateAsync(bookingId).catch(() => {
          /* ignore email errors */
        });
        setConfirmedBookingId(bookingId);
        setStep(3);
      } else {
        // Check for error result
        if (result && typeof result === "object" && "err" in result) {
          const err = (result as { err: unknown }).err;
          setSubmitError(typeof err === "string" ? err : JSON.stringify(err));
        } else {
          setSubmitError(
            "Booking was submitted but no confirmation was returned. Please check My Bookings.",
          );
        }
      }
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Booking failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    actor,
    submitting,
    reviewValid,
    petsValid,
    contactValid,
    clientEmail,
    clientName,
    clientPhone,
    selectedSitters,
    date,
    startTime,
    endTime,
    service,
    pets,
    notes,
    consentTerms,
    consentLiability,
    consentComms,
    consentCancellation,
    createBooking,
    sendConfirmation,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────

  const primarySitter = selectedSitters[0];

  // ── CONFIRMATION STEP ────────────────────────────────────────────────────
  if (step === 3 && confirmedBookingId !== null) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: L.bg, color: L.fg }}
      >
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            background: "oklch(1 0 0 / 0.95)",
            backdropFilter: "blur(20px)",
            borderColor: "oklch(0.88 0.015 255 / 0.6)",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
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
              className="font-display font-semibold text-sm"
              style={{ color: L.fg }}
            >
              {APP_NAME}
            </p>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div
            className="w-full max-w-md rounded-2xl border p-8 text-center"
            style={{
              background: L.card,
              borderColor: L.cardBorder,
              boxShadow: "0 8px 40px oklch(0 0 0 / 0.08)",
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: L.greenLight,
                border: `2px solid ${L.greenBorder}`,
              }}
            >
              <CheckCircle2 size={40} style={{ color: L.green }} />
            </div>

            <h1
              className="font-display font-extrabold text-2xl mb-2 tracking-tight"
              style={{
                color: "oklch(0.12 0.02 265)",
                letterSpacing: "-0.02em",
              }}
            >
              You're Booked! 🐾
            </h1>
            <p className="text-sm mb-6" style={{ color: L.fgMuted }}>
              {primarySitter?.name ?? "Your sitter"} will take great care of
              your pets on {formatDate(date)}.
            </p>

            <div
              className="rounded-xl border p-4 text-left space-y-2 text-sm mb-6"
              style={{
                background: "oklch(0.97 0.005 265)",
                borderColor: L.cardBorder,
              }}
            >
              {[
                ["Sitter", selectedSitters.map((s) => s.name).join(" & ")],
                ["Date", formatDate(date)],
                ["Time", `${formatTime(startTime)} – ${formatTime(endTime)}`],
                ["Service", service],
                [
                  "Reference",
                  confirmedBookingId.toString().slice(0, 10).toUpperCase(),
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span style={{ color: L.fgMuted }}>{label}</span>
                  <span
                    className="font-semibold text-right"
                    style={{ color: L.fg }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs mb-6" style={{ color: L.fgSubtle }}>
              A confirmation has been sent to {clientEmail}. Your sitter will
              reach out to confirm details.
            </p>

            <div className="space-y-2.5">
              <Button
                data-ocid="booking.view_bookings.button"
                onClick={() => navigate("booking-lookup")}
                className="w-full h-12 rounded-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${L.amber}, oklch(0.78 0.20 45))`,
                  color: "oklch(0.12 0.02 50)",
                  boxShadow: `0 4px 16px ${L.amberLight}`,
                }}
              >
                <Calendar size={16} className="mr-2" />
                View My Bookings
              </Button>
              <Button
                data-ocid="booking.book_again.button"
                variant="outline"
                onClick={() => navigate("find-sitters")}
                className="w-full h-12 rounded-xl font-bold"
              >
                Book Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: L.bg, color: L.fg }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
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
            data-ocid="booking.back.button"
            onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 text-sm font-medium min-h-[44px] min-w-[44px] transition-opacity hover:opacity-70"
            style={{ color: "oklch(0.35 0.04 265)" }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              {step === 0 ? "Choose Sitter" : "Back"}
            </span>
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
              {STEPS[step] ?? "Booking"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 flex"
          style={{ background: "oklch(0.92 0.01 265)" }}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${((step + 1) / 3) * 100}%`,
              background:
                "linear-gradient(90deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
            }}
          />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 pb-32">
        {/* Booking summary */}
        <BookingSummaryCard
          sitters={selectedSitters}
          date={date}
          startTime={startTime}
          endTime={endTime}
          service={service}
          zip={zip}
        />

        {/* Step indicator */}
        {step < 3 && <StepIndicator step={step} />}

        {/* ── STEP 0: PETS ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div
            className="space-y-5"
            style={{
              animation: "wizardStepIn 0.3s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            <style>{`
              @keyframes wizardStepIn {
                0% { opacity: 0; transform: translateY(12px); }
                100% { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <div>
              <h2
                className="font-display font-bold text-xl"
                style={{ color: L.fg, letterSpacing: "-0.02em" }}
              >
                Your Pets 🐾
              </h2>
              <p className="text-sm mt-1" style={{ color: L.fgMuted }}>
                Tell us about the pets that need care
              </p>
            </div>

            {/* Pet suitability notice */}
            <div
              className="flex gap-3 p-3.5 rounded-xl border"
              style={{
                background: "oklch(0.72 0.18 55 / 0.06)",
                borderColor: L.amberBorder,
              }}
            >
              <AlertTriangle
                size={16}
                className="shrink-0 mt-0.5"
                style={{ color: "oklch(0.55 0.16 55)" }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "oklch(0.40 0.14 55)" }}
                >
                  Pet Suitability Requirement
                </p>
                <p
                  className="text-xs mt-0.5 leading-relaxed"
                  style={{ color: "oklch(0.45 0.12 55)" }}
                >
                  Your pet must be suitable for pet sitting. Pets that are
                  aggressive, dangerous, or have behavioral issues are not
                  eligible. By proceeding, you confirm your pet is safe and
                  well-behaved.
                </p>
              </div>
            </div>

            {/* Pet cards */}
            {pets.map((pet, idx) => (
              <div
                key={pet._id}
                className="rounded-2xl border p-4 space-y-3"
                style={{
                  background: L.card,
                  borderColor: L.cardBorder,
                  boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm" style={{ color: L.fg }}>
                    {pet.petName || `Pet ${idx + 1}`}
                    {pet.petType && (
                      <span
                        className="font-normal ml-1"
                        style={{ color: L.fgMuted }}
                      >
                        · {pet.petType}
                      </span>
                    )}
                  </p>
                  {pets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePet(idx)}
                      aria-label="Remove pet"
                      className="rounded-full p-1.5 transition-colors hover:opacity-80 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      style={{ color: L.red }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-medium"
                      style={{ color: L.fg }}
                    >
                      Name *
                    </Label>
                    <Input
                      value={pet.petName}
                      onChange={(e) =>
                        updatePet(idx, "petName", e.target.value)
                      }
                      placeholder="e.g. Buddy"
                      className="rounded-lg h-11"
                      data-ocid={`booking.pet_name.input.${idx + 1}`}
                      style={{
                        background: L.inputBg,
                        borderColor: L.inputBorder,
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-medium"
                      style={{ color: L.fg }}
                    >
                      Type *
                    </Label>
                    <Select
                      value={pet.petType}
                      onValueChange={(v) => updatePet(idx, "petType", v)}
                    >
                      <SelectTrigger
                        className="rounded-lg h-11"
                        data-ocid={`booking.pet_type.select.${idx + 1}`}
                        style={{
                          background: L.inputBg,
                          borderColor: L.inputBorder,
                        }}
                      >
                        <SelectValue placeholder="Select…" />
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
                    <Label
                      className="text-xs font-medium"
                      style={{ color: L.fgMuted }}
                    >
                      Breed (optional)
                    </Label>
                    <Input
                      value={pet.breed}
                      onChange={(e) => updatePet(idx, "breed", e.target.value)}
                      placeholder="e.g. Golden Retriever"
                      className="rounded-lg h-11"
                      style={{
                        background: L.inputBg,
                        borderColor: L.inputBorder,
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      className="text-xs font-medium"
                      style={{ color: L.fgMuted }}
                    >
                      Notes (optional)
                    </Label>
                    <Input
                      value={pet.petNotes}
                      onChange={(e) =>
                        updatePet(idx, "petNotes", e.target.value)
                      }
                      placeholder="Medications, diet…"
                      className="rounded-lg h-11"
                      style={{
                        background: L.inputBg,
                        borderColor: L.inputBorder,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPet}
              className="w-full h-11 rounded-xl border-2 border-dashed text-sm font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
              style={{
                borderColor: "oklch(0.72 0.18 55 / 0.4)",
                color: "oklch(0.45 0.16 55)",
                background: L.amberLight,
              }}
              data-ocid="booking.add_pet.button"
            >
              <Plus size={16} />
              Add Another Pet
            </button>

            <div className="space-y-2">
              <Label className="text-sm font-semibold" style={{ color: L.fg }}>
                Special Instructions (optional)
              </Label>
              <Textarea
                data-ocid="booking.notes.textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dietary needs, medications, favourite toys, feeding schedule…"
                className="rounded-xl resize-none"
                rows={3}
                style={{ background: L.inputBg, borderColor: L.inputBorder }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: CONTACT ───────────────────────────────────────────── */}
        {step === 1 && (
          <div
            className="space-y-5"
            style={{
              animation: "wizardStepIn 0.3s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            <div>
              <h2
                className="font-display font-bold text-xl"
                style={{ color: L.fg, letterSpacing: "-0.02em" }}
              >
                Your Contact Info
              </h2>
              <p className="text-sm mt-1" style={{ color: L.fgMuted }}>
                Your sitter will use this to reach you
              </p>
            </div>

            {returningClient && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-xl border"
                style={{
                  background: L.amberLight,
                  borderColor: L.amberBorder,
                }}
              >
                <User size={15} style={{ color: "oklch(0.45 0.16 55)" }} />
                <p
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.40 0.14 55)" }}
                >
                  Welcome back! We found your info.
                </p>
              </div>
            )}

            <div
              className="rounded-2xl border p-5 space-y-4"
              style={{
                background: L.card,
                borderColor: L.cardBorder,
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
              }}
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="bw-name"
                  className="text-sm font-semibold"
                  style={{ color: L.fg }}
                >
                  Full Name *
                </Label>
                <Input
                  id="bw-name"
                  data-ocid="booking.client_name.input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Jane Smith"
                  className="h-11 rounded-xl"
                  style={{ background: L.inputBg, borderColor: L.inputBorder }}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="bw-email"
                  className="text-sm font-semibold"
                  style={{ color: L.fg }}
                >
                  Email Address *
                </Label>
                <Input
                  id="bw-email"
                  data-ocid="booking.client_email.input"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="jane@email.com"
                  className="h-11 rounded-xl"
                  style={{ background: L.inputBg, borderColor: L.inputBorder }}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="bw-phone"
                  className="text-sm font-semibold"
                  style={{ color: L.fg }}
                >
                  Phone Number *
                </Label>
                <Input
                  id="bw-phone"
                  data-ocid="booking.client_phone.input"
                  type="tel"
                  inputMode="numeric"
                  value={clientPhone}
                  onChange={(e) =>
                    setClientPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                        .replace(/^(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3"),
                    )
                  }
                  placeholder="(720) 555-0100"
                  className="h-11 rounded-xl"
                  style={{ background: L.inputBg, borderColor: L.inputBorder }}
                />
                {clientPhone && normalizePhone(clientPhone).length !== 10 && (
                  <p
                    data-ocid="booking.client_phone.field_error"
                    className="text-xs"
                    style={{ color: L.red }}
                  >
                    Please enter a valid 10-digit US phone number.
                  </p>
                )}
              </div>
            </div>

            {/* Communications consent */}
            <button
              type="button"
              data-ocid="booking.comms_consent.checkbox"
              onClick={() => setConsentComms((v) => !v)}
              className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
              style={{
                background: consentComms ? L.amberLight : L.card,
                borderColor: consentComms ? L.amberBorder : L.cardBorder,
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all"
                style={{
                  background: consentComms ? L.amber : "oklch(0.93 0.01 265)",
                  border: consentComms
                    ? `1.5px solid ${L.amber}`
                    : "1.5px solid oklch(0.80 0.02 265)",
                }}
              >
                {consentComms && (
                  <Check size={12} style={{ color: "oklch(0.12 0.02 50)" }} />
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: L.fg }}>
                <span className="font-semibold">Communications Consent *</span>{" "}
                I consent to receive booking confirmations, updates, and
                service-related messages from my sitter via email and text.
              </p>
            </button>

            {/* Security notice */}
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl border"
              style={{ background: L.blueLight, borderColor: L.blueBorder }}
            >
              <ShieldCheck
                size={14}
                className="shrink-0 mt-0.5"
                style={{ color: "oklch(0.38 0.14 255)" }}
              />
              <p
                className="text-xs leading-relaxed"
                style={{ color: "oklch(0.35 0.12 255)" }}
              >
                Your sitter will arrange location and access details directly
                with you for your security. Pawspect never stores your address.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: REVIEW ────────────────────────────────────────────── */}
        {step === 2 && (
          <div
            className="space-y-5"
            style={{
              animation: "wizardStepIn 0.3s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            <div>
              <h2
                className="font-display font-bold text-xl"
                style={{ color: L.fg, letterSpacing: "-0.02em" }}
              >
                Review &amp; Confirm
              </h2>
              <p className="text-sm mt-1" style={{ color: L.fgMuted }}>
                Double-check everything before submitting
              </p>
            </div>

            {/* Summary card */}
            <div
              className="rounded-2xl border divide-y"
              style={{
                background: L.card,
                borderColor: L.cardBorder,
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.04)",
              }}
            >
              {/* Sitter row */}
              <div className="p-4 flex items-center gap-3">
                {primarySitter?.photoUrl ? (
                  <img
                    src={primarySitter.photoUrl}
                    alt={primarySitter.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.18 255), oklch(0.50 0.20 280))",
                    }}
                  >
                    <span className="text-sm font-bold text-white">
                      {(primarySitter?.name ?? "?")[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: L.fg }}>
                    {selectedSitters.map((s) => s.name).join(" & ")}
                  </p>
                  <p className="text-xs" style={{ color: L.fgMuted }}>
                    {service} · {formatDate(date)}
                  </p>
                </div>
              </div>

              {/* Booking details */}
              {[
                ["Date", formatDate(date)],
                ["Time", `${formatTime(startTime)} – ${formatTime(endTime)}`],
                ["Service", service],
                ["Your Name", clientName],
                ["Email", clientEmail],
                ["Phone", clientPhone],
                [
                  "Pets",
                  pets.map((p) => `${p.petName} (${p.petType})`).join(", "),
                ],
                ...(notes ? [["Notes", notes]] : []),
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="px-4 py-2.5 flex justify-between items-start gap-3"
                >
                  <span
                    className="text-xs font-medium shrink-0"
                    style={{ color: L.fgMuted }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-xs text-right font-semibold"
                    style={{ color: L.fg }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Agreement checkboxes */}
            <div className="space-y-3">
              {[
                {
                  id: "terms",
                  checked: consentTerms,
                  toggle: () => setConsentTerms((v) => !v),
                  ocid: "booking.terms_consent.checkbox",
                  text: (
                    <>
                      <span className="font-semibold">Terms of Service *</span>{" "}
                      — I agree to{" "}
                      <span style={{ color: L.blue }}>
                        Pawspect's Terms of Service
                      </span>
                      . I understand that Pawspect is a software platform only,
                      not an employer or service provider, and all arrangements
                      are between me and my sitter.
                    </>
                  ),
                },
                {
                  id: "liability",
                  checked: consentLiability,
                  toggle: () => setConsentLiability((v) => !v),
                  ocid: "booking.liability_consent.checkbox",
                  text: (
                    <>
                      <span className="font-semibold">Liability Waiver *</span>{" "}
                      — I understand that Data Driven Design Group, LLC and
                      Pawspect bear no liability for any outcomes of pet care
                      services. All responsibility rests between me and my
                      independent pet sitter.
                    </>
                  ),
                },
                {
                  id: "cancellation",
                  checked: consentCancellation,
                  toggle: () => setConsentCancellation((v) => !v),
                  ocid: "booking.cancellation_consent.checkbox",
                  text: (
                    <>
                      <span className="font-semibold">
                        Cancellation Policy *
                      </span>{" "}
                      — Cancellations within 24 hours of service may be subject
                      to a fee at the sitter's discretion. I understand and
                      agree.
                    </>
                  ),
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-ocid={item.ocid}
                  onClick={item.toggle}
                  className="w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    background: item.checked ? L.amberLight : L.card,
                    borderColor: item.checked ? L.amberBorder : L.cardBorder,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{
                      background: item.checked
                        ? L.amber
                        : "oklch(0.93 0.01 265)",
                      border: item.checked
                        ? `1.5px solid ${L.amber}`
                        : "1.5px solid oklch(0.80 0.02 265)",
                    }}
                  >
                    {item.checked && (
                      <Check
                        size={12}
                        style={{ color: "oklch(0.12 0.02 50)" }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: L.fg }}
                  >
                    {item.text}
                  </p>
                </button>
              ))}
            </div>

            {submitError && (
              <div
                data-ocid="booking.submit.error_state"
                className="flex items-start gap-2.5 p-3.5 rounded-xl border"
                style={{ background: L.redLight, borderColor: L.redBorder }}
              >
                <AlertCircle
                  size={15}
                  className="shrink-0 mt-0.5"
                  style={{ color: L.red }}
                />
                <p className="text-xs leading-relaxed" style={{ color: L.red }}>
                  {submitError}
                </p>
              </div>
            )}

            {/* Accept All shortcut */}
            {(!consentTerms || !consentLiability || !consentCancellation) && (
              <button
                type="button"
                data-ocid="booking.accept_all.button"
                onClick={() => {
                  setConsentTerms(true);
                  setConsentLiability(true);
                  setConsentCancellation(true);
                }}
                className="w-full h-11 rounded-xl border-2 text-sm font-bold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                style={{
                  borderColor: L.amberBorder,
                  color: "oklch(0.40 0.14 55)",
                  background: L.amberLight,
                }}
              >
                <Sparkles size={14} />
                Accept All Agreements
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── Sticky CTA bar ────────────────────────────────────────────── */}
      {step < 3 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[140] px-4 pt-3 border-t"
          style={{
            background: "oklch(1 0 0 / 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "oklch(0.88 0.015 255 / 0.6)",
            boxShadow: "0 -4px 24px oklch(0 0 0 / 0.08)",
            paddingBottom:
              "max(1rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))",
          }}
        >
          <div className="max-w-3xl mx-auto">
            {step === 0 && (
              <Button
                data-ocid="booking.pets_next.button"
                onClick={() => setStep(1)}
                disabled={!petsValid}
                className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  petsValid
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
                {petsValid ? (
                  <>
                    Continue <ArrowRight size={16} className="ml-2" />
                  </>
                ) : (
                  "Add at least one pet to continue"
                )}
              </Button>
            )}

            {step === 1 && (
              <Button
                data-ocid="booking.contact_next.button"
                onClick={() => setStep(2)}
                disabled={!contactValid}
                className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  contactValid
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
                {contactValid ? (
                  <>
                    Review Booking <ArrowRight size={16} className="ml-2" />
                  </>
                ) : (
                  "Complete all required fields"
                )}
              </Button>
            )}

            {step === 2 && (
              <Button
                data-ocid="booking.submit.button"
                onClick={handleSubmit}
                disabled={!reviewValid || submitting}
                className="w-full h-12 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  reviewValid && !submitting
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
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Booking…
                  </>
                ) : reviewValid ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Confirm Booking
                  </>
                ) : (
                  "Accept all agreements to confirm"
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
