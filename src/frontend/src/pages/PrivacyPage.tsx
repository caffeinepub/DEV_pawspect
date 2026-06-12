import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import type { View } from "../App";
import { APP_NAME, SUPPORT_EMAIL } from "../config/business";

interface Props {
  navigate: (view: View) => void;
}

const EFFECTIVE_DATE = "May 4, 2026";
const COMPANY = "Data Driven Design Group, LLC";
const PRIVACY_EMAIL = "privacy@pawspect.co";

export default function PrivacyPage({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <div className="flex items-center gap-2 font-display font-bold text-lg text-foreground">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <PawPrint size={15} className="text-primary-foreground" />
            </div>
            {APP_NAME}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Lock size={14} />
            Legal Document
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-base">
            Effective: {EFFECTIVE_DATE} &middot; Last Updated: {EFFECTIVE_DATE}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Operated by {COMPANY}, Boulder, Colorado &middot; United States Only
          </p>
        </div>

        <div className="space-y-10 text-foreground">
          {/* US-Only Notice */}
          <section>
            <div className="p-5 bg-primary/10 border border-primary/30 rounded-2xl flex gap-4">
              <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground text-sm mb-1">
                  UNITED STATES ONLY PLATFORM
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {APP_NAME} is a United States-only platform. We only collect
                  and process data from individuals located within the United
                  States. If you are located outside the United States, you may
                  not use the Platform.
                </p>
              </div>
            </div>
          </section>

          {/* Intro */}
          <section>
            <p className="text-base leading-relaxed text-muted-foreground">
              This Privacy Policy describes how {APP_NAME} (&quot;we,&quot;
              &quot;our,&quot; or &quot;us&quot;), operated by {COMPANY},
              collects, uses, and protects personal information when you use the{" "}
              {APP_NAME} platform. {APP_NAME} is a technology platform only — we
              facilitate connections between independent pet sitters and
              clients. We do not provide pet care services. Our data practices
              are limited strictly to what is necessary to operate this
              Platform.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              1. Who We Are
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">{APP_NAME}</strong> is
                operated by{" "}
                <strong className="text-foreground">{COMPANY}</strong>, based in
                Boulder, Colorado. We are a software platform company — not a
                pet-sitting service, employment agency, or marketplace. We
                facilitate connections between independent sitters and clients
                and provide tools for sitters to run their businesses.
              </p>
              <p>
                Contact:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
                . Privacy inquiries:{" "}
                <a
                  href={`mailto:${PRIVACY_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {PRIVACY_EMAIL}
                </a>
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              2. Data We Collect
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Information you provide directly
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong className="text-foreground">Clients:</strong> Name,
                    email address, phone number (required for booking contact),
                    pet names and types, service notes, and booking details.
                    Client phone numbers are required to facilitate
                    communication with sitters.
                  </li>
                  <li>
                    <strong className="text-foreground">Sitters:</strong> Name,
                    location (city and US state), biography, profile photo,
                    services offered, rates, availability, application details,
                    date of birth (for age verification), and insurance
                    attestation.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      All authenticated users:
                    </strong>{" "}
                    Internet Identity cryptographic principal (a secure
                    identifier — no passwords are ever stored).
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Information collected automatically
                </h3>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>
                    Usage data including pages visited and features used
                    (anonymized, non-personally identifiable).
                  </li>
                  <li>
                    Device and browser information for security and
                    compatibility purposes.
                  </li>
                  <li>
                    Booking, invoice, and transaction records generated through
                    use of the Platform.
                  </li>
                  <li>
                    Service logs submitted by sitters (check-ins, status
                    updates, notes).
                  </li>
                  <li>
                    Consent records: timestamps and version numbers of Terms
                    accepted at booking and sitter application.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Payment data
                </h3>
                <p>
                  Payment processing is handled entirely by{" "}
                  <strong className="text-foreground">Stripe, Inc.</strong> We
                  never store full card numbers, CVVs, or complete payment card
                  information. Stripe&apos;s privacy policy governs all payment
                  data. We store only high-level subscription status information
                  (active, trial, frozen) as returned by Stripe&apos;s systems.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              3. How We Use Data
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground mb-3">
              We use your information only as necessary to operate the Platform:
            </p>
            <ul className="space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside">
              <li>
                To operate the Platform and provide all features to sitters and
                clients.
              </li>
              <li>
                To facilitate bookings between clients and sitters, including
                displaying sitter profiles and availability.
              </li>
              <li>
                To send transactional emails (booking confirmations, invoice
                notifications, account notifications, subscription alerts).
              </li>
              <li>To process subscription payments via Stripe.</li>
              <li>
                To allow platform administrators to manage the platform and
                review sitter applications.
              </li>
              <li>
                To improve the Platform&apos;s functionality, performance, and
                user experience.
              </li>
              <li>
                <strong className="text-foreground">
                  We do NOT sell, rent, trade, or license personal data to any
                  third parties for any purpose, including marketing or
                  advertising.
                </strong>
              </li>
              <li>
                We do NOT use personal data for targeted advertising or
                behavioral tracking.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              4. Data Storage &amp; Security
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                {APP_NAME} is built on the Internet Computer Protocol (ICP), a
                decentralized computing platform. Your data is stored in
                canister smart contracts on the ICP network, which provides
                cryptographic security and data integrity at the infrastructure
                level.
              </p>
              <p>
                Authentication for sitters and admins is handled via Internet
                Identity, a passkey-based cryptographic system. We never store
                passwords. Your identity is tied to a cryptographic key pair
                that only you control.
              </p>
              <p>
                We implement reasonable and industry-standard technical and
                organizational security measures to protect your data. Access
                controls, audit logging, and encryption-at-rest are provided by
                the ICP infrastructure.
              </p>
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-4">
                <AlertTriangle
                  size={20}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-bold text-foreground text-sm mb-2">
                    DATA LOSS DISCLAIMER — PLEASE READ
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    While we take reasonable precautions and leverage ICP&apos;s
                    robust infrastructure,{" "}
                    <strong className="text-foreground">
                      no system is 100% secure or guaranteed to be free from
                      data loss.
                    </strong>{" "}
                    {APP_NAME} and {COMPANY} cannot and do not guarantee that
                    data will never be lost, corrupted, partially lost, or made
                    unavailable — whether due to technical failure, software
                    bugs, canister upgrades, network issues, human error,
                    cyberattacks, or any other cause.{" "}
                    <strong className="text-foreground">
                      We strongly recommend that all users export their data
                      regularly using the Download My Data feature in the
                      Account &amp; Privacy tab. {APP_NAME} and {COMPANY} bear
                      absolutely no liability for any data loss under any
                      circumstances whatsoever.
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              5. Data Sharing
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>We share data ONLY in the following limited circumstances:</p>
              <p>
                <strong className="text-foreground">
                  With sitters (when you book):
                </strong>{" "}
                When a client submits a booking, their name, email, phone
                number, pet details, and service notes are shared with the
                relevant sitter to facilitate the service.
              </p>
              <p>
                <strong className="text-foreground">
                  Sitter profiles (public):
                </strong>{" "}
                Sitter profiles including name, city, bio, photo, services,
                rates, and availability are publicly visible to all visitors.
              </p>
              <p>
                <strong className="text-foreground">With Stripe:</strong>{" "}
                Subscription and payment processing data is shared with Stripe
                as necessary to process payments and manage subscriptions.
              </p>
              <p>
                <strong className="text-foreground">
                  With email delivery services:
                </strong>{" "}
                Your email address is shared with our transactional email
                provider solely to deliver Platform notifications.
              </p>
              <p>
                <strong className="text-foreground">
                  Platform administrators:
                </strong>{" "}
                Admins can see high-level platform analytics and sitter names
                and locations for platform management purposes.{" "}
                <strong className="text-foreground">
                  Admins CANNOT access individual sitter personal data,
                  financial details, client records, or earnings data by
                  default.
                </strong>{" "}
                Access to a specific sitter&apos;s data is only possible if the
                sitter opens a support ticket explicitly granting temporary,
                scoped, time-limited admin access. All such access is logged in
                an audit trail visible to the sitter.
              </p>
              <p>
                <strong className="text-foreground">Legal requirements:</strong>{" "}
                We may disclose your information if required by law, court
                order, or government authority.
              </p>
              <p>
                <strong className="text-foreground">
                  We will never share your data with third parties for
                  marketing, commercial, or advertising purposes.
                </strong>
              </p>
            </div>
          </section>

          {/* Section 5a — Team Data */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              5a. Team Data
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              When sitters form teams on the Platform, team members can see
              limited information about co-sitters including name and booking
              assignments. Payout split percentages are visible to team members
              only, not to clients. Team membership and collaboration data are
              stored solely to operate the teaming features and are not shared
              with any third party.
            </p>
          </section>

          {/* Section 5b — Ad Hoc Jobs */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              5b. Ad Hoc (Off-App) Jobs
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              When sitters use the ad hoc job feature to log off-app clients,
              off-app client information (name, optional phone) is stored solely
              for the sitter&apos;s accounting purposes. Off-app clients are not
              Platform users, are not given accounts, and do not receive any
              Platform communications. {COMPANY} does not use off-app client
              information for any purpose other than displaying it to the sitter
              who entered it.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              6. Cookies &amp; Tracking
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {APP_NAME} uses minimal browser-based storage (session state and
              local preferences) strictly to maintain your experience on the
              Platform. We do not use third-party advertising cookies,
              behavioral tracking cookies, or advertising pixels. We may use
              anonymized, aggregate analytics to understand how the Platform is
              used at a high level, with no personally identifiable information
              involved.
            </p>
          </section>

          {/* Section 7 — GDPR Rights */}
          <section>
            <div className="rounded-2xl overflow-hidden border border-primary/30">
              <div className="px-6 py-4 border-b border-primary/20 flex items-center gap-3 bg-primary/8">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <ShieldCheck size={17} className="text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  7. GDPR Rights (All Users)
                </h2>
              </div>
              <div className="p-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  We respect your data rights. The following rights are
                  available to all sitter users, regardless of location:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      right: "Right of Access",
                      desc: "Request a summary of all personal data we hold about you.",
                    },
                    {
                      right: "Right to Portability",
                      desc: "Download your full data export via the Download My Data feature in Account & Privacy.",
                    },
                    {
                      right: "Right to Erasure",
                      desc: "Request account anonymization — removes all PII while preserving booking records for legal integrity.",
                    },
                    {
                      right: "Right to Rectification",
                      desc: "Update your profile information directly in your portal at any time.",
                    },
                    {
                      right: "Right to Restriction",
                      desc: "Contact us at the privacy email to restrict processing of your data.",
                    },
                    {
                      right: "Right to Object",
                      desc: "Contact us at the privacy email to object to specific data processing.",
                    },
                  ].map(({ right, desc }) => (
                    <div
                      key={right}
                      className="p-4 rounded-xl bg-background/50 border border-border/60"
                    >
                      <p className="font-semibold text-foreground text-sm mb-1">
                        {right}
                      </p>
                      <p className="text-xs leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    How to Exercise Your Rights
                  </p>
                  <ul className="space-y-1.5 list-disc list-inside text-sm">
                    <li>
                      Use the{" "}
                      <strong className="text-foreground">
                        Account &amp; Privacy
                      </strong>{" "}
                      tab in your sitter portal to download data or anonymize
                      your account — available 24/7.
                    </li>
                    <li>
                      Email{" "}
                      <a
                        href={`mailto:${PRIVACY_EMAIL}`}
                        className="text-primary underline hover:text-primary/80 transition-colors"
                      >
                        {PRIVACY_EMAIL}
                      </a>{" "}
                      for other requests.
                    </li>
                    <li>
                      We will respond to all data rights requests within{" "}
                      <strong className="text-foreground">30 days</strong>.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 — CCPA */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              8. California Residents — CCPA
            </h2>
            <div className="p-5 bg-muted/40 border border-border rounded-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Under the California Consumer Privacy Act (CCPA), California
                residents have the following rights:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-foreground">Right to Know:</strong>{" "}
                  You have the right to know what personal data we collect, use,
                  disclose, and sell.
                </li>
                <li>
                  <strong className="text-foreground">Right to Delete:</strong>{" "}
                  You have the right to request deletion of personal data we
                  have collected from you, subject to certain exceptions.
                </li>
                <li>
                  <strong className="text-foreground">
                    Right to Opt-Out of Sale:
                  </strong>{" "}
                  We do not sell personal data. This right is not applicable,
                  but we confirm no sale occurs.
                </li>
                <li>
                  <strong className="text-foreground">
                    Right to Non-Discrimination:
                  </strong>{" "}
                  We will not discriminate against you for exercising your CCPA
                  rights.
                </li>
              </ul>
              <p>
                To exercise your California privacy rights, email{" "}
                <a
                  href={`mailto:${PRIVACY_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {PRIVACY_EMAIL}
                </a>
                . We will respond within 45 days.
              </p>
            </div>
          </section>

          {/* Section 9 — Colorado CPA */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              9. Colorado Residents — Colorado Privacy Act (CPA)
            </h2>
            <div className="p-5 bg-muted/40 border border-border rounded-2xl space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Under the Colorado Privacy Act (CPA), Colorado residents have
                the following rights with respect to their personal data:
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Right to access personal data we process about you.</li>
                <li>
                  Right to correct inaccurate personal data we maintain about
                  you.
                </li>
                <li>
                  Right to delete personal data provided by or obtained about
                  you.
                </li>
                <li>
                  Right to data portability — obtain a copy of your personal
                  data in a portable format.
                </li>
                <li>
                  Right to opt out of processing for targeted advertising, sale,
                  or profiling (none of which we conduct).
                </li>
              </ul>
              <p>
                To exercise your Colorado privacy rights, email{" "}
                <a
                  href={`mailto:${PRIVACY_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {PRIVACY_EMAIL}
                </a>
                . We will respond within 45 days.
              </p>
            </div>
          </section>

          {/* Section 10 — Children's Privacy */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              10. Children&apos;s Privacy
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                The {APP_NAME} Platform is strictly for users 18 years of age or
                older. We do not knowingly collect personal information from any
                individual under 18. If we discover or are notified that a minor
                has used the Platform, their account will be immediately
                terminated and associated data will be deleted to the extent
                technically possible.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} are NOT liable for any minor who uses
                  the Platform in violation of the age requirement.
                </strong>{" "}
                See Section 2 of our Terms &amp; Conditions for the full minor
                liability clause.
              </p>
            </div>
          </section>

          {/* Section 11 — Data Retention */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              11. Data Retention
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Active accounts:</strong>{" "}
                Personal data retained indefinitely while subscription is active
                or account is in trial/frozen status.
              </p>
              <p>
                <strong className="text-foreground">Frozen accounts:</strong>{" "}
                Data retained for 90 days in frozen status, after which sitters
                may request anonymization. Export available at any time.
              </p>
              <p>
                <strong className="text-foreground">
                  Anonymized accounts:
                </strong>{" "}
                All personally identifiable information (name, email, phone,
                photo, location) replaced with anonymized placeholders. Booking
                records, payment records, and audit logs retained for platform
                integrity and legal purposes. This action is irreversible.
              </p>
              <p>
                <strong className="text-foreground">Exported data:</strong>{" "}
                Download links generated in response to data export requests are
                valid for 7 days after generation.
              </p>
              <div className="mt-2 p-4 rounded-xl bg-muted/40 border border-border">
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  Client Data Retention
                </h3>
                <p className="text-sm leading-relaxed">
                  We retain client contact information (name, email, phone),
                  booking records, and pet information for{" "}
                  <strong className="text-foreground">three (3) years</strong>{" "}
                  following the date of the last booking. Upon request, client
                  data will be deleted or anonymized within{" "}
                  <strong className="text-foreground">30 days</strong>, except
                  where retention is required by applicable law. Clients may
                  request deletion of their data at any time by contacting{" "}
                  <a
                    href={`mailto:${PRIVACY_EMAIL}`}
                    className="text-primary underline hover:text-primary/80 transition-colors"
                  >
                    {PRIVACY_EMAIL}
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              12. Your Choices
            </h2>
            <ul className="space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside">
              <li>
                <strong className="text-foreground">Export your data</strong> at
                any time using Download My Data in your sitter portal. We
                strongly recommend doing this regularly.
              </li>
              <li>
                <strong className="text-foreground">
                  Anonymize your account
                </strong>{" "}
                at any time (irreversible — permanently removes all PII).
              </li>
              <li>
                <strong className="text-foreground">Update your profile</strong>{" "}
                information directly in your portal.
              </li>
              <li>
                <strong className="text-foreground">Unsubscribe</strong> from
                non-essential email communications via unsubscribe links in
                email footers.
              </li>
              <li>
                <strong className="text-foreground">Close your account</strong>{" "}
                by contacting{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </li>
            </ul>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              13. Third-Party Links &amp; Services
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {APP_NAME} is not responsible for the privacy practices of any
              third-party websites or services linked from the Platform.
              Stripe&apos;s privacy policy governs all payment data collected
              and processed by Stripe. Internet Identity&apos;s terms govern
              authentication data. We encourage you to review the privacy
              policies of any third-party services you use in connection with
              the Platform.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              14. Changes to This Policy
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              We may update this Privacy Policy at any time. We will provide at
              least 30 days notice of material changes via email to your
              registered address or via an in-app notification. Continued use of
              the Platform after changes are posted constitutes your acceptance
              of the revised policy.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              15. Contact
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              For questions or concerns about this Privacy Policy or how your
              data is handled, contact us at{" "}
              <a
                href={`mailto:${PRIVACY_EMAIL}`}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {PRIVACY_EMAIL}
              </a>
              . General inquiries:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
              . {COMPANY}, Boulder, Colorado. We aim to respond to all
              privacy-related inquiries within 5 business days and all data
              rights requests within 30 days.
            </p>
          </section>

          <section className="border-t border-border pt-8">
            <p className="text-muted-foreground text-sm">
              Please also review our{" "}
              <button
                type="button"
                onClick={() => navigate("terms")}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                Terms &amp; Conditions
              </button>{" "}
              which govern your use of the Platform.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Button
            onClick={() => navigate("home")}
            className="rounded-full bg-primary text-primary-foreground px-8"
          >
            <ArrowLeft size={15} className="mr-2" />
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
}
