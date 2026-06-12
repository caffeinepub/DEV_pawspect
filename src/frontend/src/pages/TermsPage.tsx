import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, FileText, PawPrint } from "lucide-react";
import type { View } from "../App";
import { APP_NAME, SUPPORT_EMAIL } from "../config/business";

interface Props {
  navigate: (view: View) => void;
}

export const TERMS_VERSION = 2;
const EFFECTIVE_DATE = "May 4, 2026";
const COMPANY = "Data Driven Design Group, LLC";
const LEGAL_EMAIL = "legal@pawspect.co";

export default function TermsPage({ navigate }: Props) {
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
            <FileText size={14} />
            Legal Document
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-muted-foreground text-base">
            Effective: {EFFECTIVE_DATE} &middot; Last Updated: {EFFECTIVE_DATE}{" "}
            &middot; Version {TERMS_VERSION}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Operated by {COMPANY}, Boulder, Colorado &middot; US-Only Platform
          </p>
        </div>

        <div className="space-y-10 text-foreground">
          {/* Critical warning banner */}
          <div className="p-5 bg-destructive/10 border border-destructive/30 rounded-2xl flex gap-4">
            <AlertTriangle
              size={22}
              className="text-destructive shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">
                IMPORTANT — READ BEFORE USING THIS PLATFORM
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {APP_NAME} is a SOFTWARE PLATFORM ONLY, operated by {COMPANY}.
                It is NOT a pet-sitting service, employer, staffing agency, or
                gig marketplace. All pet care services are performed exclusively
                by independent sitters. {APP_NAME} and {COMPANY} bear ZERO
                liability for any service outcomes, data loss, downtime, sitter
                or client actions, or any other harm of any kind. By using this
                platform, you explicitly agree to these Terms in their entirety.
              </p>
            </div>
          </div>

          {/* Intro */}
          <section>
            <p className="text-base leading-relaxed text-muted-foreground">
              These Terms &amp; Conditions ("Terms") govern your use of the{" "}
              {APP_NAME} platform (the "Service" or "Platform"), operated by{" "}
              {COMPANY} ("we," "our," or "us"). Whether you are a pet owner
              ("Client") or a pet care provider ("Sitter"), by creating an
              account, submitting a booking, applying as a sitter, or otherwise
              accessing the Platform, you agree to be bound by these Terms.
              Please read them carefully and completely.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              1. Platform Identity — Technology Only
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">{APP_NAME}</strong> is a
                SOFTWARE PLATFORM operated by{" "}
                <strong className="text-foreground">{COMPANY}</strong>. It
                provides tools for independent pet sitters to manage their
                businesses — including booking management, invoicing, client
                CRM, analytics, and public storefronts.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} does NOT:
                </strong>{" "}
                provide, offer, supervise, schedule, assign, direct, or
                guarantee any pet sitting, dog walking, drop-in visits, or other
                animal care services of any kind. {APP_NAME} is NOT an employer,
                staffing agency, placement service, gig marketplace, or pet care
                provider.
              </p>
              <p>
                All pet care services are provided exclusively by independent
                sitters using the Platform. All contracts, agreements,
                arrangements, and liability for services are strictly between
                the sitter and the client.{" "}
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} are not party to any agreement
                  between sitters and clients.
                </strong>
              </p>
              <p>
                By using this Platform, you explicitly acknowledge and agree to
                this distinction. You understand that {APP_NAME} is a neutral
                technology provider with no role in, control over, or
                responsibility for the pet care services themselves.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              2. Eligibility, Age Requirement &amp; US-Only Restriction
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                You must be at least{" "}
                <strong className="text-foreground">18 years of age</strong> to
                create an account, submit a sitter application, or use any
                features of this Platform. By creating an account or otherwise
                using the Platform, you represent and warrant that you are 18 or
                older.
              </p>
              <p>
                <strong className="text-foreground">
                  US-ONLY SITTER RESTRICTION:
                </strong>{" "}
                {APP_NAME} only accepts sitters located in the United States.
                International use or non-US sitter registration is not
                permitted. By applying as a sitter, you represent and warrant
                that you are located in, and conducting pet care services
                within, the United States. Sitter accounts found to be operating
                outside the United States will be immediately terminated.
              </p>
              <p>
                <strong className="text-foreground">
                  MINOR PROTECTION AND LIABILITY CLAUSE:
                </strong>{" "}
                The Platform is strictly for adults 18 years of age or older. If
                a minor uses the Platform in violation of this age requirement —
                whether through misrepresentation of their age, unauthorized use
                of an adult&apos;s account, or any other means — the minor
                and/or their parent(s) or legal guardian(s) assume FULL AND SOLE
                liability for any and all outcomes, damages, losses, or harms
                arising from that use.{" "}
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} bear absolutely NO responsibility,
                  liability, or obligation whatsoever for any minor&apos;s use
                  of the Platform, regardless of whether the minor
                  misrepresented their age or otherwise circumvented the age
                  restriction.
                </strong>{" "}
                The individual who created the account or provided access to the
                account bears full responsibility for ensuring only eligible
                adults use it.
              </p>
              <p>
                Accounts discovered to belong to or to have been used by minors
                will be immediately terminated. {APP_NAME} reserves the right to
                request proof of age at any time.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              3. Sitter Eligibility &amp; Insurance Requirement
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                To apply as a sitter, you must: (a) be at least 18 years of age,
                with date of birth provided and verified at application; (b) be
                located in and conducting services within the United States; (c)
                carry adequate insurance for all pet care services you intend to
                offer, including but not limited to pet sitting, dog walking,
                drop-in visits, and overnight boarding; and (d) attest to all
                requirements during the application process.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} does NOT provide, arrange, verify, or guarantee any
                  insurance or bonding for any sitter.
                </strong>{" "}
                Any verification displayed on the Platform (such as application
                review status) is administrative and informational only. It does
                not constitute a background check, endorsement, guarantee of
                coverage, guarantee of qualifications, or any form of employment
                or agency relationship.
              </p>
              <p>
                Sitters are{" "}
                <strong className="text-foreground">SOLELY responsible</strong>{" "}
                for ensuring their insurance adequately covers all services they
                perform, for complying with all applicable federal, state, and
                local laws and regulations, and for the safety of all client
                interactions. The Platform is for pet sitting services only. Use
                of the Platform for any purpose other than pet sitting services
                may result in immediate account termination without refund.
              </p>
            </div>
          </section>

          {/* Section 3a */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              3a. Self-Reported Professional Credentials
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Sitters may add professional credential indicators to their
                profiles on {APP_NAME}. These may include, but are not limited
                to: business license status, insurance and bonding status,
                background check status, client reference availability, use of a
                service agreement, certifications or training (such as Certified
                Professional Pet Sitter&reg; or pet first aid), and membership
                in professional organizations such as Pet Sitters International.
              </p>
              <p>
                <strong className="text-foreground">
                  THESE CREDENTIALS ARE ENTIRELY SELF-REPORTED BY THE SITTER.
                </strong>{" "}
                They are NOT verified, certified, screened, audited, or endorsed
                by {APP_NAME} or {COMPANY} in any way, under any circumstances.
                The presence of a credential badge on a sitter&apos;s profile
                does not constitute a representation by {APP_NAME} or {COMPANY}{" "}
                that the credential is accurate, current, or truthful.
              </p>
              <p>
                By enabling credential badges on their profile, sitters
                represent and warrant that their statements are truthful and
                accurate. Sitters who provide false or misleading credential
                information are in violation of these Terms and may have their
                account terminated.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} assume NO responsibility for the
                  accuracy, completeness, currency, or truthfulness of any
                  credential information displayed on any sitter profile.
                </strong>{" "}
                Clients are solely and exclusively responsible for verifying
                sitter credentials independently, including requesting and
                reviewing proof of licenses, insurance documentation, background
                check results, certifications, and references before engaging
                any sitter&apos;s services.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} shall have NO liability of any kind —
                  including but not limited to direct, indirect, incidental,
                  special, or consequential damages — arising from or related
                  to: (i) any sitter credential representation, whether accurate
                  or inaccurate; (ii) any client reliance on any credential
                  badge or claim; or (iii) any harm, loss, injury, or damage
                  resulting from a client&apos;s decision to engage a sitter
                  based in whole or in part on credential information.
                </strong>
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-5 flex gap-3">
              <AlertTriangle
                size={18}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <p className="text-sm font-bold text-foreground">
                SECTION 4 IS THE MOST CRITICAL SECTION OF THESE TERMS. READ IT
                IN FULL.
              </p>
            </div>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              4. Comprehensive Zero Liability Disclaimer
            </h2>
            <p className="text-base font-bold text-foreground uppercase mb-4 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW,{" "}
              {APP_NAME.toUpperCase()} AND {COMPANY.toUpperCase()} EXPRESSLY AND
              COMPLETELY DISCLAIM ALL LIABILITY FOR THE FOLLOWING:
            </p>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (a) Service Outcomes
                </p>
                <p>
                  Any harm, injury, illness, death, loss, or damage to pets,
                  people, or property arising from services performed by sitters
                  or from any interaction between sitters and clients. All
                  outcomes of pet care services are the sole and exclusive
                  responsibility of the sitter and/or client. {APP_NAME} and{" "}
                  {COMPANY} have zero involvement in, control over, or liability
                  for any service outcome.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (b) Data Loss
                </p>
                <p>
                  Any loss, corruption, deletion, partial loss, inaccessibility,
                  or unavailability of user data, whether caused by technical
                  failure, software bugs, canister upgrades, network outages,
                  hardware failure, human error, cyberattacks, or any other
                  cause whatsoever.{" "}
                  <strong className="text-foreground">
                    Users are strongly encouraged to export their data regularly
                    using the Download My Data feature. {APP_NAME} and {COMPANY}{" "}
                    bear absolutely no liability for data loss of any kind under
                    any circumstances.
                  </strong>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (c) Platform Downtime
                </p>
                <p>
                  Any interruption, outage, slowdown, degradation, or complete
                  unavailability of the Platform, whether scheduled or
                  unscheduled, whether brief or extended, regardless of duration
                  or cause. {APP_NAME} and {COMPANY} make no warranties of
                  uptime or availability and shall not be liable for any losses
                  arising from platform downtime.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (d) Third-Party Payments
                </p>
                <p>
                  Any issues, disputes, failures, refunds, chargebacks,
                  unauthorized transactions, or other problems related to
                  payments processed through Stripe or any other third-party
                  payment processor. Payment processing is subject to
                  Stripe&apos;s own terms of service and privacy policy.{" "}
                  {APP_NAME} and {COMPANY} are not responsible for any payment
                  processing errors or failures.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (e) Minors Using the Platform
                </p>
                <p>
                  Any outcomes, damages, injuries, or liabilities of any kind
                  arising from a minor using the Platform in violation of the
                  18+ age requirement, regardless of how the minor gained
                  access. See Section 2 for the full minor liability clause.{" "}
                  {APP_NAME} and {COMPANY} bear zero responsibility for any
                  minor&apos;s use of the Platform.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (f) Sitter or Client Actions
                </p>
                <p>
                  Any acts, omissions, misconduct, negligence, fraud,
                  misrepresentation, illegal activity, or any other behavior by
                  any sitter or client, whether on or off the Platform.{" "}
                  {APP_NAME} does not supervise, vet, endorse, certify, or
                  guarantee the behavior, character, qualifications, or fitness
                  of any user. Users interact with each other entirely at their
                  own risk.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (g) Verification Limitations
                </p>
                <p>
                  Any background checks, identity verifications, credential
                  verifications, or other checks (if any are performed at any
                  time) are informational only and do not constitute an
                  endorsement, certification, guarantee of safety, guarantee of
                  qualifications, or any form of employment relationship. Users
                  must conduct their own independent due diligence.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (h) Indirect Damages
                </p>
                <p>
                  IN NO EVENT SHALL {APP_NAME.toUpperCase()} OR{" "}
                  {COMPANY.toUpperCase()} BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY
                  DAMAGES OF ANY KIND, INCLUDING WITHOUT LIMITATION LOST
                  PROFITS, LOST REVENUE, LOST DATA, LOSS OF GOODWILL, OR COST OF
                  SUBSTITUTE SERVICES, REGARDLESS OF THE CAUSE OF ACTION OR THE
                  THEORY OF LIABILITY, AND EVEN IF {APP_NAME.toUpperCase()} OR{" "}
                  {COMPANY.toUpperCase()} HAS BEEN ADVISED OF THE POSSIBILITY OF
                  SUCH DAMAGES.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <p className="font-semibold text-foreground mb-1">
                  (i) Platform Misuse
                </p>
                <p>
                  Any damages, losses, or liabilities arising from use of the
                  Platform for purposes other than pet sitting services,
                  including any illegal activity, fraud, harassment, or misuse
                  of any kind conducted through the Platform.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              In jurisdictions that do not allow the exclusion of certain
              warranties or limitations of liability, {APP_NAME}&apos;s and{" "}
              {COMPANY}&apos;s liability is limited to the fullest extent
              permitted by applicable law. The warranty disclaimers and
              liability limitations in these Terms are fundamental elements of
              the basis of the bargain between you and {APP_NAME}. The Platform
              would not be provided without such limitations.
            </p>
          </section>

          {/* Section 4a — Limitation of Liability Cap */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              4a. Limitation of Liability Cap
            </h2>
            <div className="p-5 bg-destructive/8 border border-destructive/25 rounded-2xl">
              <p className="text-base font-bold text-foreground uppercase leading-relaxed">
                IN NO EVENT SHALL {COMPANY.toUpperCase()}&apos;S TOTAL LIABILITY
                TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS
                OR THE PLATFORM EXCEED THE GREATER OF: (A) THE TOTAL
                SUBSCRIPTION FEES ACTUALLY PAID BY YOU TO{" "}
                {COMPANY.toUpperCase()} IN THE TWELVE (12) MONTHS IMMEDIATELY
                PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED
                DOLLARS ($100.00). FOR FREE TRIAL USERS OR LIFETIME MEMBERS
                PAYING $0, THIS LIMIT IS ZERO DOLLARS ($0.00).
              </p>
            </div>
          </section>

          {/* Section 4b — Warranty Disclaimer */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              4b. Warranty Disclaimer
            </h2>
            <div className="p-5 bg-muted/40 border border-border rounded-2xl">
              <p className="text-base font-bold text-foreground uppercase leading-relaxed">
                THE PLATFORM IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS
                WITHOUT WARRANTIES OF ANY KIND. {COMPANY.toUpperCase()}{" "}
                EXPRESSLY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE,
                ACCURACY OF CONTENT, AVAILABILITY, AND UNINTERRUPTED OR
                ERROR-FREE OPERATION. WE DO NOT WARRANT THAT THE PLATFORM WILL
                MEET YOUR REQUIREMENTS, THAT ANY DEFECTS WILL BE CORRECTED, OR
                THAT THE PLATFORM IS FREE OF VIRUSES OR OTHER HARMFUL
                COMPONENTS.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              5. No Endorsement or Vetting Guarantee
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Sitter application review is an administrative process conducted
                by {APP_NAME} for platform access purposes only. It is NOT a
                background check, criminal history review, reference
                verification, credential verification, or endorsement of any
                kind.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} makes no representations, warranties, or guarantees
                  about any sitter&apos;s qualifications, character, competence,
                  reliability, criminal history, mental fitness, or fitness to
                  care for animals.
                </strong>{" "}
                The presence of a sitter profile on the Platform does not
                constitute an endorsement.
              </p>
              <p>
                <strong className="text-foreground">
                  Clients are solely and exclusively responsible for their own
                  due diligence
                </strong>{" "}
                before hiring, engaging, or interacting with any sitter. You
                engage any sitter entirely at your own risk. {APP_NAME}{" "}
                recommends clients independently verify sitter qualifications,
                check references, conduct a Meet &amp; Greet before the first
                booking, and take all other reasonable precautions.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              6. Sitter–Client Relationship
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Sitters and clients are solely responsible for arranging all
                service details including location, access arrangements, key
                exchange, home entry procedures, emergency protocols, and all
                other service logistics. These arrangements occur outside the
                Platform (except where the Platform facilitates scheduling) and{" "}
                {APP_NAME} is not responsible for any aspect of these
                arrangements.
              </p>
              <p>
                {APP_NAME} is not responsible for any dispute, disagreement,
                accident, injury, loss, damage, or harm of any kind arising from
                the sitter–client relationship, whether during, before, or after
                any service.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              7. Sitter Responsibilities
            </h2>
            <ul className="space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside">
              <li>
                You are an independent contractor and independent business
                owner. You are <strong className="text-foreground">not</strong>{" "}
                an employee, partner, agent, or representative of {APP_NAME} or{" "}
                {COMPANY} in any capacity.
              </li>
              <li>
                You are fully and solely responsible for your own business
                operations, pricing, service quality, taxes (including
                self-employment taxes), licensing, permits, and compliance with
                all applicable federal, state, and local laws and regulations.
              </li>
              <li>
                You must carry your own liability insurance adequate to cover
                all your pet care activities. {APP_NAME} provides no insurance,
                bonding, or indemnification of any kind.
              </li>
              <li>
                You assume ALL risk and ALL liability to clients and third
                parties for any harm, loss, injury, illness, death, or damage
                arising from your services.
              </li>
              <li>
                You must provide accurate, truthful information in your profile
                and application. Misrepresentation may result in immediate
                account termination.
              </li>
              <li>
                You must be 18 years of age or older and located in the United
                States. You must attest to both during application.
              </li>
              <li>
                You must ensure safe interactions with clients and their pets.{" "}
                {APP_NAME} bears no responsibility for the safety of any
                interaction.
              </li>
              <li>
                Platform is for pet sitting services only. Misuse results in
                immediate account termination.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              8. Client Responsibilities
            </h2>
            <ul className="space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside">
              <li>
                You are solely responsible for selecting, evaluating, vetting,
                and engaging any sitter. {APP_NAME} does not recommend, endorse,
                or guarantee any sitter.
              </li>
              <li>
                Provide accurate information about your pets, including all
                medical conditions, behavioral issues, dietary requirements,
                medications, vaccination status, and emergency contacts.
              </li>
              <li>
                Ensure your pets are current on all required vaccinations and
                are free from contagious diseases at the time of any service.
              </li>
              <li>
                Pay sitters directly and on time as agreed. Payment disputes are
                exclusively between you and the sitter — {APP_NAME} has no role
                and no obligation to mediate.
              </li>
              <li>
                You engage sitters entirely at your own risk. {APP_NAME} and{" "}
                {COMPANY} have no liability for any outcomes.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              9. Subscription &amp; Account
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                {APP_NAME} offers sitters a 30-day free trial upon application
                approval, followed by a subscription of $15/month for continued
                full access. No platform fees are charged on any transactions —
                you keep 100% of your earnings.
              </p>
              <p>
                If a subscription lapses due to non-payment or cancellation,
                your account will be frozen. You will not lose data, but you
                will be unable to accept bookings, send invoices, or use
                platform features until subscription is reactivated. You may
                request a GDPR data export or account anonymization at any time,
                regardless of subscription status.
              </p>
              <p>
                Misuse of the Platform — including but not limited to use for
                non-pet-sitting purposes, fraudulent activity, harassment, or
                violation of these Terms — results in immediate account
                termination without refund. {APP_NAME} reserves the right to
                terminate any account at any time, for any reason, including at
                our sole discretion.
              </p>
              <p>
                Certain sitters may have been grandfathered into lifetime free
                access under prior arrangements. Grandfathered access is
                provided under these Terms and does not exempt grandfathered
                members from any other provisions of these Terms.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              10. Intellectual Property
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                The Platform software, design, trademarks, trade dress, and
                brand identity are owned by {COMPANY}. All rights reserved. You
                may not copy, reproduce, distribute, or create derivative works
                from any part of the Platform without express written permission
                from {COMPANY}.
              </p>
              <p>
                Users retain ownership of their own content (profiles, photos,
                reviews, and communications). By submitting content to the
                Platform, you grant {APP_NAME} a non-exclusive, royalty-free
                license to display and use that content solely for the purpose
                of operating the Platform.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              11. Privacy &amp; GDPR Rights
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Our data practices are described in our Privacy Policy. Users
                have rights to access, export, and anonymize their data. Sitters
                can exercise these rights directly from the{" "}
                <strong className="text-foreground">
                  Account &amp; Privacy
                </strong>{" "}
                tab in their portal at any time:
              </p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-foreground">Download My Data</strong>{" "}
                  — Export a complete copy of all your data.
                </li>
                <li>
                  <strong className="text-foreground">
                    Anonymize My Account
                  </strong>{" "}
                  — Remove all PII (irreversible).
                </li>
              </ul>
              <p>
                Note: While {APP_NAME} implements reasonable security measures,{" "}
                <strong className="text-foreground">
                  we strongly recommend regularly exporting your data as a
                  backup. {APP_NAME} and {COMPANY} bear no liability for data
                  loss under any circumstances.
                </strong>
              </p>
            </div>
          </section>

          {/* Section 11a */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              11a. Analytics Data
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Analytics data shown in your portal — including earnings charts,
                booking trends, client retention rates, peak hours heatmaps, and
                revenue forecasts — are derived from your booking and payment
                records on the Platform.
              </p>
              <p>
                <strong className="text-foreground">
                  {APP_NAME} does NOT guarantee the accuracy of projections or
                  forecasts.
                </strong>{" "}
                Revenue forecast data is an estimate only and is{" "}
                <strong className="text-foreground">
                  not financial advice
                </strong>
                . All analytics are provided for informational and business
                management purposes only. {APP_NAME} and {COMPANY} are not
                liable for any decisions made based on platform analytics data.
              </p>
              <p>
                Analytics may not capture all edge cases (e.g., bookings entered
                retroactively, data corrections, or timing of data syncs). You
                are responsible for verifying your own financial records
                independently.
              </p>
            </div>
          </section>

          {/* Section 11b */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              11b. Cancellation Policy
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                Bookings cancelled within{" "}
                <strong className="text-foreground">24 hours</strong> of the
                scheduled start time are considered late cancellations and are
                subject to the full service charge at the sitter&apos;s
                discretion.
              </p>
              <p>
                {APP_NAME} enforces the cancellation window by restricting the
                cancellation button functionality for bookings within 24 hours —
                clients must explicitly acknowledge the potential charge to
                proceed. However, all financial outcomes from cancellations are
                solely between the sitter and client.{" "}
                <strong className="text-foreground">
                  {APP_NAME} and {COMPANY} are not a party to any financial
                  agreement between sitters and clients and accept no liability
                  for cancellation disputes of any kind.
                </strong>
              </p>
              <p>
                Sitters may, at their sole discretion, update an invoice to
                reflect a lesser charge following a late cancellation. Any such
                adjustment is entirely at the sitter&apos;s discretion and does
                not create any obligation on the part of {APP_NAME} or {COMPANY}
                . Clients agree to this cancellation policy as part of the
                booking consent step before submitting any booking.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              12. Prohibited Conduct
            </h2>
            <ul className="space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside">
              <li>
                Creating fake profiles or submitting false information in any
                application, booking, or platform form.
              </li>
              <li>
                Using the Platform for any purpose other than pet sitting
                services.
              </li>
              <li>
                Harassing, threatening, abusing, or discriminating against any
                user of the Platform.
              </li>
              <li>
                Using the Platform to facilitate any illegal activity, including
                animal abuse or neglect.
              </li>
              <li>
                Attempting to gain unauthorized access to the Platform, backend,
                or other users&apos; data.
              </li>
              <li>
                Misrepresenting your age or allowing minors to use your account.
              </li>
              <li>
                Any activity that could damage, disable, or impair the Platform
                or its infrastructure.
              </li>
              <li>
                Registering as a sitter if you are located outside the United
                States.
              </li>
            </ul>
          </section>

          {/* Section 13 — Indemnification */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              13. Indemnification
            </h2>
            <div className="p-5 bg-muted/40 border border-border rounded-2xl">
              <p className="text-base leading-relaxed text-muted-foreground">
                You agree to indemnify, defend, and hold harmless{" "}
                <strong className="text-foreground">{COMPANY}</strong>, its
                officers, directors, employees, agents, and licensors from and
                against any claims, liabilities, damages, judgments, awards,
                losses, costs, expenses, or fees (including reasonable
                attorneys&apos; fees) arising out of or relating to: (a) your
                use of the Platform; (b) your violation of these Terms; (c) your
                provision of or engagement of pet care services; (d) any claims
                by third parties related to services booked through the
                Platform; (e) your independent contractor status or
                misclassification claims; (f) your failure to pay applicable
                taxes; or (g) any pet-related incidents or injuries.
              </p>
            </div>
          </section>

          {/* Section 14 — Class Action Waiver */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              14. Class Action Waiver
            </h2>
            <div className="p-5 bg-destructive/8 border border-destructive/25 rounded-2xl">
              <p className="text-base font-bold text-foreground uppercase leading-relaxed">
                TO THE EXTENT PERMITTED BY LAW, YOU WAIVE ANY RIGHT TO BRING OR
                PARTICIPATE IN A CLASS, COLLECTIVE, CONSOLIDATED, OR
                REPRESENTATIVE ACTION AGAINST {COMPANY.toUpperCase()}. ALL
                CLAIMS MUST BE BROUGHT ON AN INDIVIDUAL BASIS. THIS WAIVER
                APPLIES WHETHER OR NOT YOU OPT OUT OF ARBITRATION.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground mt-3">
                You may opt out of this class action waiver within 30 days of
                first accepting these Terms by emailing{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {LEGAL_EMAIL}
                </a>{" "}
                with subject line: <em>Class Action Waiver Opt-Out</em>.
              </p>
            </div>
          </section>

          {/* Section 15 — Dispute Resolution */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              15. Governing Law &amp; Dispute Resolution
            </h2>
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <p>
                These Terms are governed by and construed in accordance with the
                laws of the{" "}
                <strong className="text-foreground">
                  State of Colorado, USA
                </strong>
                , without regard to its conflict of law provisions. Any disputes
                arising from or related to the Platform that are not resolved
                through good-faith negotiation shall be resolved in the courts
                of{" "}
                <strong className="text-foreground">
                  Boulder County, Colorado
                </strong>
                .
              </p>
              <p>
                Users agree to binding arbitration for any claims under $10,000
                USD, administered under the rules of the American Arbitration
                Association. For claims over $10,000, Boulder County courts
                shall have exclusive jurisdiction.
              </p>
              <p>
                <strong className="text-foreground">
                  Arbitration Opt-Out:
                </strong>{" "}
                To opt out of arbitration, you must notify us in writing within
                30 days of first accepting these Terms by emailing{" "}
                <a
                  href={`mailto:${LEGAL_EMAIL}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  {LEGAL_EMAIL}
                </a>{" "}
                with subject: <em>Arbitration Opt-Out</em>. Opting out of
                arbitration does not affect the class action waiver in Section
                14.
              </p>
              <p className="font-bold text-foreground uppercase">
                JURY TRIAL WAIVER: TO THE EXTENT PERMITTED BY APPLICABLE LAW,
                EACH PARTY WAIVES ITS RIGHT TO A JURY TRIAL IN CONNECTION WITH
                ANY CLAIM OR DISPUTE RELATED TO THESE TERMS OR THE PLATFORM.
              </p>
              <p>
                Any disputes arising from pet care services are solely between
                the sitter and the client. {APP_NAME} is not a party to any such
                dispute and has no obligation to participate in, fund, or
                facilitate any resolution.
              </p>
            </div>
          </section>

          {/* Section 16 — Force Majeure */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              16. Force Majeure
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {COMPANY} shall not be liable for any failure or delay in
              performance under these Terms resulting from causes beyond our
              reasonable control, including but not limited to: acts of God,
              natural disasters, pandemic, war, terrorism, government actions,
              Internet or telecommunications failures, Internet Computer network
              outages, power failures, civil disturbances, or any other event
              beyond our reasonable control.
            </p>
          </section>

          {/* Section 17 — Amendment */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              17. Amendments to These Terms
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {COMPANY} reserves the right to modify these Terms at any time. We
              will provide at least 30 days notice of material changes via email
              to your registered address or via an in-app notification. Your
              continued use of the Platform after the effective date of updated
              Terms constitutes your acceptance. We maintain version numbers for
              all Terms (current: Version {TERMS_VERSION}); your acceptance of
              each version is recorded.
            </p>
          </section>

          {/* Section 18 — Severability */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              18. Severability
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              If any provision of these Terms is held to be invalid, illegal, or
              unenforceable under applicable law, such provision shall be
              modified to the minimum extent necessary to make it valid and
              enforceable, and the remaining provisions shall continue in full
              force and effect.
            </p>
          </section>

          {/* Section 19 — Entire Agreement */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              19. Entire Agreement
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and {COMPANY} regarding the Platform
              and supersede all prior agreements, representations, warranties,
              and understandings between the parties.
            </p>
          </section>

          {/* Section 20 */}
          <section>
            <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
              20. Contact
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              For questions about these Terms, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
              . For legal matters:{" "}
              <a
                href={`mailto:${LEGAL_EMAIL}`}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                {LEGAL_EMAIL}
              </a>
              . {COMPANY}, Boulder, Colorado. We aim to respond to all inquiries
              within 5 business days.
            </p>
          </section>

          <section className="border-t border-border pt-8">
            <p className="text-muted-foreground text-sm">
              Please also read our{" "}
              <button
                type="button"
                onClick={() => navigate("privacy")}
                className="text-primary underline hover:text-primary/80 transition-colors"
              >
                Privacy Policy
              </button>{" "}
              to understand how we collect and use your personal information.
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
