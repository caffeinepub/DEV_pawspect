import { Button } from "@/components/ui/button";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_PRICE_MONTHLY } from "../config/business";
import { useBackendActor as useActor } from "../hooks/useBackend";

interface Props {
  onReactivate: () => void;
  onExportData: () => void;
}

export default function FrozenAccountScreen({
  onReactivate,
  onExportData,
}: Props) {
  const { actor } = useActor();
  const [loading, setLoading] = useState(false);

  const handleReactivate = async () => {
    if (!actor) {
      toast.error("Not connected — please refresh and try again.");
      return;
    }
    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/#/sitter-dashboard?tab=billing&checkout=success`;
      const cancelUrl = `${window.location.origin}/#/sitter-dashboard?tab=billing&checkout=cancelled`;

      // Use recurring subscription checkout — NOT one-time payment
      const checkoutUrl = await actor.createSubscriptionCheckoutSession(
        successUrl,
        cancelUrl,
      );

      if (!checkoutUrl || checkoutUrl.trim() === "") {
        throw new Error("No checkout URL returned.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Checkout failed. Please try again.";
      toast.error(msg);
      setLoading(false);
      // Fall back to parent handler so the sitter can navigate to billing tab
      onReactivate();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.70)" }}
      data-ocid="frozen_account.dialog"
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border text-center px-6 py-8"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.18 0.16 265) 0%, oklch(0.24 0.18 275) 100%)",
          borderColor: "oklch(0.48 0.18 265 / 0.40)",
        }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.18 55 / 0.25) 0%, transparent 70%)",
            boxShadow: "0 0 40px oklch(0.72 0.18 55 / 0.20)",
            border: "1px solid oklch(0.72 0.18 55 / 0.20)",
          }}
        >
          <Lock size={36} className="text-amber-300" />
        </div>

        <h2 className="font-display text-2xl font-bold text-white mb-2">
          Account Paused
        </h2>
        <p className="text-white/65 text-sm leading-relaxed mb-2">
          Your account has been paused due to a lapsed subscription.
        </p>

        {/* Price callout */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 text-sm font-bold"
          style={{
            background: "oklch(0.72 0.18 55 / 0.15)",
            border: "1px solid oklch(0.72 0.18 55 / 0.30)",
            color: "oklch(0.85 0.14 60)",
          }}
        >
          ${SUBSCRIPTION_PRICE_MONTHLY}/month to reactivate
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-6 text-sm"
          style={{
            background: "oklch(0.25 0.06 145 / 0.30)",
            border: "1px solid oklch(0.60 0.12 145 / 0.30)",
            color: "oklch(0.80 0.12 145)",
          }}
        >
          <ShieldCheck size={14} className="shrink-0" />
          All your data is safe and preserved — nothing has been deleted.
        </div>

        <Button
          onClick={handleReactivate}
          disabled={loading}
          className="w-full h-12 rounded-2xl font-bold text-sm mb-3"
          style={{
            background: loading
              ? undefined
              : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: loading ? undefined : "#1a1a2e",
            border: "none",
          }}
          data-ocid="frozen_account.reactivate_button"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Opening checkout…
            </>
          ) : (
            `Reactivate Now — $${SUBSCRIPTION_PRICE_MONTHLY}/month`
          )}
        </Button>

        <button
          type="button"
          onClick={onExportData}
          className="text-white/40 hover:text-white/70 text-xs transition-colors underline underline-offset-2"
          data-ocid="frozen_account.export_link"
        >
          Request Data Export
        </button>
      </div>
    </div>
  );
}
