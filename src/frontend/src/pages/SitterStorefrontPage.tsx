import {
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Heart,
  Info,
  Lock,
  type LucideProps,
  MapPin,
  PawPrint,
  RefreshCcw,
  Scissors,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  Tag,
  UserCheck,
  Users,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
} from "motion/react";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { APP_NAME, BUSINESS_CONFIG, zipToAreaName } from "../config/business";
import {
  useDealOffersBySitter,
  usePublicSitterProfile,
  useSitterAvailability,
  useSitterBookingStats,
  useSitterExtendedPublic,
  useSubmitReview,
} from "../hooks/useQueries";
import { CREDENTIAL_ITEMS } from "../types/sitter-v2";
import type {
  CredentialChecklist,
  PageComponentVisibility,
} from "../types/sitter-v2";
import { DEFAULT_PAGE_COMPONENTS } from "../types/sitter-v2";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHandleFromHash(): string {
  const hash = window.location.hash ?? "";
  const match = hash.match(/^#\/sitter\/([^?#]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getQueryParam(param: string): string | null {
  const hash = window.location.hash ?? "";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const qs = hash.slice(qIndex + 1);
  const params = new URLSearchParams(qs);
  return params.get(param);
}

function certIcon(cert: string) {
  const c = cert.toLowerCase();
  if (c.includes("first aid")) return Shield;
  if (c.includes("fear")) return Heart;
  if (c.includes("cpr")) return ShieldCheck;
  if (c.includes("trainer")) return Award;
  if (c.includes("insured") || c.includes("bonded")) return Lock;
  return ShieldCheck;
}

function serviceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("bath") || n.includes("groom")) return Scissors;
  if (n.includes("house") || n.includes("overnight") || n.includes("stay"))
    return Shield;
  if (n.includes("walk")) return PawPrint;
  if (n.includes("day") || n.includes("drop")) return Calendar;
  return PawPrint;
}

const CREDENTIAL_ICON_MAP: Record<
  string,
  (props: LucideProps) => ReactElement
> = {
  FileCheck: (p) => <FileCheck {...p} />,
  ShieldCheck: (p) => <ShieldCheck {...p} />,
  Shield: (p) => <Shield {...p} />,
  UserCheck: (p) => <UserCheck {...p} />,
  Users: (p) => <Users {...p} />,
  ClipboardList: (p) => <ClipboardList {...p} />,
  FileText: (p) => <FileText {...p} />,
  Award: (p) => <Award {...p} />,
  BadgeCheck: (p) => <BadgeCheck {...p} />,
  Star: (p) => <Star {...p} />,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardEntrance = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── AnimatedCounter ──────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  duration = 2,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [inView, value, motionValue, duration]);

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${Math.round(latest)}${suffix}`;
      }
    });
  }, [motionValue, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ─── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200"
          }
        />
      ))}
    </div>
  );
}

// ─── BookMeButton ─────────────────────────────────────────────────────────────

function BookMeButton({
  sitterId,
  sitterName = "",
  className = "",
  isPreview = false,
  size = "md",
}: {
  sitterId: bigint;
  sitterName?: string;
  className?: string;
  isPreview?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const handleBook = () => {
    if (isPreview) {
      window.dispatchEvent(new CustomEvent("demo-book-click"));
      return;
    }
    window.location.hash = `/sitter-detail?sitterId=${sitterId}&preselectSitter=true`;
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  return (
    <motion.button
      type="button"
      data-ocid="storefront.book_me.primary_button"
      onClick={handleBook}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center font-bold rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transition-shadow hover:shadow-xl ${
        sizeStyles[size]
      } ${className}`}
    >
      <PawPrint size={size === "lg" ? 18 : 15} strokeWidth={2.5} />
      Book {sitterName ? sitterName : "Now"}
    </motion.button>
  );
}

// ─── ShareButton ──────────────────────────────────────────────────────────────

function ShareButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} on ${APP_NAME}`, url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <motion.button
      type="button"
      aria-label="Share profile"
      data-ocid="storefront.share.button"
      onClick={handleShare}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-11 h-11 rounded-full flex items-center justify-center bg-white/80 border border-gray-200 shadow-sm transition-colors hover:bg-white"
    >
      {copied ? (
        <Copy size={15} className="text-emerald-600" />
      ) : (
        <Share2 size={15} className="text-gray-600" />
      )}
    </motion.button>
  );
}

// ─── ReviewModal (always light) ───────────────────────────────────────────────

function ReviewModal({
  sitterId,
  onClose,
}: { sitterId: bigint; onClose: () => void }) {
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    await submitReview.mutateAsync({
      sitterId,
      rating: stars,
      reviewText: text,
      bookingId: BigInt(0),
    });
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      data-ocid="storefront.review.dialog"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 space-y-5 max-h-[90dvh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-gray-900">
            Leave a Review
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-ocid="storefront.review.close_button"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
            <p className="text-gray-900 font-semibold">
              Thank you for your review!
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-gray-500 text-sm mb-2">Your rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStars(i)}
                    data-ocid={`storefront.review.star.${i}`}
                    className="transition-transform hover:scale-125"
                  >
                    <Star
                      size={28}
                      className={
                        i <= stars
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share your experience with this sitter…"
                rows={4}
                data-ocid="storefront.review.textarea"
                className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitReview.isPending}
              data-ocid="storefront.review.submit_button"
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              {submitReview.isPending ? "Submitting…" : "Submit Review"}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── LightboxModal ────────────────────────────────────────────────────────────

function LightboxModal({
  photos,
  startIndex,
  onClose,
}: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")
        setIdx((c) => (c - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setIdx((c) => (c + 1) % photos.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, photos.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      data-ocid="storefront.lightbox.dialog"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        data-ocid="storefront.lightbox.close_button"
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={22} />
      </button>
      <button
        type="button"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIdx((idx - 1 + photos.length) % photos.length);
        }}
        data-ocid="storefront.lightbox.prev"
      >
        <ChevronLeft size={28} />
      </button>
      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        src={photos[idx]}
        alt={`Visit ${idx + 1} of ${photos.length}`}
        className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIdx((idx + 1) % photos.length);
        }}
        data-ocid="storefront.lightbox.next"
      >
        <ChevronRight size={28} />
      </button>
      <p className="absolute bottom-4 text-white/50 text-sm">
        {idx + 1} / {photos.length}
      </p>
    </motion.div>
  );
}

// ─── Availability helpers ─────────────────────────────────────────────────────

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
}: { icon: ReactElement; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold text-gray-900">
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-2 text-sm font-normal text-amber-600">
            ({count})
          </span>
        )}
      </h2>
    </div>
  );
}

// ─── Light skeleton ───────────────────────────────────────────────────────────

function StorefrontSkeleton() {
  return (
    <div
      className="min-h-screen bg-gray-50"
      data-ocid="storefront.loading_state"
    >
      {/* Hero skeleton */}
      <div
        className="w-full bg-amber-50 animate-pulse"
        style={{ height: 280 }}
      />
      <div className="max-w-2xl mx-auto px-4 -mt-12 space-y-4 pb-20">
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-lg" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-8 bg-gray-200 rounded-xl w-48 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
        {[1, 2, 3].map((k) => (
          <div
            key={k}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Preview / demo data shape ────────────────────────────────────────────────

export interface StorefrontPreviewData {
  profile: import("../hooks/useQueries").PublicSitterProfile & {
    location?: string;
  };
  pageComponents?: PageComponentVisibility;
  stats?: {
    totalBookings: number;
    completedVisits: number;
    uniqueClients: number;
    repeatClients: number;
  } | null;
  availability?: Array<{
    dayOfWeek: bigint;
    startTime: bigint;
    endTime?: bigint;
  }>;
  galleryPhotos?: string[];
  certifications?: string[];
  petTypes?: string[];
  responseTime?: string;
  isAccepting?: boolean;
  hideBookButton?: boolean;
  bannerUrl?: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface StorefrontPageProps {
  previewData?: StorefrontPreviewData;
}

export default function SitterStorefrontPage({
  previewData,
}: StorefrontPageProps = {}) {
  const handle = previewData ? "" : getHandleFromHash();
  const reviewParam = previewData ? null : getQueryParam("review");

  const {
    data: fetchedProfile,
    isLoading,
    isError,
    refetch,
  } = usePublicSitterProfile(handle);

  const sitterNumId =
    !previewData && fetchedProfile ? Number(fetchedProfile.id) : null;
  const { data: extData } = useSitterExtendedPublic(sitterNumId);
  const { data: fetchedStats } = useSitterBookingStats(sitterNumId);
  const { data: fetchedAvailability } = useSitterAvailability(
    !previewData && fetchedProfile ? fetchedProfile.id : null,
  );
  const { data: dealOffers } = useDealOffersBySitter(null);

  const profile = previewData ? previewData.profile : fetchedProfile;
  const stats = previewData ? previewData.stats : fetchedStats;
  const availability = previewData
    ? previewData.availability
    : fetchedAvailability;

  const pc: PageComponentVisibility =
    previewData?.pageComponents ??
    extData?.pageComponents ??
    DEFAULT_PAGE_COMPONENTS;

  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (reviewParam === "1") setShowReviewModal(true);
  }, [reviewParam]);

  useEffect(() => {
    const handler = () => setShowStickyHeader(window.scrollY > 260);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // 15s timeout: if still loading, show retry UI
  useEffect(() => {
    if (!previewData && !profile && isLoading) {
      const t = setTimeout(() => setTimedOut(true), 15000);
      return () => clearTimeout(t);
    }
    setTimedOut(false);
  }, [previewData, profile, isLoading]);

  // SEO meta
  useEffect(() => {
    if (!profile || previewData) return;
    const services = (profile.services ?? [])
      .map((s) => s.serviceName)
      .join(", ");
    const location =
      zipToAreaName(
        (profile as unknown as Record<string, string>).location ?? "",
      ) || "Local Area";
    document.title = `${profile.name} — Professional Pet Sitter in ${location} | ${APP_NAME}`;
    const setMeta = (attr: string, val: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${val}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    const desc = `${profile.name} is a professional pet sitter offering ${services || "pet care services"} in ${location}. Book directly.`;
    setMeta("name", "description", desc);
    setMeta(
      "property",
      "og:title",
      `${profile.name} — Pet Sitter | ${APP_NAME}`,
    );
    setMeta("property", "og:description", desc);
    if (profile.profilePhotoUrl)
      setMeta("property", "og:image", profile.profilePhotoUrl);
    return () => {
      document.title = APP_NAME;
    };
  }, [profile, previewData]);

  // ── No handle ─────────────────────────────────────────────────────────────
  if (!previewData && !handle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3 p-8">
          <PawPrint size={40} className="text-amber-500 mx-auto" />
          <p className="font-display text-lg font-bold text-gray-900">
            No sitter handle provided
          </p>
          <a
            href="#/"
            className="text-amber-600 hover:underline text-sm"
            data-ocid="storefront.home.link"
          >
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!previewData && isLoading && !profile) {
    if (timedOut || isError) {
      return (
        <div
          className="min-h-screen bg-gray-50 flex items-center justify-center"
          data-ocid="storefront.error_state"
        >
          <div className="text-center space-y-4 p-8 max-w-sm">
            <PawPrint size={40} className="text-amber-500 mx-auto" />
            <p className="font-display text-lg font-bold text-gray-900">
              Having trouble loading this page
            </p>
            <p className="text-gray-500 text-sm">
              The connection may be slow. Tap to try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setTimedOut(false);
                refetch();
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl shadow-md"
              data-ocid="storefront.retry_button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return <StorefrontSkeleton />;
  }

  // ── Profile not found ──────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3 p-8 max-w-sm mx-auto">
          <PawPrint size={28} className="text-amber-500 mx-auto" />
          <p className="font-display text-lg font-bold text-gray-900">
            Profile not found
          </p>
          <p className="text-gray-500 text-sm">
            This sitter’s profile wasn’t found.
          </p>
          <a
            href="#/"
            className="text-amber-600 hover:underline text-sm font-medium"
            data-ocid="storefront.home.link"
          >
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  if (!profile.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3 p-8 max-w-sm mx-auto">
          <PawPrint size={28} className="text-amber-500 mx-auto" />
          <p className="font-display text-lg font-bold text-gray-900">
            Not accepting bookings
          </p>
          <p className="text-gray-500 text-sm">
            {profile.name} isn’t currently accepting new bookings.
          </p>
          <a
            href="#/"
            className="text-amber-600 hover:underline text-sm font-medium"
            data-ocid="storefront.home.link"
          >
            ← Find available sitters
          </a>
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const locationStr =
    (profile as unknown as Record<string, string>).location ?? "";
  const areaName = zipToAreaName(locationStr);
  const isAccepting =
    previewData?.isAccepting ?? extData?.acceptingNewClients ?? true;
  const galleryPhotos = (
    previewData?.galleryPhotos ??
    extData?.galleryPhotos ??
    []
  ).slice(0, 10);
  const certifications =
    previewData?.certifications ?? extData?.certificationsList ?? [];
  const petTypes = previewData?.petTypes ?? extData?.petTypesServed ?? [];
  const responseTime = previewData?.responseTime ?? extData?.responseTime;
  const bannerUrl = previewData?.bannerUrl ?? extData?.bannerUrl;

  const pinnedPromo =
    !previewData && extData?.pinnedPromoOfferId && Array.isArray(dealOffers)
      ? (
          dealOffers as Array<{
            id: string;
            description: string;
            couponCode: string;
            expirationDate: bigint;
            discountValue: number;
            discountType: { percent?: null; fixed?: null };
          }>
        ).find(
          (o) =>
            o.id === extData.pinnedPromoOfferId &&
            o.expirationDate > BigInt(Date.now() * 1_000_000),
        )
      : null;
  const demoPromo = previewData
    ? (
        previewData as StorefrontPreviewData & {
          pinnedPromo?: { description: string; couponCode: string };
        }
      ).pinnedPromo
    : null;

  const next14 = getNext14Days();
  const availDays = new Set(
    (
      (availability ?? []) as Array<{
        dayOfWeek: bigint | number;
        isAvailable?: boolean;
      }>
    )
      .filter((a) => a.isAvailable !== false)
      .map((a) => Number(a.dayOfWeek)),
  );
  const calDays = next14.map((d) => ({
    date: d,
    available: availDays.size === 0 ? true : availDays.has(d.getDay()),
  }));
  const nextAvailable = calDays.find((c) => c.available);

  const recentReviews = (profile.reviews ?? []).slice(0, 5);
  const topService = (profile.services ?? [])[0]?.serviceName ?? "pet sitting";
  const repeatRate =
    stats && stats.uniqueClients > 0
      ? Math.round((stats.repeatClients / stats.uniqueClients) * 100)
      : 0;

  const credentialChecklist = previewData
    ? (
        previewData as StorefrontPreviewData & {
          credentialChecklist?: CredentialChecklist;
        }
      ).credentialChecklist
    : extData?.credentialChecklist;

  const hasCredentials =
    pc.showCredentials &&
    credentialChecklist &&
    CREDENTIAL_ITEMS.some((item) => {
      const cl = credentialChecklist as CredentialChecklist &
        Record<string, boolean>;
      const pubKey = `${item.key}Public` as keyof typeof cl;
      const isChecked = cl[item.key] === true;
      const hasPublicFlag = pubKey in cl;
      return isChecked && (hasPublicFlag ? cl[pubKey] === true : isChecked);
    });

  const firstName = profile.name.split(" ")[0];

  return (
    <div
      className="min-h-screen bg-gray-50 overflow-x-hidden"
      data-ocid="storefront.page"
    >
      {/* ── Sticky header (desktop + mobile) ─────────────────────────────── */}
      <motion.div
        initial={false}
        animate={
          showStickyHeader ? { opacity: 1, y: 0 } : { opacity: 0, y: -64 }
        }
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #f3f4f6",
          pointerEvents: showStickyHeader ? "auto" : "none",
        }}
        data-ocid="storefront.sticky_header"
      >
        <div className="flex items-center gap-3 min-w-0">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={profile.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400/60 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 ring-2 ring-amber-300">
              <span className="text-sm font-bold text-white">
                {profile.name[0]}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {profile.name}
            </p>
            <div className="flex items-center gap-1">
              <StarRating rating={profile.averageRating} size={10} />
              <span className="text-xs text-gray-400">
                {profile.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <BookMeButton
          sitterId={profile.id}
          sitterName={firstName}
          size="sm"
          isPreview={!!previewData}
        />
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: 320 }}
        data-ocid="storefront.hero.section"
      >
        {/* Warm light background or banner */}
        {bannerUrl ? (
          <>
            <img
              src={bannerUrl}
              alt={`${profile.name} banner`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.92) 100%)",
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-white" />
        )}

        {/* Decorative paw watermark */}
        <div
          className="absolute right-6 top-6 opacity-[0.06] pointer-events-none"
          aria-hidden
        >
          <PawPrint size={160} className="text-amber-500" />
        </div>

        {/* Share button */}
        <div className="absolute top-4 right-4 z-10">
          <ShareButton name={profile.name} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-10 flex flex-col items-center text-center">
          {/* Profile photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-5"
          >
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={`${profile.name} — pet sitter`}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-amber-200/60"
              />
            ) : (
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-xl ring-4 ring-amber-200/60 flex items-center justify-center"
                aria-label={`${profile.name} — no photo`}
              >
                <span className="text-4xl font-black text-white font-display">
                  {profile.name[0]}
                </span>
              </div>
            )}
            {/* Status dot */}
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow ${
                isAccepting ? "bg-emerald-400" : "bg-amber-400"
              }`}
              title={isAccepting ? "Accepting new clients" : "Waitlist only"}
            />
          </motion.div>

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold text-gray-900 leading-tight mb-2"
            style={{
              fontSize: "clamp(1.85rem, 6vw, 2.75rem)",
              letterSpacing: "-0.03em",
            }}
          >
            {profile.name}
          </motion.h1>

          {/* Location */}
          {areaName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 text-gray-500 text-sm mb-4"
            >
              <MapPin size={13} className="text-amber-500 shrink-0" />
              {areaName}
            </motion.p>
          )}

          {/* Status + response time badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-5"
          >
            <span
              data-ocid="storefront.accepting_status.badge"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isAccepting
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isAccepting ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
              />
              {isAccepting ? "Accepting New Clients" : "Waitlist Only"}
            </span>
            {pc.showResponseTime && responseTime && (
              <span
                data-ocid="storefront.response_time.badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
              >
                <Zap size={11} className="fill-blue-500 text-blue-500" />
                Replies {responseTime.toLowerCase()}
              </span>
            )}
          </motion.div>

          {/* Star rating */}
          {Number(profile.reviewCount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-center gap-2 mb-7"
            >
              <StarRating rating={profile.averageRating} size={16} />
              <span className="font-bold text-gray-900 text-sm">
                {profile.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-400 text-sm">
                · {Number(profile.reviewCount)} review
                {Number(profile.reviewCount) !== 1 ? "s" : ""}
              </span>
            </motion.div>
          )}

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <BookMeButton
              sitterId={profile.id}
              sitterName={firstName}
              size="lg"
              isPreview={!!previewData}
            />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-1 pointer-events-none"
            aria-hidden
          >
            <span className="text-xs text-gray-400 uppercase tracking-widest">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 1.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <ChevronDown size={16} className="text-gray-300" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Bio / About ───────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="bg-white px-4 py-10 border-b border-gray-100"
        data-ocid="storefront.about.section"
      >
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            icon={<PawPrint size={18} className="text-amber-500" />}
            title={`About ${firstName}`}
          />
          {profile.bio ? (
            <p className="text-gray-700 leading-relaxed text-base">
              {profile.bio.replace(/\[badges:[^\]]*\]/g, "").trim()}
            </p>
          ) : (
            <p className="text-gray-500 leading-relaxed text-base">
              {firstName} is a dedicated, independent pet sitter serving{" "}
              {areaName || "the local area"}. Passionate about animals and
              committed to excellent care.
            </p>
          )}
          {(profile.badges ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {(profile.badges ?? []).map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                  data-ocid="storefront.badge"
                >
                  <CheckCircle2 size={10} className="text-amber-500" />
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      {pc.showStats && stats && stats.totalBookings > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.stats.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<CheckCircle2 size={18} className="text-amber-500" />}
              title="By the Numbers"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              data-ocid="storefront.stats.card"
            >
              {[
                {
                  label: "Happy Clients",
                  value: stats.uniqueClients,
                  suffix: "",
                  icon: <Users size={18} className="text-amber-500" />,
                },
                {
                  label: "Visits Done",
                  value: stats.completedVisits,
                  suffix: "",
                  icon: <CheckCircle2 size={18} className="text-emerald-500" />,
                },
                {
                  label: "Repeat Rate",
                  value: repeatRate,
                  suffix: "%",
                  icon: <RefreshCcw size={18} className="text-blue-500" />,
                },
                {
                  label: "Total Bookings",
                  value: stats.totalBookings,
                  suffix: "",
                  icon: <Calendar size={18} className="text-purple-500" />,
                },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  variants={cardEntrance}
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="bg-white rounded-2xl p-5 text-center flex flex-col items-center gap-2 shadow-sm border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <p className="text-3xl font-black text-gray-900 font-display leading-none">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Services ──────────────────────────────────────────────────────── */}
      {(profile.services ?? []).length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-white px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.services.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<PawPrint size={18} className="text-amber-500" />}
              title="Services & Rates"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {(profile.services ?? []).map((svc) => {
                const SvcIcon = serviceIcon(svc.serviceName);
                return (
                  <motion.div
                    key={svc.serviceName}
                    variants={cardEntrance}
                    whileHover={{ scale: 1.02, y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3 group"
                    style={{
                      boxShadow:
                        "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                    data-ocid="storefront.service.card"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <SvcIcon size={18} className="text-amber-500" />
                      </div>
                      {svc.price > 0 && (
                        <span className="text-2xl font-black text-amber-600 font-display shrink-0">
                          ${svc.price}
                          <span className="text-sm font-normal text-gray-400">
                            /hr
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-base">
                      {svc.serviceName}
                    </p>
                    {svc.duration && (
                      <p className="text-xs text-gray-400">{svc.duration}</p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Pet Types ─────────────────────────────────────────────────────── */}
      {pc.showPetTypes && petTypes.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.pet_types.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<PawPrint size={18} className="text-amber-500" />}
              title="Cares For"
            />
            <div className="flex flex-wrap gap-3">
              {petTypes.map((type) => (
                <motion.span
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200 shadow-sm"
                  data-ocid="storefront.pet_type.pill"
                >
                  <PawPrint size={13} className="text-amber-500 shrink-0" />
                  {type}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Service Area ──────────────────────────────────────────────────── */}
      {areaName && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-white px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.service_area.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<MapPin size={18} className="text-amber-500" />}
              title="Service Area"
            />
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <MapPin size={22} className="text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Serving {areaName}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  and surrounding areas
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Promo banner ──────────────────────────────────────────────────── */}
      {pc.showPromo && (pinnedPromo || demoPromo) && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.promo.section"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
              className="rounded-2xl p-6 bg-gradient-to-r from-amber-500 to-orange-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              data-ocid="storefront.promo.card"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Tag size={18} className="text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80">
                    Special Offer
                  </p>
                  <p className="text-white font-semibold leading-tight">
                    {(pinnedPromo ?? demoPromo)?.description}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-center px-5 py-3 rounded-xl bg-white/20 border border-white/30">
                <p className="text-white/70 text-xs mb-1">Use code</p>
                <p className="font-black text-xl tracking-wider font-mono text-white">
                  {(pinnedPromo ?? demoPromo)?.couponCode}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Availability calendar ─────────────────────────────────────────── */}
      {pc.showAvailability && calDays.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-white px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.availability.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<Calendar size={18} className="text-amber-500" />}
              title="Availability"
            />
            {nextAvailable && (
              <div className="mb-4">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Next open: {DAY_NAMES_SHORT[nextAvailable.date.getDay()]},{" "}
                  {MONTH_SHORT[nextAvailable.date.getMonth()]}{" "}
                  {nextAvailable.date.getDate()}
                </span>
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
              {calDays.map((cd, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.28 }}
                  className={`flex-none snap-start rounded-xl p-3 flex flex-col items-center gap-1.5 w-[68px] border ${
                    cd.available
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                  data-ocid={`storefront.avail_day.${i + 1}`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      cd.available ? "text-emerald-600" : "text-gray-300"
                    }`}
                  >
                    {DAY_NAMES_SHORT[cd.date.getDay()]}
                  </span>
                  <span
                    className={`font-black text-lg ${
                      cd.available ? "text-gray-900" : "text-gray-300"
                    }`}
                  >
                    {cd.date.getDate()}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      cd.available ? "bg-emerald-400" : "bg-gray-200"
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />{" "}
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" />{" "}
                Booked
              </span>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Photo gallery ─────────────────────────────────────────────────── */}
      {pc.showGallery && galleryPhotos.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.gallery.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<ZoomIn size={18} className="text-amber-500" />}
              title="Visit Photos"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {galleryPhotos.map((url, i) => (
                <motion.button
                  key={i}
                  type="button"
                  variants={cardEntrance}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setLightboxIdx(i)}
                  data-ocid={`storefront.gallery.photo.${i + 1}`}
                  className="relative group overflow-hidden rounded-xl bg-gray-100"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  {!loadedImages.has(i) && (
                    <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />
                  )}
                  <img
                    src={url}
                    alt={`Sitter visit ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    style={{
                      opacity: loadedImages.has(i) ? 1 : 0,
                      transition: "opacity 0.3s ease",
                    }}
                    onLoad={() => setLoadedImages((p) => new Set([...p, i]))}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20">
                    <ZoomIn size={22} className="text-white drop-shadow" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Certifications ────────────────────────────────────────────────── */}
      {pc.showCertifications && certifications.length > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-white px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.certifications.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<Award size={18} className="text-amber-500" />}
              title="Certifications & Training"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {certifications.map((cert) => {
                const Icon = certIcon(cert);
                return (
                  <motion.div
                    key={cert}
                    variants={cardEntrance}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="rounded-2xl p-4 flex items-center gap-3 bg-white border border-gray-100 shadow-sm"
                    data-ocid="storefront.cert.card"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-purple-500" />
                    </div>
                    <span className="text-gray-800 font-semibold text-sm leading-tight">
                      {cert}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Professional Credentials ──────────────────────────────────────── */}
      {hasCredentials && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.credentials.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={<BadgeCheck size={18} className="text-amber-500" />}
              title="Professional Standards"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap gap-2.5 mb-4"
              data-ocid="storefront.credentials.list"
            >
              {CREDENTIAL_ITEMS.filter((item) => {
                if (!credentialChecklist) return false;
                const cl = credentialChecklist as CredentialChecklist &
                  Record<string, boolean>;
                const pubKey = `${item.key}Public` as keyof typeof cl;
                const isChecked = cl[item.key] === true;
                const hasPublicFlag = pubKey in cl;
                const isPublic = hasPublicFlag
                  ? cl[pubKey] === true
                  : isChecked;
                return isChecked && isPublic;
              }).map((item) => {
                const Icon = CREDENTIAL_ICON_MAP[item.icon];
                const badgeColors = [
                  "bg-emerald-50 text-emerald-700 border-emerald-200",
                  "bg-blue-50 text-blue-700 border-blue-200",
                  "bg-purple-50 text-purple-700 border-purple-200",
                  "bg-amber-50 text-amber-700 border-amber-200",
                ];
                const colorIdx =
                  CREDENTIAL_ITEMS.indexOf(item) % badgeColors.length;
                return (
                  <motion.span
                    key={item.key}
                    variants={{
                      hidden: { opacity: 0, scale: 0.85 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        transition: { duration: 0.3 },
                      },
                    }}
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium border ${badgeColors[colorIdx]}`}
                    data-ocid="storefront.credential.pill"
                  >
                    {Icon?.({ size: 13, className: "shrink-0" })}
                    {item.shortLabel}
                  </motion.span>
                );
              })}
            </motion.div>
            <div className="flex items-start gap-2">
              <Info size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <p
                className="text-xs text-gray-400 italic"
                data-ocid="storefront.credentials.disclaimer"
              >
                These credentials are{" "}
                <strong className="text-gray-600">
                  self-reported by the sitter
                </strong>{" "}
                and have{" "}
                <strong className="text-gray-600">
                  NOT been verified by {APP_NAME}
                </strong>
                . {APP_NAME} does not employ, endorse, or supervise this sitter.
                Please verify credentials independently before booking.
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Repeat client callout ─────────────────────────────────────────── */}
      {pc.showRepeatClients && stats && stats.repeatClients > 0 && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-white px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.repeat_clients.section"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="rounded-2xl p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 flex items-center gap-5"
              data-ocid="storefront.repeat_clients.card"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Heart size={26} className="text-rose-400 fill-rose-100" />
              </div>
              <div>
                <p className="text-gray-900 font-black text-xl leading-tight font-display">
                  <AnimatedCounter value={stats.repeatClients} />+ returning
                  clients
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Pet owners who keep coming back — again and again
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {pc.showReviews && (
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="bg-gray-50 px-4 py-10 border-b border-gray-100"
          data-ocid="storefront.reviews.section"
        >
          <div className="max-w-2xl mx-auto">
            <SectionHeader
              icon={
                <Star size={18} className="fill-amber-400 text-amber-400" />
              }
              title="Reviews"
              count={Number(profile.reviewCount)}
            />
            {recentReviews.length > 0 ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {recentReviews.map((rev, i) => {
                  const initials = rev.clientName
                    ? rev.clientName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?";
                  return (
                    <motion.div
                      key={`${rev.clientName}-${i}`}
                      variants={{
                        hidden: { opacity: 0, y: 18 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.45, delay: i * 0.1 },
                        },
                      }}
                      whileHover={{ y: -3 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 22,
                      }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden"
                      data-ocid={`storefront.review.item.${i + 1}`}
                    >
                      <span
                        className="absolute top-3 right-4 text-6xl font-black leading-none pointer-events-none select-none text-gray-100 font-serif"
                        aria-hidden
                      >
                        “
                      </span>
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {rev.clientName}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0">
                              {new Date(
                                Number(rev.createdAt) / 1_000_000,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <StarRating rating={Number(rev.rating)} size={12} />
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-sm leading-relaxed mt-3 text-gray-600 relative z-10">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div
                className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm"
                data-ocid="storefront.reviews.empty_state"
              >
                <Star size={36} className="text-amber-200 mx-auto mb-4" />
                <p className="text-gray-800 font-semibold mb-1">
                  Be their first happy client!
                </p>
                <p className="text-gray-400 text-sm">
                  Reviews appear here after completed bookings.
                </p>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="bg-gradient-to-br from-amber-500 to-orange-500 px-4 py-20 text-center relative overflow-hidden"
        data-ocid="storefront.footer_cta.section"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          aria-hidden
        >
          <PawPrint
            className="absolute -left-8 -bottom-8 text-white"
            size={200}
          />
          <PawPrint
            className="absolute -right-8 -top-8 text-white"
            size={160}
          />
        </div>
        <div className="relative z-10 max-w-lg mx-auto space-y-6">
          <h2
            className="font-display font-extrabold text-white"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              letterSpacing: "-0.03em",
            }}
          >
            Ready to book {firstName}?
          </h2>
          <p className="text-white/80 text-sm">
            {profile.name} is available for {topService}
            {areaName ? ` in the ${areaName}` : ""}.
          </p>
          <p
            data-ocid="storefront.booking_disclaimer.notice"
            className="text-white/50 text-xs max-w-xs mx-auto leading-relaxed"
          >
            {APP_NAME} is a software platform. Your booking is directly with{" "}
            {profile.name} — an independent professional. {APP_NAME} does not
            guarantee, supervise, or employ any sitter.
          </p>
          <motion.button
            type="button"
            data-ocid="storefront.footer_cta.book_button"
            onClick={() => {
              if (previewData) return;
              window.location.hash = `/sitter-detail?sitterId=${profile.id}&preselectSitter=true`;
            }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-10 py-4 bg-white text-amber-600 font-bold rounded-2xl shadow-xl text-base"
          >
            <PawPrint size={18} strokeWidth={2.5} />
            Book {firstName} Now
          </motion.button>
          <div className="pt-6 border-t border-white/20 space-y-2">
            <button
              type="button"
              data-ocid="storefront.leave_review.button"
              onClick={() => setShowReviewModal(true)}
              className="block w-full text-xs text-white/60 hover:text-white transition-colors"
            >
              Leave a review for {firstName} →
            </button>
            <a
              href="#/sitter-apply"
              className="block text-xs text-white/40 hover:text-white/70 transition-colors"
              data-ocid="storefront.become_sitter.link"
            >
              Are you a pet sitter? Join {APP_NAME} →
            </a>
            <a
              href="#/"
              className="block text-xs text-white/40 hover:text-white/70 transition-colors"
              data-ocid="storefront.home.link"
            >
              <ChevronLeft size={10} className="inline" /> {APP_NAME} Home
            </a>
            <p className="text-xs text-white/25 mt-4">
              Powered by{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/50 transition-colors inline-flex items-center gap-0.5"
              >
                Caffeine.ai <ExternalLink size={10} />
              </a>
              {" · "}
              {APP_NAME} — {BUSINESS_CONFIG.description}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Sticky mobile Book Me button ──────────────────────────────────── */}
      {!previewData && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-gray-100 px-4"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            paddingTop: "0.75rem",
          }}
          data-ocid="storefront.sticky_book_button"
        >
          <button
            type="button"
            onClick={() => {
              window.location.hash = `/sitter-detail?sitterId=${profile.id}&preselectSitter=true`;
            }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg"
          >
            <PawPrint size={18} strokeWidth={2.5} />
            Book {firstName}
          </button>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIdx !== null && galleryPhotos.length > 0 && (
          <LightboxModal
            photos={galleryPhotos}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReviewModal && (
          <ReviewModal
            sitterId={profile.id}
            onClose={() => setShowReviewModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
