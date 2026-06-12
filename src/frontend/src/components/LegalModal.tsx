import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "../config/business";

interface LegalModalProps {
  open: boolean;
  type: "terms" | "privacy";
  onAgree: () => void;
  onClose: () => void;
}

const TERMS_CONTENT = `
**US-Only Platform Notice**

${APP_NAME} is a US-only platform. By proceeding, you confirm you are located in the United States and will use the platform only in compliance with applicable US federal, state, and local laws.

**CRITICAL: ${APP_NAME} Is a Technology Platform Only**

${APP_NAME} is a SOFTWARE PLATFORM operated by Data Driven Design Group, LLC. It is NOT a pet-sitting service, agency, employer, staffing company, or gig marketplace. We do not provide, supervise, direct, schedule, assign, or guarantee any pet care services of any kind. All pet care services are performed solely by independent Sitters. All contracts, agreements, and liability for services are exclusively between the Sitter and the Client. ${APP_NAME} and Data Driven Design Group, LLC are NOT a party to any agreement between Sitters and Clients.

By using this platform, you explicitly acknowledge and agree to this distinction.

**Age Requirement — 18+ Only**

You must be at least 18 years of age to use this platform. By creating an account, you represent and warrant that you are 18 or older. If a minor uses the platform in violation of this requirement — whether through misrepresentation or unauthorized account access — the minor and/or their parent/guardian assume FULL liability for all outcomes. ${APP_NAME} and Data Driven Design Group, LLC bear absolutely NO responsibility for any minor's use of the platform under any circumstances.

**Sitters Must Carry Insurance**

All sitters must carry adequate pet care liability insurance. ${APP_NAME} does NOT provide, verify, or guarantee any insurance. Sitters are solely responsible for ensuring their coverage adequately covers all services they perform.

**Zero Liability Disclaimer**

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ${APP_NAME} AND DATA DRIVEN DESIGN GROUP, LLC EXPRESSLY DISCLAIM ALL LIABILITY FOR: (a) pet care service outcomes including injury, illness, death, or property damage; (b) data loss, corruption, or unavailability for any reason whatsoever — we strongly recommend exporting your data regularly; (c) platform downtime, outages, or interruptions; (d) third-party payment issues; (e) sitter or client conduct; (f) minors using the platform against the age agreement; (g) any indirect, consequential, punitive, or special damages. Maximum liability is capped at subscription fees paid in the 30 days preceding a claim, or $0 if no fees were paid.

**No Vetting, No Guarantees**

${APP_NAME} does NOT conduct background checks. We do NOT verify credentials, licenses, or references. We make NO representations about any Sitter's qualifications, character, or fitness. Clients are solely responsible for their own due diligence before engaging any Sitter.

**The Contract Is Between Sitter and Client**

${APP_NAME} is NOT a party to any service agreement between a Sitter and a Client. ${APP_NAME} has no role in and no responsibility for the negotiation, performance, or outcome of any service contract.

**Sitter Responsibilities**

• You are an independent contractor — NOT an employee or agent of ${APP_NAME}.
• You are fully responsible for your own business operations, taxes, licensing, insurance, and legal compliance.
• You must carry your own liability insurance. ${APP_NAME} provides none.
• You assume ALL liability to Clients and third parties for your services.
• Platform is for pet sitting services only — misuse results in immediate account termination.

**Data Loss Notice**

${APP_NAME} and Data Driven Design Group, LLC bear NO liability for data loss of any kind. We strongly recommend exporting your data regularly using the Download My Data feature in Account & Privacy.

**Governing Law**

These Terms are governed by the laws of the State of Colorado, USA. Disputes shall be resolved in Boulder County, Colorado courts. Users agree to binding arbitration for claims under $10,000.

**Changes to These Terms**

We may update these Terms at any time. Continued use of the platform constitutes acceptance of the revised Terms.

**Contact**

Data Driven Design Group, LLC, Boulder, Colorado. Questions: contact us through the platform's support channels.
`;

