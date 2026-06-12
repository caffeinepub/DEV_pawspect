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
import {
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  PawPrint,
  Plus,
  Printer,
  Send,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Public } from "../backend.d";
import {
  useAdHocJobsBySitter,
  usePaymentsByBookingIds,
  useSendPaymentReminder,
  useUpdateAdHocJobPayment,
} from "../hooks/useQueries";
import type { Team } from "../types/teams";
import AdHocJobModal from "./AdHocJobModal";
import InvoiceModal from "./InvoiceModal";

interface BookingRecord {
  id: bigint;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pets: Array<{ petName: string; petType: string }>;
  services: string[];
  sitterIds: bigint[];
  startDate: bigint;
  endDate: bigint;
  status: string;
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

interface PaymentRecord {
  bookingId: bigint;
  status: string;
  totalAmount: bigint;
  notes?: string;
  paidDate?: string;
  discountPercent?: bigint;
  originalAmount?: bigint;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDays(start: bigint, end: bigint): number {
  const ms = Number((end - start) / 1_000_000n);
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

function calcSuggestedTotal(
  booking: BookingRecord,
  allSitters: Public[],
): number {
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

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any[];
  allSitters: Public[];
  sitterName: string;
  sitterPhone?: string;
  sitterId?: bigint | null;
  teams?: Team[];
  serviceRates?: Array<{ service: string; ratePerHour: bigint }>;
  /** Demo mode: provide payments directly to bypass the backend hook */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  demoPayments?: any[];
  isDemoMode?: boolean;
}

export default function SitterInvoicesTab({
  bookings,
  allSitters,
  sitterName,
  sitterPhone = "",
  sitterId = null,
  teams = [],
  serviceRates = [],
  demoPayments,
  isDemoMode = false,
}: Props) {
  const bookingIds = useMemo(
    () => (bookings as unknown as BookingRecord[]).map((b) => b.id.toString()),
    [bookings],
  );
  const { data: adHocJobs = [] } = useAdHocJobsBySitter(
    isDemoMode ? null : sitterId,
  );
  const allBookingIds = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => [...bookingIds, ...(adHocJobs as any[]).map((j) => j.id.toString())],
    [bookingIds, adHocJobs],
  );
  const { data: livePayments = [], isLoading: liveLoading } =
    usePaymentsByBookingIds(isDemoMode ? [] : allBookingIds);

  const allPayments = isDemoMode ? (demoPayments ?? []) : livePayments;
  const isLoading = isDemoMode ? false : liveLoading;
  const sendReminder = useSendPaymentReminder();
  const updateAdHocPayment = useUpdateAdHocJobPayment();

  const [showAdHocModal, setShowAdHocModal] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [markingPaidDate, setMarkingPaidDate] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(
    null,
  );
  const [openDiscount, setOpenDiscount] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(
    null,
  );
  const [sentReminderIds, setSentReminderIds] = useState<Set<string>>(
    new Set(),
  );

  const paymentMap = useMemo(() => {
    const map = new Map<string, PaymentRecord>();
    for (const p of allPayments as unknown as PaymentRecord[]) {
      map.set(p.bookingId.toString(), p);
    }
    return map;
  }, [allPayments]);

  // Merge ad hoc jobs into the invoice items
  const adHocItems = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (adHocJobs as any[]).map((j) => {
      const adHocPayment = paymentMap.get(j.id.toString()) ?? null;
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        booking: j as any,
        payment: adHocPayment,
        // isPaid is true only when the payment record has an explicit paidDate set
        isPaid: adHocPayment?.paidDate != null,
        total:
          Number(j.serviceSchedule?.[0]?.slots?.[0]?.ratePerHour ?? 0) > 0
            ? (Number(
                j.serviceSchedule?.[0]?.slots?.[0]?.durationMinutes ?? 60,
              ) /
                60) *
              Number(j.serviceSchedule?.[0]?.slots?.[0]?.ratePerHour ?? 0)
            : Number(j.startDate) > 0
              ? 0
              : 0,
        payMethod: null,
        hasDiscount: false,
        isAdHoc: true,
        adHocPaidDate: adHocPayment?.paidDate ?? null,
      };
    });
  }, [adHocJobs, paymentMap]);

  const invoiceItems = useMemo(() => {
    const regularItems = (bookings as unknown as BookingRecord[])
      .filter((b) => b.status !== "cancelled")
      .sort((a, b) => Number(b.startDate - a.startDate))
      .map((b) => {
        const payment = paymentMap.get(b.id.toString()) ?? null;
        const isPaid = payment?.status === "paid";
        const total = payment
          ? Number(payment.totalAmount) / 100
          : calcSuggestedTotal(b, allSitters);
        const payMethod = payment?.notes ?? null;
        const hasDiscount =
          payment?.discountPercent !== undefined &&
          payment?.discountPercent !== null &&
          Number(payment.discountPercent) > 0;
        return {
          booking: b,
          payment,
          isPaid,
          total,
          payMethod,
          hasDiscount,
          isAdHoc: false,
          adHocPaidDate: null as string | null,
        };
      });
    return [...regularItems, ...adHocItems];
  }, [bookings, paymentMap, allSitters, adHocItems]);

  const summary = useMemo(() => {
    const paid = invoiceItems.filter((i) => i.isPaid);
    const unpaid = invoiceItems.filter((i) => !i.isPaid);
    return {
      totalPaid: paid.reduce((sum, i) => sum + i.total, 0),
      totalOutstanding: unpaid.reduce((sum, i) => sum + i.total, 0),
      countTotal: invoiceItems.length,
      countPaid: paid.length,
      countUnpaid: unpaid.length,
    };
  }, [invoiceItems]);

  const filteredItems = useMemo(() => {
    return invoiceItems.filter((item) => {
      if (statusFilter === "paid" && !item.isPaid) return false;
      if (statusFilter === "unpaid" && item.isPaid) return false;
      const bookingDate = new Date(Number(item.booking.startDate / 1_000_000n));
      if (dateFrom && bookingDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (bookingDate > to) return false;
      }
      return true;
    });
  }, [invoiceItems, statusFilter, dateFrom, dateTo]);

  const hasFilters = statusFilter !== "all" || dateFrom || dateTo;

  const handleSendReminder = async (
    e: React.MouseEvent,
    bookingId: bigint,
    clientName: string,
  ) => {
    e.stopPropagation();
    if (isDemoMode) {
      toast.info("Changes are disabled in demo mode");
      return;
    }
    const key = bookingId.toString();
    setSendingReminderId(key);
    try {
      const result = await sendReminder.mutateAsync(bookingId);
      if (result && typeof result === "object" && "__kind__" in result) {
        if (result.__kind__ === "err") {
          toast.error(
            `Failed to send reminder: ${(result as { __kind__: "err"; err: string }).err}`,
          );
        } else {
          toast.success(`Reminder sent to ${clientName}!`);
          setSentReminderIds((prev) => new Set([...prev, key]));
          setTimeout(() => {
            setSentReminderIds((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 3000);
        }
      } else {
        toast.success(`Reminder sent to ${clientName}!`);
        setSentReminderIds((prev) => new Set([...prev, key]));
        setTimeout(() => {
          setSentReminderIds((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 3000);
      }
    } catch (err) {
      toast.error(
        `Failed to send reminder: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSendingReminderId(null);
    }
  };

  const openInvoice = (booking: BookingRecord, withDiscount = false) => {
    setSelectedBooking(booking);
    setOpenDiscount(withDiscount);
  };

  return (
    <div className="space-y-5">
      {/* Tab header with Log Off-App Job button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-bold text-lg text-foreground">
          Invoices &amp; Jobs
        </h3>
        {!isDemoMode && sitterId && (
          <Button
            data-ocid="invoices.log_adhoc.button"
            size="sm"
            onClick={() => setShowAdHocModal(true)}
            className="rounded-full gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Plus size={13} />
            Log Off-App Job
          </Button>
        )}
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="glass-panel rounded-2xl p-3 sm:p-5 border-emerald-200/60">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span className="text-[9px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide truncate">
              Paid
            </span>
          </div>
          <p className="text-base sm:text-2xl font-bold text-emerald-700 truncate">
            ${formatCurrency(summary.totalPaid)}
          </p>
          <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 sm:mt-1">
            {summary.countPaid} invoice{summary.countPaid !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-3 sm:p-5 border-amber-200/60">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <DollarSign size={13} className="text-amber-600 shrink-0" />
            <span className="text-[9px] sm:text-xs font-bold text-amber-700 uppercase tracking-wide truncate">
              Due
            </span>
          </div>
          <p className="text-base sm:text-2xl font-bold text-amber-700 truncate">
            ${formatCurrency(summary.totalOutstanding)}
          </p>
          <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1">
            {summary.countUnpaid} pending
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-3 sm:p-5 border-indigo-200/60">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <FileText size={13} className="text-indigo-600 shrink-0" />
            <span className="text-[9px] sm:text-xs font-bold text-indigo-700 uppercase tracking-wide truncate">
              Total
            </span>
          </div>
          <p className="text-base sm:text-2xl font-bold text-indigo-700">
            {summary.countTotal}
          </p>
          <p className="text-[10px] sm:text-xs text-indigo-600 mt-0.5 sm:mt-1">
            All invoices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 sm:gap-3 items-end pb-1 -mx-1 px-1 flex-nowrap sm:flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "paid" | "unpaid")
            }
          >
            <SelectTrigger className="rounded-full h-9 text-sm w-32 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-full h-9 text-sm w-36 sm:w-40"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-full h-9 text-sm w-36 sm:w-40"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-xs self-end gap-1 text-muted-foreground"
            onClick={() => {
              setStatusFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            <X size={12} /> Clear
          </Button>
        )}
      </div>

      {/* Invoice list */}
      {isLoading ? (
        <div className="space-y-3">
          {["sk-a", "sk-b", "sk-c"].map((k) => (
            <div
              key={k}
              className="h-20 bg-muted/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          data-ocid="invoices.empty_state"
          className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border"
        >
          <div className="text-3xl mb-2">🧾</div>
          <p className="text-muted-foreground text-sm">
            {invoiceItems.length === 0
              ? "No invoices yet — they'll appear here once you have bookings."
              : "No invoices match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, rowIdx) => {
            const reminderId = item.booking.id.toString();
            const isSendingThis = sendingReminderId === reminderId;
            const wasSent = sentReminderIds.has(reminderId);

            return (
              <div
                key={reminderId}
                data-ocid={`invoices.item.${rowIdx + 1}`}
                className="bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-border transition-colors"
              >
                {/* Status accent strip */}
                <div
                  className={`h-1 w-full ${
                    item.isAdHoc
                      ? "bg-amber-500"
                      : item.isPaid
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                  }`}
                />

                <button
                  type="button"
                  className="w-full text-left p-4"
                  onClick={() => !item.isAdHoc && openInvoice(item.booking)}
                >
                  {/* Top row: client + amount */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground truncate text-sm sm:text-base">
                          {item.booking.clientName}
                        </p>
                        {item.isAdHoc && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                            <Briefcase size={8} />
                            Off-App
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(item.booking.startDate)}
                        {item.booking.startDate !== item.booking.endDate && (
                          <> &rarr; {formatDate(item.booking.endDate)}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold text-indigo-600">
                        ${formatCurrency(item.total)}
                      </p>
                      {item.hasDiscount && item.payment?.discountPercent && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 mt-1">
                          <Tag size={8} />
                          {Number(item.payment.discountPercent)}% disc.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Service + pets row */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs text-foreground/80 bg-muted/50 rounded-full px-2.5 py-1 break-words">
                      {item.booking.services?.length > 0
                        ? item.booking.services.join(", ")
                        : "General Care"}
                    </span>
                    {item.booking.pets?.length > 0 && (
                      <span className="text-xs text-muted-foreground break-words">
                        <PawPrint
                          size={13}
                          className="inline mr-1 text-muted-foreground"
                        />
                        {item.booking.pets
                          .map(
                            (p: { petName?: string; name?: string }) =>
                              p.petName ?? p.name,
                          )
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </button>

                {/* Bottom bar: status + actions */}
                <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
                  {/* Status badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.isPaid ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 text-xs font-semibold">
                        <CheckCircle2 size={10} /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-semibold">
                        Pending
                      </span>
                    )}
                    {item.isPaid && item.payment?.paidDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <Calendar size={9} />
                        {formatDateISO(item.payment.paidDate)}
                      </span>
                    )}
                    {item.isPaid && item.adHocPaidDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                        <Calendar size={9} />
                        {formatDateISO(item.adHocPaidDate)}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                    {/* Ad hoc job: Mark Paid */}
                    {item.isAdHoc &&
                      !item.isPaid &&
                      (markingPaidId === reminderId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={markingPaidDate}
                            onChange={(e) => setMarkingPaidDate(e.target.value)}
                            className="border border-border rounded-lg px-2 py-1 text-xs bg-background text-foreground"
                          />
                          <Button
                            data-ocid={`invoices.item.${rowIdx + 1}.mark_paid_confirm`}
                            size="sm"
                            disabled={
                              !markingPaidDate || updateAdHocPayment.isPending
                            }
                            className="rounded-full gap-1 text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={async () => {
                              if (!sitterId) return;
                              try {
                                await updateAdHocPayment.mutateAsync({
                                  bookingId: item.booking.id,
                                  paidDate: markingPaidDate,
                                  sitterId,
                                });
                                toast.success("Marked as paid!");
                                setMarkingPaidId(null);
                              } catch {
                                toast.error("Failed to mark paid");
                              }
                            }}
                          >
                            {updateAdHocPayment.isPending ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full h-8 px-2"
                            onClick={() => setMarkingPaidId(null)}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          data-ocid={`invoices.item.${rowIdx + 1}.mark_paid_button`}
                          size="sm"
                          className="rounded-full gap-1 text-xs h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMarkingPaidId(reminderId);
                            setMarkingPaidDate(
                              new Date().toISOString().slice(0, 10),
                            );
                          }}
                        >
                          <DollarSign size={11} /> Mark Paid
                        </Button>
                      ))}

                    {/* Regular booking actions */}
                    {!item.isAdHoc && !item.isPaid && (
                      <Button
                        data-ocid={`invoices.item.${rowIdx + 1}.discount_button`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full gap-1 text-xs h-9 px-3 text-amber-600 hover:bg-amber-50 border border-amber-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInvoice(item.booking, true);
                        }}
                      >
                        <Tag size={11} />
                        <span className="hidden sm:inline">Discount</span>
                      </Button>
                    )}
                    {!item.isAdHoc && !item.isPaid && (
                      <Button
                        data-ocid={`invoices.item.${rowIdx + 1}.send_button`}
                        size="sm"
                        variant="ghost"
                        className="rounded-full gap-1 text-xs h-9 px-3 text-violet-600 hover:bg-violet-50 border border-violet-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInvoice(item.booking);
                        }}
                      >
                        <Send size={11} />
                        Send
                      </Button>
                    )}
                    {!item.isAdHoc && !item.isPaid && (
                      <Button
                        data-ocid={`invoices.item.${rowIdx + 1}.secondary_button`}
                        size="sm"
                        disabled={isSendingThis || wasSent}
                        className={`rounded-full gap-1.5 text-xs h-9 px-3 font-semibold border-0 transition-all w-full sm:w-auto ${
                          wasSent
                            ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                        onClick={(e) =>
                          handleSendReminder(
                            e,
                            item.booking.id,
                            item.booking.clientName,
                          )
                        }
                      >
                        {isSendingThis ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : wasSent ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <Bell size={13} />
                        )}
                        {wasSent ? "Sent! ✓" : "Remind"}
                      </Button>
                    )}
                    <Button
                      data-ocid={`invoices.item.${rowIdx + 1}.primary_button`}
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-9 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!item.isAdHoc) openInvoice(item.booking);
                      }}
                    >
                      <Printer size={11} />
                      <span className="hidden sm:inline">View </span>Invoice
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedBooking && (
        <InvoiceModal
          booking={
            selectedBooking as unknown as Parameters<
              typeof InvoiceModal
            >[0]["booking"]
          }
          sitterName={sitterName}
          allSitters={allSitters}
          open={!!selectedBooking}
          onClose={() => {
            setSelectedBooking(null);
            setOpenDiscount(false);
          }}
          viewerRole="sitter"
          openDiscountSection={openDiscount}
          sitterPhone={sitterPhone}
        />
      )}

      {/* Ad Hoc Job Modal */}
      {sitterId && (
        <AdHocJobModal
          open={showAdHocModal}
          onClose={() => setShowAdHocModal(false)}
          sitterId={sitterId}
          defaultRate={
            allSitters[0]?.hourlyRate ? Number(allSitters[0].hourlyRate) : 0
          }
          teams={teams}
          serviceRates={serviceRates}
        />
      )}
    </div>
  );
}
