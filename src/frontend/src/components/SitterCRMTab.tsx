import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Gift,
  Mail,
  Phone,
  Search,
  SendHorizonal,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDealOffersBySitter,
  useSendDealOffer,
  useSitterClientsForCRM,
} from "../hooks/useQueries";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CRMClient {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingCount: number;
  lastBookingDate: bigint;
  totalSpent: number;
  tags: string[];
}

interface DealOffer {
  id: string;
  couponCode: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  expirationDate: bigint;
  clientEmails: string[];
  redeemedCount: number;
  isActive: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}yr ago`;
}

function formatDate(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function expirationStatus(ts: bigint): "expired" | "soon" | "active" {
  const ms = Number(ts) / 1_000_000;
  const diff = ms - Date.now();
  if (diff < 0) return "expired";
  if (diff < 7 * 86_400_000) return "soon";
  return "active";
}

function getClientTag(bookingCount: number): "VIP" | "Regular" | "New" {
  if (bookingCount >= 5) return "VIP";
  if (bookingCount >= 2) return "Regular";
  return "New";
}

const TAG_STYLES: Record<string, string> = {
  VIP: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  Regular: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  New: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "amber" | "indigo" | "emerald" | "violet";
}) {
  const colors = {
    amber:
      "from-amber-500/10 to-amber-400/5 border-amber-400/20 text-amber-300",
    indigo:
      "from-indigo-500/10 to-indigo-400/5 border-indigo-400/20 text-indigo-300",
    emerald:
      "from-emerald-500/10 to-emerald-400/5 border-emerald-400/20 text-emerald-300",
    violet:
      "from-violet-500/10 to-violet-400/5 border-violet-400/20 text-violet-300",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[accent]} border rounded-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function ClientCard({
  client,
  selected,
  onToggle,
  index,
}: {
  client: CRMClient;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const tag = getClientTag(client.bookingCount);
  const initials = getInitials(client.clientName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onToggle}
      className={`relative rounded-2xl border cursor-pointer transition-all duration-200 p-4 ${
        selected
          ? "bg-amber-500/10 border-amber-400/40 ring-1 ring-amber-400/30"
          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
      }`}
      data-ocid={`crm.client.item.${index + 1}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-semibold text-white text-sm truncate">
              {client.clientName}
            </p>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TAG_STYLES[tag]}`}
            >
              {tag}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {client.clientEmail && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Mail size={10} />
                <span className="truncate">{client.clientEmail}</span>
              </div>
            )}
            {client.clientPhone && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Phone size={10} />
                <span>{client.clientPhone}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-white/40">
              {client.bookingCount} booking
              {client.bookingCount !== 1 ? "s" : ""}
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs text-white/40">
              Last: {relativeDate(client.lastBookingDate)}
            </span>
            {client.totalSpent > 0 && (
              <>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs font-semibold text-amber-400">
                  ${(client.totalSpent / 100).toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Checkbox */}
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            selected ? "bg-amber-400 border-amber-400" : "border-white/30"
          }`}
        >
          {selected && (
            <CheckCircle size={12} className="text-black fill-black" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OfferRow({ offer, index }: { offer: DealOffer; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const expStatus = expirationStatus(offer.expirationDate);
  const statusColor =
    expStatus === "expired"
      ? "bg-red-500/20 text-red-300 border-red-400/30"
      : expStatus === "soon"
        ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
        : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
  const statusLabel =
    expStatus === "expired"
      ? "Expired"
      : expStatus === "soon"
        ? "Expires Soon"
        : "Active";
  const redemptionPct =
    offer.clientEmails.length > 0
      ? Math.round((offer.redeemedCount / offer.clientEmails.length) * 100)
      : 0;

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      data-ocid={`crm.offer.item.${index + 1}`}
    >
      <button
        type="button"
        className="flex items-center gap-3 p-4 w-full text-left cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="font-mono text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-lg shrink-0">
          {offer.couponCode}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {offer.description}
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {offer.discountType === "percent"
              ? `${offer.discountValue}% off`
              : `$${offer.discountValue} off`}
            {" · "}Sent to {offer.clientEmails.length} client
            {offer.clientEmails.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
          >
            {statusLabel}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-white/40" />
          ) : (
            <ChevronDown size={14} className="text-white/40" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Redeemed</span>
                <span className="text-white font-semibold">
                  {offer.redeemedCount} / {offer.clientEmails.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                  style={{ width: `${redemptionPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Expires</span>
                <span
                  className={
                    expStatus === "expired"
                      ? "text-red-400"
                      : expStatus === "soon"
                        ? "text-amber-400"
                        : "text-white/70"
                  }
                >
                  {formatDate(offer.expirationDate)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Send Deal Offer Modal ──────────────────────────────────────────────────────

function SendDealModal({
  selectedClients,
  onClose,
  onSuccess,
  sitterId,
}: {
  selectedClients: CRMClient[];
  onClose: () => void;
  onSuccess: () => void;
  sitterId: Principal | null;
}) {
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const sendOffer = useSendDealOffer();

  const clientEmails = selectedClients
    .map((c) => c.clientEmail)
    .filter(Boolean);
  const previewCode = "DEAL-XXXXXX";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const handleSend = async () => {
    if (!sitterId) return toast.error("Not connected");
    const val = Number(discountValue);
    if (!val || val <= 0) return toast.error("Enter a valid discount amount");
    if (discountType === "percent" && (val < 1 || val > 99))
      return toast.error("Percentage must be 1–99");
    if (!description.trim())
      return toast.error("Add a description for your offer");
    if (!expirationDate) return toast.error("Set an expiration date");

    const expMs = new Date(expirationDate).getTime();
    if (expMs <= Date.now())
      return toast.error("Expiration must be in the future");

    try {
      await sendOffer.mutateAsync({
        sitterId,
        clientEmails,
        discountType,
        discountValue: val,
        description: description.trim(),
        expirationDate: BigInt(expMs * 1_000_000),
      });
      toast.success(
        `✓ ${clientEmails.length} offer${clientEmails.length !== 1 ? "s" : ""} sent!`,
      );
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send offers");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-[#1a1a2e] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto"
        data-ocid="crm.deal_modal.dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="font-bold text-white text-lg">Send Deal Offer</h2>
            <p className="text-sm text-white/50 mt-0.5">
              Sending to {clientEmails.length} client
              {clientEmails.length !== 1 ? "s" : ""}:{" "}
              <span className="text-white/70">
                {selectedClients
                  .slice(0, 2)
                  .map(
                    (c) =>
                      (c.clientName ?? "Client").split(" ")?.[0] ?? "Client",
                  )
                  .join(", ")}
                {selectedClients.length > 2
                  ? ` +${selectedClients.length - 2} more`
                  : ""}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            data-ocid="crm.deal_modal.close_button"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Discount Type Toggle */}
          <div>
            <Label className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2 block">
              Discount Type
            </Label>
            <div className="flex gap-2">
              {(["percent", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDiscountType(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    discountType === t
                      ? "bg-amber-500 border-amber-400 text-black"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                  data-ocid={`crm.deal_modal.discount_type.${t}`}
                >
                  {t === "percent" ? "% Off" : "$ Off"}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <Label className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2 block">
              {discountType === "percent"
                ? "Percentage Off (1–99)"
                : "Dollar Amount Off"}
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">
                {discountType === "percent" ? "%" : "$"}
              </span>
              <Input
                type="number"
                min={discountType === "percent" ? 1 : 1}
                max={discountType === "percent" ? 99 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "e.g. 20" : "e.g. 10"}
                className="pl-8 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus-visible:ring-amber-400 focus-visible:border-amber-400/50 rounded-xl"
                data-ocid="crm.deal_modal.discount_value.input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2 block">
              Offer Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Summer special! Thanks for being a loyal client."
              rows={3}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/25 focus-visible:ring-amber-400 focus-visible:border-amber-400/50 rounded-xl resize-none"
              data-ocid="crm.deal_modal.description.textarea"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <Label className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2 block">
              Expiration Date
            </Label>
            <Input
              type="date"
              min={minDate}
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="bg-white/5 border-white/15 text-white focus-visible:ring-amber-400 focus-visible:border-amber-400/50 rounded-xl"
              data-ocid="crm.deal_modal.expiration_date.input"
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 px-4 py-3">
            <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-widest mb-1">
              Coupon Preview
            </p>
            <p className="text-amber-300 font-mono font-bold text-base">
              {previewCode}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Unique code generated per client on send
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <Button
            className="w-full rounded-xl h-12 font-bold text-base bg-amber-500 hover:bg-amber-400 text-black border-0 transition-all"
            onClick={handleSend}
            disabled={sendOffer.isPending}
            data-ocid="crm.deal_modal.send_button"
          >
            {sendOffer.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Sending…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SendHorizonal size={16} />
                Send {clientEmails.length} Offer
                {clientEmails.length !== 1 ? "s" : ""}
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main CRM Tab ───────────────────────────────────────────────────────────────

export default function SitterCRMTab({
  sitterPrincipal,
  sitterName: _sitterName,
}: {
  sitterPrincipal: Principal | null;
  sitterName: string;
}) {
  const { data: rawClients, isLoading: clientsLoading } =
    useSitterClientsForCRM(sitterPrincipal);
  const { data: rawOffers, isLoading: offersLoading } =
    useDealOffersBySitter(sitterPrincipal);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<"All" | "VIP" | "Regular" | "New">(
    "All",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  // Normalize clients
  const clients = useMemo<CRMClient[]>(() => {
    if (!Array.isArray(rawClients)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rawClients as any[]).map((c) => ({
      clientName: String(c.clientName ?? "Unknown"),
      clientEmail: String(c.clientEmail ?? ""),
      clientPhone: String(c.clientPhone ?? ""),
      bookingCount: Number(c.bookingCount ?? 0),
      lastBookingDate: BigInt(c.lastBookingDate ?? 0),
      totalSpent: Number(c.totalSpent ?? 0),
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
    }));
  }, [rawClients]);

  // Normalize offers
  const offers = useMemo<DealOffer[]>(() => {
    if (!Array.isArray(rawOffers)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rawOffers as any[]).map((o) => ({
      id: String(o.id ?? ""),
      couponCode: String(o.couponCode ?? "DEAL-??????"),
      description: String(o.description ?? ""),
      discountType: o.discountType?.__kind__ === "fixed" ? "fixed" : "percent",
      discountValue: Number(o.discountValue ?? 0),
      expirationDate: BigInt(o.expirationDate ?? 0),
      clientEmails: Array.isArray(o.clientEmails)
        ? o.clientEmails.map(String)
        : [],
      redeemedCount: Number(o.redeemedCount ?? 0),
      isActive: Boolean(o.isActive),
    }));
  }, [rawOffers]);

  // Filtered + searched clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        !search ||
        c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.clientEmail.toLowerCase().includes(search.toLowerCase());
      const tag = getClientTag(c.bookingCount);
      const matchesTag = tagFilter === "All" || tag === tagFilter;
      return matchesSearch && matchesTag;
    });
  }, [clients, search, tagFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const offersSent = offers.length;
    const redemptions = offers.reduce((s, o) => s + o.redeemedCount, 0);
    const repeatRevenue = clients
      .filter((c) => c.bookingCount >= 2)
      .reduce((s, c) => s + c.totalSpent, 0);
    return { totalClients, offersSent, redemptions, repeatRevenue };
  }, [clients, offers]);

  const selectedClients = filteredClients.filter((c) =>
    selected.has(c.clientEmail),
  );

  const toggleClient = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filteredClients.map((c) => c.clientEmail)));
  };
  const deselectAll = () => setSelected(new Set());

  return (
    <div className="space-y-6" data-ocid="crm.section">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Users size={22} className="text-amber-400" />
          Client Relationships
        </h2>
        <p className="text-white/50 text-sm">
          Turn past clients into loyal regulars
        </p>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      {clientsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-24 rounded-2xl bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users size={16} className="text-indigo-300" />}
            label="Total Clients"
            value={stats.totalClients}
            accent="indigo"
          />
          <StatCard
            icon={<SendHorizonal size={16} className="text-amber-300" />}
            label="Offers Sent"
            value={stats.offersSent}
            accent="amber"
          />
          <StatCard
            icon={<Tag size={16} className="text-emerald-300" />}
            label="Redemptions"
            value={stats.redemptions}
            accent="emerald"
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-violet-300" />}
            label="Repeat Revenue"
            value={`$${(stats.repeatRevenue / 100).toFixed(2)}`}
            accent="violet"
          />
        </div>
      )}

      {/* ── Client List ────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">Your Clients</h3>
            {clients.length > 0 && (
              <span className="text-xs font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                {clients.length}
              </span>
            )}
          </div>
          {filteredClients.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  selected.size === filteredClients.length
                    ? deselectAll
                    : selectAll
                }
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                data-ocid="crm.select_all.toggle"
              >
                {selected.size === filteredClients.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          )}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <Input
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-amber-400 rounded-xl text-sm"
              data-ocid="crm.client_search.input"
            />
          </div>
          <div className="flex gap-1.5">
            {(["All", "VIP", "Regular", "New"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTagFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  tagFilter === t
                    ? "bg-amber-500 border-amber-400 text-black"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                }`}
                data-ocid={`crm.filter.${t.toLowerCase()}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Client grid */}
        <div className="p-4">
          {clientsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} className="h-24 rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="crm.clients.empty_state"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Users size={24} className="text-white/30" />
              </div>
              <p className="text-white/50 font-medium text-sm">
                {clients.length === 0
                  ? "No clients yet"
                  : "No clients match your search"}
              </p>
              <p className="text-xs text-white/30 mt-1">
                {clients.length === 0
                  ? "Your clients will appear here after completed bookings"
                  : "Try a different search or filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredClients.map((client, i) => (
                <ClientCard
                  key={client.clientEmail || `${client.clientName}-${i}`}
                  client={client}
                  selected={selected.has(client.clientEmail)}
                  onToggle={() => toggleClient(client.clientEmail)}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating action bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#1a1a2e] border border-white/20 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-xl"
            data-ocid="crm.floating_action_bar"
          >
            <p className="text-white font-semibold text-sm whitespace-nowrap">
              {selected.size} client{selected.size !== 1 ? "s" : ""} selected
            </p>
            <div className="w-px h-5 bg-white/20" />
            <Button
              className="rounded-xl h-9 px-5 font-bold text-sm bg-amber-500 hover:bg-amber-400 text-black border-0 gap-2"
              onClick={() => setShowModal(true)}
              data-ocid="crm.send_deal_offer.button"
            >
              <Gift size={14} />
              Send Deal Offer
            </Button>
            <button
              type="button"
              onClick={deselectAll}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Clear selection"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sent Offers History ─────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <h3 className="font-bold text-white text-sm">Deal Offers Sent</h3>
          {offers.length > 0 && (
            <span className="text-xs font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              {offers.length}
            </span>
          )}
        </div>
        <div className="p-4">
          {offersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((k) => (
                <Skeleton key={k} className="h-16 rounded-2xl bg-white/10" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="crm.offers.empty_state"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Gift size={24} className="text-white/30" />
              </div>
              <p className="text-white/50 font-medium text-sm">
                No offers sent yet
              </p>
              <p className="text-xs text-white/30 mt-1">
                Select clients above and send your first deal!
              </p>
              {clients.length > 0 && (
                <Button
                  className="mt-4 rounded-xl h-9 px-5 font-bold text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30"
                  onClick={selectAll}
                >
                  Select all clients
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer, i) => (
                <OfferRow
                  key={offer.id || offer.couponCode}
                  offer={offer}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Info footer ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-400/20 rounded-2xl px-5 py-4">
        <Calendar size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-300/70 leading-relaxed">
          Deal offers are sent directly to your clients by email. Clients can
          apply the coupon code at checkout for the discount you set. Codes
          expire on the date you choose.
        </p>
      </div>

      {/* ── Send Deal Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <SendDealModal
            selectedClients={selectedClients}
            sitterId={sitterPrincipal}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false);
              setSelected(new Set());
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
