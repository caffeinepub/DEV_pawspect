import { CheckCircle, Clock, Lock, Star, TriangleAlert } from "lucide-react";

export type SubscriptionStatus =
  | "grandfathered"
  | "trial"
  | "active"
  | "expired"
  | "frozen";

interface Props {
  status: SubscriptionStatus;
  trialDaysRemaining?: number;
  onClickUpgrade?: () => void;
  compact?: boolean;
}

export default function SubscriptionStatusBadge({
  status,
  trialDaysRemaining,
  onClickUpgrade,
  compact = false,
}: Props) {
  if (status === "grandfathered") {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.97 0.06 75), oklch(0.94 0.10 60))",
          borderColor: "oklch(0.78 0.14 65 / 0.60)",
          color: "oklch(0.45 0.18 50)",
        }}
        data-ocid="subscription.grandfathered.badge"
      >
        <Star size={11} className="fill-current shrink-0" />
        {!compact && "Lifetime Member"}
      </div>
    );
  }

  if (status === "trial") {
    const days = trialDaysRemaining !== undefined ? trialDaysRemaining : "?";
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.95 0.10 75), oklch(0.92 0.14 60))",
          borderColor: "oklch(0.72 0.18 55 / 0.50)",
          color: "oklch(0.50 0.20 50)",
        }}
        data-ocid="subscription.trial.badge"
      >
        <Clock size={11} className="shrink-0" />
        {compact
          ? `${days}d`
          : `Trial — ${days} day${days === 1 ? "" : "s"} left`}
      </div>
    );
  }

  if (status === "active") {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.07 145), oklch(0.93 0.10 145))",
          borderColor: "oklch(0.60 0.15 145 / 0.50)",
          color: "oklch(0.38 0.14 145)",
        }}
        data-ocid="subscription.active.badge"
      >
        <CheckCircle size={11} className="shrink-0" />
        {!compact && "Subscription Active"}
      </div>
    );
  }

  if (status === "expired") {
    return (
      <button
        type="button"
        onClick={onClickUpgrade}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-opacity hover:opacity-80"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.95 0.08 30), oklch(0.92 0.12 25))",
          borderColor: "oklch(0.60 0.20 25 / 0.50)",
          color: "oklch(0.45 0.22 25)",
        }}
        data-ocid="subscription.expired.badge"
      >
        <TriangleAlert size={11} className="shrink-0" />
        {compact ? "Expired" : "Trial Ended — Subscribe to continue"}
      </button>
    );
  }

  // frozen
  return (
    <button
      type="button"
      onClick={onClickUpgrade}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-opacity hover:opacity-80"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.95 0.08 25), oklch(0.92 0.12 20))",
        borderColor: "oklch(0.58 0.20 20 / 0.50)",
        color: "oklch(0.42 0.22 20)",
      }}
      data-ocid="subscription.frozen.badge"
    >
      <Lock size={11} className="shrink-0" />
      {compact ? "Suspended" : "Account Suspended"}
    </button>
  );
}
