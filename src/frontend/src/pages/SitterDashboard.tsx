import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Award,
  BarChart2,
  BarChart3,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Gift,
  Globe,
  LifeBuoy,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  MessageSquare,
  Moon,
  Pause,
  PawPrint,
  Pencil,
  Percent,
  PiggyBank,
  Play,
  Receipt,
  RefreshCw,
  Repeat2,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Component,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { View } from "../App";
import type { AvailabilityEntry, Public, Public__8 } from "../backend.d";
import AgendaTab from "../components/AgendaTab";
import BillingPortalTab from "../components/BillingPortalTab";
import BookingCard from "../components/BookingCard";
import DeclineBookingModal from "../components/DeclineBookingModal";
import FrozenAccountScreen from "../components/FrozenAccountScreen";
import NotificationBell from "../components/NotificationBell";
import { PhotoGalleryUpload } from "../components/PhotoGalleryUpload";
import { PhotoUpload } from "../components/PhotoUpload";
import PortalBottomNav from "../components/PortalBottomNav";
import PortalSidebar, {
  type NavGroup,
  type NavTab,
} from "../components/PortalSidebar";
import RecurringBookingGroupCard from "../components/RecurringBookingGroupCard";
import ServiceLogTimeline from "../components/ServiceLogTimeline";
import SiteBuilder from "../components/SiteBuilder";
import SitterAdvisorWidget from "../components/SitterAdvisorWidget";
import SitterAnalyticsSplitCard from "../components/SitterAnalyticsTab";
import SitterCRMTab from "../components/SitterCRMTab";
import SitterInvoicesTab from "../components/SitterInvoicesTab";
import SitterPortalFAQ from "../components/SitterPortalFAQ";
import SitterTeamsTab from "../components/SitterTeamsTab";
import StorefrontShareLink from "../components/StorefrontShareLink";
import SubscriptionStatusBadge from "../components/SubscriptionStatusBadge";
import SupportTicketTab from "../components/SupportTicketTab";
import TeamCollabTab from "../components/TeamCollabTab";
import TrialGateModal from "../components/TrialGateModal";
import {
  useAdHocJobsBySitter,
  useAllSitters,
  useBookingsBySitter,
  useCallerProfile,
  useClaimFirstAdmin,
  useCreateSitter,
  useDealOffersBySitter,
  useDeclineBooking,
  useGetMySupportTickets,
  useGetRecurringGroupsBySitter,
  useGetReviewsBySitter,
  useGetSitterCredentials,
  useGetSitterPrivateData,
  useGetSitterStats,
  useGetTipsBySitter,
  useIsAdmin,
  usePaymentsByBookingIds,
  useRequestAccountAnonymization,
  useRequestGdprExport,
  useSaveProfile,
  useSendServiceCompletionEmail,
  useSetCallerAsAdmin,
  useSetSitterAvailability,
  useSetSitterPageComponents,
  useSetSitterServiceRates,
  useSitterAvailability,
  useSitterExtendedPublic,
  useSitterLicenseStatus,
  useSitterServiceRates,
  useSitterSubscriptionStatus,
  useUpdateBookingStatus,
  useUpdateCredentialChecklist,
  useUpdateServiceCompletion,
  useUpdateSitter,
  useUpdateSitterEarningsGoal,
  useUpdateSitterProfileV2,
} from "../hooks/useQueries";
import { useMyTeams } from "../hooks/useTeamQueries";
import {
  CERTIFICATION_OPTIONS,
  CREDENTIAL_ITEMS,
  DEFAULT_PAGE_COMPONENTS,
  PET_TYPE_OPTIONS,
  RESPONSE_TIME_OPTIONS,
} from "../types/sitter-v2";
import type { PageComponentVisibility } from "../types/sitter-v2";
import SitterStorefrontPage from "./SitterStorefrontPage";
import type { StorefrontPreviewData } from "./SitterStorefrontPage";

// Legal versioning — increment when Terms or Privacy Policy are updated
import { TERMS_VERSION } from "./TermsPage";

// ── Tab Error Boundary ────────────────────────────────────────────────────────

interface TabEBState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<
  { children: ReactNode; tabName?: string },
  TabEBState
