import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Heart,
  History,
  Loader2,
  Minus,
  PawPrint,
  Phone,
  Plus,
  Printer,
  Send,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AdHocLineItem,
  DayServiceSchedule,
  PaymentMethodDetails,
  Pet,
  Public,
  Public__6,
  Public__7,
  Public__8,
  ServiceSlot,
} from "../backend.d";
import { AuditAction, PaymentMethod, PaymentStatus } from "../backend.d";
import {
  APP_NAME,
  BUNDLE_DISCOUNT_MIN_SERVICES,
  BUNDLE_DISCOUNT_PERCENT,
  DISCOUNT_OPTIONS,
  SUPPORT_EMAIL,
} from "../config/business";
import {
  useAdjustPaymentPrice,
  useConfirmManualPaymentWithEmail,
  useCreatePayment,
  usePayment,
  usePaymentAuditLog,
  useSendInvoiceToClient,
  useSetInvoicePaymentMethod,
  useUpdateInvoiceAdHocItems,
  useUpdateInvoicePaidDate,
  useUpdatePaymentWithDiscount,
} from "../hooks/useQueries";

const DISCOUNT_PRESETS = DISCOUNT_OPTIONS;

const ADHOC_PRESET_DESCRIPTIONS = [
  "Extra time",
  "Transportation fee",
  "Supply cost",
  "Tip",
  "Holiday surcharge",
  "Discount / credit",
  "Other",
];

