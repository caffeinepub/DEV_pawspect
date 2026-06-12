/**
 * ProfileDemoTab — Demo mode Profile tab showing Morgan Pawley's full profile.
 * All information is read-only (editing shows a demo mode toast).
 *
 * The Site Builder section renders the real SiteBuilder component in demo mode.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  BadgeCheck,
  Check,
  ExternalLink,
  FileCheck,
  FileText,
  Link2,
  MapPin,
  Shield,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SiteBuilder from "../../components/SiteBuilder";
import { useDemoMode } from "../../context/DemoModeContext";
import type {
  CredentialChecklist,
  PageComponentVisibility,
} from "../../types/sitter-v2";

// ── Credential items definition ───────────────────────────────────────────────

type CredentialKey = keyof CredentialChecklist;

interface CredentialItem {
  key: CredentialKey;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const CREDENTIAL_ITEMS: CredentialItem[] = [
  {
    key: "hasBusinessLicense",
    icon: <FileCheck size={15} />,
    label: "Licensed to Operate",
    description: "Holds a valid business license or permit",
  },
  {
    key: "isInsuredAndBonded",
    icon: <Shield size={15} />,
    label: "Insured & Bonded",
    description: "Carries insurance and/or bonding for pet-care services",
  },
  {
    key: "hasBackgroundCheck",
    icon: <UserCheck size={15} />,
    label: "Background Checked",
    description: "Completed a background check within the past year",
  },
  {
    key: "hasReferences",
    icon: <Users size={15} />,
    label: "References Available",
    description: "Can provide client references upon request",
  },
  {
    key: "usesServiceAgreement",
    icon: <FileText size={15} />,
    label: "Uses a Service Agreement",
    description: "Uses a written service agreement or contract",
  },
  {
    key: "hasCertificationOrTraining",
    icon: <Award size={15} />,
    label: "Certified or Trained",
    description: "Holds a pet-care certification or first aid training",
  },
  {
    key: "isProfessionalMember",
    icon: <Star size={15} />,
    label: "Professional Member",
    description: "Active member of a professional pet-care organization",
  },
];

// ── Profile completeness ──────────────────────────────────────────────────────

function ProfileCompleteness() {
  const checks = [
    { label: "Profile photo", done: false },
    { label: "Services selected", done: true },
    { label: "Hourly rate set", done: true },
    { label: "Availability set", done: true },
    { label: "Bio written", done: true },
  ];
  const score = checks.reduce((s, c) => s + (c.done ? 20 : 0), 0);
  return (
    <div
      className="mb-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 p-5"
      data-ocid="demo.profile.completeness.card"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-indigo-800">
            Profile Completeness
          </p>
          <p className="text-xs text-indigo-600 mt-0.5">
            1 item left to complete
          </p>
        </div>
        <span className="text-2xl font-extrabold text-indigo-800">
          {score}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/60 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: "linear-gradient(90deg,#6366f1,#4f46e5)",
          }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.done ? "bg-emerald-500" : "bg-white/60 border border-border"}`}
            >
              {c.done && <Check size={10} className="text-white" />}
            </div>
            <span
              className={`text-xs ${c.done ? "text-indigo-800 font-medium" : "text-muted-foreground"}`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileDemoTab() {
  const { demoSitter } = useDemoMode();

  // Local visibility state seeded from demo data
  const [pageComponents, setPageComponents] = useState<PageComponentVisibility>(
    demoSitter.pageComponents ?? {
      showGallery: true,
      showAvailability: true,
      showStats: true,
      showCertifications: false,
      showResponseTime: true,
      showPromo: false,
      showRepeatClients: true,
      showReviews: true,
      showPetTypes: true,
      showCredentials: true,
    },
  );

  // Local credential checklist state seeded from demo data
  const [credentials, setCredentials] = useState<CredentialChecklist>(
    (
      demoSitter as typeof demoSitter & {
        credentialChecklist?: CredentialChecklist;
      }
    ).credentialChecklist ?? {
      hasBusinessLicense: false,
      isInsuredAndBonded: true,
      hasBackgroundCheck: true,
      hasReferences: true,
      usesServiceAgreement: true,
      hasCertificationOrTraining: false,
      isProfessionalMember: false,
    },
  );

  const [bannerUrl] = useState(
    "https://images.unsplash.com/photo-1601758174493-45d0a4d3e407?w=1600&q=80&fit=crop",
  );

  const handleCredentialToggle = (key: CredentialKey) => {
    setCredentials((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.info("Changes are disabled in demo mode");
  };

  const badges = ["CPR Certified", "Insured", "5 Years Experience"];
  const checkedCount = CREDENTIAL_ITEMS.filter(
    (item) => credentials[item.key],
  ).length;

  return (
    <div className="space-y-5" data-ocid="demo.profile.section">
      <h2 className="font-display text-xl font-bold">Your Profile</h2>

      <ProfileCompleteness />

      {/* Avatar + basic info */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-md">
          <span className="text-white text-xl font-extrabold">MP</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {demoSitter.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin size={12} />
                <span>{demoSitter.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="font-bold text-foreground text-sm">
                {demoSitter.rating}
              </span>
              <span className="text-muted-foreground text-xs">
                ({Number(demoSitter.reviewCount)} reviews)
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200"
              >
                <Shield size={10} />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2 p-5 rounded-2xl bg-card border border-border">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Bio
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          Professional pet sitter with 5 years of experience in Boulder, CO. CPR
          certified, fully insured, and passionate about giving pets the love
          and attention they deserve while their families are away. I treat
          every pet like my own — from energetic pups to shy cats and everything
          in between.
        </p>
      </div>

      {/* Service rates */}
      <div
        className="rounded-2xl overflow-hidden border border-border"
        data-ocid="demo.profile.service-rates.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          }}
        >
          <p className="text-sm font-bold text-indigo-900">
            Service Rates ($/hr)
          </p>
          <Button
            size="sm"
            onClick={() => toast.info("Changes are disabled in demo mode")}
            className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-4 text-xs font-semibold"
          >
            Edit Rates
          </Button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {demoSitter.serviceRates.map((rate) => (
            <div
              key={rate.service}
              className="flex items-center justify-between p-3 bg-card rounded-lg border border-indigo-100"
            >
              <span className="text-sm text-indigo-800 font-medium truncate">
                {rate.service}
              </span>
              <Badge
                variant="secondary"
                className="ml-2 shrink-0 font-bold text-indigo-700 bg-indigo-100"
              >
                ${Number(rate.ratePerHour)}/hr
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Availability preview */}
      <div
        className="rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.profile.availability.section"
      >
        <div
          className="px-5 py-4 border-b border-border"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          }}
        >
          <p className="text-sm font-bold text-emerald-900">
            Weekly Availability
          </p>
        </div>
        <div className="p-4 space-y-2">
          {[
            { day: "Monday", time: "8:00 AM – 6:00 PM", available: true },
            { day: "Tuesday", time: "8:00 AM – 6:00 PM", available: true },
            { day: "Wednesday", time: "8:00 AM – 6:00 PM", available: true },
            { day: "Thursday", time: "8:00 AM – 6:00 PM", available: true },
            { day: "Friday", time: "8:00 AM – 6:00 PM", available: true },
            { day: "Saturday", time: "9:00 AM – 3:00 PM", available: true },
            { day: "Sunday", time: "Not available", available: false },
          ].map(({ day, time, available }) => (
            <div
              key={day}
              className={`flex items-center justify-between py-2 px-3 rounded-lg ${available ? "bg-emerald-50/60" : "bg-muted/30"}`}
            >
              <span className="text-sm font-medium text-foreground w-24 shrink-0">
                {day}
              </span>
              <span
                className={`text-sm ${available ? "text-emerald-700 font-semibold" : "text-muted-foreground"}`}
              >
                {time}
              </span>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${available ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edit profile CTA */}
      <Button
        className="w-full sm:w-auto rounded-full font-semibold"
        onClick={() => toast.info("Changes are disabled in demo mode")}
        data-ocid="demo.profile.save_button"
      >
        Save Profile
      </Button>

      {/* ── Professional Credentials ───────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-emerald-400/30"
        data-ocid="demo.profile.credentials.section"
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-emerald-400/20"
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(99,102,241,0.08) 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <BadgeCheck size={16} className="text-emerald-500" />
                <p className="text-sm font-bold text-foreground">
                  Professional Credentials
                </p>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {checkedCount} of {CREDENTIAL_ITEMS.length} verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Self-reported. Checked items appear as badges on your public
                page and sitter cards.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mx-5 mt-4 mb-2 rounded-xl border border-amber-400/40 bg-amber-50/60 px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Self-reported credentials.</span>{" "}
            Pawspect does not verify, certify, or endorse any claims made here.
            Clients are encouraged to ask for proof directly. All credential
            verification is the responsibility of the client.
          </p>
        </div>

        {/* Credential checkboxes */}
        <div
          className="p-4 space-y-2.5"
          data-ocid="demo.profile.credentials.list"
        >
          {CREDENTIAL_ITEMS.map((item, idx) => {
            const isChecked = !!credentials[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleCredentialToggle(item.key)}
                data-ocid={`demo.profile.credentials.item.${idx + 1}`}
                className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-150 text-left cursor-pointer
                  ${
                    isChecked
                      ? "bg-emerald-50/70 border-emerald-300/60 hover:bg-emerald-100/60"
                      : "bg-card border-border hover:bg-muted/30"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors duration-150
                    ${
                      isChecked
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-background border-border"
                    }`}
                >
                  {isChecked && (
                    <Check size={11} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <span
                  className={`shrink-0 ${isChecked ? "text-emerald-600" : "text-muted-foreground/50"}`}
                >
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold leading-tight ${isChecked ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
                {isChecked && (
                  <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-300 text-xs font-semibold">
                    Active
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Save button */}
        <div className="px-5 pb-5 pt-2">
          <Button
            className="w-full sm:w-auto rounded-full font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => toast.info("Changes are disabled in demo mode")}
            data-ocid="demo.profile.credentials.save_button"
          >
            <BadgeCheck size={14} className="mr-1.5" />
            Save Credentials
          </Button>
        </div>
      </div>

      {/* ── Banner URL preview ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border border-amber-400/30 p-5"
        data-ocid="demo.profile.banner_url.section"
      >
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={15} className="text-amber-400 shrink-0" />
          <p className="text-sm font-bold text-foreground">Banner Image URL</p>
        </div>
        <div className="relative">
          <input
            type="url"
            readOnly
            value={bannerUrl}
            onClick={() => toast.info("Changes are disabled in demo mode")}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-background border border-border text-foreground font-mono cursor-not-allowed opacity-70"
            data-ocid="demo.profile.page-builder.banner_url.input"
          />
        </div>
        {bannerUrl && (
          <div
            className="mt-2.5 rounded-xl overflow-hidden"
            style={{ height: "80px" }}
          >
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
          <ExternalLink size={10} className="shrink-0" />
          Use a public image URL (e.g. Unsplash, your own hosted photo)
        </p>
      </div>

      {/* ── Site Builder ─────────────────────────────────────────────────────── */}
      <div data-ocid="demo.profile.site_builder.section">
        <SiteBuilder
          publicPageUrl="/#/sitter/morgan-pawley"
          initialVisibility={pageComponents}
          initialHeroTagline="Boulder's most trusted pet sitter"
          onVisibilityChange={async (key, value) => {
            setPageComponents((prev) => ({ ...prev, [key]: value }));
            toast.info("Changes are disabled in demo mode");
          }}
          onOrderChange={async () => {
            toast.info("Changes are disabled in demo mode");
          }}
          onHeroTaglineChange={async () => {
            toast.info("Changes are disabled in demo mode");
          }}
          isDemo
        />
      </div>
    </div>
  );
}
