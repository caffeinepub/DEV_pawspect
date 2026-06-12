import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_PRICE_MONTHLY } from "../config/business";
import { useBackendActor as useActor } from "../hooks/useBackend";
import type { SubscriptionStatus } from "./SubscriptionStatusBadge";

interface Props {
  subscriptionStatus: SubscriptionStatus;
  trialDaysRemaining?: number;
  sitterId?: bigint | null;
  /** Real Stripe customer ID from getSitterLicenseStatus — used for billing portal link */
  stripeCustomerId?: string;
  onSubscribeSuccess?: () => void;
  onCancelSuccess?: () => void;
}

const PLAN_FEATURES = [
  { icon: CalendarCheck, label: "Booking management" },
  { icon: Receipt, label: "Professional invoicing" },
  { icon: Users, label: "Client CRM" },
  { icon: BarChart3, label: "Business analytics" },
  { icon: ShieldCheck, label: "Coach & Growth tools" },
  { icon: CalendarCheck, label: "Unlimited bookings" },
];

function StatusCard({
  status,
  trialDaysRemaining,
}: {
  status: SubscriptionStatus;
  trialDaysRemaining?: number;
}) {
  const configs: Record<
    SubscriptionStatus,
    {
      bg: string;
      border: string;
      text: string;
      icon: typeof Clock;
      iconColor: string;
      message: string;
    }
  > = {
    grandfathered: {
      bg: "linear-gradient(135deg, oklch(0.97 0.06 75), oklch(0.94 0.10 60))",
      border: "oklch(0.78 0.14 65 / 0.60)",
      text: "oklch(0.45 0.18 50)",
      icon: ShieldCheck,
      iconColor: "oklch(0.55 0.18 55)",
      message: "Lifetime access. No subscription required.",
    },
    trial: {
      bg: "linear-gradient(135deg, oklch(0.95 0.09 75), oklch(0.92 0.13 60))",
      border: "oklch(0.72 0.18 55 / 0.50)",
      text: "oklch(0.48 0.20 50)",
      icon: Clock,
      iconColor: "oklch(0.55 0.20 55)",
      message: `You're in your free trial. ${trialDaysRemaining ?? "?"} days remaining.`,
    },
    active: {
      bg: "linear-gradient(135deg, oklch(0.96 0.07 145), oklch(0.93 0.10 145))",
      border: "oklch(0.60 0.15 145 / 0.50)",
      text: "oklch(0.36 0.14 145)",
      icon: CheckCircle,
      iconColor: "oklch(0.50 0.16 145)",
      message: "Subscription active. All features unlocked.",
    },
    expired: {
      bg: "linear-gradient(135deg, oklch(0.95 0.08 30), oklch(0.92 0.12 25))",
      border: "oklch(0.60 0.20 25 / 0.50)",
      text: "oklch(0.43 0.22 25)",
      icon: Clock,
      iconColor: "oklch(0.55 0.22 25)",
      message: "Trial ended. Subscribe to restore full access.",
    },
    frozen: {
      bg: "linear-gradient(135deg, oklch(0.95 0.08 20), oklch(0.92 0.12 15))",
      border: "oklch(0.58 0.20 20 / 0.50)",
      text: "oklch(0.40 0.22 20)",
      icon: Clock,
      iconColor: "oklch(0.50 0.22 20)",
      message: "Account paused. Subscribe to reactivate.",
    },
  };

  const cfg = configs[status];
  const Icon = cfg.icon;
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
      data-ocid="billing.status.card"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(1 0 0 / 0.40)" }}
        >
          <Icon size={18} style={{ color: cfg.iconColor }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: cfg.text }}>
            Current Status:{" "}
            {status === "grandfathered"
              ? "Lifetime Member"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: cfg.text, opacity: 0.8 }}
          >
            {cfg.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPortalTab({
  subscriptionStatus,
  trialDaysRemaining,
  sitterId,
  stripeCustomerId,
  onSubscribeSuccess,
  onCancelSuccess,
}: Props) {
  const { actor } = useActor();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelledEndOfPeriod, setCancelledEndOfPeriod] = useState(false);

  // Detect return from Stripe hosted checkout
  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutParam = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");

    if (checkoutParam === "success" && sessionId && actor) {
      (async () => {
        try {
          await actor.getStripeSessionStatus(sessionId);
          setCheckoutSuccess(true);
          onSubscribeSuccess?.();
          window.scrollTo({ top: 0, behavior: "smooth" });
          toast.success(
            "🎉 Subscription activated! All features are now unlocked.",
            { duration: 6000 },
          );
        } catch (err) {
          toast.error(
            "Subscription verification failed — please contact support.",
          );
          console.error("Stripe confirm error:", err);
        }
        const clean = new URL(window.location.href);
        clean.searchParams.delete("checkout");
        clean.searchParams.delete("session_id");
        window.history.replaceState({}, "", clean.toString());
      })();
    } else if (checkoutParam === "cancelled") {
      setCheckoutCancelled(true);
      const clean = new URL(window.location.href);
      clean.searchParams.delete("checkout");
      window.history.replaceState({}, "", clean.toString());
    }
  }, [actor, onSubscribeSuccess]);

  /**
   * Initiates Stripe recurring subscription checkout.
   * Uses createSubscriptionCheckoutSession — recurring $15/mo, NOT one-time payment.
   */
  const handleSubscribe = async () => {
    if (!actor) {
      setCheckoutError("Not connected — please try again.");
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutCancelled(false);
    try {
      const successUrl = `${window.location.origin}/#/sitter-dashboard?tab=billing&checkout=success`;
      const cancelUrl = `${window.location.origin}/#/sitter-dashboard?tab=billing&checkout=cancelled`;

      const checkoutUrl = await actor.createSubscriptionCheckoutSession(
        successUrl,
        cancelUrl,
      );

      if (!checkoutUrl || checkoutUrl.trim() === "") {
        throw new Error("No checkout URL returned from server.");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Checkout failed. Please try again.";
      setCheckoutError(msg);
      toast.error(msg);
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!actor || !sitterId) {
      toast.error("Unable to cancel — please try again.");
      return;
    }
    setCancelLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).cancelSubscription(sitterId);
      if (result && typeof result === "object" && "err" in result) {
        throw new Error(String(result.err));
      }
      setCancelledEndOfPeriod(true);
      onCancelSuccess?.();
      toast.success(
        "Subscription cancelled. Your account stays active until the end of your billing period.",
        { duration: 6000 },
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Cancellation failed. Please try again.";
      toast.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleManageBilling = () => {
    window.open(
      "https://billing.stripe.com/p/login",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const isActive = subscriptionStatus === "active";
  const isTrial = subscriptionStatus === "trial";
  const canSubscribeExpiredOrFrozen =
    subscriptionStatus === "expired" || subscriptionStatus === "frozen";

  return (
    <div className="space-y-5" data-ocid="billing.tab">
      {/* Status card */}
      <StatusCard
        status={subscriptionStatus}
        trialDaysRemaining={trialDaysRemaining}
      />

      {/* ── Early subscribe banner — trial sitters only ──────────────────────── */}
      {isTrial && !checkoutSuccess && (
        <div
          className="rounded-2xl p-5 border"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.16 265 / 0.95), oklch(0.22 0.20 270 / 0.95))",
            borderColor: "oklch(0.55 0.22 270 / 0.40)",
          }}
          data-ocid="billing.early_subscribe.card"
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.72 0.18 55 / 0.20)" }}
            >
              <Zap size={18} className="text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">
                Love it? Lock in your subscription today
              </p>
              <p className="text-xs text-white/65 mt-0.5 leading-relaxed">
                Skip the rest of your trial — start your $
                {SUBSCRIPTION_PRICE_MONTHLY}/month subscription now and keep
                everything running without interruption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {["No interruption", "Full access", "Cancel anytime"].map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 text-xs text-white/80"
              >
                <Sparkles size={11} className="text-amber-300 shrink-0" />
                {tag}
              </div>
            ))}
          </div>
          {checkoutError && (
            <p
              className="text-xs text-center mb-2 px-2"
              style={{ color: "oklch(0.75 0.18 30)" }}
              data-ocid="billing.early_subscribe.error_state"
            >
              {checkoutError}
            </p>
          )}
          <Button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="w-full h-11 rounded-2xl font-bold text-sm"
            style={{
              background: checkoutLoading
                ? undefined
                : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: checkoutLoading ? undefined : "#1a1a2e",
              border: "none",
            }}
            data-ocid="billing.early_subscribe.button"
          >
            {checkoutLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Opening checkout…
              </>
            ) : (
              `Start My Subscription — $${SUBSCRIPTION_PRICE_MONTHLY}/month`
            )}
          </Button>
        </div>
      )}

      {/* Checkout cancelled notice */}
      {checkoutCancelled && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.97 0.05 55), oklch(0.94 0.08 50))",
            borderColor: "oklch(0.78 0.14 55 / 0.40)",
          }}
          data-ocid="billing.cancelled_state"
        >
          <XCircle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Subscription not activated — you can try again anytime.
          </p>
        </div>
      )}

      {/* Plan card */}
      <div
        className="bg-card rounded-2xl border border-border p-5"
        data-ocid="billing.plan.card"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              ${SUBSCRIPTION_PRICE_MONTHLY}
              <span className="text-sm font-medium text-muted-foreground">
                /month
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All features included · Cancel anytime · No platform fees
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-primary" />
          </div>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {PLAN_FEATURES.map(({ label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check size={11} className="text-emerald-600" />
              </div>
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Subscribe / success / active state */}
        {checkoutSuccess ? (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderColor: "#bbf7d0",
            }}
            data-ocid="billing.success_state"
          >
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Subscription activated!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                All features are now unlocked.
              </p>
            </div>
          </div>
        ) : canSubscribeExpiredOrFrozen ? (
          <div className="space-y-2">
            {checkoutError && (
              <p
                className="text-xs text-center px-2"
                style={{ color: "oklch(0.50 0.22 25)" }}
                data-ocid="billing.error_state"
              >
                {checkoutError}
              </p>
            )}
            <Button
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-full h-12 rounded-2xl font-bold text-sm"
              style={{
                background: checkoutLoading
                  ? undefined
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
                color: checkoutLoading ? undefined : "#1a1a2e",
                border: "none",
              }}
              data-ocid="billing.subscribe_button"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                `Subscribe Now — $${SUBSCRIPTION_PRICE_MONTHLY}/month`
              )}
            </Button>
          </div>
        ) : isActive ? (
          <div className="space-y-3">
            {cancelledEndOfPeriod ? (
              <div
                className="flex items-start gap-3 p-4 rounded-2xl border"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.97 0.05 55), oklch(0.94 0.08 50))",
                  borderColor: "oklch(0.78 0.14 55 / 0.40)",
                }}
                data-ocid="billing.cancelled_end_of_period_state"
              >
                <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Subscription cancelled
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Your account stays active through the end of your current
                    billing period. After that, your account will be frozen. You
                    can reactivate at any time, or request a GDPR data export
                    from your Account &amp; Privacy tab.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <CheckCircle
                    size={14}
                    className="text-emerald-600 shrink-0"
                  />
                  <span className="text-sm text-emerald-800 font-medium">
                    Your subscription is active
                  </span>
                  {stripeCustomerId && (
                    <span className="ml-auto text-xs text-emerald-600 font-mono truncate max-w-[100px]">
                      {stripeCustomerId.slice(0, 12)}…
                    </span>
                  )}
                </div>

                {/* Manage Subscription — opens Stripe Customer Portal */}
                <div
                  className="rounded-2xl border border-border p-4 space-y-3"
                  data-ocid="billing.manage_subscription.card"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        Manage Your Subscription
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        To update your payment method, view invoices, or cancel
                        your subscription, log in to Stripe's billing portal
                        using the email associated with your Stripe account.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    className="w-full h-11 rounded-2xl font-semibold text-sm border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 gap-2"
                    data-ocid="billing.manage_subscription.button"
                  >
                    <CreditCard size={15} />
                    Open Stripe Billing Portal
                    <ExternalLink
                      size={13}
                      className="ml-auto text-muted-foreground"
                    />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll need to enter the email address used when you first
                    subscribed.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                      data-ocid="billing.cancel_subscription.button"
                    >
                      Cancel subscription
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="billing.cancel.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your account will stay active until the end of your
                        current billing period, then it will be frozen. You can
                        reactivate at any time, or request a GDPR data export
                        and account anonymization from your Account &amp;
                        Privacy tab.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="billing.cancel.cancel_button">
                        Keep subscription
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        data-ocid="billing.cancel.confirm_button"
                      >
                        {cancelLoading ? (
                          <>
                            <Loader2
                              size={14}
                              className="mr-1.5 animate-spin"
                            />
                            Cancelling…
                          </>
                        ) : (
                          "Cancel subscription"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Billing history */}
      <div
        className="bg-card rounded-2xl border border-border p-5"
        data-ocid="billing.history.section"
      >
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <RefreshCw size={14} className="text-primary" />
          Billing History
        </h3>
        {!isActive ? (
          <div
            className="text-center py-6"
            data-ocid="billing.history.empty_state"
          >
            <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
              <Receipt size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your billing history will appear here once you subscribe.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Billing history is managed through your payment provider.
          </p>
        )}
      </div>
    </div>
  );
}
