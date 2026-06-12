import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  MessageSquare,
  Receipt,
  Star,
  User,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";

// ── Minimal local types matching what SitterDashboard passes ──────────────────

interface Booking {
  id: bigint;
  status: string;
  startDate: bigint;
  clientEmail?: string;
  services?: string[];
  /** Set to true when a client cancels within 24 hours of the booking start */
  withinCancellationWindow?: boolean;
}

interface Invoice {
  bookingId: bigint;
  status: string;
  /** Unix nanoseconds when the invoice was last updated / sent */
  updatedAt?: bigint;
  /** ISO date string of when payment was received, if any */
  paidDate?: string;
}

interface SitterProfile {
  bio?: string;
  photoUrl?: string;
}

interface SubscriptionInfo {
  status: string;
  expiresAt: number | null;
  trialStartedAt: number | null;
}

export interface SitterAdvisorWidgetProps {
  bookings: Booking[];
  invoices: Invoice[];
  sitter: SitterProfile | null;
  subscriptionInfo: SubscriptionInfo | null;
  onNavigate: (tab: string) => void;
  /** Open or in-progress support ticket count */
  openSupportTicketCount?: number;
}

// ── Derived action item ───────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  icon: ReactNode;
  description: string;
  tab: string;
}

function buildActionItems(
  bookings: Booking[],
  invoices: Invoice[],
  sitter: SitterProfile | null,
  subscriptionInfo: SubscriptionInfo | null,
): ActionItem[] {
  const items: ActionItem[] = [];
  const now = Date.now();

  // Build a quick lookup: bookingId → invoice
  const invoiceByBookingId = new Map<string, Invoice>();
  for (const inv of invoices) {
    invoiceByBookingId.set(inv.bookingId.toString(), inv);
  }

  // 1. Invoices not sent (completed bookings with no invoice or draft invoice)
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const noInvoiceCount = completedBookings.filter((b) => {
    const inv = invoiceByBookingId.get(b.id.toString());
    return !inv || inv.status === "draft" || inv.status === "pending";
  }).length;
  if (noInvoiceCount > 0) {
    items.push({
      id: "no-invoice",
      icon: <FileText size={15} />,

      description: `You have ${noInvoiceCount} completed booking${noInvoiceCount > 1 ? "s" : ""} with no invoice sent yet.`,
      tab: "invoices",
    });
  }

  // 1b. Cancellation charges pending — cancelled-within-24hr bookings with unpaid/sent invoices
  const cancellationChargePending = bookings.filter((b) => {
    if (!b.withinCancellationWindow) return false;
    if (b.status !== "cancelled") return false;
    const inv = invoiceByBookingId.get(b.id.toString());
    // Only flag if there's no invoice yet, or it's draft/pending (not paid/collected)
    if (!inv) return true;
    return inv.status === "draft" || inv.status === "pending";
  });
  if (cancellationChargePending.length > 0) {
    const n = cancellationChargePending.length;
    items.push({
      id: "cancellation-charge-pending",
      icon: <Receipt size={15} />,

      description: `You have ${n} cancellation${n > 1 ? "s" : ""} within the 24-hour window — you're entitled to charge the full amount. Tap to review the invoice.`,
      tab: "invoices",
    });
  }

  // 2. Overdue invoices — sent but unpaid after 7 days
  // "sent" = status is "pending" and no paidDate; use invoice updatedAt or createdAt as sent proxy
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const overdueCount = invoices.filter((inv) => {
    if (inv.status !== "pending" || inv.paidDate) return false;
    if (!inv.updatedAt) return false;
    const sentMs = Number(inv.updatedAt) / 1_000_000; // ns → ms
    return now - sentMs > sevenDaysMs;
  }).length;
  if (overdueCount > 0) {
    items.push({
      id: "overdue-invoice",
      icon: <Clock size={15} />,

      description: `${overdueCount} invoice${overdueCount > 1 ? "s" : ""} sent over a week ago ${overdueCount > 1 ? "are" : "is"} still unpaid. Consider sending a reminder.`,
      tab: "invoices",
    });
  }

  // 3. Pending bookings awaiting confirmation
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  if (pendingCount > 0) {
    items.push({
      id: "pending-bookings",
      icon: <Calendar size={15} />,

      description: `${pendingCount} booking request${pendingCount > 1 ? "s are" : " is"} waiting for your confirmation.`,
      tab: "bookings",
    });
  }

  // 4. Profile incomplete
  const hasNoBio = !sitter?.bio || sitter.bio.trim().length === 0;
  const hasNoPhoto = !sitter?.photoUrl || sitter.photoUrl.trim().length === 0;
  if (hasNoBio || hasNoPhoto) {
    items.push({
      id: "profile-incomplete",
      icon: <User size={15} />,

      description:
        "Your profile is incomplete. Add a photo and bio to attract more clients.",
      tab: "profile",
    });
  }

  // 5. Subscription expiring soon (active, within 5 days)
  if (subscriptionInfo?.status === "active" && subscriptionInfo.expiresAt) {
    const daysLeft = Math.ceil(
      (subscriptionInfo.expiresAt - now) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft > 0 && daysLeft <= 5) {
      items.push({
        id: "sub-expiring",
        icon: <CreditCard size={15} />,

        description: `Your subscription renews in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Manage it in Billing.`,
        tab: "billing",
      });
    }
  }

  // 6. Trial ending soon (trial, within 3 days)
  if (subscriptionInfo?.status === "trial" && subscriptionInfo.trialStartedAt) {
    const trialEndMs =
      subscriptionInfo.trialStartedAt + 30 * 24 * 60 * 60 * 1000;
    const daysLeft = Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 3) {
      items.push({
        id: "trial-ending",
        icon: <Zap size={15} />,

        description: `Your free trial ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Subscribe to keep full access.`,
        tab: "billing",
      });
    }
  }

  // 7. No reviews yet
  // The widget checks via bookings count as a proxy — we pass reviews length from parent
  // (handled by parent passing sitter?.reviewCount if available)
  // We use a sentinel prop pattern: check if invoices and bookings exist but skip if reviews unavailable

  return items;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SitterAdvisorWidget({
  bookings,
  invoices,
  sitter,
  subscriptionInfo,
  onNavigate,
  reviewCount = 0,
  openSupportTicketCount = 0,
}: SitterAdvisorWidgetProps & {
  reviewCount?: number;
  openSupportTicketCount?: number;
}) {
  const [expanded, setExpanded] = useState(true);

  // Build action items (computed from props on every render)
  const actionItems = buildActionItems(
    bookings,
    invoices,
    sitter,
    subscriptionInfo,
  );

  // 7. No reviews — handled here with the extra prop
  const allItems: ActionItem[] = [...actionItems];
  if (reviewCount === 0 && (bookings.length > 0 || sitter)) {
    allItems.push({
      id: "no-reviews",
      icon: <Star size={15} />,

      description:
        "You have no reviews yet. After completing a booking, ask your clients to leave a review!",
      tab: "profile",
    });
  }

  // 8. Open support ticket nudge
  if (openSupportTicketCount > 0) {
    allItems.push({
      id: "open-support-ticket",
      icon: <MessageSquare size={15} />,

      description: `You have ${openSupportTicketCount} open support ticket${openSupportTicketCount > 1 ? "s" : ""} — check the Support tab for updates.`,
      tab: "support",
    });
  }

  const count = allItems.length;
  const allClear = count === 0;

  // ── All-clear state ──────────────────────────────────────────────────────

  if (allClear) {
    return (
      <div
        data-ocid="advisor.widget.all_clear"
        className="mb-6 rounded-xl px-5 py-4 flex items-center gap-3"
        style={{
          background: "oklch(0.12 0.03 145 / 0.4)",
          border: "1px solid oklch(0.50 0.18 145 / 0.4)",
        }}
      >
        <CheckCircle2
          size={18}
          style={{ color: "oklch(0.65 0.18 145)", flexShrink: 0 }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: "oklch(0.75 0.12 145)" }}
        >
          You are all caught up! Nothing needs your attention right now.
        </p>
      </div>
    );
  }

  // ── Expanded / collapsed widget ──────────────────────────────────────────

  return (
    <div
      data-ocid="advisor.widget.card"
      className="mb-6 rounded-xl backdrop-blur-sm overflow-hidden"
      style={{
        background: "oklch(0.14 0.04 55 / 0.6)",
        border: "1px solid oklch(0.72 0.18 55 / 0.3)",
      }}
    >
      {/* Header row */}
      <button
        type="button"
        data-ocid="advisor.widget.toggle"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <Bell
          size={16}
          style={{ color: "oklch(0.72 0.18 55)", flexShrink: 0 }}
        />
        <span
          className="flex-1 text-sm font-semibold"
          style={{ color: "oklch(0.90 0.06 55)" }}
        >
          Your Business Advisor
        </span>
        {/* Count badge */}
        <span
          data-ocid="advisor.widget.count_badge"
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0.85 0.20 55)",
            color: "oklch(0.10 0.03 265)",
          }}
        >
          {count} action {count === 1 ? "item" : "items"}
        </span>
        {expanded ? (
          <ChevronUp
            size={15}
            style={{ color: "oklch(0.72 0.18 55)", flexShrink: 0 }}
          />
        ) : (
          <ChevronDown
            size={15}
            style={{ color: "oklch(0.72 0.18 55)", flexShrink: 0 }}
          />
        )}
      </button>

      {/* Action items list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {allItems.map((item, idx) => (
            <div
              key={item.id}
              data-ocid={`advisor.action_item.${idx + 1}`}
              className="flex items-start gap-3 rounded-lg px-3 py-3"
              style={{
                background: "oklch(0.10 0.03 265 / 0.4)",
                border: "1px solid oklch(0.45 0.18 265 / 0.2)",
              }}
            >
              <span
                className="shrink-0 mt-0.5 text-muted-foreground"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <p
                className="flex-1 text-sm leading-snug min-w-0"
                style={{ color: "oklch(0.82 0.05 55)" }}
              >
                {item.description}
              </p>
              <button
                type="button"
                data-ocid={`advisor.action_item.go_button.${idx + 1}`}
                onClick={() => onNavigate(item.tab)}
                className="shrink-0 text-xs font-bold rounded-lg px-3 py-1 transition-opacity hover:opacity-80 active:opacity-60 ml-2"
                style={{
                  background: "oklch(0.72 0.18 55)",
                  color: "oklch(0.10 0.03 265)",
                }}
                aria-label={`Go to ${item.tab} tab`}
              >
                Go →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
