/**
 * SitterDemoPage — A live, fully interactive preview of the Sitter Portal.
 * Shows Morgan Pawley's demo data with no auth required.
 * Wraps SitterDashboard with DemoModeProvider so all tabs work.
 */
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  Gift,
  Globe,
  LifeBuoy,
  Lock,
  Mail,
  Phone,
  Plus,
  Receipt,
  Search,
  SendHorizonal,
  Shield,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { AvailabilityEntry } from "../backend.d";
import AgendaTab from "../components/AgendaTab";
import BookingCard from "../components/BookingCard";
import DeclineBookingModal from "../components/DeclineBookingModal";
import PortalBottomNav from "../components/PortalBottomNav";
import PortalSidebar, {
  type NavGroup,
  type NavTab,
} from "../components/PortalSidebar";
import SitterInvoicesTab from "../components/SitterInvoicesTab";
import SitterPortalFAQ from "../components/SitterPortalFAQ";
import { DemoModeProvider, useDemoMode } from "../context/DemoModeContext";
import SitterStorefrontPage from "./SitterStorefrontPage";
import type { StorefrontPreviewData } from "./SitterStorefrontPage";
import AnalyticsDemoTab from "./demo/AnalyticsDemoTab";
import CoachDemoTab from "./demo/CoachDemoTab";
import ProfileDemoTab from "./demo/ProfileDemoTab";

interface Props {
  navigate: (view: View) => void;
}

// ── CRM helpers ────────────────────────────────────────────────────────────────

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

function expirationStatus(ts: bigint): "expired" | "soon" | "active" {
  const ms = Number(ts) / 1_000_000;
  const diff = ms - Date.now();
  if (diff < 0) return "expired";
  if (diff < 7 * 86_400_000) return "soon";
  return "active";
}

const TAG_STYLES: Record<string, string> = {
  VIP: "bg-amber-500/20 text-amber-300 border-amber-400/30",
  Regular: "bg-blue-500/20 text-blue-300 border-blue-400/30",
  New: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
};

// ── Demo CRM Tab ───────────────────────────────────────────────────────────────

