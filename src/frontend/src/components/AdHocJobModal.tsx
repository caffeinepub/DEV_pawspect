/**
 * AdHocJobModal — premium modal for logging off-app jobs.
 * Non-app clients are NEVER contacted by the platform.
 * All client contact info is only visible to the sitter who created the job.
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Calculator,
  Info,
  Loader2,
  ShieldOff,
  Split,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateAdHocJob } from "../hooks/useQueries";
import type { Team } from "../types/teams";

const SERVICE_OPTIONS = [
  "Dog Walking",
  "Dog Sitting",
  "Cat Sitting",
  "Pet Boarding",
  "Dog Bath",
  "Overnight Stay",
  "Drop-In Visit",
  "Other",
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "venmo", label: "Venmo" },
  { value: "applePayCash", label: "Apple Pay / Cash App" },
  { value: "other", label: "Other" },
];

function timeToDecimal(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

function calcTotal(startTime: string, endTime: string, rate: number): number {
  if (!startTime || !endTime || rate <= 0) return 0;
  const hours = timeToDecimal(endTime) - timeToDecimal(startTime);
  if (hours <= 0) return 0;
  return Math.round(hours * rate * 100) / 100;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sitterId: bigint;
  /** Sitter's default hourly rate in dollars */
  defaultRate?: number;
  /** Team memberships this sitter belongs to (for co-sitter assignment) */
  teams?: Team[];
  /** Map of sitter IDs to names for displaying co-sitter options */
  sitterNames?: Map<bigint, string>;
  /** Pre-fill the rate per hour for a selected service */
  serviceRates?: Array<{ service: string; ratePerHour: bigint }>;
}