const PRIVACY_CONTENT = `
**US-Only Platform**

${APP_NAME} is operated exclusively in and for the United States. By using this platform, you confirm you are located in the United States. Services, compliance obligations, and data rights described herein apply under US law.

**Who We Are**

${APP_NAME} is operated by Data Driven Design Group, LLC, Boulder, Colorado. We are a software platform company — not a pet-sitting service. We facilitate connections between independent sitters and clients and provide business tools for sitters.

**Data We Collect**

• Clients: Name, email address, phone number, pet names, service notes, and booking details.
• Sitters: Name, location, bio, photo, services, rates, availability, date of birth (age verification), and application details.
• All users: Internet Identity cryptographic principal (no passwords stored).
• Usage data: Pages visited and features used (anonymized).
• Payment data is handled entirely by Stripe — we never store card numbers.

**How We Use Data**

We use your information only to operate the Platform: to facilitate bookings, send transactional emails, process subscriptions via Stripe, allow sitters to manage their businesses, and improve the Platform. We do NOT sell, rent, or trade personal data to any third parties for marketing or commercial purposes.

**Data Storage & Security**

Data is stored on the Internet Computer Protocol (ICP) blockchain infrastructure with cryptographic security. We implement reasonable security measures. IMPORTANT: ${APP_NAME} and Data Driven Design Group, LLC cannot guarantee that data will never be lost, corrupted, or made unavailable. We strongly recommend users export their data regularly using the Download My Data feature. We bear no liability for data loss of any kind.

**Admin Access to Sitter Data**

Admins CANNOT access individual sitter personal or financial data by default. Access is only possible if the sitter opens a support ticket explicitly granting temporary, scoped access. All admin access is audited and auto-revoked when the ticket is resolved.

**Your GDPR Rights**

• Right of Access: Request all data we hold about you.
• Right to Portability: Download your data via Download My Data in Account & Privacy.
• Right to Erasure: Request account anonymization (removes all PII, irreversible).
• Right to Rectification: Update your profile at any time.
• To exercise rights: use Account & Privacy tab or email the support address.
• Response time: within 30 days.

**Children's Privacy**

This platform is strictly for users 18+. We do not knowingly collect data from minors. ${APP_NAME} and Data Driven Design Group, LLC are NOT liable for any minor who uses the platform in violation of the age requirement.

**Data Retention — Clients**

Client data (name, email, phone, pet info, booking details) is retained while the associated booking records are active or within 2 years of the last booking, after which it is anonymized or deleted on request.

**Data Retention — Sitters**

Active accounts: retained while subscription is active. Frozen accounts: 90 days, then anonymizable on request. Anonymized: PII replaced with placeholders; booking records retained for legal integrity. You may request deletion at any time through the support channel.

**Changes to This Policy**

We may update this policy at any time. Continued use constitutes acceptance of the revised policy.

**Contact**

Data Driven Design Group, LLC, Boulder, Colorado. Questions: contact us through the platform's support channels.
`;

export default function LegalModal({
  open,
  type,
  onAgree,
  onClose,
}: LegalModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setScrolledToBottom(false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (atBottom) setScrolledToBottom(true);
  };

  if (!open) return null;

  const title =
    type === "terms"
      ? "Terms & Conditions — Data Driven Design Group, LLC d/b/a Pawspect"
      : "Privacy Policy — Data Driven Design Group, LLC d/b/a Pawspect";
  const content = type === "terms" ? TERMS_CONTENT : PRIVACY_CONTENT;

  const paragraphs = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((l) => l.length > 0);

  return (
    <dialog
      open
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-transparent border-0 w-full h-full max-w-full max-h-full m-0"
      aria-labelledby="legal-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />

      {/* Modal — never wider than viewport, full bottom-sheet on mobile */}
      <div className="relative w-full sm:w-[calc(100vw-2rem)] sm:max-w-2xl glass-surface rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2
            id="legal-modal-title"
            className="font-display font-bold text-lg text-foreground"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-ocid="legal_modal.close_button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scroll-to-bottom indicator */}
        {!scrolledToBottom && (
          <div className="absolute bottom-[76px] left-0 right-0 h-16 bg-gradient-to-t from-card/95 to-transparent pointer-events-none z-10 flex items-end justify-center pb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card/90 border border-border rounded-full px-3 py-1.5 shadow-sm">
              <ChevronDown size={12} className="animate-bounce" />
              Scroll to read all
            </div>
          </div>
        )}

        {/* Scrollable content — min-h-0 is critical for flex child to scroll */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 text-sm text-muted-foreground leading-relaxed space-y-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {paragraphs.map((para, i) => {
            if (para.startsWith("**") && para.endsWith("**")) {
              return (
                <h3
                  key={`h-${i}`}
                  className="font-semibold text-foreground text-base mt-5 first:mt-0"
                >
                  {para.slice(2, -2)}
                </h3>
              );
            }
            if (para.startsWith("•")) {
              return (
                <p key={`p-${i}`} className="pl-4">
                  {para}
                </p>
              );
            }
            return <p key={`p-${i}`}>{para}</p>;
          })}
          {/* Bottom spacer so last paragraph clearly reaches "bottom" */}
          <div className="h-6" />
        </div>

        {/* Footer CTA — sticky at bottom */}
        <div className="px-5 py-4 border-t border-border shrink-0 bg-card/95 backdrop-blur-sm">
          {!scrolledToBottom && (
            <p className="text-xs text-muted-foreground text-center mb-2">
              Please scroll to the bottom to agree
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              data-ocid="legal_modal.cancel_button"
              className="rounded-full flex-1 text-muted-foreground h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onAgree();
                onClose();
              }}
              disabled={!scrolledToBottom}
              data-ocid="legal_modal.confirm_button"
              className="rounded-full flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scrolledToBottom ? "I Agree" : "Read to Continue"}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
