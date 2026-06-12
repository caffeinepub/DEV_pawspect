import { Button } from "@/components/ui/button";
import { BarChart3, CalendarCheck, CreditCard, Receipt, X } from "lucide-react";
import { SUBSCRIPTION_PRICE_MONTHLY } from "../config/business";

interface Props {
  open: boolean;
  onSubscribe: () => void;
  onExportData: () => void;
  onClose?: () => void;
  hasBeenDismissed: boolean;
}

const FEATURES = [
  {
    icon: CalendarCheck,
    label: "Booking management",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  {
    icon: Receipt,
    label: "Professional invoicing",
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    icon: BarChart3,
    label: "Business analytics",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
];

export default function TrialGateModal({
  open,
  onSubscribe,
  onExportData,
  onClose,
  hasBeenDismissed,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
      data-ocid="trial_gate.dialog"
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.18 0.16 265) 0%, oklch(0.22 0.18 275) 60%, oklch(0.26 0.14 255) 100%)",
          borderColor: "oklch(0.50 0.18 265 / 0.40)",
        }}
      >
        {/* Allow close only after first dismissal */}
        {hasBeenDismissed && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
            data-ocid="trial_gate.close_button"
          >
            <X size={16} />
          </button>
        )}

        <div className="px-6 pt-8 pb-6 text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 55 / 0.30) 0%, oklch(0.72 0.18 55 / 0.08) 70%)",
              boxShadow: "0 0 32px oklch(0.72 0.18 55 / 0.30)",
              border: "1px solid oklch(0.72 0.18 55 / 0.25)",
            }}
          >
            <CreditCard size={28} className="text-amber-300" />
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Your free trial has ended
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-6 max-w-[320px] mx-auto">
            You've had 30 days to experience everything this platform has to
            offer. Keep your business running for just{" "}
            <span className="text-amber-300 font-semibold">
              ${SUBSCRIPTION_PRICE_MONTHLY}/month
            </span>
            .
          </p>

          {/* Feature highlights */}
          <div className="flex justify-center gap-4 mb-7">
            {FEATURES.map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}
                >
                  <Icon size={18} className={color} />
                </div>
                <span className="text-white/60 text-[11px] text-center leading-tight max-w-[64px]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={onSubscribe}
            className="w-full h-12 rounded-2xl font-bold text-sm mb-3"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#1a1a2e",
              border: "none",
            }}
            data-ocid="trial_gate.subscribe_button"
          >
            Subscribe Now — ${SUBSCRIPTION_PRICE_MONTHLY}/month
          </Button>

          <button
            type="button"
            onClick={onExportData}
            className="text-white/40 hover:text-white/70 text-xs transition-colors underline underline-offset-2"
            data-ocid="trial_gate.export_link"
          >
            Not ready yet? Export your data
          </button>
        </div>
      </div>
    </div>
  );
}
