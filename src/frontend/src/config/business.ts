/**
 * Business configuration — single source of truth for all business-specific values.
 * To rebrand for a different vertical, edit this file only.
 */

export const BUSINESS_CONFIG = {
  // Core identity
  appName: "Pawspect",
  tagline: "Pet Care made easy",
  supportEmail: "dataddgroup@gmail.com",
  appUrl: "https://pawspect.co",
  description: "Professional pet sitting marketplace",

  // Service vertical terminology (change these to rebrand for another vertical)
  serviceProviderSingular: "sitter", // "sitter", "cleaner", "tutor", etc.
  serviceProviderPlural: "sitters",
  serviceRecipientSingular: "pet", // "pet", "home", "student", etc.
  serviceRecipientPlural: "pets",

  // Services offered (the canonical list used everywhere)
  services: [
    "Dog Walking",
    "Cat Sitting",
    "Drop-In Visit",
    "Dog Boarding",
    "Overnight Stay",
    "Pet Feeding",
    "Playtime",
    "Dog Bath",
    "Small Pet Care",
    "Bird Care",
  ],

  // Meet & Greet special service
  meetAndGreet: {
    enabled: true,
    name: "Meet & Greet",
    description: "Free initial compatibility check",
    isFree: true,
  },

  // Pricing rules
  pricing: {
    bundleDiscountPercent: 10, // % discount applied when booking 3+ services
    bundleDiscountMinServices: 3, // minimum services to trigger bundle discount
    discountOptions: [5, 10, 15, 20, 25], // % options shown in discount selector
    defaultHourlyRate: 15, // default rate shown on new sitter profiles
  },

  // Booking defaults
  booking: {
    timeSlotIncrementMinutes: 30, // granularity of time slot picker
    operatingHoursStart: 6, // 6 AM
    operatingHoursEnd: 22, // 10 PM
    confirmationSlaHours: 24, // "we respond within X hours" message
  },

  // Admin principals (names that always get admin access on profile save)
  // These mirror the hardcoded list in main.mo — keep in sync if changing
  adminNames: ["Marcus Berggren", "Linnea Berggren", "Bailey Berggren"],

  // Color theme — OKLCH values that map to CSS variables in index.css
  // To rebrand: update both here AND in index.css --primary/--accent tokens
  colors: {
    primaryOklch: "0.45 0.16 255", // deep indigo
    primaryDarkOklch: "0.58 0.18 255", // lighter indigo for dark mode
    accentOklch: "0.72 0.18 55", // amber
  },
} as const;

// ── Zip-to-area mapping ───────────────────────────────────────────────────────
// Only the neighborhood name is ever shown publicly — never the raw zip code.
const ZIP_TO_AREA: Record<string, string> = {
  "80301": "Boulder Area",
  "80302": "Boulder Area",
  "80303": "Boulder Area",
  "80304": "Boulder Area",
  "80305": "Boulder Area",
  "80306": "Boulder Area",
  "80307": "Boulder Area",
  "80308": "Boulder Area",
  "80309": "Boulder Area",
  "80310": "Boulder Area",
  "80314": "Boulder Area",
  "80026": "Lafayette Area",
  "80027": "Louisville Area",
  "80028": "Louisville Area",
  "80516": "Erie Area",
  "80501": "Longmont Area",
  "80502": "Longmont Area",
  "80503": "Longmont Area",
  "80504": "Longmont Area",
  "80540": "Lyons Area",
  "80455": "Ward Area",
  "80466": "Nederland Area",
  "80481": "Ward Area",
  "80403": "Golden Area",
  "80020": "Broomfield Area",
  "80021": "Broomfield Area",
  "80023": "Broomfield Area",
  "80025": "Broomfield Area",
  "80038": "Broomfield Area",
};

/**
 * Convert a raw zip code (as stored in the backend) to a friendly area name.
 * Only the area name is ever shown publicly — the zip itself stays private.
 */
export function zipToAreaName(zip: string): string {
  const trimmed = zip?.trim() ?? "";
  return ZIP_TO_AREA[trimmed] ?? (trimmed ? `${trimmed} Area` : "Local Area");
}

// Convenience re-exports for common values
export const APP_NAME = BUSINESS_CONFIG.appName;
export const SUPPORT_EMAIL = BUSINESS_CONFIG.supportEmail;
export const SERVICES_LIST = BUSINESS_CONFIG.services;
export const BUNDLE_DISCOUNT_PERCENT =
  BUSINESS_CONFIG.pricing.bundleDiscountPercent;
export const BUNDLE_DISCOUNT_MIN_SERVICES =
  BUSINESS_CONFIG.pricing.bundleDiscountMinServices;
export const DISCOUNT_OPTIONS = BUSINESS_CONFIG.pricing.discountOptions;
export const MEET_AND_GREET = BUSINESS_CONFIG.meetAndGreet;
export const BOOKING_DEFAULTS = BUSINESS_CONFIG.booking;

// ── Subscription / licensing ──────────────────────────────────────────────────
export const SUBSCRIPTION_PRICE_MONTHLY = 15;
export const SUBSCRIPTION_PRICE_CURRENCY = "USD";
// Stripe publishable key is now managed via the admin panel backend function (updateStripeConfig).
// Fetch it at runtime via useGetStripePublicConfig() — never hardcode keys here.
export const STRIPE_PUBLISHABLE_KEY = "";
export const STRIPE_PRICE_ID = "price_1TOPXqGwjvHG37QCJ9jRWoSM";
