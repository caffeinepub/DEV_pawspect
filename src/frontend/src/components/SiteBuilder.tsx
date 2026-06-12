/**
 * SiteBuilder — Component-based page configuration for the sitter's public page.
 * Used in the Profile tab of SitterDashboard and in ProfileDemoTab.
 *
 * Features:
 * - Enable/disable each page section via toggle
 * - Reorder sections via up/down arrows
 * - Edit section content via inline accordion settings panels
 * - Live "Preview My Page" button
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  GripVertical,
  Image,
  Info,
  Layers,
  Loader2,
  MessageSquare,
  PawPrint,
  Percent,
  Plus,
  Sparkles,
  Star,
  Tag,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import type {
  PageComponentVisibility,
  SiteBuilderSectionKey,
} from "../types/sitter-v2";
import { DEFAULT_SECTION_ORDER } from "../types/sitter-v2";

// ─── Section metadata ──────────────────────────────────────────────────────

interface SectionMeta {
  key: SiteBuilderSectionKey;
  label: string;
  description: string;
  icon: ReactNode;
  /** Maps to PageComponentVisibility key, or null for always-on sections */
  visibilityKey: keyof PageComponentVisibility | null;
  /** Whether the section has editable settings */
  hasSettings: boolean;
  /** Badge color class */
  color: string;
}

const SECTION_META: SectionMeta[] = [
  {
    key: "hero",
    label: "Hero Banner",
    description: "Cinematic header with your name, tagline, and Book Me CTA",
    icon: <Sparkles size={15} />,
    visibilityKey: null,
    hasSettings: true,
    color: "text-amber-500",
  },
  {
    key: "about",
    label: "About & Bio",
    description: "Your profile photo, bio text, and location",
    icon: <BookOpen size={15} />,
    visibilityKey: null,
    hasSettings: false,
    color: "text-blue-500",
  },
  {
    key: "services",
    label: "Services & Rates",
    description: "Your offered services with per-hour pricing",
    icon: <PawPrint size={15} />,
    visibilityKey: null,
    hasSettings: false,
    color: "text-indigo-500",
  },
  {
    key: "stats",
    label: "Booking Stats",
    description: "Completed visits count, unique clients, and repeat clients",
    icon: <Users size={15} />,
    visibilityKey: "showStats",
    hasSettings: false,
    color: "text-emerald-500",
  },
  {
    key: "gallery",
    label: "Photo Gallery",
    description: "Photo carousel from your gallery uploads",
    icon: <Image size={15} />,
    visibilityKey: "showGallery",
    hasSettings: false,
    color: "text-violet-500",
  },
  {
    key: "credentials",
    label: "Professional Credentials",
    description: "Your self-reported credential badges",
    icon: <BadgeCheck size={15} />,
    visibilityKey: "showCredentials",
    hasSettings: false,
    color: "text-teal-500",
  },
  {
    key: "reviews",
    label: "Reviews & Ratings",
    description: "Client star ratings and testimonials",
    icon: <Star size={15} />,
    visibilityKey: "showReviews",
    hasSettings: false,
    color: "text-yellow-500",
  },
  {
    key: "availability",
    label: "Availability Calendar",
    description: "Your weekly availability for clients to view",
    icon: <Calendar size={15} />,
    visibilityKey: "showAvailability",
    hasSettings: false,
    color: "text-cyan-500",
  },
  {
    key: "promo",
    label: "Promo / Offer Banner",
    description: "Pin a current deal or discount for new clients",
    icon: <Percent size={15} />,
    visibilityKey: "showPromo",
    hasSettings: false,
    color: "text-pink-500",
  },
  {
    key: "petTypes",
    label: "Pet Types Served",
    description: "Which animals you care for",
    icon: <Tag size={15} />,
    visibilityKey: "showPetTypes",
    hasSettings: false,
    color: "text-orange-500",
  },
  {
    key: "responseTime",
    label: "Response Time Badge",
    description: "How quickly you typically reply to inquiries",
    icon: <Timer size={15} />,
    visibilityKey: "showResponseTime",
    hasSettings: false,
    color: "text-sky-500",
  },
  {
    key: "bookCta",
    label: "Book Now CTA",
    description: "Bottom call-to-action section with booking button",
    icon: <Zap size={15} />,
    visibilityKey: null,
    hasSettings: true,
    color: "text-amber-500",
  },
];

// ─── Settings panel for each section ──────────────────────────────────────

interface SettingsPanelProps {
  sectionKey: SiteBuilderSectionKey;
  heroTagline: string;
  onHeroTaglineChange: (v: string) => void;
  isDemo?: boolean;
}