function DemoCRMTab() {
  const { demoCRMClients, demoDealOffers } = useDemoMode();

  const [search, setSearch] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [expandedOffer, setExpandedOffer] = useState<string | null>(null);

  // Offer form state
  const [offerDesc, setOfferDesc] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [expiryDays, setExpiryDays] = useState("14");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return demoCRMClients;
    return demoCRMClients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q),
    );
  }, [demoCRMClients, search]);

  const toggleClient = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedEmails(new Set(filtered.map((c) => c.clientEmail)));
  const clearAll = () => setSelectedEmails(new Set());

  const handleSendOffer = () => {
    if (selectedEmails.size === 0) {
      toast.error("Select at least one client to send an offer.");
      return;
    }
    if (!offerDesc.trim()) {
      toast.error("Please enter an offer description.");
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      toast.error("Please enter a valid discount amount.");
      return;
    }
    // Demo mode — no real backend call
    toast.success(
      `Demo mode: offer would be sent to ${selectedEmails.size} client${selectedEmails.size !== 1 ? "s" : ""}. Not actually sent.`,
    );
    setShowOfferModal(false);
    setOfferDesc("");
    setDiscountValue("");
    setSelectedEmails(new Set());
  };

  const totalSpent = demoCRMClients.reduce((s, c) => s + c.totalSpent, 0);
  const vipCount = demoCRMClients.filter((c) => c.tag === "VIP").length;
  const activeOffers = demoDealOffers.filter((o) => o.isActive).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <Users size={14} />,
            label: "Total Clients",
            value: demoCRMClients.length,
            accent: "indigo",
          },
          {
            icon: <Star size={14} />,
            label: "VIP Clients",
            value: vipCount,
            accent: "amber",
          },
          {
            icon: <TrendingUp size={14} />,
            label: "Total Revenue",
            value: `$${(totalSpent / 100).toFixed(0)}`,
            accent: "emerald",
          },
          {
            icon: <Gift size={14} />,
            label: "Active Offers",
            value: activeOffers,
            accent: "violet",
          },
        ].map(({ icon, label, value, accent }) => {
          const colors: Record<string, string> = {
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
              key={label}
              className={`bg-gradient-to-br ${colors[accent]} border rounded-2xl p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-card/50 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {label}
                </p>
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
            </div>
          );
        })}
      </div>

      {/* Client list */}
      <div className="bg-card rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Your Clients
          </h3>
          <div className="flex items-center gap-2">
            {selectedEmails.size > 0 && (
              <span className="text-xs text-amber-400 font-semibold">
                {selectedEmails.size} selected
              </span>
            )}
            {selectedEmails.size === 0 ? (
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
                data-ocid="demo.crm.select_all_button"
              >
                Select all
              </button>
            ) : (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:underline"
                data-ocid="demo.crm.clear_all_button"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            data-ocid="demo.crm.search_input"
          />
        </div>

        {/* Client cards */}
        <div className="space-y-2">
          {filtered.map((client, i) => {
            const selected = selectedEmails.has(client.clientEmail);
            const initials = getInitials(client.clientName);
            return (
              <motion.div
                key={client.clientEmail}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => toggleClient(client.clientEmail)}
                className={`relative rounded-2xl border cursor-pointer transition-all duration-200 p-4 ${
                  selected
                    ? "bg-amber-500/10 border-amber-400/40 ring-1 ring-amber-400/30"
                    : "bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-border"
                }`}
                data-ocid={`demo.crm.client.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {client.clientName}
                      </p>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TAG_STYLES[client.tag]}`}
                      >
                        {client.tag}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail size={10} />
                        <span className="truncate">{client.clientEmail}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone size={10} />
                        <span>{client.clientPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
                      <span>
                        {client.totalBookings} booking
                        {client.totalBookings !== 1 ? "s" : ""}
                      </span>
                      <span className="opacity-30">·</span>
                      <span>Last: {relativeDate(client.lastBookingDate)}</span>
                      {client.totalSpent > 0 && (
                        <>
                          <span className="opacity-30">·</span>
                          <span className="font-semibold text-amber-500">
                            ${(client.totalSpent / 100).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                    {client.pets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {client.pets.map((pet) => (
                          <span
                            key={pet}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            🐾 {pet}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected
                        ? "bg-amber-400 border-amber-400"
                        : "border-border"
                    }`}
                  >
                    {selected && (
                      <CheckCircle
                        size={12}
                        className="text-black fill-black"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Send offer CTA */}
        <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {selectedEmails.size > 0
              ? `${selectedEmails.size} client${selectedEmails.size !== 1 ? "s" : ""} selected — ready to send a deal`
              : "Select clients above to send them a special offer"}
          </p>
          <Button
            size="sm"
            disabled={selectedEmails.size === 0}
            onClick={() => setShowOfferModal(true)}
            data-ocid="demo.crm.send_offer_button"
            className="rounded-full gap-2 font-semibold disabled:opacity-40"
            style={
              selectedEmails.size > 0
                ? {
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    border: "none",
                  }
                : undefined
            }
          >
            <Gift size={14} />
            Send Offer
          </Button>
        </div>
      </div>

      {/* Offer history */}
      <div className="bg-card rounded-2xl border border-border/60 p-5">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
          <Tag size={16} className="text-primary" />
          Sent Offers
        </h3>
        <div className="space-y-2">
          {demoDealOffers.map((offer, i) => {
            const expStatus = expirationStatus(offer.expirationDate);
            const statusColor =
              expStatus === "expired"
                ? "bg-red-500/20 text-red-400 border-red-400/30"
                : expStatus === "soon"
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
            const statusLabel =
              expStatus === "expired"
                ? "Expired"
                : expStatus === "soon"
                  ? "Expires Soon"
                  : "Active";
            const isExpanded = expandedOffer === offer.id;
            const redemptionPct =
              offer.clientEmails.length > 0
                ? Math.round(
                    (offer.redeemedCount / offer.clientEmails.length) * 100,
                  )
                : 0;

            return (
              <div
                key={offer.id}
                className="bg-muted/20 border border-border/60 rounded-2xl overflow-hidden"
                data-ocid={`demo.crm.offer.item.${i + 1}`}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 p-4 w-full text-left cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedOffer(isExpanded ? null : offer.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="font-mono text-sm font-bold text-amber-500 bg-amber-500/10 border border-amber-400/20 px-2.5 py-1 rounded-lg shrink-0">
                    {offer.couponCode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {offer.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Calendar size={11} />
                            Sent {relativeDate(offer.sentDate)}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Calendar size={11} />
                            {expStatus === "expired" ? "Expired" : "Expires"}{" "}
                            {new Date(
                              Number(offer.expirationDate) / 1_000_000,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">
                              Redemption rate
                            </span>
                            <span className="font-semibold text-foreground">
                              {offer.redeemedCount}/{offer.clientEmails.length}{" "}
                              ({redemptionPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                              style={{ width: `${redemptionPct}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">
                            Sent to:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {offer.clientEmails.map((email) => (
                              <span
                                key={email}
                                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {email}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) =>
              e.target === e.currentTarget && setShowOfferModal(false)
            }
            data-ocid="demo.crm.send_offer_dialog"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <Gift size={18} className="text-amber-500" />
                  Send Deal Offer
                </h3>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                  data-ocid="demo.crm.close_offer_modal_button"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Sending to {selectedEmails.size} client
                    {selectedEmails.size !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...selectedEmails].map((email) => {
                      const client = demoCRMClients.find(
                        (c) => c.clientEmail === email,
                      );
                      return (
                        <span
                          key={email}
                          className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-400/20 font-medium"
                        >
                          {client?.clientName ?? email}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="demo-crm-offer-desc"
                    className="text-xs font-semibold text-muted-foreground block mb-1.5"
                  >
                    Offer Description
                  </label>
                  <textarea
                    id="demo-crm-offer-desc"
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    placeholder="e.g. 20% off your next dog walk — thank you for being a loyal client!"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground resize-none"
                    data-ocid="demo.crm.offer_description_textarea"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="demo-crm-discount-type"
                      className="text-xs font-semibold text-muted-foreground block mb-1.5"
                    >
                      Discount Type
                    </label>
                    <select
                      id="demo-crm-discount-type"
                      value={discountType}
                      onChange={(e) =>
                        setDiscountType(e.target.value as "percent" | "fixed")
                      }
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                      data-ocid="demo.crm.discount_type_select"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="demo-crm-discount-value"
                      className="text-xs font-semibold text-muted-foreground block mb-1.5"
                    >
                      {discountType === "percent"
                        ? "Percent Off"
                        : "Dollar Off"}
                    </label>
                    <input
                      id="demo-crm-discount-value"
                      type="number"
                      min="1"
                      max={discountType === "percent" ? "100" : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "20" : "10"}
                      className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                      data-ocid="demo.crm.discount_value_input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="demo-crm-expiry-days"
                    className="text-xs font-semibold text-muted-foreground block mb-1.5"
                  >
                    Expires In (days)
                  </label>
                  <input
                    id="demo-crm-expiry-days"
                    type="number"
                    min="1"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                    data-ocid="demo.crm.expiry_days_input"
                  />
                </div>

                <div className="pt-1 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowOfferModal(false)}
                    data-ocid="demo.crm.cancel_offer_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl gap-2 font-semibold"
                    onClick={handleSendOffer}
                    data-ocid="demo.crm.confirm_send_offer_button"
                    style={{
                      background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "white",
                      border: "none",
                    }}
                  >
                    <SendHorizonal size={14} />
                    Send Offer
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  🔒 Demo mode — offers are not actually sent
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Demo Public Page (Storefront) Tab ─────────────────────────────────────────
// Uses the REAL SitterStorefrontPage component fed with Morgan Pawley's demo data.
// This shows EXACTLY what a client sees when they open the public link.

function DemoStorefrontTab() {
  const { demoSitter, demoReviews, demoAvailability } = useDemoMode();

  // Listen for demo book-click events from the storefront's BookMeButton
  const [showBookToast, setShowBookToast] = useState(false);
  const handleBookClick = () => {
    setShowBookToast(true);
    setTimeout(() => setShowBookToast(false), 4000);
  };

  // Wire up the custom event from BookMeButton(isPreview=true)
  const handleEvent = () => handleBookClick();

  // Build the previewData shape that SitterStorefrontPage expects
  const previewData: StorefrontPreviewData & {
    pinnedPromo?: { description: string; couponCode: string };
    credentialChecklist?: Record<string, boolean>;
  } = {
    profile: {
      id: demoSitter.id,
      name: demoSitter.name,
      bio: "I've been caring for Boulder-area pets for 6+ years. Your fur babies get daily adventures, cozy cuddles, and constant love — exactly as if you were home.",
      profilePhotoUrl: demoSitter.photoUrl || undefined,
      averageRating: demoSitter.rating,
      reviewCount: demoSitter.reviewCount,
      isActive: demoSitter.isActive,
      location: "80304",
      badges: [
        "CPR Certified",
        "Fear Free",
        "5+ Years Experience",
        "Top Rated",
      ],
      services: [
        { serviceName: "Dog Walking", price: 28, duration: "30 or 60 min" },
        { serviceName: "Drop-In Visit", price: 22, duration: "30 min" },
        { serviceName: "Overnight Stay", price: 85, duration: "Dusk to dawn" },
        { serviceName: "Dog Bath & Brush", price: 45, duration: "60-90 min" },
        { serviceName: "Pet Taxi", price: 35, duration: "Per trip" },
      ],
      reviews: [
        ...demoReviews.map((r) => ({
          clientName: r.clientName,
          createdAt: r.createdAt,
          comment: r.reviewText,
          rating: BigInt(r.rating),
        })),
        {
          clientName: "Samantha R.",
          createdAt: BigInt((Date.now() - 12 * 86_400_000) * 1_000_000),
          comment:
            "Morgan is incredible — she sent photos after every walk and our dog absolutely adores her. Will 100% book again!",
          rating: BigInt(5),
        },
        {
          clientName: "Tom & Kelsey A.",
          createdAt: BigInt((Date.now() - 28 * 86_400_000) * 1_000_000),
          comment:
            "Left our two anxious rescues with Morgan for a weekend. She kept us updated constantly. So grateful to have found her.",
          rating: BigInt(5),
        },
        {
          clientName: "David L.",
          createdAt: BigInt((Date.now() - 45 * 86_400_000) * 1_000_000),
          comment:
            "My senior lab has special needs and Morgan handled everything perfectly. Very professional.",
          rating: BigInt(5),
        },
      ],
    },
    pageComponents: demoSitter.pageComponents,
    stats: {
      totalBookings: 89,
      completedVisits: 89,
      uniqueClients: 23,
      repeatClients: 18,
    },
    availability: demoAvailability,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80&fit=crop",
      "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&q=80&fit=crop",
      "https://images.unsplash.com/photo-1534361960057-19f4434a4c70?w=600&q=80&fit=crop",
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80&fit=crop",
      "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&q=80&fit=crop",
    ],
    certifications: [
      "Pet CPR & First Aid Certified",
      "Fear Free Certified Professional",
      "AKC Canine Good Citizen Evaluator",
      "Pet First Aid — Red Cross",
    ],
    petTypes: ["Dogs", "Cats", "Rabbits", "Birds", "Small Pets"],
    responseTime: "within 2 hours",
    isAccepting: true,
    hideBookButton: false,
    // Premium cinematic mountain/meadow banner for the demo
    bannerUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1800&q=85&fit=crop",
    pinnedPromo: {
      description:
        "New client special — 20% off your first booking this month!",
      couponCode: "NEWPAW20",
    },
    credentialChecklist: {
      hasBusinessLicense: true,
      isInsuredAndBonded: true,
      hasBackgroundCheck: true,
      hasReferences: true,
      usesServiceAgreement: false,
      hasCertificationOrTraining: true,
      isProfessionalMember: false,
    },
  };

  return (
    <div
      className="space-y-4"
      onClickCapture={(e) => {
        // Intercept demo book clicks from within the storefront
        const target = e.target as HTMLElement;
        if (
          target.closest("[data-ocid='storefront.book_me.primary_button']") ||
          target.closest("[data-ocid='storefront.waitlist.button']")
        ) {
          handleEvent();
        }
      }}
    >
      {/* Info banner */}
      <div
        className="rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{
          background: "oklch(0.72 0.18 55 / 0.12)",
          border: "1px solid oklch(0.72 0.18 55 / 0.35)",
        }}
        data-ocid="demo.storefront.info_banner"
      >
        <Globe
          size={16}
          style={{ color: "oklch(0.82 0.16 55)" }}
          className="shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold"
            style={{ color: "oklch(0.88 0.14 55)" }}
          >
            This is what YOUR public page looks like to clients.
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.80 0.14 55 / 0.75)" }}
          >
            Share your link to let anyone book directly with you — no account
            needed.
          </p>
          <div
            className="inline-flex items-center gap-2 mt-2.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: "oklch(0.72 0.18 55 / 0.20)",
              border: "1px solid oklch(0.72 0.18 55 / 0.40)",
              color: "oklch(0.88 0.14 55)",
            }}
          >
            <Globe size={10} />
            pawspect.co/sitter/morgan-pawley
            <Copy size={10} className="opacity-60" />
          </div>
        </div>
      </div>

      {/* Book click toast */}
      {showBookToast && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium text-emerald-900 bg-emerald-100 border border-emerald-200">
          ✓ In the live app, this opens the booking wizard for Morgan Pawley!
        </div>
      )}

      {/* Real storefront rendered in a contained card */}
      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{ border: "1px solid oklch(1 0 0 / 0.10)" }}
        data-ocid="demo.storefront.card"
      >
        <SitterStorefrontPage previewData={previewData} />
      </div>
    </div>
  );
}

// ── Demo Help Desk Tab ─────────────────────────────────────────────────────────

const DEMO_TICKETS = [
  {
    id: "#TKT-001",
    issue: "I need help updating my service area and availability",
    status: "resolved" as const,
    submittedLabel: "3 days ago",
    adminNotes:
      "Service area can be updated in your Profile tab under 'Location & Area'. Availability is set in your Availability tab. Both are saved instantly. Let us know if you need anything else!",
  },
  {
    id: "#TKT-002",
    issue: "Billing question about my subscription",
    status: "open" as const,
    submittedLabel: "1 day ago",
    adminNotes: null,
  },
];

function DemoHelpDeskTab() {
  const [showDialog, setShowDialog] = useState(false);
  const [ticketIssue, setTicketIssue] = useState("");

  const handleDemoSubmit = () => {
    if (ticketIssue.trim().length < 10) {
      toast.error("Please describe your issue in at least 10 characters.");
      return;
    }
    setShowDialog(false);
    setTicketIssue("");
    toast.success(
      "Demo mode — in the real portal, this would submit your ticket to the admin.",
    );
  };

  return (
    <div className="space-y-6">
      {/* ── FAQ first-line help ──────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6"
        data-ocid="demo.helpdesk.faq_section"
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
              Search our help center — most questions are answered here
              instantly.
            </p>
          </div>
        </div>
        <SitterPortalFAQ />
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4"
        data-ocid="demo.helpdesk.divider"
      >
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 whitespace-nowrap">
          Still need help? Submit a support ticket
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* ── Privacy note ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-200/60 bg-indigo-50/30 px-4 py-3">
        <Shield size={15} className="text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          <span className="font-semibold">
            Your personal and financial data stays private.
          </span>{" "}
          Admins only receive what's needed to resolve your issue — and all
          access is logged and automatically revoked when your ticket is closed.
        </p>
      </div>

      {/* ── Demo tickets ────────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6 space-y-5"
        data-ocid="demo.helpdesk.ticket_section"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Shield size={18} className="text-primary shrink-0" />
              Support Requests
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Contact our team if you need help with your account.
            </p>
          </div>
          <Button
            size="sm"
            data-ocid="demo.helpdesk.open_modal_button"
            onClick={() => setShowDialog(true)}
            className="rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            <Plus size={14} />
            Open Support Ticket
          </Button>
        </div>

        {/* Ticket cards */}
        <div className="space-y-3">
          {DEMO_TICKETS.map((ticket, i) => (
            <div
              key={ticket.id}
              data-ocid={`demo.helpdesk.ticket.item.${i + 1}`}
              className="bg-background rounded-xl border border-border p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {ticket.status === "resolved" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={10} />
                      Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Clock size={10} />
                      Open
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {ticket.id}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {ticket.submittedLabel}
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {ticket.issue}
              </p>

              {ticket.adminNotes && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">
                    Admin Notes
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {ticket.adminNotes}
                  </p>
                </div>
              )}

              {ticket.status === "resolved" && (
                <p className="text-[11px] text-muted-foreground/60 italic flex items-center gap-1.5">
                  <Lock size={10} />
                  Your data stayed private — admin only saw what was needed to
                  resolve this ticket.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Demo submit dialog ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
            onClick={(e) =>
              e.target === e.currentTarget && setShowDialog(false)
            }
            data-ocid="demo.helpdesk.dialog"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                  <LifeBuoy size={18} className="text-primary" />
                  Open a Support Ticket
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                  data-ocid="demo.helpdesk.close_button"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe your issue clearly. Our team will review it and may
                  request limited access to your account to help — only with
                  your permission, and all access is audited.
                </p>
                <textarea
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="e.g. I'm unable to see my invoice for booking #1042. The page loads but the data is missing."
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground resize-none min-h-[120px]"
                  data-ocid="demo.helpdesk.textarea"
                />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowDialog(false)}
                    data-ocid="demo.helpdesk.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={handleDemoSubmit}
                    data-ocid="demo.helpdesk.submit_button"
                  >
                    Submit Ticket
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  🔒 Demo mode — tickets are not actually submitted
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Demo nav config (mirrors live sitterNavGroups, no billing tab) ────────────

const demoNavGroups: NavGroup[] = [
  {
    label: "My Business",
    tabs: [
      {
        value: "bookings",
        label: "Bookings",
        icon: CalendarDays,
        ocid: "demo.tab.bookings",
      },
      {
        value: "agenda",
        label: "Agenda",
        icon: CalendarDays,
        ocid: "demo.tab.agenda",
      },
      {
        value: "invoices",
        label: "Invoices",
        icon: Receipt,
        ocid: "demo.tab.invoices",
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
        ocid: "demo.tab.analytics",
      },
      {
        value: "coach",
        label: "Coach",
        icon: Sparkles,
        ocid: "demo.tab.coach",
      },
      { value: "crm", label: "CRM", icon: Users, ocid: "demo.tab.crm" },
    ],
  },
  {
    label: "My Site",
    tabs: [
      {
        value: "profile",
        label: "Profile",
        icon: User,
        ocid: "demo.tab.profile",
      },
      {
        value: "service-log",
        label: "Service Log",
        icon: Clock,
        ocid: "demo.tab.service-log",
      },
      {
        value: "public-page",
        label: "My Public Page",
        icon: Globe,
        ocid: "demo.tab.public-page",
      },
    ],
  },
  {
    label: "Account",
    tabs: [
      {
        value: "help-desk",
        label: "Help Desk",
        icon: LifeBuoy,
        ocid: "demo.tab.help-desk",
      },
    ],
  },
];

const demoPrimaryTabs: NavTab[] = [
  { value: "bookings", label: "Bookings", icon: CalendarDays },
  { value: "coach", label: "Coach", icon: Sparkles },
  { value: "profile", label: "Profile", icon: User },
];

// ── Main inner component ───────────────────────────────────────────────────────

function DemoDashboardInner({ navigate }: Props) {
  const {
    demoSitter,
    demoBookings,
    demoPayments,
    demoAvailability,
    demoServiceLogs,
  } = useDemoMode();

  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingsTab, setBookingsTab] = useState<"current" | "past">("current");
  const [demoDeclineOpen, setDemoDeclineOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [demoDeclineBooking, setDemoDeclineBooking] = useState<any | null>(
    null,
  );

  const allBookingsList = [...demoBookings].sort((a, b) =>
    Number(b.startDate - a.startDate),
  );

  const currentBookings = allBookingsList.filter((b) =>
    ["pending", "confirmed", "in_progress"].includes(b.status as string),
  );
  const pastBookings = allBookingsList.filter((b) =>
    ["completed", "cancelled", "declined"].includes(b.status as string),
  );

  // Cast demo bookings to the shape BookingCard expects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingsForInvoices = demoBookings as unknown as any[];

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* ── Portal sidebar (desktop) ────────────────────────────────────── */}
      <PortalSidebar
        groups={demoNavGroups}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="sitter"
      />

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        {/* ── Decline modal (demo mode) ─────────────────────────────────────── */}
        <DeclineBookingModal
          booking={demoDeclineBooking}
          open={demoDeclineOpen}
          onClose={() => {
            setDemoDeclineOpen(false);
            setDemoDeclineBooking(null);
          }}
          onConfirm={async () => {
            toast.info("Changes are disabled in demo mode");
            setDemoDeclineOpen(false);
            setDemoDeclineBooking(null);
          }}
          demoMode
        />
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 frosted-nav">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-ocid="demo.back_to_features.button"
                onClick={() => navigate("sitter-features")}
                className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 shrink-0"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Portal Overview</span>
                <span className="inline sm:hidden">Back</span>
              </button>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="font-display font-semibold hidden sm:inline truncate">
                Sitter Dashboard
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Subtle demo indicator */}
              <span
                data-ocid="demo.indicator.badge"
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border"
                style={{
                  color: "oklch(0.55 0.04 260)",
                  background: "oklch(0.97 0.01 260)",
                  borderColor: "oklch(0.88 0.03 260)",
                  opacity: 0.7,
                }}
              >
                <Eye size={10} />
                Demo Preview
              </span>

              {/* Sitter avatar pill */}
              <div className="flex items-center gap-2 text-sm font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  MP
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {demoSitter.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 overflow-x-hidden">
          {/* Demo mode banner */}
          <div
            className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.96 0.02 260), oklch(0.97 0.01 50))",
              border: "1px solid oklch(0.88 0.04 260)",
            }}
            data-ocid="demo.info.banner"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              }}
            >
              <Eye size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                You&apos;re exploring Morgan Pawley&apos;s Sitter Portal
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All tabs are fully interactive with realistic sample data.
                Changes and mutations are disabled in preview mode.
              </p>
            </div>
            <Button
              size="sm"
              data-ocid="demo.apply_button"
              onClick={() => navigate("sitter-apply")}
              className="rounded-full text-xs font-semibold shrink-0 hidden sm:flex"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "white",
                border: "none",
              }}
            >
              Apply to Join →
            </Button>
          </div>

          {/* ── Tab content ─────────────────────────────────────────────────── */}

          {/* ── Bookings tab ─────────────────────────────────────────────── */}
          {activeTab === "bookings" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              {" "}
              <h2 className="font-display text-xl font-bold mb-5">
                Your Bookings
              </h2>
              <div className="flex gap-2 mb-5" data-ocid="demo.booking_tabs">
                <button
                  type="button"
                  data-ocid="demo.tab.current"
                  onClick={() => setBookingsTab("current")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    bookingsTab === "current"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  Current
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      bookingsTab === "current"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {currentBookings.length}
                  </span>
                </button>
                <button
                  type="button"
                  data-ocid="demo.tab.past"
                  onClick={() => setBookingsTab("past")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    bookingsTab === "past"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  Past
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      bookingsTab === "past"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {pastBookings.length}
                  </span>
                </button>
              </div>
              <div className="space-y-3">
                {(bookingsTab === "current"
                  ? currentBookings
                  : pastBookings
                ).map((b, i) => {
                  const statusStr = b.status as string;
                  return (
                    <BookingCard
                      key={b.id.toString()}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      booking={b as any}
                      senderName={demoSitter.name}
                      index={i}
                      onConfirm={
                        statusStr === "pending"
                          ? () =>
                              toast.info("Changes are disabled in demo mode")
                          : undefined
                      }
                      onComplete={
                        statusStr === "confirmed"
                          ? () =>
                              toast.info("Changes are disabled in demo mode")
                          : undefined
                      }
                      onCancel={() =>
                        toast.info("Changes are disabled in demo mode")
                      }
                      onDecline={
                        statusStr === "pending"
                          ? (booking) => {
                              setDemoDeclineBooking(booking);
                              setDemoDeclineOpen(true);
                            }
                          : undefined
                      }
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      allSitters={[demoSitter] as any}
                      extraContent={
                        statusStr === "completed" ? (
                          <DemoServiceLogInline bookingId={b.id} />
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Agenda tab ───────────────────────────────────────────────── */}
          {activeTab === "agenda" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-3 sm:p-6 overflow-x-hidden">
              <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                Your Agenda
              </h2>
              <AgendaTab
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                bookings={allBookingsList as unknown as any[]}
                availability={demoAvailability as AvailabilityEntry[]}
                sitterId={demoSitter.id}
              />
            </div>
          )}

          {/* ── Invoices tab ─────────────────────────────────────────────── */}
          {activeTab === "invoices" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <h2 className="font-display text-xl font-bold mb-5">
                Invoices &amp; Payments
              </h2>
              <SitterInvoicesTab
                bookings={bookingsForInvoices}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                allSitters={[demoSitter] as any}
                sitterName={demoSitter.name}
                sitterPhone={demoSitter.phone}
                demoPayments={demoPayments}
                isDemoMode
              />
            </div>
          )}

          {/* ── Analytics tab ────────────────────────────────────────────── */}
          {activeTab === "analytics" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <AnalyticsDemoTab />
            </div>
          )}

          {/* ── Coach tab ────────────────────────────────────────────────── */}
          {activeTab === "coach" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <CoachDemoTab />
            </div>
          )}

          {/* ── CRM tab ──────────────────────────────────────────────────── */}
          {activeTab === "crm" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Client Relationship Manager
              </h2>
              <DemoCRMTab />
            </div>
          )}

          {/* ── Profile tab ──────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <ProfileDemoTab />
            </div>
          )}

          {/* ── Service Log tab ──────────────────────────────────────────── */}
          {activeTab === "service-log" && (
            <div className="bg-card rounded-2xl border border-border/60 gloss-ring p-4 sm:p-6">
              <h2 className="font-display text-xl font-bold mb-5">
                Service Log
              </h2>
              <div className="space-y-4">
                {demoServiceLogs.map((log, i) => {
                  const booking = demoBookings.find(
                    (b) => b.id === log.bookingId,
                  );
                  const startMs = Number(log.startTime) / 1_000_000;
                  const stopMs = log.stopTime
                    ? Number(log.stopTime) / 1_000_000
                    : null;
                  return (
                    <div
                      key={log.id.toString()}
                      data-ocid={`demo.service-log.item.${i + 1}`}
                      className="rounded-2xl border border-border/60 p-5 bg-card hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {booking?.clientName ?? "Client"} —{" "}
                            {booking?.pets?.[0]?.petName ?? "Pet"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {booking?.services?.join(", ")}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            log.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {String(log.status).replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 flex flex-wrap gap-3">
                        <span>
                          Check-in:{" "}
                          {new Date(startMs).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {stopMs && (
                          <span>
                            Check-out:{" "}
                            {new Date(stopMs).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      {"issueReported" in log && log.issueReported && (
                        <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <span className="text-amber-600 text-xs font-bold shrink-0 mt-0.5">
                            ⚠ Issue Reported
                          </span>
                          <span className="text-xs text-amber-700">
                            {String("issueNote" in log ? log.issueNote : "")}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-foreground leading-relaxed">
                        &ldquo;{log.notes}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ── Public Page tab ──────────────────────────────────────── */}
          {activeTab === "public-page" && (
            <div className="pb-4">
              <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                Your Public Sitter Page
              </h2>
              <DemoStorefrontTab />
            </div>
          )}

          {/* ── Help Desk tab ─────────────────────────────────────────── */}
          {activeTab === "help-desk" && (
            <div className="pb-4">
              <DemoHelpDeskTab />
            </div>
          )}

          {/* CTA at bottom */}
          <div className="mt-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Ready to run your pet care business like this?
            </p>
            <Button
              data-ocid="demo.bottom.apply_button"
              onClick={() => navigate("sitter-apply")}
              className="rounded-full px-8 h-12 text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "white",
                border: "none",
              }}
            >
              Apply to Become a Sitter →
            </Button>
          </div>
        </div>
      </div>

      {/* ── Portal bottom nav (mobile) ──────────────────────────────────── */}
      <PortalBottomNav
        groups={demoNavGroups}
        primaryTabs={demoPrimaryTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portalType="sitter"
      />
    </div>
  );
}

/** Inline service log preview for completed booking cards */
function DemoServiceLogInline({ bookingId }: { bookingId: bigint }) {
  const { demoServiceLogs } = useDemoMode();
  const log = demoServiceLogs.find((l) => l.bookingId === bookingId);
  if (!log) return null;
  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">
        Service Notes
      </p>
      <p className="text-xs text-foreground leading-relaxed">
        &ldquo;{log.notes}&rdquo;
      </p>
    </div>
  );
}

export default function SitterDemoPage({ navigate }: Props) {
  return (
    <DemoModeProvider>
      <DemoDashboardInner navigate={navigate} />
    </DemoModeProvider>
  );
}
