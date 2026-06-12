import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Calendar,
  Clock,
  PawPrint,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Public__8 } from "../backend.d";

export interface AlternativeWindow {
  date: string;
  time: string;
  duration: string;
}

interface DeclineBookingModalProps {
  booking: Public__8 | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (
    bookingId: bigint,
    reason: string,
    windows: AlternativeWindow[],
  ) => Promise<void>;
  isSubmitting?: boolean;
  demoMode?: boolean;
}

const DURATION_OPTIONS = [
  "30 min",
  "1 hour",
  "1.5 hours",
  "2 hours",
  "3 hours",
  "Custom",
];

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

function getServiceTime(booking: Public__8): string | null {
  if (booking.serviceSchedule && booking.serviceSchedule.length > 0) {
    const first = booking.serviceSchedule[0]?.slots?.[0];
    if (first)
      return `${formatTime12(first.startTime)} – ${formatTime12(first.endTime)}`;
  }
  return null;
}

export default function DeclineBookingModal({
  booking,
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  demoMode = false,
}: DeclineBookingModalProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [windows, setWindows] = useState<AlternativeWindow[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setReason("");
      setReasonError("");
      setWindows([]);
    }
  }, [open]);

  if (!open || !booking) return null;

  const petsLabel =
    booking.pets?.length > 0
      ? booking.pets.map((p) => p.petName).join(", ")
      : "No pets listed";
  const servicesLabel = booking.services?.join(", ") ?? "General Care";
  const serviceTime = getServiceTime(booking);
  const canSubmit = reason.trim().length >= 10 && !isSubmitting;

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      setReasonError(
        "Please provide a reason of at least 10 characters so the client understands.",
      );
      return;
    }
    if (demoMode) {
      onClose();
      return;
    }
    await onConfirm(
      booking.id,
      reason.trim(),
      windows.filter((w) => w.date && w.time),
    );
  };

  const addWindow = () => {
    if (windows.length < 4) {
      setWindows([...windows, { date: "", time: "", duration: "1 hour" }]);
    }
  };

  const removeWindow = (idx: number) => {
    setWindows(windows.filter((_, i) => i !== idx));
  };

  const updateWindow = (
    idx: number,
    field: keyof AlternativeWindow,
    value: string,
  ) => {
    setWindows(
      windows.map((w, i) => (i === idx ? { ...w, [field]: value } : w)),
    );
  };

  return (
    /* Overlay — fixed, inset-0, flex items-center justify-center */
    <div
      data-ocid="decline.dialog"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      aria-label="Decline Booking"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden="true"
        role="presentation"
      />

      {/* Modal panel — centered, scrollable internally */}
      <div
        className="relative w-full max-w-lg mx-auto max-h-[92dvh] flex flex-col rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.12 0.02 265 / 0.97)" }}
      >
        {/* Amber glow top */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-400" />
            </div>
            <h2 className="font-display font-bold text-white text-lg">
              Decline Booking
            </h2>
          </div>
          <button
            type="button"
            data-ocid="decline.close_button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Booking summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
              Booking to decline
            </p>
            <div className="flex items-center gap-2 text-sm text-white">
              <Calendar size={13} className="text-amber-400 shrink-0" />
              <span className="font-semibold">
                {formatDate(booking.startDate)}
              </span>
              {serviceTime && (
                <span className="flex items-center gap-1 text-amber-300">
                  <Clock size={12} />
                  {serviceTime}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <PawPrint size={13} className="text-amber-400 shrink-0" />
              <span>
                <strong>{booking.clientName}</strong> · {petsLabel}
              </span>
            </div>
            <div className="text-xs text-white/50 mt-1">{servicesLabel}</div>
          </div>

          {/* Reason — required */}
          <div>
            <label
              htmlFor="decline-reason"
              className="block text-sm font-semibold text-white mb-1.5"
            >
              Reason for Declining{" "}
              <span className="text-amber-400" aria-hidden="true">
                *
              </span>
            </label>
            <Textarea
              id="decline-reason"
              data-ocid="decline.reason.textarea"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 10) setReasonError("");
              }}
              placeholder="Let the client know why you can't make this booking..."
              rows={4}
              className="resize-none border-white/20 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-500 focus-visible:border-amber-500 rounded-xl"
              style={{ fontSize: "16px" }}
            />
            {reasonError && (
              <p
                data-ocid="decline.reason.field_error"
                className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
              >
                <AlertTriangle size={11} />
                {reasonError}
              </p>
            )}
            <p className="text-xs text-white/40 mt-1">
              {reason.length} chars
              {reason.length < 10
                ? ` · ${10 - reason.length} more needed`
                : " · ✓"}
            </p>
          </div>

          {/* Alternative windows — optional */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  Suggest Alternative Times{" "}
                  <span className="text-white/40 font-normal">(Optional)</span>
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  Help the client rebook — suggest up to 4 times that work for
                  you
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {windows.map((w, i) => (
                <div
                  key={`win-${i}`}
                  data-ocid={`decline.alt_window.item.${i + 1}`}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Calendar size={11} />
                      Window {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWindow(i)}
                      className="text-white/40 hover:text-white/80 transition-colors"
                      aria-label={`Remove window ${i + 1}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor={`win-date-${i}`}
                        className="text-[11px] text-white/50 block mb-1"
                      >
                        Date
                      </label>
                      <input
                        id={`win-date-${i}`}
                        type="date"
                        value={w.date}
                        onChange={(e) =>
                          updateWindow(i, "date", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/15 bg-white/5 text-white text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        style={{ fontSize: "16px", colorScheme: "dark" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`win-time-${i}`}
                        className="text-[11px] text-white/50 block mb-1"
                      >
                        Time
                      </label>
                      <input
                        id={`win-time-${i}`}
                        type="time"
                        value={w.time}
                        onChange={(e) =>
                          updateWindow(i, "time", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/15 bg-white/5 text-white text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        style={{ fontSize: "16px", colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor={`win-dur-${i}`}
                      className="text-[11px] text-white/50 block mb-1"
                    >
                      Duration
                    </label>
                    <select
                      id={`win-dur-${i}`}
                      value={w.duration}
                      onChange={(e) =>
                        updateWindow(i, "duration", e.target.value)
                      }
                      className="w-full rounded-lg border border-white/15 bg-white/5 text-white text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      style={{ fontSize: "16px", colorScheme: "dark" }}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d} className="bg-gray-900">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {windows.length < 4 && (
                <button
                  type="button"
                  data-ocid="decline.add_window.button"
                  onClick={addWindow}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-amber-500/30 text-amber-400 text-sm font-medium hover:border-amber-500/60 hover:bg-amber-500/5 transition-all min-h-[44px]"
                >
                  <Plus size={14} />
                  Add a time
                </button>
              )}
            </div>
          </div>

          {demoMode && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-300 text-center">
              Demo mode — decline won't be sent to the backend
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4 flex gap-3">
          <button
            type="button"
            data-ocid="decline.cancel_button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10 min-h-[44px]"
          >
            Cancel
          </button>
          <Button
            data-ocid="decline.submit_button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-[2] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold min-h-[44px] disabled:opacity-40"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              "Send & Decline"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
