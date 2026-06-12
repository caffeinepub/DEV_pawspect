import { ChevronDown, Mail, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { SUBSCRIPTION_PRICE_MONTHLY, SUPPORT_EMAIL } from "../config/business";

type Topic =
  | "All"
  | "Getting Started"
  | "Trial & Pricing"
  | "Subscription & Billing"
  | "Account & Profile"
  | "Your Public Page"
  | "Bookings"
  | "Invoices & Payments"
  | "Safety & Insurance"
  | "Privacy & GDPR"
  | "Platform Rules"
  | "Getting Help";

interface FAQItem {
  id: string;
  topic: Exclude<Topic, "All">;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "us-only",
    topic: "Platform Rules",
    question: "Is Pawspect available for sitters outside the US?",
    answer:
      "No. Pawspect only accepts sitters located in the United States. A valid US ZIP code is required to register. Sitters outside the US are not eligible to use the platform.",
  },
  {
    id: "not-employee",
    topic: "Platform Rules",
    question: "Am I an employee of Pawspect?",
    answer:
      "No. You are an independent operator using Pawspect\u2019s software tools to run your own business. You are not an employee, contractor, or agent of Data Driven Design Group, LLC or Pawspect. You are solely responsible for your own taxes, insurance, licensing, and compliance with applicable local, state, and federal laws.",
  },
  {
    id: "no-platform-liability",
    topic: "Platform Rules",
    question: "What is Pawspect\u2019s liability for my services?",
    answer:
      "None. Pawspect provides software tools only. All service agreements and responsibilities are between you and your clients. Data Driven Design Group, LLC is not a party to any service arrangements and has no liability for outcomes of your work, including pet injuries, client disputes, property damage, or any other incident.",
  },
  {
    id: "team-splits-not-employment",
    topic: "Platform Rules",
    question: "Are team payout splits an employment arrangement?",
    answer:
      "No. Payout splits are financial arrangements between independent contractors. Pawspect facilitates the accounting split in your analytics only. Each team member remains an independent operator responsible for their own taxes, insurance, licensing, and obligations. This is not an employment or contractor relationship with Pawspect.",
  },
  {
    id: "gs-1",
    topic: "Getting Started",
    question: "What is Pawspect?",
    answer:
      "Pawspect is a software platform that gives independent pet sitters everything they need to run a professional business — booking management, invoicing, a public storefront, client CRM, analytics, and more. It is not a pet-sitting service. All services are arranged directly between you (the sitter) and your clients.",
  },
  {
    id: "gs-2",
    topic: "Getting Started",
    question: "How do I create my account?",
    answer:
      "Click Apply Now on the homepage to submit your sitter application. You will need to confirm you are 18 or older, have adequate insurance, and understand that Pawspect is a technology platform only. Once approved by the admin team, you get full portal access.",
  },
  {
    id: "gs-3",
    topic: "Getting Started",
    question: "What does the sitter portal include?",
    answer:
      "Your portal gives you a smart agenda, invoice and payment tracking, client and pet CRM, business analytics, a Coach & Growth hub with goal setting and nudges, a public storefront, GDPR privacy tools, and a subscription billing tab — all in one place.",
  },
  {
    id: "tp-1",
    topic: "Trial & Pricing",
    question: "How does the free trial work?",
    answer:
      "Every approved sitter gets 30 days of full access at no charge. No credit card required during the trial. On day 30 you will be prompted to subscribe to continue using the platform.",
  },
  {
    id: "tp-2",
    topic: "Trial & Pricing",
    question: "What does it cost after the trial?",
    answer: `After the trial, the subscription is $${SUBSCRIPTION_PRICE_MONTHLY}/month. All features are included — there are no tiers and no per-booking platform fees.`,
  },
  {
    id: "tp-3",
    topic: "Trial & Pricing",
    question: "Are there any platform fees on my earnings?",
    answer:
      "No. Pawspect charges a flat monthly subscription only. Every dollar you earn goes directly to you. You set your own prices and collect payment directly from clients.",
  },
  {
    id: "sb-1",
    topic: "Subscription & Billing",
    question: "What happens if I do not subscribe after the trial?",
    answer:
      "Your account will be frozen. You will not lose any data, but you will not be able to accept bookings or send invoices until you reactivate. You can still request a GDPR data export or account anonymization at any time.",
  },
  {
    id: "sb-2",
    topic: "Subscription & Billing",
    question: "How do I manage my subscription?",
    answer:
      "Go to the Billing tab in your portal. From there you can subscribe, upgrade, cancel, or view your billing history — all without needing to contact support.",
  },
  {
    id: "sb-3",
    topic: "Subscription & Billing",
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from the Billing tab at any time. Your access continues until the end of the paid period.",
  },
  {
    id: "sb-4",
    topic: "Subscription & Billing",
    question: "What happens if my payment fails?",
    answer:
      "Your account will be temporarily frozen. You will receive an email notification. Updating your payment method in the Billing tab will reactivate your account immediately.",
  },
  {
    id: "ap-1",
    topic: "Account & Profile",
    question: "How do I set up my public profile?",
    answer:
      "Go to the Profile tab in your portal. Add your photo, bio, the services you offer with your rates, and your availability. Your public storefront is automatically published at your unique link once your profile is complete.",
  },
  {
    id: "ap-2",
    topic: "Account & Profile",
    question: "How do I share my booking link with clients?",
    answer:
      "Your shareable storefront link is shown in the Profile tab. Clients can tap Book Me on your storefront to start a booking with you pre-selected.",
  },
  // Your Public Page
  {
    id: "ypp-1",
    topic: "Your Public Page",
    question: "What shows up on my public profile page?",
    answer:
      "Your public page can show a photo gallery of visit photos, a live availability calendar for the next 14 days, booking stats (happy clients, visits completed, repeat client rate), certifications and credential badges, your services with pricing, client reviews, a pinned promo or offer banner, the pet types you work with, and a Book Me button. Each section can be toggled on or off from your Profile settings.",
  },
  {
    id: "ypp-2",
    topic: "Your Public Page",
    question: "How do I control which sections appear on my page?",
    answer:
      "Go to Profile → Page Settings in your sitter portal. Each section of your public page (gallery, stats, certifications, reviews, promo banner, etc.) has an on/off toggle. Turn off anything you are not ready to show. Sections with no data automatically hide themselves so your page always looks polished — even if you have not filled everything in yet.",
  },
  {
    id: "ypp-3",
    topic: "Your Public Page",
    question: "Do I need to fill in every section before my page goes live?",
    answer:
      "No. Empty sections auto-hide by default, so your page only shows what you have filled in. Start with the basics — photo, bio, services, and availability — and your page will still look professional and complete. Add more sections over time as you build your photo gallery and collect reviews.",
  },
  {
    id: "ypp-4",
    topic: "Your Public Page",
    question: "Can clients find my page on Google?",
    answer:
      "Yes. Every sitter's public page is SEO-optimized with structured metadata including your name, location area, and services. When someone searches for 'pet sitter in Boulder' or similar terms, your page is eligible to appear. A complete profile with real reviews and rich content will rank better. Share your link on social media, Nextdoor, and Google Business to further boost your visibility.",
  },
  {
    id: "bk-1",
    topic: "Bookings",
    question: "How do clients book me?",
    answer:
      "Clients can book you directly from your public storefront or through the main Pawspect booking flow. They enter their service, date, and time preference — bookings only appear for time slots you have marked as available.",
  },
  {
    id: "bk-2",
    topic: "Bookings",
    question: "How do I confirm or decline a booking request?",
    answer:
      "Pending booking requests appear in the Bookings tab of your portal. Tap the booking to view details and confirm or manage it.",
  },
  {
    id: "bk-3",
    topic: "Bookings",
    question: "What prevents double-bookings?",
    answer:
      "Pawspect checks your availability matrix and all existing confirmed and pending bookings before showing you as available. You cannot be double-booked as long as your availability is kept up to date.",
  },
  {
    id: "ip-1",
    topic: "Invoices & Payments",
    question: "How do I send an invoice to a client?",
    answer:
      "In the Invoices tab, find the completed booking and tap Send Invoice. You can add extra line items or discounts before sending. Select your preferred payment method (Venmo, Apple Pay Cash, or Cash) — the client receives a professional email with payment instructions.",
  },
  {
    id: "ip-2",
    topic: "Invoices & Payments",
    question: "How do I mark an invoice as paid?",
    answer:
      "Once you have received payment, open the invoice and tap Mark Paid. The client receives a confirmation email with a PAID receipt and a link to rate your service.",
  },
  {
    id: "ip-3",
    topic: "Invoices & Payments",
    question: "Can I add ad hoc charges or discounts to an invoice?",
    answer:
      "Yes. When creating or editing an invoice you can add free-text line items with custom amounts or apply a discount. The invoice total updates live.",
  },
  {
    id: "si-1",
    topic: "Safety & Insurance",
    question: "Do I need insurance to use Pawspect?",
    answer:
      "Yes. All sitters must carry adequate insurance for pet-sitting services. This is a requirement of the application and is your responsibility as an independent business owner. Pawspect does not provide or arrange insurance.",
  },
  {
    id: "si-2",
    topic: "Safety & Insurance",
    question: "What are my safety responsibilities as a sitter?",
    answer:
      "You are solely responsible for ensuring safe interactions with clients and their pets. Pawspect is a technology platform — it does not supervise, endorse, or guarantee any sitter or service.",
  },
  {
    id: "pg-1",
    topic: "Privacy & GDPR",
    question: "Can I download my data?",
    answer:
      "Yes. Go to Account & Privacy in your portal and tap Download My Data. You will receive a complete export of all your profile information, bookings, invoices, client records, and reviews sent to your email as a downloadable file.",
  },
  {
    id: "pg-2",
    topic: "Privacy & GDPR",
    question: "Can I delete or anonymize my account?",
    answer:
      "Yes. In Account & Privacy, tap Anonymize My Account. This replaces all personal information with anonymous placeholders while preserving booking records for legal and business integrity. A confirmation email is sent to you. This action is irreversible.",
  },
  {
    id: "pg-3",
    topic: "Privacy & GDPR",
    question: "What data does Pawspect collect about me?",
    answer:
      "We collect only what is needed to operate the platform: your name, contact information, profile details (bio, services, rates, photo), booking and invoice records, and your authentication identifier (no passwords ever stored). Payment data is handled entirely by Stripe — we never store card numbers. Usage analytics are anonymized and not linked to your identity.",
  },
  {
    id: "pg-4",
    topic: "Privacy & GDPR",
    question: "Can admins see my personal or financial data?",
    answer:
      "No. Admins cannot access your personal information, earnings, client records, or financial details by default — this is enforced at the platform level, not just policy. The only exception is if you open a support ticket explicitly granting a specific admin temporary, scoped access to resolve a specific issue. All such access is logged in a full audit trail visible to you in your portal, and access is automatically revoked when the ticket is closed.",
  },
  {
    id: "pg-5",
    topic: "Privacy & GDPR",
    question: "What happens to my data if I stop using Pawspect?",
    answer:
      "Your data stays in your account in a frozen state. You can export it at any time using Download My Data, or request account anonymization (which removes all personal information). If you take no action, data is retained per our privacy policy. We recommend exporting your data before you stop using the platform.",
  },
  {
    id: "pg-6",
    topic: "Privacy & GDPR",
    question: "Is Pawspect liable if my data is lost?",
    answer: `No. Pawspect and Data Driven Design Group, LLC bear zero liability for data loss of any kind, for any reason. While we take reasonable precautions and use the Internet Computer Protocol's robust infrastructure, no system can guarantee against data loss. We strongly recommend exporting your data regularly using the Download My Data feature in Account & Privacy. Your export is available 24/7 and takes only a moment to request.`,
  },
  {
    id: "pg-7",
    topic: "Privacy & GDPR",
    question: "How do I download my data?",
    answer:
      "Sign in to your sitter portal, go to the Account & Privacy tab, and tap Download My Data. You will receive an email with a download link containing all your platform data. The link is valid for 7 days. We recommend doing this periodically as a routine backup.",
  },
  {
    id: "pr-1",
    topic: "Platform Rules",
    question: "What is Pawspect allowed to be used for?",
    answer:
      "Pawspect is for pet-sitting services only. Using the platform for any other purpose — or misrepresenting your services — may result in immediate account termination.",
  },
  {
    id: "pr-2",
    topic: "Platform Rules",
    question: "Is Pawspect my employer?",
    answer:
      "No. Pawspect is a technology platform. You are an independent business owner. Pawspect does not employ, supervise, assign work to, or guarantee the performance of any sitter.",
  },
  {
    id: "gh-1",
    topic: "Getting Help",
    question: "How do I get support?",
    answer: `Pawspect is a self-serve platform designed to require minimal support. If you cannot find an answer in this FAQ, email the support team at ${SUPPORT_EMAIL} and someone will get back to you.`,
  },
];