export default function AdHocJobModal({
  open,
  onClose,
  sitterId,
  defaultRate = 0,
  teams = [],
  sitterNames = new Map(),
  serviceRates = [],
}: Props) {
  const createJob = useCreateAdHocJob();

  const [clientName, setClientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [service, setService] = useState("");
  const [jobDate, setJobDate] = useState(todayIso());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [rateInput, setRateInput] = useState(
    defaultRate > 0 ? String(defaultRate) : "",
  );
  const [petNames, setPetNames] = useState("");
  const [notes, setNotes] = useState("");
  const [assignCoSitter, setAssignCoSitter] = useState(false);
  const [coSitterId, setCoSitterId] = useState<bigint | null>(null);
  const [markPaid, setMarkPaid] = useState(false);
  const [acknowledgedOffApp, setAcknowledgedOffApp] = useState(false);
  const [paidDate, setPaidDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Reset on open
  useEffect(() => {
    if (open) {
      setClientName("");
      setContactNumber("");
      setService("");
      setJobDate(todayIso());
      setStartTime("09:00");
      setEndTime("10:00");
      setRateInput(defaultRate > 0 ? String(defaultRate) : "");
      setPetNames("");
      setNotes("");
      setAssignCoSitter(false);
      setCoSitterId(null);
      setMarkPaid(false);
      setPaidDate(todayIso());
      setPaymentMethod("cash");
      setAcknowledgedOffApp(false);
    }
  }, [open, defaultRate]);

  // Auto-fill rate when service changes
  useEffect(() => {
    if (!service) return;
    const match = serviceRates.find((r) => r.service === service);
    if (match) {
      setRateInput(String(Number(match.ratePerHour)));
    }
  }, [service, serviceRates]);

  const rate = Number(rateInput) || 0;
  const total = useMemo(
    () => calcTotal(startTime, endTime, rate),
    [startTime, endTime, rate],
  );
  const hours = useMemo(() => {
    const h = timeToDecimal(endTime) - timeToDecimal(startTime);
    return h > 0 ? Math.round(h * 100) / 100 : 0;
  }, [startTime, endTime]);

  // Team co-sitter options (exclude self)
  const coSitterOptions = useMemo(() => {
    const options: Array<{
      id: bigint;
      name: string;
      splitPct: number;
      teamId: string;
    }> = [];
    for (const team of teams) {
      for (const [memberId, pct] of team.splitPercentages ?? []) {
        if (memberId === sitterId) continue;
        options.push({
          id: memberId,
          name: sitterNames.get(memberId) ?? `Sitter #${memberId}`,
          splitPct: Number(pct),
          teamId: team.teamId,
        });
      }
    }
    return options;
  }, [teams, sitterId, sitterNames]);

  const selectedCoSitter =
    coSitterOptions.find((o) => o.id === coSitterId) ?? null;
  const mySplitPct = useMemo(() => {
    if (!selectedCoSitter) return 100;
    const myPct = teams
      .find((t) => t.teamId === selectedCoSitter.teamId)
      ?.splitPercentages?.find(([id]) => id === sitterId)?.[1];
    return myPct ? Number(myPct) : 100 - selectedCoSitter.splitPct;
  }, [selectedCoSitter, teams, sitterId]);

  const canSubmit =
    clientName.trim().length > 0 &&
    service &&
    jobDate &&
    startTime &&
    endTime &&
    rate > 0 &&
    hours > 0 &&
    acknowledgedOffApp;

  async function handleSubmit() {
    if (!canSubmit) return;
    const petList = petNames
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const totalCents = BigInt(Math.round(total * 100));
    const rateCents = BigInt(Math.round(rate * 100));

    try {
      const result = await createJob.mutateAsync({
        sitterId,
        clientName: clientName.trim(),
        adHocClientContact: contactNumber.trim() || null,
        service,
        jobDate,
        startTime,
        endTime,
        ratePerHourCents: rateCents,
        totalAmountCents: totalCents,
        coSitterId: assignCoSitter ? coSitterId : null,
        teamId:
          assignCoSitter && selectedCoSitter ? selectedCoSitter.teamId : null,
        petNames: petList,
        notes: notes.trim() || null,
        offAppClientAcknowledged: acknowledgedOffApp,
        markPaid,
        paidDate: markPaid ? paidDate : null,
        paymentMethod: markPaid ? paymentMethod : null,
      });
      if (
        result &&
        typeof result === "object" &&
        "__kind__" in result &&
        result.__kind__ === "err"
      ) {
        toast.error(
          `Failed to log job: ${(result as { __kind__: "err"; err: string }).err}`,
        );
        return;
      }
      toast.success("Off-app job logged!");
      onClose();
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 border-0">
        {/* Glassmorphism header */}
        <div
          className="sticky top-0 z-10 px-5 pt-5 pb-4 rounded-t-2xl"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.08 265 / 0.97) 0%, oklch(0.20 0.10 280 / 0.97) 100%)",
            borderBottom: "1px solid oklch(0.40 0.12 265 / 0.30)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-amber-500/90 flex items-center justify-center shrink-0">
                <Calculator size={15} className="text-white" />
              </div>
              <span className="font-display font-bold">Log Off-App Job</span>
              <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2.5 py-0.5">
                Off-App Job
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Prominent Off-App Disclaimer Banner */}
          <div
            className="mt-3 rounded-xl border-2 px-4 py-3 space-y-1.5"
            style={{
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.35)",
            }}
          >
            <div className="flex items-center gap-2">
              <Info size={14} className="text-red-400 shrink-0" />
              <p className="text-xs font-bold text-red-300 uppercase tracking-wide">
                Off-App Client Notice
              </p>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">
              Off-app clients logged here have{" "}
              <strong>NO relationship with Pawspect</strong>. Pawspect provides
              no services, support, notifications, or guarantees for off-app
              bookings. This record is for your accounting purposes only.{" "}
              <strong>
                Data Driven Design Group, LLC has zero liability for any off-app
                arrangements.
              </strong>
            </p>
          </div>
        </div>

        {/* Form body */}
        <div className="px-5 py-5 space-y-4 bg-card">
          {/* Client Name */}
          <div className="space-y-1.5">
            <Label
              className="text-sm font-semibold text-foreground"
              htmlFor="adhoc-client-name"
            >
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adhoc-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="rounded-xl"
              data-ocid="adhoc.client_name.input"
            />
          </div>

          {/* Contact Number (optional) */}
          <div className="space-y-1.5">
            <Label
              className="text-sm font-semibold text-foreground"
              htmlFor="adhoc-contact"
            >
              Contact Number{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="adhoc-contact"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="For your reference only"
              type="tel"
              className="rounded-xl"
              data-ocid="adhoc.contact.input"
            />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertCircle size={10} className="shrink-0" />
              For your reference only — this client won&apos;t be contacted by
              the app.
            </p>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Service <span className="text-red-500">*</span>
            </Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger
                className="rounded-xl"
                data-ocid="adhoc.service.select"
              >
                <SelectValue placeholder="Select service..." />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Job Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={jobDate}
                onChange={(e) => setJobDate(e.target.value)}
                className="rounded-xl"
                data-ocid="adhoc.job_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-xl"
                data-ocid="adhoc.start_time.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-xl"
                data-ocid="adhoc.end_time.input"
              />
            </div>
          </div>

          {/* Rate + Auto Total */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Rate / Hour ($)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.50"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="pl-7 rounded-xl"
                  placeholder="0.00"
                  data-ocid="adhoc.rate.input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Total (Auto)
              </Label>
              <div
                className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-muted/30"
                data-ocid="adhoc.total.display"
              >
                <Calculator
                  size={13}
                  className="text-muted-foreground shrink-0"
                />
                <span className="font-bold text-foreground text-sm">
                  ${total.toFixed(2)}
                </span>
                {hours > 0 && rate > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({hours}h × ${rate}/hr)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pet Names */}
          <div className="space-y-1.5">
            <Label
              className="text-sm font-semibold text-foreground"
              htmlFor="adhoc-pets"
            >
              Pet Names{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional, comma separated)
              </span>
            </Label>
            <Input
              id="adhoc-pets"
              value={petNames}
              onChange={(e) => setPetNames(e.target.value)}
              placeholder="e.g. Buddy, Max"
              className="rounded-xl"
              data-ocid="adhoc.pet_names.input"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label
              className="text-sm font-semibold text-foreground"
              htmlFor="adhoc-notes"
            >
              Internal Notes{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="adhoc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for your records only..."
              className="rounded-xl resize-none"
              rows={2}
              data-ocid="adhoc.notes.textarea"
            />
          </div>

          {/* Co-Sitter Toggle */}
          {coSitterOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="adhoc-cositter"
                  checked={assignCoSitter}
                  onCheckedChange={(v) => {
                    setAssignCoSitter(!!v);
                    if (!v) setCoSitterId(null);
                  }}
                  data-ocid="adhoc.cositter.checkbox"
                />
                <Label
                  htmlFor="adhoc-cositter"
                  className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <Split size={14} className="text-primary" />
                  Split payout with a co-sitter
                </Label>
              </div>

              {assignCoSitter && (
                <div className="space-y-2 pl-7">
                  <Select
                    value={coSitterId?.toString() ?? ""}
                    onValueChange={(v) => setCoSitterId(v ? BigInt(v) : null)}
                  >
                    <SelectTrigger
                      className="rounded-xl"
                      data-ocid="adhoc.cositter.select"
                    >
                      <SelectValue placeholder="Select co-sitter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coSitterOptions.map((o) => (
                        <SelectItem
                          key={o.id.toString()}
                          value={o.id.toString()}
                        >
                          {o.name} — {o.splitPct}% split
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedCoSitter && total > 0 && (
                    <div className="flex gap-3 mt-2">
                      <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          Your share
                        </p>
                        <p className="font-bold text-primary text-sm">
                          ${((mySplitPct / 100) * total).toFixed(2)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({mySplitPct}%)
                          </span>
                        </p>
                      </div>
                      <div className="flex-1 bg-muted/40 border border-border rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {selectedCoSitter.name}&apos;s share
                        </p>
                        <p className="font-bold text-foreground text-sm">
                          $
                          {((selectedCoSitter.splitPct / 100) * total).toFixed(
                            2,
                          )}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({selectedCoSitter.splitPct}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Required off-app acknowledgment */}
          <div
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              acknowledgedOffApp
                ? "bg-emerald-500/8 border-emerald-500/30"
                : "bg-muted/30 border-border"
            }`}
          >
            <Checkbox
              id="adhoc-ack"
              checked={acknowledgedOffApp}
              onCheckedChange={(v) => setAcknowledgedOffApp(!!v)}
              data-ocid="adhoc.liability_ack.checkbox"
            />
            <label
              htmlFor="adhoc-ack"
              className="text-xs text-foreground leading-relaxed cursor-pointer select-none"
            >
              I understand this off-app client has{" "}
              <strong>no relationship with Pawspect</strong>, and{" "}
              <strong>Pawspect bears no liability</strong> for this arrangement.{" "}
              <span className="text-destructive font-semibold">Required *</span>
            </label>
          </div>

          {/* Mark as Paid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="adhoc-paid"
                checked={markPaid}
                onCheckedChange={(v) => setMarkPaid(!!v)}
                data-ocid="adhoc.mark_paid.checkbox"
              />
              <Label
                htmlFor="adhoc-paid"
                className="text-sm font-semibold text-foreground cursor-pointer"
              >
                Mark as already paid
              </Label>
            </div>

            {markPaid && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Paid Date
                  </Label>
                  <Input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="rounded-xl"
                    data-ocid="adhoc.paid_date.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Payment Method
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger
                      className="rounded-xl"
                      data-ocid="adhoc.payment_method.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border/60 px-5 py-4 flex items-center justify-between gap-3 rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-full gap-1.5"
            data-ocid="adhoc.cancel_button"
          >
            <X size={14} /> Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || createJob.isPending}
            className="rounded-full px-6 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            data-ocid="adhoc.submit_button"
          >
            {createJob.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Logging...
              </>
            ) : (
              <>
                <Calculator size={14} /> Log Job
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