function formatDateTime(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatAuditTimestamp(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateISO(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDays(start: bigint, end: bigint): number {
  const ms = Number((end - start) / 1_000_000n);
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

function calcSuggestedTotal(booking: Public__8, allSitters: Public[]): number {
  const days = getDays(booking.startDate, booking.endDate);
  const ids = booking.sitterIds ?? [];
  if (ids.length >= 2) {
    const s1 = allSitters.find((s) => s.id === ids[0]);
    const s2 = allSitters.find((s) => s.id === ids[1]);
    const r1 = s1 ? Number(s1.hourlyRate) : 0;
    const r2 = s2 ? Number(s2.hourlyRate) : 0;
    return ((r1 + r2) / 2 + 10) * days;
  }
  const s = allSitters.find((s) => ids.length > 0 && s.id === ids[0]);
  return (s ? Number(s.hourlyRate) : 0) * days;
}

function calcScheduleTotal(schedule: DayServiceSchedule[]): {
  subtotal: number;
  discount: number;
  total: number;
} {
  const allSlots: ServiceSlot[] = schedule.flatMap((d) => d.slots);
  const subtotal = allSlots.reduce((sum, slot) => {
    const hours = Number(slot.durationMinutes) / 60;
    return sum + hours * Number(slot.ratePerHour);
  }, 0);
  const discount =
    allSlots.length >= BUNDLE_DISCOUNT_MIN_SERVICES
      ? subtotal * (BUNDLE_DISCOUNT_PERCENT / 100)
      : 0;
  return { subtotal, discount, total: subtotal - discount };
}

function getAuditActionLabel(action: AuditAction): string {
  switch (action) {
    case AuditAction.PriceAdjusted:
      return "Price adjusted";
    case AuditAction.DiscountApplied:
      return "Discount applied";
    case AuditAction.ServiceCompletionUpdated:
      return "Completion updated";
    default:
      return String(action);
  }
}

function getAuditIcon(action: AuditAction) {
  switch (action) {
    case AuditAction.DiscountApplied:
      return <Tag size={12} className="text-amber-500" />;
    case AuditAction.ServiceCompletionUpdated:
      return <Check size={12} className="text-emerald-500" />;
    default:
      return (
        <span className="text-indigo-500 font-bold text-[11px] leading-none">
          $
        </span>
      );
  }
}

interface AuditSnapshot {
  oldAmount?: number;
  newAmount?: number;
  discountPercent?: number;
  originalAmount?: number;
  reason?: string;
  [key: string]: unknown;
}

function parseSnapshot(snapshotStr: string): AuditSnapshot {
  try {
    return JSON.parse(snapshotStr) as AuditSnapshot;
  } catch {
    return {};
  }
}

// ── Local editable line item (before save) ────────────────────────────────
interface LocalAdHocItem {
  id: string;
  description: string;
  amountStr: string; // e.g. "5.00" or "-10.00"
}

function newLocalItem(): LocalAdHocItem {
  return {
    id: String(Date.now() + Math.random()),
    description: "",
    amountStr: "",
  };
}

// ── Payment method selection panel ───────────────────────────────────────
type PayMethodKind = "venmo" | "applePayCash" | "cash";

interface Props {
  booking: Public__8;
  sitterName: string;
  allSitters: Public[];
  open: boolean;
  onClose: () => void;
  /** Controls permission level. Clients get read-only view; sitters/admins can mark as paid. Defaults to 'sitter'. */
  viewerRole?: "client" | "sitter" | "admin";
  /** If true, automatically expand the discount section on open */
  openDiscountSection?: boolean;
  /** Sitter's phone number for pre-filling Apple Pay Cash */
  sitterPhone?: string;
}

export default function InvoiceModal({
  booking,
  sitterName,
  allSitters,
  open,
  onClose,
  viewerRole = "sitter",
  openDiscountSection = false,
  sitterPhone = "",
}: Props) {
  const { data: payment, isLoading: paymentLoading } = usePayment(
    open ? booking.id : null,
  );
  const createPayment = useCreatePayment();
  const confirmPaymentWithEmail = useConfirmManualPaymentWithEmail();
  const updateDiscount = useUpdatePaymentWithDiscount();
  const adjustPrice = useAdjustPaymentPrice();
  const updatePaidDate = useUpdateInvoicePaidDate();
  const updateAdHocItems = useUpdateInvoiceAdHocItems();
  const setPaymentMethod = useSetInvoicePaymentMethod();
  const sendInvoice = useSendInvoiceToClient();

  const isPaid = payment?.status === PaymentStatus.paid;
  const isEditor = viewerRole !== "client";

  const suggestedTotal = calcSuggestedTotal(booking, allSitters);
  const [amountStr, setAmountStr] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Discount state
  const [showDiscount, setShowDiscount] = useState(openDiscountSection);
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [customPct, setCustomPct] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Paid date state
  const [paidDateInput, setPaidDateInput] = useState("");
  const [isSavingDate, setIsSavingDate] = useState(false);

  // Audit trail state
  const [showHistory, setShowHistory] = useState(false);
  const { data: auditLog = [], isLoading: auditLoading } = usePaymentAuditLog(
    showHistory && open ? booking.id : null,
  );

  // ── Ad-hoc line items state ────────────────────────────────────────────
  const [showAdHoc, setShowAdHoc] = useState(false);
  const [localItems, setLocalItems] = useState<LocalAdHocItem[]>([]);
  const [isSavingAdHoc, setIsSavingAdHoc] = useState(false);
  const adHocInitialised = useRef(false);

  // ── Send Invoice panel state ───────────────────────────────────────────
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [payMethodKind, setPayMethodKind] = useState<PayMethodKind>("venmo");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [applePhone, setApplePhone] = useState(sitterPhone);
  const [cashInstructions, setCashInstructions] = useState("");
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setShowDiscount(false);
      setShowHistory(false);
      setSelectedPct(null);
      setCustomPct("");
      setIsCustom(false);
      setShowAdHoc(false);
      setShowSendPanel(false);
      adHocInitialised.current = false;
    } else {
      setShowDiscount(openDiscountSection);
    }
  }, [open, openDiscountSection]);

  // Populate from payment record
  useEffect(() => {
    if (payment) {
      setAmountStr((Number(payment.totalAmount) / 100).toFixed(2));
      // Pre-fill paid date if exists
      if (payment.paidDate) {
        setPaidDateInput(payment.paidDate);
      } else if (isPaid) {
        setPaidDateInput(new Date().toISOString().split("T")[0]);
      }

      // Populate adHoc items from saved record (once)
      if (!adHocInitialised.current) {
        adHocInitialised.current = true;
        const saved =
          (payment as unknown as { adHocItems?: AdHocLineItem[] }).adHocItems ??
          [];
        if (saved.length > 0) {
          setLocalItems(
            saved.map((item) => ({
              id: String(item.createdAt),
              description: item.description,
              amountStr: (Number(item.amountCents) / 100).toFixed(2),
            })),
          );
        }
      }

      // Pre-fill payment method from saved record
      const saved = (
        payment as unknown as { paymentMethodDetails?: PaymentMethodDetails }
      ).paymentMethodDetails;
      if (saved) {
        if ("venmo" in saved) {
          setPayMethodKind("venmo");
          setVenmoHandle((saved as { venmo: { handle: string } }).venmo.handle);
        } else if ("applePayCash" in saved) {
          setPayMethodKind("applePayCash");
          setApplePhone(
            (saved as { applePayCash: { sitterPhone: string } }).applePayCash
              .sitterPhone,
          );
        } else if ("cash" in saved) {
          setPayMethodKind("cash");
          setCashInstructions(
            (saved as { cash: { instructions: string } }).cash.instructions,
          );
        }
      } else if (sitterPhone) {
        setApplePhone(sitterPhone);
      }
    } else if (open) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schedule = (booking as any).serviceSchedule as
        | DayServiceSchedule[]
        | undefined;
      if (schedule && schedule.length > 0) {
        setAmountStr(calcScheduleTotal(schedule).total.toFixed(2));
      } else {
        setAmountStr(suggestedTotal.toFixed(2));
      }
      if (sitterPhone) setApplePhone(sitterPhone);
    }
  }, [payment, open, suggestedTotal, booking, isPaid, sitterPhone]);

  const displayAmount = amountStr ? Number.parseFloat(amountStr) || 0 : 0;

  // Sum of adHoc items in dollars
  const adHocTotal = localItems.reduce((sum, item) => {
    const v = Number.parseFloat(item.amountStr) || 0;
    return sum + v;
  }, 0);

  const days = getDays(booking.startDate, booking.endDate);
  const twoSitters = (booking.sitterIds ?? []).length >= 2;
  const invoiceNum = `${APP_NAME.toUpperCase().slice(0, 3)}-${booking.id.toString().padStart(4, "0")}`;
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const petsList =
    booking.pets?.length > 0
      ? booking.pets
          .map((p) => `${p.petName}${p.petType ? ` (${p.petType})` : ""}`)
          .join(", ")
      : "—";

  const servicesList =
    booking.services?.length > 0 ? booking.services.join(", ") : "General Care";

  // Calculate discount preview
  const effectivePct = isCustom
    ? Number.parseFloat(customPct) || 0
    : (selectedPct ?? 0);

  const originalAmountCents = payment?.originalAmount
    ? Number(payment.originalAmount)
    : payment
      ? Number(payment.totalAmount)
      : Math.round(displayAmount * 100);

  const originalDollars = originalAmountCents / 100;
  const discountedDollars =
    effectivePct > 0
      ? originalDollars * (1 - effectivePct / 100)
      : originalDollars;
  const savingDollars = originalDollars - discountedDollars;

  const hasAppliedDiscount =
    payment?.discountPercent !== undefined &&
    payment?.discountPercent !== null &&
    Number(payment.discountPercent) > 0;

  // Grand total = displayAmount (which already includes any base discount) + adHocTotal
  const grandTotal = displayAmount + adHocTotal;

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleMarkPaid = async () => {
    setIsSaving(true);
    try {
      const amountCents = BigInt(Math.round(displayAmount * 100));
      const today = new Date().toISOString().split("T")[0];
      const dateToUse = paidDateInput || today;

      if (!payment) {
        await createPayment.mutateAsync({
          bookingId: booking.id,
          method: PaymentMethod.manual,
          totalAmount: amountCents,
          notes: payMethodKind,
          splits: [],
        });
      } else {
        const currentAmount = Number(payment.totalAmount);
        const newAmount = Math.round(displayAmount * 100);
        if (currentAmount !== newAmount) {
          await adjustPrice.mutateAsync({
            bookingId: booking.id,
            newAmount: BigInt(newAmount),
            reason: "Manual price adjustment by sitter",
          });
        }
      }

      await confirmPaymentWithEmail.mutateAsync({
        bookingId: booking.id,
        paidDate: dateToUse,
      });

      if (!paidDateInput) setPaidDateInput(today);
      toast.success(
        "Invoice marked as paid! Confirmation email sent to client.",
      );
    } catch (err) {
      toast.error(
        `Failed to mark as paid: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAmount = async () => {
    if (!payment) return;
    setIsSaving(true);
    try {
      const newAmount = BigInt(Math.round(displayAmount * 100));
      await adjustPrice.mutateAsync({
        bookingId: booking.id,
        newAmount,
        reason: "Manual price adjustment by sitter",
      });
      toast.success("Price updated!");
    } catch {
      toast.error("Failed to update price.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (effectivePct <= 0 || effectivePct >= 100) {
      toast.error("Please choose a discount between 1–99%.");
      return;
    }
    setIsApplyingDiscount(true);
    try {
      const origCents = BigInt(originalAmountCents);
      const newCents = BigInt(Math.round(discountedDollars * 100));
      const pct = BigInt(Math.round(effectivePct));

      if (!payment) {
        await createPayment.mutateAsync({
          bookingId: booking.id,
          method: PaymentMethod.manual,
          totalAmount: BigInt(Math.round(displayAmount * 100)),
          notes: payMethodKind,
          splits: [],
        });
      }

      await updateDiscount.mutateAsync({
        bookingId: booking.id,
        discountPercent: pct,
        newTotalAmount: newCents,
        originalAmount: origCents,
      });

      toast.success("Discount applied successfully!");
      setShowDiscount(false);
      setSelectedPct(null);
      setCustomPct("");
      setIsCustom(false);
    } catch (err) {
      toast.error(
        `Failed to apply discount: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleSavePaidDate = async () => {
    if (!paidDateInput) return;
    setIsSavingDate(true);
    try {
      await updatePaidDate.mutateAsync({
        bookingId: booking.id,
        paidDate: paidDateInput,
      });
      toast.success("Paid date saved!");
    } catch {
      toast.error("Failed to save paid date.");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleSaveAdHocItems = async () => {
    setIsSavingAdHoc(true);
    try {
      const now = BigInt(Date.now()) * 1_000_000n;
      const items: AdHocLineItem[] = localItems
        .filter((item) => item.description.trim())
        .map((item, idx) => ({
          description: item.description.trim(),
          amountCents: BigInt(
            Math.round((Number.parseFloat(item.amountStr) || 0) * 100),
          ),
          createdAt: now + BigInt(idx),
        }));

      // Ensure payment exists first
      if (!payment) {
        await createPayment.mutateAsync({
          bookingId: booking.id,
          method: PaymentMethod.manual,
          totalAmount: BigInt(Math.round(displayAmount * 100)),
          notes: payMethodKind,
          splits: [],
        });
      }

      await updateAdHocItems.mutateAsync({ bookingId: booking.id, items });
      toast.success("Extra items saved!");
    } catch (err) {
      toast.error(
        `Failed to save items: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSavingAdHoc(false);
    }
  };

  const handleSendInvoice = async () => {
    setIsSendingInvoice(true);
    try {
      // Build method object
      let method: PaymentMethodDetails;
      if (payMethodKind === "venmo") {
        if (!venmoHandle.trim())
          throw new Error("Please enter your Venmo handle.");
        method = {
          __kind__: "venmo",
          venmo: { handle: venmoHandle.trim().replace(/^@/, "") },
        };
      } else if (payMethodKind === "applePayCash") {
        if (!applePhone.trim())
          throw new Error("Please enter your phone number.");
        method = {
          __kind__: "applePayCash",
          applePayCash: { sitterPhone: applePhone.trim() },
        };
      } else {
        method = {
          __kind__: "cash",
          cash: { instructions: cashInstructions.trim() },
        };
      }

      // Ensure payment record exists
      if (!payment) {
        await createPayment.mutateAsync({
          bookingId: booking.id,
          method: PaymentMethod.manual,
          totalAmount: BigInt(Math.round(displayAmount * 100)),
          notes: payMethodKind,
          splits: [],
        });
      }

      await setPaymentMethod.mutateAsync({ bookingId: booking.id, method });
      await sendInvoice.mutateAsync(booking.id);

      toast.success(`Invoice sent to ${booking.clientEmail}!`);
      setShowSendPanel(false);
    } catch (err) {
      toast.error(
        `Failed to send invoice: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const buildScheduleHtml = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schedule = (booking as any).serviceSchedule as
      | DayServiceSchedule[]
      | undefined;
    if (schedule && schedule.length > 0) {
      const { subtotal, discount } = calcScheduleTotal(schedule);
      const rows = schedule
        .map((day) => {
          const d = new Date(`${day.date}T12:00:00`);
          const dayLabel = d.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const petNames =
            booking.pets?.length > 0
              ? booking.pets.map((p: Pet) => p.petName).join(" &amp; ")
              : null;
          const slotRows = day.slots
            .map((slot: ServiceSlot) => {
              const rawHours = Number(slot.durationMinutes) / 60;
              const billedHours = Math.max(1, rawHours);
              const rate = Number(slot.ratePerHour);
              const cost = billedHours * rate;
              const sitterObj = allSitters.find((s) => s.id === slot.sitterId);
              const hrsLabel =
                billedHours % 1 === 0
                  ? `${billedHours}`
                  : billedHours.toFixed(1);
              const hrWord = billedHours === 1 ? "hr" : "hrs";
              const petSuffix = petNames
                ? ` <span style="font-size:11px;color:#9ca3af;font-weight:400;">— ${petNames}</span>`
                : "";
              return `
            <tr>
              <td style="padding:8px 12px 2px;font-size:13px;color:#1e1b4b;font-weight:500;">${slot.service}${petSuffix}</td>
              <td style="padding:8px 12px 2px;font-size:12px;color:#6b7280;">${sitterObj?.name ?? "Sitter"}</td>
              <td style="padding:8px 12px 2px;font-size:12px;color:#6b7280;white-space:nowrap;">${slot.startTime}&ndash;${slot.endTime}</td>
              <td style="padding:8px 12px 2px;font-size:13px;color:#1e1b4b;font-weight:600;text-align:right;">$${cost.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" style="padding:0 12px 10px;font-size:11px;color:#9ca3af;">$${rate}/hr &times; ${hrsLabel} ${hrWord} = $${cost.toFixed(2)}</td>
            </tr>`;
            })
            .join("");
          return `
          <div style="margin-bottom:20px;">
            <div style="font-size:11px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e0e7ff;">${dayLabel}</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f5f3ff;">
                  <th style="padding:7px 12px;font-size:10px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;text-align:left;">Service</th>
                  <th style="padding:7px 12px;font-size:10px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;text-align:left;">Sitter</th>
                  <th style="padding:7px 12px;font-size:10px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;text-align:left;">Time</th>
                  <th style="padding:7px 12px;font-size:10px;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${slotRows}</tbody>
            </table>
          </div>`;
        })
        .join("");
      const discountRow =
        discount > 0
          ? `
        <tr>
          <td colspan="3" style="padding:6px 12px;font-size:12px;color:#059669;">Bundle Discount (${BUNDLE_DISCOUNT_PERCENT}% off)</td>
          <td style="padding:6px 12px;font-size:12px;color:#059669;text-align:right;">-$${discount.toFixed(2)}</td>
        </tr>`
          : "";
      return `
        ${rows}
        <table style="width:100%;border-collapse:collapse;border-top:2px solid #e0e7ff;margin-top:8px;">
          <tbody>
            <tr style="background:#fafafa;">
              <td colspan="3" style="padding:8px 12px;font-size:12px;color:#6b7280;">Subtotal</td>
              <td style="padding:8px 12px;font-size:12px;color:#1e1b4b;text-align:right;">$${subtotal.toFixed(2)}</td>
            </tr>
            ${discountRow}
          </tbody>
        </table>`;
    }
    return `
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-size:13px;color:#6b7280;font-weight:500;">Service Period</td>
            <td style="padding:10px 0;font-size:13px;color:#1e1b4b;text-align:right;">${formatDateTime(booking.startDate)} &ndash; ${formatDateTime(booking.endDate)}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-size:13px;color:#6b7280;font-weight:500;">Duration</td>
            <td style="padding:10px 0;font-size:13px;color:#1e1b4b;text-align:right;">${days} day${days !== 1 ? "s" : ""}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px 0;font-size:13px;color:#6b7280;font-weight:500;">Services</td>
            <td style="padding:10px 0;font-size:13px;color:#1e1b4b;text-align:right;">${servicesList}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:13px;color:#6b7280;font-weight:500;">Pets</td>
            <td style="padding:10px 0;font-size:13px;color:#1e1b4b;text-align:right;">${petsList}</td>
          </tr>
          ${twoSitters ? `<tr><td colspan="2" style="padding:8px 0 0;font-size:11px;color:#7c3aed;font-style:italic;">* 2-sitter rate: average of both sitters&rsquo; rates + $10/day</td></tr>` : ""}
        </tbody>
      </table>`;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) return;

    const paidBadgeHtml = isPaid
      ? `
      <div style="position:absolute;top:28px;right:28px;transform:rotate(8deg);">
        <div style="border:3px solid #059669;border-radius:8px;padding:6px 16px;color:#059669;font-size:20px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">PAID ✓</div>
      </div>`
      : "";

    const paymentConfirmHtml =
      isPaid && payment?.notes
        ? `
      <div style="margin-top:12px;display:flex;align-items:center;gap:8px;">
        <span style="width:18px;height:18px;background:#059669;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:11px;flex-shrink:0;">✓</span>
        <span style="font-size:13px;color:#374151;">Payment received via <strong>${payment.notes}</strong></span>
      </div>`
        : "";

    const paidDateHtml = payment?.paidDate
      ? `<div style="font-size:12px;color:#059669;margin-top:4px;">Paid on ${formatDateISO(payment.paidDate)}</div>`
      : "";

    const discountHtml =
      hasAppliedDiscount && payment?.originalAmount
        ? `<div style="font-size:12px;color:#d97706;margin-top:4px;">${Number(payment.discountPercent)}% discount applied (was $${(Number(payment.originalAmount) / 100).toFixed(2)})</div>`
        : "";

    const scheduleHtml = buildScheduleHtml();

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNum} — ${APP_NAME}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: white; color: #111; }
    @page { size: A4 portrait; margin: 0; }
  </style>
</head>
<body>
<div style="width:100%;min-height:100vh;background:white;font-family:'Inter',-apple-system,sans-serif;">
  <div style="background:linear-gradient(135deg,#4338ca 0%,#6d28d9 60%,#7c3aed 100%);padding:44px 48px 40px;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-40px;top:-40px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
    <div style="position:absolute;right:80px;bottom:-50px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;position:relative;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;">🐾</div>
        <div>
           <div style="font-size:24px;font-weight:800;color:white;letter-spacing:-0.5px;">${APP_NAME}</div>
          <div style="font-size:12px;color:rgba(199,210,254,0.9);margin-top:3px;letter-spacing:0.02em;">Professional Pet Care Services</div>
        </div>
      </div>
      <div style="text-align:right;position:relative;">
        ${paidBadgeHtml}
        <div style="font-size:11px;font-weight:600;color:rgba(199,210,254,0.8);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px;">Invoice</div>
        <div style="font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px;">${invoiceNum}</div>
        <div style="font-size:12px;color:rgba(199,210,254,0.8);margin-top:4px;">${invoiceDate}</div>
      </div>
    </div>
  </div>
  <div style="padding:0 48px 40px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;margin-bottom:32px;">
      <div style="padding:22px 24px;border-right:1px solid #e5e7eb;">
        <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Bill To</div>
        <div style="font-size:15px;font-weight:700;color:#1e1b4b;margin-bottom:4px;">${booking.clientName}</div>
        <div style="font-size:13px;color:#6b7280;word-break:break-all;">${booking.clientEmail}</div>
        ${booking.clientPhone ? `<div style="font-size:13px;color:#6b7280;margin-top:3px;">${booking.clientPhone}</div>` : ""}
      </div>
      <div style="padding:22px 24px;background:#faf5ff;">
        <div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Provided By</div>
        <div style="font-size:15px;font-weight:700;color:#3730a3;margin-bottom:4px;">${sitterName}</div>
        ${twoSitters ? `<div style="font-size:12px;color:#7c3aed;margin-top:4px;">★ 2-sitter premium booking</div>` : ""}
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Pets: ${petsList}</div>
      </div>
    </div>
    <div style="margin-bottom:28px;">
      <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">Services Provided</div>
      ${scheduleHtml}
    </div>
    <div style="background:linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%);border:1px solid #c7d2fe;border-radius:16px;padding:24px 28px;display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
      <div>
        <div style="font-size:11px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Total Due</div>
        <div style="font-size:38px;font-weight:900;color:#3730a3;letter-spacing:-1px;">$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        ${discountHtml}
        ${paidDateHtml}
        ${isPaid ? `<div style="font-size:13px;color:#059669;font-weight:600;margin-top:6px;">✓ Payment received</div>` : `<div style="font-size:12px;color:#d97706;font-weight:500;margin-top:6px;">Awaiting payment</div>`}
        ${paymentConfirmHtml}
      </div>
      ${isPaid ? `<div style="transform:rotate(8deg);"><div style="border:3px solid #059669;border-radius:10px;padding:8px 20px;color:#059669;font-size:22px;font-weight:900;letter-spacing:0.12em;opacity:0.8;">PAID ✓</div></div>` : ""}
    </div>
    <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #fde68a;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
      <div style="font-size:22px;font-weight:800;color:#92400e;margin-bottom:8px;">Thank you, ${booking.clientName}! 🐾</div>
      <div style="font-size:14px;color:#78350f;line-height:1.6;margin-bottom:12px;">Your pets are in the best hands — and we're so grateful for your trust.</div>
          <div style="font-size:12px;color:#b45309;font-weight:500;">❤️ &nbsp;With love from your ${APP_NAME} team &nbsp;❤️</div>
    </div>
    <div style="border:2px dashed #c7d2fe;border-radius:12px;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
      <div>
        <div style="font-size:13px;font-weight:700;color:#3730a3;">Ready for your next visit?</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">Book your next appointment with your trusted sitters</div>
      </div>
      <div style="background:#4338ca;color:white;border-radius:8px;padding:8px 18px;font-size:12px;font-weight:700;">${APP_NAME.toLowerCase()}.com</div>
    </div>
  </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 48px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:14px;">🐾</span>
      <span style="font-size:12px;font-weight:700;color:#4338ca;">${APP_NAME}</span>
      <span style="font-size:12px;color:#9ca3af;">· Professional Pet Care</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span style="font-size:11px;color:#6b7280;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#4338ca;">${SUPPORT_EMAIL}</a></span>
      <span style="font-size:11px;color:#9ca3af;">${invoiceNum}</span>
    </div>
  </div>
</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-0 rounded-2xl gloss-ring"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Invoice {invoiceNum}</DialogTitle>
        </DialogHeader>

        <div className="bg-card rounded-2xl overflow-hidden">
          {/* ── Header ── */}
          <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-700 px-5 sm:px-8 py-6 sm:py-8 text-white overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 -translate-y-16 pointer-events-none" />
            <div className="absolute right-12 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 pointer-events-none" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <PawPrint size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
                    {APP_NAME}
                  </h1>
                  <p className="text-indigo-200 text-xs mt-0.5">
                    Professional Pet Care
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-indigo-300 text-[10px] uppercase tracking-widest">
                  Invoice
                </p>
                <p className="text-white font-extrabold text-xl sm:text-2xl leading-tight">
                  {invoiceNum}
                </p>
                <p className="text-indigo-200 text-xs mt-1">{invoiceDate}</p>
                {isPaid && (
                  <span className="inline-flex items-center gap-1 mt-2 bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 rounded-full px-3 py-1 text-xs font-bold">
                    <CheckCircle2 size={11} /> PAID
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Bill To / Provider ── */}
          <div className="grid grid-cols-2 gap-0 border-b border-border/50">
            <div className="px-4 sm:px-7 py-4 sm:py-5 border-r border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Bill To
              </p>
              <p className="font-bold text-foreground text-sm leading-snug break-words">
                {booking.clientName}
              </p>
              <p className="text-muted-foreground text-xs break-all mt-1">
                {booking.clientEmail}
              </p>
              {booking.clientPhone && (
                <a
                  href={`sms:${booking.clientPhone}`}
                  className="flex items-center gap-1 mt-0.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                  aria-label="Send text message"
                >
                  <Phone size={11} className="shrink-0" />
                  {booking.clientPhone}
                </a>
              )}
            </div>
            <div className="px-4 sm:px-7 py-4 sm:py-5 bg-violet-50/60 dark:bg-violet-900/10">
              <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-2">
                Provided By
              </p>
              <p className="font-bold text-violet-900 dark:text-violet-300 text-sm leading-snug break-words">
                {sitterName}
              </p>
              {twoSitters && (
                <p className="text-violet-400 text-xs mt-1">
                  ★ 2-sitter premium
                </p>
              )}
              <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                Pets: {petsList}
              </p>
            </div>
          </div>

          {/* ── Services ── */}
          <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-border/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Services Provided
            </p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(booking as any).serviceSchedule &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (booking as any).serviceSchedule.length > 0 ? (
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {((booking as any).serviceSchedule as DayServiceSchedule[]).map(
                  (day) => {
                    const d = new Date(`${day.date}T12:00:00`);
                    const dayLabel = d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    return (
                      <div key={day.date}>
                        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-2 pb-1 border-b border-indigo-100">
                          {dayLabel}
                        </p>
                        <div className="overflow-x-auto -mx-1">
                          <table className="w-full min-w-[340px]">
                            <thead>
                              <tr className="bg-violet-50/50 dark:bg-violet-900/10">
                                <th className="py-1.5 px-2 text-[10px] text-violet-500 uppercase tracking-wide font-semibold text-left">
                                  Service
                                </th>
                                <th className="py-1.5 px-2 text-[10px] text-violet-500 uppercase tracking-wide font-semibold text-left hidden sm:table-cell">
                                  Sitter
                                </th>
                                <th className="py-1.5 px-2 text-[10px] text-violet-500 uppercase tracking-wide font-semibold text-left">
                                  Time
                                </th>
                                <th className="py-1.5 px-2 text-[10px] text-violet-500 uppercase tracking-wide font-semibold text-right">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.slots.map((slot: ServiceSlot, i: number) => {
                                const rawHours =
                                  Number(slot.durationMinutes) / 60;
                                const billedHours = Math.max(1, rawHours);
                                const rate = Number(slot.ratePerHour);
                                const cost = billedHours * rate;
                                const sitterObj = allSitters.find(
                                  (s) => s.id === slot.sitterId,
                                );
                                const petNames =
                                  booking.pets?.length > 0
                                    ? booking.pets
                                        .map((p) => p.petName)
                                        .join(" & ")
                                    : null;
                                const hrsLabel =
                                  billedHours % 1 === 0
                                    ? `${billedHours}`
                                    : billedHours.toFixed(1);
                                const fragKey = `${slot.service}-${slot.sitterId}-${i}`;
                                return (
                                  <tr
                                    key={`${fragKey}-breakdown`}
                                    className="border-b border-border/30 last:border-0"
                                  >
                                    <td className="pt-2.5 pb-0.5 px-2 text-sm text-foreground font-medium">
                                      {slot.service}
                                      {petNames && (
                                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                          — {petNames}
                                        </span>
                                      )}
                                    </td>
                                    <td className="pt-2.5 pb-0.5 px-2 text-xs text-muted-foreground hidden sm:table-cell">
                                      {sitterObj?.name ?? "Sitter"}
                                    </td>
                                    <td className="pt-2.5 pb-0.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
                                      {slot.startTime}–{slot.endTime}
                                    </td>
                                    <td className="pt-2.5 pb-0.5 px-2 text-sm text-indigo-700 font-bold text-right">
                                      ${cost.toFixed(2)}
                                      <div className="text-[10px] text-muted-foreground/70 font-normal whitespace-nowrap">
                                        ${rate}/hr × {hrsLabel}{" "}
                                        {billedHours === 1 ? "hr" : "hrs"}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  },
                )}
                {(() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { subtotal, discount } = calcScheduleTotal(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (booking as any).serviceSchedule,
                  );
                  return (
                    <div className="border-t border-border/50 pt-3 space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>
                            Bundle discount ({BUNDLE_DISCOUNT_PERCENT}%)
                          </span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  [
                    "Service Period",
                    `${formatDateTime(booking.startDate)} – ${formatDateTime(booking.endDate)}`,
                  ],
                  ["Duration", `${days} day${days !== 1 ? "s" : ""}`],
                  ["Services", servicesList],
                  ["Pets", petsList],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-2 py-2 border-b border-border/40 last:border-0"
                  >
                    <span className="text-sm text-muted-foreground font-medium shrink-0">
                      {label}
                    </span>
                    <span className="text-sm text-foreground text-right min-w-0 break-words flex-1">
                      {value}
                    </span>
                  </div>
                ))}
                {twoSitters && (
                  <p className="text-xs text-violet-500 italic pt-1">
                    ★ 2-sitter rate: average of both sitters' rates + $10/day
                  </p>
                )}
                {/* Rate × days breakdown */}
                {(() => {
                  const primarySitter = allSitters.find(
                    (s) =>
                      (booking.sitterIds ?? []).length > 0 &&
                      s.id === (booking.sitterIds ?? [])[0],
                  );
                  const rate = primarySitter
                    ? Number(primarySitter.hourlyRate)
                    : null;
                  if (!rate) return null;
                  return (
                    <div className="flex justify-between items-center pt-1 text-xs text-muted-foreground border-t border-border/30">
                      <span>Price breakdown</span>
                      <span>
                        ${rate}/hr rate · {days} day{days !== 1 ? "s" : ""}
                        {twoSitters ? " · 2-sitter" : ""}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Total + Controls ── */}
          <div className="px-4 sm:px-7 py-5 sm:py-6 border-b border-border/50">
            <div className="flex flex-col gap-4">
              {/* Editable controls or read-only status */}
              <div className="w-full">
                {viewerRole === "client" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Payment Status
                    </p>
                    {isPaid ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle2
                          size={16}
                          className="text-emerald-500 shrink-0"
                        />
                        <p className="text-sm text-foreground font-medium">
                          Paid{payment?.notes ? ` via ${payment.notes}` : ""}
                        </p>
                        {payment?.paidDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                            <Calendar size={10} />
                            {formatDateISO(payment.paidDate)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300 bg-amber-50 text-xs"
                        >
                          Payment Pending
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Your sitter will reach out about payment.
                        </p>
                      </div>
                    )}
                  </div>
                ) : !isPaid ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs text-muted-foreground">
                        Adjust Price (manual)
                      </Label>
                      {paymentLoading ? (
                        <div className="h-10 bg-muted rounded-lg animate-pulse" />
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={amountStr}
                          onChange={(e) => setAmountStr(e.target.value)}
                          className="rounded-lg text-base"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  payment?.notes && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-500 shrink-0"
                      />
                      <p className="text-sm text-foreground">
                        Paid via{" "}
                        <span className="font-semibold">{payment.notes}</span>
                      </p>
                      {payment?.paidDate && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                          <Calendar size={10} />
                          {formatDateISO(payment.paidDate)}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>

              {/* ── Additional Charges & Credits (sitter/admin, unpaid) ── */}
              {isEditor && !isPaid && (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <button
                    type="button"
                    data-ocid="invoice.adhoc_toggle"
                    className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-100/60 transition-colors"
                    onClick={() => setShowAdHoc((v) => !v)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                      <DollarSign size={14} className="text-indigo-500" />
                      Additional Charges &amp; Credits
                      {localItems.length > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-bold">
                          {localItems.length}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-ocid="invoice.adhoc_add_button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalItems((prev) => [...prev, newLocalItem()]);
                          setShowAdHoc(true);
                        }}
                        className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 transition-colors"
                        aria-label="Add item"
                      >
                        <Plus size={12} className="text-white" />
                      </button>
                      {showAdHoc ? (
                        <ChevronUp size={14} className="text-indigo-500" />
                      ) : (
                        <ChevronDown size={14} className="text-indigo-500" />
                      )}
                    </div>
                  </button>

                  {showAdHoc && (
                    <div className="px-4 py-4 space-y-3 bg-indigo-50/20 dark:bg-indigo-900/5 border-t border-indigo-200/40">
                      {localItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-2">
                          No extra items yet. Click + to add a charge or credit.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {localItems.map((item, idx) => (
                            <div
                              key={item.id}
                              data-ocid={`invoice.adhoc_item.${idx + 1}`}
                              className="flex items-center gap-2 p-2.5 bg-card rounded-xl border border-border/60"
                            >
                              {/* Description: preset select or free text */}
                              <Select
                                value={
                                  ADHOC_PRESET_DESCRIPTIONS.includes(
                                    item.description,
                                  )
                                    ? item.description
                                    : item.description
                                      ? "custom"
                                      : ""
                                }
                                onValueChange={(v) => {
                                  if (v === "custom") return;
                                  setLocalItems((prev) =>
                                    prev.map((li, i) =>
                                      i === idx
                                        ? { ...li, description: v }
                                        : li,
                                    ),
                                  );
                                }}
                              >
                                <SelectTrigger className="h-8 rounded-lg text-xs flex-1 min-w-0">
                                  <SelectValue placeholder="Select type…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ADHOC_PRESET_DESCRIPTIONS.map((d) => (
                                    <SelectItem
                                      key={d}
                                      value={d}
                                      className="text-xs"
                                    >
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {/* Free-text override */}
                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  setLocalItems((prev) =>
                                    prev.map((li, i) =>
                                      i === idx
                                        ? { ...li, description: e.target.value }
                                        : li,
                                    ),
                                  )
                                }
                                placeholder="Description"
                                className="h-8 rounded-lg text-xs flex-1 min-w-0"
                                data-ocid={`invoice.adhoc_desc.${idx + 1}`}
                              />
                              {/* Amount */}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={item.amountStr}
                                  onChange={(e) =>
                                    setLocalItems((prev) =>
                                      prev.map((li, i) =>
                                        i === idx
                                          ? { ...li, amountStr: e.target.value }
                                          : li,
                                      ),
                                    )
                                  }
                                  placeholder="0.00"
                                  className="h-8 rounded-lg text-xs w-20"
                                  data-ocid={`invoice.adhoc_amount.${idx + 1}`}
                                />
                              </div>
                              <button
                                type="button"
                                data-ocid={`invoice.adhoc_remove.${idx + 1}`}
                                onClick={() =>
                                  setLocalItems((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                                aria-label="Remove item"
                              >
                                <Trash2 size={12} className="text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Live preview of adHoc total */}
                      {localItems.length > 0 && adHocTotal !== 0 && (
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-muted-foreground font-medium">
                            Extra items total
                          </span>
                          <span
                            className={`font-bold ${adHocTotal >= 0 ? "text-indigo-700" : "text-emerald-600"}`}
                          >
                            {adHocTotal >= 0 ? "+" : ""}${adHocTotal.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Add + Save buttons */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid="invoice.adhoc_add_row_button"
                          className="rounded-full gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() =>
                            setLocalItems((prev) => [...prev, newLocalItem()])
                          }
                        >
                          <Plus size={12} />
                          Add Item
                        </Button>
                        <Button
                          size="sm"
                          data-ocid="invoice.adhoc_save_button"
                          disabled={isSavingAdHoc}
                          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 font-semibold gap-1.5"
                          onClick={handleSaveAdHocItems}
                        >
                          {isSavingAdHoc ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Save Items
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Apply Discount (sitter/admin, unpaid) ── */}
              {isEditor && !isPaid && (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <button
                    type="button"
                    data-ocid="invoice.discount_toggle"
                    className="w-full flex items-center justify-between px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-100/60 transition-colors"
                    onClick={() => {
                      setShowDiscount((v) => !v);
                      if (!showDiscount) {
                        setSelectedPct(null);
                        setCustomPct("");
                        setIsCustom(false);
                      }
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                      <Tag size={14} className="text-amber-500" />
                      {hasAppliedDiscount
                        ? `${Number(payment?.discountPercent)}% discount applied`
                        : "Apply Discount"}
                    </span>
                    {showDiscount ? (
                      <ChevronUp size={14} className="text-amber-500" />
                    ) : (
                      <ChevronDown size={14} className="text-amber-500" />
                    )}
                  </button>

                  {showDiscount && (
                    <div className="px-4 py-4 space-y-3 bg-amber-50/30 dark:bg-amber-900/5 border-t border-amber-200/40">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Select discount
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {DISCOUNT_PRESETS.map((pct) => (
                            <button
                              type="button"
                              key={pct}
                              data-ocid={`invoice.discount_pct_${pct}`}
                              onClick={() => {
                                setSelectedPct(pct);
                                setIsCustom(false);
                                setCustomPct("");
                              }}
                              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                                !isCustom && selectedPct === pct
                                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                  : "bg-background text-amber-700 border-amber-300 hover:bg-amber-50"
                              }`}
                            >
                              {pct}%
                            </button>
                          ))}
                          <button
                            type="button"
                            data-ocid="invoice.discount_custom"
                            onClick={() => {
                              setIsCustom(true);
                              setSelectedPct(null);
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                              isCustom
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-background text-amber-700 border-amber-300 hover:bg-amber-50"
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>

                      {isCustom && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="e.g. 12"
                            value={customPct}
                            onChange={(e) => setCustomPct(e.target.value)}
                            className="rounded-lg w-28 text-sm"
                            data-ocid="invoice.discount_custom_input"
                          />
                          <span className="text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      )}

                      {effectivePct > 0 && effectivePct < 100 && (
                        <div className="bg-white dark:bg-card border border-amber-200 rounded-lg px-4 py-3 space-y-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xl font-black text-indigo-700">
                              ${discountedDollars.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${originalDollars.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                              saving ${savingDollars.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            New price after {effectivePct}% discount
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          data-ocid="invoice.discount_apply_button"
                          disabled={
                            isApplyingDiscount ||
                            effectivePct <= 0 ||
                            effectivePct >= 100
                          }
                          className="rounded-full bg-amber-500 hover:bg-amber-600 text-white border-0 font-semibold gap-1.5"
                          onClick={handleApplyDiscount}
                        >
                          {isApplyingDiscount ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          Apply &amp; Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid="invoice.discount_cancel_button"
                          className="rounded-full text-muted-foreground"
                          onClick={() => {
                            setShowDiscount(false);
                            setSelectedPct(null);
                            setCustomPct("");
                            setIsCustom(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Grand Total box */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-100 dark:border-indigo-700/30 rounded-2xl px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">
                    Total Due
                  </p>
                  {hasAppliedDiscount && payment?.originalAmount && (
                    <p className="text-sm text-muted-foreground line-through leading-none mb-1">
                      ${(Number(payment.originalAmount) / 100).toFixed(2)}
                    </p>
                  )}
                  <p className="text-3xl sm:text-4xl font-black text-indigo-700 dark:text-indigo-300 leading-none">
                    $
                    {grandTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {/* Base + extras breakdown */}
                  {adHocTotal !== 0 && (
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        Base: ${displayAmount.toFixed(2)}
                        {adHocTotal !== 0 && (
                          <>
                            {" "}
                            &nbsp;·&nbsp; Extras: {adHocTotal >= 0 ? "+" : ""}
                            {adHocTotal.toFixed(2)}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  {hasAppliedDiscount && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <Tag size={10} />
                      {Number(payment?.discountPercent)}% discount applied
                    </span>
                  )}
                  {isPaid ? (
                    <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Payment received
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 font-medium mt-2">
                      Awaiting payment
                    </p>
                  )}
                </div>
                {isPaid && (
                  <div className="shrink-0 rotate-6">
                    <div className="border-2 border-emerald-500 rounded-lg px-3 py-1 text-emerald-600 text-sm font-black uppercase tracking-wider opacity-80">
                      PAID ✓
                    </div>
                  </div>
                )}
              </div>

              {/* ── Paid Date (sitter/admin) ── */}
              {isEditor && (
                <div className="rounded-xl border border-border/60 px-4 py-3 space-y-2 bg-muted/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={12} />
                    Date Paid
                  </p>
                  {payment?.paidDate && (
                    <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Paid on {formatDateISO(payment.paidDate)}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={paidDateInput}
                      onChange={(e) => setPaidDateInput(e.target.value)}
                      className="rounded-lg text-sm h-9 w-44"
                      data-ocid="invoice.paid_date_input"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid="invoice.paid_date_save_button"
                      disabled={isSavingDate || !paidDateInput}
                      className="rounded-full h-9 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-1"
                      onClick={handleSavePaidDate}
                    >
                      {isSavingDate ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Save Date
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Send Invoice Panel ── */}
              {isEditor && !isPaid && (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <button
                    type="button"
                    data-ocid="invoice.send_toggle"
                    className="w-full flex items-center justify-between px-4 py-3 bg-violet-50/60 dark:bg-violet-900/10 hover:bg-violet-100/60 transition-colors"
                    onClick={() => setShowSendPanel((v) => !v)}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                      <Send size={14} className="text-violet-500" />
                      Send Invoice to Client
                    </span>
                    {showSendPanel ? (
                      <ChevronUp size={14} className="text-violet-500" />
                    ) : (
                      <ChevronDown size={14} className="text-violet-500" />
                    )}
                  </button>

                  {showSendPanel && (
                    <div
                      className="px-4 py-4 space-y-4 border-t border-violet-200/40"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(237,233,254,0.4) 0%, rgba(245,243,255,0.4) 100%)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                        How should the client pay?
                      </p>

                      {/* Payment method cards */}
                      <div className="space-y-2">
                        {/* Venmo */}
                        <button
                          type="button"
                          data-ocid="invoice.send_method_venmo"
                          onClick={() => setPayMethodKind("venmo")}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                            payMethodKind === "venmo"
                              ? "border-[#008CFF] bg-blue-50/60 dark:bg-blue-900/10"
                              : "border-border/50 hover:border-border bg-card"
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "#008CFF" }}
                          >
                            <CreditCard size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-semibold text-sm"
                              style={{ color: "#008CFF" }}
                            >
                              Venmo
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Client pays via Venmo to your handle
                            </p>
                            {payMethodKind === "venmo" && (
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-muted-foreground shrink-0">
                                  @
                                </span>
                                <Input
                                  value={venmoHandle}
                                  onChange={(e) =>
                                    setVenmoHandle(
                                      e.target.value.replace(/^@/, ""),
                                    )
                                  }
                                  placeholder="yourhandle"
                                  className="h-8 rounded-lg text-sm flex-1"
                                  data-ocid="invoice.send_venmo_input"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                          {payMethodKind === "venmo" && (
                            <CheckCircle2
                              size={16}
                              className="text-blue-500 shrink-0 mt-1"
                            />
                          )}
                        </button>

                        {/* Apple Pay Cash */}
                        <button
                          type="button"
                          data-ocid="invoice.send_method_apple"
                          onClick={() => setPayMethodKind("applePayCash")}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                            payMethodKind === "applePayCash"
                              ? "border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30"
                              : "border-border/50 hover:border-border bg-card"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-zinc-900">
                            <Smartphone size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              Apple Pay Cash
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Client sends to your phone number via Apple Pay
                            </p>
                            {payMethodKind === "applePayCash" && (
                              <div className="mt-2">
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                  Your phone number (client will send to this)
                                </Label>
                                <div className="flex items-center gap-2">
                                  <Phone
                                    size={14}
                                    className="text-muted-foreground shrink-0"
                                  />
                                  <Input
                                    type="tel"
                                    value={applePhone}
                                    onChange={(e) =>
                                      setApplePhone(e.target.value)
                                    }
                                    placeholder="(555) 000-0000"
                                    className="h-8 rounded-lg text-sm flex-1"
                                    data-ocid="invoice.send_apple_phone_input"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {payMethodKind === "applePayCash" && (
                            <CheckCircle2
                              size={16}
                              className="text-zinc-700 shrink-0 mt-1"
                            />
                          )}
                        </button>

                        {/* Cash */}
                        <button
                          type="button"
                          data-ocid="invoice.send_method_cash"
                          onClick={() => setPayMethodKind("cash")}
                          className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                            payMethodKind === "cash"
                              ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/10"
                              : "border-border/50 hover:border-border bg-card"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-600">
                            <DollarSign size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-emerald-700">
                              Cash
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Client pays in person with cash
                            </p>
                            {payMethodKind === "cash" && (
                              <div className="mt-2">
                                <Textarea
                                  value={cashInstructions}
                                  onChange={(e) =>
                                    setCashInstructions(e.target.value)
                                  }
                                  placeholder="e.g. Please bring exact change"
                                  className="text-sm rounded-lg resize-none"
                                  rows={2}
                                  data-ocid="invoice.send_cash_instructions"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                          {payMethodKind === "cash" && (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-600 shrink-0 mt-1"
                            />
                          )}
                        </button>
                      </div>

                      {/* Send button */}
                      <Button
                        data-ocid="invoice.send_submit_button"
                        disabled={isSendingInvoice}
                        className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-2"
                        onClick={handleSendInvoice}
                      >
                        {isSendingInvoice ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        {isSendingInvoice ? "Sending…" : "Send Invoice Email"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Mark as Paid — sitter/admin only */}
                {isEditor && !isPaid && (
                  <Button
                    onClick={handleMarkPaid}
                    disabled={isSaving || paymentLoading || grandTotal <= 0}
                    className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                    data-ocid="invoice.submit_button"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} className="mr-2" />
                        Mark as Paid
                      </>
                    )}
                  </Button>
                )}
                {/* Save manual price (when payment exists and unpaid) */}
                {isEditor && !isPaid && payment && (
                  <Button
                    variant="outline"
                    onClick={handleSaveAmount}
                    disabled={isSaving}
                    className="rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    data-ocid="invoice.save_price_button"
                  >
                    <Minus size={13} className="mr-1.5" />
                    Save Price
                  </Button>
                )}
                {/* Print — hidden on small screens */}
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hidden sm:flex"
                  data-ocid="invoice.print_button"
                >
                  <Printer size={14} className="mr-2" /> Print Invoice
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full text-muted-foreground"
                  data-ocid="invoice.close_button"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>

          {/* ── Price History / Audit Trail (sitter/admin) ── */}
          {isEditor && (
            <div className="px-4 sm:px-7 py-3 border-b border-border/50">
              <button
                type="button"
                data-ocid="invoice.history_toggle"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History size={13} />
                Price History
                {showHistory ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2">
                  {auditLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ) : (auditLog as Public__7[]).length === 0 ? (
                    <p
                      data-ocid="invoice.history_empty"
                      className="text-xs text-muted-foreground py-2"
                    >
                      No price history yet.
                    </p>
                  ) : (
                    (auditLog as Public__7[]).map((entry, idx) => {
                      const snap = parseSnapshot(entry.snapshot);
                      const action = entry.action as AuditAction;
                      return (
                        <div
                          key={`audit-${entry.timestamp}-${idx}`}
                          data-ocid={`invoice.history_item.${idx + 1}`}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/40"
                        >
                          <div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                            {getAuditIcon(action)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-xs font-semibold text-foreground">
                                {getAuditActionLabel(action)}
                              </p>
                              <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatAuditTimestamp(entry.timestamp)}
                              </p>
                            </div>
                            <div className="mt-1 space-y-0.5">
                              {snap.oldAmount !== undefined &&
                                snap.newAmount !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="line-through mr-1">
                                      ${(snap.oldAmount / 100).toFixed(2)}
                                    </span>
                                    →{" "}
                                    <span className="font-semibold text-foreground">
                                      ${(snap.newAmount / 100).toFixed(2)}
                                    </span>
                                  </p>
                                )}
                              {snap.discountPercent !== undefined && (
                                <p className="text-xs text-amber-600 font-medium">
                                  {snap.discountPercent}% discount applied
                                  {snap.originalAmount !== undefined &&
                                    ` (original: $${(snap.originalAmount / 100).toFixed(2)})`}
                                </p>
                              )}
                              {snap.reason && (
                                <p className="text-xs text-muted-foreground italic">
                                  {snap.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Thank You ── */}
          <div className="px-4 sm:px-7 py-4 sm:py-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border-b border-amber-100 dark:border-amber-700/20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                  Thank you, {booking.clientName}! 🐾
                </p>
                <p className="text-amber-800/80 dark:text-amber-400/80 text-xs mt-1 leading-relaxed">
                  Your pets are in great hands — and so are your bookings.
                </p>
                <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
                  <Heart
                    size={10}
                    className="fill-amber-400 text-amber-400 shrink-0"
                  />
                  With love from your {APP_NAME} team
                  <Heart
                    size={10}
                    className="fill-amber-400 text-amber-400 shrink-0"
                  />
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-4 sm:px-7 py-3 bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-2">
              <PawPrint size={13} className="text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-600">
                {APP_NAME}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · Professional Pet Care
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Questions?{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-indigo-500 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </span>
              <span className="text-xs text-muted-foreground">
                {invoiceNum}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
