import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Scale,
  XCircle,
} from "lucide-react";

type ItemStatus = "implemented" | "review" | "attorney";

interface ChecklistItem {
  id: string;
  title: string;
  status: ItemStatus;
  description: string;
  notes?: string;
  citation?: string;
}

interface ChecklistSection {
  number: number;
  title: string;
  description: string;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    number: 1,
    title: "Platform Identity & Business Structure",
    description:
      "Establishes the legal identity of the business and its relationship to sitters and clients. Critical for limiting liability and avoiding misclassification.",
    items: [
      {
        id: "1.1",
        title: "Legal entity name and structure documented",
        status: "implemented",
        description:
          "Data Driven Design Group, LLC is the operating entity. LLC structure provides personal liability protection. Documented in Terms of Service.",
        citation: "State LLC statutes (Colorado)",
      },
      {
        id: "1.2",
        title: "Software-only platform disclaimer",
        status: "implemented",
        description:
          "Terms explicitly state Pawspect is a software platform only — not a marketplace, staffing agency, employer, or service provider. All arrangements are solely between sitters and clients.",
        citation: "Federal Trade Commission Act §5",
      },
      {
        id: "1.3",
        title: "Independent contractor classification of sitters",
        status: "review",
        description:
          "Terms state sitters are independent operators. However, the ABC test (California Dynamex), Borello test factors, and Colorado-specific criteria should be documented and reviewed annually.",
        citation:
          "Dynamex Operations West v. Superior Court (CA); CO Rev. Stat. §8-70-115",
      },
      {
        id: "1.4",
        title: "No agency relationship disclosed",
        status: "implemented",
        description:
          "Terms explicitly disclaim any agency, employment, partnership, or joint venture relationship between Pawspect and its users.",
        citation: "Restatement (Third) of Agency",
      },
      {
        id: "1.5",
        title: "Governing law and jurisdiction",
        status: "implemented",
        description:
          "Terms specify Colorado law governs all disputes. Venue for litigation is Colorado courts.",
        citation: "CO Revised Statutes",
      },
    ],
  },
  {
    number: 2,
    title: "Terms of Service",
    description:
      "The primary contract between the platform and its users. Courts require clear assent, accessibility, and regular updates to enforce ToS provisions.",
    items: [
      {
        id: "2.1",
        title: "Terms of Service publicly accessible",
        status: "implemented",
        description:
          "Terms are published and accessible at the public URL. Linked from the homepage footer and surfaced in the sign-up/application flow.",
        citation: "Nguyen v. Barnes & Noble LLC (9th Cir. 2014)",
      },
      {
        id: "2.2",
        title: "Effective date and version present",
        status: "review",
        description:
          "An effective date should be explicitly shown on the Terms page. Version numbering allows tracking of changes over time and matching accepted versions to users.",
        citation: "Best practice — contract enforceability",
      },
      {
        id: "2.3",
        title: "Explicit acceptance at account creation",
        status: "implemented",
        description:
          "A blocking modal with an explicit 'I Agree' button is shown during the sitter application and client booking flows. Cannot proceed without acceptance.",
        citation: "Specht v. Netscape Commc'ns Corp. (2d Cir. 2002)",
      },
      {
        id: "2.4",
        title: "Versioned terms — prior acceptances preserved",
        status: "implemented",
        description:
          "Each acceptance stores the version of terms agreed to. Prior accepted versions are preserved in the audit log.",
        citation: "Best practice — contract certainty",
      },
      {
        id: "2.5",
        title: "Re-acceptance on material terms update",
        status: "implemented",
        description:
          "When terms are updated, returning users see a blocking modal requiring re-acceptance before continuing. Prior version is referenced.",
        citation: "Douglas v. United States District Court (9th Cir. 2007)",
      },
      {
        id: "2.6",
        title: "Right to modify terms with notice",
        status: "implemented",
        description:
          "Terms include the platform's right to modify at any time with notice. Continued use constitutes acceptance.",
        citation: "Standard contract clause",
      },
      {
        id: "2.7",
        title: "Account termination clauses",
        status: "implemented",
        description:
          "Terms describe conditions for account suspension and termination, including non-payment and breach of policy.",
        citation: "CO Contract Law",
      },
      {
        id: "2.8",
        title: "Binding arbitration and class action waiver",
        status: "review",
        description:
          "Terms include binding arbitration for disputes under $10,000. Class action waiver present. Attorney should review whether the waiver is fully compliant with current case law and applicable state rules.",
        citation:
          "FAA 9 U.S.C. §1; Epic Systems Corp. v. Lewis (2018); CO CRS §13-22-201",
      },
      {
        id: "2.9",
        title: "Intellectual property ownership",
        status: "implemented",
        description:
          "Platform owns all software, design, and branding. Sitters retain ownership of their content but grant the platform a display license.",
        citation: "17 U.S.C. §101 (Copyright Act)",
      },
      {
        id: "2.10",
        title: "Prohibited uses and anti-scraping clause",
        status: "implemented",
        description:
          "Terms prohibit reverse engineering, scraping, unauthorized data extraction, and misuse of the platform.",
        citation: "Computer Fraud and Abuse Act 18 U.S.C. §1030",
      },
    ],
  },
  {
    number: 3,
    title: "Privacy Policy & Data Practices",
    description:
      "Legally required disclosure of how personal data is collected, used, stored, and shared. Failure to publish an accurate Privacy Policy can result in FTC enforcement and state AG actions.",
    items: [
      {
        id: "3.1",
        title: "Privacy Policy publicly accessible",
        status: "implemented",
        description:
          "Privacy Policy is published and linked from the homepage footer, sitter application, and booking flows.",
        citation: "FTC Act §5; CCPA; GDPR Art. 13",
      },
      {
        id: "3.2",
        title: "Data categories collected disclosed",
        status: "implemented",
        description:
          "Policy discloses: name, email, phone, pet info, service area ZIP, payment data (Stripe-tokenized), booking history, device/browser data.",
        citation: "GDPR Art. 13(1)(c); CCPA §1798.100",
      },
      {
        id: "3.3",
        title: "How data is used disclosed",
        status: "implemented",
        description:
          "Policy states data is used for operating the platform, sending notifications, analytics, improving services, and complying with legal obligations.",
        citation: "GDPR Art. 13(1)(c)",
      },
      {
        id: "3.4",
        title: "Third-party data sharing disclosed",
        status: "implemented",
        description:
          "Policy discloses data is shared with: Stripe (payments), email provider (transactional email), ICP infrastructure (hosting). No sale to advertisers.",
        citation: "GDPR Art. 13(1)(e); CCPA §1798.115",
      },
      {
        id: "3.5",
        title: "Data retention policy defined",
        status: "implemented",
        description:
          "Policy states: active accounts retained while account is open, frozen accounts for 90 days, anonymized accounts have PII replaced permanently.",
        citation: "GDPR Art. 5(1)(e) (storage limitation)",
      },
      {
        id: "3.6",
        title: "Rights to access, export, correct, and delete",
        status: "implemented",
        description:
          "Export and anonymize features are user-accessible from the sitter portal. Admin can initiate on behalf of sitters. 30-day response SLA stated in policy.",
        citation: "GDPR Art. 15-17; CCPA §1798.100",
      },
      {
        id: "3.7",
        title: "Children's privacy (COPPA) disclosure",
        status: "implemented",
        description:
          "Policy and Terms require users to be 18+. Platform does not knowingly collect data from persons under 13. COPPA applicability is addressed.",
        citation: "COPPA 15 U.S.C. §6501; 16 C.F.R. Part 312",
      },
      {
        id: "3.8",
        title: "Cookies and tracking disclosure",
        status: "attorney",
        description:
          "ICP-based apps may not use traditional HTTP cookies. Local storage is used for session caching. Attorney should verify whether a cookie banner or disclosure is required, and whether localStorage usage requires disclosure under applicable law.",
        citation: "ePrivacy Directive 2002/58/EC; CCPA",
      },
      {
        id: "3.9",
        title: "Privacy contact information",
        status: "implemented",
        description:
          "Privacy Policy includes a contact email for privacy inquiries and GDPR data subject requests.",
        citation: "GDPR Art. 13(1)(a)",
      },
      {
        id: "3.10",
        title: "CCPA rights notice for California residents",
        status: "implemented",
        description:
          "Privacy Policy includes a California-specific section addressing CCPA rights: right to know, delete, opt-out of sale (not applicable — platform does not sell data), and non-discrimination.",
        citation: "CCPA Cal. Civ. Code §1798.100-199",
      },
      {
        id: "3.11",
        title: "GDPR rights notice for EU/UK residents",
        status: "implemented",
        description:
          "Privacy Policy includes an EU/UK section addressing GDPR rights: access, rectification, erasure, portability, restriction, and objection.",
        citation: "GDPR Art. 12-22; UK GDPR",
      },
    ],
  },
  {
    number: 4,
    title: "GDPR & International Privacy Compliance",
    description:
      "The EU's General Data Protection Regulation applies to any business processing data of EU residents, regardless of where the business is located. Fines up to 4% of global turnover or €20M.",
    items: [
      {
        id: "4.1",
        title: "Lawful basis for processing documented",
        status: "implemented",
        description:
          "Privacy Policy identifies lawful bases: contract performance (bookings), legitimate interest (analytics, security), and consent (communications).",
        citation: "GDPR Art. 6(1)",
      },
      {
        id: "4.2",
        title: "Data minimization principle",
        status: "implemented",
        description:
          "Only data necessary for platform operation is collected. No behavioral advertising, no unnecessary third-party tracking.",
        citation: "GDPR Art. 5(1)(c)",
      },
      {
        id: "4.3",
        title: "Data subject rights fully implemented",
        status: "implemented",
        description:
          "Access (export), erasure (anonymize), portability (export), rectification (profile editing), restriction, and objection — all implemented or addressable via support.",
        citation: "GDPR Art. 15-22",
      },
      {
        id: "4.4",
        title: "Right to erasure — anonymization implemented",
        status: "implemented",
        description:
          "Sitters can request account anonymization from the portal. Anonymization replaces all PII with placeholders permanently and irreversibly. Admin can initiate on request.",
        citation: "GDPR Art. 17",
      },
      {
        id: "4.5",
        title: "Data export (portability) implemented",
        status: "implemented",
        description:
          'Sitters can download all their data at any time via the "Download My Data" feature. Admin can trigger on behalf of the sitter.',
        citation: "GDPR Art. 20",
      },
      {
        id: "4.6",
        title: "GDPR request response SLA (30 days)",
        status: "implemented",
        description:
          "Privacy Policy commits to responding to data subject requests within 30 days per GDPR requirements.",
        citation: "GDPR Art. 12(3)",
      },
      {
        id: "4.7",
        title: "GDPR actions logged in audit trail",
        status: "implemented",
        description:
          "All GDPR events (export request, download, anonymization request, completion) are logged in the admin audit trail with timestamp, actor, and target.",
        citation: "GDPR Art. 5(2) (accountability)",
      },
      {
        id: "4.8",
        title: "Confirmation emails for GDPR actions",
        status: "implemented",
        description:
          "Sitters receive branded confirmation emails when a GDPR export or anonymization request is initiated and completed.",
        citation: "GDPR Art. 12(1) (transparent information)",
      },
      {
        id: "4.9",
        title: "Data Processor Agreements",
        status: "attorney",
        description:
          "Data Processing Agreements (DPAs) are required with Stripe, the email provider, and technically with Caffeine/ICP as infrastructure. Attorney should verify current DPA status with each processor.",
        citation: "GDPR Art. 28",
      },
      {
        id: "4.10",
        title: "Cross-border data transfer safeguards",
        status: "review",
        description:
          "ICP is a decentralized network. Attorney should confirm whether ICP's architecture triggers EU SCCs or adequacy requirements. Stripe handles EU transfers under their own DPA/SCCs.",
        citation: "GDPR Art. 44-49; EU-US Data Privacy Framework",
      },
    ],
  },
  {
    number: 5,
    title: "California CCPA & US State Privacy Laws",
    description:
      "CCPA and its successor CPRA, along with emerging state privacy laws, create obligations for businesses handling California residents' data — regardless of where the business is based.",
    items: [
      {
        id: "5.1",
        title: "Do Not Sell or Share disclosure",
        status: "implemented",
        description:
          'Privacy Policy explicitly states Pawspect does not sell, rent, or share personal information for advertising purposes. "Do Not Sell My Personal Information" is addressed.',
        citation: "CCPA §1798.120; CPRA",
      },
      {
        id: "5.2",
        title: "Right to know — data export covers this",
        status: "implemented",
        description:
          "The data export feature gives users a complete copy of their data, satisfying the CCPA right to know what data is held.",
        citation: "CCPA §1798.110",
      },
      {
        id: "5.3",
        title: "Right to delete — anonymization covers this",
        status: "implemented",
        description:
          "The anonymization feature permanently removes PII, satisfying the CCPA right to delete personal information.",
        citation: "CCPA §1798.105",
      },
      {
        id: "5.4",
        title: "Non-discrimination for exercising rights",
        status: "implemented",
        description:
          "Privacy Policy states users will not be discriminated against for exercising their privacy rights.",
        citation: "CCPA §1798.125",
      },
      {
        id: "5.5",
        title: "Colorado CPA applicability",
        status: "attorney",
        description:
          "Colorado Privacy Act (CPA) took effect July 2023 and applies to entities processing data of 100,000+ Colorado residents annually. Attorney should assess applicability and any required opt-out mechanisms.",
        citation: "CO SB 21-190 (Colorado Privacy Act)",
      },
      {
        id: "5.6",
        title: "Virginia VCDPA and other state laws",
        status: "attorney",
        description:
          "Virginia, Connecticut, Texas, Montana, and other states have enacted privacy laws. Attorney should assess which apply given the platform's user base and revenue thresholds.",
        citation: "VA Code §59.1-571 et seq.; CT SB 6 (CTDPA)",
      },
    ],
  },
  {
    number: 6,
    title: "Liability Disclaimers & Limitation of Liability",
    description:
      "Liability limitation clauses are the platform's primary defense against claims arising from sitter/client interactions. Courts will enforce clear, conspicuous disclaimers.",
    items: [
      {
        id: "6.1",
        title: "Platform-only disclaimer (no liability for outcomes)",
        status: "implemented",
        description:
          "Terms explicitly state Pawspect is a software tool only and is not liable for outcomes of any pet care services, sitter conduct, or client conduct.",
        citation: "Restatement (Second) of Torts §392; contract law",
      },
      {
        id: "6.2",
        title: "No liability for data loss or downtime",
        status: "implemented",
        description:
          "Terms include explicit disclaimer of liability for data loss, service interruptions, technical failures, or downtime.",
        citation: "Best practice; UCC §2-719",
      },
      {
        id: "6.3",
        title: "No liability for minors using the app",
        status: "implemented",
        description:
          "Terms state the platform is not liable for minors using the app in violation of the 18+ age requirement. Responsibility is on the user to comply.",
        citation: "COPPA; CO contract law (minors' capacity)",
      },
      {
        id: "6.4",
        title: "Limitation of liability cap",
        status: "review",
        description:
          "Terms limit damages to subscription fees paid. Attorney should confirm this cap is prominently disclosed, uses ALL-CAPS or equivalent conspicuousness, and is enforceable under Colorado law.",
        citation: "CO CRS §4-2-719; Lucier v. Williams (NJ App. 2004)",
      },
      {
        id: "6.5",
        title: "Disclaimer of warranties (AS IS)",
        status: "implemented",
        description:
          "Terms disclaim all warranties, express or implied, including fitness for a particular purpose and merchantability.",
        citation: "UCC §2-316; CO CRS §4-2-316",
      },
      {
        id: "6.6",
        title: "Indemnification clause",
        status: "implemented",
        description:
          "Users agree to indemnify, defend, and hold harmless Pawspect and Data Driven Design Group, LLC from claims arising from their use of the platform.",
        citation: "Contract law; CO indemnity principles",
      },
      {
        id: "6.7",
        title: "Force majeure clause",
        status: "review",
        description:
          "Terms should include a force majeure clause excusing performance due to events beyond reasonable control (infrastructure outages, ICP network issues). Attorney should verify this is present.",
        citation: "UCC §2-615; common law",
      },
    ],
  },
  {
    number: 7,
    title: "Age Verification & Minors",
    description:
      "COPPA compliance and the platform's 18+ requirement must be enforced both technically and legally. Courts and the FTC look for reasonable technical safeguards, not just policy language.",
    items: [
      {
        id: "7.1",
        title: "18+ age requirement at sitter signup",
        status: "implemented",
        description:
          "Sitter application requires date of birth entry. Age is validated at the frontend (must be 18+) and enforced at the backend/canister level.",
        citation: "COPPA 15 U.S.C. §6501",
      },
      {
        id: "7.2",
        title: "Age attestation checkbox required",
        status: "implemented",
        description:
          "Sitters must check a dedicated age attestation checkbox confirming they are 18 or older. Cannot submit application without it.",
        citation: "FTC COPPA Rule 16 C.F.R. §312",
      },
      {
        id: "7.3",
        title: "Terms explicitly prohibit minor registration",
        status: "implemented",
        description:
          "Terms of Service state that users under 18 may not register as sitters. This constitutes reasonable notice.",
        citation: "COPPA; contract capacity (minors)",
      },
      {
        id: "7.4",
        title: "COPPA compliance — no under-13 collection",
        status: "implemented",
        description:
          "Platform does not knowingly collect data from children under 13. Privacy Policy and Terms both address this. No features target minors.",
        citation: "COPPA 15 U.S.C. §6502; 16 C.F.R. §312.3",
      },
      {
        id: "7.5",
        title: "Parental consent outside scope",
        status: "implemented",
        description:
          "Platform is explicitly for adults (18+). Parental consent mechanisms are outside scope by design. Documented in Terms.",
        citation: "COPPA §312.5",
      },
    ],
  },
  {
    number: 8,
    title: "User Consent & Agreement Flows",
    description:
      "Courts require clear, affirmative consent — not just a notice. Each consent must be specific to the type of communication or processing. Consent records are critical evidence in disputes.",
    items: [
      {
        id: "8.1",
        title: "Communications consent — sitter application",
        status: "implemented",
        description:
          "Required checkbox on sitter application: 'I agree to receive communications from the sitter and Pawspect.' Cannot submit application without checking.",
        citation: "TCPA 47 U.S.C. §227; CAN-SPAM Act",
      },
      {
        id: "8.2",
        title: "Communications consent — client booking",
        status: "implemented",
        description:
          "Required checkbox on client booking flow. Cannot submit booking without explicit communications consent.",
        citation: "TCPA 47 U.S.C. §227",
      },
      {
        id: "8.3",
        title: "Accept All Agreements button",
        status: "implemented",
        description:
          "An 'Accept All Agreements' button allows users to check all required consent boxes at once. Clearly labeled with what is being accepted.",
        citation: "EU Cookie Directive; GDPR Art. 7",
      },
      {
        id: "8.4",
        title: "Consent timestamps stored in audit trail",
        status: "implemented",
        description:
          "Each consent acceptance is recorded with a timestamp and stored in the audit trail. Evidence of consent is preserved.",
        citation: "GDPR Art. 7(1); TCPA",
      },
      {
        id: "8.5",
        title: "Photo upload consent with license grant",
        status: "implemented",
        description:
          "Sitters must acknowledge content guidelines before uploading photos. Upload includes a license grant to the platform to display the content.",
        citation: "17 U.S.C. §106 (Copyright Act — license)",
      },
      {
        id: "8.6",
        title: "Non-employment acknowledgment — required at signup",
        status: "implemented",
        description:
          "Sitters must check a dedicated checkbox acknowledging they are independent operators, not employees or contractors of Pawspect.",
        citation: "FLSA; CO workers' compensation; ABC test",
      },
      {
        id: "8.7",
        title: "Platform-only acknowledgment — required at signup",
        status: "implemented",
        description:
          "Sitters must check a dedicated checkbox confirming they understand Pawspect is a software tool only and not a service provider.",
        citation: "FTC Act §5; contract law",
      },
      {
        id: "8.8",
        title: "Cancellation policy acceptance",
        status: "implemented",
        description:
          "Separate required checkbox on booking flows confirming the client has read and accepts the cancellation policy.",
        citation: "Contract law — mutual assent",
      },
    ],
  },
  {
    number: 9,
    title: "Communications & Email Compliance",
    description:
      "CAN-SPAM and TCPA compliance is mandatory for any commercial email or text messaging. Violations can result in statutory damages of $500–$1,500 per message.",
    items: [
      {
        id: "9.1",
        title: "CAN-SPAM compliance — transactional emails",
        status: "implemented",
        description:
          "Booking confirmations, invoices, and GDPR emails are transactional — not subject to CAN-SPAM marketing rules. Branded templates include platform name.",
        citation: "CAN-SPAM Act 15 U.S.C. §7701",
      },
      {
        id: "9.2",
        title: "CAN-SPAM compliance — marketing emails",
        status: "review",
        description:
          "CRM deal/coupon emails are sent by sitters to their own clients. These may require unsubscribe mechanisms and a physical address. Attorney should review whether platform is the sender of record or the sitter.",
        citation: "CAN-SPAM Act §7704; FTC rules",
      },
      {
        id: "9.3",
        title: "TCPA — communications consent before messaging",
        status: "implemented",
        description:
          "Communications consent is collected before any automated or marketing messages are sent to clients or sitters.",
        citation: "TCPA 47 U.S.C. §227; FCC regulations",
      },
      {
        id: "9.4",
        title: "Unsubscribe mechanism",
        status: "review",
        description:
          "All marketing-category emails (CRM deals, promotional) must include a functional unsubscribe link. Attorney should verify current templates include this for any message that could be classified as commercial.",
        citation: "CAN-SPAM Act §7704(a)(3)",
      },
      {
        id: "9.5",
        title: "Email sender identity — pawspect.co domain",
        status: "implemented",
        description:
          "All platform emails use the pawspect.co domain. Invoice and booking emails show the sitter's own email and phone for client contact (not platform email).",
        citation: "CAN-SPAM Act §7704(a)(1)",
      },
      {
        id: "9.6",
        title: "Physical address in commercial emails",
        status: "attorney",
        description:
          "CAN-SPAM requires a physical postal address in all commercial emails. Attorney should verify Data Driven Design Group, LLC's registered address is included in applicable email templates.",
        citation: "CAN-SPAM Act §7704(a)(5)",
      },
    ],
  },
  {
    number: 10,
    title: "Payment & Subscription Law",
    description:
      "Subscription commerce is regulated by the FTC's Negative Option Rule, state automatic renewal laws (notably California), and PCI DSS for card data security.",
    items: [
      {
        id: "10.1",
        title: "Stripe processes all payments — no card data stored",
        status: "implemented",
        description:
          "All payment card data is handled by Stripe. Platform stores only Stripe subscription IDs. PCI DSS compliance is delegated to Stripe (Level 1 certified).",
        citation: "PCI DSS v4.0",
      },
      {
        id: "10.2",
        title: "Subscription terms clearly disclosed",
        status: "implemented",
        description:
          "$15/month after a 30-day free trial. Price and billing cycle disclosed before trial initiation and in the sitter portal.",
        citation: "FTC Negative Option Rule 16 C.F.R. §425; CA BPC §17600",
      },
      {
        id: "10.3",
        title: "Free trial terms disclosed",
        status: "implemented",
        description:
          "30-day free trial with no charge. Trial duration and what happens at expiry is clearly disclosed.",
        citation: "FTC Negative Option Rule; CA BPC §17600",
      },
      {
        id: "10.4",
        title: "Automatic renewal clearly disclosed",
        status: "implemented",
        description:
          "Automatic monthly renewal is disclosed at signup and in the sitter portal. Stripe handles renewal billing.",
        citation:
          "CA BPC §17601 (ARL); FTC Negative Option Rule 16 C.F.R. §425",
      },
      {
        id: "10.5",
        title: "Cancellation process described",
        status: "implemented",
        description:
          "Sitters can cancel via the self-service billing portal without contacting support. Process is described in Terms.",
        citation: "FTC Negative Option Rule; CA BPC §17602",
      },
      {
        id: "10.6",
        title: "Refund policy stated",
        status: "review",
        description:
          "A refund policy for the subscription fee should be explicitly stated in Terms. Attorney should advise whether partial-month refunds are required under any applicable state law.",
        citation: "FTC Negative Option Rule; CO consumer protection law",
      },
      {
        id: "10.7",
        title: "Grandfathered lifetime free members documented",
        status: "review",
        description:
          "Existing sitters at launch received lifetime free access. This is a binding commitment. Attorney should advise on implications for platform discontinuation and whether this creates an obligation to continue operating.",
        citation: "Contract law — promissory estoppel; CO contract principles",
      },
      {
        id: "10.8",
        title: "Stripe webhook signature validation",
        status: "implemented",
        description:
          "Stripe webhook events are verified using Stripe's signature validation before any action is taken. Prevents replay and spoofing attacks.",
        citation: "PCI DSS v4.0; security best practice",
      },
    ],
  },
  {
    number: 11,
    title: "Independent Contractor & Employment Law",
    description:
      "Worker misclassification is one of the highest-risk areas for platform businesses. The IRS, DOL, and state agencies actively audit classification. Pawspect's platform-only model is the primary defense.",
    items: [
      {
        id: "11.1",
        title: "Sitters are independent contractors — stated in Terms",
        status: "implemented",
        description:
          "Terms explicitly state sitters are independent business operators, not employees or contractors of Pawspect.",
        citation: "IRS SS-8; FLSA; CO CRS §8-70-115",
      },
      {
        id: "11.2",
        title: "Platform does not direct or supervise sitters",
        status: "implemented",
        description:
          "Platform provides tools only. Pawspect does not assign jobs, set schedules, or supervise sitter work. Sitters control their own services, rates, and hours.",
        citation:
          "IRS 20-factor test; ABC test; Restatement (Second) of Agency §220",
      },
      {
        id: "11.3",
        title: "No worker benefits provided through platform",
        status: "implemented",
        description:
          "Platform provides no health insurance, workers' compensation, unemployment insurance, or any employee benefits.",
        citation: "ERISA; CO workers' compensation CRS §8-40-202",
      },
      {
        id: "11.4",
        title: "Sitters set their own rates and services",
        status: "implemented",
        description:
          "Sitters control all pricing, service types, and availability. Platform does not set rates.",
        citation: "ABC test prong B; Dynamex",
      },
      {
        id: "11.5",
        title: "IRS 1099 responsibility on sitters",
        status: "implemented",
        description:
          "Terms state sitters are responsible for their own tax obligations. Tax summary tools are provided as a convenience only, not as tax advice.",
        citation: "IRC §6041; IRS Publication 1779",
      },
      {
        id: "11.6",
        title: "Sitter team payout splits are between sitters only",
        status: "implemented",
        description:
          "Team payout splits are agreements between co-sitters. Platform records the split percentages for reference only. Platform is not a party to any payment split.",
        citation: "CO contract law; partnership considerations",
      },
      {
        id: "11.7",
        title: "Misclassification risk documentation",
        status: "attorney",
        description:
          "Attorney should prepare a memorandum documenting how Pawspect satisfies the ABC test, Borello factors (California), and the IRS 20-factor test. This document should be updated annually.",
        citation:
          "Dynamex Operations West v. Superior Court; Borello v. Department of Industrial Relations",
      },
    ],
  },
  {
    number: 12,
    title: "Insurance & Professional Credentials",
    description:
      "Platforms that represent sitters as vetted or verified face heightened negligent misrepresentation risk. Pawspect's model is to explicitly disclaim verification and require sitter self-attestation.",
    items: [
      {
        id: "12.1",
        title: "Insurance attestation required at signup",
        status: "implemented",
        description:
          "Sitters must attest to having or obtaining appropriate insurance as part of the application checklist. Attestation is stored.",
        citation: "Negligent misrepresentation; contract law",
      },
      {
        id: "12.2",
        title: "Insurance not verified by platform — disclosed",
        status: "implemented",
        description:
          "Platform explicitly does not verify, track, or guarantee any sitter's insurance status. This is stated in the credential checklist and Terms.",
        citation: "FTC Act §5; negligent misrepresentation doctrine",
      },
      {
        id: "12.3",
        title: "Credential checklist is informational only",
        status: "implemented",
        description:
          "The 7-item credential checklist (insurance, background check, certifications, etc.) is informational and self-reported by sitters. Platform makes no warranty as to accuracy.",
        citation:
          "Negligent misrepresentation; § 552 Restatement (Second) of Torts",
      },
      {
        id: "12.4",
        title: "Background checks — sitter-provided, not platform-conducted",
        status: "implemented",
        description:
          "Platform does not conduct or guarantee background checks. Sitters may self-report completion. Terms and checklist make this clear.",
        citation: "FCRA 15 U.S.C. §1681; negligent hiring doctrine",
      },
      {
        id: "12.5",
        title: "No professional license verification",
        status: "implemented",
        description:
          "Platform does not verify professional licenses or certifications. Sitters are responsible for their own regulatory compliance.",
        citation: "State professional licensing boards; FTC Act §5",
      },
    ],
  },
  {
    number: 13,
    title: "Intellectual Property",
    description:
      "IP ownership, user content licenses, and DMCA compliance protect the platform from copyright infringement claims and preserve the platform's rights to its own property.",
    items: [
      {
        id: "13.1",
        title: "Platform owns all software, design, and branding",
        status: "implemented",
        description:
          "Terms assert platform ownership of all software, design, trademarks, and codebase.",
        citation: "17 U.S.C. §101 (Copyright Act)",
      },
      {
        id: "13.2",
        title: "Pawspect trademark registration",
        status: "attorney",
        description:
          "Attorney should advise on filing a federal trademark registration for 'Pawspect' with the USPTO. Common law trademark exists from use, but federal registration provides significant advantages including nationwide priority and enhanced damages.",
        citation: "15 U.S.C. §1051 (Lanham Act); USPTO",
      },
      {
        id: "13.3",
        title: "User content license from sitters",
        status: "implemented",
        description:
          "Sitters grant the platform a non-exclusive license to display profile photos, bio, and public page content. License terms are in the Terms of Service and photo upload consent.",
        citation: "17 U.S.C. §106; contract law",
      },
      {
        id: "13.4",
        title: "DMCA takedown process",
        status: "attorney",
        description:
          "Attorney should advise on publishing a DMCA designated agent registration with the US Copyright Office and adding a DMCA takedown procedure to the platform. This is required for safe harbor protection under DMCA §512.",
        citation: "DMCA 17 U.S.C. §512",
      },
      {
        id: "13.5",
        title: "Third-party IP licensing compliance",
        status: "attorney",
        description:
          "Attorney should review all third-party libraries, fonts, icon sets, and assets used in the platform to confirm all licenses are compliant (MIT, Apache, commercial, etc.).",
        citation: "17 U.S.C. §101; open source license terms",
      },
    ],
  },
  {
    number: 14,
    title: "Accessibility (ADA / WCAG)",
    description:
      "Federal courts have extended ADA Title III to websites. DOJ has issued guidance confirming websites are places of public accommodation. Accessibility lawsuits are increasing sharply.",
    items: [
      {
        id: "14.1",
        title: "ADA Title III applicability assessment",
        status: "attorney",
        description:
          "Attorney should advise on whether Pawspect constitutes a place of public accommodation under ADA Title III and the current circuit split on website accessibility.",
        citation:
          "ADA 42 U.S.C. §12181; Robles v. Domino's Pizza (9th Cir. 2019)",
      },
      {
        id: "14.2",
        title: "WCAG 2.1 AA compliance audit",
        status: "attorney",
        description:
          "A formal WCAG 2.1 AA accessibility audit has not been conducted. Attorney should recommend commissioning one from an accessibility specialist and documenting remediation efforts.",
        citation: "WCAG 2.1 W3C Recommendation; DOJ ADA guidance",
      },
      {
        id: "14.3",
        title: "Mobile-first responsive design",
        status: "implemented",
        description:
          "Platform is built mobile-first with responsive design. All screens have been audited for mobile usability.",
        citation: "WCAG 2.1 SC 1.3.4 (Orientation)",
      },
      {
        id: "14.4",
        title: "Color contrast ratios",
        status: "attorney",
        description:
          "Color contrast has not been formally audited against WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text). Accessibility audit should include contrast testing.",
        citation: "WCAG 2.1 SC 1.4.3 (Contrast Minimum)",
      },
      {
        id: "14.5",
        title: "Accessibility statement published",
        status: "attorney",
        description:
          "No formal accessibility statement has been published. Attorney should recommend publishing one with current compliance status, known limitations, and a contact for accessibility issues.",
        citation: "DOJ ADA Title III guidance; Section 508",
      },
      {
        id: "14.6",
        title: "Remediation plan documented",
        status: "attorney",
        description:
          "Attorney should recommend a proactive accessibility remediation plan. Courts look favorably on documented good-faith efforts even where full compliance has not yet been achieved.",
        citation: "ADA 42 U.S.C. §12188; Title III enforcement",
      },
    ],
  },
  {
    number: 15,
    title: "Data Security & Breach Response",
    description:
      "State breach notification laws, CCPA, and GDPR all require prompt notification of affected individuals following a data breach. A documented incident response plan is essential.",
    items: [
      {
        id: "15.1",
        title: "ICP infrastructure security",
        status: "implemented",
        description:
          "Platform runs on Internet Computer Protocol (ICP), a decentralized cryptographically-secured network. No traditional centralized server or database to breach.",
        citation: "NIST Cybersecurity Framework",
      },
      {
        id: "15.2",
        title: "Payment data security — Stripe PCI DSS",
        status: "implemented",
        description:
          "All payment card data is handled exclusively by Stripe (PCI DSS Level 1 certified). No card numbers, CVVs, or banking data are stored on the platform.",
        citation: "PCI DSS v4.0",
      },
      {
        id: "15.3",
        title: "Admin data access controls",
        status: "implemented",
        description:
          "Admins cannot access sitter personal or financial data without an explicit sitter-granted support ticket. All access is time-limited and logged in the audit trail.",
        citation: "GDPR Art. 5(1)(f) (integrity and confidentiality)",
      },
      {
        id: "15.4",
        title: "Breach notification obligations",
        status: "attorney",
        description:
          "Attorney should prepare a breach notification protocol covering: Colorado HB 18-1128 (72-hour notification), CCPA (30-day notification for qualifying breaches), GDPR Art. 33 (72-hour to supervisory authority), and notification to affected individuals.",
        citation:
          "CO HB 18-1128; CCPA §1798.82; GDPR Art. 33-34; SHIELD Act (NY)",
      },
      {
        id: "15.5",
        title: "Incident response plan",
        status: "attorney",
        description:
          "No formal documented incident response plan exists. Attorney should recommend drafting one covering: detection, containment, assessment, notification, and post-incident review.",
        citation: "NIST SP 800-61r2; GDPR Art. 33; CO HB 18-1128",
      },
      {
        id: "15.6",
        title: "Cyber liability insurance",
        status: "attorney",
        description:
          "No cyber liability insurance policy has been obtained. Attorney should strongly recommend coverage given the handling of personal data, financial data (via Stripe), and the nature of the platform.",
        citation: "Risk management best practice",
      },
      {
        id: "15.7",
        title: "Penetration testing",
        status: "attorney",
        description:
          "No formal penetration test has been conducted. Attorney should recommend a periodic security audit, particularly before any major user growth or fundraising activity.",
        citation: "NIST Cybersecurity Framework; SOC 2",
      },
    ],
  },
  {
    number: 16,
    title: "Admin Access & Data Governance",
    description:
      "Clear policies on who can access data, under what conditions, and with what controls are required for GDPR compliance and reduce the risk of insider-threat liability.",
    items: [
      {
        id: "16.1",
        title: "Permanent admins hardcoded at backend",
        status: "implemented",
        description:
          "Marcus Berggren, Linnea Berggren, and Bailey Berggren are permanent admins hardcoded at the canister level. This cannot be changed without a code deployment.",
        citation: "Access control best practice; GDPR Art. 32",
      },
      {
        id: "16.2",
        title: "Admin access grant and revoke process",
        status: "implemented",
        description:
          "Admin access can be granted to any sitter via the admin panel and is logged. Hardcoded admins cannot be demoted. Access can be revoked for non-hardcoded admins.",
        citation: "Principle of least privilege; GDPR Art. 32",
      },
      {
        id: "16.3",
        title: "Sitter data access requires explicit sitter grant",
        status: "implemented",
        description:
          "Admins cannot access sitter personal or financial data without the sitter opening a support ticket and granting explicit access.",
        citation: "GDPR Art. 5(1)(f); principle of least privilege",
      },
      {
        id: "16.4",
        title: "Support access is time-limited",
        status: "implemented",
        description:
          "Admin access granted via support ticket is automatically revoked when the ticket is resolved. Access is logged throughout.",
        citation: "GDPR Art. 32; access control best practice",
      },
      {
        id: "16.5",
        title: "Audit trail is comprehensive and read-only",
        status: "implemented",
        description:
          "All admin actions, GDPR events, and data changes are logged in a read-only audit trail with timestamps and actor identification.",
        citation: "GDPR Art. 5(2) (accountability); SOC 2 Type II",
      },
    ],
  },
  {
    number: 17,
    title: "Third-Party Services & Data Processors",
    description:
      "GDPR requires formal Data Processing Agreements with all third-party processors. Understanding the data flow through each processor is essential for compliance.",
    items: [
      {
        id: "17.1",
        title: "Stripe — Data Processing Agreement",
        status: "review",
        description:
          "Stripe provides a standard DPA that is accepted via their terms of service. Attorney should confirm the Stripe DPA is currently accepted and appropriate for EU data processing.",
        citation: "GDPR Art. 28; Stripe DPA",
      },
      {
        id: "17.2",
        title: "Caffeine.ai / ICP — hosting infrastructure",
        status: "attorney",
        description:
          "Attorney should assess whether a formal DPA with Caffeine.ai is required, or whether ICP's decentralized architecture means Caffeine.ai is not a data processor in the GDPR sense.",
        citation: "GDPR Art. 4(8) (processor definition); Art. 28",
      },
      {
        id: "17.3",
        title: "Email provider — transactional email DPA",
        status: "attorney",
        description:
          "The transactional email provider processes personal data (recipient email addresses, names). Attorney should verify a DPA is in place.",
        citation: "GDPR Art. 28",
      },
      {
        id: "17.4",
        title: "ZIP validation API — no PII transmitted",
        status: "implemented",
        description:
          "zippopotam.us is used for ZIP code validation. Only the ZIP code is sent — no personal data. Free, no account required.",
        citation: "GDPR Art. 4(1) (personal data definition)",
      },
      {
        id: "17.5",
        title: "No advertising networks or tracking pixels",
        status: "implemented",
        description:
          "Platform does not embed any advertising networks, social media tracking pixels, or behavioral analytics tools.",
        citation: "GDPR; ePrivacy Directive; CCPA",
      },
    ],
  },
  {
    number: 18,
    title: "Sitter Teams & Co-Booking Arrangements",
    description:
      "The teams feature creates new legal relationships between sitters. The platform must be clear it is not a party to inter-sitter agreements.",
    items: [
      {
        id: "18.1",
        title: "Team formation requires explicit mutual acceptance",
        status: "implemented",
        description:
          "Team connections require an invite from one sitter and explicit acceptance from the other. No unilateral connections.",
        citation: "Contract law — offer and acceptance",
      },
      {
        id: "18.2",
        title: "Platform is not a party to payout splits",
        status: "implemented",
        description:
          "Payout split percentages are recorded by the platform for reference. The actual payment arrangement is solely between co-sitters. Terms state platform is not responsible for disputes.",
        citation: "Partnership law; CO contract law",
      },
      {
        id: "18.3",
        title: "No guarantee of payment between co-sitters",
        status: "implemented",
        description:
          "Terms state platform takes no responsibility for ensuring co-sitters pay each other according to their split arrangement.",
        citation: "Contract law; platform liability principles",
      },
      {
        id: "18.4",
        title: "Team arrangements may create partnership implications",
        status: "attorney",
        description:
          "Attorney should advise whether team payout split arrangements could be characterized as a partnership under Colorado law, and whether this has tax or liability implications for the sitters.",
        citation: "CO Revised Uniform Partnership Act CRS §7-64-101",
      },
    ],
  },
  {
    number: 19,
    title: "Client Data & Cookie Policy",
    description:
      "Clients interact with the platform without creating an account, creating unique considerations for data minimization and the legal basis for processing their information.",
    items: [
      {
        id: "19.1",
        title: "Client data collection — phone and email",
        status: "implemented",
        description:
          "Clients provide phone and email for booking lookup. Data is used for the booking relationship only. Disclosed in Privacy Policy.",
        citation: "GDPR Art. 6(1)(b) (contract performance)",
      },
      {
        id: "19.2",
        title: "Client data visibility controls",
        status: "implemented",
        description:
          "Client data is visible only to: the client (via lookup), the assigned sitter, and admins. Not visible to other sitters.",
        citation: "GDPR Art. 5(1)(f) (confidentiality)",
      },
      {
        id: "19.3",
        title: "Cookie banner — may be required",
        status: "attorney",
        description:
          "Attorney should advise whether the platform's use of localStorage (for session caching, not tracking) requires a cookie notice or banner under CCPA, GDPR, or ePrivacy Directive. ICP apps may have a unique technical position here.",
        citation: "GDPR; ePrivacy Directive 2002/58/EC; CCPA",
      },
      {
        id: "19.4",
        title: "Client data retention period",
        status: "attorney",
        description:
          "No explicit client data retention period is currently documented. Attorney should advise on the minimum retention period for booking records and when client data can be purged.",
        citation: "GDPR Art. 5(1)(e); state consumer protection laws",
      },
    ],
  },
  {
    number: 20,
    title: "Governing Law, Dispute Resolution & Arbitration",
    description:
      "A well-drafted dispute resolution clause is a critical cost-management tool. Arbitration clauses must be conspicuously disclosed and regularly reviewed against current case law.",
    items: [
      {
        id: "20.1",
        title: "Governing law: Colorado, USA",
        status: "implemented",
        description:
          "Terms specify Colorado law governs all disputes and the relationship between the platform and its users.",
        citation: "CO Revised Statutes; Restatement (Second) Conflicts of Laws",
      },
      {
        id: "20.2",
        title: "Binding arbitration clause",
        status: "review",
        description:
          "Terms include binding arbitration for disputes under $10,000. Attorney should review whether the clause is enforceable under current CO law and recent SCOTUS and 10th Circuit decisions.",
        citation: "FAA 9 U.S.C. §1; CO CRS §13-22-201; Epic Systems (2018)",
      },
      {
        id: "20.3",
        title: "Class action waiver",
        status: "review",
        description:
          "Class action waiver is present in Terms. Attorney should confirm this is clearly disclosed (ALL-CAPS or highlighted) and enforceable in Colorado.",
        citation: "FAA; Epic Systems Corp. v. Lewis (2018)",
      },
      {
        id: "20.4",
        title: "Notice and cure period",
        status: "review",
        description:
          "Attorney should confirm Terms include a notice and cure period (e.g., 30 days) before a party may initiate arbitration or litigation.",
        citation: "Best practice; arbitration clause enforceability",
      },
      {
        id: "20.5",
        title: "Attorney's fees clause",
        status: "attorney",
        description:
          "Attorney should advise on whether to include a fee-shifting clause (prevailing party or platform-favorable) and whether CO law limits enforceability in consumer contexts.",
        citation: "CO CRS §13-17-102; American Rule vs. fee-shifting",
      },
    ],
  },
  {
    number: 21,
    title: "Business Continuity & Platform Discontinuation",
    description:
      "Users with lifetime free memberships and stored data have legitimate expectations about data portability and adequate notice if the platform shuts down. These obligations should be defined in advance.",
    items: [
      {
        id: "21.1",
        title: "Data portability on account closure",
        status: "implemented",
        description:
          "Sitters can export all their data at any time via the 'Download My Data' feature. Data portability is available regardless of subscription status.",
        citation: "GDPR Art. 20 (data portability)",
      },
      {
        id: "21.2",
        title: "Platform discontinuation notice period",
        status: "attorney",
        description:
          "Terms do not currently specify a notice period before platform discontinuation. Attorney should advise on the appropriate notice period (30/60/90 days) and whether the lifetime free member commitment creates additional obligations.",
        citation: "Contract law; promissory estoppel; CO consumer protection",
      },
      {
        id: "21.3",
        title: "Data deletion on platform shutdown",
        status: "attorney",
        description:
          "Terms do not address data deletion upon platform shutdown. Attorney should advise on GDPR and state law obligations to notify users and delete data on wind-down.",
        citation: "GDPR Art. 17; CO HB 18-1128",
      },
      {
        id: "21.4",
        title: "Grandfathered lifetime free members — legal implications",
        status: "attorney",
        description:
          "The lifetime free promise to existing sitters is a binding commitment. Attorney should advise on whether this creates an obligation to continue operating or provide compensation if the service is discontinued.",
        citation: "Contract law; promissory estoppel",
      },
      {
        id: "21.5",
        title: "Uptime SLA — AS IS disclaimer",
        status: "implemented",
        description:
          "Terms disclaim any uptime guarantee. Service is provided on an AS IS basis. No SLA for uptime or performance.",
        citation: "UCC §2-316 (disclaimer of warranties)",
      },
    ],
  },
  {
    number: 22,
    title: "US-Only Sitter Enforcement",
    description:
      "Pawspect exclusively serves US-based pet sitters. This restriction must be enforced technically (ZIP code validation), disclosed in legal documents, and applied consistently to sitter applications, Terms, Privacy Policy, and FAQ.",
    items: [
      {
        id: "22.1",
        title: "ZIP code validation on sitter application — frontend",
        status: "implemented",
        description:
          "Sitter application validates ZIP code format using zippopotam.us, which only resolves valid US ZIP codes. Non-US ZIP codes fail validation and block submission.",
        citation: "FTC Act §5; geographic restriction best practices",
      },
      {
        id: "22.2",
        title: "ZIP code validation on sitter application — backend",
        status: "implemented",
        description:
          "Backend enforces US-only ZIP code format (5 digits) on sitter profile records. Non-US entries are rejected at the canister level.",
        citation: "Platform liability limitation; geographic restriction",
      },
      {
        id: "22.3",
        title: "US-only notice displayed on sitter application form",
        status: "implemented",
        description:
          "Sitter application form displays a clear notice that Pawspect is only available to sitters operating in the United States.",
        citation: "FTC Act §5; consumer disclosure best practice",
      },
      {
        id: "22.4",
        title: "US-only language in Terms of Service",
        status: "implemented",
        description:
          "Terms of Service explicitly state that the platform is available exclusively to US-based sitters. Applications from outside the US are not accepted.",
        citation: "Contract law; geographic restriction enforceability",
      },
      {
        id: "22.5",
        title: "US-only language in Privacy Policy",
        status: "implemented",
        description:
          "Privacy Policy discloses that the platform collects and processes data of US-based individuals only, and identifies Colorado as the governing jurisdiction.",
        citation: "GDPR Art. 3 (territorial scope); CCPA; CO law",
      },
      {
        id: "22.6",
        title: "US-only language in FAQ",
        status: "implemented",
        description:
          "FAQ for sitters and clients clarifies that Pawspect operates exclusively in the United States and only works with US-based sitters.",
        citation: "FTC Act §5; consumer transparency",
      },
      {
        id: "22.7",
        title: "Rejection emails for non-US applicants",
        status: "implemented",
        description:
          "Automated rejection emails for declined sitter applications include messaging that explains the US-only restriction where applicable.",
        citation: "FTC Act §5; contract law",
      },
      {
        id: "22.8",
        title: "Impact on GDPR/EU compliance obligations",
        status: "review",
        description:
          "If US-only restriction is consistently enforced, GDPR obligations may not apply. Attorney should confirm whether any EU-resident data is still being processed (e.g., admins based in EU) and advise on residual obligations.",
        citation: "GDPR Art. 3(1); EU-US Data Privacy Framework",
      },
    ],
  },
  {
    number: 23,
    title: "Indemnification",
    description:
      "Indemnification clauses require users to defend and hold harmless the platform from claims arising from their own conduct. These are a primary shield for the platform against third-party claims.",
    items: [
      {
        id: "23.1",
        title: "Sitter indemnification clause in Terms",
        status: "implemented",
        description:
          "Terms require sitters to indemnify, defend, and hold harmless Data Driven Design Group, LLC and Pawspect from any claims, damages, or costs arising from the sitter's services, conduct, tax obligations, or contractor status.",
        citation: "CO indemnity law; CRS §13-21-111.5; contract law",
      },
      {
        id: "23.2",
        title: "Client indemnification clause in Terms",
        status: "implemented",
        description:
          "Terms require clients to indemnify, defend, and hold harmless Data Driven Design Group, LLC and Pawspect from any claims arising from the client's use of the platform, conduct, or interactions with sitters.",
        citation: "CO indemnity law; contract law",
      },
      {
        id: "23.3",
        title: "Indemnification scope — sitter actions",
        status: "implemented",
        description:
          "Sitter indemnification covers: (a) injury or property damage to clients or third parties; (b) negligent or intentional acts; (c) breach of applicable law; (d) disputes with clients arising from pet care services.",
        citation: "Negligent hiring doctrine; respondeat superior defense",
      },
      {
        id: "23.4",
        title: "Indemnification scope — tax obligations",
        status: "implemented",
        description:
          "Sitter indemnification explicitly covers any tax obligations, assessments, penalties, or worker classification claims arising from the sitter's use of the platform.",
        citation:
          "IRC §6041; IRS Publication 1779; CO worker misclassification",
      },
      {
        id: "23.5",
        title: "Indemnification scope — contractor status disputes",
        status: "implemented",
        description:
          "Sitter indemnification covers any government or third-party claims alleging employee vs. independent contractor misclassification related to the sitter's use of Pawspect.",
        citation: "FLSA; ABC test; Dynamex; CO CRS §8-70-115",
      },
      {
        id: "23.6",
        title: "Indemnification enforceability in Colorado",
        status: "review",
        description:
          "Attorney should confirm the indemnification clauses are enforceable under Colorado law, including whether anti-indemnity statutes (CRS §13-21-111.5) limit the scope in any commercial context.",
        citation: "CO CRS §13-21-111.5; CO anti-indemnity rules",
      },
    ],
  },
  {
    number: 24,
    title: "Dispute Resolution",
    description:
      "A comprehensive dispute resolution clause governs how disputes are handled, limiting costly litigation and class actions. Each sub-clause must be clearly disclosed and enforceable.",
    items: [
      {
        id: "24.1",
        title: "Binding arbitration clause",
        status: "implemented",
        description:
          "Terms include a binding arbitration clause requiring individual arbitration for disputes. Clause specifies AAA or similar arbitration rules, location, and cost allocation.",
        citation:
          "FAA 9 U.S.C. §1; Epic Systems Corp. v. Lewis (2018); CO CRS §13-22-201",
      },
      {
        id: "24.2",
        title: "Class action waiver — standalone clause",
        status: "implemented",
        description:
          "Class action waiver is a distinct, separately headed clause in the Terms — not buried within the arbitration section. Uses ALL-CAPS conspicuous disclosure as required.",
        citation: "FAA; Epic Systems Corp. v. Lewis (2018); NLRA §7",
      },
      {
        id: "24.3",
        title: "Jury trial waiver",
        status: "implemented",
        description:
          "Terms include a waiver of the right to a jury trial for any disputes not subject to arbitration, presented in ALL-CAPS as required for enforceability.",
        citation: "7th Amendment; CO contract law; conspicuousness requirement",
      },
      {
        id: "24.4",
        title: "Opt-out procedure — 30 days, legal@pawspect.co",
        status: "implemented",
        description:
          "Terms provide users a 30-day opt-out window from the arbitration/class action waiver by sending written notice to legal@pawspect.co. Opt-out preserves all other Terms provisions.",
        citation: "CFPB Arbitration Rule; enforceability best practice",
      },
      {
        id: "24.5",
        title: "Colorado governing law — expressly stated",
        status: "implemented",
        description:
          "Terms expressly state Colorado law governs all disputes. Colorado courts have exclusive jurisdiction for any claims not subject to arbitration.",
        citation:
          "CO Revised Statutes; Restatement (Second) Conflicts of Laws §187",
      },
      {
        id: "24.6",
        title: "Notice and cure period before arbitration",
        status: "implemented",
        description:
          "Terms require a 30-day written notice and cure period before any party may initiate arbitration or litigation.",
        citation: "Arbitration enforceability; CO contract law",
      },
      {
        id: "24.7",
        title: "Arbitration clause — current enforceability review",
        status: "review",
        description:
          "Attorney should review the arbitration clause against current 10th Circuit and CO Supreme Court precedent, particularly for consumer-facing clauses. SCOTUS rulings continue to evolve in this area.",
        citation:
          "AT&T Mobility v. Concepcion (2011); Lamps Plus v. Varela (2019); 10th Cir. decisions",
      },
    ],
  },
  {
    number: 25,
    title: "Force Majeure",
    description:
      "A force majeure clause excuses performance when events beyond reasonable control make it impossible or impractical. For a SaaS platform on decentralized infrastructure, this clause has unique scope considerations.",
    items: [
      {
        id: "25.1",
        title: "Force majeure clause present in Terms",
        status: "implemented",
        description:
          "Terms include a force majeure clause excusing performance by Pawspect and Data Driven Design Group, LLC for events beyond reasonable control.",
        citation:
          "UCC §2-615; common law impossibility; Restatement (Second) Contracts §261",
      },
      {
        id: "25.2",
        title: "Scope — acts of God and natural disasters",
        status: "implemented",
        description:
          "Force majeure clause covers acts of God, natural disasters, fires, floods, earthquakes, and extreme weather events.",
        citation: "Common law force majeure; UCC §2-615",
      },
      {
        id: "25.3",
        title: "Scope — pandemic and public health emergencies",
        status: "implemented",
        description:
          "Force majeure clause expressly includes pandemic, epidemic, and government-declared public health emergencies as excusing events.",
        citation:
          "COVID-19 litigation precedent; common law frustration of purpose",
      },
      {
        id: "25.4",
        title: "Scope — Internet Computer (ICP) network outages",
        status: "implemented",
        description:
          "Force majeure clause expressly includes Internet Computer Protocol (ICP) network outages, decentralized infrastructure failures, and blockchain network disruptions as excusing events specific to the platform's architecture.",
        citation:
          "Technology-specific force majeure; ICP infrastructure dependency",
      },
      {
        id: "25.5",
        title: "Scope — government actions, regulations, embargoes",
        status: "implemented",
        description:
          "Force majeure clause covers government actions, laws, regulations, sanctions, embargoes, or orders that prevent performance.",
        citation: "Common law force majeure; government action doctrine",
      },
      {
        id: "25.6",
        title: "Notice requirement for force majeure events",
        status: "review",
        description:
          "Attorney should verify the force majeure clause includes a prompt notice requirement and specifies whether the obligation is suspended or terminated after a prolonged force majeure event.",
        citation: "Force majeure enforceability; contract law",
      },
    ],
  },
  {
    number: 26,
    title: "Standard Boilerplate Legal Clauses",
    description:
      "Boilerplate clauses are foundational contract provisions that ensure the agreement functions as a complete, enforceable contract. Courts regularly examine these clauses.",
    items: [
      {
        id: "26.1",
        title: "Severability clause",
        status: "implemented",
        description:
          "Terms include a severability clause providing that if any provision is found unenforceable, the remaining provisions continue in full force and effect.",
        citation: "Contract law; Restatement (Second) Contracts §184",
      },
      {
        id: "26.2",
        title: "Entire agreement / integration clause",
        status: "implemented",
        description:
          "Terms include an integration clause stating the Terms constitute the entire agreement between the parties and supersede all prior agreements, representations, and understandings.",
        citation: "Parol evidence rule; contract law",
      },
      {
        id: "26.3",
        title: "Amendment clause with 30-day advance notice",
        status: "implemented",
        description:
          "Terms state that Pawspect may amend the Terms at any time with 30-day advance notice to users via email or in-app notification. Continued use after the 30-day period constitutes acceptance.",
        citation:
          "Contract law; Douglas v. United States District Court (9th Cir. 2007)",
      },
      {
        id: "26.4",
        title: "Waiver clause",
        status: "implemented",
        description:
          "Terms include a non-waiver provision stating that failure to enforce any right does not constitute a waiver of that right for future enforcement.",
        citation: "Contract law; CO waiver principles",
      },
      {
        id: "26.5",
        title: "Assignment clause",
        status: "review",
        description:
          "Attorney should confirm whether the Terms include an assignment clause restricting users from assigning rights, while allowing Pawspect to assign in connection with a merger, acquisition, or asset sale.",
        citation: "Contract law; CO assignment rules; UCC §9-406",
      },
      {
        id: "26.6",
        title: "Headings and interpretation clause",
        status: "implemented",
        description:
          "Terms include a standard interpretation clause clarifying that section headings are for convenience only and do not affect the interpretation of the Terms.",
        citation: "Contract construction rules",
      },
    ],
  },
  {
    number: 27,
    title: "Limitation of Liability Cap",
    description:
      "A properly drafted and conspicuously displayed limitation of liability cap is one of the most important protections in any SaaS agreement. Courts scrutinize both the substance and the presentation.",
    items: [
      {
        id: "27.1",
        title: "Liability cap: subscription fees paid in prior 12 months",
        status: "implemented",
        description:
          "Terms cap Pawspect's total liability to the subscription fees actually paid by the user in the 12 months preceding the claim.",
        citation:
          "CO CRS §4-2-719; Lucier v. Williams (NJ App. 2004); UCC §2-719",
      },
      {
        id: "27.2",
        title: "Liability cap: $0 for free tier users",
        status: "implemented",
        description:
          "Terms expressly state that for users on the free trial or lifetime free tier ($0 paid), the liability cap is $0. Clearly disclosed to all free-tier users.",
        citation: "UCC §2-719; contract law; CO consumer protection",
      },
      {
        id: "27.3",
        title: "Liability cap — ALL-CAPS conspicuous disclosure",
        status: "implemented",
        description:
          "The limitation of liability cap is presented in ALL-CAPS or equivalent conspicuous formatting in the Terms, as required for enforceability under the UCC and majority of US courts.",
        citation: "UCC §1-201(10) (conspicuous definition); CO CRS §4-1-201",
      },
      {
        id: "27.4",
        title: "Exclusion of consequential and indirect damages",
        status: "implemented",
        description:
          "Terms expressly exclude liability for indirect, incidental, special, consequential, exemplary, and punitive damages, including lost profits, data loss, and business interruption.",
        citation: "UCC §2-719(3); Hadley v. Baxendale rule; CO contract law",
      },
      {
        id: "27.5",
        title: "Liability cap enforceability in Colorado",
        status: "review",
        description:
          "Attorney should confirm the cap and exclusion clauses are enforceable under current Colorado law, particularly in consumer-facing agreements. CO courts have occasionally limited liability caps deemed unconscionable.",
        citation:
          "CO CRS §4-2-719; unconscionability doctrine; CO consumer protection",
      },
    ],
  },
  {
    number: 28,
    title: "Warranty Disclaimer",
    description:
      "A comprehensive warranty disclaimer protects the platform from implied warranty claims, which can arise automatically under the UCC and common law. The disclaimer must be conspicuous under UCC §2-316.",
    items: [
      {
        id: "28.1",
        title: "Disclaimer of implied warranty of merchantability",
        status: "implemented",
        description:
          "Terms expressly disclaim the implied warranty of merchantability in conspicuous ALL-CAPS language as required by UCC §2-316(2).",
        citation: "UCC §2-314; UCC §2-316(2); CO CRS §4-2-314",
      },
      {
        id: "28.2",
        title:
          "Disclaimer of implied warranty of fitness for a particular purpose",
        status: "implemented",
        description:
          "Terms expressly disclaim the implied warranty of fitness for a particular purpose in conspicuous ALL-CAPS language.",
        citation: "UCC §2-315; UCC §2-316(2); CO CRS §4-2-315",
      },
      {
        id: "28.3",
        title: "Disclaimer of implied warranty of non-infringement",
        status: "implemented",
        description:
          "Terms disclaim any implied warranty that the platform does not infringe third-party intellectual property rights.",
        citation: "17 U.S.C. §501 (Copyright); 15 U.S.C. §1051 (Lanham Act)",
      },
      {
        id: "28.4",
        title: "Disclaimer of implied warranty of title",
        status: "implemented",
        description:
          "Terms disclaim any implied warranty of title with respect to third-party content submitted by sitters.",
        citation: "UCC §2-312; contract law",
      },
      {
        id: "28.5",
        title: "AS IS disclaimer in ALL-CAPS — conspicuous",
        status: "implemented",
        description:
          "The entire warranty disclaimer section uses 'AS IS' and 'AS AVAILABLE' language in ALL-CAPS block text as required for enforceability under UCC §2-316 and majority of US jurisdictions.",
        citation: "UCC §2-316; CO CRS §4-2-316; conspicuousness standard",
      },
      {
        id: "28.6",
        title: "Disclaimer of accuracy of sitter information",
        status: "implemented",
        description:
          "Terms explicitly disclaim any warranty regarding the accuracy, completeness, or reliability of sitter-provided information, credentials, or reviews on the platform.",
        citation:
          "Negligent misrepresentation doctrine; Restatement (Second) Torts §552",
      },
    ],
  },
  {
    number: 29,
    title: "Team & Payout Split Arrangements",
    description:
      "The sitter teams feature creates new inter-sitter contractual relationships. The platform must clearly disclaim any role in these arrangements to avoid liability as an agent, broker, or joint venture partner.",
    items: [
      {
        id: "29.1",
        title: "Independent contractor language — team arrangements",
        status: "implemented",
        description:
          "Terms state that team arrangements do not create any employment, agency, or partnership relationship between Pawspect and co-sitters, or between co-sitters and any client.",
        citation: "CO CRS §8-70-115; FLSA; ABC test; Dynamex",
      },
      {
        id: "29.2",
        title: "No employment arrangement created by team feature",
        status: "implemented",
        description:
          "Terms expressly state that team formation through the app does not create any employer-employee or staffing agency relationship. Each sitter remains an independent operator.",
        citation: "FLSA; IRS 20-factor test; CO workers' compensation",
      },
      {
        id: "29.3",
        title: "Each sitter responsible for own taxes — team bookings",
        status: "implemented",
        description:
          "Terms confirm that each sitter in a team is independently responsible for their own tax obligations, including income tax, self-employment tax, and any required 1099 reporting. Payout split tools are for reference only and do not constitute tax advice.",
        citation: "IRC §6041; IRS Publication 1779; CO DOR guidance",
      },
      {
        id: "29.4",
        title: "Payout split UI notice — displayed in-app",
        status: "implemented",
        description:
          "The payout split configuration UI in the sitter portal displays a clear notice that split arrangements are between co-sitters only, Pawspect is not a party to the arrangement, and all tax obligations remain with each individual sitter.",
        citation: "FTC Act §5; consumer transparency; IRS tax guidance",
      },
      {
        id: "29.5",
        title: "Partnership characterization risk",
        status: "attorney",
        description:
          "Attorney should advise whether payout split arrangements between co-sitters using the platform could be characterized as a general or limited partnership under Colorado RUPA, and whether the Terms adequately disclaim this characterization.",
        citation:
          "CO RUPA CRS §7-64-101; partnership by estoppel; CO contract law",
      },
      {
        id: "29.6",
        title: "Ad hoc job payout splits — same protections apply",
        status: "implemented",
        description:
          "All team and tax disclaimers apply equally to ad hoc job payout splits. Off-app client data is not transmitted to co-sitters; only the earnings split is shared.",
        citation: "CO contract law; GDPR Art. 5(1)(c) data minimization",
      },
    ],
  },
  {
    number: 30,
    title: "Ad Hoc Jobs — Off-App Client Accounting",
    description:
      "The ad hoc jobs feature allows sitters to record non-app bookings for accounting purposes. Legal protection requires clear disclaimers that these are internal accounting records only, and that no platform relationship exists with the off-app client.",
    items: [
      {
        id: "30.1",
        title: "Off-app client disclaimer — in Terms",
        status: "implemented",
        description:
          "Terms state that ad hoc jobs are internal accounting records for the sitter's own use. Off-app clients have no relationship with Pawspect and are not contacted, enrolled, or represented by the platform.",
        citation: "FTC Act §5; platform liability limitation",
      },
      {
        id: "30.2",
        title: "No Pawspect relationship with off-app clients",
        status: "implemented",
        description:
          "Terms and the ad hoc job creation UI both clearly state that Pawspect has no relationship with off-app clients. No Pawspect terms, privacy policy, or legal protections apply to these individuals.",
        citation: "Contract privity; platform liability limitation",
      },
      {
        id: "30.3",
        title: "Accounting-only purpose — no app communication",
        status: "implemented",
        description:
          "The ad hoc job record stores client name and optional contact number for the sitter's reference only. The app never contacts, notifies, or emails off-app clients in any way.",
        citation:
          "TCPA 47 U.S.C. §227; CAN-SPAM; GDPR Art. 6(1) (lawful basis)",
      },
      {
        id: "30.4",
        title: "Required acknowledgment checkbox for ad hoc jobs",
        status: "implemented",
        description:
          "When creating an ad hoc job, sitters must check a required checkbox acknowledging that the off-app client contact information is for their personal accounting purposes only, and that Pawspect will never contact the client.",
        citation: "FTC Act §5; TCPA; platform liability limitation",
      },
      {
        id: "30.5",
        title: "Off-app client data retention and deletion",
        status: "review",
        description:
          "Attorney should advise whether the storage of off-app client names and contact numbers requires any specific disclosure or retention limits, and whether sitter-requested deletion of their account must also purge off-app client records.",
        citation: "GDPR Art. 5(1)(e); CCPA §1798.105; CO privacy law",
      },
    ],
  },
  {
    number: 31,
    title: "Company Identity & Public-Facing Legal Consistency",
    description:
      "Consistent use of the correct legal entity name, operating name, and domain across all public-facing documents, emails, and UI is required for legal enforceability and regulatory compliance.",
    items: [
      {
        id: "31.1",
        title: "Legal entity name: Data Driven Design Group, LLC",
        status: "implemented",
        description:
          "All Terms of Service, Privacy Policy, and legal agreements identify 'Data Driven Design Group, LLC' as the legal entity. Operating name 'Pawspect' is defined as a trade name.",
        citation: "CO LLC Act CRS §7-80-101; Lanham Act (trade name)",
      },
      {
        id: "31.2",
        title: "No personal names in public-facing legal documents",
        status: "implemented",
        description:
          "Terms of Service, Privacy Policy, FAQ, and all public-facing legal content reference 'Data Driven Design Group, LLC' and 'Pawspect' only. No personal names appear in public-facing legal content.",
        citation: "LLC personal liability protection; best practice",
      },
      {
        id: "31.3",
        title: "Email footers use legal entity name",
        status: "implemented",
        description:
          "All platform email templates include 'Data Driven Design Group, LLC' in the email footer alongside the Pawspect brand name and pawspect.co domain.",
        citation: "CAN-SPAM Act §7704(a)(5); FTC disclosure requirements",
      },
      {
        id: "31.4",
        title: "Domain: pawspect.co — consistent across all docs",
        status: "implemented",
        description:
          "All legal documents, email templates, and public-facing content consistently reference 'pawspect.co' as the platform domain. No references to the old 'pawspective.app' domain remain in legal content.",
        citation: "Contract enforceability; brand consistency",
      },
      {
        id: "31.5",
        title: "Jurisdiction: Colorado, USA — stated in all docs",
        status: "implemented",
        description:
          "Terms, Privacy Policy, and all legal documents identify Colorado, USA as the governing jurisdiction for the platform and Data Driven Design Group, LLC.",
        citation: "CO Revised Statutes; Restatement (Second) Conflicts §187",
      },
      {
        id: "31.6",
        title: "Contact email for legal inquiries: legal@pawspect.co",
        status: "review",
        description:
          "Attorney should confirm a legal@pawspect.co inbox is monitored and that all legal notices, dispute opt-out requests, GDPR requests, and DMCA notices are routed to this address.",
        citation: "GDPR Art. 13(1)(a); DMCA §512; CAN-SPAM; TCPA opt-out",
      },
      {
        id: "31.7",
        title: "Registered agent and business address on file",
        status: "review",
        description:
          "Attorney should verify Data Driven Design Group, LLC's registered agent and business address are current with the Colorado Secretary of State, and that the address appears in commercial emails as required by CAN-SPAM.",
        citation: "CO CRS §7-80-301; CAN-SPAM Act §7704(a)(5)",
      },
    ],
  },
];