const TOPICS: Topic[] = [
  "All",
  "Getting Started",
  "Trial & Pricing",
  "Subscription & Billing",
  "Account & Profile",
  "Your Public Page",
  "Bookings",
  "Invoices & Payments",
  "Safety & Insurance",
  "Privacy & GDPR",
  "Platform Rules",
  "Getting Help",
];

export default function SitterPortalFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<Topic>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = FAQ_ITEMS.filter((item) => {
    const topicMatch = activeTopic === "All" || item.topic === activeTopic;
    if (!topicMatch) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
    );
  });

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <section
      className="py-20 sm:py-28 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.10 0.03 265) 0%, oklch(0.13 0.04 258) 100%)",
      }}
    >
      {/* Ambient glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 70% 40%, oklch(0.45 0.18 265 / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, oklch(0.72 0.18 55 / 0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
            style={{
              background: "oklch(0.72 0.18 55 / 0.15)",
              borderColor: "oklch(0.72 0.18 55 / 0.40)",
              color: "oklch(0.88 0.14 55)",
            }}
          >
            <Sparkles size={11} className="shrink-0" />
            Deep FAQ
          </div>
          <h2
            className="font-display font-extrabold tracking-tight mb-4"
            style={{
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              background:
                "linear-gradient(to right, #ffffff, rgba(255,255,255,0.82))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Frequently asked questions
          </h2>
          <p
            className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
            style={{ color: "oklch(1 0 0 / 0.55)" }}
          >
            Everything you need to know about the sitter portal, subscription,
            and how the platform works.
          </p>
        </div>

        {/* Search box */}
        <div className="relative mb-5" data-ocid="sitter-faq.search_input">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.60 0.05 265)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedId(null);
            }}
            placeholder="Search the FAQ..."
            className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all duration-200"
            style={{
              background: "oklch(0.12 0.03 265 / 0.6)",
              border: "1px solid oklch(0.45 0.18 265 / 0.3)",
              color: "oklch(0.90 0.02 265)",
              backdropFilter: "blur(12px)",
            }}
            aria-label="Search FAQ"
          />
        </div>

        {/* Topic filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none"
          data-ocid="sitter-faq.topic_filters"
          style={{ scrollbarWidth: "none" }}
        >
          {TOPICS.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                data-ocid={`sitter-faq.topic.${topic.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
                onClick={() => {
                  setActiveTopic(topic);
                  setExpandedId(null);
                }}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                style={
                  isActive
                    ? {
                        background: "oklch(0.72 0.18 55)",
                        color: "oklch(0.10 0.03 265)",
                      }
                    : {
                        background: "oklch(0.18 0.04 265 / 0.5)",
                        color: "oklch(0.75 0.03 265)",
                        border: "1px solid oklch(0.35 0.06 265 / 0.4)",
                      }
                }
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {(searchQuery.trim() || activeTopic !== "All") && (
          <p className="text-xs mb-4" style={{ color: "oklch(0.60 0.05 265)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {activeTopic !== "All" ? ` in ${activeTopic}` : ""}
            {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ""}
          </p>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            data-ocid="sitter-faq.empty_state"
            className="rounded-2xl px-6 py-10 text-center"
            style={{
              background: "oklch(0.13 0.03 265 / 0.5)",
              border: "1px solid oklch(0.45 0.18 265 / 0.2)",
            }}
          >
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "oklch(0.92 0.02 265)" }}
            >
              No results for &ldquo;{searchQuery.trim()}&rdquo;
            </p>
            <p className="text-sm" style={{ color: "oklch(0.72 0.03 265)" }}>
              Try a different search or contact support at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.72 0.18 55)" }}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        )}

        {/* Accordion */}
        {filtered.length > 0 && (
          <div data-ocid="sitter-faq.list" className="space-y-2.5">
            {filtered.map((item, i) => {
              const isOpen = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  data-ocid={`sitter-faq.item.${i + 1}`}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "oklch(0.13 0.03 265 / 0.5)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    WebkitBackdropFilter: "blur(16px) saturate(180%)",
                    border: isOpen
                      ? "1px solid oklch(0.72 0.18 55 / 0.30)"
                      : "1px solid oklch(0.45 0.18 265 / 0.2)",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <button
                    type="button"
                    data-ocid={`sitter-faq.toggle.${i + 1}`}
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-start justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Topic pill */}
                      <span
                        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                        style={{
                          background: "oklch(0.45 0.18 265 / 0.25)",
                          color: "oklch(0.75 0.12 265)",
                        }}
                      >
                        {item.topic}
                      </span>
                      <p
                        className="font-semibold text-sm sm:text-base leading-snug"
                        style={{ color: "oklch(0.92 0.02 265)" }}
                      >
                        {item.question}
                      </p>
                    </div>
                    <ChevronDown
                      size={17}
                      className="shrink-0 mt-1 transition-transform duration-200"
                      style={{
                        color: "oklch(0.72 0.18 55)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0"
                      style={{
                        borderTop: "1px solid oklch(0.45 0.18 265 / 0.15)",
                      }}
                    >
                      <p
                        className="text-sm leading-relaxed pt-4"
                        style={{ color: "oklch(0.72 0.03 265)" }}
                      >
                        {item.answer.includes(SUPPORT_EMAIL) ? (
                          <>
                            {item.answer.split(SUPPORT_EMAIL)[0]}
                            <a
                              href={`mailto:${SUPPORT_EMAIL}`}
                              className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                              style={{ color: "oklch(0.72 0.18 55)" }}
                            >
                              {SUPPORT_EMAIL}
                            </a>
                            {item.answer.split(SUPPORT_EMAIL)[1]}
                          </>
                        ) : (
                          item.answer
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Support prompt */}
        <div
          data-ocid="sitter-faq.support_card"
          className="mt-8 flex items-center gap-4 rounded-2xl px-5 sm:px-6 py-4 sm:py-5"
          style={{
            background: "oklch(0.55 0.18 265 / 0.12)",
            border: "1px solid oklch(0.55 0.18 265 / 0.22)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "oklch(0.55 0.18 265 / 0.20)",
              border: "1px solid oklch(0.55 0.18 265 / 0.30)",
            }}
          >
            <Mail size={16} style={{ color: "oklch(0.72 0.12 265)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold leading-snug"
              style={{ color: "oklch(0.85 0.10 265)" }}
            >
              Still have questions?
            </p>
            <p
              className="text-xs sm:text-sm mt-0.5"
              style={{ color: "oklch(0.72 0.12 265)" }}
            >
              Reach us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                data-ocid="sitter-faq.support_email_link"
                className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.80 0.18 55)" }}
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
