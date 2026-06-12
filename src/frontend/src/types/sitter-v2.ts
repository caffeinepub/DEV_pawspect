/**
 * Sitter Public Page v2 — shared TypeScript interfaces and constants.
 *
 * All fields are optional to preserve stable storage compatibility with
 * existing sitter records (additive-only contract).
 */

// ─── Page component visibility ─────────────────────────────────────────────

export interface PageComponentVisibility {
  showGallery: boolean;
  showAvailability: boolean;
  showStats: boolean;
  showCertifications: boolean;
  showResponseTime: boolean;
  showPromo: boolean;
  showRepeatClients: boolean;
  showReviews: boolean;
  showPetTypes: boolean;
  showCredentials: boolean;
}

/** Default: every section visible */
export const DEFAULT_PAGE_COMPONENTS: PageComponentVisibility = {
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

// ─── Page component order ──────────────────────────────────────────────────

/** All section keys for the site builder */
export type SiteBuilderSectionKey =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "availability"
  | "credentials"
  | "reviews"
  | "stats"
  | "promo"
  | "petTypes"
  | "responseTime"
  | "bookCta";

export const DEFAULT_SECTION_ORDER: SiteBuilderSectionKey[] = [
  "hero",
  "about",
  "services",
  "stats",
  "gallery",
  "credentials",
  "reviews",
  "availability",
  "promo",
  "petTypes",
  "responseTime",
  "bookCta",
];

// ─── Credential checklist ──────────────────────────────────────────────────

/** Self-reported professional credential checklist. All fields optional (additive). */
export interface CredentialChecklist {
  hasBusinessLicense?: boolean;
  isInsuredAndBonded?: boolean;
  hasBackgroundCheck?: boolean;
  hasReferences?: boolean;
  usesServiceAgreement?: boolean;
  hasCertificationOrTraining?: boolean;
  isProfessionalMember?: boolean;
}

export type CredentialKey = keyof CredentialChecklist;

export interface CredentialItem {
  key: CredentialKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

/** Ordered list used for credential badge pills and checklist UI. */
export const CREDENTIAL_ITEMS: CredentialItem[] = [
  {
    key: "hasBusinessLicense",
    label: "Licensed to Operate",
    shortLabel: "Licensed",
    description: "Holds a valid business license or permit",
    icon: "FileCheck",
  },
  {
    key: "isInsuredAndBonded",
    label: "Insured & Bonded",
    shortLabel: "Insured",
    description: "Carries insurance and/or bonding for pet-care services",
    icon: "ShieldCheck",
  },
  {
    key: "hasBackgroundCheck",
    label: "Background Checked",
    shortLabel: "Checked",
    description: "Completed a background check within the past year",
    icon: "UserCheck",
  },
  {
    key: "hasReferences",
    label: "References Available",
    shortLabel: "References",
    description: "Can provide client references upon request",
    icon: "Users",
  },
  {
    key: "usesServiceAgreement",
    label: "Service Agreement",
    shortLabel: "Agreement",
    description: "Uses a written service agreement for all bookings",
    icon: "ClipboardList",
  },
  {
    key: "hasCertificationOrTraining",
    label: "Certified / Trained",
    shortLabel: "Certified",
    description: "Holds a pet-care certification or first aid training",
    icon: "Award",
  },
  {
    key: "isProfessionalMember",
    label: "Professional Member",
    shortLabel: "Member",
    description: "Active member of a professional pet-care organization",
    icon: "BadgeCheck",
  },
];

// ─── Extended public profile ───────────────────────────────────────────────

export interface SitterPublicV2Extension {
  galleryPhotos?: string[];
  responseTime?: string;
  petTypesServed?: string[];
  certificationsList?: string[];
  acceptingNewClients?: boolean;
  pinnedPromoOfferId?: string;
  pageComponents?: PageComponentVisibility;
  credentialChecklist?: CredentialChecklist;
  bannerUrl?: string;
  /** Site builder section order — array of SiteBuilderSectionKey */
  pageComponentOrder?: string[];
  /** Hero tagline text */
  heroTagline?: string;
}

// ─── Booking stats ─────────────────────────────────────────────────────────

export interface SitterBookingStats {
  totalBookings: number;
  uniqueClients: number;
  repeatClients: number;
  completedVisits: number;
}

// ─── Profile update shape ──────────────────────────────────────────────────

/**
 * All fields optional — only include what changed.
 * Backend merges fields additively; never removes or renames.
 */
export interface SitterProfileV2Update {
  galleryPhotos?: string[];
  responseTime?: string;
  petTypesServed?: string[];
  certificationsList?: string[];
  acceptingNewClients?: boolean;
  pinnedPromoOfferId?: string;
  credentialChecklist?: CredentialChecklist;
  bannerUrl?: string;
  /** Site builder section order */
  pageComponentOrder?: string[];
  /** Hero tagline */
  heroTagline?: string;
}

// ─── Photo consent log ────────────────────────────────────────────────────

/**
 * Three-part legal consent for photo uploads.
 * All three must be true before upload is permitted.
 */
export interface PhotoConsentLog {
  sitterId: number;
  photoUrl: string;
  consent1: boolean; // rights ownership
  consent2: boolean; // no minors without consent
  consent3: boolean; // public display & responsibility
  timestamp?: number;
}

// ─── Option lists ─────────────────────────────────────────────────────────

export const CERTIFICATION_OPTIONS: string[] = [
  "Pet First Aid",
  "Fear Free Certified",
  "CPR Certified",
  "Professional Dog Trainer",
  "Insured & Bonded",
];

export const PET_TYPE_OPTIONS: string[] = [
  "Dogs",
  "Cats",
  "Small Animals",
  "Birds",
  "Reptiles",
  "Fish",
  "Other",
];

export const RESPONSE_TIME_OPTIONS: string[] = [
  "Within 1 hour",
  "Within 2 hours",
  "Within 4 hours",
  "Same day",
  "Within 24 hours",
];