> {
  constructor(props: { children: ReactNode; tabName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): TabEBState {
    return { hasError: true, error };
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-destructive">
            This section had a problem loading.
          </p>
          <p className="text-xs text-muted-foreground">
            Please refresh the page. If the problem continues, contact support.
          </p>
          <button
            type="button"
            className="text-xs font-medium text-primary underline underline-offset-2 hover:no-underline"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ALL_SERVICES = [
  "Dog Walking",
  "Boarding",
  "Overnight Stay",
  "Drop-In Visit",
  "Pet Feeding",
  "Playtime & Hang Out",
  "Cat Sitting",
  "Pet Sitting",
  "Small Pet Care",
  "Bird Care",
  "Dog Bath",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function AvailabilityEditor({ sitterId }: { sitterId: bigint }) {
  const { data: existingEntries = [] } = useSitterAvailability(sitterId);
  const setAvailability = useSetSitterAvailability();

  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(() => ({ enabled: false, startTime: "09:00", endTime: "17:00" })),
  );

  useEffect(() => {
    if (existingEntries.length > 0) {
      setSchedule((prev) => {
        const updated = [...prev];
        for (const entry of existingEntries as AvailabilityEntry[]) {
          const idx = Number(entry.dayOfWeek);
          if (idx >= 0 && idx < 7) {
            updated[idx] = {
              enabled: true,
              startTime: minutesToTime(Number(entry.startTime)),
              endTime: minutesToTime(Number(entry.endTime)),
            };
          }
        }
        return updated;
      });
    }
  }, [existingEntries]);

  const handleSave = async () => {
    const entries: AvailabilityEntry[] = schedule
      .map((d, i) =>
        d.enabled
          ? {
              dayOfWeek: BigInt(i),
              startTime: BigInt(timeToMinutes(d.startTime)),
              endTime: BigInt(timeToMinutes(d.endTime)),
            }
          : null,
      )
      .filter((e): e is AvailabilityEntry => e !== null);
    try {
      await setAvailability.mutateAsync({ sitterId, entries });
      toast.success("Availability saved!");
    } catch {
      toast.error("Failed to save availability");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set your weekly availability. Clients will see when you're available.
      </p>
      <div className="space-y-2">
        {DAYS.map((day, idx) => (
          <div
            key={day}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={schedule[idx].enabled}
                onCheckedChange={(v) =>
                  setSchedule((prev) =>
                    prev.map((d, i) => (i === idx ? { ...d, enabled: v } : d)),
                  )
                }
              />
              <span className="w-8 text-sm font-medium shrink-0">{day}</span>
            </div>
            {schedule[idx].enabled ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1 sm:pl-0">
                <input
                  type="time"
                  value={schedule[idx].startTime}
                  onChange={(e) =>
                    setSchedule((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, startTime: e.target.value } : d,
                      ),
                    )
                  }
                  className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground min-w-0 flex-1"
                />
                <span className="text-muted-foreground text-sm shrink-0">
                  to
                </span>
                <input
                  type="time"
                  value={schedule[idx].endTime}
                  onChange={(e) =>
                    setSchedule((prev) =>
                      prev.map((d, i) =>
                        i === idx ? { ...d, endTime: e.target.value } : d,
                      ),
                    )
                  }
                  className="border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground min-w-0 flex-1"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground pl-1 sm:pl-0">
                Not available
              </span>
            )}
          </div>
        ))}
      </div>
      <Button
        data-ocid="availability.save_button"
        onClick={handleSave}
        disabled={setAvailability.isPending}
        className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-h-[48px] sm:min-h-0"
      >
        {setAvailability.isPending ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={14} className="mr-2" />
            Save Availability
          </>
        )}
      </Button>
    </div>
  );
}

function ServiceRatesEditor({
  sitter,
  selectedServices,
}: { sitter: Public; selectedServices: string[] }) {
  const { data: existingRates = [] } = useSitterServiceRates(sitter.id);
  const setRates = useSetSitterServiceRates();
  const [rateMap, setRateMap] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const svc of selectedServices) {
      const existing = (
        existingRates as Array<{ service: string; ratePerHour: bigint }>
      ).find((r) => r.service === svc);
      if (existing) {
        map[svc] = String(existing.ratePerHour);
      } else if (sitter.hourlyRate && Number(sitter.hourlyRate) > 0) {
        // Pre-populate with the sitter's base hourly rate as a starting default
        map[svc] = String(sitter.hourlyRate);
      } else {
        map[svc] = "";
      }
    }
    setRateMap(map);
  }, [existingRates, selectedServices, sitter.hourlyRate]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const svc of selectedServices) {
      const raw = rateMap[svc] ?? "";
      if (raw.trim() === "") {
        newErrors[svc] = "Rate must be at least $1";
      } else {
        const val = Number(raw);
        if (Number.isNaN(val) || val <= 0) {
          newErrors[svc] = "Rate must be at least $1";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRates = async () => {
    if (!validate()) return;

    try {
      const rates = selectedServices.map((svc) => ({
        service: svc,
        ratePerHour: BigInt(Math.round(Number(rateMap[svc]))),
      }));
      await setRates.mutateAsync({ sitterId: sitter.id, rates });

      // Green flash on saved inputs
      setSavedKeys(new Set(selectedServices));
      setTimeout(() => setSavedKeys(new Set()), 1800);

      toast.success(
        "Rates saved! Your new rates will apply to future bookings.",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[ServiceRatesEditor] save failed:", msg);
      if (msg.includes("Unauthorized") || msg.includes("unauthorized")) {
        toast.error(
          "Unable to save — please sign out and sign back in with the same account you used to register.",
        );
      } else if (msg.includes("frozen") || msg.includes("suspended")) {
        toast.error(
          "Your account is frozen — please check your subscription in the Billing tab.",
        );
      } else {
        toast.error(msg || "Failed to save rates. Please try again.");
      }
    }
  };

  return (
    <div className="mt-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3 sm:col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-indigo-900">
          Service Rates ($/hr)
        </p>
        <Button
          size="sm"
          onClick={handleSaveRates}
          disabled={setRates.isPending}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-4 text-xs font-semibold"
          data-ocid="profile.rates.save_button"
        >
          {setRates.isPending ? (
            <>
              <Loader2 size={12} className="mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={12} className="mr-1" />
              Save Rates
            </>
          )}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {selectedServices.map((svc) => {
          const hasError = !!errors[svc];
          const wasSaved = savedKeys.has(svc);
          return (
            <div key={svc} className="flex flex-col gap-1">
              <div
                className={[
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors duration-300",
                  hasError
                    ? "bg-red-50 border-red-400"
                    : wasSaved
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-indigo-100",
                ].join(" ")}
              >
                <span className="flex-1 text-sm text-indigo-800 font-medium truncate">
                  {svc}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="1"
                    value={rateMap[svc] ?? ""}
                    onChange={(e) => {
                      setRateMap((prev) => ({
                        ...prev,
                        [svc]: e.target.value,
                      }));
                      if (errors[svc]) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next[svc];
                          return next;
                        });
                      }
                    }}
                    className={[
                      "w-20 rounded-lg h-8 text-sm transition-colors duration-300",
                      hasError
                        ? "border-red-500 focus-visible:ring-red-400"
                        : "",
                      wasSaved ? "border-green-500 bg-green-50" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    placeholder="15"
                    data-ocid={`profile.rates.input.${svc.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
              </div>
              {hasError && (
                <p
                  className="text-xs text-red-600 px-1"
                  data-ocid={`profile.rates.field_error.${svc.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {errors[svc]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminClaimSection({
  navigate,
}: { navigate: (view: import("../App").View) => void }) {
  const claimAdmin = useClaimFirstAdmin();
  const setCallerAsAdmin = useSetCallerAsAdmin();
  const { data: isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();

  // Don't render at all if user is already an admin
  if (isAdmin === true) return null;

  const handleClaim = () => {
    setCallerAsAdmin.mutate(undefined, {
      onSuccess: () => {
        toast.success("Admin access granted!");
        queryClient.invalidateQueries({ queryKey: ["is-admin"] });
        queryClient.invalidateQueries({ queryKey: ["is-admin-assigned"] });
        setTimeout(() => navigate("admin-dashboard"), 600);
      },
      onError: () => {
        // Fallback to claimFirstAdmin
        claimAdmin.mutate(undefined, {
          onSuccess: () => {
            toast.success("Admin access claimed!");
            queryClient.invalidateQueries({ queryKey: ["is-admin"] });
            queryClient.invalidateQueries({ queryKey: ["is-admin-assigned"] });
            setTimeout(() => navigate("admin-dashboard"), 600);
          },
          onError: () => toast.error("Failed to claim admin access."),
        });
      },
    });
  };

  return (
    <div className="mt-4 p-4 bg-muted/30 border border-border/50 rounded-xl sm:col-span-2">
      <div className="flex items-start gap-3">
        <ShieldCheck
          size={15}
          className="text-muted-foreground mt-0.5 shrink-0"
        />
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Platform Admin Access
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            App owner setup only. Click to claim admin access.
          </p>
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={setCallerAsAdmin.isPending || claimAdmin.isPending}
            className="mt-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground h-7 px-3 text-xs font-medium border border-border"
            data-ocid="profile.claim_admin.button"
            variant="outline"
          >
            {setCallerAsAdmin.isPending || claimAdmin.isPending ? (
              <>
                <Loader2 size={11} className="mr-1 animate-spin" />
                Claiming...
              </>
            ) : (
              "Set as Admin"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Analytics helpers ──────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMonthKey(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Sunday=0…Saturday=6 → Monday-of-that-week label "Dec 1" */
function getWeekKey(ts: bigint): string {
  const d = new Date(Number(ts / 1_000_000n));
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SAVINGS_TIPS = [
  "Set aside 25–30% of earnings for taxes. As a self-employed sitter, you'll thank yourself come April.",
  "Rainy day fund: save $50 from each booking until you have 3 months of expenses covered.",
  "Pet sitting insurance is $100–300/year and can protect your income if an unexpected claim arises.",
];

interface AnalyticsTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payments: any[];
  sitterId: bigint | null;
  adHocJobCount?: number;
}

function AnalyticsTab({
  bookings,
  payments,
  sitterId,
  adHocJobCount = 0,
}: AnalyticsTabProps) {
  // ── Live "Last updated" tracker ───────────────────────────────────────────
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const lastUpdateRef = useRef<number>(Date.now());
  const prevCountRef = useRef(`${bookings.length}-${payments.length}`);

  // Reset timer whenever the data count changes (new data arrived via polling)
  const currentCount = `${bookings.length}-${payments.length}`;
  if (currentCount !== prevCountRef.current) {
    prevCountRef.current = currentCount;
    lastUpdateRef.current = Date.now();
    // Not setting state here — the interval below will catch it on next tick
  }

  // Tick every second to keep "last updated" label fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceUpdate(
        Math.floor((Date.now() - lastUpdateRef.current) / 1000),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const lastUpdatedLabel =
    secondsSinceUpdate < 5
      ? "Just now"
      : secondsSinceUpdate < 60
        ? `${secondsSinceUpdate}s ago`
        : `${Math.floor(secondsSinceUpdate / 60)}m ago`;

  // Countdown to next backend refetch (hooks refetch every 15s)
  const [secondsToNextRefresh, setSecondsToNextRefresh] = useState(15);
  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsToNextRefresh((s) => (s <= 1 ? 15 : s - 1));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  // ── Earnings goal state ────────────────────────────────────────────────────
  const { data: privateData } = useGetSitterPrivateData(sitterId);
  const updateGoal = useUpdateSitterEarningsGoal();
  const { data: reviews = [] } = useGetReviewsBySitter(sitterId);
  const { data: tips = [] } = useGetTipsBySitter(sitterId);
  const [goalInput, setGoalInput] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);

  // Sync input with loaded goal value
  const storedGoalCents = privateData?.earningsGoal ?? 0;
  useEffect(() => {
    if (storedGoalCents > 0 && goalInput === "") {
      setGoalInput(String(Math.round(storedGoalCents / 100)));
    }
  }, [storedGoalCents, goalInput]);

  const handleSetGoal = async () => {
    if (!sitterId) return;
    const dollars = Number.parseFloat(goalInput);
    if (Number.isNaN(dollars) || dollars <= 0) {
      toast.error("Please enter a valid dollar amount");
      return;
    }
    try {
      await updateGoal.mutateAsync({
        sitterId,
        goal: BigInt(Math.round(dollars * 100)),
      });
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 2500);
      toast.success("Goal saved!");
    } catch {
      toast.error("Failed to save goal");
    }
  };

  // ── Core stats computation ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    type PaymentRecord = {
      bookingId: bigint;
      status: string;
      totalAmount: bigint;
    };
    const paymentByBooking = new Map<string, PaymentRecord>();
    for (const p of payments as PaymentRecord[]) {
      paymentByBooking.set(p.bookingId.toString(), p);
    }

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    const serviceRevenue: Record<string, number> = {};
    const serviceBookingCount: Record<string, number> = {};
    const monthData: Record<
      string,
      { bookings: number; earned: number; pending: number }
    > = {};
    const weekData: Record<string, number> = {};

    // Retention: unique client identifiers
    const clientBookingCount = new Map<string, number>();

    // Heatmap: day (0=Mon…6=Sun) × period (0=morning, 1=afternoon, 2=evening)
    const heatmap: number[][] = Array.from({ length: 7 }, () => [0, 0, 0]);

    let totalEarned = 0;
    let totalPending = 0;
    let completedCount = 0;

    for (const b of bookings) {
      const st = b.status as string;
      const payment = paymentByBooking.get(b.id.toString());
      const isPaid = payment?.status === "paid";

      // Amount in dollars: prefer payment record, else estimate from serviceSchedule
      let amount = 0;
      if (payment) {
        amount = Number(payment.totalAmount) / 100;
      } else if (
        (st === "pending" || st === "confirmed" || st === "completed") &&
        b.serviceSchedule &&
        (b.serviceSchedule as unknown[]).length > 0
      ) {
        // Estimate from schedule slot data when no payment record exists yet
        const slotTotal = (
          b.serviceSchedule as Array<{
            slots?: Array<{ durationMinutes?: bigint; ratePerHour?: bigint }>;
          }>
        )
          .flatMap((d) => d.slots ?? [])
          .reduce((s, slot) => {
            const hours = Number(slot.durationMinutes ?? 60n) / 60;
            return s + hours * Number(slot.ratePerHour ?? 0n);
          }, 0);
        if (slotTotal > 0) amount = slotTotal;
      }

      if (isPaid) totalEarned += amount;
      else if (st !== "cancelled") totalPending += amount;
      if (st === "completed") completedCount += 1;

      if (isPaid) {
        for (const svc of (b.services as string[] | undefined) ?? []) {
          serviceRevenue[svc] =
            (serviceRevenue[svc] ?? 0) +
            amount /
              Math.max(1, ((b.services as string[] | undefined) ?? []).length);
        }
      }

      // Per-service booking count (non-cancelled)
      if (st !== "cancelled") {
        for (const svc of (b.services as string[] | undefined) ?? []) {
          serviceBookingCount[svc] = (serviceBookingCount[svc] ?? 0) + 1;
        }
      }

      const monthKey = getMonthKey(b.startDate);
      if (!monthData[monthKey])
        monthData[monthKey] = { bookings: 0, earned: 0, pending: 0 };
      monthData[monthKey].bookings += 1;
      if (isPaid) monthData[monthKey].earned += amount;
      else if (st !== "cancelled") monthData[monthKey].pending += amount;

      if (isPaid) {
        const wk = getWeekKey(b.startDate);
        weekData[wk] = (weekData[wk] ?? 0) + amount;
      }

      // Retention: track unique clients (non-cancelled)
      if (st !== "cancelled") {
        const emailPart = ((b.clientEmail as string) || "")
          .toLowerCase()
          .trim();
        const phonePart = ((b.clientPhone as string) || "").replace(/\D/g, "");
        // Use email first, then phone, then a fallback key so no client is lost
        const clientKey =
          emailPart || phonePart || `booking-${b.id.toString()}`;
        clientBookingCount.set(
          clientKey,
          (clientBookingCount.get(clientKey) ?? 0) + 1,
        );
      }

      // Heatmap — use booking startDate timestamp
      if (st !== "cancelled") {
        const d = new Date(Number(b.startDate) / 1_000_000);
        const rawDay = d.getDay(); // 0=Sun
        const dayIdx = rawDay === 0 ? 6 : rawDay - 1; // 0=Mon
        const hour = d.getHours();
        const period = hour < 12 ? 0 : hour < 17 ? 1 : 2;
        heatmap[dayIdx][period] += 1;
      }
    }

    const thisMonthEarned = monthData[thisMonthKey]?.earned ?? 0;
    const prevMonthEarned = monthData[prevMonthKey]?.earned ?? 0;
    const monthPct =
      prevMonthEarned > 0
        ? ((thisMonthEarned - prevMonthEarned) / prevMonthEarned) * 100
        : null;

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const projected =
      dayOfMonth > 0 ? (thisMonthEarned / dayOfMonth) * daysInMonth : 0;

    const avgPerBooking = completedCount > 0 ? totalEarned / completedCount : 0;

    const topServices = Object.entries(serviceRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const monthRows = Object.entries(monthData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);

    // Build last 8 weeks chart data (sorted oldest→newest)
    const allWeeksSorted = Object.entries(weekData).sort(([a], [b]) => {
      const da = new Date(`${a} ${now.getFullYear()}`);
      const db = new Date(`${b} ${now.getFullYear()}`);
      return da.getTime() - db.getTime();
    });
    const weekChartData = allWeeksSorted.slice(-8).map(([week, earned]) => ({
      week,
      earned: Math.round(earned * 100) / 100,
    }));

    // ── Service performance table ──────────────────────────────────────────
    const allSvcKeys = new Set([
      ...Object.keys(serviceRevenue),
      ...Object.keys(serviceBookingCount),
    ]);
    const servicePerformance = Array.from(allSvcKeys)
      .map((svc) => ({
        name: svc,
        bookings: serviceBookingCount[svc] ?? 0,
        revenue: serviceRevenue[svc] ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Retention ─────────────────────────────────────────────────────────
    const totalUniqueClients = clientBookingCount.size;
    const repeatClients = [...clientBookingCount.values()].filter(
      (c) => c > 1,
    ).length;
    const retentionRate =
      totalUniqueClients > 0
        ? Math.round((repeatClients / totalUniqueClients) * 100)
        : 0;

    // ── Peak day/time ──────────────────────────────────────────────────────
    const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const PERIOD_LABELS = ["Morning", "Afternoon", "Evening"];
    const dayTotals = heatmap.map((periods) =>
      periods.reduce((s, v) => s + v, 0),
    );
    const maxDayTotal = Math.max(...dayTotals, 1);
    const peakDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const peakDayName = DAY_LABELS[peakDayIdx] ?? "—";
    const periodTotals = [0, 1, 2].map((pi) =>
      heatmap.reduce((s, row) => s + row[pi], 0),
    );
    const peakPeriodIdx = periodTotals.indexOf(Math.max(...periodTotals));
    const peakPeriodName = PERIOD_LABELS[peakPeriodIdx] ?? "Morning";

    const totalActiveBookings = bookings.filter(
      (b) => (b.status as string) !== "cancelled",
    ).length;

    return {
      topServices,
      monthRows,
      totalEarned,
      totalPending,
      completedCount,
      thisMonthEarned,
      prevMonthEarned,
      monthPct,
      projected,
      avgPerBooking,
      weekChartData,
      servicePerformance,
      totalUniqueClients,
      repeatClients,
      retentionRate,
      heatmap,
      dayTotals,
      maxDayTotal,
      peakDayName,
      peakPeriodName,
      totalActiveBookings,
      DAY_LABELS,
      PERIOD_LABELS,
    };
  }, [bookings, payments]);

  // ── Derived goal data ──────────────────────────────────────────────────────
  const goalDollars =
    goalInput !== ""
      ? Number.parseFloat(goalInput) || 0
      : storedGoalCents / 100;
  const goalPct =
    goalDollars > 0
      ? Math.min(100, Math.round((stats.thisMonthEarned / goalDollars) * 100))
      : 0;

  const goalMotivation =
    goalDollars === 0
      ? null
      : goalPct >= 100
        ? "Goal achieved! Outstanding work this month."
        : goalPct >= 75
          ? "Almost there — keep the momentum!"
          : goalPct >= 25
            ? "Great progress! Keep booking."
            : "Early in the month — keep booking!";

  const lifetimeMilestone =
    stats.totalEarned >= 5000
      ? "Top earner. Outstanding."
      : stats.totalEarned >= 2000
        ? "On a roll!"
        : stats.totalEarned >= 500
          ? "Building momentum!"
          : "Great start!";

  const currentMonthIdx = new Date().getMonth();
  const savingsTip = SAVINGS_TIPS[currentMonthIdx % 3];

  return (
    <div className="space-y-6">
      {/* ── Live data freshness indicator ─────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        data-ocid="analytics.last-updated.indicator"
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span>
          Live data · Updated {lastUpdatedLabel} · Next refresh in{" "}
          {secondsToNextRefresh}s
        </span>
      </div>

      {/* ── Off-App Jobs indicator ─────────────────────────────────────────── */}
      {adHocJobCount > 0 && (
        <div
          className="rounded-2xl border p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            borderColor: "#fcd34d",
          }}
          data-ocid="analytics.adhoc-jobs.card"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
            <Briefcase size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
              Off-App Jobs
            </p>
            <p className="text-xl font-extrabold text-amber-900">
              {adHocJobCount}
            </p>
            <p className="text-xs text-amber-700">
              Includes {adHocJobCount} off-app job
              {adHocJobCount !== 1 ? "s" : ""} in total earnings
            </p>
          </div>
        </div>
      )}
      {/* ── Hero Earnings Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: This Month's Earnings */}
        <div
          className="relative rounded-2xl p-5 overflow-hidden border gloss-ring"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #fefce8 100%)",
            borderColor: "#c7d2fe",
          }}
          data-ocid="analytics.this-month.card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <TrendingUp size={18} className="text-white" />
            </div>
            {stats.monthPct !== null && (
              <span
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                  stats.monthPct >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {stats.monthPct >= 0 ? (
                  <TrendingUp size={11} />
                ) : (
                  <TrendingDown size={11} />
                )}
                {Math.abs(stats.monthPct).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">
            This Month
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #d97706)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${formatCurrency(stats.thisMonthEarned)}
          </p>
          {stats.monthPct !== null ? (
            <p
              className={`text-xs mt-1 font-medium ${stats.monthPct >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {stats.monthPct >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(stats.monthPct).toFixed(1)}% from last month
            </p>
          ) : (
            <p className="text-xs mt-1 text-indigo-400">First month tracked</p>
          )}
        </div>

        {/* Card 2: Lifetime Earnings */}
        <div
          className="relative rounded-2xl p-5 overflow-hidden border gloss-ring"
          style={{
            background: "linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)",
            borderColor: "#fde68a",
          }}
          data-ocid="analytics.lifetime.card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
              <Trophy size={18} className="text-white" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            Lifetime Earnings
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #d97706, #ea580c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${formatCurrency(stats.totalEarned)}
          </p>
          <p className="text-xs mt-1 font-semibold text-amber-700">
            {lifetimeMilestone}
          </p>
        </div>

        {/* Card 3: Avg Per Booking */}
        <div
          className="relative rounded-2xl p-5 overflow-hidden border gloss-ring"
          style={{
            background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
            borderColor: "#ddd6fe",
          }}
          data-ocid="analytics.avg-booking.card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <BarChart2 size={18} className="text-white" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">
            Avg Per Booking
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${formatCurrency(stats.avgPerBooking)}
          </p>
          <p className="text-xs mt-1 text-violet-500 font-medium">
            from {stats.completedCount} completed booking
            {stats.completedCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Card 4: Projected This Month */}
        <div
          className="relative rounded-2xl p-5 overflow-hidden border gloss-ring"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            borderColor: "#a7f3d0",
          }}
          data-ocid="analytics.projected.card"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Target size={18} className="text-white" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
            Projected This Month
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #059669, #0d9488)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${formatCurrency(stats.projected)}
          </p>
          <p className="text-xs mt-1 text-emerald-600 font-medium">
            Based on your current pace
          </p>
        </div>
      </div>

      {/* ── Monthly Earnings Goal ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 gloss-ring"
        style={{
          background: "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)",
          borderColor: "#fde68a",
        }}
        data-ocid="analytics.goal.section"
      >
        <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Target size={15} className="text-amber-600" />
          Monthly Earnings Goal
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-[160px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-600">
              $
            </span>
            <Input
              type="number"
              min="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="pl-7 rounded-lg border-amber-200 bg-white/80 focus-visible:ring-amber-400 text-sm"
              placeholder="e.g. 2000"
              data-ocid="analytics.goal.input"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSetGoal}
            disabled={updateGoal.isPending || !goalInput}
            className="rounded-full h-9 px-5 text-sm font-semibold shadow-sm"
            style={{
              background: goalSaved
                ? "#059669"
                : "linear-gradient(135deg, #d97706, #ea580c)",
              color: "white",
              border: "none",
            }}
            data-ocid="analytics.goal.save_button"
          >
            {updateGoal.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : goalSaved ? (
              "✓ Saved!"
            ) : (
              "Set Goal"
            )}
          </Button>
        </div>

        {goalDollars > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs font-medium mb-2">
              <span className="text-amber-700">
                ${formatCurrency(stats.thisMonthEarned)} earned
              </span>
              <span className="text-amber-600 font-bold">{goalPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-amber-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${goalPct}%`,
                  background:
                    "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #ea580c 100%)",
                }}
              />
            </div>
            <p className="text-xs text-amber-700 font-medium">
              {goalMotivation} Goal: ${formatCurrency(goalDollars)}
            </p>
          </>
        ) : (
          <p className="text-xs text-amber-600 italic">
            Set a monthly earnings goal to track your progress.
          </p>
        )}
      </div>

      {/* ── Savings Tip Card ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5 flex gap-4"
        style={{
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          borderColor: "#fcd34d",
        }}
        data-ocid="analytics.savings-tip.card"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 mb-1">
            Smart Money Tip
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">{savingsTip}</p>
        </div>
      </div>

      {/* ── Weekly Earnings Chart ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-gray-200 p-5"
        style={{ background: "#ffffff" }}
        data-ocid="analytics.weekly-chart.section"
      >
        <h3
          className="text-sm font-bold mb-4 flex items-center gap-2"
          style={{ color: "#111827" }}
        >
          <BarChart3 size={15} className="text-primary" />
          Weekly Earnings — Last 8 Weeks
        </h3>
        {stats.weekChartData.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "#6b7280" }}>
            No paid bookings yet — your chart will appear here once invoices are
            paid.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={stats.weekChartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${formatCurrency(value)}`,
                  "Earned",
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #d97706",
                  fontSize: "12px",
                  background: "#ffffff",
                  color: "#111827",
                }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                itemStyle={{ color: "#d97706" }}
              />
              <Bar dataKey="earned" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top Services by Revenue ──────────────────────────────────────────── */}
      {stats.topServices.length > 0 && (
        <div
          className="bg-card rounded-2xl border border-border p-5"
          data-ocid="analytics.top-services.section"
        >
          <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-primary" />
            Top Services by Revenue
          </h3>
          <div className="space-y-3">
            {stats.topServices.map(([svc, rev]) => {
              const maxRev = stats.topServices[0][1] || 1;
              const pct = Math.round((rev / maxRev) * 100);
              return (
                <div key={svc}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground truncate max-w-[160px]">
                      {svc}
                    </span>
                    <span className="text-muted-foreground shrink-0 font-semibold">
                      ${formatCurrency(rev)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Monthly Breakdown Table ──────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="analytics.monthly-breakdown.table"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BarChart3 size={14} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Monthly Breakdown
          </h3>
        </div>
        {stats.monthRows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No bookings yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Month
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Bookings
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Earned
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Pending
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.monthRows.map(([key, row], idx) => {
                  const nextRow = stats.monthRows[idx + 1];
                  const prevEarned = nextRow ? nextRow[1].earned : null;
                  const growth =
                    prevEarned !== null && prevEarned > 0
                      ? ((row.earned - prevEarned) / prevEarned) * 100
                      : null;
                  return (
                    <tr
                      key={key}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        {getMonthLabel(key)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {row.bookings}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">
                        ${formatCurrency(row.earned)}
                      </td>
                      <td className="px-5 py-3 text-right text-amber-600">
                        ${formatCurrency(row.pending)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {growth !== null ? (
                          <span
                            className={`text-xs font-bold ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {growth >= 0 ? "↑" : "↓"}{" "}
                            {Math.abs(growth).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — Service Performance
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="analytics.service-performance.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          }}
        >
          <BarChart2 size={15} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-900">
            Your Services — What&apos;s Working
          </h3>
        </div>
        {stats.servicePerformance.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-5">
            Complete bookings to see service performance data here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Service
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Bookings
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Revenue
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Avg / Booking
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.servicePerformance.map((svc, idx) => {
                  const avgRev =
                    svc.bookings > 0 ? svc.revenue / svc.bookings : 0;
                  const isTop = idx === 0 && svc.revenue > 0;
                  return (
                    <tr
                      key={svc.name}
                      className={`transition-colors hover:bg-muted/20 ${isTop ? "bg-indigo-50/40" : ""}`}
                    >
                      <td className="px-5 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {isTop && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold shrink-0">
                              <Award size={10} />
                              Top
                            </span>
                          )}
                          {svc.name}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground font-medium">
                        {svc.bookings}
                      </td>
                      <td className="px-5 py-3 text-right text-indigo-700 font-semibold">
                        ${formatCurrency(svc.revenue)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        ${formatCurrency(avgRev)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — Client Retention
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        data-ocid="analytics.retention.section"
      >
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            borderColor: "#bbf7d0",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <Repeat2 size={18} className="text-white" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
            Repeat Clients
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {stats.repeatClients}
          </p>
          <p className="text-xs text-emerald-700 font-medium leading-relaxed">
            {stats.repeatClients > 0
              ? "Loyal clients are your best growth engine. Keep this up."
              : stats.totalUniqueClients > 0
                ? "Your first repeat client is just one great experience away."
                : "Start booking to track your client base here."}
          </p>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderColor: "#bfdbfe",
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Users size={18} className="text-white" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
            Retention Rate
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {stats.retentionRate}%
          </p>
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            {stats.retentionRate >= 60
              ? "Exceptional retention. Clients trust you deeply."
              : stats.retentionRate >= 40
                ? "Strong base. Personal follow-ups can push this higher."
                : stats.totalUniqueClients > 0
                  ? "Every returning client saves you acquisition effort. Nurture your relationships."
                  : `${stats.totalUniqueClients} unique client${stats.totalUniqueClients !== 1 ? "s" : ""} tracked so far.`}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3 — Peak Days & Times Heatmap
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl border border-gray-200 p-5"
        style={{ background: "#ffffff" }}
        data-ocid="analytics.peak-times.section"
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: "#111827" }}
          >
            <Clock size={15} className="text-primary" />
            When Clients Need You Most
          </h3>
          {stats.totalActiveBookings > 0 && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
              Peak: {stats.peakDayName} {stats.peakPeriodName}
            </span>
          )}
        </div>
        {stats.totalActiveBookings === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Your peak demand patterns will appear here as bookings come in.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5 mb-1.5">
              <div className="text-xs text-muted-foreground font-medium" />
              {stats.PERIOD_LABELS.map((p) => (
                <div
                  key={p}
                  className="text-center text-xs font-semibold text-muted-foreground"
                >
                  {p}
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {stats.DAY_LABELS.map((day, di) => (
                <div
                  key={day}
                  className="grid grid-cols-4 gap-1.5 items-center"
                >
                  <span className="text-xs font-semibold text-muted-foreground w-8">
                    {day}
                  </span>
                  {stats.heatmap[di].map((count, pi) => {
                    const intensity =
                      stats.maxDayTotal > 0 ? count / stats.maxDayTotal : 0;
                    const isHot = intensity >= 0.7;
                    const isMed = intensity >= 0.35;
                    return (
                      <div
                        key={pi}
                        title={`${day} ${stats.PERIOD_LABELS[pi]}: ${count} booking${count !== 1 ? "s" : ""}`}
                        className="h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                          background:
                            count === 0
                              ? "oklch(var(--muted))"
                              : isHot
                                ? "linear-gradient(135deg, #4338ca, #6366f1)"
                                : isMed
                                  ? "linear-gradient(135deg, #818cf8, #a5b4fc)"
                                  : "linear-gradient(135deg, #c7d2fe, #ddd6fe)",
                          color: isHot
                            ? "white"
                            : isMed
                              ? "#3730a3"
                              : "#6366f1",
                        }}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">
                Demand:
              </span>
              {[
                {
                  label: "Low",
                  bg: "linear-gradient(135deg, #c7d2fe, #ddd6fe)",
                },
                {
                  label: "Medium",
                  bg: "linear-gradient(135deg, #818cf8, #a5b4fc)",
                },
                {
                  label: "High",
                  bg: "linear-gradient(135deg, #4338ca, #6366f1)",
                },
              ].map(({ label, bg }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-5 h-4 rounded" style={{ background: bg }} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              You&apos;re most in-demand on{" "}
              <strong className="text-foreground">{stats.peakDayName}</strong>.
              Make sure your{" "}
              <strong className="text-foreground">
                {stats.peakPeriodName.toLowerCase()}
              </strong>{" "}
              availability is fully open to capture every opportunity.
            </p>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4 — Goal-Achieved Celebration Banner
          ═══════════════════════════════════════════════════════════════════════ */}
      {goalDollars > 0 && stats.thisMonthEarned >= goalDollars && (
        <div
          className="rounded-2xl p-5 border flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            borderColor: "#6ee7b7",
          }}
          data-ocid="analytics.goal-achieved.banner"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md shrink-0">
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-sm">
              Monthly goal reached — outstanding work.
            </p>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              You&apos;ve hit your ${formatCurrency(goalDollars)} target this
              month. Consider raising the bar — you&apos;re ready for it.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5 — Quick Wins (data-driven coaching tips)
          ═══════════════════════════════════════════════════════════════════════ */}
      {stats.totalActiveBookings > 0 &&
        (() => {
          const tips: Array<{
            icon: ReactNode;
            title: string;
            body: string;
          }> = [];

          if (stats.retentionRate < 40 && stats.totalUniqueClients >= 3) {
            tips.push({
              icon: <Repeat2 size={16} className="text-indigo-600" />,
              title: "Strengthen client loyalty",
              body: "A personal follow-up after each booking can convert one-time clients into regulars. Returning clients book faster and refer friends — your most efficient source of growth.",
            });
          }

          if (stats.completedCount > 0 && stats.completedCount < 5) {
            tips.push({
              icon: <MessageSquare size={16} className="text-amber-600" />,
              title: "Ask for a review",
              body: `Sitters with 5+ reviews receive significantly more inquiries. You have ${stats.completedCount} completed booking${stats.completedCount !== 1 ? "s" : ""} — a quick ask after your next session goes a long way.`,
            });
          }

          if (
            stats.peakPeriodName === "Morning" &&
            stats.totalActiveBookings >= 3
          ) {
            tips.push({
              icon: <Clock size={16} className="text-emerald-600" />,
              title: "Morning is your prime time",
              body: "Your clients most often need you in the morning. Make sure your availability is fully open before noon to win every booking opportunity.",
            });
          }

          if (stats.servicePerformance.length > 1) {
            const top = stats.servicePerformance[0];
            const topShare =
              stats.totalEarned > 0
                ? Math.round((top.revenue / stats.totalEarned) * 100)
                : 0;
            if (topShare >= 60) {
              tips.push({
                icon: <Zap size={16} className="text-violet-600" />,
                title: `Double down on ${top.name}`,
                body: `${top.name} drives ${topShare}% of your revenue. Promote it in your profile bio and ensure your schedule stays open for this service.`,
              });
            }
          }

          if (tips.length === 0) {
            tips.push({
              icon: <CheckCircle size={16} className="text-emerald-600" />,
              title: "You are on track",
              body: "Your numbers are looking healthy. Keep your availability current and respond to new bookings promptly — consistency is the best growth strategy.",
            });
          }

          return (
            <div
              className="rounded-2xl border border-border p-5"
              style={{
                background: "linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%)",
              }}
              data-ocid="analytics.quick-wins.section"
            >
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <Lightbulb size={15} className="text-amber-500" />
                Coaching Insights — Your Next Growth Move
              </h3>
              <div className="space-y-3">
                {tips.slice(0, 3).map((tip) => (
                  <div
                    key={tip.title}
                    className="flex gap-3 p-4 rounded-xl bg-card border border-border/60 hover:border-border transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                      {tip.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">
                        {tip.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {tip.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6 — Discount & Pricing Patterns
          ═══════════════════════════════════════════════════════════════════════ */}
      {(() => {
        type PR = {
          bookingId: bigint;
          discountPercent?: bigint;
          discountAmount?: bigint;
          originalAmount?: bigint;
          totalAmount: bigint;
          confirmedAt?: bigint;
        };
        const allPayments = payments as PR[];
        const discountedPayments = allPayments.filter(
          (p) => p.discountPercent != null && Number(p.discountPercent) > 0,
        );
        const totalDiscountsGiven = discountedPayments.length;
        const totalDiscountAmount = discountedPayments.reduce(
          (sum, p) =>
            sum + (p.discountAmount != null ? Number(p.discountAmount) : 0),
          0,
        );
        const avgDiscountPercent =
          discountedPayments.length > 0
            ? discountedPayments.reduce(
                (sum, p) =>
                  sum +
                  (p.discountPercent != null ? Number(p.discountPercent) : 0),
                0,
              ) / discountedPayments.length
            : 0;

        // Build monthly discount chart data (last 6 months)
        const now = new Date();
        const monthLabels: string[] = [];
        const monthKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthKeys.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          );
          monthLabels.push(
            d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
          );
        }
        const discountByMonth: Record<string, number> = {};
        for (const key of monthKeys) discountByMonth[key] = 0;
        for (const p of discountedPayments) {
          if (p.confirmedAt != null) {
            const mk = getMonthKey(p.confirmedAt);
            if (mk in discountByMonth) {
              discountByMonth[mk] +=
                p.discountAmount != null ? Number(p.discountAmount) / 100 : 0;
            }
          }
        }
        const discountChartData = monthKeys.map((key, i) => ({
          month: monthLabels[i],
          discount: Math.round((discountByMonth[key] ?? 0) * 100) / 100,
        }));

        // Price adjustment history (payments where originalAmount was set)
        const priceChanges = allPayments
          .filter((p) => p.originalAmount != null)
          .sort((a, b) => {
            const ta = a.confirmedAt != null ? Number(a.confirmedAt) : 0;
            const tb = b.confirmedAt != null ? Number(b.confirmedAt) : 0;
            return tb - ta;
          })
          .slice(0, 10)
          .map((p, idx) => {
            const orig = Number(p.originalAmount ?? p.totalAmount);
            const final = Number(p.totalAmount);
            const disc =
              p.discountPercent != null ? Number(p.discountPercent) : null;
            const dateStr =
              p.confirmedAt != null
                ? new Date(
                    Number(p.confirmedAt) / 1_000_000,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";
            return { bookingId: p.bookingId, orig, final, disc, dateStr, idx };
          });

        return (
          <div
            className="bg-card rounded-2xl border border-border overflow-hidden"
            data-ocid="analytics.discount-pricing.section"
          >
            <div
              className="px-5 py-4 border-b border-border flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              }}
            >
              <Tag size={15} className="text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                Discount &amp; Pricing Patterns
              </h3>
            </div>
            <div className="p-5 space-y-5">
              {/* 3 stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="rounded-xl p-3 border text-center"
                  style={{
                    background: "linear-gradient(135deg, #fffbeb, #fef9c3)",
                    borderColor: "#fde68a",
                  }}
                  data-ocid="analytics.discounts-given.card"
                >
                  <p className="text-2xl font-extrabold text-amber-700">
                    {totalDiscountsGiven}
                  </p>
                  <p className="text-xs font-medium text-amber-600 mt-0.5">
                    Discounts Given
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 border text-center"
                  style={{
                    background: "linear-gradient(135deg, #fef3c7, #fde68a33)",
                    borderColor: "#fcd34d",
                  }}
                  data-ocid="analytics.total-discounted.card"
                >
                  <p className="text-2xl font-extrabold text-amber-700">
                    ${formatCurrency(totalDiscountAmount / 100)}
                  </p>
                  <p className="text-xs font-medium text-amber-600 mt-0.5">
                    Total Discounted
                  </p>
                </div>
                <div
                  className="rounded-xl p-3 border text-center"
                  style={{
                    background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                    borderColor: "#fde68a",
                  }}
                  data-ocid="analytics.avg-discount.card"
                >
                  <p className="text-2xl font-extrabold text-amber-700">
                    {avgDiscountPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs font-medium text-amber-600 mt-0.5">
                    Avg Discount
                  </p>
                </div>
              </div>

              {/* Monthly discount trend chart */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Percent size={12} className="text-amber-500" />
                  Monthly Discount Trends
                </p>
                {totalDiscountsGiven === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No discounts applied yet. Your discount patterns will appear
                    here once you start applying them.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={discountChartData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${v}`}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${formatCurrency(value)}`,
                          "Discounted",
                        ]}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="discount"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Price changes table */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-rose-400" />
                  Price Changes Over Time
                </p>
                {priceChanges.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No price adjustments recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide">
                            Date
                          </th>
                          <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                            Original
                          </th>
                          <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                            Final
                          </th>
                          <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                            Discount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {priceChanges.map((pc) => (
                          <tr
                            key={`${pc.bookingId}-${pc.idx}`}
                            className="hover:bg-muted/20 transition-colors"
                            data-ocid={`analytics.price-change.item.${pc.idx + 1}`}
                          >
                            <td className="px-3 py-2.5 text-foreground font-medium">
                              {pc.dateStr}
                            </td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground line-through">
                              ${formatCurrency(pc.orig / 100)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">
                              ${formatCurrency(pc.final / 100)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {pc.disc != null ? (
                                <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                  <Tag size={9} />
                                  {pc.disc}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  adj.
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 7 — Tax & Earnings Summary
          ═══════════════════════════════════════════════════════════════════════ */}
      {(() => {
        const now = new Date();
        const currentYear = now.getFullYear();

        // YTD: sum all paid payments in current year
        type PR2 = { bookingId: bigint; status: string; totalAmount: bigint };
        const paymentsTyped = payments as PR2[];
        const paymentByBookingId = new Map<string, PR2>();
        for (const p of paymentsTyped)
          paymentByBookingId.set(p.bookingId.toString(), p);

        let ytdCents = 0;
        const quarterCents: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

        for (const b of bookings) {
          const d = new Date(Number((b.startDate as bigint) / 1_000_000n));
          if (d.getFullYear() !== currentYear) continue;
          const pm = paymentByBookingId.get((b.id as bigint).toString());
          if (pm?.status !== "paid") continue;
          const amt = Number(pm.totalAmount);
          ytdCents += amt;
          const q = Math.ceil((d.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
          quarterCents[q] += amt;
        }

        const ytdDollars = ytdCents / 100;
        const dayOfYear =
          Math.floor(
            (now.getTime() - new Date(currentYear, 0, 1).getTime()) /
              86_400_000,
          ) + 1;
        const daysInYear = currentYear % 4 === 0 ? 366 : 365;
        const projectedAnnual =
          dayOfYear > 0 ? (ytdDollars / dayOfYear) * daysInYear : 0;

        return (
          <div
            className="bg-card rounded-2xl border border-border overflow-hidden"
            data-ocid="analytics.tax-summary.section"
          >
            <div
              className="px-5 py-4 border-b border-border flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              }}
            >
              <CreditCard size={15} className="text-blue-600" />
              <h3 className="text-sm font-bold text-blue-900">
                Tax &amp; Earnings Summary — {currentYear}
              </h3>
            </div>
            <div className="p-5 space-y-5">
              {/* YTD + projected row */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                    borderColor: "#bfdbfe",
                  }}
                  data-ocid="analytics.ytd.card"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                    YTD Earned
                  </p>
                  <p className="text-2xl font-extrabold text-blue-800">
                    ${formatCurrency(ytdDollars)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Jan–Dec {currentYear}
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    borderColor: "#bbf7d0",
                  }}
                  data-ocid="analytics.projected-annual.card"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                    Projected Annual
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-800">
                    ${formatCurrency(projectedAnnual)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    At your current pace
                  </p>
                </div>
              </div>

              {/* Quarterly breakdown */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  Quarterly Breakdown
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as const).map((q) => {
                    const qDollars = quarterCents[q] / 100;
                    const isPast = q <= Math.ceil((now.getMonth() + 1) / 3);
                    return (
                      <div
                        key={q}
                        className="rounded-xl p-3 border text-center"
                        style={{
                          background:
                            isPast && qDollars > 0
                              ? "linear-gradient(135deg, #eff6ff, #dbeafe)"
                              : "oklch(var(--muted) / 0.4)",
                          borderColor:
                            isPast && qDollars > 0
                              ? "#bfdbfe"
                              : "oklch(var(--border))",
                        }}
                        data-ocid={`analytics.q${q}.card`}
                      >
                        <p className="text-xs font-bold text-muted-foreground mb-1">
                          Q{q}
                        </p>
                        <p
                          className={`text-base font-extrabold ${isPast && qDollars > 0 ? "text-blue-700" : "text-muted-foreground"}`}
                        >
                          ${formatCurrency(qDollars)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tax tip */}
              <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                  <Lightbulb size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-0.5">
                    Tax Planning Tip
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Set aside 25–30% of every payment for self-employment taxes.
                    Quarterly estimated payments are due in April, June,
                    September, and January.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8 — Tip History
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="analytics.tips.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Gift size={15} className="text-purple-600" />
            <h3 className="text-sm font-bold text-purple-900">Tip History</h3>
          </div>
          {tips.length > 0 && (
            <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">
              Total: $
              {formatCurrency(
                tips.reduce((s, t) => s + Number(t.amountCents) / 100, 0),
              )}
            </span>
          )}
        </div>
        <div className="p-5">
          {tips.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="analytics.tips.empty_state"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Gift size={20} className="text-purple-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No tips received yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Exceptional service gets noticed — tips will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tips
                .sort((a, b) => Number(b.createdAt - a.createdAt))
                .map((tip, i) => {
                  const d = new Date(Number(tip.createdAt) / 1_000_000);
                  return (
                    <div
                      key={`${tip.bookingId}-${i}`}
                      data-ocid={`analytics.tips.item.${i + 1}`}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-50/60 border border-purple-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                          <Gift size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {tip.clientName ??
                              `Booking #${tip.bookingId.toString().slice(-4)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-purple-700">
                        +${formatCurrency(Number(tip.amountCents) / 100)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 9 — Review Management
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="analytics.reviews.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Star size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-amber-900">
              Reviews Received
            </h3>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
                {(
                  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                ).toFixed(1)}{" "}
                avg
              </span>
              <span className="text-xs text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <div className="p-5">
          {reviews.length === 0 ? (
            <div
              className="text-center py-8"
              data-ocid="analytics.reviews.empty_state"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <Star size={20} className="text-amber-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No reviews yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-[240px] mx-auto">
                After each completed booking, kindly ask your client to leave a
                review — it builds trust and attracts new bookings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews
                .sort((a, b) => Number(b.createdAt - a.createdAt))
                .map((review, i) => {
                  const d = new Date(Number(review.createdAt) / 1_000_000);
                  return (
                    <div
                      key={`${review.bookingId}-${i}`}
                      data-ocid={`analytics.reviews.item.${i + 1}`}
                      className="rounded-xl border border-border/60 p-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                              key={si}
                              size={13}
                              className={
                                si < review.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted-foreground/30"
                              }
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            {review.rating}/5
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {review.reviewText ? (
                        <p className="text-sm text-foreground leading-relaxed">
                          &ldquo;{review.reviewText}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No written review
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 10 — Recurring vs One-time mini-stat
          ═══════════════════════════════════════════════════════════════════════ */}
      {(() => {
        const recurringCount = (bookings as { isRecurring?: boolean }[]).filter(
          (b) => b.isRecurring,
        ).length;
        const singleCount = bookings.length - recurringCount;
        if (bookings.length === 0) return null;
        return (
          <div
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4"
            data-ocid="analytics.recurring-vs-single.section"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Repeat2 size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">
                Recurring vs One-time
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-2xl font-extrabold text-amber-700">
                    {recurringCount}
                  </span>
                  <span className="text-xs text-amber-600 font-medium ml-1">
                    recurring
                  </span>
                </div>
                <div className="text-muted-foreground">·</div>
                <div>
                  <span className="text-2xl font-extrabold text-foreground">
                    {singleCount}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium ml-1">
                    one-time
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Coach Tab ──────────────────────────────────────────────────────────────────

interface CoachTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoices?: any[];
  sitterId: bigint | null;
  sitterName: string;
}

const LS_BOOKING_GOAL = "pawspect_booking_goal";
const LS_CLIENT_GOAL = "pawspect_client_goal";
const LS_SAVINGS_NAME = "pawspect_savings_name";
const LS_SAVINGS_TARGET = "pawspect_savings_target";

function GoalCard({
  icon,
  label,
  current,
  goal,
  onSave,
  accentColor,
  ocid,
}: {
  icon: ReactNode;
  label: string;
  current: number;
  goal: number;
  onSave: (val: number) => void;
  accentColor: "indigo" | "amber";
  ocid: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal || ""));
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const isAbove50 = pct >= 50;
  const barColor =
    accentColor === "amber"
      ? isAbove50
        ? "linear-gradient(90deg,#f59e0b,#d97706)"
        : "linear-gradient(90deg,#fbbf24,#f59e0b)"
      : isAbove50
        ? "linear-gradient(90deg,#6366f1,#4f46e5)"
        : "linear-gradient(90deg,#818cf8,#6366f1)";

  const handleSave = () => {
    const v = Number.parseFloat(draft);
    if (!Number.isNaN(v) && v > 0) {
      onSave(v);
      setEditing(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${accentColor === "amber" ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200" : "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200"}`}
      data-ocid={ocid}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${accentColor === "amber" ? "bg-amber-500" : "bg-indigo-600"}`}
        >
          {icon}
        </div>
        <button
          type="button"
          aria-label={editing ? "Save goal" : "Edit goal"}
          onClick={() => (editing ? handleSave() : setEditing(true))}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${accentColor === "amber" ? "bg-amber-100 hover:bg-amber-200 text-amber-700" : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"}`}
          data-ocid={`${ocid}.edit_button`}
        >
          {editing ? <Check size={13} /> : <Pencil size={12} />}
        </button>
      </div>
      <p
        className={`text-xs font-bold uppercase tracking-widest mb-1 ${accentColor === "amber" ? "text-amber-600" : "text-indigo-500"}`}
      >
        {label}
      </p>
      {editing ? (
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className={`h-8 text-sm rounded-lg flex-1 ${accentColor === "amber" ? "border-amber-300 focus-visible:ring-amber-400" : "border-indigo-300 focus-visible:ring-indigo-400"}`}
            placeholder="Set target"
            data-ocid={`${ocid}.input`}
          />
          <Button
            size="sm"
            onClick={handleSave}
            className={`h-8 px-3 rounded-full text-xs font-semibold ${accentColor === "amber" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            data-ocid={`${ocid}.save_button`}
          >
            Save
          </Button>
        </div>
      ) : (
        <>
          <p
            className={`text-2xl font-extrabold tracking-tight mt-1 ${accentColor === "amber" ? "text-amber-800" : "text-indigo-800"}`}
          >
            {current}{" "}
            <span
              className={`text-sm font-medium ${accentColor === "amber" ? "text-amber-500" : "text-indigo-400"}`}
            >
              / {goal > 0 ? goal : "—"} goal
            </span>
          </p>
          {goal > 0 && (
            <>
              <div
                className={`h-2 rounded-full mt-3 mb-1 overflow-hidden ${accentColor === "amber" ? "bg-amber-100" : "bg-indigo-100"}`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
              <p
                className={`text-xs font-semibold ${accentColor === "amber" ? "text-amber-600" : "text-indigo-500"}`}
              >
                {pct}%{" "}
                {pct >= 100
                  ? "— Goal crushed!"
                  : pct >= 75
                    ? "— Almost there!"
                    : pct >= 50
                      ? "— Great pace!"
                      : "— Keep pushing"}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}

function CoachTab({
  bookings,
  payments,
  invoices = [],
  sitterId,
  sitterName,
}: CoachTabProps) {
  const { data: privateData, isLoading: privateDataLoading } =
    useGetSitterPrivateData(sitterId);
  const updateGoal = useUpdateSitterEarningsGoal();

  const storedGoalCents = privateData?.earningsGoal ?? 0;
  const [earningsGoal, setEarningsGoal] = useState(0);
  useEffect(() => {
    if (storedGoalCents > 0) setEarningsGoal(Math.round(storedGoalCents / 100));
  }, [storedGoalCents]);

  const [bookingGoal, setBookingGoal] = useState<number>(
    () => Number(localStorage.getItem(LS_BOOKING_GOAL) ?? "0") || 0,
  );
  const [clientGoal, setClientGoal] = useState<number>(
    () => Number(localStorage.getItem(LS_CLIENT_GOAL) ?? "0") || 0,
  );
  const [savingsName, setSavingsName] = useState(
    () => localStorage.getItem(LS_SAVINGS_NAME) ?? "",
  );
  const [savingsTarget, setSavingsTarget] = useState<number>(
    () => Number(localStorage.getItem(LS_SAVINGS_TARGET) ?? "0") || 0,
  );
  const [editingSavings, setEditingSavings] = useState(false);
  const [savingsDraftName, setSavingsDraftName] = useState("");
  const [savingsDraftTarget, setSavingsDraftTarget] = useState("");

  const saveBookingGoal = (v: number) => {
    setBookingGoal(v);
    localStorage.setItem(LS_BOOKING_GOAL, String(v));
  };
  const saveClientGoal = (v: number) => {
    setClientGoal(v);
    localStorage.setItem(LS_CLIENT_GOAL, String(v));
  };
  const saveSavingsPot = () => {
    const t = Number.parseFloat(savingsDraftTarget);
    if (!Number.isNaN(t) && t > 0) {
      setSavingsTarget(t);
      localStorage.setItem(LS_SAVINGS_TARGET, String(t));
    }
    if (savingsDraftName) {
      setSavingsName(savingsDraftName);
      localStorage.setItem(LS_SAVINGS_NAME, savingsDraftName);
    }
    setEditingSavings(false);
  };
  const handleSaveEarningsGoal = async (v: number) => {
    if (!sitterId) return;
    setEarningsGoal(v);
    try {
      await updateGoal.mutateAsync({
        sitterId,
        goal: BigInt(Math.round(v * 100)),
      });
    } catch {
      /* swallow */
    }
  };

  // isCoachReady gates coach content rendering. All hooks are called unconditionally.
  const _isCoachReady = !!sitterId && !privateDataLoading;

  const stats = useMemo(() => {
    type PR = { bookingId: bigint; status: string; totalAmount: bigint };
    const pmByBooking = new Map<string, PR>();
    for (const p of payments as PR[])
      pmByBooking.set(p.bookingId.toString(), p);
    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let totalEarned = 0;
    let completedCount = 0;
    let thisMonthBookings = 0;
    let thisMonthEarned = 0;
    const serviceCounts: Record<string, number> = {};
    const serviceRevenue: Record<string, number> = {};
    const clientSet = new Set<string>();
    const thisMonthClientSet = new Set<string>();
    const dowCounts: Record<number, number> = {};
    const last30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    let newClients30 = 0;
    const seen30 = new Set<string>();
    const cbCount: Record<string, number> = {};
    let singleSlotCount = 0;
    for (const b of bookings) {
      const st = (b?.status as string) ?? "";
      const pm = pmByBooking.get(b?.id?.toString?.() ?? "");
      const isPaid = pm?.status === "paid";
      const amt = pm ? Number(pm.totalAmount ?? 0) / 100 : 0;
      if (!b?.startDate) continue;
      const bDate = new Date(Number(BigInt(b.startDate ?? 0) / 1_000_000n));
      const bmk = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}`;
      if (st === "completed") completedCount++;
      if (isPaid) totalEarned += amt;
      if (bmk === thisMonthKey) {
        thisMonthBookings++;
        if (isPaid) thisMonthEarned += amt;
        if (b.clientEmail) thisMonthClientSet.add(b.clientEmail);
      }
      if (b.clientEmail) {
        clientSet.add(b.clientEmail);
        cbCount[b.clientEmail] = (cbCount[b.clientEmail] ?? 0) + 1;
        if (bDate.getTime() >= last30) {
          if (!seen30.has(b.clientEmail)) newClients30++;
        } else seen30.add(b.clientEmail);
      }
      dowCounts[bDate.getDay()] = (dowCounts[bDate.getDay()] ?? 0) + 1;
      for (const svc of b.services ?? []) {
        serviceCounts[svc] = (serviceCounts[svc] ?? 0) + 1;
        if (isPaid)
          serviceRevenue[svc] =
            (serviceRevenue[svc] ?? 0) +
            amt / Math.max(1, (b.services ?? []).length);
      }
      if (
        b.endDate &&
        Number(BigInt(b.endDate ?? 0) / 1_000_000n) -
          Number(BigInt(b.startDate ?? 0) / 1_000_000n) <
          24 * 60 * 60 * 1000
      )
        singleSlotCount++;
    }
    const recurringClientCount = Object.values(cbCount).filter(
      (c) => c > 1,
    ).length;
    const totalBookings = bookings.length;
    const wknd = (dowCounts[0] ?? 0) + (dowCounts[6] ?? 0);
    const isWeekendHeavy = wknd > totalBookings - wknd && totalBookings >= 3;
    const topService = Object.entries(serviceRevenue).sort(
      ([, a], [, bv]) => bv - a,
    )[0];
    const topServiceByCount = Object.entries(serviceCounts).sort(
      ([, a], [, bv]) => bv - a,
    )[0];
    const meMap: Record<string, number> = {};
    for (const b of bookings) {
      const pm = pmByBooking.get(b?.id?.toString?.() ?? "");
      if (pm?.status === "paid" && b?.startDate) {
        const d = new Date(Number(BigInt(b.startDate ?? 0) / 1_000_000n));
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        meMap[mk] = (meMap[mk] ?? 0) + Number(pm.totalAmount) / 100;
      }
    }
    const mv = Object.values(meMap);
    const avgMonthlyEarned =
      mv.length > 0 ? mv.reduce((a, bv) => a + bv, 0) / mv.length : 0;
    return {
      totalEarned,
      completedCount,
      thisMonthBookings,
      thisMonthEarned,
      totalBookings,
      uniqueClients: clientSet.size,
      thisMonthClients: thisMonthClientSet.size,
      newClientsLast30: newClients30,
      isWeekendHeavy,
      topService,
      topServiceByCount,
      singleSlotCount,
      recurringClientCount,
      avgMonthlyEarned,
    };
  }, [bookings, payments]);

  // Count cancelled-within-24hr bookings that still have unpaid/unsent invoices
  const cancellationChargeCount = useMemo(() => {
    const safeInvoices = (invoices ?? []).filter(
      (inv) => inv?.bookingId != null,
    ) as { bookingId: bigint; status: string }[];
    const invoiceByBookingId = new Map<string, { status: string }>();
    for (const inv of safeInvoices) {
      invoiceByBookingId.set(inv.bookingId.toString(), inv);
    }
    return (
      bookings as {
        id: bigint;
        status: string;
        withinCancellationWindow?: boolean;
      }[]
    ).filter((b) => {
      if (b.status !== "cancelled" || !b.withinCancellationWindow) return false;
      const inv = invoiceByBookingId.get(b.id.toString());
      if (!inv) return true;
      return inv.status === "draft" || inv.status === "pending";
    }).length;
  }, [bookings, invoices]);

  const milestones = useMemo(() => {
    const hits: { icon: ReactNode; title: string; message: string }[] = [];
    if (stats.totalEarned >= 1000)
      hits.push({
        icon: <Trophy size={16} className="text-white" />,
        title: "$1,000 Earned",
        message: "Four figures in the books — you're building a real business.",
      });
    else if (stats.totalEarned >= 500)
      hits.push({
        icon: <Trophy size={16} className="text-white" />,
        title: "$500 Earned",
        message: "First big milestone. Keep the momentum going strong.",
      });
    if (stats.completedCount >= 10)
      hits.push({
        icon: <Star size={16} className="text-white" />,
        title: "10 Completed Bookings",
        message: "Double digits. You're a trusted name in pet care.",
      });
    else if (stats.completedCount >= 5)
      hits.push({
        icon: <Star size={16} className="text-white" />,
        title: "5 Completed Bookings",
        message: "Solid start — you're officially in the game.",
      });
    if (stats.uniqueClients >= 5)
      hits.push({
        icon: <Users size={16} className="text-white" />,
        title: "5 Happy Clients",
        message:
          "A loyal client base is the foundation of a thriving business.",
      });
    return hits;
  }, [stats]);

  const insights = useMemo(() => {
    const cards: {
      icon: ReactNode;
      headline: string;
      tip: string;
      color: string;
    }[] = [];
    if (stats.isWeekendHeavy)
      cards.push({
        icon: <Zap size={16} className="text-white" />,
        headline: "Weekend warrior — unlock more revenue",
        tip: "Most of your bookings land on weekends. Adding Friday availability could increase weekly income by 20–30% without extra marketing.",
        color: "amber",
      });
    if (stats.topService)
      cards.push({
        icon: <TrendingUp size={16} className="text-white" />,
        headline: `${stats.topService[0]} is your top earner`,
        tip: `Feature ${stats.topService[0]} first on your profile. Clients who book your strongest service tend to rebook more often.`,
        color: "indigo",
      });
    if (stats.newClientsLast30 === 0 && stats.totalBookings > 0)
      cards.push({
        icon: <Users size={16} className="text-white" />,
        headline: "Time to grow your client list",
        tip: "No new clients in the last 30 days. Top sitters share their profile link once a week — a single post can fill a whole week.",
        color: "violet",
      });
    if (stats.completedCount >= 3 && stats.recurringClientCount === 0)
      cards.push({
        icon: <RefreshCw size={16} className="text-white" />,
        headline: "Turn one-time clients into regulars",
        tip: "None of your clients have rebooked yet. After every completed service, ask if they'd like a regular schedule — recurring clients are 3x more profitable.",
        color: "emerald",
      });
    if (stats.totalBookings >= 5 && stats.completedCount < 5)
      cards.push({
        icon: <Award size={16} className="text-white" />,
        headline: `${5 - Math.min(5, stats.completedCount)} more reviews puts you in the top tier`,
        tip: "Profiles with 5+ reviews get 4x more views. After each booking, a quick message asking for a review goes a long way.",
        color: "indigo",
      });
    if (stats.avgMonthlyEarned > 0 && stats.avgMonthlyEarned < 500)
      cards.push({
        icon: <Target size={16} className="text-white" />,
        headline: `You're $${Math.round(500 - stats.avgMonthlyEarned)} away from $500/mo`,
        tip: "Adding one extra booking per week at your current rate would push you past the $500/month mark. Small steps, big results.",
        color: "amber",
      });
    if (cards.length === 0)
      cards.push({
        icon: <CheckCircle size={16} className="text-white" />,
        headline: "Strong start — stay consistent",
        tip: "Consistency is your biggest competitive advantage. Sitters who respond within an hour get 60% more bookings. Keep your availability up to date.",
        color: "emerald",
      });
    return cards.slice(0, 4);
  }, [stats]);

  const ssc = useMemo(() => {
    const stop: string[] = [];
    const start: string[] = [];
    const cont: string[] = [];
    if (
      stats.singleSlotCount > stats.totalBookings * 0.7 &&
      stats.totalBookings > 2
    )
      stop.push(
        "Leaving gaps between short bookings. Batching services back-to-back saves travel time and increases daily earnings.",
      );
    else
      stop.push(
        "Leaving your profile description vague. Specific bios (breed experience, home setup) convert 40% better than generic ones.",
      );
    if (stats.recurringClientCount === 0 && stats.completedCount >= 2)
      start.push(
        "Offering a recurring booking discount. A 5–10% loyalty rate turns one-time clients into a steady income stream.",
      );
    else
      start.push(
        "Asking for a review after every completed service. A simple message goes a long way — most clients are happy to help.",
      );
    if (!stats.isWeekendHeavy && stats.totalBookings > 0)
      start.push(
        "Promoting weekend availability. Weekend demand is consistently higher — even one extra Saturday slot adds up.",
      );
    if (stats.topServiceByCount)
      cont.push(
        `Leading with ${stats.topServiceByCount[0]}. It's your most-booked service — keep it front and center on your profile.`,
      );
    else
      cont.push(
        "Keeping your availability up to date. Sitters with accurate schedules get more first-time bookings.",
      );
    cont.push(
      "Quick confirmations — responding to bookings fast signals professionalism and builds client trust instantly.",
    );
    return { stop, start, cont };
  }, [stats]);

  const savingsMonthsToGoal =
    savingsTarget > 0 && stats.avgMonthlyEarned > 0
      ? Math.ceil(savingsTarget / (stats.avgMonthlyEarned * 0.25))
      : null;
  type AK = "amber" | "indigo" | "violet" | "emerald";
  const cmap: Record<
    AK,
    { bg: string; border: string; icon: string; text: string }
  > = {
    amber: {
      bg: "from-amber-50 to-yellow-50",
      border: "border-amber-200",
      icon: "bg-amber-500",
      text: "text-amber-800",
    },
    indigo: {
      bg: "from-indigo-50 to-violet-50",
      border: "border-indigo-200",
      icon: "bg-indigo-600",
      text: "text-indigo-800",
    },
    violet: {
      bg: "from-violet-50 to-purple-50",
      border: "border-violet-200",
      icon: "bg-violet-600",
      text: "text-violet-800",
    },
    emerald: {
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      icon: "bg-emerald-600",
      text: "text-emerald-800",
    },
  };

  return (
    <div className="space-y-8" data-ocid="coach.section">
      {/* Tagline - shows immediately; data-dependent sections stay safe via null guards */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">{sitterName}</h2>
            <p className="text-indigo-200 text-sm">
              Your personal pet care business advisor
            </p>
          </div>
        </div>
        <p className="text-white/80 text-sm leading-relaxed mt-3">
          Data-driven insights, goal tracking, and business coaching — built
          specifically for you. Your success is the mission.
        </p>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-3" data-ocid="coach.milestones.section">
          {milestones.map((m, i) => (
            <div
              key={m.title}
              className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-5 py-4"
              data-ocid={`coach.milestone.item.${i + 1}`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                {m.icon}
              </div>
              <div>
                <p className="font-bold text-amber-800 text-sm">{m.title}</p>
                <p className="text-amber-700 text-sm mt-0.5">{m.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals */}
      <section data-ocid="coach.goals.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Target size={16} className="text-primary" />
          Your Goals This Month
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GoalCard
            icon={<TrendingUp size={18} className="text-white" />}
            label="Monthly Income Goal"
            current={Math.round(stats.thisMonthEarned)}
            goal={earningsGoal}
            onSave={handleSaveEarningsGoal}
            accentColor="indigo"
            ocid="coach.income_goal"
          />
          <GoalCard
            icon={<Receipt size={18} className="text-white" />}
            label="Monthly Booking Target"
            current={stats.thisMonthBookings}
            goal={bookingGoal}
            onSave={saveBookingGoal}
            accentColor="amber"
            ocid="coach.booking_goal"
          />
          <GoalCard
            icon={<Users size={18} className="text-white" />}
            label="New Clients This Month"
            current={stats.thisMonthClients}
            goal={clientGoal}
            onSave={saveClientGoal}
            accentColor="indigo"
            ocid="coach.client_goal"
          />
        </div>
      </section>

      {/* Insights */}
      <section data-ocid="coach.insights.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          Insights for You
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insights.map((ins, i) => {
            const c = cmap[ins.color as AK] ?? cmap.indigo;
            return (
              <div
                key={ins.headline}
                className={`rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-5`}
                data-ocid={`coach.insight.item.${i + 1}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl ${c.icon} flex items-center justify-center mb-3`}
                >
                  {ins.icon}
                </div>
                <p className={`font-bold text-sm ${c.text} mb-1`}>
                  {ins.headline}
                </p>
                <p className={`text-sm leading-relaxed ${c.text} opacity-80`}>
                  {ins.tip}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Savings Pot */}
      <section data-ocid="coach.savings.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <PiggyBank size={16} className="text-emerald-600" />
          Savings Pot
        </h3>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5">
          {!editingSavings && savingsTarget > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <PiggyBank size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">
                      {savingsName || "Savings Goal"}
                    </p>
                    <p className="text-emerald-600 text-xs">
                      Target: ${savingsTarget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSavingsDraftName(savingsName);
                    setSavingsDraftTarget(String(savingsTarget));
                    setEditingSavings(true);
                  }}
                  className="w-7 h-7 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center"
                  aria-label="Edit savings goal"
                  data-ocid="coach.savings.edit_button"
                >
                  <Pencil size={12} />
                </button>
              </div>
              <div className="mt-4 h-3 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round(((stats.avgMonthlyEarned * 0.25) / savingsTarget) * 100 * (savingsMonthsToGoal ?? 12)))}%`,
                    background: "linear-gradient(90deg,#059669,#0d9488)",
                  }}
                />
              </div>
              <p className="text-sm text-emerald-700 font-medium mt-2">
                {savingsMonthsToGoal !== null
                  ? `Saving 25% of monthly avg: goal reached in ~${savingsMonthsToGoal} month${savingsMonthsToGoal !== 1 ? "s" : ""}`
                  : "Complete more bookings to see your savings projection."}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Avg monthly: $
                {Math.round(stats.avgMonthlyEarned).toLocaleString()} &mdash;
                25% saved = $
                {Math.round(stats.avgMonthlyEarned * 0.25).toLocaleString()}/mo
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <PiggyBank size={18} className="text-white" />
                </div>
                <p className="text-sm font-bold text-emerald-800">
                  {savingsTarget > 0
                    ? "Update your savings goal"
                    : "Set a savings goal and watch it grow"}
                </p>
              </div>
              <Input
                placeholder="Goal name (e.g. New Equipment, Vacation)"
                value={editingSavings ? savingsDraftName : savingsName}
                onChange={(e) =>
                  editingSavings
                    ? setSavingsDraftName(e.target.value)
                    : setSavingsName(e.target.value)
                }
                className="rounded-lg border-emerald-300 focus-visible:ring-emerald-400 text-sm"
                data-ocid="coach.savings.name_input"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-600">$</span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Target amount"
                  value={
                    editingSavings
                      ? savingsDraftTarget
                      : String(savingsTarget || "")
                  }
                  onChange={(e) =>
                    editingSavings
                      ? setSavingsDraftTarget(e.target.value)
                      : setSavingsTarget(Number(e.target.value))
                  }
                  className="rounded-lg border-emerald-300 focus-visible:ring-emerald-400 text-sm flex-1"
                  data-ocid="coach.savings.target_input"
                />
              </div>
              <Button
                size="sm"
                onClick={saveSavingsPot}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 font-semibold"
                data-ocid="coach.savings.save_button"
              >
                Save Goal
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stop / Start / Continue */}
      <section data-ocid="coach.stop-start-continue.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-indigo-500" />
          Stop / Start / Continue
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {" "}
          <div
            className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-5"
            data-ocid="coach.stop.card"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
                <Pause size={15} className="text-white" />
              </div>
              <p className="font-bold text-red-800 text-sm">Stop</p>
            </div>
            <ul className="space-y-3">
              {ssc.stop.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-700"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5"
            data-ocid="coach.start.card"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                <Play size={15} className="text-white" />
              </div>
              <p className="font-bold text-amber-800 text-sm">Start</p>
            </div>
            <ul className="space-y-3">
              {ssc.start.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-amber-700"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5"
            data-ocid="coach.continue.card"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                <CheckCircle size={15} className="text-white" />
              </div>
              <p className="font-bold text-emerald-800 text-sm">Continue</p>
            </div>
            <ul className="space-y-3">
              {ssc.cont.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-emerald-700"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Cancellation Invoice Follow-Up */}
      <section data-ocid="coach.cancellation-invoice.section">
        <div
          className={`rounded-2xl border p-5 ${
            cancellationChargeCount > 0
              ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300"
              : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
          }`}
          data-ocid="coach.cancellation-invoice.card"
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                cancellationChargeCount > 0 ? "bg-amber-500" : "bg-emerald-600"
              }`}
            >
              <Receipt size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {cancellationChargeCount > 0 ? (
                <>
                  <p className="font-bold text-amber-800 text-sm mb-1">
                    Follow up on cancellation invoice
                    {cancellationChargeCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm leading-relaxed text-amber-700">
                    When a client cancels within 24 hours, your cancellation
                    policy protects your time. A quick follow-up on the invoice
                    shows professionalism and helps you get paid for work you've
                    already prepared for. Pawspect makes it easy — your invoice
                    is already there.
                  </p>
                  <p className="text-xs font-semibold text-amber-600 mt-2">
                    {cancellationChargeCount} pending cancellation invoice
                    {cancellationChargeCount > 1 ? "s" : ""} to review
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-emerald-800 text-sm mb-1">
                    All cancellation invoices are in order
                  </p>
                  <p className="text-sm leading-relaxed text-emerald-700">
                    Great job staying on top of your business! All within-24hr
                    cancellations have been handled. Your professionalism keeps
                    your income protected.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Smart Growth Nudges */}
      {stats.totalBookings > 0 &&
        (() => {
          const nudges: {
            icon: ReactNode;
            title: string;
            body: string;
            color: string;
          }[] = [];

          // Completed bookings with no reviews
          if (stats.completedCount >= 3) {
            nudges.push({
              icon: <MessageSquare size={15} className="text-violet-600" />,
              title: "Ask for reviews — it changes everything",
              body: `You have ${stats.completedCount} completed bookings. Reach out to those clients and ask for a review. Profiles with 5+ reviews get significantly more inquiries.`,
              color: "violet",
            });
          }

          // Availability gap
          if (stats.thisMonthBookings < 4) {
            nudges.push({
              icon: <CalendarDays size={15} className="text-indigo-600" />,
              title: "More availability = more bookings",
              body: "Make sure your Availability tab is up to date and covers evenings and weekends — those slots fill first.",
              color: "indigo",
            });
          }

          // Beat last month goal
          if (stats.avgMonthlyEarned > 0) {
            nudges.push({
              icon: <TrendingUp size={15} className="text-emerald-600" />,
              title: `You've averaged $${Math.round(stats.avgMonthlyEarned).toLocaleString()}/month — let's beat it`,
              body: "Set a monthly goal above your average and commit to one extra booking per week. Small consistent actions compound fast.",
              color: "emerald",
            });
          }

          if (nudges.length === 0) return null;

          return (
            <section data-ocid="coach.smart-nudges.section">
              <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Smart Growth Nudges
              </h3>
              <div className="space-y-3">
                {nudges.slice(0, 3).map((nudge, i) => {
                  const nudgeColorMap: Record<
                    string,
                    { bg: string; border: string; text: string }
                  > = {
                    violet: {
                      bg: "from-violet-50 to-purple-50",
                      border: "border-violet-200",
                      text: "text-violet-800",
                    },
                    indigo: {
                      bg: "from-indigo-50 to-blue-50",
                      border: "border-indigo-200",
                      text: "text-indigo-800",
                    },
                    emerald: {
                      bg: "from-emerald-50 to-teal-50",
                      border: "border-emerald-200",
                      text: "text-emerald-800",
                    },
                    amber: {
                      bg: "from-amber-50 to-yellow-50",
                      border: "border-amber-200",
                      text: "text-amber-800",
                    },
                  };
                  const nc = nudgeColorMap[nudge.color] ?? nudgeColorMap.indigo;
                  return (
                    <div
                      key={nudge.title}
                      data-ocid={`coach.nudge.item.${i + 1}`}
                      className={`flex gap-4 rounded-2xl bg-gradient-to-br ${nc.bg} border ${nc.border} p-5`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-white/70 border ${nc.border} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {nudge.icon}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${nc.text} mb-0.5`}>
                          {nudge.title}
                        </p>
                        <p
                          className={`text-sm leading-relaxed ${nc.text} opacity-80`}
                        >
                          {nudge.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}
    </div>
  );
}

// ─── Public Page Settings (Profile tab section) ────────────────────────────

// ─── Professional Credentials Editor ─────────────────────────────────────────

const CREDENTIAL_ICON_MAP: Record<string, ReactNode> = {
  FileCheck: <Shield size={16} className="text-amber-500 shrink-0" />,
  ShieldCheck: <ShieldCheck size={16} className="text-amber-500 shrink-0" />,
  UserCheck: <CheckCircle size={16} className="text-amber-500 shrink-0" />,
  Users: <Users size={16} className="text-amber-500 shrink-0" />,
  ClipboardList: <Zap size={16} className="text-amber-500 shrink-0" />,
  Award: <Award size={16} className="text-amber-500 shrink-0" />,
  BadgeCheck: <Check size={16} className="text-amber-500 shrink-0" />,
};

function CredentialChecklistEditor({ sitterId }: { sitterId: bigint }) {
  const { data: savedCredentials, isLoading } =
    useGetSitterCredentials(sitterId);
  const updateCredentials = useUpdateCredentialChecklist();

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  // Per-credential public display toggle — key: `${item.key}_public`
  const [publicDisplay, setPublicDisplay] = useState<Record<string, boolean>>(
    {},
  );
  const [saving, setSaving] = useState(false);

  // Sync when remote data loads
  useEffect(() => {
    if (savedCredentials) {
      const map: Record<string, boolean> = {};
      const pubMap: Record<string, boolean> = {};
      for (const item of CREDENTIAL_ITEMS) {
        map[item.key] =
          (savedCredentials[item.key as keyof typeof savedCredentials] ??
            false) === true;
        // Public display stored as `${key}Public` on the credential object
        const pubKey = `${item.key}Public` as keyof typeof savedCredentials;
        pubMap[item.key] =
          savedCredentials[pubKey] !== undefined
            ? savedCredentials[pubKey] === true
            : map[item.key]; // default: show on public page if checked
      }
      setChecklist(map);
      setPublicDisplay(pubMap);
    }
  }, [savedCredentials]);

  const handleToggle = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePublicToggle = (key: string) => {
    setPublicDisplay((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const credentials = Object.fromEntries([
        ...CREDENTIAL_ITEMS.map((item) => [
          item.key,
          checklist[item.key] ?? false,
        ]),
        // Save per-credential public display as `${key}Public` boolean fields
        ...CREDENTIAL_ITEMS.map((item) => [
          `${item.key}Public`,
          publicDisplay[item.key] ?? false,
        ]),
      ]);
      await updateCredentials.mutateAsync({
        sitterId,
        credentials,
      });
      toast.success("Credentials saved!");
    } catch {
      toast.error("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div
      className="mt-6 rounded-2xl overflow-hidden border border-amber-300/40"
      data-ocid="profile.credentials.section"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.14 0.04 55 / 0.6), oklch(0.12 0.03 50 / 0.5))",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-amber-400/20 flex items-center gap-3"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.06 50 / 0.9), oklch(0.18 0.05 48 / 0.85))",
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
          <ShieldCheck size={17} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">
            Professional Credentials
          </p>
          <p className="text-xs text-amber-300/80 mt-0.5">
            {checkedCount > 0
              ? `${checkedCount} of ${CREDENTIAL_ITEMS.length} credentials marked`
              : "Self-reported — no verification by Pawspect"}
          </p>
        </div>
        {checkedCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
            <Check size={11} />
            {checkedCount} set
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Amber disclaimer */}
        <div
          className="flex gap-3 rounded-xl border border-amber-400/40 px-4 py-3"
          style={{ background: "oklch(0.75 0.18 75 / 0.08)" }}
          data-ocid="profile.credentials.disclaimer"
        >
          <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            <span className="font-semibold text-amber-200">
              These credentials are self-reported by the sitter.
            </span>{" "}
            Pawspect does not verify, certify, or endorse any claims made here.
            All credential verification is the responsibility of the client.
          </p>
        </div>

        {/* Credential rows */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-16 rounded-xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2" data-ocid="profile.credentials.list">
            {CREDENTIAL_ITEMS.map((item, idx) => {
              const isChecked = checklist[item.key] ?? false;
              const isPublic = publicDisplay[item.key] ?? false;
              return (
                <div
                  key={item.key}
                  className={`rounded-xl px-4 py-3 border transition-all ${
                    isChecked
                      ? "border-amber-400/50 bg-amber-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                  data-ocid={`profile.credentials.item.${idx + 1}`}
                >
                  {/* Attestation row */}
                  <label
                    htmlFor={`credential-${item.key}`}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      id={`credential-${item.key}`}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(item.key)}
                      className="mt-0.5 w-4 h-4 rounded accent-amber-500 shrink-0 cursor-pointer"
                      data-ocid={`profile.credentials.${item.key}.checkbox`}
                    />
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {CREDENTIAL_ICON_MAP[item.icon]}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold leading-tight ${
                            isChecked ? "text-amber-200" : "text-white/80"
                          }`}
                        >
                          {item.label}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Per-credential public display toggle — only shown when credential is checked */}
                  {isChecked && (
                    <label
                      htmlFor={`credential-public-${item.key}`}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-amber-400/20 cursor-pointer"
                    >
                      <span className="text-xs text-amber-300/70 flex items-center gap-1.5 min-w-0">
                        <Globe size={11} className="shrink-0" />
                        Show on public page
                      </span>
                      <input
                        id={`credential-public-${item.key}`}
                        type="checkbox"
                        checked={isPublic}
                        onChange={() => handlePublicToggle(item.key)}
                        className="w-5 h-5 rounded accent-amber-500 cursor-pointer shrink-0"
                        data-ocid={`profile.credentials.${item.key}.public.toggle`}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save button */}
        <Button
          data-ocid="profile.credentials.save_button"
          onClick={handleSave}
          disabled={saving || updateCredentials.isPending}
          className="w-full sm:w-auto rounded-full font-semibold h-11 px-6 min-h-[44px]"
          style={{
            background: "linear-gradient(135deg, #d97706, #b45309)",
            color: "white",
            border: "none",
          }}
        >
          {saving || updateCredentials.isPending ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} className="mr-2" />
              Save Credentials
            </>
          )}
        </Button>

        <p className="text-xs text-white/40 leading-relaxed">
          Checked credentials appear as amber badge pills on your sitter cards,
          booking profile, and public page. Clients are reminded these are
          self-reported and encouraged to verify independently.
        </p>
      </div>
    </div>
  );
}

interface PublicPageSettingsProps {
  sitterId: number;
  sitterHandle: string;
  sitterPrincipal: import("../backend.d").Public["owner"] | null;
  completedBookingCount: number;
}

function PublicPageSettings({
  sitterId,
  sitterHandle,
  sitterPrincipal,
}: PublicPageSettingsProps) {
  const { data: extData } = useSitterExtendedPublic(sitterId);
  const { data: dealOffers = [] } = useDealOffersBySitter(
    sitterPrincipal ?? null,
  );
  const updateV2 = useUpdateSitterProfileV2();
  const setPageComponents = useSetSitterPageComponents();

  // Local state for fields saved with the main profile save button
  const [responseTime, setResponseTime] = useState<string>(
    extData?.responseTime ?? "",
  );
  const [petTypesServed, setPetTypesServed] = useState<string[]>(
    extData?.petTypesServed ?? [],
  );
  const [certificationsList, setCertificationsList] = useState<string[]>(
    extData?.certificationsList ?? [],
  );
  const [acceptingNewClients, setAcceptingNewClients] = useState<boolean>(
    extData?.acceptingNewClients ?? true,
  );
  const [pinnedPromoOfferId, setPinnedPromoOfferId] = useState<string>(
    extData?.pinnedPromoOfferId ?? "",
  );
  const [bannerUrl, setBannerUrl] = useState<string>(extData?.bannerUrl ?? "");
  const [pageComponents, setPageComponentsState] =
    useState<PageComponentVisibility>(
      extData?.pageComponents ?? DEFAULT_PAGE_COMPONENTS,
    );

  // Sync when remote data loads
  useEffect(() => {
    if (!extData) return;
    setResponseTime(extData.responseTime ?? "");
    setPetTypesServed(extData.petTypesServed ?? []);
    setCertificationsList(extData.certificationsList ?? []);
    setAcceptingNewClients(extData.acceptingNewClients ?? true);
    setPinnedPromoOfferId(extData.pinnedPromoOfferId ?? "");
    setBannerUrl(extData.bannerUrl ?? "");
    setPageComponentsState(extData.pageComponents ?? DEFAULT_PAGE_COMPONENTS);
  }, [extData]);

  const handleGalleryChange = async (photos: string[]) => {
    try {
      await updateV2.mutateAsync({
        sitterId,
        update: { galleryPhotos: photos },
      });
    } catch {
      toast.error("Failed to save gallery photos");
    }
  };

  const handleToggleComponent = async (
    key: keyof PageComponentVisibility,
    value: boolean,
  ) => {
    const next = { ...pageComponents, [key]: value };
    setPageComponentsState(next);
    try {
      await setPageComponents.mutateAsync({ sitterId, components: next });
    } catch {
      toast.error("Failed to save page settings");
    }
  };

  // Expose save function so parent can call it when Save Profile is clicked
  // We use a DOM event bus — parent useEffect listens for "saveProfileV2"
  useEffect(() => {
    const handler = async () => {
      try {
        await updateV2.mutateAsync({
          sitterId,
          update: {
            responseTime: responseTime || undefined,
            petTypesServed: petTypesServed.length ? petTypesServed : undefined,
            certificationsList: certificationsList.length
              ? certificationsList
              : undefined,
            acceptingNewClients,
            pinnedPromoOfferId: pinnedPromoOfferId || undefined,
            bannerUrl: bannerUrl || undefined,
          },
        });
      } catch {
        /* silent — parent shows its own error */
      }
    };
    window.addEventListener("pawspect:saveProfileV2", handler);
    return () => window.removeEventListener("pawspect:saveProfileV2", handler);
  }, [
    sitterId,
    responseTime,
    petTypesServed,
    certificationsList,
    acceptingNewClients,
    pinnedPromoOfferId,
    bannerUrl,
    updateV2,
  ]);

  return (
    <div
      className="mt-6 rounded-2xl border border-indigo-200/60 overflow-hidden"
      data-ocid="profile.public_page_settings.panel"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.97 0.02 260), oklch(0.98 0.01 280))",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 sm:px-5 sm:py-4 border-b border-indigo-500/20 flex items-center justify-between gap-2"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.25 0.06 276) 0%, oklch(0.20 0.04 276) 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <PawPrint size={16} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Your Public Page Settings
            </p>
            <p className="text-xs text-indigo-300">
              Control what appears on your public sitter profile
            </p>
          </div>
        </div>
        <a
          href={`/#/sitter/${sitterHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid="profile.view_public_page.button"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0"
          aria-label="Preview Your Public Page"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Preview My Page</span>
        </a>
      </div>

      <div className="p-5 space-y-6">
        {/* 1 — Photo Gallery */}
        <div data-ocid="profile.gallery.section">
          <p className="text-sm font-bold text-foreground mb-0.5">
            Photo Gallery
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Add photos that appear in a carousel on your public page
          </p>
          <PhotoGalleryUpload
            galleryPhotos={extData?.galleryPhotos ?? []}
            onPhotosChange={handleGalleryChange}
            sitterId={sitterId}
          />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <Shield size={11} className="text-amber-500 shrink-0" />
            Photos require legal consent confirmation before upload (shown
            automatically)
          </p>
        </div>

        {/* 2 — Banner Image URL */}
        <div className="space-y-1.5" data-ocid="profile.banner_url.section">
          <div className="flex items-center gap-2">
            <Link2 size={14} className="text-amber-500 shrink-0" />
            <Label htmlFor="banner-url-input" className="text-sm font-bold">
              Banner Image URL
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Paste a URL to a high-quality landscape photo for your page header.
            Leave blank to use the premium Pawspect gradient.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="banner-url-input"
              type="url"
              placeholder="https://example.com/your-banner.jpg"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="font-mono text-sm flex-1 w-full"
              data-ocid="profile.banner_url.input"
            />
            <Button
              size="sm"
              type="button"
              data-ocid="profile.banner_url.save_button"
              disabled={updateV2.isPending}
              onClick={async () => {
                const url = bannerUrl.trim();
                if (
                  url &&
                  !url.startsWith("http://") &&
                  !url.startsWith("https://")
                ) {
                  toast.error(
                    "Please enter a valid image URL starting with https://",
                  );
                  return;
                }
                try {
                  await updateV2.mutateAsync({
                    sitterId,
                    update: { bannerUrl: url || undefined },
                  });
                  toast.success(
                    url ? "Banner image URL saved" : "Banner URL cleared",
                  );
                } catch {
                  toast.error("Failed to save banner URL. Please try again.");
                }
              }}
              className="w-full sm:w-auto sm:shrink-0 rounded-lg px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateV2.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {bannerUrl && !bannerUrl.startsWith("http") && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X size={11} />
              Please enter a valid image URL starting with https://
            </p>
          )}
          {bannerUrl?.startsWith("http") && (
            <div
              className="mt-2 rounded-xl overflow-hidden border border-border"
              style={{ height: "80px" }}
            >
              <img
                src={bannerUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* 3 — Response Time */}
        <div className="space-y-1.5" data-ocid="profile.response_time.section">
          <Label htmlFor="response-time-select" className="text-sm font-bold">
            Response Time
          </Label>
          <select
            id="response-time-select"
            data-ocid="profile.response_time.select"
            value={responseTime}
            onChange={(e) => setResponseTime(e.target.value)}
            className="w-full rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Not set</option>
            {RESPONSE_TIME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* 3 — Pet Types */}
        <div data-ocid="profile.pet_types.section">
          <p className="text-sm font-bold text-foreground mb-2">
            Pet Types You Work With
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PET_TYPE_OPTIONS.map((pt) => (
              <label
                key={pt}
                htmlFor={`pet-type-${pt}`}
                className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-colors"
              >
                <Checkbox
                  id={`pet-type-${pt}`}
                  checked={petTypesServed.includes(pt)}
                  onCheckedChange={(checked) =>
                    setPetTypesServed((prev) =>
                      checked ? [...prev, pt] : prev.filter((x) => x !== pt),
                    )
                  }
                  className="shrink-0"
                  data-ocid={`profile.pet_type.${pt.toLowerCase().replace(/\s+/g, "_")}.checkbox`}
                />
                <span className="text-sm leading-tight">{pt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4 — Certifications */}
        <div data-ocid="profile.certifications_list.section">
          <p className="text-sm font-bold text-foreground mb-2">
            Certifications &amp; Training
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CERTIFICATION_OPTIONS.map((cert) => (
              <label
                key={cert}
                htmlFor={`cert-${cert}`}
                className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-colors"
              >
                <Checkbox
                  id={`cert-${cert}`}
                  checked={certificationsList.includes(cert)}
                  onCheckedChange={(checked) =>
                    setCertificationsList((prev) =>
                      checked
                        ? [...prev, cert]
                        : prev.filter((x) => x !== cert),
                    )
                  }
                  className="shrink-0"
                  data-ocid={`profile.cert.${cert.toLowerCase().replace(/[\s&]+/g, "_")}.checkbox`}
                />
                <span className="text-sm leading-tight">{cert}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 5 — Accepting New Clients */}
        <div
          className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
          data-ocid="profile.accepting_clients.section"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              Currently Accepting New Clients
            </p>
            {!acceptingNewClients && (
              <p className="text-xs text-amber-600 mt-0.5">
                Your "Book Me" button will change to "Join Waitlist" on your
                public page
              </p>
            )}
          </div>
          <Switch
            checked={acceptingNewClients}
            onCheckedChange={setAcceptingNewClients}
            data-ocid="profile.accepting_clients.switch"
          />
        </div>

        {/* 6 — Pin Promo Offer */}
        <div className="space-y-1.5" data-ocid="profile.pinned_promo.section">
          <Label htmlFor="pinned-promo-select" className="text-sm font-bold">
            Pinned Promo Offer
          </Label>
          <select
            id="pinned-promo-select"
            data-ocid="profile.pinned_promo.select"
            value={pinnedPromoOfferId}
            onChange={(e) => setPinnedPromoOfferId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">No pinned offer</option>
            {(
              dealOffers as Array<{
                id?: string;
                description?: string;
                couponCode?: string;
                expirationDate?: bigint;
              }>
            ).map((offer, idx) => {
              const expDate = offer.expirationDate
                ? new Date(
                    Number(offer.expirationDate) / 1_000_000,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";
              return (
                <option key={offer.id ?? idx} value={offer.id ?? String(idx)}>
                  {offer.description ?? "Offer"} — {offer.couponCode ?? "CODE"}{" "}
                  (expires {expDate})
                </option>
              );
            })}
          </select>
        </div>

        {/* 7 — Site Builder */}
        <SiteBuilder
          sitterId={sitterId}
          publicPageUrl={`/#/sitter/${sitterHandle}`}
          initialVisibility={pageComponents}
          onVisibilityChange={async (key, value) => {
            await handleToggleComponent(key, value);
          }}
          isSavingVisibility={setPageComponents.isPending}
        />
      </div>
    </div>
  );
}

interface Props {
  navigate: (view: View) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  initialTab?: string;
}

function AccountPrivacyTab({ sitterId }: { sitterId: bigint | null }) {
  const requestExport = useRequestGdprExport();
  const requestAnonymize = useRequestAccountAnonymization();

  const [exportStatus, setExportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [anonymizeStatus, setAnonymizeStatus] = useState<
    "idle" | "loading" | "confirm" | "success" | "error"
  >("idle");
  const [showIncluded, setShowIncluded] = useState(false);

  const handleRequestExport = async () => {
    setExportStatus("loading");
    try {
      await requestExport.mutateAsync();
      setExportStatus("success");
    } catch {
      setExportStatus("error");
      toast.error("Failed to request data export. Please try again.");
    }
  };

  const handleRequestAnonymize = async () => {
    setAnonymizeStatus("loading");
    try {
      await requestAnonymize.mutateAsync();
      setAnonymizeStatus("success");
    } catch {
      setAnonymizeStatus("error");
      toast.error("Failed to request anonymization. Please try again.");
    }
  };

  const INCLUDED_ITEMS = [
    "Profile & bio",
    "All bookings (past & upcoming)",
    "All invoices & payment records",
    "Client & pet records",
    "Review history",
    "Account settings",
  ];

  return (
    <div
      className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6 space-y-6"
      data-ocid="sitter.account_privacy.panel"
    >
      <div>
        <h2 className="font-display text-xl font-bold mb-1 flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" />
          Account &amp; Privacy
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal data and exercise your privacy rights. Your data
          belongs to you.
        </p>
      </div>

      {/* GDPR info banner */}
      <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={15} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Your Data Rights
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under GDPR and applicable privacy law, you have the right to
              access a complete copy of your data and to request account
              anonymization. Admins cannot access your personal or financial
              data unless you open a support ticket granting temporary access —
              and every access event is audited. Use the tools below to exercise
              your rights.
            </p>
          </div>
        </div>
      </div>

      {/* Card 1 — Download My Data — Enhanced */}
      <div
        className="rounded-2xl border-2 border-primary/25 bg-card p-5 space-y-4 shadow-sm"
        style={{
          background:
            "linear-gradient(145deg, oklch(var(--card)), oklch(var(--primary) / 0.04))",
        }}
        data-ocid="sitter.gdpr_export.card"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Download size={22} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-foreground mb-0.5">
              Download My Data
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export a complete copy of all your data including your profile,
              bookings, invoices, client history, and reviews. Your data belongs
              to you — download it anytime.
            </p>
          </div>
        </div>

        {/* What's included expandable */}
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowIncluded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground">
              What&apos;s included?
            </span>
            <ChevronDown
              size={14}
              className="text-muted-foreground transition-transform duration-200"
              style={{
                transform: showIncluded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {showIncluded && (
            <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {INCLUDED_ITEMS.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <CheckCircle
                    size={12}
                    className="text-emerald-500 shrink-0"
                  />
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reassurance text */}
        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-3">
          <strong className="text-foreground">Your data is yours.</strong> We
          recommend exporting it periodically as a backup. Pawspect stores it
          securely, but we cannot guarantee against data loss — regular exports
          protect you.
        </p>

        {exportStatus === "success" ? (
          <div
            data-ocid="sitter.gdpr_export.success_state"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium flex items-center gap-2"
          >
            <CheckCircle size={15} className="shrink-0 text-emerald-600" />
            Check your email — your export link is on the way!
          </div>
        ) : exportStatus === "error" ? (
          <div
            data-ocid="sitter.gdpr_export.error_state"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
          >
            Failed to request export. Please try again.
          </div>
        ) : null}

        {exportStatus !== "success" && (
          <Button
            data-ocid="sitter.gdpr_export.submit_button"
            onClick={handleRequestExport}
            disabled={exportStatus === "loading" || !sitterId}
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
          >
            {exportStatus === "loading" ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Requesting…
              </>
            ) : (
              <>
                <Download size={14} className="mr-2" />
                Download My Data
              </>
            )}
          </Button>
        )}
      </div>

      {/* Card 2 — Anonymize My Account */}
      <div
        className="rounded-2xl border border-destructive/20 bg-card p-5 space-y-4 shadow-sm"
        data-ocid="sitter.gdpr_anonymize.card"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Anonymize My Account
            </h3>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Remove all personal information from your account permanently. Your
          name and contact details will be replaced with anonymized
          placeholders. Booking records are kept for audit and legal purposes.{" "}
          <strong className="text-destructive">
            This action cannot be undone.
          </strong>
        </p>

        {anonymizeStatus === "confirm" && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-3">
            <p className="text-xs text-red-700 font-semibold">
              Are you sure? This will permanently remove your personal data from
              the platform.
            </p>
            <div className="flex gap-2">
              <Button
                data-ocid="sitter.gdpr_anonymize.confirm_button"
                onClick={handleRequestAnonymize}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold h-9 text-sm"
              >
                Yes, Anonymize
              </Button>
              <Button
                data-ocid="sitter.gdpr_anonymize.cancel_button"
                variant="outline"
                onClick={() => setAnonymizeStatus("idle")}
                className="flex-1 rounded-full h-9 text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {anonymizeStatus === "success" ? (
          <div
            data-ocid="sitter.gdpr_anonymize.success_state"
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium flex items-center gap-2"
          >
            <CheckCircle size={15} className="shrink-0 text-emerald-600" />
            Check your email to confirm anonymization.
          </div>
        ) : anonymizeStatus === "error" ? (
          <div
            data-ocid="sitter.gdpr_anonymize.error_state"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
          >
            Failed to request anonymization. Please try again.
          </div>
        ) : null}

        {anonymizeStatus !== "success" &&
          anonymizeStatus !== "confirm" &&
          anonymizeStatus !== "loading" && (
            <Button
              data-ocid="sitter.gdpr_anonymize.open_modal_button"
              variant="outline"
              onClick={() => setAnonymizeStatus("confirm")}
              disabled={!sitterId}
              className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/5 font-semibold h-10"
            >
              <ShieldCheck size={14} className="mr-2" />
              Request Anonymization
            </Button>
          )}

        {anonymizeStatus === "loading" && (
          <Button
            data-ocid="sitter.gdpr_anonymize.loading_state"
            disabled
            className="w-full rounded-full bg-destructive text-destructive-foreground font-semibold h-10"
          >
            <Loader2 size={14} className="mr-2 animate-spin" />
            Requesting…
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SitterDashboard({
  navigate,
  darkMode,
  setDarkMode,
  initialTab,
}: Props) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: allSitters = [] } = useAllSitters();
  const updateStatus = useUpdateBookingStatus();
  const updateServiceCompletion = useUpdateServiceCompletion();
  const sendCompletionEmail = useSendServiceCompletionEmail();
  const saveProfile = useSaveProfile();
  const createSitter = useCreateSitter();
  const updateSitter = useUpdateSitter();
  const qc = useQueryClient();
  const { data: licenseStatus } = useSitterLicenseStatus();
  const { data: subscriptionStatus } = useSitterSubscriptionStatus();
  const { data: mySupportTickets = [] } = useGetMySupportTickets();

  // Subscription overlay state
  const subStatus = subscriptionStatus?.subscriptionStatus ?? "trial";
  const isGrandfathered = licenseStatus?.isGrandfathered ?? false;
  const trialDaysRemaining = subscriptionStatus?.trialDaysRemaining ?? 30;
  const stripeCustomerId = subscriptionStatus?.stripeCustomerId;
  const [trialModalDismissed, setTrialModalDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("bookings");

  // GAP 8: Terms re-acceptance modal — fires for all sitters when TERMS_VERSION increases
  const [showTermsModal, setShowTermsModal] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("pawspect_accepted_terms_version");
    const storedVersion = stored ? Number.parseInt(stored, 10) : 0;
    if (storedVersion < TERMS_VERSION) {
      setShowTermsModal(true);
    }
  }, []);

  const showFrozenOverlay = !isGrandfathered && subStatus === "frozen";
  const showTrialModal =
    !isGrandfathered && subStatus === "expired" && !trialModalDismissed;

  const handleSubscribeFromOverlay = () => {
    setTrialModalDismissed(true);
    setActiveTab("billing");
  };
  const handleExportFromOverlay = () => {
    setTrialModalDismissed(true);
    setActiveTab("account-privacy");
  };

  // Bookings Current/Past tab state
  const [bookingsTab, setBookingsTab] = useState<"current" | "past">(
    initialTab === "past" ? "past" : "current",
  );

  // Service completion modal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [completionPromptBooking, setCompletionPromptBooking] = useState<
    any | null
  >(null);
  const [completionData, setCompletionData] = useState({
    actualEndTime: "",
    finalPrice: "",
    completionNotes: "",
    discountPercent: "",
  });

  // Decline booking modal state
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTargetBooking, setDeclineTargetBooking] =
    useState<Public__8 | null>(null);
  const declineBooking = useDeclineBooking();

  const principal = identity?.getPrincipal().toString();
  const mySitter =
    (allSitters as Public[]).find((s) => s.owner?.toString() === principal) ??
    null;
  const { data: bookings = [], isLoading: bookingsLoading } =
    useBookingsBySitter(mySitter?.id ?? null);

  // Ad hoc jobs for this sitter
  const { data: adHocJobs = [] } = useAdHocJobsBySitter(mySitter?.id ?? null);

  // Sitter stats (includes adHocJobCount)
  const { data: sitterStats } = useGetSitterStats(mySitter?.id ?? null);
  const adHocJobCount = sitterStats?.adHocJobCount ?? 0;

  // Recurring booking groups — rendered above individual non-grouped bookings
  const { data: recurringGroups = [] } = useGetRecurringGroupsBySitter(
    mySitter?.id ?? null,
  );

  const bookingIds = useMemo(
    () => (bookings as unknown as { id: bigint }[]).map((b) => b.id.toString()),
    [bookings],
  );
  const { data: sitterPayments = [] } = usePaymentsByBookingIds(bookingIds);
  const { data: existingAvailability = [] } = useSitterAvailability(
    mySitter?.id ?? null,
  );
  const { data: myTeams = [] } = useMyTeams();
  const { data: sitterServiceRates = [] } = useSitterServiceRates(
    mySitter?.id ?? null,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceRadius, setServiceRadius] = useState("10");
  const [serviceZip, setServiceZip] = useState("");

  // Extended profile fields
  const [yearsExperience, setYearsExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [languages, setLanguages] = useState("");
  const [homeEnvironment, setHomeEnvironment] = useState("");

  // Guard: only seed form state from mySitter once per sitter ID load.
  // Without this, every polling refetch of mySitter would overwrite the user's
  // unsaved checkbox selections — the root cause of services not sticking.
  const profileSeedIdRef = useRef<string | null>(null);
  // isSaving: block re-seeding while a save is in-flight to prevent race
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!mySitter) return;
    const sitterId = String(mySitter.id);
    // Only re-seed when a different sitter is loaded (e.g. first load or identity change).
    // This prevents polling refetches from overwriting unsaved user selections.
    if (profileSeedIdRef.current === sitterId) return;
    // CRITICAL: never re-seed while a save is in-flight — that would overwrite
    // the user's selections with stale data mid-save (service checkbox race condition)
    if (isSavingRef.current) return;
    profileSeedIdRef.current = sitterId;

    setBio(mySitter.bio ?? "");
    setLocation(mySitter.location ?? "");
    setHourlyRate(String(mySitter.hourlyRate));
    setPhotoUrl(mySitter.photoUrl ?? "");
    setSelectedServices(mySitter.services ?? []);
    // Load extended fields
    const s = mySitter as unknown as Record<string, unknown>;
    setYearsExperience(
      s.yearsExperience != null ? String(s.yearsExperience) : "",
    );
    setCertifications(
      typeof s.certifications === "string" ? s.certifications : "",
    );
    setLanguages(typeof s.languages === "string" ? s.languages : "");
    setHomeEnvironment(
      typeof s.homeEnvironment === "string" ? s.homeEnvironment : "",
    );
    // Load serviceRadius
    if (s.serviceRadius != null) {
      setServiceRadius(String(s.serviceRadius));
    }
    // Load serviceZip
    if (typeof s.serviceZip === "string" && s.serviceZip) {
      setServiceZip(s.serviceZip);
    }
  }, [mySitter]);

  const toggleService = (s: string) =>
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <PawPrint size={28} className="text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">Sitter Portal</h2>
        <p className="text-muted-foreground text-center">
          Sign in with Internet Identity to manage your profile and bookings.
        </p>
        <Button
          data-ocid="sitter.login.button"
          onClick={login}
          disabled={isLoggingIn}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 font-semibold"
        >
          {isLoggingIn ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Log In with Internet Identity"
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("home")}
          className="text-muted-foreground"
        >
          <ArrowLeft size={14} className="mr-1" /> Back to Home
        </Button>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    // CRITICAL: Block re-seeding from polling during save to prevent checkbox race condition
    isSavingRef.current = true;
    // Snapshot the services the user has selected RIGHT NOW before any async work.
    // This prevents the closing-over-stale-state race where a background poll
    // fires between the mutateAsync call and the refetch, updating mySitter
    // and triggering a re-seed from stale backend data.
    const savedServicesSnapshot = [...selectedServices];

    try {
      await saveProfile.mutateAsync({
        name,
        email: email || undefined,
        role: "user",
      });
      if (mySitter) {
        const updatePayload = {
          id: mySitter.id,
          name,
          bio,
          location,
          hourlyRate: BigInt(hourlyRate || "0"),
          photoUrl,
          phone: mySitter.phone ?? "",
          isActive: true,
          // Always send the snapshot — never rely on a stale closure.
          services: savedServicesSnapshot,
        };
        // Attach extended fields via cast to avoid protected backend.d.ts
        (updatePayload as unknown as Record<string, unknown>).yearsExperience =
          yearsExperience
            ? Number.parseInt(yearsExperience) || undefined
            : undefined;
        (updatePayload as unknown as Record<string, unknown>).certifications =
          certifications || undefined;
        (updatePayload as unknown as Record<string, unknown>).languages =
          languages || undefined;
        (updatePayload as unknown as Record<string, unknown>).homeEnvironment =
          homeEnvironment || undefined;
        // Attach serviceRadius
        (updatePayload as unknown as Record<string, unknown>).serviceRadius =
          serviceRadius ? Number.parseInt(serviceRadius) || 10 : 10;
        // Attach serviceZip
        (updatePayload as unknown as Record<string, unknown>).serviceZip =
          serviceZip || undefined;
        await updateSitter.mutateAsync(updatePayload);

        // CRITICAL: Optimistically patch the React Query cache immediately so
        // any re-seed that fires between the invalidation and the forced refetch
        // uses the SAVED services — not the pre-save stale backend data.
        qc.setQueryData<Public[]>(["all-sitters"], (old) => {
          if (!old) return old;
          return old.map((s) =>
            s.id === mySitter.id
              ? { ...s, services: savedServicesSnapshot }
              : s,
          );
        });

        // Await a forced refetch of the all-sitters list so the confirmed
        // backend data (with the saved services) is in the React Query cache
        // BEFORE we clear the seed guard.
        await qc.refetchQueries({ queryKey: ["all-sitters"] });

        // Reset to the current sitter's ID (not null) so that the guard remains
        // active against re-seeding from stale data, but a new sitter load will
        // still trigger a fresh seed. Using null would allow the next poll to
        // overwrite unsaved selections with stale backend data.
        profileSeedIdRef.current = String(mySitter.id);
      }
      // Also persist v2 extended profile fields
      window.dispatchEvent(new Event("pawspect:saveProfileV2"));
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      // Always release the save lock so future polls can update the form if needed
      isSavingRef.current = false;
    }
  };

  const allBookingsList = (bookings as unknown as Public__8[]).sort((a, b) =>
    Number(b.startDate - a.startDate),
  );

  const currentBookings = allBookingsList.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status as string),
  );
  const pastBookings = allBookingsList.filter((b) =>
    ["completed", "cancelled"].includes(b.status as string),
  );

  const handleStatus = (
    bookingId: bigint,
    status: "confirmed" | "completed" | "cancelled",
  ) => {
    if (status === "completed") {
      // Find the booking to pre-populate the modal
      const booking = (allBookingsList as unknown as Public__8[]).find(
        (b) => (b as unknown as { id: bigint }).id === bookingId,
      );
      if (booking) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setCompletionData({
          actualEndTime: `${hh}:${mm}`,
          finalPrice: "",
          completionNotes: "",
          discountPercent: "",
        });
        setCompletionPromptBooking(booking);
        return;
      }
    }
    updateStatus.mutate(
      { bookingId, status },
      {
        onSuccess: () => {
          toast.success(`Booking ${status}`);
          if (status === "completed") {
            sendCompletionEmail.mutate(bookingId);
          }
        },
        onError: () => toast.error("Failed to update status"),
      },
    );
  };

  const handleDeclineClick = (booking: Public__8) => {
    setDeclineTargetBooking(booking);
    setDeclineModalOpen(true);
  };

  const handleDeclineSubmit = async (
    bookingId: bigint,
    reason: string,
    windows: { date: string; time: string; duration: string }[],
  ) => {
    const clientName =
      (declineTargetBooking as unknown as { clientName?: string })
        ?.clientName ?? "Client";
    await declineBooking.mutateAsync(
      { bookingId, declineReason: reason, alternativeWindows: windows },
      {
        onSuccess: () => {
          toast.success(`Booking declined — ${clientName} has been notified`);
          setDeclineModalOpen(false);
          setDeclineTargetBooking(null);
        },
        onError: () => toast.error("Failed to decline booking"),
      },
    );
  };

  const handleCompleteWithDetails = async () => {
    if (!completionPromptBooking) return;
    const bookingId = (completionPromptBooking as unknown as { id: bigint }).id;
    let actualEndTimeNs: bigint | null = null;
    if (completionData.actualEndTime) {
      const [hStr, mStr] = completionData.actualEndTime.split(":");
      const today = new Date();
      today.setHours(Number(hStr), Number(mStr), 0, 0);
      actualEndTimeNs = BigInt(today.getTime()) * 1_000_000n;
    }
    const finalPriceCents =
      completionData.finalPrice !== ""
        ? BigInt(Math.round(Number.parseFloat(completionData.finalPrice) * 100))
        : null;
    const discPct =
      completionData.discountPercent !== ""
        ? BigInt(Number.parseInt(completionData.discountPercent))
        : null;
    const notes =
      completionData.completionNotes !== ""
        ? completionData.completionNotes
        : null;
    try {
      await updateServiceCompletion.mutateAsync({
        bookingId,
        actualEndTime: actualEndTimeNs,
        finalPrice: finalPriceCents,
        completionNotes: notes,
        discountPercent: discPct,
      });
      sendCompletionEmail.mutate(bookingId);
      toast.success("Service completed!");
    } catch {
      toast.error("Failed to complete service");
    }
    setCompletionPromptBooking(null);
  };

  const handleSkipAndComplete = () => {
    if (!completionPromptBooking) return;
    const bookingId = (completionPromptBooking as unknown as { id: bigint }).id;
    updateStatus.mutate(
      { bookingId, status: "completed" },
      {
        onSuccess: () => {
          toast.success("Booking completed");
          sendCompletionEmail.mutate(bookingId);
        },
        onError: () => toast.error("Failed to update status"),
      },
    );
    setCompletionPromptBooking(null);
  };

  // Live discounted price preview
  const basePrice =
    completionData.finalPrice !== ""
      ? Number.parseFloat(completionData.finalPrice)
      : null;
  const discountPct =
    completionData.discountPercent !== ""
      ? Number.parseFloat(completionData.discountPercent)
      : 0;
  const discountedPreviewPrice =
    basePrice !== null && discountPct > 0
      ? basePrice * (1 - discountPct / 100)
      : null;

  // ── Portal navigation config ────────────────────────────────────────────
  const openSupportTickets = mySupportTickets
    ? mySupportTickets.filter((t) => {
        const s = typeof t.status === "string" ? t.status : String(t.status);
        return s === "open" || s === "adminAccessing";
      }).length
    : 0;

  const sitterNavGroups: NavGroup[] = [
    {
      label: "My Business",
      tabs: [
        {
          value: "bookings",
          label: "Bookings",
          icon: CalendarDays,
          ocid: "sitter.tab.bookings",
        },
        {
          value: "agenda",
          label: "Agenda",
          icon: CalendarDays,
          ocid: "sitter.tab.agenda",
        },
        {
          value: "invoices",
          label: "Invoices",
          icon: Receipt,
          ocid: "sitter.tab.invoices",
        },
      ],
    },
    {
      label: "Growth",
      tabs: [
        {
          value: "analytics",
          label: "Analytics",
          icon: BarChart3,
          ocid: "sitter.tab.analytics",
        },
        {
          value: "coach",
          label: "Coach",
          icon: Sparkles,
          ocid: "sitter.tab.coach",
        },
        { value: "crm", label: "CRM", icon: Users, ocid: "sitter.tab.crm" },
      ],
    },
    {
      label: "Teams",
      tabs: [
        {
          value: "teams",
          label: "Teams",
          icon: Users,
          ocid: "sitter.tab.teams",
        },
        {
          value: "team-collab",
          label: "Collaboration",
          icon: MessageSquare,
          ocid: "sitter.tab.team-collab",
        },
      ],
    },
    {
      label: "My Site",
      tabs: [
        {
          value: "profile",
          label: "Profile",
          icon: User,
          ocid: "sitter.tab.profile",
        },
        {
          value: "availability",
          label: "Availability",
          icon: Clock,
          ocid: "sitter.tab.availability",
        },
      ],
    },
    {
      label: "Account",
      tabs: [
        {
          value: "support",
          label: "Help Desk",
          icon: LifeBuoy,
          badge: openSupportTickets > 0 ? openSupportTickets : undefined,
          ocid: "sitter.support.tab",
        },
        ...(isGrandfathered
          ? []
          : [
              {
                value: "billing",
                label: "Billing",
                icon: CreditCard,
                ocid: "sitter.billing.tab",
              } as NavTab,
            ]),
        {
          value: "account-privacy",
          label: "Privacy",
          icon: ShieldCheck,
          ocid: "sitter.account_privacy.tab",
        },
      ],
    },
  ];

  const sitterPrimaryTabs: NavTab[] = [
    { value: "bookings", label: "Bookings", icon: CalendarDays },
    { value: "teams", label: "Teams", icon: Users },
    { value: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── GAP 8: Terms Re-acceptance Modal — blocks portal until accepted ── */}
      {showTermsModal && (
        <div
          data-ocid="sitter.terms_reaccept.dialog"
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                  Updated Terms &amp; Agreements
                </h3>
                <p className="text-xs text-muted-foreground">
                  Effective April 21, 2026
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&rsquo;ve updated our Terms of Service and Privacy Policy
              (effective April 21, 2026). Please review and accept to continue
              using your sitter portal.
            </p>
            <Button
              data-ocid="sitter.terms_reaccept.confirm_button"
              onClick={() => {
                localStorage.setItem(
                  "pawspect_accepted_terms_version",
                  String(TERMS_VERSION),
                );
                setShowTermsModal(false);
              }}
              className="w-full rounded-xl font-bold h-12"
            >
              <Check size={16} className="mr-2" />I Accept the Updated Terms
            </Button>
          </div>
        </div>
      )}
      {/* ── Portal sidebar (desktop) ────────────────────────────────────── */}
      <PortalSidebar
        groups={sitterNavGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="sitter"
      />
      {/* ── Portal bottom nav (mobile) ──────────────────────────────────── */}
      <PortalBottomNav
        groups={sitterNavGroups}
        primaryTabs={sitterPrimaryTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="sitter"
      />
      {/* ── Main content area ───────────────────────────────────────────── */}
      {/* pb accounts for the fixed bottom nav on mobile (safe-area-aware).
          On md+ the sidebar is shown instead so no bottom padding needed. */}
      <div className="flex-1 min-w-0 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* ── Frozen account overlay ───────────────────────────────────────── */}
        {showFrozenOverlay && (
          <FrozenAccountScreen
            onReactivate={() => setActiveTab("billing")}
            onExportData={() => setActiveTab("account-privacy")}
          />
        )}
        {/* ── Trial ended modal ────────────────────────────────────────────── */}
        <TrialGateModal
          open={showTrialModal}
          onSubscribe={handleSubscribeFromOverlay}
          onExportData={handleExportFromOverlay}
          onClose={() => setTrialModalDismissed(true)}
          hasBeenDismissed={trialModalDismissed}
        />
        {/* ── Decline booking modal ─────────────────────────────────────────── */}
        <DeclineBookingModal
          booking={declineTargetBooking}
          open={declineModalOpen}
          onClose={() => {
            setDeclineModalOpen(false);
            setDeclineTargetBooking(null);
          }}
          onConfirm={handleDeclineSubmit}
          isSubmitting={declineBooking.isPending}
        />
        <header className="sticky top-0 z-50 frosted-nav">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate("home")}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 shrink-0"
              >
                <ArrowLeft size={16} /> Home
              </button>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="font-display font-semibold hidden sm:inline truncate">
                Sitter Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Admin portal switch — visible for any sitter who also has admin access */}
              {isAdmin && (
                <button
                  type="button"
                  data-ocid="sitter.switch_to_admin.button"
                  onClick={() => navigate("admin-dashboard")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.45 0.18 265 / 0.12), oklch(0.55 0.20 270 / 0.18))",
                    border: "1px solid oklch(0.45 0.18 265 / 0.30)",
                    color: "oklch(0.50 0.18 265)",
                  }}
                >
                  <ShieldCheck size={12} />
                  Admin Panel
                </button>
              )}
              {/* Subscription status badge — not shown for grandfathered in header, they see it in Profile */}
              {subscriptionStatus && !isGrandfathered && (
                <SubscriptionStatusBadge
                  status={subStatus}
                  trialDaysRemaining={trialDaysRemaining}
                  onClickUpgrade={() => setActiveTab("billing")}
                  compact
                />
              )}
              {setDarkMode && (
                <button
                  type="button"
                  data-ocid="nav.dark_mode.toggle"
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={darkMode ? "Light mode" : "Dark mode"}
                >
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
              {mySitter && <NotificationBell sitterId={mySitter.id} />}
              <div className="flex items-center gap-2 text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full max-w-[200px]">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                  {mySitter?.photoUrl ? (
                    <img
                      src={mySitter.photoUrl}
                      alt={profile?.name ?? name ?? "Sitter"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {(profile?.name ?? name ?? "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {(profile?.name ?? name ?? "Sitter").slice(0, 20)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          {/* ── Account suspension banner ────────────────────────────────── */}
          {showFrozenOverlay && (
            <div
              data-ocid="sitter.suspension.banner"
              className="mb-6 border rounded-xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              style={{
                background: "oklch(0.97 0.04 25 / 0.80)",
                borderColor: "oklch(0.65 0.18 25 / 0.40)",
              }}
            >
              <Lock
                size={18}
                style={{ color: "oklch(0.50 0.22 25)", flexShrink: 0 }}
                className="mt-0.5 sm:mt-0"
              />
              <p
                className="text-sm font-medium flex-1"
                style={{ color: "oklch(0.42 0.22 25)" }}
              >
                Your account is currently suspended. Subscribe below to
                reactivate your account and restore full access.
              </p>
              <button
                type="button"
                data-ocid="sitter.suspension.subscribe_button"
                onClick={() => setActiveTab("billing")}
                className="text-xs font-bold px-4 py-2 rounded-full shrink-0 transition-opacity hover:opacity-80"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#1a1a2e",
                }}
              >
                Subscribe Now
              </button>
            </div>
          )}
          {mySitter && !mySitter.isActive && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <Clock size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  Application Pending Review
                </p>
                <p className="text-amber-700 text-sm mt-0.5">
                  Your application is pending admin review. You&apos;ll be
                  notified once approved and your profile will become visible to
                  clients.
                </p>
              </div>
            </div>
          )}

          {/* ── Sitter Advisor Widget ────────────────────────────────────── */}
          {profileLoading && !profile && !mySitter && (
            <div
              className="mb-6 animate-pulse space-y-3"
              data-ocid="sitter.dashboard.loading_state"
            >
              <div className="h-8 bg-muted rounded-xl w-1/3" />
              <div className="h-24 bg-muted rounded-2xl" />
              <div className="h-16 bg-muted rounded-2xl" />
            </div>
          )}
          {mySitter && (
            <SitterAdvisorWidget
              bookings={
                bookings as unknown as {
                  id: bigint;
                  status: string;
                  startDate: bigint;
                  withinCancellationWindow?: boolean;
                }[]
              }
              invoices={
                sitterPayments as unknown as {
                  bookingId: bigint;
                  status: string;
                  updatedAt?: bigint;
                  paidDate?: string;
                }[]
              }
              sitter={{
                bio: mySitter.bio,
                photoUrl: mySitter.photoUrl,
              }}
              subscriptionInfo={
                subscriptionStatus
                  ? {
                      status: subStatus,
                      expiresAt: null,
                      trialStartedAt:
                        subStatus === "trial" &&
                        subscriptionStatus.trialDaysRemaining < 30
                          ? Date.now() -
                            (30 - subscriptionStatus.trialDaysRemaining) *
                              24 *
                              60 *
                              60 *
                              1000
                          : null,
                    }
                  : null
              }
              reviewCount={Number(mySitter.reviewCount ?? 0)}
              openSupportTicketCount={
                mySupportTickets.filter((t) => {
                  const s =
                    typeof t.status === "string" ? t.status : String(t.status);
                  return s === "open" || s === "adminAccessing";
                }).length
              }
              onNavigate={setActiveTab}
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Bookings tab */}
            <TabsContent value="bookings">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                <h2 className="font-display text-xl font-bold mb-5">
                  Your Bookings
                </h2>
                {bookingsLoading ? (
                  <div>
                    {["bk-1", "bk-2"].map((k) => (
                      <Skeleton
                        key={k}
                        className="h-16 w-full rounded-xl mb-3"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Current / Past tab pills */}
                    <div
                      className="flex gap-2 mb-5"
                      data-ocid="sitter.booking_tabs"
                    >
                      <button
                        type="button"
                        data-ocid="sitter.tab.current"
                        onClick={() => setBookingsTab("current")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                          bookingsTab === "current"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        Current
                        {currentBookings.length > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                              bookingsTab === "current"
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {currentBookings.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        data-ocid="sitter.tab.past"
                        onClick={() => setBookingsTab("past")}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                          bookingsTab === "past"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        Past
                        {pastBookings.length > 0 && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                              bookingsTab === "past"
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {pastBookings.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Booking list for active tab */}
                    {(bookingsTab === "current"
                      ? currentBookings
                      : pastBookings
                    ).length === 0 ? (
                      <div className="text-center py-12">
                        <PawPrint
                          size={32}
                          className="text-muted-foreground mx-auto mb-3"
                        />
                        <p className="text-muted-foreground">
                          No {bookingsTab === "current" ? "current" : "past"}{" "}
                          bookings
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {bookingsTab === "current"
                            ? "Pending and confirmed bookings will appear here."
                            : "Completed and cancelled bookings will appear here."}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* ── Recurring group cards (only on Current tab, above individual bookings) ── */}
                        {bookingsTab === "current" &&
                          recurringGroups.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-200 rounded-full px-3 py-1">
                                  <RefreshCw
                                    size={11}
                                    className="text-amber-700"
                                  />
                                  <span className="text-xs font-bold text-amber-700">
                                    Recurring Series
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {recurringGroups.length} active series
                                </span>
                              </div>
                              {recurringGroups.map((group, gIdx) => {
                                // Match occurrence bookings from the sitter's bookings list
                                const occurrenceSet = new Set(
                                  group.occurrenceIds.map((id) =>
                                    id.toString(),
                                  ),
                                );
                                const occurrenceBookings = (
                                  allBookingsList as Public__8[]
                                ).filter((b) =>
                                  occurrenceSet.has(b.id.toString()),
                                );
                                return (
                                  <RecurringBookingGroupCard
                                    key={group.groupId}
                                    group={group}
                                    occurrenceBookings={occurrenceBookings}
                                    index={gIdx}
                                  />
                                );
                              })}
                              {/* Divider before individual bookings */}
                              <div className="flex items-center gap-3 my-1">
                                <div className="h-px flex-1 bg-border/60" />
                                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                  Individual Bookings
                                </span>
                                <div className="h-px flex-1 bg-border/60" />
                              </div>
                            </>
                          )}
                        {(bookingsTab === "current"
                          ? currentBookings
                          : pastBookings
                        ).map((b, i) => {
                          const statusStr = b.status as string;
                          return (
                            <BookingCard
                              key={(
                                b as unknown as { id: bigint }
                              ).id.toString()}
                              booking={b}
                              senderName={mySitter?.name ?? "Sitter"}
                              index={i}
                              onConfirm={
                                statusStr === "pending"
                                  ? (id) => handleStatus(id, "confirmed")
                                  : undefined
                              }
                              onComplete={
                                statusStr === "confirmed"
                                  ? (id) => handleStatus(id, "completed")
                                  : undefined
                              }
                              onCancel={(id) => handleStatus(id, "cancelled")}
                              onDecline={
                                statusStr === "pending" &&
                                bookingsTab === "current"
                                  ? handleDeclineClick
                                  : undefined
                              }
                              allSitters={allSitters as Public[]}
                              extraContent={
                                mySitter &&
                                (statusStr === "confirmed" ||
                                  statusStr === "completed") ? (
                                  <ServiceLogTimeline
                                    bookingId={
                                      (b as unknown as { id: bigint }).id
                                    }
                                    sitterId={mySitter.id}
                                    sitterName={mySitter.name}
                                    isActive={statusStr === "confirmed"}
                                  />
                                ) : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Agenda tab */}
            <TabsContent value="agenda">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-3 sm:p-6 overflow-x-hidden">
                <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                  <CalendarDays size={18} className="text-primary" />
                  Your Agenda
                </h2>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {["ag-1", "ag-2"].map((k) => (
                      <div key={k} className="space-y-2">
                        <div className="h-10 bg-muted/50 rounded-xl animate-pulse" />
                        <div className="h-48 bg-muted/30 rounded-xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <AgendaTab
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    bookings={allBookingsList as unknown as any[]}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    adHocJobs={adHocJobs as unknown as any[]}
                    availability={existingAvailability as AvailabilityEntry[]}
                    sitterId={mySitter?.id ?? null}
                  />
                )}
              </div>
            </TabsContent>

            {/* Invoices tab */}
            <TabsContent value="invoices">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                <h2 className="font-display text-xl font-bold mb-5">
                  Invoices &amp; Payments
                </h2>
                {mySitter ? (
                  <SitterInvoicesTab
                    bookings={bookings as unknown as Public__8[]}
                    allSitters={allSitters as Public[]}
                    sitterName={mySitter.name}
                    sitterPhone={mySitter.phone ?? ""}
                    sitterId={mySitter.id}
                    teams={myTeams}
                    serviceRates={sitterServiceRates}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="flex justify-center mb-3">
                      <Receipt size={40} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Create your sitter profile to start managing invoices.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analytics tab */}
            <TabsContent value="analytics">
              <TabErrorBoundary tabName="analytics">
                <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary" />
                    Your Analytics
                  </h2>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {["an-1", "an-2", "an-3"].map((k) => (
                        <Skeleton key={k} className="h-24 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <AnalyticsTab
                        bookings={bookings as unknown as Public__8[]}
                        payments={sitterPayments}
                        sitterId={mySitter?.id ?? null}
                        adHocJobCount={adHocJobCount}
                      />
                      <div className="mt-5">
                        <SitterAnalyticsSplitCard
                          bookings={bookings as unknown as Public__8[]}
                          payments={
                            sitterPayments as Array<{
                              bookingId: bigint;
                              totalAmount: bigint;
                              status: string;
                            }>
                          }
                          sitterId={mySitter?.id ?? null}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabErrorBoundary>
            </TabsContent>

            {/* Coach tab */}
            <TabsContent value="coach">
              <TabErrorBoundary tabName="coach">
                <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {["c-1", "c-2", "c-3"].map((k) => (
                        <Skeleton key={k} className="h-24 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : (
                    <CoachTab
                      bookings={bookings as unknown as Public__8[]}
                      payments={sitterPayments}
                      invoices={[]}
                      sitterId={mySitter?.id ?? null}
                      sitterName={
                        mySitter?.name ?? profile?.name ?? name ?? "Sitter"
                      }
                    />
                  )}
                </div>
              </TabErrorBoundary>
            </TabsContent>

            {/* CRM tab */}
            <TabsContent value="crm">
              <TabErrorBoundary tabName="crm">
                <div
                  className="rounded-2xl border border-white/10 p-4 sm:p-6"
                  style={{
                    background:
                      "linear-gradient(135deg, #0d0d1a 0%, #12122a 100%)",
                  }}
                >
                  {mySitter ? (
                    <SitterCRMTab
                      sitterPrincipal={mySitter.owner ?? null}
                      sitterName={mySitter.name}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex justify-center mb-3">
                        <Users size={40} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Create your sitter profile to start using the CRM.
                      </p>
                    </div>
                  )}
                </div>
              </TabErrorBoundary>
            </TabsContent>

            {/* Help Desk tab */}
            <TabsContent value="support">
              <div className="space-y-6">
                {/* ── FAQ first-line help ────────────────────────────────────── */}
                <div
                  className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6"
                  data-ocid="sitter.helpdesk.faq_section"
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                      <LifeBuoy size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-foreground">
                        Find an Answer First
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Search our help center — most questions are answered
                        here instantly.
                      </p>
                    </div>
                  </div>
                  <SitterPortalFAQ />
                </div>

                {/* ── Divider: escalation path ───────────────────────────────── */}
                <div
                  className="flex items-center gap-4"
                  data-ocid="sitter.helpdesk.divider"
                >
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs font-semibold text-muted-foreground px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 whitespace-nowrap">
                    Still need help? Submit a support ticket
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* ── Privacy note ───────────────────────────────────────────── */}
                <div className="flex items-start gap-3 rounded-xl border border-indigo-200/60 bg-indigo-50/30 px-4 py-3">
                  <Shield
                    size={15}
                    className="text-indigo-500 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    <span className="font-semibold">
                      Your personal and financial data stays private.
                    </span>{" "}
                    Admins only receive what's needed to resolve your issue —
                    and all access is logged and automatically revoked when your
                    ticket is closed.
                  </p>
                </div>

                {/* ── Support ticket escalation ─────────────────────────────── */}
                <div
                  className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6"
                  data-ocid="sitter.helpdesk.ticket_section"
                >
                  <SupportTicketTab />
                </div>
              </div>
            </TabsContent>

            {/* Profile tab */}
            <TabsContent value="profile">
              {profileLoading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : (
                <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold mb-4">
                    Your Profile
                  </h2>

                  {/* ── Public booking page share link ────────────────────── */}
                  <StorefrontShareLink sitterId={mySitter?.id ?? null} />

                  {/* ── Public page preview ───────────────────────────────── */}
                  {mySitter && (
                    <div
                      className="mb-6"
                      data-ocid="profile.public_page_preview.section"
                    >
                      <div
                        className="rounded-2xl px-5 py-4 mb-3 flex items-center justify-between gap-3 flex-wrap"
                        style={{
                          background: "oklch(0.72 0.18 55 / 0.10)",
                          border: "1px solid oklch(0.72 0.18 55 / 0.30)",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe
                            size={15}
                            style={{ color: "oklch(0.82 0.16 55)" }}
                            className="shrink-0"
                          />
                          <p
                            className="text-sm font-bold"
                            style={{ color: "oklch(0.88 0.14 55)" }}
                          >
                            Preview of your public page — exactly what clients
                            see
                          </p>
                        </div>
                        <a
                          href={`#/sitter/${mySitter.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-ocid="profile.view_public_page.button"
                          className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 transition-all hover:opacity-80"
                          style={{
                            background: "oklch(0.72 0.18 55 / 0.20)",
                            border: "1px solid oklch(0.72 0.18 55 / 0.40)",
                            color: "oklch(0.88 0.14 55)",
                          }}
                        >
                          Open live page ↗
                        </a>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-border/40 shadow-md pointer-events-none opacity-90">
                        <SitterStorefrontPage
                          previewData={{
                            profile: {
                              id: mySitter.id,
                              name: String(mySitter.name),
                              bio: mySitter.bio
                                ? String(mySitter.bio)
                                : undefined,
                              profilePhotoUrl: mySitter.photoUrl
                                ? String(mySitter.photoUrl)
                                : undefined,
                              averageRating: Number(mySitter.rating ?? 0),
                              reviewCount: BigInt(mySitter.reviewCount ?? 0),
                              isActive: Boolean(mySitter.isActive),
                              location: String(mySitter.location ?? ""),
                              badges: [],
                              services: (mySitter.services ?? []).map(
                                (s: string) => ({
                                  serviceName: String(s),
                                  price: Number(mySitter.hourlyRate ?? 0),
                                }),
                              ),
                              reviews: [],
                            } as StorefrontPreviewData["profile"],
                            pageComponents: undefined,
                            stats: null,
                            availability:
                              existingAvailability as StorefrontPreviewData["availability"],
                            galleryPhotos: [],
                            certifications: [],
                            petTypes: [],
                            responseTime: undefined,
                            isAccepting: true,
                            hideBookButton: true,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Lifetime Member badge ─────────────────────────────── */}
                  {licenseStatus?.isGrandfathered && (
                    <div
                      className="mb-5 flex items-center gap-3 rounded-2xl px-5 py-4 border"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.97 0.06 75) 0%, oklch(0.95 0.10 65) 100%)",
                        borderColor: "oklch(0.78 0.14 65 / 0.60)",
                        boxShadow:
                          "0 0 0 1px oklch(0.78 0.14 65 / 0.20), 0 4px 24px oklch(0.78 0.14 65 / 0.12)",
                      }}
                      data-ocid="profile.lifetime_member.card"
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.65 0.20 45))",
                        }}
                      >
                        <Star
                          size={20}
                          className="fill-white text-white drop-shadow"
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="font-bold text-sm leading-tight"
                          style={{ color: "oklch(0.45 0.18 50)" }}
                        >
                          Lifetime Member — Free Access Forever
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: "oklch(0.55 0.14 55)" }}
                        >
                          You joined before licensing was introduced. Your
                          account has complimentary lifetime access — no fees,
                          ever.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Business Profile Completeness */}
                  {(() => {
                    const checks = [
                      {
                        label: "Profile photo",
                        done: !!mySitter?.photoUrl,
                        weight: 20,
                      },
                      {
                        label: "Services selected",
                        done: (mySitter?.services?.length ?? 0) > 0,
                        weight: 20,
                      },
                      {
                        label: "Hourly rate set",
                        done: (mySitter?.hourlyRate ?? 0n) > 0n,
                        weight: 20,
                      },
                      {
                        label: "Availability set",
                        done: existingAvailability.length > 0,
                        weight: 20,
                      },
                      {
                        label: "Bio written",
                        done: (mySitter?.bio?.trim().length ?? 0) > 10,
                        weight: 20,
                      },
                    ];
                    const score = checks.reduce(
                      (s, c) => s + (c.done ? c.weight : 0),
                      0,
                    );
                    const color =
                      score === 100
                        ? "emerald"
                        : score >= 60
                          ? "indigo"
                          : "amber";
                    const colorMap = {
                      emerald: {
                        bar: "linear-gradient(90deg,#059669,#10b981)",
                        bg: "from-emerald-50 to-teal-50",
                        border: "border-emerald-200",
                        text: "text-emerald-800",
                        sub: "text-emerald-600",
                      },
                      indigo: {
                        bar: "linear-gradient(90deg,#6366f1,#4f46e5)",
                        bg: "from-indigo-50 to-violet-50",
                        border: "border-indigo-200",
                        text: "text-indigo-800",
                        sub: "text-indigo-600",
                      },
                      amber: {
                        bar: "linear-gradient(90deg,#f59e0b,#d97706)",
                        bg: "from-amber-50 to-yellow-50",
                        border: "border-amber-200",
                        text: "text-amber-800",
                        sub: "text-amber-600",
                      },
                    };
                    const cm = colorMap[color];
                    return (
                      <div
                        className={`mb-5 rounded-2xl bg-gradient-to-br ${cm.bg} border ${cm.border} p-5`}
                        data-ocid="profile.completeness.card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className={`text-sm font-bold ${cm.text}`}>
                              Profile Completeness
                            </p>
                            <p className={`text-xs ${cm.sub} mt-0.5`}>
                              {score === 100
                                ? "All done — your profile stands out!"
                                : `${5 - checks.filter((c) => c.done).length} item${5 - checks.filter((c) => c.done).length !== 1 ? "s" : ""} left to complete`}
                            </p>
                          </div>
                          <span
                            className={`text-2xl font-extrabold ${cm.text}`}
                          >
                            {score}%
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/60 overflow-hidden mb-4">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, background: cm.bar }}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {checks.map((c) => (
                            <div
                              key={c.label}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-500" : "bg-white/60 border border-border"}`}
                              >
                                {c.done && (
                                  <Check size={10} className="text-white" />
                                )}
                              </div>
                              <span
                                className={`text-xs ${c.done ? cm.text : "text-muted-foreground"} ${c.done ? "font-medium" : ""}`}
                              >
                                {c.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Display Name *</Label>
                      <Input
                        data-ocid="profile.name.input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-lg w-full text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        data-ocid="profile.email.input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-lg w-full text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        This email appears on client-facing invoices and booking
                        emails
                      </p>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Bio</Label>
                      <Textarea
                        data-ocid="profile.bio.textarea"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="rounded-lg resize-none w-full text-base min-h-[120px]"
                        rows={4}
                        placeholder="Tell clients about yourself..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Service Area Zip Code</Label>
                      <Input
                        data-ocid="profile.location.input"
                        value={location}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 5);
                          setLocation(val);
                        }}
                        placeholder="e.g. 80210"
                        maxLength={5}
                        inputMode="numeric"
                        pattern="^\d{5}$"
                        className="rounded-lg w-full text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your home zip code — used to show your profile to
                        clients searching nearby
                      </p>
                      {location.length > 0 && !/^\d{5}$/.test(location) && (
                        <p className="text-xs text-destructive">
                          Please enter a valid 5-digit zip code
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile.service_zip">Home Zip Code</Label>
                      <Input
                        id="profile.service_zip"
                        data-ocid="profile.service_zip.input"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={serviceZip}
                        onChange={(e) =>
                          setServiceZip(
                            e.target.value.replace(/\D/g, "").slice(0, 5),
                          )
                        }
                        placeholder="e.g. 80203"
                        className="rounded-lg w-full text-base"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your home base zip — used to match you with nearby
                        clients
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile.service_radius">
                        Service Radius
                      </Label>
                      <select
                        id="profile.service_radius"
                        data-ocid="profile.service_radius.select"
                        value={serviceRadius}
                        onChange={(e) => setServiceRadius(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {[2, 5, 10, 15, 25].map((r) => (
                          <option key={r} value={String(r)}>
                            {r} miles
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        How far you're willing to travel for bookings
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Daily Rate ($)</Label>
                      <Input
                        data-ocid="profile.rate.input"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="25"
                        className="rounded-lg w-full text-base"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="border border-border rounded-xl p-3 sm:p-4 bg-muted/20">
                        <PhotoUpload
                          currentPhotoUrl={photoUrl || undefined}
                          onUploadComplete={async (url) => {
                            setPhotoUrl(url);
                            // Auto-save photo immediately so it persists without
                            // requiring the user to also click "Save Profile"
                            if (mySitter) {
                              try {
                                await updateSitter.mutateAsync({
                                  id: mySitter.id,
                                  name: mySitter.name,
                                  bio: mySitter.bio ?? "",
                                  location: mySitter.location ?? "",
                                  hourlyRate: mySitter.hourlyRate,
                                  photoUrl: url,
                                  phone: mySitter.phone ?? "",
                                  isActive: mySitter.isActive,
                                  services: mySitter.services ?? [],
                                });
                                toast.success("Profile photo saved!");
                              } catch {
                                toast.error(
                                  "Photo uploaded but not saved — please click Save Profile",
                                );
                              }
                            }
                          }}
                          label="Profile Photo"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile.years_exp">
                        Years of Experience{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="profile.years_exp"
                        data-ocid="profile.years_exp.input"
                        type="number"
                        min="0"
                        max="50"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                        placeholder="e.g. 5"
                        className="rounded-lg w-full text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile.languages">
                        Languages Spoken{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="profile.languages"
                        data-ocid="profile.languages.input"
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        placeholder="e.g. English, Spanish"
                        className="rounded-lg w-full text-base"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="profile.certifications">
                        Certifications &amp; Training{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id="profile.certifications"
                        data-ocid="profile.certifications.textarea"
                        value={certifications}
                        onChange={(e) => setCertifications(e.target.value)}
                        className="rounded-lg resize-none w-full text-base"
                        rows={2}
                        placeholder="Pet First Aid, Dog Obedience Training Certificate..."
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="profile.home_env">
                        Home Environment{" "}
                        <span className="text-muted-foreground text-xs font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        id="profile.home_env"
                        data-ocid="profile.home_env.textarea"
                        value={homeEnvironment}
                        onChange={(e) => setHomeEnvironment(e.target.value)}
                        className="rounded-lg resize-none w-full text-base"
                        rows={2}
                        placeholder="Fenced yard, no other pets, indoor cat..."
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Services You Offer</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {ALL_SERVICES.map((svc) => (
                          <label
                            key={svc}
                            htmlFor={`svc-dash-${svc}`}
                            className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-colors"
                          >
                            <Checkbox
                              id={`svc-dash-${svc}`}
                              checked={selectedServices.includes(svc)}
                              onCheckedChange={() => toggleService(svc)}
                              className="shrink-0"
                            />
                            <span className="text-sm leading-tight">{svc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Service Rates Editor */}
                  {mySitter && selectedServices.length > 0 && (
                    <ServiceRatesEditor
                      sitter={mySitter}
                      selectedServices={selectedServices}
                    />
                  )}
                  {/* Admin Access */}
                  <AdminClaimSection navigate={navigate} />

                  {/* ── Professional Credentials ─────────────────────────── */}
                  {mySitter && (
                    <CredentialChecklistEditor sitterId={mySitter.id} />
                  )}

                  {/* ── Your Public Page Settings ─────────────────────────── */}
                  {mySitter && (
                    <PublicPageSettings
                      sitterId={Number(mySitter.id)}
                      sitterHandle={
                        (mySitter as unknown as { handle?: string }).handle ??
                        mySitter.name.toLowerCase().replace(/\s+/g, "-")
                      }
                      sitterPrincipal={mySitter.owner ?? null}
                      completedBookingCount={
                        (bookings as unknown as { status: string }[]).filter(
                          (b) => b.status === "completed",
                        ).length
                      }
                    />
                  )}

                  <Button
                    data-ocid="profile.save_button"
                    onClick={handleSaveProfile}
                    disabled={
                      showFrozenOverlay ||
                      saveProfile.isPending ||
                      createSitter.isPending ||
                      updateSitter.isPending
                    }
                    title={
                      showFrozenOverlay
                        ? "Account suspended — subscribe to reactivate"
                        : undefined
                    }
                    className="mt-5 w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold min-h-[48px] sm:min-h-0"
                  >
                    {saveProfile.isPending ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Availability tab */}
            <TabsContent value="availability">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                <h2 className="font-display text-xl font-bold mb-5">
                  Your Availability
                </h2>
                {mySitter ? (
                  <AvailabilityEditor sitterId={mySitter.id} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Create your sitter profile first to set availability.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Account & Privacy (GDPR) tab */}
            <TabsContent value="account-privacy">
              <AccountPrivacyTab sitterId={mySitter?.id ?? null} />
            </TabsContent>

            {/* Billing tab — hidden for grandfathered sitters */}
            {!isGrandfathered && (
              <TabsContent value="billing">
                <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                  <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    Billing &amp; Subscription
                  </h2>
                  <BillingPortalTab
                    subscriptionStatus={subStatus}
                    trialDaysRemaining={trialDaysRemaining}
                    stripeCustomerId={stripeCustomerId}
                    onSubscribeSuccess={() => setActiveTab("bookings")}
                  />
                </div>
              </TabsContent>
            )}

            {/* Teams tab */}
            <TabsContent value="teams">
              <TabErrorBoundary tabName="teams">
                <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
                  <SitterTeamsTab mySitterId={mySitter?.id ?? null} />
                </div>
              </TabErrorBoundary>
            </TabsContent>

            {/* Team Collaboration tab */}
            <TabsContent value="team-collab">
              <TabErrorBoundary tabName="team-collab">
                <div
                  className="bg-card rounded-2xl border border-border/60 gloss-ring overflow-hidden"
                  style={{ minHeight: "600px" }}
                >
                  {mySitter ? (
                    <TeamCollabTab
                      mySitterId={mySitter.id}
                      sitters={allSitters as Public[]}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <Users
                        size={32}
                        className="text-muted-foreground/40 mb-3"
                      />
                      <p className="text-sm text-muted-foreground">
                        Create your sitter profile to access team collaboration.
                      </p>
                    </div>
                  )}
                </div>
              </TabErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Service Completion Modal ─────────────────────────────────────── */}
        {completionPromptBooking && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)" }}
            data-ocid="completion.dialog"
          >
            <div
              className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
              style={{ maxHeight: "90vh", overflowY: "auto" }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 border-b border-border flex items-center justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <CheckCircle size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900">
                      Complete Service — Final Details
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      {(
                        completionPromptBooking as unknown as {
                          clientName?: string;
                        }
                      ).clientName ?? "Client"}
                      &nbsp;·&nbsp;
                      {(
                        completionPromptBooking as unknown as {
                          services?: string[];
                        }
                      ).services?.join(", ") ?? "Service"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  data-ocid="completion.close_button"
                  onClick={() => setCompletionPromptBooking(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Actual end time */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="completion-end-time"
                    className="text-sm font-medium"
                  >
                    Actual service end time{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <input
                    id="completion-end-time"
                    type="time"
                    data-ocid="completion.end_time.input"
                    value={completionData.actualEndTime}
                    onChange={(e) =>
                      setCompletionData((prev) => ({
                        ...prev,
                        actualEndTime: e.target.value,
                      }))
                    }
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Final price */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="completion-price"
                    className="text-sm font-medium"
                  >
                    Final charge ($){" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="completion-price"
                      type="number"
                      min="0"
                      step="0.01"
                      data-ocid="completion.final_price.input"
                      value={completionData.finalPrice}
                      onChange={(e) =>
                        setCompletionData((prev) => ({
                          ...prev,
                          finalPrice: e.target.value,
                          // reset discount when price changes
                          discountPercent: "",
                        }))
                      }
                      className="pl-7 rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Discount selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Tag size={13} className="text-amber-500" />
                    Apply Discount{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="completion.discount.toggle"
                  >
                    {["5", "10", "15", "20", "25"].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        data-ocid={`completion.discount.${pct}pct`}
                        onClick={() =>
                          setCompletionData((prev) => ({
                            ...prev,
                            discountPercent:
                              prev.discountPercent === pct ? "" : pct,
                            // apply discount to price if set
                            finalPrice:
                              prev.discountPercent === pct
                                ? prev.finalPrice
                                : prev.finalPrice,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          completionData.discountPercent === pct
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-amber-400 hover:text-amber-600"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                    {/* Custom input */}
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        data-ocid="completion.discount.custom_input"
                        placeholder="Custom %"
                        value={
                          ["5", "10", "15", "20", "25"].includes(
                            completionData.discountPercent,
                          )
                            ? ""
                            : completionData.discountPercent
                        }
                        onChange={(e) =>
                          setCompletionData((prev) => ({
                            ...prev,
                            discountPercent: e.target.value,
                          }))
                        }
                        className="w-24 h-8 text-xs rounded-full text-center border-border"
                      />
                      <Percent size={13} className="text-muted-foreground" />
                    </div>
                  </div>
                  {/* Live discounted price preview */}
                  {discountedPreviewPrice !== null && basePrice !== null && (
                    <div className="flex items-center gap-2 mt-1 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <Tag size={13} className="text-emerald-600 shrink-0" />
                      <p className="text-sm text-emerald-700 font-medium">
                        Price after {discountPct}% discount:{" "}
                        <span className="font-extrabold text-emerald-800">
                          ${discountedPreviewPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-emerald-500 ml-1 line-through">
                          ${basePrice.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes / issues */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="completion-notes"
                    className="text-sm font-medium"
                  >
                    Notes, issues, or details{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="completion-notes"
                    data-ocid="completion.notes.textarea"
                    value={completionData.completionNotes}
                    onChange={(e) =>
                      setCompletionData((prev) => ({
                        ...prev,
                        completionNotes: e.target.value.slice(0, 500),
                      }))
                    }
                    rows={3}
                    maxLength={500}
                    placeholder="Any notes about the service, pet behavior, or issues..."
                    className="rounded-lg resize-none text-sm"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {completionData.completionNotes.length}/500
                  </p>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2.5">
                <Button
                  data-ocid="completion.submit_button"
                  onClick={handleCompleteWithDetails}
                  disabled={updateServiceCompletion.isPending}
                  className="flex-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11"
                >
                  {updateServiceCompletion.isPending ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} className="mr-2" />
                      Complete Service
                    </>
                  )}
                </Button>
                <Button
                  data-ocid="completion.skip_button"
                  variant="ghost"
                  onClick={handleSkipAndComplete}
                  disabled={
                    updateServiceCompletion.isPending || updateStatus.isPending
                  }
                  className="flex-1 rounded-full h-11 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Skip &amp; Complete
                </Button>
                <Button
                  data-ocid="completion.cancel_button"
                  variant="outline"
                  onClick={() => setCompletionPromptBooking(null)}
                  className="sm:w-auto rounded-full h-11 text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* end main content */}
    </div>
  );
}
