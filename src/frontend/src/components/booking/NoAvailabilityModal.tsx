/**
 * NoAvailabilityModal.tsx
 * Phase 6: No-availability alternatives modal.
 *
 * Shown when liveAvailabilityCount = 0 and the user clicks "Find a Sitter".
 * Presents real alternative suggestions (nearby dates/times/windows) that
 * each have at least 1 sitter available. Clicking an alternative applies it
 * to the booking draft and proceeds to sitter selection if count > 0.
 */

import { Button } from "@/components/ui/button";
import { AlertCircle, CalendarDays, Clock, Info, Timer, X } from "lucide-react";
import { useRef } from "react";
import type { AlternativeSuggestion } from "../../hooks/useBookingDraft";

// ── Design tokens (light mode) ─────────────────────────────────────────────

const L = {
  bg: "oklch(0.97 0.005 265)",
  fg: "oklch(0.15 0.02 265)",
  fgMuted: "oklch(0.50 0.03 265)",
  fgSubtle: "oklch(0.58 0.03 265)",
  card: "oklch(1 0 0)",
  cardBorder: "oklch(0.88 0.015 255 / 0.7)",
  amber: "oklch(0.72 0.18 55)",
  amberLight: "oklch(0.72 0.18 55 / 0.12)",
  amberBorder: "oklch(0.72 0.18 55 / 0.35)",
  amberText: "oklch(0.45 0.16 55)",
  amberSubText: "oklch(0.55 0.12 55)",
  divider: "oklch(0.88 0.015 255 / 0.5)",
};

// ── Time slot label map ─────────────────────────────────────────────────────

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–5pm)",
  evening: "Evening (5pm–9pm)",
};

const WINDOW_LABELS: Record<number, string> = {
  30: "30 min",
  60: "1 hour",
  90: "1.5 hrs",
  120: "2 hours",
  180: "3 hours",
  240: "4+ hours",
};

// ── Icon helpers ────────────────────────────────────────────────────────────

function getAlternativeIcon(suggestion: AlternativeSuggestion) {
  // If only time window differs, show a timer icon
  if (suggestion.label.includes("min") || suggestion.label.includes("hr")) {
    return Timer;
  }
  // If time slot differs
  if (
    suggestion.label.includes("Morning") ||
    suggestion.label.includes("Afternoon") ||
    suggestion.label.includes("Evening")
  ) {
    return Clock;
  }
  return CalendarDays;
}

function formatAlternativeDate(isoDate: string): string {
  try {
    const d = new Date(`${isoDate}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (d.toDateString() === dayAfter.toDateString())
      return "Day After Tomorrow";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return isoDate;
  }
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface NoAvailabilityModalProps {
  suggestions: AlternativeSuggestion[];
  onSelect: (suggestion: AlternativeSuggestion) => void;
  onClose: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function NoAvailabilityModal({
  suggestions,
  onSelect,
  onClose,
}: NoAvailabilityModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={backdropRef}
      data-ocid="alternatives.dialog"
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.52)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <dialog
        open
        aria-labelledby="no-avail-title"
        className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden m-0 p-0"
        style={{
          background: L.card,
          borderColor: L.cardBorder,
          boxShadow:
            "0 24px 64px oklch(0 0 0 / 0.22), 0 4px 12px oklch(0 0 0 / 0.1)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          className="flex items-start gap-3 px-5 pt-5 pb-4 border-b"
          style={{ borderColor: L.divider }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "oklch(0.50 0.18 27 / 0.10)",
              border: "1px solid oklch(0.50 0.18 27 / 0.25)",
            }}
          >
            <AlertCircle size={18} style={{ color: "oklch(0.50 0.18 27)" }} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2
              id="no-avail-title"
              className="font-display font-bold text-base leading-tight"
              style={{ color: L.fg }}
            >
              No Sitters Available
            </h2>
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: L.fgMuted }}
            >
              No sitter matches your exact request. Here are the closest
              available options — would one of these work instead?
            </p>
          </div>
          <button
            type="button"
            data-ocid="alternatives.close_button"
            onClick={onClose}
            aria-label="Close alternatives modal"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:opacity-70 ml-1"
            style={{ background: L.bg }}
          >
            <X size={14} style={{ color: L.fgMuted }} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="p-5">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Info
                size={36}
                className="mx-auto mb-3"
                style={{ color: L.fgSubtle }}
              />
              <p
                className="text-sm font-medium leading-relaxed"
                style={{ color: L.fgMuted }}
              >
                We couldn't find nearby alternatives for this service.
              </p>
              <p className="text-xs mt-1" style={{ color: L.fgSubtle }}>
                Try a different service type or check back later.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: L.fgSubtle }}
              >
                Available alternatives
              </p>
              {suggestions.map((s, i) => {
                const Icon = getAlternativeIcon(s);
                const dateLabel = formatAlternativeDate(s.date);
                const timeLabel = TIME_SLOT_LABELS[s.timeSlot] ?? s.timeSlot;
                const windowLabel =
                  WINDOW_LABELS[s.timeWindow] ?? `${s.timeWindow} min`;
                const countLabel = `${s.availableCount} sitter${s.availableCount !== 1 ? "s" : ""}`;

                return (
                  <button
                    key={i}
                    type="button"
                    data-ocid={`alternatives.suggestion.${i + 1}`}
                    onClick={() => onSelect(s)}
                    className="w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-150 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: L.amberLight,
                      borderColor: L.amberBorder,
                      boxShadow: "0 2px 8px oklch(0.72 0.18 55 / 0.10)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: "oklch(0.72 0.18 55 / 0.20)",
                          border: `1px solid ${L.amberBorder}`,
                        }}
                      >
                        <Icon size={14} style={{ color: L.amberText }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold leading-tight"
                          style={{ color: L.amberText }}
                        >
                          {dateLabel} · {timeLabel}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: L.amberSubText }}
                        >
                          {windowLabel} · {countLabel} available
                        </p>
                      </div>
                      <div
                        className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: "oklch(0.72 0.18 55 / 0.25)",
                          color: L.amberText,
                        }}
                      >
                        {s.availableCount}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div
          className="px-5 py-4 border-t flex items-center justify-between gap-3"
          style={{ borderColor: L.divider, background: L.bg }}
        >
          <p className="text-xs" style={{ color: L.fgSubtle }}>
            Or go back to adjust your criteria.
          </p>
          <Button
            data-ocid="alternatives.cancel_button"
            onClick={onClose}
            variant="outline"
            className="rounded-xl text-sm shrink-0"
          >
            Change Criteria
          </Button>
        </div>
      </dialog>
    </div>
  );
}