function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === "implemented") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full print:border print:border-green-700 print:text-green-800 bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={10} />
        Implemented
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full print:border print:border-amber-700 print:text-amber-800 bg-amber-100 text-amber-700">
        <AlertTriangle size={10} />
        Review Needed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full print:border print:border-red-700 print:text-red-800 bg-red-100 text-red-700">
      <XCircle size={10} />
      Attorney Action Required
    </span>
  );
}

function CheckboxIcon({ status }: { status: ItemStatus }) {
  if (status === "implemented") {
    return (
      <span className="text-emerald-600 text-lg leading-none select-none">
        ☑
      </span>
    );
  }
  return (
    <span className="text-muted-foreground text-lg leading-none select-none">
      ☐
    </span>
  );
}

const AUDIT_DATE = "May 4, 2026";

export default function LegalReviewChecklist() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const allItems = CHECKLIST_SECTIONS.flatMap((s) => s.items);
  const implementedCount = allItems.filter(
    (i) => i.status === "implemented",
  ).length;
  const reviewCount = allItems.filter((i) => i.status === "review").length;
  const attorneyCount = allItems.filter((i) => i.status === "attorney").length;
  const totalCount = allItems.length;

  const attorneyItems = CHECKLIST_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => item.status === "attorney")
      .map((item) => ({
        ...item,
        sectionNumber: section.number,
        sectionTitle: section.title,
      })),
  );

  const sectionColors = [
    "from-blue-600 to-blue-700",
    "from-indigo-600 to-indigo-700",
    "from-violet-600 to-violet-700",
    "from-purple-600 to-purple-700",
    "from-fuchsia-600 to-fuchsia-700",
    "from-rose-600 to-rose-700",
    "from-orange-600 to-orange-700",
    "from-amber-600 to-amber-700",
    "from-yellow-600 to-yellow-700",
    "from-lime-600 to-lime-700",
    "from-emerald-600 to-emerald-700",
    "from-teal-600 to-teal-700",
    "from-cyan-600 to-cyan-700",
    "from-sky-600 to-sky-700",
    "from-blue-700 to-indigo-700",
    "from-indigo-700 to-violet-700",
    "from-violet-700 to-purple-700",
    "from-purple-700 to-fuchsia-700",
    "from-rose-700 to-orange-700",
    "from-amber-700 to-yellow-700",
    "from-teal-700 to-emerald-700",
    "from-sky-700 to-blue-700",
    "from-emerald-700 to-teal-700",
    "from-fuchsia-700 to-rose-700",
    "from-orange-700 to-amber-700",
    "from-cyan-700 to-teal-700",
    "from-blue-800 to-indigo-800",
    "from-indigo-800 to-violet-800",
    "from-rose-800 to-red-700",
    "from-emerald-800 to-teal-800",
    "from-purple-800 to-fuchsia-800",
  ];

  return (
    <>
      {/* Print-only styles injected globally */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #legal-review-checklist, #legal-review-checklist * { visibility: visible; }
          #legal-review-checklist { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          @page { margin: 1.5cm 2cm; }
        }
      `}</style>

      <div
        id="legal-review-checklist"
        className="max-w-4xl mx-auto px-2 sm:px-4 pb-16"
      >
        {/* ── COVER PAGE HEADER ──────────────────────────────────── */}
        <div className="mb-8">
          {/* Hero gradient bar */}
          <div
            className="rounded-2xl p-6 sm:p-8 mb-4 print:rounded-none print:border-b-2 print:border-foreground"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.18 0.07 255), oklch(0.28 0.09 272))",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <Scale size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">
                      CONFIDENTIAL · ATTORNEY-CLIENT PRIVILEGED
                    </p>
                    <h1 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                      PAWSPECT
                    </h1>
                    <p className="text-white/70 text-sm font-medium">
                      Legal Compliance Review Checklist
                    </p>
                  </div>
                </div>
                {/* Legal entity + audit date metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold mb-1">
                      Legal Entity
                    </p>
                    <p className="text-white text-xs font-semibold">
                      Data Driven Design Group, LLC
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold mb-1">
                      Operating As
                    </p>
                    <p className="text-white text-xs font-semibold">
                      Pawspect · pawspect.co
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold mb-1">
                      Jurisdiction
                    </p>
                    <p className="text-white text-xs font-semibold">
                      Colorado, USA
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold mb-1">
                      Audit Date
                    </p>
                    <p className="text-white text-xs font-bold">{AUDIT_DATE}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="text-white/60 text-xs font-medium flex items-center gap-1.5">
                  <FileText size={12} />
                  Generated: {today}
                </div>
                <Button
                  data-ocid="admin.legal-review.print_button"
                  onClick={() => window.print()}
                  size="sm"
                  className="no-print bg-white/15 hover:bg-white/25 text-white border-white/20 border gap-2 rounded-full mt-2"
                  variant="outline"
                >
                  <Printer size={14} />
                  Print / Export PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Cover summary description */}
          <div
            className="rounded-xl p-5 mb-4 border print:rounded-none"
            style={{
              background: "oklch(0.97 0.012 240)",
              borderColor: "oklch(0.70 0.10 240 / 0.3)",
            }}
          >
            <h2 className="font-display font-bold text-base text-foreground mb-2 flex items-center gap-2">
              <span>📄</span> About This Document
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              This document is a comprehensive legal compliance checklist for
              the <strong>Pawspect</strong> software platform, prepared for
              attorney review by <strong>Data Driven Design Group, LLC</strong>.
              It covers all{" "}
              <strong>{CHECKLIST_SECTIONS.length} legal audit areas</strong>{" "}
              relevant to SaaS platforms operating in the United States —
              including platform identity, terms of service, privacy, GDPR,
              CCPA, age verification, consent flows, payments, employment law,
              insurance, intellectual property, accessibility, data security,
              dispute resolution, force majeure, warranty disclaimers,
              limitation of liability, indemnification, US-only enforcement,
              team & payout splits, ad hoc jobs, and company identity.
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              Each item is marked with its current implementation status and
              includes the relevant code location and legal citation for
              attorney verification. Items marked{" "}
              <strong className="text-amber-700">Review Needed</strong> or{" "}
              <strong className="text-red-700">Attorney Action Required</strong>{" "}
              require evaluation by a licensed attorney.
            </p>
            <p className="text-xs text-foreground/60 border-t border-border/40 pt-3 italic">
              This document does not constitute legal advice, does not establish
              an attorney-client relationship, and should not be relied upon as
              a substitute for qualified legal counsel.
            </p>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="rounded-xl p-4 border border-border bg-card text-center print-avoid-break">
              <p className="text-2xl font-bold font-display text-foreground">
                {totalCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Items
              </p>
            </div>
            <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50 text-center print-avoid-break">
              <p className="text-2xl font-bold font-display text-emerald-700">
                {implementedCount}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Implemented</p>
            </div>
            <div className="rounded-xl p-4 border border-amber-200 bg-amber-50 text-center print-avoid-break">
              <p className="text-2xl font-bold font-display text-amber-700">
                {reviewCount}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Review Needed</p>
            </div>
            <div className="rounded-xl p-4 border border-red-200 bg-red-50 text-center print-avoid-break">
              <p className="text-2xl font-bold font-display text-red-700">
                {attorneyCount}
              </p>
              <p className="text-xs text-red-600 mt-0.5">Attorney Action</p>
            </div>
          </div>
        </div>

        {/* ── STATUS LEGEND ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <strong className="text-emerald-700">Implemented</strong> — Feature
            or clause is built and active in the platform
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle size={16} className="text-amber-600" />
            <strong className="text-amber-700">Review Needed</strong> —
            Partially implemented or requires attorney verification
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle size={16} className="text-red-600" />
            <strong className="text-red-700">Attorney Action Required</strong> —
            Not yet addressed; attorney should advise or draft
          </div>
        </div>

        {/* ── CHECKLIST SECTIONS ────────────────────────────────────────── */}
        {CHECKLIST_SECTIONS.map((section, sectionIdx) => (
          <div
            key={section.number}
            data-ocid={`admin.legal-review.section.${section.number}`}
            className={`mb-10 ${sectionIdx > 0 ? "print-break" : ""}`}
          >
            {/* Section header */}
            <div
              className={`rounded-xl p-4 mb-4 bg-gradient-to-r ${sectionColors[sectionIdx % sectionColors.length]} print:bg-none print:border-b-2 print:border-foreground print:rounded-none`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {section.number}
                </span>
                <div>
                  <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight">
                    Section {section.number}: {section.title}
                  </h2>
                  <p className="text-white/75 text-xs mt-0.5">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Section items */}
            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  data-ocid={`admin.legal-review.item.${item.id}`}
                  className={`rounded-xl border p-4 print-avoid-break print:rounded-none print:border-b print:border-gray-300 print:mb-2 ${
                    item.status === "implemented"
                      ? "bg-card border-border"
                      : item.status === "review"
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-red-50/50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckboxIcon status={item.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-1.5">
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {item.id}
                        </span>
                        <span className="font-semibold text-foreground text-sm leading-snug flex-1">
                          {item.title}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {item.description}
                      </p>

                      {item.citation && (
                        <p className="text-xs text-primary/70 font-mono mb-2">
                          📋 {item.citation}
                        </p>
                      )}

                      {/* Attorney Notes lines */}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Attorney Notes:
                        </p>
                        <div className="space-y-1.5 print:space-y-0">
                          {[1, 2, 3].map((line) => (
                            <div
                              key={line}
                              className="h-px bg-border/60 print:h-4 print:border-b print:border-gray-400"
                              style={{
                                borderBottom: "1px dotted oklch(0.7 0.01 255)",
                                paddingBottom: "0.875rem",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ── ATTORNEY CERTIFICATION AREA ───────────────────────── */}
        <div
          className="print-break rounded-2xl border-2 mb-10 p-6 sm:p-8 print:rounded-none"
          style={{
            borderColor: "oklch(0.50 0.15 255 / 0.5)",
            background: "oklch(0.97 0.012 255 / 0.6)",
          }}
          data-ocid="admin.legal-review.certification.section"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.92 0.04 255)" }}
            >
              <Scale size={20} style={{ color: "oklch(0.35 0.15 255)" }} />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Attorney Certification Area
              </h2>
              <p className="text-sm text-muted-foreground">
                To be completed by reviewing attorney — print and sign below
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            {/* Attorney column */}
            <div className="space-y-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Reviewing Attorney
              </p>
              {[
                "Attorney Name",
                "Law Firm",
                "Bar Number & State",
                "Date Reviewed",
              ].map((label) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {label}
                  </p>
                  <div className="border-b-2 border-foreground/25 h-9 w-full" />
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Attorney Signature
                </p>
                <div className="border-b-2 border-foreground/25 h-16 w-full" />
              </div>
            </div>
            {/* Platform operator column */}
            <div className="space-y-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Platform Operator
              </p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Legal Entity
                </p>
                <div
                  className="border-b-2 h-9 w-full flex items-end pb-1"
                  style={{ borderColor: "oklch(0.4 0.01 255 / 0.35)" }}
                >
                  <span className="text-sm text-muted-foreground/60">
                    Data Driven Design Group, LLC
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Platform / Domain
                </p>
                <div
                  className="border-b-2 h-9 w-full flex items-end pb-1"
                  style={{ borderColor: "oklch(0.4 0.01 255 / 0.35)" }}
                >
                  <span className="text-sm text-muted-foreground/60">
                    Pawspect · pawspect.co
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Audit Date
                </p>
                <div
                  className="border-b-2 h-9 w-full flex items-end pb-1"
                  style={{ borderColor: "oklch(0.4 0.01 255 / 0.35)" }}
                >
                  <span className="text-sm text-muted-foreground/60">
                    {AUDIT_DATE}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Date Signed
                </p>
                <div className="border-b-2 border-foreground/25 h-9 w-full" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Operator Signature
                </p>
                <div className="border-b-2 border-foreground/25 h-16 w-full" />
              </div>
            </div>
          </div>

          {/* Notes area */}
          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Attorney Notes &amp; Recommendations
            </p>
            <div>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="border-b border-foreground/20 h-8" />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 italic">
            Attorney-client privilege may apply to communications made in
            connection with this review. Handle accordingly.
          </p>
        </div>

        {/* ── ATTORNEY ACTION SUMMARY ───────────────────────────────────── */}
        <div
          className="print-break rounded-2xl border-2 border-red-300 bg-red-50/50 p-6 sm:p-8 mt-10 print:rounded-none print:border-b-4 print:border-red-700"
          data-ocid="admin.legal-review.attorney-summary.section"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <Scale size={20} className="text-red-700" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-red-800">
                Summary: Items Requiring Attorney Action
              </h2>
              <p className="text-sm text-red-600">
                {attorneyCount} items across {CHECKLIST_SECTIONS.length}{" "}
                sections require attorney advice, drafting, or verification.
                Audit date: <strong>{AUDIT_DATE}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {attorneyItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white border border-red-200 print:rounded-none print:border-0 print:border-b print:border-gray-300 print-avoid-break"
              >
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-mono text-red-500">
                      §{item.id}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {item.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 border-red-300 text-red-600 shrink-0"
                    >
                      Section {item.sectionNumber}: {item.sectionTitle}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  {item.citation && (
                    <p className="text-[10px] text-red-500/70 font-mono mt-0.5">
                      {item.citation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Signature lines for attorney */}
          <div className="mt-8 pt-6 border-t border-red-200 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Reviewed By (Attorney)
              </p>
              <div className="border-b border-foreground/40 pb-1 mb-1 h-10" />
              <p className="text-xs text-muted-foreground">Name / Signature</p>
              <div className="border-b border-foreground/40 pb-1 mb-1 h-8 mt-4" />
              <p className="text-xs text-muted-foreground">Bar Number / Firm</p>
              <div className="border-b border-foreground/40 pb-1 mb-1 h-8 mt-4" />
              <p className="text-xs text-muted-foreground">Date</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Platform Operator
              </p>
              <div className="border-b border-foreground/40 pb-1 mb-1 h-10" />
              <p className="text-xs text-muted-foreground">
                Marcus Berggren — Data Driven Design Group, LLC
              </p>
              <div className="border-b border-foreground/40 pb-1 mb-1 h-8 mt-4" />
              <p className="text-xs text-muted-foreground">Date</p>
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="font-semibold">pawspect.co</p>
                <p>Data Driven Design Group, LLC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground no-print">
          <p>
            Legal Compliance Checklist · Audit Date: {AUDIT_DATE} · Admin Portal
            · Pawspect
          </p>
          <p className="mt-1">
            Data Driven Design Group, LLC · pawspect.co · Colorado, USA · For
            attorney review only
          </p>
        </div>
        <div className="hidden print:block mt-4 pt-2 border-t text-center text-xs text-gray-500">
          <p>
            CONFIDENTIAL — Attorney Review Document · Data Driven Design Group,
            LLC · Pawspect · pawspect.co · Audit Date: {AUDIT_DATE}
          </p>
          <p className="mt-0.5">
            Generated from the Pawspect admin portal. Intended solely for
            attorney review. Colorado, USA.
          </p>
        </div>
      </div>
    </>
  );
}