function SettingsPanel({
  sectionKey,
  heroTagline,
  onHeroTaglineChange,
  isDemo,
}: SettingsPanelProps) {
  if (sectionKey === "hero") {
    return (
      <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border/40">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Hero Settings
        </p>
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-foreground"
            htmlFor="hero-tagline"
          >
            Tagline
          </label>
          <Input
            id="hero-tagline"
            value={heroTagline}
            onChange={(e) => {
              if (isDemo) {
                toast.info("Changes are disabled in demo mode");
                return;
              }
              onHeroTaglineChange(e.target.value);
            }}
            placeholder="e.g. Boulder's most trusted pet sitter"
            className="text-sm"
            data-ocid="site_builder.hero.tagline.input"
          />
          <p className="text-xs text-muted-foreground">
            Appears below your name in the hero banner. Leave blank to show only
            your name.
          </p>
        </div>
      </div>
    );
  }

  if (sectionKey === "bookCta") {
    return (
      <div className="px-4 pb-4 pt-2 border-t border-border/40">
        <div className="flex items-start gap-2.5 rounded-xl bg-muted/30 p-3">
          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Book Now CTA always links to your booking page. Your sitter name
            and tagline (from Hero settings) are used here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border/40">
      <div className="flex items-start gap-2.5 rounded-xl bg-muted/30 p-3">
        <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          This section displays content from your profile automatically. Update
          it in the other profile settings above.
        </p>
      </div>
    </div>
  );
}

// ─── Single section card ───────────────────────────────────────────────────

interface SectionCardProps {
  meta: SectionMeta;
  isOn: boolean;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  isSaving: boolean;
  heroTagline: string;
  onHeroTaglineChange: (v: string) => void;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleExpand: () => void;
  isDemo?: boolean;
  index: number;
}

function SectionCard({
  meta,
  isOn,
  isFirst,
  isLast,
  isExpanded,
  isSaving,
  heroTagline,
  onHeroTaglineChange,
  onToggle,
  onMoveUp,
  onMoveDown,
  onToggleExpand,
  isDemo,
  index,
}: SectionCardProps) {
  const isAlwaysOn = meta.visibilityKey === null && !meta.hasSettings;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isOn
          ? "border-primary/25 bg-card shadow-sm"
          : "border-border/50 bg-muted/20"
      }`}
      data-ocid={`site_builder.section.${index + 1}`}
    >
      {/* Card header */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 sm:py-3">
        {/* Drag handle visual (no drag logic — using up/down buttons) */}
        <div className="text-muted-foreground/30 shrink-0 cursor-grab select-none hidden xs:block">
          <GripVertical size={15} />
        </div>

        {/* Icon */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isOn ? "bg-primary/10" : "bg-muted/40"
          }`}
        >
          <span className={isOn ? meta.color : "text-muted-foreground/40"}>
            {meta.icon}
          </span>
        </div>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p
              className={`text-sm font-semibold leading-tight ${isOn ? "text-foreground" : "text-muted-foreground"}`}
            >
              {meta.label}
            </p>
            {isAlwaysOn && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium hidden sm:inline">
                Always on
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1 hidden sm:block">
            {meta.description}
          </p>
        </div>

        {/* Up/down arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ${meta.label} up`}
            data-ocid={`site_builder.section.${index + 1}.move_up`}
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ${meta.label} down`}
            data-ocid={`site_builder.section.${index + 1}.move_down`}
            className="w-7 h-7 sm:w-6 sm:h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Toggle switch */}
        {!isAlwaysOn && (
          <Switch
            checked={isOn}
            onCheckedChange={onToggle}
            disabled={isSaving}
            aria-label={`${isOn ? "Hide" : "Show"} ${meta.label}`}
            data-ocid={`site_builder.section.${index + 1}.toggle`}
            className="shrink-0"
          />
        )}

        {/* Edit chevron for sections with settings */}
        {meta.hasSettings && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${meta.label} settings`}
            data-ocid={`site_builder.section.${index + 1}.edit_button`}
            className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isExpanded
                ? "bg-primary/10 text-primary"
                : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Expanded settings panel */}
      {isExpanded && meta.hasSettings && (
        <SettingsPanel
          sectionKey={meta.key}
          heroTagline={heroTagline}
          onHeroTaglineChange={onHeroTaglineChange}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}

// ─── Add section panel ─────────────────────────────────────────────────────

interface AddSectionPanelProps {
  hiddenSections: SectionMeta[];
  onAdd: (key: SiteBuilderSectionKey) => void;
  isDemo?: boolean;
}

function AddSectionPanel({
  hiddenSections,
  onAdd,
  isDemo,
}: AddSectionPanelProps) {
  const [open, setOpen] = useState(false);

  if (hiddenSections.length === 0) return null;

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-ocid="site_builder.add_section.button"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200"
        >
          <Plus size={15} />
          Add a hidden section back
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground">Add Section</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          {hiddenSections.map((meta) => (
            <button
              key={meta.key}
              type="button"
              onClick={() => {
                if (isDemo) {
                  toast.info("Changes are disabled in demo mode");
                  return;
                }
                onAdd(meta.key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors text-left"
            >
              <span className={`shrink-0 ${meta.color}`}>{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meta.description}
                </p>
              </div>
              <Plus size={13} className="shrink-0 text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main SiteBuilder component ───────────────────────────────────────────

export interface SiteBuilderProps {
  /** Numeric sitter ID — used for mutation calls */
  sitterId?: number;
  /** Public page URL for the preview button */
  publicPageUrl?: string;
  /** Initial section order (array of SiteBuilderSectionKey strings) */
  initialOrder?: string[];
  /** Initial visibility map */
  initialVisibility?: PageComponentVisibility;
  /** Initial hero tagline */
  initialHeroTagline?: string;
  /** Called when visibility changes — for immediate persistence */
  onVisibilityChange?: (
    key: keyof PageComponentVisibility,
    value: boolean,
  ) => Promise<void>;
  /** Called when order changes — for persistence */
  onOrderChange?: (order: string[]) => Promise<void>;
  /** Called when hero tagline changes */
  onHeroTaglineChange?: (tagline: string) => Promise<void>;
  /** Whether running in demo mode (mutations show toast instead of saving) */
  isDemo?: boolean;
  /** Whether a visibility mutation is in flight */
  isSavingVisibility?: boolean;
}

export default function SiteBuilder({
  sitterId: _sitterId,
  publicPageUrl,
  initialOrder,
  initialVisibility,
  initialHeroTagline = "",
  onVisibilityChange,
  onOrderChange,
  onHeroTaglineChange,
  isDemo,
  isSavingVisibility,
}: SiteBuilderProps) {
  // ── Section order ─────────────────────────────────────────────────────────
  const [order, setOrder] = useState<SiteBuilderSectionKey[]>(() => {
    if (initialOrder && initialOrder.length > 0) {
      // Merge stored order with default — add any new sections at end
      const stored = initialOrder.filter((k) =>
        DEFAULT_SECTION_ORDER.includes(k as SiteBuilderSectionKey),
      ) as SiteBuilderSectionKey[];
      const missing = DEFAULT_SECTION_ORDER.filter((k) => !stored.includes(k));
      return [...stored, ...missing];
    }
    return DEFAULT_SECTION_ORDER;
  });

  // ── Visibility ────────────────────────────────────────────────────────────
  const defaultVis: PageComponentVisibility = {
    showGallery: true,
    showAvailability: true,
    showStats: true,
    showCertifications: true,
    showResponseTime: true,
    showPromo: true,
    showRepeatClients: true,
    showReviews: true,
    showPetTypes: true,
    showCredentials: true,
  };
  const [visibility, setVisibility] = useState<PageComponentVisibility>(
    initialVisibility ?? defaultVis,
  );

  // ── Hero tagline ──────────────────────────────────────────────────────────
  const [heroTagline, setHeroTagline] = useState(initialHeroTagline);
  const [taglineSaveTimer, setTaglineSaveTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // ── Expanded section ──────────────────────────────────────────────────────
  const [expandedKey, setExpandedKey] = useState<SiteBuilderSectionKey | null>(
    null,
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  function isSectionOn(meta: SectionMeta): boolean {
    if (meta.visibilityKey === null) return true; // always-on sections
    return visibility[meta.visibilityKey];
  }

  async function handleToggle(meta: SectionMeta) {
    if (!meta.visibilityKey) return;
    const current = visibility[meta.visibilityKey];
    const next = !current;

    if (isDemo) {
      toast.info("Changes are disabled in demo mode");
      return;
    }

    setVisibility((prev) => ({
      ...prev,
      [meta.visibilityKey as keyof PageComponentVisibility]: next,
    }));

    try {
      await onVisibilityChange?.(meta.visibilityKey, next);
    } catch {
      // Revert on error
      setVisibility((prev) => ({
        ...prev,
        [meta.visibilityKey as keyof PageComponentVisibility]: current,
      }));
      toast.error("Failed to save change");
    }
  }

  async function handleMoveUp(idx: number) {
    if (idx === 0) return;
    if (isDemo) {
      toast.info("Changes are disabled in demo mode");
      return;
    }
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setOrder(next);
    try {
      await onOrderChange?.(next);
    } catch {
      setOrder(order);
      toast.error("Failed to save order");
    }
  }

  async function handleMoveDown(idx: number) {
    if (idx === order.length - 1) return;
    if (isDemo) {
      toast.info("Changes are disabled in demo mode");
      return;
    }
    const next = [...order];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setOrder(next);
    try {
      await onOrderChange?.(next);
    } catch {
      setOrder(order);
      toast.error("Failed to save order");
    }
  }

  function handleAddSection(key: SiteBuilderSectionKey) {
    const meta = SECTION_META.find((m) => m.key === key);
    if (!meta?.visibilityKey) return;
    handleToggle(meta);
  }

  function handleHeroTaglineChange(v: string) {
    setHeroTagline(v);
    if (taglineSaveTimer) clearTimeout(taglineSaveTimer);
    const timer = setTimeout(() => {
      onHeroTaglineChange?.(v).catch(() => {
        toast.error("Failed to save tagline");
      });
    }, 800);
    setTaglineSaveTimer(timer);
  }

  // Sections currently in the builder (in order), plus their meta
  const orderedMeta = order
    .map((k) => SECTION_META.find((m) => m.key === k))
    .filter((m): m is SectionMeta => m !== undefined);

  // Sections that are "off" and could be added back
  const hiddenSections = SECTION_META.filter(
    (m) => m.visibilityKey && !visibility[m.visibilityKey],
  );

  // Active section count
  const activeCount = SECTION_META.filter((m) => isSectionOn(m)).length;

  return (
    <div
      className="rounded-2xl border border-primary/20 overflow-hidden"
      data-ocid="site_builder.panel"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.97 0.02 260), oklch(0.985 0.01 280))",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 sm:px-5 sm:py-4 border-b border-primary/15 flex items-center justify-between gap-2"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.07 276) 0%, oklch(0.18 0.05 276) 100%)",
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Layers size={15} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-white">Site Builder</p>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                {activeCount}/{SECTION_META.length}
              </span>
            </div>
            <p className="text-xs text-indigo-300 hidden sm:block">
              Drag to reorder · Toggle sections on/off · Edit content
            </p>
          </div>
        </div>

        {/* Preview button */}
        {publicPageUrl && (
          <a
            href={publicPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="site_builder.preview.button"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white transition-colors shadow-sm shrink-0"
            aria-label="Preview My Page"
          >
            <Eye size={13} />
            <span className="hidden sm:inline">Preview</span>
            <ExternalLink size={11} className="hidden sm:inline" />
          </a>
        )}
      </div>

      {/* ── Section list ─────────────────────────────────────────────────── */}
      <div className="p-4 space-y-2">
        {/* Legend row */}
        <div className="flex items-center gap-3 pb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
            Page Sections — top to bottom order
          </p>
          {isSavingVisibility && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </span>
          )}
        </div>

        {orderedMeta.map((meta, idx) => (
          <SectionCard
            key={meta.key}
            meta={meta}
            isOn={isSectionOn(meta)}
            isFirst={idx === 0}
            isLast={idx === orderedMeta.length - 1}
            isExpanded={expandedKey === meta.key}
            isSaving={!!isSavingVisibility}
            heroTagline={heroTagline}
            onHeroTaglineChange={handleHeroTaglineChange}
            onToggle={() => handleToggle(meta)}
            onMoveUp={() => handleMoveUp(idx)}
            onMoveDown={() => handleMoveDown(idx)}
            onToggleExpand={() =>
              setExpandedKey((prev) => (prev === meta.key ? null : meta.key))
            }
            isDemo={isDemo}
            index={idx}
          />
        ))}

        {/* Add section panel */}
        <AddSectionPanel
          hiddenSections={hiddenSections}
          onAdd={handleAddSection}
          isDemo={isDemo}
        />

        {/* Footer hint */}
        <div className="pt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Changes save instantly. Use ↑↓ to reorder how sections appear on
            your public page. Clients only see sections that are toggled{" "}
            <strong className="text-foreground">on</strong>.
          </p>
        </div>
      </div>

      {/* ── Demo notice ──────────────────────────────────────────────────── */}
      {isDemo && (
        <div
          className="px-5 py-3 border-t border-amber-400/20 flex items-center gap-2"
          style={{ background: "rgba(245,158,11,0.06)" }}
        >
          <MessageSquare size={13} className="text-amber-400 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-amber-400 font-semibold">Demo mode</span> —
            this is what your Site Builder will look like. Changes won't save in
            demo.
          </p>
        </div>
      )}
    </div>
  );
}
