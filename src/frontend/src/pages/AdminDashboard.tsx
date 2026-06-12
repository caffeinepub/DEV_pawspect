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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Award,
  BarChart2,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  Fingerprint,
  Flame,
  HelpCircle,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  Map as MapIcon,
  Moon,
  MoreHorizontal,
  PawPrint,
  Plus,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  Snowflake,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { Component, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type {
  AuditAction,
  AvailabilityEntry,
  PaymentMethod,
  Public,
  Public__4,
  Public__6,
  Public__8,
} from "../backend.d";
import { PaymentStatus, TicketStatus } from "../backend.d";
import AdminCoBookingSplitsSection from "../components/AdminAnalyticsTab";
import { PhotoUpload } from "../components/PhotoUpload";
import PortalBottomNav from "../components/PortalBottomNav";
import PortalSidebar, {
  type NavGroup,
  type NavTab,
} from "../components/PortalSidebar";
import { parseBadges } from "../components/SitterCard";
import StatusBadge from "../components/StatusBadge";
import LegalReviewChecklist from "../components/admin/LegalReviewChecklist";
import SitterCoverageMap from "../components/admin/SitterCoverageMap";
import { APP_NAME, BUSINESS_CONFIG, SERVICES_LIST } from "../config/business";
import { useBackendActor as useActor } from "../hooks/useBackend";
import {
  useAdminBookingAnalytics,
  useAdminBookingStats,
  useAdminGetRecurringGroup,
  useAdminPendingRevenue,
  useAdminPendingRevenueBreakdown,
  useAdminRequestAccountAnonymization,
  useAdminRequestGdprExport,
  useAllBookings,
  useAllPayments,
  useAllSitters,
  useApproveSitter,
  useAssignRole,
  useAssignSitterToFreePlan,
  useCallerProfile,
  useClaimFirstAdmin,
  useConfirmManualPayment,
  useCreatePayment,
  useCreateSitter,
  useDeleteBooking,
  useDeletePayment,
  useDeleteSitter,
  useFixSitterZipCodes,
  useFreezeSitterAccount,
  useGetAdminNotificationEmail,
  useGetAllSubscriptionStates,
  useGetAllSupportTickets,
  useGetAuditLog,
  useGetGrantedAdmins,
  useGetStripeFreePlanPriceId,
  useGetStripePublicConfig,
  useGrantAdminAccess,
  useGrantSupportAccess,
  useIsAdmin,
  useIsAdminAssigned,
  useMutationAdminCancelRecurringGroup,
  useRejectSitter,
  useResolveSupportTicket,
  useRevokeAdminAccess,
  useSetAdminNotificationEmail,
  useSetSitterAvailability,
  useSetStripeFreePlanPriceId,
  useSitterAvailability,
  useUnfreezeSitterAccount,
  useUpdateBookingStatus,
  useUpdatePaymentSplits,
  useUpdateSitter,
  useUpdateStripeConfig,
} from "../hooks/useQueries";
import {
  useAllTeamsAdmin,
  useDissolveTeamAdmin,
} from "../hooks/useTeamQueries";
import {
  type UsageStats,
  getDailyLimit,
  getMonthlyLimit,
  getUsageStats,
  saveLimitsLocally,
} from "../lib/usageTracking";
import type { Team } from "../types/teams";
import { getTopUncoveredZips } from "../utils/coverageTracking";
import { getTeamStatus } from "../utils/teamUtils";

// ── Tab Error Boundary ────────────────────────────────────────────────────────

interface TabEBState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<
  { children: React.ReactNode; tabName?: string },
  TabEBState
> {
  constructor(props: { children: React.ReactNode; tabName?: string }) {
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
  ...SERVICES_LIST,
  "Boarding",
  "Playtime & Hang Out",
  "Pet Sitting",
].filter((v, i, arr) => arr.indexOf(v) === i);

function formatDate(ts: bigint): string {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  navigate: (view: View) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
}

// ─── Recurring Group Expand Panel ────────────────────────────────────────────
function RecurringGroupPanel({
  groupId,
  occurrenceBookings,
}: {
  groupId: string;
  occurrenceBookings: Public__8[];
}) {
  const { data: group, isLoading } = useAdminGetRecurringGroup(groupId, true);
  const cancelGroup = useMutationAdminCancelRecurringGroup();
  const updateStatus = useUpdateBookingStatus();
  const [confirmCancelAll, setConfirmCancelAll] = useState(false);

  const frequency = group?.recurrenceRule?.pattern ?? "—";
  const totalSessions =
    group?.occurrenceIds?.length ?? occurrenceBookings.length;

  const handleCancelAll = async () => {
    try {
      await cancelGroup.mutateAsync(groupId);
      toast.success("Recurring series cancelled");
      setConfirmCancelAll(false);
    } catch {
      toast.error("Failed to cancel series");
    }
  };

  return (
    <div
      data-ocid={`admin.bookings.recurring_panel.${groupId}`}
      className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3"
    >
      {/* Series header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">
            Recurring Series
          </span>
          <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-medium capitalize">
            {frequency}
          </span>
          <span className="text-xs text-muted-foreground">
            · {totalSessions} session{totalSessions !== 1 ? "s" : ""}
          </span>
        </div>
        {!confirmCancelAll ? (
          <Button
            size="sm"
            variant="ghost"
            data-ocid={`admin.bookings.cancel_series_button.${groupId}`}
            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 rounded-full"
            onClick={() => setConfirmCancelAll(true)}
          >
            Cancel Entire Series
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-destructive font-medium">
              Cancel all pending dates?
            </span>
            <Button
              size="sm"
              data-ocid={`admin.bookings.cancel_series_confirm_button.${groupId}`}
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 h-7 px-2 rounded-full"
              disabled={cancelGroup.isPending}
              onClick={handleCancelAll}
            >
              {cancelGroup.isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                "Yes, Cancel All"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-ocid={`admin.bookings.cancel_series_dismiss_button.${groupId}`}
              className="text-xs h-7 px-2 rounded-full"
              onClick={() => setConfirmCancelAll(false)}
            >
              No
            </Button>
          </div>
        )}
      </div>

      {/* Client info */}
      {isLoading ? (
        <div className="flex gap-3">
          <div className="w-32 h-3 bg-amber-100 rounded animate-pulse" />
          <div className="w-40 h-3 bg-amber-100 rounded animate-pulse" />
        </div>
      ) : group ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {group.clientInfo.name}
          </span>
          {group.clientInfo.email && <span>{group.clientInfo.email}</span>}
          {group.clientInfo.phone && <span>{group.clientInfo.phone}</span>}
        </div>
      ) : null}

      {/* Occurrence table */}
      {occurrenceBookings.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-amber-200 bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-amber-200 bg-amber-50/80">
                <th className="text-left px-3 py-2 font-semibold text-amber-800">
                  Date
                </th>
                <th className="text-left px-3 py-2 font-semibold text-amber-800">
                  Status
                </th>
                <th className="text-left px-3 py-2 font-semibold text-amber-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {[...occurrenceBookings]
                .sort((a, b) => Number(a.startDate - b.startDate))
                .map((occ, idx) => {
                  const occStatus = occ.status as string;
                  return (
                    <tr
                      key={occ.id.toString()}
                      data-ocid={`admin.bookings.recurring_occurrence.${idx + 1}`}
                      className="border-b border-amber-100 last:border-0 hover:bg-amber-50/50"
                    >
                      <td className="px-3 py-2 font-medium">
                        {formatDate(occ.startDate)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={occStatus} />
                      </td>
                      <td className="px-3 py-2">
                        {occStatus === "pending" && (
                          <Button
                            size="sm"
                            data-ocid={`admin.bookings.recurring_occurrence.confirm_button.${idx + 1}`}
                            className="text-xs rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-6 px-2"
                            onClick={() =>
                              updateStatus.mutate(
                                { bookingId: occ.id, status: "confirmed" },
                                { onSuccess: () => toast.success("Confirmed") },
                              )
                            }
                          >
                            Confirm
                          </Button>
                        )}
                        {!["cancelled", "completed"].includes(occStatus) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`admin.bookings.recurring_occurrence.cancel_button.${idx + 1}`}
                            className="text-xs text-destructive hover:bg-destructive/10 h-6 px-2 rounded-full ml-1"
                            onClick={() =>
                              updateStatus.mutate(
                                { bookingId: occ.id, status: "cancelled" },
                                { onSuccess: () => toast.success("Cancelled") },
                              )
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No occurrences loaded yet.
        </p>
      )}
    </div>
  );
}

function AddSitterDialog({ onClose }: { onClose: () => void }) {
  const createSitter = useCreateSitter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [rate, setRate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);

  const toggleService = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleSubmit = async () => {
    if (!name || !bio || !location || !rate) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createSitter.mutateAsync({
        name,
        bio,
        location,
        hourlyRate: BigInt(rate),
        photoUrl,
        services,
        phone: phone.replace(/\D/g, ""),
      });
      toast.success(`${name} added as a sitter`);
      onClose();
    } catch {
      toast.error("Failed to add sitter");
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Location *</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Daily Rate ($) *</Label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="35"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Phone Number</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Bio *</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about this sitter..."
            className="rounded-lg resize-none"
            rows={3}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <PhotoUpload
            currentPhotoUrl={photoUrl || undefined}
            onUploadComplete={(url) => setPhotoUrl(url)}
            label="Profile Photo"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Services</Label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SERVICES.map((svc) => (
              <label
                key={svc}
                htmlFor={`svc-admin-${svc}`}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  id={`svc-admin-${svc}`}
                  checked={services.includes(svc)}
                  onCheckedChange={() => toggleService(svc)}
                />
                {svc}
              </label>
            ))}
          </div>
        </div>
      </div>
      <Button
        data-ocid="admin.add_sitter.submit_button"
        onClick={handleSubmit}
        disabled={createSitter.isPending}
        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        {createSitter.isPending ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          "Add Sitter"
        )}
      </Button>
    </div>
  );
}

function EditSitterDialog({
  sitter,
  onClose,
}: {
  sitter: Public;
  onClose: () => void;
}) {
  const updateSitterMut = useUpdateSitter();
  const [name, setName] = useState(sitter.name);
  const [bio, setBio] = useState(sitter.bio ?? "");
  const [location, setLocation] = useState(sitter.location);
  const [rate, setRate] = useState(String(Number(sitter.hourlyRate)));
  const [photoUrl, setPhotoUrl] = useState(sitter.photoUrl ?? "");
  const [phone, setPhone] = useState(sitter.phone ?? "");
  const [services, setServices] = useState<string[]>(sitter.services ?? []);
  const [yearsExperience, setYearsExperience] = useState(
    String(
      (sitter as unknown as Record<string, unknown>)?.yearsExperience ?? "",
    ),
  );
  const [certifications, setCertifications] = useState(
    String(
      (sitter as unknown as Record<string, unknown>)?.certifications ?? "",
    ),
  );
  const [languages, setLanguages] = useState(
    String((sitter as unknown as Record<string, unknown>)?.languages ?? ""),
  );
  const [homeEnvironment, setHomeEnvironment] = useState(
    String(
      (sitter as unknown as Record<string, unknown>)?.homeEnvironment ?? "",
    ),
  );
  const [emergencyContact, setEmergencyContact] = useState(
    String(
      (sitter as unknown as Record<string, unknown>)?.emergencyContact ?? "",
    ),
  );

  const completedBookingsCount = Number(
    (sitter as unknown as Record<string, unknown>)?.completedBookingsCount ?? 0,
  );

  const toggleService = (s: string) =>
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const handleSubmit = async () => {
    if (!name || !bio || !location || !rate) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await updateSitterMut.mutateAsync({
        id: sitter.id,
        name,
        bio,
        location,
        photoUrl,
        services,
        hourlyRate: BigInt(rate),
        phone: phone.replace(/\D/g, ""),
        isActive: sitter.isActive,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(yearsExperience
          ? { yearsExperience: Number(yearsExperience) }
          : {}),
        ...(certifications ? { certifications } : {}),
        ...(languages ? { languages } : {}),
        ...(homeEnvironment ? { homeEnvironment } : {}),
        ...(emergencyContact ? { emergencyContact } : {}),
      } as Parameters<typeof updateSitterMut.mutateAsync>[0]);
      toast.success(`${name} updated`);
      onClose();
    } catch {
      toast.error("Failed to update sitter");
    }
  };

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 w-full">
      {/* Completed bookings badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 gap-1 font-medium">
          <Star size={11} className="fill-amber-500 text-amber-500" />
          {completedBookingsCount} completed booking
          {completedBookingsCount !== 1 ? "s" : ""}
        </Badge>
        {sitter.isActive ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-medium">
            Active
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-medium">
            Pending
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Core fields */}
        <div className="space-y-1.5 col-span-2">
          <Label>Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Location *</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Daily Rate ($) *</Label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="35"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Phone Number</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Bio *</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about this sitter..."
            className="rounded-lg resize-none"
            rows={3}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <PhotoUpload
            currentPhotoUrl={photoUrl || undefined}
            onUploadComplete={(url) => setPhotoUrl(url)}
            label="Profile Photo"
          />
        </div>

        {/* Extended profile fields */}
        <div className="space-y-1.5">
          <Label>Years of Experience</Label>
          <Input
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="e.g. 5"
            min={0}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Languages Spoken</Label>
          <Input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder="English, Spanish"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Certifications &amp; Training</Label>
          <Textarea
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="Pet First Aid, Fear-Free Certified..."
            className="rounded-lg resize-none"
            rows={2}
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Home Environment</Label>
          <Textarea
            value={homeEnvironment}
            onChange={(e) => setHomeEnvironment(e.target.value)}
            placeholder="Fenced yard, no other pets, dog-friendly home..."
            className="rounded-lg resize-none"
            rows={2}
          />
        </div>
        {/* Emergency Contact — admin-only private field */}
        <div className="space-y-1.5 col-span-2">
          <div className="flex items-center gap-2">
            <Label>Emergency Contact</Label>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
              <Lock size={9} />
              Admin Only · Private
            </span>
          </div>
          <Input
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Name, phone, relationship"
            className="rounded-lg"
          />
        </div>

        {/* Services */}
        <div className="space-y-2 col-span-2">
          <Label>Services</Label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SERVICES.map((svc) => (
              <label
                key={svc}
                htmlFor={`edit-svc-${sitter.id}-${svc}`}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  id={`edit-svc-${sitter.id}-${svc}`}
                  checked={services.includes(svc)}
                  onCheckedChange={() => toggleService(svc)}
                />
                {svc}
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button
        data-ocid="admin.edit_sitter.save_button"
        onClick={handleSubmit}
        disabled={updateSitterMut.isPending}
        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
      >
        {updateSitterMut.isPending ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}

// Item 6: Admin badge editor - toggle badges in sitter bio
const ALL_BADGES = ["Background Checked", "5+ Years Experience", "Top Sitter"];

function AdminBadgeEditor({ sitter }: { sitter: Public }) {
  const updateSitterMut = useUpdateSitter();
  const { badges, cleanBio } = parseBadges(sitter.bio ?? "");
  const [localBadges, setLocalBadges] = useState<string[]>(badges);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const badgePrefix =
      localBadges.length > 0 ? `[badges:${localBadges.join(",")}]` : "";
    const newBio = badgePrefix
      ? `${badgePrefix}${cleanBio ? ` ${cleanBio}` : ""}`
      : cleanBio;
    try {
      await updateSitterMut.mutateAsync({
        id: sitter.id,
        name: sitter.name,
        bio: newBio,
        location: sitter.location,
        photoUrl: sitter.photoUrl,
        services: sitter.services,
        hourlyRate: sitter.hourlyRate,
        phone: sitter.phone ?? "",
        isActive: sitter.isActive,
      });
      toast.success("Badges updated!");
    } catch {
      toast.error("Failed to update badges");
    }
    setSaving(false);
  };

  return (
    <div className="p-3 space-y-2 min-w-[200px]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Badges
      </p>
      {ALL_BADGES.map((badge) => (
        <label
          key={badge}
          htmlFor={`badge-${sitter.id}-${badge}`}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox
            id={`badge-${sitter.id}-${badge}`}
            checked={localBadges.includes(badge)}
            onCheckedChange={(checked) =>
              setLocalBadges((prev) =>
                checked ? [...prev, badge] : prev.filter((b) => b !== badge),
              )
            }
          />
          <span className="text-sm">{badge}</span>
        </label>
      ))}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-1 rounded-full bg-primary text-primary-foreground h-7 text-xs"
      >
        {saving ? "Saving..." : "Save Badges"}
      </Button>
    </div>
  );
}

function AnalyticsTab({
  bookings,
  sitters,
  payments,
  setActiveTab,
}: {
  bookings: Public__8[];
  sitters: Public[];
  payments: Public__6[];
  setActiveTab?: (tab: string) => void;
}) {
  // Item 9: date range filter state
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">(
    "all",
  );

  // ── ZIP Lookup Usage Meter state ───────────────────────────────────────────
  const [usageStats, setUsageStats] = useState<UsageStats>(() =>
    getUsageStats(),
  );
  const [newDailyLimit, setNewDailyLimit] = useState<string>(() =>
    String(getDailyLimit()),
  );
  const [newMonthlyLimit, setNewMonthlyLimit] = useState<string>(() =>
    String(getMonthlyLimit()),
  );
  const [limitsSaved, setLimitsSaved] = useState(false);

  // ── Uncovered demand ZIP data ──────────────────────────────────────────────
  const [topDemandZips, setTopDemandZips] = useState(() =>
    getTopUncoveredZips(5),
  );

  // Refresh usage stats every 5s so the meter stays live
  useEffect(() => {
    const id = setInterval(() => {
      setUsageStats(getUsageStats());
      setTopDemandZips(getTopUncoveredZips(5));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function handleSaveLimits() {
    const daily = Number.parseInt(newDailyLimit, 10);
    const monthly = Number.parseInt(newMonthlyLimit, 10);
    if (
      Number.isNaN(daily) ||
      Number.isNaN(monthly) ||
      daily < 1 ||
      monthly < 1
    )
      return;
    saveLimitsLocally(daily, monthly);
    setUsageStats(getUsageStats());
    setLimitsSaved(true);
    setTimeout(() => setLimitsSaved(false), 2500);
  }

  // ── Auto-refresh countdown indicator ──────────────────────────────────────
  const [secondsToRefresh, setSecondsToRefresh] = useState(15);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToRefresh((s) => (s <= 1 ? 15 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Backend-driven pending revenue — replaces all local calculation
  const { data: pendingRevenueRaw } = useAdminPendingRevenue();
  // Per-booking breakdown for transparent pending revenue
  const { data: pendingBreakdown = [] } = useAdminPendingRevenueBreakdown();
  const [showPendingBreakdown, setShowPendingBreakdown] = useState(false);
  // Backend-driven booking stats for status counts (all-time only)
  const { data: bookingStats } = useAdminBookingStats();

  const cutoff = (() => {
    if (dateRange === "all") return 0;
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return Date.now() - days * 86400000;
  })();

  const filteredBookings =
    dateRange === "all"
      ? bookings
      : bookings.filter((b) => Number(b.createdAt / 1_000_000n) >= cutoff);

  const filteredPayments =
    dateRange === "all"
      ? payments
      : payments.filter((p) => {
          const booking = bookings.find((b) => b.id === p.bookingId);
          return booking
            ? Number(booking.createdAt / 1_000_000n) >= cutoff
            : false;
        });

  const totalRevenue = filteredPayments
    .filter((p) => p.status === PaymentStatus.paid)
    .reduce((sum, p) => sum + Number(p.totalAmount), 0);

  // Pending revenue: always use backend value (correct for all time).
  // For filtered ranges we fall back to local calculation since the backend
  // returns an unfiltered aggregate. The backend result is authoritative for
  // the "All Time" default view which is what was reported as broken.
  const pendingRevenue = (() => {
    if (dateRange === "all" && pendingRevenueRaw !== undefined) {
      // Backend returns value in cents — display as dollars
      return pendingRevenueRaw / 100;
    }
    // Filtered range: local calculation (approximate)
    // All values kept in dollars for consistent display (no /100 needed at render)
    const bookingIdsWithPayment = new Set(
      filteredPayments.map((p) => p.bookingId.toString()),
    );
    // totalAmount is stored in cents → divide by 100 to get dollars
    const pendingFromPayments = filteredPayments
      .filter((p) => p.status !== PaymentStatus.paid)
      .reduce((sum, p) => sum + Number(p.totalAmount) / 100, 0);
    // ratePerHour is stored in dollars → result is already dollars
    const pendingFromUnpaidBookings = filteredBookings
      .filter((b) => {
        const status = b.status as string;
        return (
          (status === "pending" || status === "confirmed") &&
          !bookingIdsWithPayment.has(b.id.toString())
        );
      })
      .reduce((sum, b) => {
        if (b.serviceSchedule && b.serviceSchedule.length > 0) {
          const slotTotal = b.serviceSchedule
            .flatMap((d) => d.slots ?? [])
            .reduce((s, slot) => {
              const hours = Number(slot.durationMinutes ?? 60n) / 60;
              return s + hours * Number(slot.ratePerHour ?? 0n);
            }, 0);
          if (slotTotal > 0) return sum + slotTotal;
        }
        return sum;
      }, 0);
    return pendingFromPayments + pendingFromUnpaidBookings;
  })();

  // Item 9: avg booking value — totalAmount is in cents, divide by 100 for dollars
  const avgBookingValue =
    filteredPayments.length > 0
      ? filteredPayments.reduce((sum, p) => sum + Number(p.totalAmount), 0) /
        filteredPayments.length /
        100
      : 0;

  // Status counts: use backend stats for "all time" (accurate), local filter for date ranges
  const statusCounts = {
    pending:
      dateRange === "all" && bookingStats
        ? bookingStats.pendingCount
        : filteredBookings.filter((b) => (b.status as string) === "pending")
            .length,
    confirmed:
      dateRange === "all" && bookingStats
        ? bookingStats.confirmedCount
        : filteredBookings.filter((b) => (b.status as string) === "confirmed")
            .length,
    completed:
      dateRange === "all" && bookingStats
        ? bookingStats.completedCount
        : filteredBookings.filter((b) => (b.status as string) === "completed")
            .length,
    cancelled:
      dateRange === "all" && bookingStats
        ? bookingStats.cancelledCount
        : filteredBookings.filter((b) => (b.status as string) === "cancelled")
            .length,
  };
  const maxCount = Math.max(...Object.values(statusCounts), 1);

  // Item 9: top sitters with booking count AND revenue (paid + pending booking value)
  const sitterStats = sitters
    .map((s) => {
      const sitterBookings = filteredBookings.filter((b) =>
        b.sitterIds?.includes(s.id),
      );
      const sitterPayments = filteredPayments.filter((p) =>
        sitterBookings.some((b) => b.id === p.bookingId),
      );
      // Sum paid payment amounts (cents → dollars)
      const paidRevenue = sitterPayments
        .filter((p) => p.status === PaymentStatus.paid)
        .reduce((sum, p) => sum + Number(p.totalAmount) / 100, 0);
      // Add estimated value of pending/confirmed bookings that have no payment record yet
      const bookingIdsWithPayment = new Set(
        sitterPayments.map((p) => p.bookingId.toString()),
      );
      const pendingValue = sitterBookings
        .filter((b) => {
          const status = b.status as string;
          return (
            (status === "pending" || status === "confirmed") &&
            !bookingIdsWithPayment.has(b.id.toString())
          );
        })
        .reduce((sum, b) => {
          if (b.serviceSchedule && b.serviceSchedule.length > 0) {
            const slotTotal = b.serviceSchedule
              .flatMap((d) => d.slots ?? [])
              .reduce((s, slot) => {
                const hours = Number(slot.durationMinutes ?? 60n) / 60;
                return s + hours * Number(slot.ratePerHour ?? 0n);
              }, 0);
            if (slotTotal > 0) return sum + slotTotal;
          }
          return sum;
        }, 0);
      return {
        name: s.name,
        count: sitterBookings.length,
        revenue: paidRevenue + pendingValue,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentBookings = [...filteredBookings]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 5);

  // Item 9: repeat clients
  const emailCounts: Record<string, number> = {};
  for (const b of filteredBookings) {
    if (b.clientEmail)
      emailCounts[b.clientEmail] = (emailCounts[b.clientEmail] || 0) + 1;
  }
  const repeatClients = Object.values(emailCounts).filter((c) => c >= 2).length;

  // Item 9: weekly booking trend (last 8 weeks)
  const weeklyData: Array<{ label: string; count: number }> = [];
  const now = Date.now();
  for (let w = 7; w >= 0; w--) {
    const weekStart = now - (w + 1) * 7 * 86400000;
    const weekEnd = now - w * 7 * 86400000;
    const label = new Date(weekStart).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const count = bookings.filter((b) => {
      const ts = Number(b.createdAt / 1_000_000n);
      return ts >= weekStart && ts < weekEnd;
    }).length;
    weeklyData.push({ label, count });
  }
  const maxWeekCount = Math.max(...weeklyData.map((w) => w.count), 1);

  // Item 9: peak day of week
  const dayCounts: Record<number, number> = {};
  for (const b of filteredBookings) {
    const day = new Date(Number(b.createdAt / 1_000_000n)).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const peakDayNum = Object.entries(dayCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const peakDay =
    peakDayNum !== undefined ? dayNames[Number(peakDayNum)] : "N/A";

  const STAT_COLORS: Record<string, string> = {
    pending: "bg-amber-500",
    confirmed: "bg-blue-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-400",
  };

  // Service insights from backend
  const { data: serviceAnalytics, isLoading: serviceAnalyticsLoading } =
    useAdminBookingAnalytics();

  const SERVICE_BAR_COLORS = [
    "bg-indigo-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
  ];

  const formatDuration = (mins: number): string => {
    if (mins < 60) return `${Math.round(mins)}m`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatTimeToPayment = (mins: number): string => {
    if (mins < 60) return `${Math.round(mins)} min`;
    if (mins < 1440) return `${(mins / 60).toFixed(1)} hrs`;
    return `${(mins / 1440).toFixed(1)} days`;
  };

  // Sort service type counts descending
  const sortedServiceCounts = serviceAnalytics
    ? [...serviceAnalytics.serviceTypeCounts].sort(
        (a, b) => Number(b[1]) - Number(a[1]),
      )
    : [];
  const maxServiceCount = sortedServiceCounts.length
    ? Number(sortedServiceCounts[0][1])
    : 1;

  const serviceRevenueMap = new Map(
    serviceAnalytics?.serviceTypeRevenue?.map(([svc, rev]) => [svc, rev]) ?? [],
  );

  return (
    <div className="space-y-6">
      {/* Item 9: Date range filter + auto-refresh indicator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-display font-semibold text-lg">Analytics</h3>
          <span
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            data-ocid="admin.analytics.refresh_indicator"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Live data · Auto-refreshing every 15s
            <span className="text-muted-foreground/60">
              (next in {secondsToRefresh}s)
            </span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              data-ocid={`admin.analytics.${range}.tab`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${dateRange === range ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              {range === "all"
                ? "All Time"
                : range === "7d"
                  ? "7 Days"
                  : range === "30d"
                    ? "30 Days"
                    : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `$${(totalRevenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            Icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Bookings",
            value: filteredBookings.length,
            Icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Sitters",
            value: sitters.filter((s) => s.isActive).length,
            Icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map(({ label, value, Icon, color, bg }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div
              className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}
            >
              <Icon size={18} className={color} />
            </div>
            <p className={`font-display font-bold text-2xl ${color}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}

        {/* Pending Revenue card — separate to support breakdown */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-2 shrink-0">
            <Clock size={18} className="text-amber-600" />
          </div>
          {dateRange === "all" && pendingRevenueRaw === undefined ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse mb-0.5" />
          ) : (
            <p className="font-display font-bold text-2xl text-amber-600">
              $
              {pendingRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            Pending Revenue
          </p>

          {/* Breakdown toggle — only shown for "all time" view where backend data is authoritative */}
          {dateRange === "all" && pendingBreakdown.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/60">
              <button
                type="button"
                data-ocid="admin.analytics.pending_revenue.toggle"
                onClick={() => setShowPendingBreakdown((v) => !v)}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {showPendingBreakdown ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                {showPendingBreakdown ? "Hide" : "Show"} breakdown
              </button>

              {showPendingBreakdown && (
                <ul
                  data-ocid="admin.analytics.pending_revenue.breakdown"
                  className="mt-1.5 space-y-1"
                >
                  {pendingBreakdown.map((entry) => (
                    <li
                      key={entry.bookingId.toString()}
                      className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground"
                    >
                      <span className="truncate">
                        <span className="font-mono text-foreground">
                          #{entry.bookingId.toString()}
                        </span>
                        {" — "}
                        <span>{entry.clientName}</span>
                      </span>
                      <span className="font-semibold text-amber-700 shrink-0">
                        $
                        {(Number(entry.amount) / 100).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ZIP Lookup Usage Meter ────────────────────────────────────────── */}
      {(() => {
        const dailyPct =
          usageStats.dailyLimit > 0
            ? Math.min(
                100,
                Math.round(
                  (usageStats.dailyCount / usageStats.dailyLimit) * 100,
                ),
              )
            : 0;
        const monthlyPct =
          usageStats.monthlyLimit > 0
            ? Math.min(
                100,
                Math.round(
                  (usageStats.monthlyCount / usageStats.monthlyLimit) * 100,
                ),
              )
            : 0;
        const dailyAtLimit = usageStats.dailyCount >= usageStats.dailyLimit;
        const monthlyAtLimit =
          usageStats.monthlyCount >= usageStats.monthlyLimit;
        const nearLimit = dailyPct >= 80 || monthlyPct >= 80;
        const atLimit = dailyAtLimit || monthlyAtLimit;

        const barColor = (pct: number) =>
          pct >= 100
            ? "bg-red-500"
            : pct >= 80
              ? "bg-amber-500"
              : "bg-emerald-500";

        return (
          <div
            data-ocid="admin.analytics.zip_usage.card"
            className="bg-card rounded-xl border border-border p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Activity size={16} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base leading-tight">
                    ZIP Lookup Usage
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    zippopotam.us API calls · resets daily &amp; monthly
                  </p>
                </div>
              </div>
              {atLimit && (
                <span
                  data-ocid="admin.analytics.zip_usage.hard_stop_badge"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200"
                >
                  <Lock size={11} /> Hard Stop Active
                </span>
              )}
            </div>

            {/* Warning banner */}
            {nearLimit && !atLimit && (
              <div
                data-ocid="admin.analytics.zip_usage.warning_banner"
                className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5"
              >
                <AlertTriangle
                  size={15}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-800 font-medium">
                  Approaching limit — API fallback to static lookup will
                  activate automatically when limit is reached.
                </p>
              </div>
            )}

            {atLimit && (
              <div
                data-ocid="admin.analytics.zip_usage.at_limit_banner"
                className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5"
              >
                <AlertTriangle
                  size={15}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <p className="text-xs text-red-800 font-medium">
                  Limit reached — ZIP lookups are now using the static fallback.
                  No further API calls will be made until the counter resets.
                </p>
              </div>
            )}

            {/* Daily + Monthly bars */}
            <div className="space-y-3">
              {/* Daily */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Daily ({usageStats.dailyDate})
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {usageStats.dailyCount} / {usageStats.dailyLimit}
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      {dailyPct}%
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    data-ocid="admin.analytics.zip_usage.daily_bar"
                    className={`h-full rounded-full transition-all ${barColor(dailyPct)}`}
                    style={{ width: `${dailyPct}%` }}
                  />
                </div>
              </div>

              {/* Monthly */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Monthly ({usageStats.month})
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {usageStats.monthlyCount} / {usageStats.monthlyLimit}
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      {monthlyPct}%
                    </span>
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    data-ocid="admin.analytics.zip_usage.monthly_bar"
                    className={`h-full rounded-full transition-all ${barColor(monthlyPct)}`}
                    style={{ width: `${monthlyPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Limit controls */}
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2.5">
                Adjust Limits
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="zip-daily-limit"
                    className="text-xs text-muted-foreground"
                  >
                    Daily limit
                  </Label>
                  <Input
                    id="zip-daily-limit"
                    data-ocid="admin.analytics.zip_usage.daily_limit_input"
                    type="number"
                    min={1}
                    max={10000}
                    value={newDailyLimit}
                    onChange={(e) => setNewDailyLimit(e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="zip-monthly-limit"
                    className="text-xs text-muted-foreground"
                  >
                    Monthly limit
                  </Label>
                  <Input
                    id="zip-monthly-limit"
                    data-ocid="admin.analytics.zip_usage.monthly_limit_input"
                    type="number"
                    min={1}
                    max={100000}
                    value={newMonthlyLimit}
                    onChange={(e) => setNewMonthlyLimit(e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <Button
                  data-ocid="admin.analytics.zip_usage.save_limits_button"
                  size="sm"
                  onClick={handleSaveLimits}
                  className="h-8"
                  variant={limitsSaved ? "outline" : "default"}
                >
                  {limitsSaved ? (
                    <>
                      <CheckCircle2
                        size={13}
                        className="mr-1.5 text-emerald-600"
                      />{" "}
                      Saved
                    </>
                  ) : (
                    "Save Limits"
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Uncovered Demand ZIPs card ─────────────────────────────────── */}
      <div
        data-ocid="admin.analytics.demand_zips.card"
        className="bg-card rounded-xl border border-border p-5"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Flame size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base leading-tight">
                📍 Uncovered Demand ZIPs
              </h3>
              <p className="text-xs text-muted-foreground">
                Areas clients searched with no available sitters
              </p>
            </div>
          </div>
          {topDemandZips.length > 0 && (
            <button
              type="button"
              data-ocid="admin.analytics.demand_zips.view_all_button"
              className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              onClick={() => {
                if (setActiveTab) setActiveTab("coverage");
              }}
            >
              View all in Coverage →
            </button>
          )}
        </div>

        {topDemandZips.length === 0 ? (
          <p
            className="text-sm text-muted-foreground py-4 text-center"
            data-ocid="admin.analytics.demand_zips.empty_state"
          >
            No demand gaps detected yet — they'll appear here when clients
            search areas with no sitters.
          </p>
        ) : (
          <div className="space-y-2">
            {topDemandZips.map((item, i) => (
              <div
                key={item.zip}
                data-ocid={`admin.analytics.demand_zips.item.${i + 1}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                style={{
                  background:
                    item.count >= 3
                      ? "oklch(0.50 0.18 27 / 0.05)"
                      : "oklch(0.72 0.18 55 / 0.04)",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-sm font-bold text-foreground shrink-0">
                    {item.zip}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {item.areaName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.isHotDemand && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                      <Flame size={9} /> Hot
                    </span>
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    {item.count} search{item.count !== 1 ? "es" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item 9: Extra metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Avg Booking Value
          </p>
          <p className="font-display font-bold text-xl text-foreground">
            ${avgBookingValue > 0 ? avgBookingValue.toFixed(0) : "—"}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Repeat Clients</p>
          <p className="font-display font-bold text-xl text-foreground">
            {repeatClients}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Peak Day</p>
          <p className="font-display font-bold text-xl text-foreground">
            {peakDay}
          </p>
        </div>
      </div>

      {/* Item 9: Weekly booking trend */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display font-semibold text-base mb-4">
          Weekly Booking Trend
        </h3>
        <div className="flex items-end gap-1 h-28">
          {weeklyData.map((week) => (
            <div
              key={week.label}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-[9px] text-muted-foreground font-bold">
                {week.count > 0 ? week.count : ""}
              </span>
              <div
                className="w-full bg-muted rounded-t-sm overflow-hidden"
                style={{ height: "80px" }}
              >
                <div
                  className="w-full bg-primary rounded-t-sm transition-all"
                  style={{ height: `${(week.count / maxWeekCount) * 100}%` }}
                />
              </div>
              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                {week.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Booking status chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display font-semibold text-base mb-4">
          Booking Status Breakdown
        </h3>
        <div className="space-y-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="w-20 text-xs text-muted-foreground capitalize shrink-0">
                {status}
              </span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${STAT_COLORS[status] ?? "bg-primary"}`}
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold w-6 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Recurring Bookings breakdown ────────────────────────────────── */}
      {(() => {
        const recurringCount = filteredBookings.filter((bk) => {
          if ((bk as unknown as Record<string, unknown>).isRecurring === true)
            return true;
          const raw = (bk as unknown as Record<string, unknown>).groupId;
          return (
            (Array.isArray(raw) && raw.length > 0) ||
            (typeof raw === "string" && raw.length > 0)
          );
        }).length;
        const oneTimeCount = filteredBookings.length - recurringCount;
        const total = filteredBookings.length;
        const recurringPct =
          total > 0 ? Math.round((recurringCount / total) * 100) : 0;
        const oneTimePct = total > 0 ? 100 - recurringPct : 0;

        // Count distinct active recurring groups by groupId
        const groupIds = new Set<string>();
        for (const bk of filteredBookings) {
          const raw = (bk as unknown as Record<string, unknown>).groupId;
          if (
            Array.isArray(raw) &&
            raw.length > 0 &&
            typeof raw[0] === "string"
          )
            groupIds.add(raw[0]);
          else if (typeof raw === "string" && raw.length > 0) groupIds.add(raw);
        }
        const activeSeriesCount = groupIds.size;

        return (
          <div
            data-ocid="admin.analytics.recurring_section"
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-amber-600" />
              </div>
              <h3 className="font-display font-semibold text-base">
                Recurring Bookings
              </h3>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3">
                <p className="text-[11px] text-amber-700 font-medium mb-0.5">
                  Active Series
                </p>
                <p className="font-display font-bold text-xl text-amber-800">
                  {activeSeriesCount}
                </p>
              </div>
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
                <p className="text-[11px] text-indigo-700 font-medium mb-0.5">
                  Recurring Occurrences
                </p>
                <p className="font-display font-bold text-xl text-indigo-800">
                  {recurringCount}
                </p>
              </div>
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-[11px] text-muted-foreground font-medium mb-0.5">
                  One-time Bookings
                </p>
                <p className="font-display font-bold text-xl text-foreground">
                  {oneTimeCount}
                </p>
              </div>
            </div>

            {/* Visual bar — recurring vs one-time */}
            {total > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    Recurring
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${recurringPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-amber-700 w-10 text-right shrink-0">
                    {recurringPct}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    One-time
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/40 rounded-full transition-all"
                      style={{ width: `${oneTimePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground w-10 text-right shrink-0">
                    {oneTimePct}%
                  </span>
                </div>
              </div>
            )}
            {total === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No bookings in this period to analyze.
              </p>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item 9: Top sitters with revenue */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-display font-semibold text-base mb-4">
            Top Sitters
          </h3>
          {sitterStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data yet
            </p>
          ) : (
            <div className="space-y-2.5">
              {sitterStats.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-muted-foreground shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {s.name}
                  </span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium shrink-0">
                    {s.count} bookings
                  </span>
                  {s.revenue > 0 && (
                    <span className="text-xs text-emerald-600 font-medium shrink-0">
                      ${s.revenue.toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-display font-semibold text-base mb-4">
            Recent Bookings
          </h3>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No bookings yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((b) => (
                <div key={b.id.toString()} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{b.id.toString()}
                  </span>
                  <span className="text-sm flex-1 truncate">
                    {b.clientName}
                  </span>
                  <StatusBadge status={b.status as string} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Service Insights ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">
              Service Insights
            </h3>
            <p className="text-xs text-muted-foreground">
              Breakdown by service type across all completed bookings
            </p>
          </div>
        </div>

        {serviceAnalyticsLoading ? (
          <div
            data-ocid="admin.analytics.service_insights.loading_state"
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-5 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : sortedServiceCounts.length === 0 ? (
          <div
            data-ocid="admin.analytics.service_insights.empty_state"
            className="text-center py-8 text-muted-foreground"
          >
            <BarChart3
              size={32}
              className="mx-auto mb-3 text-muted-foreground/50"
            />
            <p className="text-sm font-medium">No service data yet</p>
            <p className="text-xs mt-1">
              Service analytics will populate once bookings are completed.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedServiceCounts.map(([svc, count], i) => {
              const rev = Number(serviceRevenueMap.get(svc) ?? 0n);
              const pct =
                maxServiceCount > 0
                  ? (Number(count) / maxServiceCount) * 100
                  : 0;
              const barColor =
                SERVICE_BAR_COLORS[i % SERVICE_BAR_COLORS.length];
              return (
                <div key={svc} className="flex items-center gap-3">
                  <span className="w-28 sm:w-36 text-xs text-muted-foreground shrink-0 truncate">
                    {svc}
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground shrink-0 w-14 text-right">
                    {Number(count)} bk
                  </span>
                  {rev > 0 && (
                    <span className="text-xs text-emerald-600 font-medium shrink-0 w-16 text-right hidden sm:block">
                      ${(rev / 100).toFixed(0)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance Metric Cards */}
      {(serviceAnalyticsLoading || serviceAnalytics) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {serviceAnalyticsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-4 space-y-2"
                >
                  <div className="w-24 h-3 bg-muted rounded animate-pulse" />
                  <div className="w-16 h-6 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-indigo-500 shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Avg Service Duration
                  </p>
                </div>
                <p className="font-display font-bold text-xl text-foreground">
                  {serviceAnalytics &&
                  serviceAnalytics.avgServiceDurationMinutes > 0
                    ? formatDuration(serviceAnalytics.avgServiceDurationMinutes)
                    : "—"}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Avg Time to Payment
                  </p>
                </div>
                <p className="font-display font-bold text-xl text-foreground">
                  {serviceAnalytics &&
                  serviceAnalytics.avgTimeToPaymentMinutes > 0
                    ? formatTimeToPayment(
                        serviceAnalytics.avgTimeToPaymentMinutes,
                      )
                    : "—"}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={14} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Service Types
                  </p>
                </div>
                <p className="font-display font-bold text-xl text-foreground">
                  {serviceAnalytics
                    ? serviceAnalytics.serviceTypeCounts.length
                    : "—"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Service Duration by Type */}
      {serviceAnalytics && serviceAnalytics.serviceTypeDurations.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-display font-semibold text-base mb-4">
            Average Duration by Service
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...serviceAnalytics.serviceTypeDurations]
              .sort((a, b) => b[1] - a[1])
              .map(([svc, dur], i) => {
                const dotColors = [
                  "bg-indigo-400",
                  "bg-amber-400",
                  "bg-emerald-400",
                  "bg-violet-400",
                  "bg-rose-400",
                  "bg-cyan-400",
                  "bg-orange-400",
                ];
                const dotColor = dotColors[i % dotColors.length];
                return (
                  <div
                    key={svc}
                    className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-full px-3 py-1.5"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {svc}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(dur)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAvailabilityTab() {
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d" | "all">(
    "14d",
  );
  const [tooltip, setTooltip] = useState<{
    sitterName: string;
    date: string;
    confirmed: number;
    completed: number;
    pending: number;
    cancelled: number;
    declined: number;
    x: number;
    y: number;
  } | null>(null);

  // Use getAllBookings — no 90-day cutoff, all bookings always visible
  const {
    data: allBookingsRaw = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAllBookings();
  const { data: allSittersRaw = [] } = useAllSitters();

  // Build a sitterId -> sitterName lookup
  const sitterNameById = new Map<string, string>(
    (allSittersRaw as Public[]).map((s) => [s.id.toString(), s.name]),
  );

  // Build the date range window for display
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysBack =
    dateRange === "7d"
      ? 7
      : dateRange === "14d"
        ? 14
        : dateRange === "30d"
          ? 30
          : null; // null = all time
  const dates: string[] = [];
  if (daysBack !== null) {
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
  } else {
    // For "all" range, collect unique dates from the bookings themselves
    const uniqueDatesSet = new Set<string>();
    for (const b of allBookingsRaw as Public__8[]) {
      // ICP timestamps are in NANOSECONDS — divide by 1_000_000 for milliseconds
      const ms = Number(b.startDate) / 1_000_000;
      if (!Number.isNaN(ms) && ms > 0) {
        // Use local date (en-CA = YYYY-MM-DD) to match sitter calendar view
        uniqueDatesSet.add(new Date(ms).toLocaleDateString("en-CA"));
      }
    }
    const sorted = Array.from(uniqueDatesSet).sort();
    dates.push(...sorted);
  }

  // Aggregate bookings into sitterName -> date -> { confirmed, completed, pending, cancelled, declined }
  // using booking.startDate (nanoseconds) and booking.sitterIds — ALL 5 statuses counted
  const dataMap = new Map<
    string,
    Map<
      string,
      {
        confirmed: number;
        completed: number;
        pending: number;
        cancelled: number;
        declined: number;
      }
    >
  >();
  // Track which (sitterName, date) combos have at least one recurring booking
  const recurringMap = new Map<string, Set<string>>();

  const cutoffDate = dates[0] ?? ""; // earliest date in range
  for (const b of allBookingsRaw as Public__8[]) {
    // ICP timestamps are in NANOSECONDS — divide by 1_000_000 for milliseconds
    const ms = Number(b.startDate) / 1_000_000;
    if (Number.isNaN(ms) || ms <= 0) continue;
    // Use local date string (toLocaleDateString en-CA = YYYY-MM-DD in local time)
    // to match the date the sitter sees on their calendar
    const dateStr = new Date(ms).toLocaleDateString("en-CA");
    if (dateStr < cutoffDate) continue;
    if (daysBack !== null && !dates.includes(dateStr)) continue;

    const status = b.status as string;
    // Accept all 5 known statuses; skip unknown
    if (
      !["confirmed", "completed", "pending", "cancelled", "declined"].includes(
        status,
      )
    )
      continue;

    const bIsRecurring = (() => {
      if ((b as unknown as Record<string, unknown>).isRecurring === true)
        return true;
      const raw = (b as unknown as Record<string, unknown>).groupId;
      return (
        (Array.isArray(raw) && raw.length > 0) ||
        (typeof raw === "string" && raw.length > 0)
      );
    })();

    for (const sitterId of b.sitterIds ?? []) {
      const sitterName =
        sitterNameById.get(sitterId.toString()) ??
        `Sitter #${sitterId.toString()}`;
      if (!dataMap.has(sitterName)) {
        dataMap.set(sitterName, new Map());
      }
      const sitterMap = dataMap.get(sitterName)!;
      const existing = sitterMap.get(dateStr) ?? {
        confirmed: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        declined: 0,
      };
      sitterMap.set(dateStr, {
        confirmed: existing.confirmed + (status === "confirmed" ? 1 : 0),
        completed: existing.completed + (status === "completed" ? 1 : 0),
        pending: existing.pending + (status === "pending" ? 1 : 0),
        cancelled: existing.cancelled + (status === "cancelled" ? 1 : 0),
        declined: existing.declined + (status === "declined" ? 1 : 0),
      });
      // Track recurring marker
      if (bIsRecurring) {
        if (!recurringMap.has(sitterName))
          recurringMap.set(sitterName, new Set());
        recurringMap.get(sitterName)!.add(dateStr);
      }
    }
  }

  const sitterNames = Array.from(dataMap.keys()).sort();

  const formatDateLabel = (d: string) => {
    const dt = new Date(`${d}T00:00:00`);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCellClass = (
    confirmed: number,
    completed: number,
    pending: number,
    cancelled: number,
    declined: number,
  ): string => {
    const total = confirmed + completed + pending + cancelled + declined;
    if (total === 0) return "bg-muted/30 border border-border";
    const activeTypes = [
      confirmed > 0,
      completed > 0,
      pending > 0,
      cancelled > 0,
      declined > 0,
    ].filter(Boolean).length;
    if (activeTypes > 1) return "bg-indigo-100 border border-indigo-300";
    if (confirmed > 0) return "bg-emerald-100 border border-emerald-300";
    if (completed > 0) return "bg-sky-100 border border-sky-300";
    if (pending > 0) return "bg-amber-100 border border-amber-300";
    if (cancelled > 0) return "bg-rose-100 border border-rose-300";
    return "bg-slate-100 border border-slate-300"; // declined
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <LayoutGrid size={20} className="text-primary shrink-0" />
              Booking Activity
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              All bookings for all sitters, grouped by start date.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["7d", "14d", "30d", "all"] as const).map((r) => (
              <button
                key={r}
                type="button"
                data-ocid={`admin.availability.range.${r}`}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${dateRange === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
              >
                {r === "7d"
                  ? "Past 7 days"
                  : r === "14d"
                    ? "Past 14 days"
                    : r === "30d"
                      ? "Past 30 days"
                      : "All Time"}
              </button>
            ))}
            <Button
              data-ocid="admin.availability.refresh_button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-full gap-1.5"
              aria-label="Refresh"
            >
              {isFetching ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Clock size={12} />
              )}
              {isFetching ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
            Legend
          </span>
          {[
            { color: "bg-emerald-400", label: "Confirmed" },
            { color: "bg-sky-400", label: "Completed" },
            { color: "bg-amber-400", label: "Pending" },
            { color: "bg-rose-400", label: "Cancelled" },
            { color: "bg-slate-400", label: "Declined" },
            { color: "bg-indigo-400", label: "Mixed" },
            { color: "bg-muted-foreground/20", label: "None" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-1 ring-amber-300 shrink-0" />
            <span className="text-xs text-muted-foreground">Recurring</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          data-ocid="admin.availability.loading_state"
          className="bg-card rounded-2xl border border-border/60 p-6 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 size={14} className="animate-spin text-primary" />
            Loading booking data...
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <div
          data-ocid="admin.availability.error_state"
          className="bg-card rounded-2xl border border-destructive/30 p-10 flex flex-col items-center gap-4 text-center"
        >
          <AlertTriangle size={28} className="text-destructive" />
          <p className="font-display font-semibold">
            Could not load booking data
          </p>
          <Button
            data-ocid="admin.availability.retry_button"
            onClick={() => refetch()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sitterNames.length === 0 && (
        <div
          data-ocid="admin.availability.empty_state"
          className="bg-card rounded-2xl border border-border/60 gloss-ring p-12 flex flex-col items-center gap-5 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LayoutGrid size={28} className="text-primary" />
          </div>
          <div className="space-y-1.5">
            <p className="font-display font-semibold text-base">
              No booking activity to display
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Bookings will appear here once sitters have pending, confirmed, or
              completed bookings. Try switching to "All Time" if you expect to
              see data.
            </p>
          </div>
        </div>
      )}

      {/* Heatmap matrix */}
      {!isLoading && !isError && sitterNames.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/60 gloss-ring overflow-hidden">
          <div className="overflow-x-auto">
            <div className="relative min-w-max p-4 space-y-1">
              {/* Date header row */}
              <div className="flex items-center gap-0.5 mb-2 pl-32 sm:pl-40">
                {dates.map((d) => (
                  <div
                    key={d}
                    className="w-10 text-center text-[10px] font-medium text-muted-foreground shrink-0"
                  >
                    {formatDateLabel(d)}
                  </div>
                ))}
              </div>

              {/* Sitter rows */}
              {sitterNames.map((sitterName) => {
                const sitterMap = dataMap.get(sitterName)!;
                return (
                  <div key={sitterName} className="flex items-center gap-0.5">
                    {/* Sticky sitter name column */}
                    <div className="w-32 sm:w-40 shrink-0 pr-2">
                      <span
                        className="text-xs font-medium text-foreground truncate block"
                        title={sitterName}
                      >
                        {sitterName}
                      </span>
                    </div>

                    {/* Date cells */}
                    {dates.map((d) => {
                      const cell = sitterMap.get(d) ?? {
                        confirmed: 0,
                        completed: 0,
                        pending: 0,
                        cancelled: 0,
                        declined: 0,
                      };
                      const total =
                        cell.confirmed +
                        cell.completed +
                        cell.pending +
                        cell.cancelled +
                        cell.declined;
                      const isEmpty = total === 0;
                      const cellClass = getCellClass(
                        cell.confirmed,
                        cell.completed,
                        cell.pending,
                        cell.cancelled,
                        cell.declined,
                      );
                      const hasRecurring =
                        recurringMap.get(sitterName)?.has(d) ?? false;
                      return (
                        <div
                          key={d}
                          className={`w-10 h-9 rounded flex items-center justify-center shrink-0 cursor-default relative ${cellClass} transition-transform hover:scale-110`}
                          onMouseEnter={(e) => {
                            if (isEmpty) return;
                            const rect = (
                              e.currentTarget as HTMLElement
                            ).getBoundingClientRect();
                            setTooltip({
                              sitterName,
                              date: formatDateLabel(d),
                              confirmed: cell.confirmed,
                              completed: cell.completed,
                              pending: cell.pending,
                              cancelled: cell.cancelled,
                              declined: cell.declined,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 10,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {/* Amber recurring indicator dot — top-right corner */}
                          {hasRecurring && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 ring-1 ring-amber-200 shrink-0" />
                          )}
                          {!isEmpty && (
                            <div className="flex flex-col items-center gap-0.5">
                              {cell.confirmed > 0 && (
                                <span className="text-[9px] font-bold text-emerald-700 leading-none">
                                  {cell.confirmed}
                                </span>
                              )}
                              {cell.completed > 0 && (
                                <span className="text-[9px] font-bold text-sky-700 leading-none">
                                  {cell.completed}
                                </span>
                              )}
                              {cell.pending > 0 && (
                                <span className="text-[9px] font-bold text-amber-700 leading-none">
                                  {cell.pending}
                                </span>
                              )}
                              {cell.cancelled > 0 && (
                                <span className="text-[9px] font-bold text-rose-700 leading-none">
                                  {cell.cancelled}
                                </span>
                              )}
                              {cell.declined > 0 && (
                                <span className="text-[9px] font-bold text-slate-600 leading-none">
                                  {cell.declined}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total summary row */}
          <div className="border-t border-border px-4 py-3 flex flex-wrap gap-4">
            {(() => {
              let totalConfirmed = 0;
              let totalCompleted = 0;
              let totalPending = 0;
              let totalCancelled = 0;
              let totalDeclined = 0;
              for (const sitterMap of dataMap.values()) {
                for (const cell of sitterMap.values()) {
                  totalConfirmed += cell.confirmed;
                  totalCompleted += cell.completed;
                  totalPending += cell.pending;
                  totalCancelled += cell.cancelled;
                  totalDeclined += cell.declined;
                }
              }
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Confirmed:
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {totalConfirmed}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Completed:
                    </span>
                    <span className="text-xs font-bold text-sky-700">
                      {totalCompleted}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Pending:
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {totalPending}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Cancelled:
                    </span>
                    <span className="text-xs font-bold text-rose-700">
                      {totalCancelled}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Declined:
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {totalDeclined}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Active Sitters:
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {sitterNames.length}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Floating tooltip portal-style (positioned fixed) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs space-y-0.5 max-w-[200px]">
            <p className="font-semibold text-foreground truncate">
              {tooltip.sitterName}
            </p>
            <p className="text-muted-foreground">{tooltip.date}</p>
            <div className="flex flex-col gap-0.5 pt-1">
              {tooltip.confirmed > 0 && (
                <span className="text-emerald-700 font-medium">
                  ✓ {tooltip.confirmed} confirmed
                </span>
              )}
              {tooltip.completed > 0 && (
                <span className="text-sky-700 font-medium">
                  ★ {tooltip.completed} completed
                </span>
              )}
              {tooltip.pending > 0 && (
                <span className="text-amber-700 font-medium">
                  ◎ {tooltip.pending} pending
                </span>
              )}
              {tooltip.cancelled > 0 && (
                <span className="text-rose-700 font-medium">
                  ✕ {tooltip.cancelled} cancelled
                </span>
              )}
              {tooltip.declined > 0 && (
                <span className="text-slate-600 font-medium">
                  — {tooltip.declined} declined
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { data: savedEmail = "", isLoading: emailLoading } =
    useGetAdminNotificationEmail();
  const setEmailMut = useSetAdminNotificationEmail();
  const [notifEmail, setNotifEmail] = useState("");
  const [emailSynced, setEmailSynced] = useState(false);
  const fixSitterZips = useFixSitterZipCodes();
  const { actor: settingsActor } = useActor();

  // Stripe configuration state
  const { data: stripeConfig, isLoading: stripeConfigLoading } =
    useGetStripePublicConfig();
  const updateStripeConfig = useUpdateStripeConfig();
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripePriceId, setStripePriceId] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [stripeLiveMode, setStripeLiveMode] = useState(false);
  const [stripeConfigSynced, setStripeConfigSynced] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Free plan price ID
  const { data: currentFreePlanPriceId = "" } = useGetStripeFreePlanPriceId();
  const setFreePlanPriceIdMut = useSetStripeFreePlanPriceId();
  const [freePlanPriceId, setFreePlanPriceIdInput] = useState("");
  const [freePlanPriceIdSynced, setFreePlanPriceIdSynced] = useState(false);

  // Sync free plan price ID once loaded
  useEffect(() => {
    if (!freePlanPriceIdSynced && currentFreePlanPriceId !== undefined) {
      setFreePlanPriceIdInput(currentFreePlanPriceId);
      setFreePlanPriceIdSynced(true);
    }
  }, [currentFreePlanPriceId, freePlanPriceIdSynced]);

  // Sync notification email input once loaded
  useEffect(() => {
    if (!emailSynced && !emailLoading && savedEmail !== undefined) {
      setNotifEmail(savedEmail);
      setEmailSynced(true);
    }
  }, [savedEmail, emailLoading, emailSynced]);

  // Sync Stripe publishable key and price ID once loaded (never sync secret key — server only)
  useEffect(() => {
    if (!stripeConfigSynced && !stripeConfigLoading && stripeConfig) {
      setStripePublishableKey(stripeConfig.publishableKey ?? "");
      setStripePriceId(stripeConfig.priceId ?? "");
      setStripeLiveMode(stripeConfig.isLiveMode ?? false);
      setStripeConfigSynced(true);
    }
  }, [stripeConfig, stripeConfigLoading, stripeConfigSynced]);

  const handleSaveEmail = async () => {
    if (!notifEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      await setEmailMut.mutateAsync(notifEmail);
      toast.success("Notification email saved!");
    } catch (err) {
      toast.error(
        `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSaveStripeConfig = async () => {
    if (!stripeSecretKey && !stripeConfig?.publishableKey) {
      toast.error("Secret key is required to update Stripe configuration.");
      return;
    }
    try {
      await updateStripeConfig.mutateAsync({
        secretKey: stripeSecretKey,
        publishableKey: stripePublishableKey,
        priceId: stripePriceId,
        liveMode: stripeLiveMode,
      });
      // Save webhook secret separately if provided
      if (settingsActor && stripeWebhookSecret.trim()) {
        await settingsActor.setStripeWebhookSecret(stripeWebhookSecret.trim());
        setStripeWebhookSecret("");
      }
      setStripeSecretKey(""); // Clear secret key from state immediately after save
      toast.success(
        `Stripe configuration saved — ${stripeLiveMode ? "Live Mode ✅" : "Test Mode 🧪"}`,
      );
    } catch (err) {
      toast.error(
        `Failed to save Stripe config: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleSaveFreePlanPriceId = async () => {
    try {
      await setFreePlanPriceIdMut.mutateAsync(freePlanPriceId.trim());
      toast.success("Free plan Price ID saved!");
    } catch (err) {
      toast.error(
        `Failed to save free plan Price ID: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
        <h3 className="font-display font-semibold text-lg mb-1">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage platform configuration and administrative actions.
        </p>
      </div>

      {/* Notification Email */}
      <div
        data-ocid="admin.settings.notification_email.section"
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">
              Notification Email
            </h3>
            <p className="text-xs text-muted-foreground">
              New sitter applications and booking alerts will be sent to this
              address
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="admin-notif-email">Email Address</Label>
            <Input
              id="admin-notif-email"
              data-ocid="admin.settings.notification_email.input"
              type="email"
              value={notifEmail}
              onChange={(e) => setNotifEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={emailLoading}
              className="rounded-lg"
            />
          </div>
          <Button
            data-ocid="admin.settings.notification_email.save_button"
            onClick={handleSaveEmail}
            disabled={setEmailMut.isPending || emailLoading || !notifEmail}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full sm:w-auto shrink-0"
          >
            {setEmailMut.isPending ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
        {savedEmail && (
          <p className="text-xs text-muted-foreground">
            Currently saved:{" "}
            <span className="font-medium text-foreground">{savedEmail}</span>
          </p>
        )}
      </div>

      {/* Data Migrations */}
      <div
        data-ocid="admin.settings.migrations.section"
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Settings size={16} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base">
              Data Migrations
            </h3>
            <p className="text-xs text-muted-foreground">
              One-time fixes to update live data. All migrations are idempotent
              — safe to run more than once.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900">
              Fix Sitter Zip Codes
            </p>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Updates Linnea Berggren and Bailey Berggren's location to zip code
              80304 so they appear in Boulder Area search results.
            </p>
          </div>
          <Button
            data-ocid="admin.settings.fix_zip_codes.button"
            onClick={() => {
              fixSitterZips.mutate(undefined, {
                onSuccess: (result) => {
                  toast.success(result?.ok ?? "Zip codes updated successfully");
                },
                onError: (err) => {
                  toast.error(
                    `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                  );
                },
              });
            }}
            disabled={fixSitterZips.isPending}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shrink-0 px-6 h-10"
          >
            {fixSitterZips.isPending ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Updating…
              </>
            ) : (
              "Fix Zip Codes"
            )}
          </Button>
        </div>
      </div>

      {/* Stripe Configuration */}
      <div
        data-ocid="admin.settings.stripe.section"
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-6 space-y-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-violet-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-base">
              Stripe Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              Update Stripe API keys and subscription price without redeploying.
              Secret keys are never displayed after saving.
            </p>
          </div>
        </div>

        {/* Setup instructions */}
        <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-violet-900 flex items-center gap-1.5">
            <HelpCircle size={13} className="shrink-0" />
            How to set up Stripe live payments
          </p>
          <ol className="text-xs text-violet-800 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              Go to <strong>Stripe Dashboard → Developers → API keys</strong>{" "}
              and copy your <strong>Live Secret Key</strong> (
              <code>sk_live_…</code>) and <strong>Live Publishable Key</strong>{" "}
              (<code>pk_live_…</code>).
            </li>
            <li>
              Go to <strong>Stripe Dashboard → Products</strong>, find or create
              your <strong>$15/month recurring subscription product</strong>,
              and copy the <strong>Price ID</strong> (<code>price_…</code>).
            </li>
            <li>
              Go to <strong>Stripe Dashboard → Developers → Webhooks</strong>{" "}
              and add a new endpoint:
              <br />
              <code className="bg-violet-100 px-1.5 py-0.5 rounded text-[11px] font-mono break-all">
                https://pawspect.co/webhook
              </code>
              <br />
              Listen for events:{" "}
              <code className="text-[11px]">customer.subscription.created</code>
              ,{" "}
              <code className="text-[11px]">customer.subscription.updated</code>
              ,{" "}
              <code className="text-[11px]">customer.subscription.deleted</code>
              , <code className="text-[11px]">invoice.payment_succeeded</code>,{" "}
              <code className="text-[11px]">invoice.payment_failed</code>
            </li>
            <li>
              Copy the <strong>Webhook Signing Secret</strong> (
              <code>whsec_…</code>) from the webhook endpoint page and paste it
              below.
            </li>
            <li>
              Paste all keys below, enable <strong>Live Mode</strong>, and click{" "}
              <strong>Save</strong>.
            </li>
          </ol>
        </div>

        {/* Current mode badge */}
        {!stripeConfigLoading && stripeConfig && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                stripeConfig.isLiveMode
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${stripeConfig.isLiveMode ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {stripeConfig.isLiveMode ? "Live Mode" : "Test Mode"}
            </span>
            {stripeConfig.publishableKey && (
              <span className="text-xs text-muted-foreground font-mono truncate">
                pk: {stripeConfig.publishableKey.slice(0, 16)}…
              </span>
            )}
          </div>
        )}

        <div className="space-y-3">
          {/* Secret key — write-only */}
          <div className="space-y-1.5">
            <Label htmlFor="stripe-secret-key">
              Secret Key{" "}
              <span className="text-muted-foreground font-normal">
                (sk_test_… or sk_live_…)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="stripe-secret-key"
                data-ocid="admin.settings.stripe.secret_key.input"
                type={showSecretKey ? "text" : "password"}
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder="Enter new secret key (leave blank to keep current)"
                className="rounded-lg pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showSecretKey ? "Hide key" : "Show key"}
              >
                {showSecretKey ? <Lock size={14} /> : <ShieldCheck size={14} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Never stored in frontend state after saving. Leave blank to keep
              the current key.
            </p>
          </div>

          {/* Publishable key */}
          <div className="space-y-1.5">
            <Label htmlFor="stripe-publishable-key">
              Publishable Key{" "}
              <span className="text-muted-foreground font-normal">
                (pk_test_… or pk_live_…)
              </span>
            </Label>
            <Input
              id="stripe-publishable-key"
              data-ocid="admin.settings.stripe.publishable_key.input"
              type="text"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="pk_test_… or pk_live_…"
              className="rounded-lg font-mono text-xs"
            />
          </div>

          {/* Price ID */}
          <div className="space-y-1.5">
            <Label htmlFor="stripe-price-id">
              Price ID{" "}
              <span className="text-muted-foreground font-normal">
                (price_… — your $15/month subscription)
              </span>
            </Label>
            <Input
              id="stripe-price-id"
              data-ocid="admin.settings.stripe.price_id.input"
              type="text"
              value={stripePriceId}
              onChange={(e) => setStripePriceId(e.target.value)}
              placeholder="price_…"
              className="rounded-lg font-mono text-xs"
            />
          </div>

          {/* Webhook secret */}
          <div className="space-y-1.5">
            <Label htmlFor="stripe-webhook-secret">
              Webhook Signing Secret{" "}
              <span className="text-muted-foreground font-normal">
                (whsec_…)
              </span>
            </Label>
            <Input
              id="stripe-webhook-secret"
              data-ocid="admin.settings.stripe.webhook_secret.input"
              type="password"
              value={stripeWebhookSecret}
              onChange={(e) => setStripeWebhookSecret(e.target.value)}
              placeholder="whsec_… (leave blank to keep current)"
              className="rounded-lg font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Found in Stripe Dashboard → Developers → Webhooks → your endpoint
              → Signing secret.
            </p>
          </div>

          {/* Live mode toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Live Mode</p>
              <p className="text-xs text-muted-foreground">
                Enable when ready to accept real payments. Use test mode for QA.
              </p>
            </div>
            <Switch
              data-ocid="admin.settings.stripe.live_mode.switch"
              checked={stripeLiveMode}
              onCheckedChange={setStripeLiveMode}
            />
          </div>
        </div>

        <Button
          data-ocid="admin.settings.stripe.save_button"
          onClick={handleSaveStripeConfig}
          disabled={updateStripeConfig.isPending}
          className="rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold w-full sm:w-auto"
        >
          {updateStripeConfig.isPending ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Stripe Configuration"
          )}
        </Button>
      </div>

      {/* Free Plan Price ID */}
      <div
        data-ocid="admin.settings.stripe.free_plan.section"
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Award size={16} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-base">
              Free Plan Price ID
            </h3>
            <p className="text-xs text-muted-foreground">
              Sitters assigned to the free plan get full access at no charge.
              Use this for grandfathered or partner accounts.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stripe-free-plan-price-id">
            Free Plan Price ID{" "}
            <span className="text-muted-foreground font-normal">
              (Optional)
            </span>
          </Label>
          <Input
            id="stripe-free-plan-price-id"
            data-ocid="admin.settings.stripe.free_plan_price_id.input"
            type="text"
            value={freePlanPriceId}
            onChange={(e) => setFreePlanPriceIdInput(e.target.value)}
            placeholder="price_… (leave blank if not using a free plan)"
            className="rounded-lg font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Paste the Stripe product Price ID for your free plan (e.g.{" "}
            <code>price_xxx</code>). Sitters assigned this plan will have full
            access at no charge.
          </p>
          {currentFreePlanPriceId && (
            <p className="text-xs text-muted-foreground">
              Currently saved:{" "}
              <span className="font-medium text-foreground font-mono">
                {currentFreePlanPriceId}
              </span>
            </p>
          )}
        </div>

        <Button
          data-ocid="admin.settings.stripe.free_plan.save_button"
          onClick={handleSaveFreePlanPriceId}
          disabled={setFreePlanPriceIdMut.isPending}
          className="rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold w-full sm:w-auto"
        >
          {setFreePlanPriceIdMut.isPending ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Free Plan Price ID"
          )}
        </Button>
      </div>
    </div>
  );
}

function AdminSupportTab() {
  const { data: tickets = [], isLoading, refetch } = useGetAllSupportTickets();
  const grantAccess = useGrantSupportAccess();
  const resolveTicket = useResolveSupportTicket();
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  function formatDate(ns: bigint): string {
    return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getStatusLabel(status: string): string {
    if (status === "open") return "Open";
    if (status === "adminAccessing") return "In Progress";
    return "Resolved";
  }
  function getStatusClass(status: string): string {
    if (status === "open")
      return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "adminAccessing")
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  const handleGrantAccess = async (ticketId: string) => {
    try {
      await grantAccess.mutateAsync(ticketId);
      toast.success("Support access granted. All access is audited.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to grant access",
      );
    }
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    if (!resolveNotes.trim()) {
      toast.error("Please enter resolution notes.");
      return;
    }
    try {
      await resolveTicket.mutateAsync({
        ticketId: resolveTarget,
        notes: resolveNotes.trim(),
      });
      toast.success("Ticket resolved. Access revoked.");
      setResolveTarget(null);
      setResolveNotes("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resolve ticket",
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Warning banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
        <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong className="font-semibold">Granting access</strong> gives you
          limited visibility into the sitter&apos;s account to resolve the
          specific issue. All access is <strong>fully audited</strong> and
          automatically revoked when you close the ticket.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <HelpCircle size={18} className="text-primary shrink-0" />
          Support Tickets
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => refetch()}
        >
          <Clock size={12} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <HelpCircle
            size={32}
            className="mx-auto text-muted-foreground mb-3"
          />
          <p className="text-muted-foreground font-medium">
            No support tickets
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Sitter support requests will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Sitter
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Issue
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(tickets as import("../backend.d").Public__4[]).map(
                  (ticket, i) => {
                    const statusStr =
                      typeof ticket.status === "string"
                        ? ticket.status
                        : String(ticket.status);
                    return (
                      <tr
                        key={ticket.id}
                        data-ocid={`admin.support.item.${i + 1}`}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {ticket.sitterName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground max-w-xs">
                          <span className="line-clamp-2 text-xs">
                            {ticket.issue}
                          </span>
                          {ticket.adminNotes &&
                            statusStr === TicketStatus.resolved && (
                              <span className="block text-[10px] text-emerald-600 mt-1 font-medium">
                                ✓ {ticket.adminNotes}
                              </span>
                            )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusClass(statusStr)}`}
                          >
                            {getStatusLabel(statusStr)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {formatDate(ticket.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {statusStr === TicketStatus.open && (
                              <Button
                                data-ocid={`admin.support.grant_access.${i + 1}`}
                                size="sm"
                                className="rounded-full text-xs h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={() => handleGrantAccess(ticket.id)}
                                disabled={grantAccess.isPending}
                              >
                                Grant Access
                              </Button>
                            )}
                            {statusStr === TicketStatus.adminAccessing && (
                              <Button
                                data-ocid={`admin.support.resolve.${i + 1}`}
                                size="sm"
                                className="rounded-full text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  setResolveTarget(ticket.id);
                                  setResolveNotes("");
                                }}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolve modal */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) setResolveTarget(null);
        }}
      >
        <DialogContent data-ocid="admin.support.resolve_dialog">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              Resolve Support Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add notes explaining what was done. Access will be revoked
              immediately when you close the ticket.
            </p>
            <Textarea
              data-ocid="admin.support.resolve_notes"
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder="Describe what was done to resolve the issue..."
              className="resize-none rounded-xl"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <Button
                data-ocid="admin.support.cancel_button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setResolveTarget(null)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="admin.support.confirm_button"
                size="sm"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={handleResolve}
                disabled={resolveTicket.isPending || !resolveNotes.trim()}
              >
                {resolveTicket.isPending
                  ? "Resolving..."
                  : "Resolve & Revoke Access"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTeamsTab({ allSitters }: { allSitters: Public[] }) {
  const { data: teams = [], isLoading } = useAllTeamsAdmin();
  const dissolveTeam = useDissolveTeamAdmin();

  async function handleDissolve(teamId: string, teamName: string) {
    if (!window.confirm(`Dissolve team "${teamName}"? This cannot be undone.`))
      return;
    try {
      await dissolveTeam.mutateAsync(teamId);
      toast.success(`Team "${teamName}" dissolved`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to dissolve team",
      );
    }
  }

  return (
    <div className="space-y-4" data-ocid="admin.teams.section">
      <div className="flex items-center gap-2 mb-2">
        <Users size={18} className="text-primary" />
        <h2 className="font-display text-xl font-bold">All Teams</h2>
        {!isLoading && (
          <Badge variant="secondary" className="text-xs">
            {(teams as Team[]).length}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        View all active and dissolved sitter teams. You can dissolve teams as an
        admin. Payout splits are visible here and are never shown to clients.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (teams as Team[]).length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center"
          data-ocid="admin.teams.empty_state"
        >
          <Users size={28} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-foreground mb-1">No teams yet</p>
          <p className="text-sm text-muted-foreground">
            Teams are created when sitters connect and accept invites.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(teams as Team[]).map((team, idx) => {
            const status = getTeamStatus(team);
            const memberNames = team.memberIds
              .map((id) => {
                const s = allSitters.find((x) => x.id === id);
                return s?.name ?? `Sitter #${id}`;
              })
              .join(", ");
            const splitText = (team.splitPercentages ?? [])
              .map(([id, pct]) => {
                const s = allSitters.find((x) => x.id === id);
                const name = s?.name?.split(" ")?.[0] ?? `Sitter ${id}`;
                return `${name} ${Number(pct)}%`;
              })
              .join(" · ");

            return (
              <div
                key={team.teamId}
                className="rounded-2xl border border-border/60 bg-card p-4 space-y-3"
                data-ocid={`admin.teams.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {team.name}
                      </h3>
                      <Badge
                        variant={status === "active" ? "default" : "secondary"}
                        className={
                          status === "active"
                            ? "bg-amber-500/15 text-amber-600 border-amber-400/30 text-xs"
                            : "text-xs"
                        }
                      >
                        {status === "active" ? "Active" : "Dissolved"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {team.memberIds.length} member
                      {team.memberIds.length !== 1 ? "s" : ""} · {memberNames}
                    </p>
                  </div>
                  {status === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => handleDissolve(team.teamId, team.name)}
                      disabled={dissolveTeam.isPending}
                      data-ocid={`admin.teams.dissolve_button.${idx + 1}`}
                    >
                      {dissolveTeam.isPending ? (
                        <Loader2 size={12} className="animate-spin mr-1" />
                      ) : null}
                      Dissolve
                    </Button>
                  )}
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2 border border-border/40">
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">
                    Payout Split (Admin View)
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {splitText || "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AuditTrailTab() {
  const { data: entries = [], isLoading } = useGetAuditLog();
  const [filter, setFilter] = useState<
    "all" | "bookings" | "payments" | "sitters" | "gdpr"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const GDPR_ACTIONS = [
    "GdprExportRequested",
    "GdprExportDownloaded",
    "GdprAnonymizationRequested",
    "AccountAnonymized",
  ];

  const actionLabel = (action: AuditAction): string => {
    const labels: Record<string, string> = {
      BookingDeleted: "Booking Deleted",
      PaymentDeleted: "Payment Deleted",
      SitterDeleted: "Sitter Deleted",
      SitterDeactivated: "Sitter Deactivated",
      SitterReactivated: "Sitter Reactivated",
      GdprExportRequested: "GDPR Export Requested",
      GdprExportDownloaded: "GDPR Export Downloaded",
      GdprAnonymizationRequested: "Anonymization Requested",
      AccountAnonymized: "Account Anonymized",
    };
    return labels[action as string] ?? String(action);
  };

  const actionBadgeClass = (action: AuditAction): string => {
    const s = action as string;
    if (s === "BookingDeleted") return "bg-red-100 text-red-700";
    if (s === "PaymentDeleted") return "bg-orange-100 text-orange-700";
    if (s === "SitterDeleted") return "bg-destructive/10 text-destructive";
    if (s === "SitterDeactivated") return "bg-amber-100 text-amber-700";
    if (s === "SitterReactivated") return "bg-emerald-100 text-emerald-700";
    if (GDPR_ACTIONS.includes(s)) return "bg-indigo-100 text-indigo-700";
    return "bg-secondary text-secondary-foreground";
  };

  const isGdprAction = (action: AuditAction): boolean =>
    GDPR_ACTIONS.includes(action as string);

  const filtered = [...entries]
    .sort((a, b) => Number(b.timestamp - a.timestamp))
    .filter((e) => {
      if (filter === "all") return true;
      if (filter === "bookings")
        return (e.action as string) === "BookingDeleted";
      if (filter === "payments")
        return (e.action as string) === "PaymentDeleted";
      if (filter === "sitters")
        return [
          "SitterDeleted",
          "SitterDeactivated",
          "SitterReactivated",
        ].includes(e.action as string);
      if (filter === "gdpr") return isGdprAction(e.action);
      return true;
    });

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <FileText size={20} className="text-primary shrink-0" />
              Audit Trail
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Admin-only log of all deletions, deactivations, and reactivations.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-muted-foreground shrink-0" />
            {(
              [
                { key: "all", label: "All" },
                { key: "bookings", label: "Bookings" },
                { key: "payments", label: "Payments" },
                { key: "sitters", label: "Sitters" },
                { key: "gdpr", label: "GDPR" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                data-ocid={`admin.audit.filter.${key}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filter === key ? (key === "gdpr" ? "bg-indigo-600 text-white border-indigo-600" : "bg-primary text-primary-foreground border-primary") : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
              >
                {key === "gdpr" ? (
                  <span className="flex items-center gap-1">
                    <Shield size={11} />
                    {label}
                  </span>
                ) : (
                  label
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 gloss-ring overflow-hidden">
        {isLoading ? (
          <div data-ocid="admin.audit.loading_state" className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-24 h-4 bg-muted rounded animate-pulse" />
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="admin.audit.empty_state"
            className="p-12 text-center flex flex-col items-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <FileText size={24} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-display font-semibold text-base">
                No audit entries yet
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Deletions and deactivations will appear here for admin review.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Timestamp</TableHead>
                    <TableHead className="w-40">Action</TableHead>
                    <TableHead className="w-24">Entity ID</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry, i) => {
                    const rowKey = `${entry.entityId.toString()}-${i}`;
                    const isExpanded = expandedId === rowKey;
                    const ts = new Date(Number(entry.timestamp / 1_000_000n));
                    const byStr = entry.deletedBy?.toString?.() ?? "—";
                    const truncated =
                      byStr.length > 16
                        ? `${byStr.slice(0, 8)}...${byStr.slice(-6)}`
                        : byStr;
                    return (
                      <>
                        <TableRow
                          key={rowKey}
                          data-ocid={`admin.audit.row.${i + 1}`}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : rowKey)
                          }
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {ts.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            {ts.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${actionBadgeClass(entry.action)}`}
                            >
                              {isGdprAction(entry.action) && (
                                <Shield size={10} className="shrink-0" />
                              )}
                              {actionLabel(entry.action)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            #{entry.entityId.toString()}
                          </TableCell>
                          <TableCell
                            className="font-mono text-xs text-muted-foreground"
                            title={byStr}
                          >
                            {truncated}
                          </TableCell>
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown
                                size={14}
                                className="text-muted-foreground"
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                                className="text-muted-foreground"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${rowKey}-detail`}>
                            <TableCell colSpan={5} className="bg-muted/20 p-0">
                              <div className="px-6 py-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Snapshot
                                </p>
                                <pre className="text-xs font-mono bg-muted/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all text-foreground max-h-40 overflow-y-auto">
                                  {entry.snapshot || "No snapshot available"}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((entry, i) => {
                const rowKey = `${entry.entityId.toString()}-${i}-mobile`;
                const isExpanded = expandedId === rowKey;
                const ts = new Date(Number(entry.timestamp / 1_000_000n));
                const byStr = entry.deletedBy?.toString?.() ?? "—";
                const truncated =
                  byStr.length > 20
                    ? `${byStr.slice(0, 10)}...${byStr.slice(-8)}`
                    : byStr;
                return (
                  <button
                    type="button"
                    key={rowKey}
                    data-ocid={`admin.audit.row.${i + 1}`}
                    className="p-3 hover:bg-muted/20 text-left w-full border-0 bg-transparent"
                    onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${actionBadgeClass(entry.action)}`}
                      >
                        {isGdprAction(entry.action) && (
                          <Shield size={9} className="shrink-0" />
                        )}
                        {actionLabel(entry.action)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown
                          size={13}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                      ) : (
                        <ChevronRight
                          size={13}
                          className="text-muted-foreground shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ts.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · Entity #{entry.entityId.toString()}
                    </p>
                    <p
                      className="text-xs text-muted-foreground font-mono mt-0.5 truncate"
                      title={byStr}
                    >
                      By: {truncated}
                    </p>
                    {isExpanded && (
                      <pre className="mt-2 text-xs font-mono bg-muted/40 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all text-foreground max-h-32 overflow-y-auto">
                        {entry.snapshot || "No snapshot available"}
                      </pre>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CreatePaymentDialog({
  bookings,
  sitters,
  onClose,
}: {
  bookings: Public__8[];
  sitters: Public[];
  onClose: () => void;
}) {
  const createPayment = useCreatePayment();
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"manual" | "stripe">("manual");
  const [notes, setNotes] = useState("");
  const [splits, setSplits] = useState<
    Array<{ sitterId: string; amount: string; paid: boolean }>
  >([]);

  const selectedBooking = bookings.find((b) => b.id.toString() === bookingId);

  useEffect(() => {
    if (selectedBooking) {
      setSplits(
        selectedBooking.sitterIds.map((sid) => ({
          sitterId: sid.toString(),
          amount: "",
          paid: false,
        })),
      );
    }
  }, [selectedBooking]);

  const handleSubmit = async () => {
    if (!bookingId || !amount) {
      toast.error("Booking ID and amount are required");
      return;
    }
    try {
      await createPayment.mutateAsync({
        bookingId: BigInt(bookingId),
        totalAmount: BigInt(Math.round(Number(amount) * 100)),
        method: method as PaymentMethod,
        notes: notes || undefined,
        splits: splits.map((s) => ({
          sitterId: BigInt(s.sitterId),
          amount: BigInt(Math.round(Number(s.amount || "0") * 100)),
          paid: s.paid,
        })),
      });
      toast.success("Payment created");
      onClose();
    } catch {
      toast.error("Failed to create payment");
    }
  };

  const sitterName = (sid: string) =>
    sitters.find((s) => s.id.toString() === sid)?.name ?? `Sitter #${sid}`;

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 w-full">
      <div className="space-y-1.5">
        <Label>Booking</Label>
        <Select value={bookingId} onValueChange={setBookingId}>
          <SelectTrigger className="rounded-lg">
            <SelectValue placeholder="Select booking..." />
          </SelectTrigger>
          <SelectContent>
            {bookings.map((b) => (
              <SelectItem key={b.id.toString()} value={b.id.toString()}>
                #{b.id.toString()} — {b.clientName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Amount ($)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-lg text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Method</Label>
          <Select
            value={method}
            onValueChange={(v) => setMethod(v as "manual" | "stripe")}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-lg resize-none"
          rows={2}
        />
      </div>
      {splits.length > 0 && (
        <div className="space-y-2">
          <Label>Payment Splits</Label>
          {splits.map((split, i) => (
            <div
              key={split.sitterId}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-sm flex-1 min-w-0 truncate">
                {sitterName(split.sitterId)}
              </span>
              <Input
                type="number"
                value={split.amount}
                onChange={(e) =>
                  setSplits((prev) =>
                    prev.map((s, idx) =>
                      idx === i ? { ...s, amount: e.target.value } : s,
                    ),
                  )
                }
                placeholder="Amount"
                className="rounded-lg h-8 w-24 text-xs"
              />
              <label
                htmlFor={`split-paid-${i}`}
                className="flex items-center gap-1 text-xs"
              >
                <Checkbox
                  id={`split-paid-${i}`}
                  checked={split.paid}
                  onCheckedChange={(v) =>
                    setSplits((prev) =>
                      prev.map((s, idx) =>
                        idx === i ? { ...s, paid: !!v } : s,
                      ),
                    )
                  }
                />
                Paid
              </label>
            </div>
          ))}
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={createPayment.isPending}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold"
      >
        {createPayment.isPending ? (
          <>
            <Loader2 size={14} className="mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Payment"
        )}
      </Button>
    </div>
  );
}

export default function AdminDashboard({
  navigate,
  darkMode,
  setDarkMode,
}: Props) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();
  const { data: adminProfile } = useCallerProfile();
  const {
    data: isAdmin,
    isLoading: adminLoading,
    refetch: refetchIsAdmin,
  } = useIsAdmin();
  const { data: adminAssigned } = useIsAdminAssigned();
  const claimAdmin = useClaimFirstAdmin();
  const queryClient = useQueryClient();
  const { data: sitters = [], isLoading: sittersLoading } = useAllSitters();
  const { data: bookings = [], isLoading: bookingsLoading } = useAllBookings();
  const { data: payments = [] } = useAllPayments();
  const updateStatus = useUpdateBookingStatus();
  const updateSitter = useUpdateSitter();
  const approveSitter = useApproveSitter();
  const rejectSitter = useRejectSitter();
  const assignRole = useAssignRole();
  const grantAdminAccess = useGrantAdminAccess();
  const revokeAdminAccess = useRevokeAdminAccess();
  const { data: grantedAdmins = [] } = useGetGrantedAdmins();
  const confirmPayment = useConfirmManualPayment();
  const updateSplits = useUpdatePaymentSplits();
  const adminGdprExport = useAdminRequestGdprExport();
  const adminGdprAnonymize = useAdminRequestAccountAnonymization();
  const freezeSitterAccount = useFreezeSitterAccount();
  const unfreezeSitterAccount = useUnfreezeSitterAccount();
  const assignSitterToFreePlan = useAssignSitterToFreePlan();
  const { data: freePlanPriceIdForSitters = "" } =
    useGetStripeFreePlanPriceId();
  const { data: allSubscriptionStates = [] } = useGetAllSubscriptionStates();

  // Build a Map from sitter id (string) -> SubscriptionRecord for O(1) lookups
  const subscriptionStateMap = new Map(
    (
      allSubscriptionStates as Array<
        [
          bigint,
          {
            isFrozen: boolean;
            isSubscribed: boolean;
            trialStartedAt?: bigint;
            stripeSubscriptionId?: string;
          },
        ]
      >
    ).map(([id, rec]) => [id.toString(), rec]),
  );

  // Freeze confirmation state
  const [freezeTarget, setFreezeTarget] = useState<{
    id: bigint;
    name: string;
  } | null>(null);

  // GDPR dialog state
  const [gdprTarget, setGdprTarget] = useState<{
    id: bigint;
    ownerPrincipal: string;
    name: string;
    action: "export" | "anonymize";
  } | null>(null);

  // Show skeletons when actor isn't ready yet (before queries can fire)
  const showDataSkeleton = !actor || sittersLoading;
  const showBookingsSkeleton = !actor || bookingsLoading;

  // Expanded recurring group in bookings tab
  const [expandedBookingGroupId, setExpandedBookingGroupId] = useState<
    string | null
  >(null);

  const [searchSitter, setSearchSitter] = useState("");
  const [activeTab, setActiveTab] = useState("analytics");
  const [addSitterOpen, setAddSitterOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState("");
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [editSitterTarget, setEditSitterTarget] = useState<Public | null>(null);
  const [deleteSitterTarget, setDeleteSitterTarget] = useState<{
    id: bigint;
    name: string;
  } | null>(null);
  const deleteSitter = useDeleteSitter();
  const deleteBooking = useDeleteBooking();
  const deletePayment = useDeletePayment();
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<{
    id: bigint;
    clientName: string;
    startDate: bigint;
  } | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<{
    bookingId: bigint;
    amount: number;
    method: string;
    status: string;
  } | null>(null);

  const [verifyingClaim, setVerifyingClaim] = useState(false);
  const [adminLoadTimeout, setAdminLoadTimeout] = useState(false);

  // Data refetch is handled by the hook-level refetchInterval (15s/30s).
  // Manual refetch on a separate interval is removed to avoid duplicate calls.

  // Timeout: if admin check takes more than 12 seconds, show error+retry rather than spinning forever
  useEffect(() => {
    if (!adminLoading) {
      setAdminLoadTimeout(false);
      return;
    }
    const timer = setTimeout(() => setAdminLoadTimeout(true), 12000);
    return () => clearTimeout(timer);
  }, [adminLoading]);

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <ShieldCheck size={28} className="text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground text-center">
          Sign in securely with your fingerprint or face — no password needed.
        </p>
        <Button
          data-ocid="admin.login.button"
          onClick={login}
          disabled={isLoggingIn}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 font-semibold gap-2 shadow-lg shadow-primary/20"
        >
          {isLoggingIn ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying your identity...
            </>
          ) : (
            <>
              <Fingerprint size={16} />
              Sign In Securely →
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          3-second sign-in · No password · Phishing-proof
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate("home")}
          className="text-muted-foreground text-sm"
        >
          <ArrowLeft size={14} className="mr-1" /> Back to Home
        </Button>
      </div>
    );
  }

  if (adminLoading || verifyingClaim) {
    if (adminLoadTimeout && !verifyingClaim) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
          <AlertTriangle size={32} className="text-amber-500" />
          <h3 className="font-display text-lg font-bold text-foreground">
            Taking longer than expected
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            The admin check is taking too long. This usually resolves with a
            retry.
          </p>
          <Button
            onClick={() => {
              setAdminLoadTimeout(false);
              refetchIsAdmin();
            }}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-11 font-semibold"
          >
            Retry
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("home")}
            className="text-muted-foreground text-sm"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to Home
          </Button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        {verifyingClaim && (
          <p className="text-sm text-muted-foreground">
            Verifying admin access...
          </p>
        )}
      </div>
    );
  }

  if (!isAdmin) {
    const handleClaim = () => {
      claimAdmin.mutate(undefined, {
        onSuccess: () => {
          toast.success("Admin access claimed! Loading your dashboard...");
          setVerifyingClaim(true);
          queryClient.invalidateQueries({ queryKey: ["is-admin"] });
          queryClient.invalidateQueries({ queryKey: ["is-admin-assigned"] });
          queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
          queryClient.invalidateQueries({ queryKey: ["all-sitters"] });
          const poll = async () => {
            for (let i = 0; i < 8; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              const result = await refetchIsAdmin();
              if (result.data === true) {
                setVerifyingClaim(false);
                return;
              }
            }
            setVerifyingClaim(false);
            toast.info(
              "If the dashboard doesn't load, please reload the page.",
            );
          };
          poll();
        },
        onError: () =>
          toast.error("Failed to claim admin access. Please try again."),
      });
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ShieldCheck size={28} className="text-primary" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="font-display text-2xl font-bold mb-2">
            Set Up Admin Access
          </h2>
          <p className="text-muted-foreground">
            {adminAssigned !== true
              ? "No admin has been configured yet. You can claim admin access now."
              : "Click below to reclaim admin access. This works even after a canister redeploy or when switching devices."}
          </p>
        </div>
        <Button
          onClick={handleClaim}
          disabled={claimAdmin.isPending}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-10 h-12 font-semibold shadow-lg shadow-primary/20"
          data-ocid="admin.claim.button"
        >
          {claimAdmin.isPending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <ShieldCheck size={16} className="mr-2" />
              Claim Admin Access
            </>
          )}
        </Button>
        {claimAdmin.isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive max-w-sm text-center">
            Claim failed. Please wait a moment and try again, or reload the
            page.
          </div>
        )}
        <Button
          variant="ghost"
          onClick={() => navigate("home")}
          className="rounded-full text-muted-foreground"
        >
          <ArrowLeft size={14} className="mr-1" /> Back to Home
        </Button>
      </div>
    );
  }

  const filteredSitters = (sitters as Public[]).filter((s) =>
    s.name.toLowerCase().includes(searchSitter.toLowerCase()),
  );

  const allBookings = bookings as Public__8[];
  const allSitters = sitters as Public[];
  const allPayments = payments as Public__6[];

  const pendingAppsCount = allSitters.filter((s) => !s.isActive).length;

  const adminNavGroups: NavGroup[] = [
    {
      label: "Overview",
      tabs: [
        {
          value: "analytics",
          label: "Analytics",
          icon: BarChart3,
          ocid: "admin.tab.analytics",
        },
        {
          value: "applications",
          label: "Applications",
          icon: UserCheck,
          badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
          ocid: "admin.tab.applications",
        },
      ],
    },
    {
      label: "Management",
      tabs: [
        {
          value: "bookings",
          label: "Bookings",
          icon: BookOpen,
          ocid: "admin.tab.bookings",
        },
        {
          value: "sitters",
          label: "Sitters",
          icon: PawPrint,
          ocid: "admin.tab.sitters",
        },
        {
          value: "payments",
          label: "Payments",
          icon: Wallet,
          ocid: "admin.tab.payments",
        },
        {
          value: "teams",
          label: "Teams",
          icon: Users,
          ocid: "admin.tab.teams",
        },
      ],
    },
    {
      label: "Operations",
      tabs: [
        {
          value: "availability",
          label: "Availability",
          icon: BarChart2,
          ocid: "admin.tab.availability",
        },
        {
          value: "coverage",
          label: "Coverage",
          icon: MapIcon,
          ocid: "admin.tab.coverage",
        },
        {
          value: "access",
          label: "Access",
          icon: ShieldCheck,
          ocid: "admin.tab.access",
        },
        {
          value: "audit",
          label: "Audit Trail",
          icon: FileText,
          ocid: "admin.tab.audit",
        },
      ],
    },
    {
      label: "System",
      tabs: [
        {
          value: "settings",
          label: "Settings",
          icon: Settings,
          ocid: "admin.tab.settings",
        },
        {
          value: "support",
          label: "Support",
          icon: HelpCircle,
          ocid: "admin.support.tab",
        },
        ...(adminProfile?.name === BUSINESS_CONFIG.adminNames[0]
          ? [
              {
                value: "legal-review",
                label: "Legal Review",
                icon: Scale,
                ocid: "admin.tab.legal-review",
              },
            ]
          : []),
      ],
    },
  ];

  const adminPrimaryTabs: NavTab[] = [
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    {
      value: "applications",
      label: "Apply",
      icon: UserCheck,
      badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
    },
    { value: "sitters", label: "Sitters", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Portal sidebar (desktop) ────────────────────────────────────── */}
      <PortalSidebar
        groups={adminNavGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="admin"
        extraActions={[
          {
            label: "Marketing Assets",
            icon: Download,
            onClick: () => navigate("admin-marketing"),
            ocid: "admin.marketing.tab",
          },
        ]}
      />
      {/* ── Portal bottom nav (mobile) ──────────────────────────────────── */}
      <PortalBottomNav
        groups={adminNavGroups}
        primaryTabs={adminPrimaryTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="admin"
      />
      {/* ── Main content area ───────────────────────────────────────────── */}
      {/* pb accounts for the fixed bottom nav on mobile (safe-area-aware).
          On md+ the sidebar is shown instead so no bottom padding needed. */}
      <div className="flex-1 min-w-0 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <header className="sticky top-0 z-50 frosted-nav">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("home")}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80"
              >
                <ArrowLeft size={16} /> Home
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="font-display font-semibold">Admin Panel</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Portal switch — visible for any admin who is in the dual-access list (Bailey + Linnea) */}
              {(() => {
                // Check by name — adminProfile.name is loaded from callerProfile which is reliable.
                // The Public type from getAllSitters() does NOT include an owner field, so
                // comparing principals via `s.owner` always silently returns undefined.
                // Using the adminNames list is the correct, safe approach here.
                const DUAL_ACCESS_NAMES = [
                  BUSINESS_CONFIG.adminNames[1], // Linnea Berggren
                  BUSINESS_CONFIG.adminNames[2], // Bailey Berggren
                ];
                const hasSitterProfile =
                  !!adminProfile?.name &&
                  (DUAL_ACCESS_NAMES as readonly string[]).includes(
                    adminProfile.name,
                  );
                return hasSitterProfile ? (
                  <button
                    type="button"
                    data-ocid="admin.switch_to_sitter.button"
                    onClick={() => navigate("sitter-dashboard")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.15), oklch(0.78 0.20 40 / 0.20))",
                      border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                      color: "oklch(0.58 0.18 55)",
                    }}
                  >
                    <ArrowLeftRight size={12} />
                    My Sitter Portal
                  </button>
                ) : null;
              })()}
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
              <div className="flex items-center gap-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
                <ShieldCheck size={12} />
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                  {(adminProfile?.name ?? "A").charAt(0).toUpperCase()}
                </div>
                <span>{adminProfile?.name ?? "Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Analytics */}
            <TabsContent value="analytics">
              <TabErrorBoundary tabName="analytics">
                <AnalyticsTab
                  bookings={allBookings}
                  sitters={allSitters}
                  payments={allPayments}
                  setActiveTab={setActiveTab}
                />
                <AdminCoBookingSplitsSection
                  bookings={allBookings}
                  payments={allPayments}
                  sitters={allSitters}
                />
              </TabErrorBoundary>
            </TabsContent>

            {/* Applications */}
            <TabsContent value="applications">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
                <h2 className="font-display text-xl font-bold mb-5">
                  Sitter Applications
                </h2>
                {allSitters.filter((s) => !s.isActive).length === 0 ? (
                  <div
                    data-ocid="admin.applications.empty_state"
                    className="text-center py-16"
                  >
                    <UserCheck
                      size={40}
                      className="mx-auto text-muted-foreground mb-3"
                    />
                    <p className="text-muted-foreground font-medium">
                      No pending applications
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      New sitter applications will appear here for review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allSitters
                      .filter((s) => !s.isActive)
                      .map((s, i) => (
                        <div
                          key={s.id.toString()}
                          data-ocid={`admin.applications.item.${i + 1}`}
                          className="border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">
                                {s.name}
                              </h3>
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                Pending
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {s.location}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {s.bio}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {s.services.slice(0, 4).map((svc) => (
                                <span
                                  key={svc}
                                  className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                >
                                  {svc}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                            <Button
                              size="sm"
                              data-ocid={`admin.applications.confirm_button.${i + 1}`}
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1 flex-1 sm:flex-none"
                              disabled={approveSitter.isPending}
                              onClick={() =>
                                approveSitter.mutate(s.id, {
                                  onSuccess: () =>
                                    toast.success(`${s.name} approved!`),
                                  onError: () =>
                                    toast.error("Failed to approve"),
                                })
                              }
                            >
                              <UserCheck size={13} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-ocid={`admin.applications.delete_button.${i + 1}`}
                              className="rounded-full text-destructive hover:bg-destructive/10 gap-1 flex-1 sm:flex-none"
                              disabled={rejectSitter.isPending}
                              onClick={() =>
                                rejectSitter.mutate(s.id, {
                                  onSuccess: () =>
                                    toast.success(
                                      `${s.name} application declined`,
                                    ),
                                  onError: () =>
                                    toast.error(
                                      "Failed to decline application",
                                    ),
                                })
                              }
                            >
                              <UserX size={13} /> Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Sitters */}
            <TabsContent value="sitters">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-display font-semibold text-lg">
                    Sitter Management
                  </h3>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search..."
                      value={searchSitter}
                      onChange={(e) => setSearchSitter(e.target.value)}
                      className="rounded-full text-sm w-44"
                    />
                    <Dialog
                      open={addSitterOpen}
                      onOpenChange={setAddSitterOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          data-ocid="admin.add_sitter.open_modal_button"
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
                          size="sm"
                        >
                          <Plus size={14} /> Add Sitter
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85dvh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="font-display">
                            Add New Sitter
                          </DialogTitle>
                        </DialogHeader>
                        <AddSitterDialog
                          onClose={() => setAddSitterOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {showDataSkeleton ? (
                  <div>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded mb-2" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10" />
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Subscription</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSitters.map((s, i) => (
                            <TableRow
                              data-ocid={`admin.sitters.row.${i + 1}`}
                              key={s.id.toString()}
                            >
                              <TableCell className="pr-0">
                                {s.photoUrl ? (
                                  <img
                                    src={s.photoUrl}
                                    alt={s.name}
                                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = "none";
                                      const next = e.currentTarget
                                        .nextElementSibling as HTMLElement | null;
                                      if (next) next.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20 ${s.photoUrl ? "hidden" : "flex"}`}
                                >
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                  {s.name}
                                  {(() => {
                                    const sub = subscriptionStateMap.get(
                                      s.id.toString(),
                                    );
                                    if (!sub) return null;
                                    if (sub.isFrozen)
                                      return (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-200">
                                          <Snowflake size={9} /> Frozen
                                        </span>
                                      );
                                    if (sub.isSubscribed)
                                      return (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          Active
                                        </span>
                                      );
                                    if (sub.trialStartedAt)
                                      return (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                          Trial
                                        </span>
                                      );
                                    if (
                                      sub.stripeSubscriptionId ===
                                      "GRANDFATHERED"
                                    )
                                      return (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                          ★ Free
                                        </span>
                                      );
                                    return null;
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {s.location}
                              </TableCell>
                              <TableCell>${Number(s.hourlyRate)}/day</TableCell>
                              <TableCell>
                                {s.rating > 0 ? (
                                  <span className="flex items-center gap-0.5">
                                    <Star
                                      size={13}
                                      className="fill-amber-400 text-amber-400 inline mr-0.5"
                                    />
                                    {s.rating.toFixed(1)}
                                  </span>
                                ) : (
                                  "New"
                                )}
                              </TableCell>
                              {/* Dedicated Subscription column */}
                              <TableCell>
                                {(() => {
                                  const sub = subscriptionStateMap.get(
                                    s.id.toString(),
                                  );
                                  if (!sub) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/60 whitespace-nowrap">
                                        No Status
                                      </span>
                                    );
                                  }
                                  if (sub.isFrozen) {
                                    const frozenDate = (
                                      sub as { frozenAt?: bigint }
                                    ).frozenAt
                                      ? (() => {
                                          const ms =
                                            Number(
                                              (sub as { frozenAt?: bigint })
                                                .frozenAt!,
                                            ) / 1_000_000;
                                          const d = new Date(ms);
                                          return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
                                        })()
                                      : null;
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                                        <Snowflake size={10} />
                                        {frozenDate
                                          ? `Frozen ${frozenDate}`
                                          : "Frozen"}
                                      </span>
                                    );
                                  }
                                  if (
                                    sub.stripeSubscriptionId === "GRANDFATHERED"
                                  ) {
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                        <Star
                                          size={10}
                                          className="fill-indigo-500 text-indigo-500"
                                        />
                                        Lifetime Free
                                      </span>
                                    );
                                  }
                                  if (sub.isSubscribed) {
                                    const lastPaidDate = (
                                      sub as { lastPaymentAt?: bigint }
                                    ).lastPaymentAt
                                      ? (() => {
                                          const ms =
                                            Number(
                                              (
                                                sub as {
                                                  lastPaymentAt?: bigint;
                                                }
                                              ).lastPaymentAt!,
                                            ) / 1_000_000;
                                          const d = new Date(ms);
                                          return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
                                        })()
                                      : null;
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                        <CheckCircle2 size={10} />
                                        {lastPaidDate
                                          ? `Active since ${lastPaidDate}`
                                          : "Active"}
                                      </span>
                                    );
                                  }
                                  if (sub.trialStartedAt) {
                                    const trialNs = BigInt(sub.trialStartedAt);
                                    const nowNs =
                                      BigInt(Date.now()) * BigInt(1_000_000);
                                    const trialDurationNs =
                                      BigInt(30) *
                                      BigInt(24 * 60 * 60) *
                                      BigInt(1_000_000_000);
                                    const elapsedNs = nowNs - trialNs;
                                    const daysRemaining = Math.max(
                                      0,
                                      30 -
                                        Math.floor(
                                          Number(elapsedNs) /
                                            (24 * 60 * 60 * 1_000_000_000),
                                        ),
                                    );
                                    const expired = elapsedNs > trialDurationNs;
                                    if (expired) {
                                      return (
                                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 border border-red-200 whitespace-nowrap">
                                          <Clock size={10} /> Expired
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                                        <Clock size={10} />
                                        {daysRemaining === 0
                                          ? "Trial · Expiring today"
                                          : `Trial · ${daysRemaining}d left`}
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/60 whitespace-nowrap">
                                      No Status
                                    </span>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {s.isActive ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                                    Pending
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 flex-nowrap">
                                  {/* Admin access toggle — grant or revoke (always visible) */}
                                  {(() => {
                                    const ownerPrincipal = s.owner?.toString();
                                    const hasAdminAccess = ownerPrincipal
                                      ? grantedAdmins.includes(ownerPrincipal)
                                      : false;
                                    if (!ownerPrincipal) {
                                      return (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs gap-1 text-muted-foreground opacity-50 cursor-not-allowed"
                                          data-ocid={`admin.sitters.grant_admin_button.${i + 1}`}
                                          title="Sitter must log in first to get a principal"
                                          disabled
                                        >
                                          <ShieldCheck size={12} />
                                          <span className="hidden sm:inline">
                                            Admin
                                          </span>
                                        </Button>
                                      );
                                    }
                                    return hasAdminAccess ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs gap-1 text-red-600 hover:bg-red-50"
                                        data-ocid={`admin.sitters.revoke_admin_button.${i + 1}`}
                                        title={`Revoke admin portal access from ${s.name}`}
                                        disabled={revokeAdminAccess.isPending}
                                        onClick={() => {
                                          revokeAdminAccess.mutate(
                                            ownerPrincipal,
                                            {
                                              onSuccess: () =>
                                                toast.success(
                                                  `Admin access revoked from ${s.name}`,
                                                ),
                                              onError: (err) =>
                                                toast.error(
                                                  `Failed to revoke: ${err instanceof Error ? err.message : "Unknown error"}`,
                                                ),
                                            },
                                          );
                                        }}
                                      >
                                        <UserX size={12} />
                                        <span className="hidden sm:inline">
                                          Revoke
                                        </span>
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs gap-1 text-indigo-600 hover:bg-indigo-50"
                                        data-ocid={`admin.sitters.grant_admin_button.${i + 1}`}
                                        title={`Grant admin portal access to ${s.name}`}
                                        disabled={grantAdminAccess.isPending}
                                        onClick={() => {
                                          grantAdminAccess.mutate(
                                            ownerPrincipal,
                                            {
                                              onSuccess: () =>
                                                toast.success(
                                                  `Admin access granted to ${s.name}. They'll see role selection on next login.`,
                                                ),
                                              onError: (err) =>
                                                toast.error(
                                                  `Failed to grant: ${err instanceof Error ? err.message : "Unknown error"}`,
                                                ),
                                            },
                                          );
                                        }}
                                      >
                                        <ShieldCheck size={12} />
                                        <span className="hidden sm:inline">
                                          Admin
                                        </span>
                                      </Button>
                                    );
                                  })()}

                                  {/* Activate / Deactivate (always visible) */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={
                                      s.isActive
                                        ? "text-destructive hover:bg-destructive/10 h-7 gap-1 px-2 text-xs"
                                        : "text-emerald-600 hover:bg-emerald-50 h-7 gap-1 px-2 text-xs"
                                    }
                                    data-ocid={`admin.sitters.toggle_button.${i + 1}`}
                                    title={
                                      s.isActive
                                        ? `Deactivate ${s.name}`
                                        : `Reactivate ${s.name}`
                                    }
                                    onClick={() =>
                                      updateSitter.mutate(
                                        {
                                          id: s.id,
                                          name: s.name,
                                          bio: s.bio,
                                          location: s.location,
                                          photoUrl: s.photoUrl,
                                          services: s.services,
                                          hourlyRate: s.hourlyRate,
                                          phone: s.phone ?? "",
                                          isActive: !s.isActive,
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success(
                                              s.isActive
                                                ? `${s.name} deactivated`
                                                : `${s.name} reactivated`,
                                            ),
                                          onError: () => toast.error("Failed"),
                                        },
                                      )
                                    }
                                  >
                                    {s.isActive ? (
                                      <UserX size={13} />
                                    ) : (
                                      <UserCheck size={13} />
                                    )}
                                    <span className="hidden sm:inline">
                                      {s.isActive ? "Deactivate" : "Reactivate"}
                                    </span>
                                  </Button>

                                  {/* More actions: GDPR Export, Anonymize, Edit, Badges, Delete */}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                        data-ocid={`admin.sitters.more_button.${i + 1}`}
                                        title="More actions"
                                        aria-label="More actions"
                                      >
                                        <MoreHorizontal size={14} />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-52 p-1.5"
                                      align="end"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                        <p className="text-[11px] font-medium text-muted-foreground px-2 py-1 uppercase tracking-wide">
                                          {s.name}
                                        </p>

                                        {/* Edit */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 justify-start gap-2 text-xs px-2 text-foreground hover:bg-muted/60 w-full"
                                          data-ocid={`admin.sitters.edit_button.${i + 1}`}
                                          onClick={() => setEditSitterTarget(s)}
                                        >
                                          <Edit
                                            size={13}
                                            className="text-muted-foreground"
                                          />{" "}
                                          Edit Profile
                                        </Button>

                                        {/* Badges — opens nested popover */}
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 justify-start gap-2 text-xs px-2 text-foreground hover:bg-muted/60 w-full"
                                              data-ocid={`admin.sitters.badge_button.${i + 1}`}
                                            >
                                              <Award
                                                size={13}
                                                className="text-muted-foreground"
                                              />{" "}
                                              Manage Badges
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent
                                            className="w-auto p-0"
                                            align="end"
                                            side="left"
                                          >
                                            <AdminBadgeEditor sitter={s} />
                                          </PopoverContent>
                                        </Popover>

                                        <div className="h-px bg-border/60 my-0.5" />

                                        {/* GDPR Export */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 justify-start gap-2 text-xs px-2 text-indigo-600 hover:bg-indigo-50 w-full"
                                          data-ocid={`admin.sitters.gdpr_export_button.${i + 1}`}
                                          disabled={!s.owner}
                                          title={
                                            !s.owner
                                              ? "Sitter must log in first"
                                              : `Export data for ${s.name}`
                                          }
                                          onClick={() => {
                                            if (!s.owner) return;
                                            setGdprTarget({
                                              id: s.id,
                                              ownerPrincipal:
                                                s.owner.toString(),
                                              name: s.name,
                                              action: "export",
                                            });
                                          }}
                                        >
                                          <Download size={13} /> Export Data
                                          (GDPR)
                                        </Button>

                                        {/* GDPR Anonymize */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 justify-start gap-2 text-xs px-2 text-orange-600 hover:bg-orange-50 w-full"
                                          data-ocid={`admin.sitters.gdpr_anonymize_button.${i + 1}`}
                                          disabled={!s.owner}
                                          title={
                                            !s.owner
                                              ? "Sitter must log in first"
                                              : `Anonymize account for ${s.name}`
                                          }
                                          onClick={() => {
                                            if (!s.owner) return;
                                            setGdprTarget({
                                              id: s.id,
                                              ownerPrincipal:
                                                s.owner.toString(),
                                              name: s.name,
                                              action: "anonymize",
                                            });
                                          }}
                                        >
                                          <Shield size={13} /> Anonymize Account
                                        </Button>

                                        <div className="h-px bg-border/60 my-0.5" />

                                        {/* Freeze / Unfreeze */}
                                        {(() => {
                                          const sub = subscriptionStateMap.get(
                                            s.id.toString(),
                                          );
                                          const isFrozen =
                                            sub?.isFrozen ?? false;
                                          return isFrozen ? (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 justify-start gap-2 text-xs px-2 text-emerald-700 hover:bg-emerald-50 w-full"
                                              data-ocid={`admin.sitters.unfreeze_button.${i + 1}`}
                                              disabled={
                                                unfreezeSitterAccount.isPending
                                              }
                                              onClick={() => {
                                                unfreezeSitterAccount.mutate(
                                                  s.id,
                                                  {
                                                    onSuccess: () =>
                                                      toast.success(
                                                        `${s.name}'s account has been unfrozen`,
                                                      ),
                                                    onError: (err) =>
                                                      toast.error(
                                                        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                                                      ),
                                                  },
                                                );
                                              }}
                                            >
                                              <Snowflake size={13} /> Unfreeze
                                              Account
                                            </Button>
                                          ) : (
                                            <>
                                              {freezeTarget?.id === s.id ? (
                                                <div className="px-2 py-1.5 rounded-lg bg-red-50 border border-red-200">
                                                  <p className="text-[11px] text-red-700 font-medium mb-1.5">
                                                    Freeze {s.name}&apos;s
                                                    account? This will lock them
                                                    out.
                                                  </p>
                                                  <div className="flex gap-1.5">
                                                    <Button
                                                      size="sm"
                                                      className="h-6 px-2 text-[11px] bg-red-600 hover:bg-red-700 text-white flex-1"
                                                      data-ocid={`admin.sitters.freeze_confirm_button.${i + 1}`}
                                                      disabled={
                                                        freezeSitterAccount.isPending
                                                      }
                                                      onClick={() => {
                                                        freezeSitterAccount.mutate(
                                                          s.id,
                                                          {
                                                            onSuccess: () => {
                                                              setFreezeTarget(
                                                                null,
                                                              );
                                                              toast.success(
                                                                `${s.name}'s account has been frozen`,
                                                              );
                                                            },
                                                            onError: (err) =>
                                                              toast.error(
                                                                `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                                                              ),
                                                          },
                                                        );
                                                      }}
                                                    >
                                                      Confirm Freeze
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-6 px-2 text-[11px]"
                                                      data-ocid={`admin.sitters.freeze_cancel_button.${i + 1}`}
                                                      onClick={() =>
                                                        setFreezeTarget(null)
                                                      }
                                                    >
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 justify-start gap-2 text-xs px-2 text-red-600 hover:bg-red-50 w-full"
                                                  data-ocid={`admin.sitters.freeze_button.${i + 1}`}
                                                  onClick={() =>
                                                    setFreezeTarget({
                                                      id: s.id,
                                                      name: s.name,
                                                    })
                                                  }
                                                >
                                                  <Snowflake size={13} /> Freeze
                                                  Account
                                                </Button>
                                              )}
                                            </>
                                          );
                                        })()}

                                        <div className="h-px bg-border/60 my-0.5" />

                                        {/* Assign Free Plan */}
                                        {freePlanPriceIdForSitters &&
                                          (() => {
                                            const sub =
                                              subscriptionStateMap.get(
                                                s.id.toString(),
                                              );
                                            const isAlreadyFree = (
                                              sub as
                                                | { isFreePlan?: boolean }
                                                | undefined
                                            )?.isFreePlan;
                                            return isAlreadyFree ? (
                                              <div className="flex items-center gap-1.5 px-2 py-1.5">
                                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                                  <Award size={10} /> Free Plan
                                                </span>
                                              </div>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 justify-start gap-2 text-xs px-2 text-amber-700 hover:bg-amber-50 w-full"
                                                data-ocid={`admin.sitters.assign_free_plan_button.${i + 1}`}
                                                disabled={
                                                  assignSitterToFreePlan.isPending
                                                }
                                                onClick={() => {
                                                  assignSitterToFreePlan.mutate(
                                                    s.id,
                                                    {
                                                      onSuccess: () =>
                                                        toast.success(
                                                          `${s.name} has been assigned to the free plan`,
                                                        ),
                                                      onError: (err) =>
                                                        toast.error(
                                                          `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                                                        ),
                                                    },
                                                  );
                                                }}
                                              >
                                                <Award size={13} /> Assign Free
                                                Plan
                                              </Button>
                                            );
                                          })()}

                                        <div className="h-px bg-border/60 my-0.5" />

                                        {/* Delete */}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 justify-start gap-2 text-xs px-2 text-destructive hover:bg-destructive/10 w-full"
                                          data-ocid={`admin.sitters.delete_button.${i + 1}`}
                                          onClick={() =>
                                            setDeleteSitterTarget({
                                              id: s.id,
                                              name: s.name,
                                            })
                                          }
                                        >
                                          <Trash2 size={13} /> Delete Sitter
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredSitters.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-8"
                              >
                                No sitters yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile card list */}
                    <div className="md:hidden space-y-2">
                      {filteredSitters.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          No sitters yet.
                        </p>
                      )}
                      {filteredSitters.map((s, i) => {
                        const sub = subscriptionStateMap.get(s.id.toString());
                        return (
                          <div
                            key={s.id.toString()}
                            data-ocid={`admin.sitters.row.${i + 1}`}
                            className="border border-border rounded-xl p-3 bg-card space-y-2"
                          >
                            {/* Name + photo */}
                            <div className="flex items-center gap-2">
                              {s.photoUrl ? (
                                <img
                                  src={s.photoUrl}
                                  alt={s.name}
                                  className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 border border-primary/20">
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {s.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {s.location}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {s.isActive ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Rate + rating */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                ${Number(s.hourlyRate)}/day
                              </span>
                              {s.rating > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star
                                    size={11}
                                    className="fill-amber-400 text-amber-400"
                                  />
                                  {s.rating.toFixed(1)}
                                </span>
                              )}
                              {sub && (
                                <span
                                  className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                                    sub.isFrozen
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : sub.stripeSubscriptionId ===
                                          "GRANDFATHERED"
                                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                        : sub.isSubscribed
                                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                          : sub.trialStartedAt
                                            ? "bg-amber-100 text-amber-700 border-amber-200"
                                            : "bg-muted text-muted-foreground border-border/60"
                                  }`}
                                >
                                  {sub.isFrozen
                                    ? "Frozen"
                                    : sub.stripeSubscriptionId ===
                                        "GRANDFATHERED"
                                      ? "★ Lifetime"
                                      : sub.isSubscribed
                                        ? "Active"
                                        : sub.trialStartedAt
                                          ? "Trial"
                                          : "No Status"}
                                </span>
                              )}
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full h-7 px-2 text-xs gap-1"
                                data-ocid={`admin.sitters.edit_button.${i + 1}`}
                                onClick={() => setEditSitterTarget(s)}
                              >
                                <Edit size={11} /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`rounded-full h-7 px-2 text-xs gap-1 ${s.isActive ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-50"}`}
                                data-ocid={`admin.sitters.toggle_button.${i + 1}`}
                                onClick={() =>
                                  updateSitter.mutate(
                                    {
                                      id: s.id,
                                      name: s.name,
                                      bio: s.bio,
                                      location: s.location,
                                      photoUrl: s.photoUrl,
                                      services: s.services,
                                      hourlyRate: s.hourlyRate,
                                      phone: s.phone ?? "",
                                      isActive: !s.isActive,
                                    },
                                    {
                                      onSuccess: () =>
                                        toast.success(
                                          s.isActive
                                            ? `${s.name} deactivated`
                                            : `${s.name} reactivated`,
                                        ),
                                      onError: () => toast.error("Failed"),
                                    },
                                  )
                                }
                              >
                                {s.isActive ? (
                                  <UserX size={11} />
                                ) : (
                                  <UserCheck size={11} />
                                )}
                                {s.isActive ? "Deactivate" : "Reactivate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-full h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                                data-ocid={`admin.sitters.delete_button.${i + 1}`}
                                onClick={() =>
                                  setDeleteSitterTarget({
                                    id: s.id,
                                    name: s.name,
                                  })
                                }
                              >
                                <Trash2 size={11} /> Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Bookings */}
            <TabsContent value="bookings">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
                <h3 className="font-display font-semibold text-lg mb-4">
                  All Bookings
                </h3>
                {showBookingsSkeleton ? (
                  <div>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded mb-2" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Pets</TableHead>
                            <TableHead>Services</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...allBookings]
                            .sort((a, b) => Number(b.createdAt - a.createdAt))
                            .map((b, i) => {
                              const bGroupId: string | null = (() => {
                                const raw = (
                                  b as unknown as Record<string, unknown>
                                ).groupId;
                                if (
                                  Array.isArray(raw) &&
                                  raw.length > 0 &&
                                  typeof raw[0] === "string"
                                )
                                  return raw[0];
                                if (typeof raw === "string" && raw.length > 0)
                                  return raw;
                                return null;
                              })();
                              const isRecurring =
                                (b as unknown as Record<string, unknown>)
                                  .isRecurring === true || !!bGroupId;
                              const isExpanded =
                                !!bGroupId &&
                                expandedBookingGroupId === bGroupId;
                              return (
                                <>
                                  <TableRow
                                    data-ocid={`admin.bookings.row.${i + 1}`}
                                    key={b.id.toString()}
                                    className={
                                      isExpanded ? "bg-amber-50/30" : ""
                                    }
                                  >
                                    <TableCell className="font-mono text-xs">
                                      #{b.id.toString()}
                                    </TableCell>
                                    <TableCell>{b.clientName}</TableCell>
                                    <TableCell className="text-xs">
                                      {b.pets
                                        ?.map(
                                          (p) => `${p.petName} (${p.petType})`,
                                        )
                                        .join(", ") ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs max-w-32 truncate">
                                      {b.services?.join(", ") ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {formatDate(b.startDate)}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <StatusBadge
                                          status={b.status as string}
                                        />
                                        {isRecurring && (
                                          <Badge
                                            data-ocid={`admin.bookings.recurring_badge.${i + 1}`}
                                            className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px] px-1.5 py-0 h-5 font-medium"
                                          >
                                            Recurring
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1 items-center">
                                        {isRecurring && bGroupId && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            data-ocid={`admin.bookings.expand_group_button.${i + 1}`}
                                            className="text-xs text-amber-700 hover:bg-amber-50 h-7 px-2 rounded-full border border-amber-200"
                                            onClick={() =>
                                              setExpandedBookingGroupId(
                                                isExpanded ? null : bGroupId,
                                              )
                                            }
                                            aria-label={
                                              isExpanded
                                                ? "Collapse series"
                                                : "Expand series"
                                            }
                                          >
                                            {isExpanded ? (
                                              <ChevronDown size={12} />
                                            ) : (
                                              <ChevronRight size={12} />
                                            )}
                                          </Button>
                                        )}
                                        {(b.status as string) === "pending" && (
                                          <Button
                                            size="sm"
                                            className="text-xs rounded-full bg-emerald-600 text-white hover:bg-emerald-700 h-7 px-2"
                                            data-ocid={`admin.bookings.confirm_button.${i + 1}`}
                                            onClick={() =>
                                              updateStatus.mutate(
                                                {
                                                  bookingId: b.id,
                                                  status: "confirmed",
                                                },
                                                {
                                                  onSuccess: () =>
                                                    toast.success("Confirmed"),
                                                },
                                              )
                                            }
                                          >
                                            Confirm
                                          </Button>
                                        )}
                                        {!["cancelled", "completed"].includes(
                                          b.status as string,
                                        ) && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 rounded-full"
                                            data-ocid={`admin.bookings.cancel_button.${i + 1}`}
                                            onClick={() =>
                                              updateStatus.mutate(
                                                {
                                                  bookingId: b.id,
                                                  status: "cancelled",
                                                },
                                                {
                                                  onSuccess: () =>
                                                    toast.success("Cancelled"),
                                                },
                                              )
                                            }
                                          >
                                            Cancel
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs text-destructive hover:bg-destructive/10 h-7 w-7 px-0 rounded-full"
                                          data-ocid={`admin.bookings.delete_button.${i + 1}`}
                                          aria-label="Delete booking"
                                          onClick={() =>
                                            setDeleteBookingTarget({
                                              id: b.id,
                                              clientName: b.clientName,
                                              startDate: b.startDate,
                                            })
                                          }
                                        >
                                          <Trash2 size={13} />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {/* Expanded recurring group panel */}
                                  {isExpanded && bGroupId && (
                                    <TableRow key={`${b.id.toString()}-group`}>
                                      <TableCell
                                        colSpan={7}
                                        className="p-0 pb-2 px-2"
                                      >
                                        <RecurringGroupPanel
                                          groupId={bGroupId}
                                          occurrenceBookings={allBookings.filter(
                                            (ob) => {
                                              const obGroupId = (() => {
                                                const raw = (
                                                  ob as unknown as Record<
                                                    string,
                                                    unknown
                                                  >
                                                ).groupId;
                                                if (
                                                  Array.isArray(raw) &&
                                                  raw.length > 0 &&
                                                  typeof raw[0] === "string"
                                                )
                                                  return raw[0];
                                                if (
                                                  typeof raw === "string" &&
                                                  raw.length > 0
                                                )
                                                  return raw;
                                                return null;
                                              })();
                                              return obGroupId === bGroupId;
                                            },
                                          )}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              );
                            })}
                          {allBookings.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center text-muted-foreground py-8"
                              >
                                No bookings yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile card list */}
                    <div className="md:hidden space-y-2">
                      {allBookings.length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          No bookings yet.
                        </p>
                      )}
                      {[...allBookings]
                        .sort((a, b) => Number(b.createdAt - a.createdAt))
                        .map((b, i) => {
                          const bGroupId: string | null = (() => {
                            const raw = (
                              b as unknown as Record<string, unknown>
                            ).groupId;
                            if (
                              Array.isArray(raw) &&
                              raw.length > 0 &&
                              typeof raw[0] === "string"
                            )
                              return raw[0];
                            if (typeof raw === "string" && raw.length > 0)
                              return raw;
                            return null;
                          })();
                          const isRecurring =
                            (b as unknown as Record<string, unknown>)
                              .isRecurring === true || !!bGroupId;
                          return (
                            <div
                              key={b.id.toString()}
                              data-ocid={`admin.bookings.row.${i + 1}`}
                              className="border border-border rounded-xl p-3 bg-card space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-foreground">
                                    {b.clientName}
                                  </p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    #{b.id.toString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                                  <StatusBadge status={b.status as string} />
                                  {isRecurring && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px] px-1.5 py-0 h-5 font-medium">
                                      Recurring
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>
                                  {formatDate(b.startDate)} ·{" "}
                                  {b.services?.join(", ") ?? "—"}
                                </p>
                                {b.pets && b.pets.length > 0 && (
                                  <p>
                                    🐾 {b.pets.map((p) => p.petName).join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                                {(b.status as string) === "pending" && (
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 px-2"
                                    data-ocid={`admin.bookings.confirm_button.${i + 1}`}
                                    onClick={() =>
                                      updateStatus.mutate(
                                        {
                                          bookingId: b.id,
                                          status: "confirmed",
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success("Confirmed"),
                                        },
                                      )
                                    }
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {!["cancelled", "completed"].includes(
                                  b.status as string,
                                ) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 rounded-full"
                                    data-ocid={`admin.bookings.cancel_button.${i + 1}`}
                                    onClick={() =>
                                      updateStatus.mutate(
                                        {
                                          bookingId: b.id,
                                          status: "cancelled",
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success("Cancelled"),
                                        },
                                      )
                                    }
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-destructive hover:bg-destructive/10 h-7 w-7 px-0 rounded-full"
                                  data-ocid={`admin.bookings.delete_button.${i + 1}`}
                                  aria-label="Delete booking"
                                  onClick={() =>
                                    setDeleteBookingTarget({
                                      id: b.id,
                                      clientName: b.clientName,
                                      startDate: b.startDate,
                                    })
                                  }
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Payments */}
            <TabsContent value="payments">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-display font-semibold text-lg">
                    Payment Management
                  </h3>
                  <Dialog
                    open={createPaymentOpen}
                    onOpenChange={setCreatePaymentOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        data-ocid="admin.payments.open_modal_button"
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
                        size="sm"
                      >
                        <Plus size={14} /> Create Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85dvh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-display">
                          Create Payment
                        </DialogTitle>
                      </DialogHeader>
                      <CreatePaymentDialog
                        bookings={allBookings}
                        sitters={allSitters}
                        onClose={() => setCreatePaymentOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Splits</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...allPayments]
                        .sort((a, b) => Number(b.bookingId - a.bookingId))
                        .map((p, i) => (
                          <TableRow
                            data-ocid={`admin.payments.row.${i + 1}`}
                            key={`${p.bookingId.toString()}-${i}`}
                          >
                            <TableCell className="font-mono text-xs">
                              #{p.bookingId.toString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${(Number(p.totalAmount) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={p.method as string} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={p.status as string} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.splits?.length > 0
                                ? p.splits
                                    .map(
                                      (s) =>
                                        `#${s.sitterId}: $${(Number(s.amount) / 100).toFixed(2)} ${s.paid ? "Paid" : "Pending"}`,
                                    )
                                    .join(", ")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {p.method === "manual" &&
                                  p.status === PaymentStatus.pending && (
                                    <Button
                                      size="sm"
                                      className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 px-2"
                                      data-ocid={`admin.payments.confirm_button.${i + 1}`}
                                      disabled={confirmPayment.isPending}
                                      onClick={() =>
                                        confirmPayment.mutate(p.bookingId, {
                                          onSuccess: () =>
                                            toast.success("Payment confirmed"),
                                          onError: () => toast.error("Failed"),
                                        })
                                      }
                                    >
                                      Mark Paid
                                    </Button>
                                  )}
                                {p.splits?.some((s) => !s.paid) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full text-xs h-7 px-2"
                                    data-ocid={`admin.payments.secondary_button.${i + 1}`}
                                    disabled={updateSplits.isPending}
                                    onClick={() =>
                                      updateSplits.mutate(
                                        {
                                          bookingId: p.bookingId,
                                          splits: p.splits.map((s) => ({
                                            ...s,
                                            paid: true,
                                          })),
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success("Splits updated"),
                                        },
                                      )
                                    }
                                  >
                                    Pay All Splits
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full text-xs text-destructive hover:bg-destructive/10 h-7 w-7 px-0"
                                  data-ocid={`admin.payments.delete_button.${i + 1}`}
                                  aria-label="Delete payment"
                                  onClick={() =>
                                    setDeletePaymentTarget({
                                      bookingId: p.bookingId,
                                      amount: Number(p.totalAmount) / 100,
                                      method: p.method as string,
                                      status: p.status as string,
                                    })
                                  }
                                >
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {allPayments.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-8"
                          >
                            No payments yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden space-y-2">
                  {allPayments.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No payments yet.
                    </p>
                  )}
                  {[...allPayments]
                    .sort((a, b) => Number(b.bookingId - a.bookingId))
                    .map((p, i) => (
                      <div
                        key={`${p.bookingId.toString()}-mobile-${i}`}
                        data-ocid={`admin.payments.row.${i + 1}`}
                        className="border border-border rounded-xl p-3 bg-card space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              ${(Number(p.totalAmount) / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              Booking #{p.bookingId.toString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <StatusBadge status={p.method as string} />
                            <StatusBadge status={p.status as string} />
                          </div>
                        </div>
                        {p.splits?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {p.splits
                              .map(
                                (s) =>
                                  `#${s.sitterId}: $${(Number(s.amount) / 100).toFixed(2)} ${s.paid ? "✓" : "⏳"}`,
                              )
                              .join(" · ")}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                          {p.method === "manual" &&
                            p.status === PaymentStatus.pending && (
                              <Button
                                size="sm"
                                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 px-2"
                                data-ocid={`admin.payments.confirm_button.${i + 1}`}
                                disabled={confirmPayment.isPending}
                                onClick={() =>
                                  confirmPayment.mutate(p.bookingId, {
                                    onSuccess: () =>
                                      toast.success("Payment confirmed"),
                                    onError: () => toast.error("Failed"),
                                  })
                                }
                              >
                                Mark Paid
                              </Button>
                            )}
                          {p.splits?.some((s) => !s.paid) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs h-7 px-2"
                              data-ocid={`admin.payments.secondary_button.${i + 1}`}
                              disabled={updateSplits.isPending}
                              onClick={() =>
                                updateSplits.mutate(
                                  {
                                    bookingId: p.bookingId,
                                    splits: p.splits.map((s) => ({
                                      ...s,
                                      paid: true,
                                    })),
                                  },
                                  {
                                    onSuccess: () =>
                                      toast.success("Splits updated"),
                                  },
                                )
                              }
                            >
                              Pay All Splits
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-xs text-destructive hover:bg-destructive/10 h-7 w-7 px-0"
                            data-ocid={`admin.payments.delete_button.${i + 1}`}
                            aria-label="Delete payment"
                            onClick={() =>
                              setDeletePaymentTarget({
                                bookingId: p.bookingId,
                                amount: Number(p.totalAmount) / 100,
                                method: p.method as string,
                                status: p.status as string,
                              })
                            }
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            {/* Availability */}
            <TabsContent value="availability">
              <AdminAvailabilityTab />
            </TabsContent>

            {/* Coverage Map */}
            <TabsContent value="coverage">
              <SitterCoverageMap
                onViewAllClick={() => setActiveTab("sitters")}
              />
            </TabsContent>

            {/* Access */}
            <TabsContent value="access">
              <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-6 space-y-6">
                <h3 className="font-display font-semibold text-lg">
                  Role Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Grant or revoke admin access by entering the user's Principal
                  ID.
                </p>
                <div className="space-y-3">
                  <Label>Principal ID</Label>
                  <div className="flex gap-2">
                    <Input
                      data-ocid="admin.access.input"
                      value={roleTarget}
                      onChange={(e) => setRoleTarget(e.target.value)}
                      placeholder="aaaaa-bbbbb-ccccc-..."
                      className="rounded-lg font-mono text-sm"
                    />
                    <Button
                      data-ocid="admin.access.submit_button"
                      onClick={() =>
                        assignRole.mutate(
                          { principal: roleTarget, role: "admin" },
                          {
                            onSuccess: () => {
                              toast.success("Admin role granted");
                              setRoleTarget("");
                            },
                            onError: () =>
                              toast.error("Invalid principal or failed"),
                          },
                        )
                      }
                      disabled={!roleTarget || assignRole.isPending}
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 gap-1.5 font-semibold"
                    >
                      <UserPlus size={14} /> Grant Admin
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-xl p-4 text-sm">
                  <p className="font-semibold mb-1">How it works</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>New sitter or admin logs in via the Sitter Portal</li>
                    <li>They copy their Principal ID from the login screen</li>
                    <li>You paste it above and click "Grant Admin"</li>
                    <li>They reload and will have full admin access</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            {/* Audit Trail */}
            <TabsContent value="audit">
              <AuditTrailTab />
            </TabsContent>

            {/* Settings / Danger Zone */}
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>

            {/* Support Tickets */}
            <TabsContent value="support">
              <AdminSupportTab />
            </TabsContent>

            {/* Legal Review Checklist — Marcus Berggren only */}
            {adminProfile?.name === BUSINESS_CONFIG.adminNames[0] && (
              <TabsContent value="legal-review">
                <LegalReviewChecklist />
              </TabsContent>
            )}

            {/* Teams admin */}
            <TabsContent value="teams">
              <AdminTeamsTab allSitters={allSitters} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Sitter Dialog */}
        <Dialog
          open={!!editSitterTarget}
          onOpenChange={(open) => {
            if (!open) setEditSitterTarget(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Edit size={16} className="text-primary shrink-0" />
                Edit Sitter — {editSitterTarget?.name}
              </DialogTitle>
            </DialogHeader>
            {editSitterTarget && (
              <EditSitterDialog
                sitter={editSitterTarget}
                onClose={() => setEditSitterTarget(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Sitter Confirmation Dialog */}
        <AlertDialog
          open={!!deleteSitterTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteSitterTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-display">
                <Trash2 size={18} className="text-destructive shrink-0" />
                Permanently Delete Sitter?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{" "}
                <strong>{deleteSitterTarget?.name}</strong>? This will remove
                all their profile data and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="admin.sitters.delete_dialog.cancel_button"
                onClick={() => setDeleteSitterTarget(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.sitters.delete_dialog.confirm_button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                disabled={deleteSitter.isPending}
                onClick={() => {
                  if (!deleteSitterTarget) return;
                  deleteSitter.mutate(deleteSitterTarget.id, {
                    onSuccess: () => {
                      toast.success(
                        `${deleteSitterTarget.name} has been deleted`,
                      );
                      setDeleteSitterTarget(null);
                    },
                    onError: (err) =>
                      toast.error(
                        `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`,
                      ),
                  });
                }}
              >
                {deleteSitter.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete Permanently
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Booking Confirmation Dialog */}
        <AlertDialog
          open={!!deleteBookingTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteBookingTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-display">
                <Trash2 size={18} className="text-destructive shrink-0" />
                Delete Booking?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    This will permanently delete the booking and its associated
                    payment record. This action is logged in the audit trail.
                  </p>
                  {deleteBookingTarget && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 border border-border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Booking ID
                        </span>
                        <span className="font-mono font-medium">
                          #{deleteBookingTarget.id.toString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Client</span>
                        <span className="font-medium">
                          {deleteBookingTarget.clientName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span className="font-medium">
                          {formatDate(deleteBookingTarget.startDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="admin.bookings.delete_dialog.cancel_button"
                onClick={() => setDeleteBookingTarget(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.bookings.delete_dialog.confirm_button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                disabled={deleteBooking.isPending}
                onClick={() => {
                  if (!deleteBookingTarget) return;
                  deleteBooking.mutate(deleteBookingTarget.id, {
                    onSuccess: () => {
                      toast.success(
                        "Booking deleted and logged to audit trail",
                      );
                      setDeleteBookingTarget(null);
                    },
                    onError: (err) =>
                      toast.error(
                        `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`,
                      ),
                  });
                }}
              >
                {deleteBooking.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Booking
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Payment Confirmation Dialog */}
        <AlertDialog
          open={!!deletePaymentTarget}
          onOpenChange={(open) => {
            if (!open) setDeletePaymentTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-display">
                <Trash2 size={18} className="text-destructive shrink-0" />
                Delete Payment?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    This will permanently delete the payment record. This action
                    is logged in the audit trail.
                  </p>
                  {deletePaymentTarget && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1 border border-border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Booking ID
                        </span>
                        <span className="font-mono font-medium">
                          #{deletePaymentTarget.bookingId.toString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">
                          ${deletePaymentTarget.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method</span>
                        <span className="font-medium capitalize">
                          {deletePaymentTarget.method}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">
                          {deletePaymentTarget.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="admin.payments.delete_dialog.cancel_button"
                onClick={() => setDeletePaymentTarget(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.payments.delete_dialog.confirm_button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                disabled={deletePayment.isPending}
                onClick={() => {
                  if (!deletePaymentTarget) return;
                  deletePayment.mutate(deletePaymentTarget.bookingId, {
                    onSuccess: () => {
                      toast.success(
                        "Payment deleted and logged to audit trail",
                      );
                      setDeletePaymentTarget(null);
                    },
                    onError: (err) =>
                      toast.error(
                        `Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`,
                      ),
                  });
                }}
              >
                {deletePayment.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete Payment
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* GDPR Action Confirmation Dialog */}
        <AlertDialog
          open={!!gdprTarget}
          onOpenChange={(open) => {
            if (!open) setGdprTarget(null);
          }}
        >
          <AlertDialogContent data-ocid="admin.gdpr.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-display">
                <Shield size={18} className="text-indigo-600 shrink-0" />
                {gdprTarget?.action === "export"
                  ? "Send GDPR Data Export?"
                  : "Anonymize Account?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {gdprTarget?.action === "export" ? (
                  <>
                    Send a GDPR data export request to{" "}
                    <strong>{gdprTarget?.name}</strong>? They will receive a
                    confirmation email with a link to download all their
                    personal data.
                  </>
                ) : (
                  <>
                    Send an account anonymization request to{" "}
                    <strong>{gdprTarget?.name}</strong>? They will receive a
                    confirmation email. Upon confirmation, all personal
                    identifiable information will be permanently replaced with
                    anonymized placeholders.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="admin.gdpr.cancel_button"
                onClick={() => setGdprTarget(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.gdpr.confirm_button"
                className={
                  gdprTarget?.action === "export"
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 gap-2"
                    : "bg-orange-600 text-white hover:bg-orange-700 gap-2"
                }
                disabled={
                  adminGdprExport.isPending || adminGdprAnonymize.isPending
                }
                onClick={() => {
                  if (!gdprTarget) return;
                  const mutationFn =
                    gdprTarget.action === "export"
                      ? (cb: Parameters<typeof adminGdprExport.mutate>[1]) =>
                          adminGdprExport.mutate(gdprTarget.ownerPrincipal, cb)
                      : (cb: Parameters<typeof adminGdprAnonymize.mutate>[1]) =>
                          adminGdprAnonymize.mutate(
                            gdprTarget.ownerPrincipal,
                            cb,
                          );
                  mutationFn({
                    onSuccess: () => {
                      toast.success(
                        gdprTarget.action === "export"
                          ? `GDPR export request sent to ${gdprTarget.name}`
                          : `Anonymization request sent to ${gdprTarget.name}`,
                      );
                      setGdprTarget(null);
                    },
                    onError: (err) =>
                      toast.error(
                        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
                      ),
                  });
                }}
              >
                {adminGdprExport.isPending || adminGdprAnonymize.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : gdprTarget?.action === "export" ? (
                  <>
                    <Download size={14} />
                    Send Export Request
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    Send Anonymization Request
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* end main content */}
    </div>
  );
}
