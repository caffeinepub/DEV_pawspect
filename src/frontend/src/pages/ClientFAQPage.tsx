import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { View } from "../App";
import { APP_NAME, SUPPORT_EMAIL } from "../config/business";

type ClientTopic =
  | "All"
  | "What is Pawspect"
  | "How Booking Works"
  | "Sitter Vetting"
  | "Meet & Greet Questions"
  | "Payments & Invoicing"
  | "Safety & Liability"
  | "Your Privacy & Data"
  | "Managing Bookings"
  | "Getting Help";

interface ClientFAQItem {
  id: string;
  topic: ClientTopic;
  question: string;
  answer: string;
}

const CLIENT_FAQ_ITEMS: ClientFAQItem[] = [
  {
    id: "us-only",
    topic: "What is Pawspect",
    question: "Is Pawspect available outside the United States?",
    answer:
      "No. Pawspect is a US-only platform. Only sitters located in the United States may register and offer services through Pawspect. A valid US ZIP code is required during sitter registration.",
  },
  {
    id: "sv-no-verify",
    topic: "Sitter Vetting",
    question: "Does Pawspect verify sitter credentials?",
    answer:
      "No. Credential badges (such as Insured, Background Checked, Certified) are self-reported by sitters and are NOT verified by Pawspect. Pawspect does not employ, endorse, screen, or supervise any sitter. The responsibility for verifying sitter qualifications rests entirely with you, the client. We strongly encourage you to ask for documentation and conduct your own due diligence before booking.",
  },
  {
    id: "sal-platform-liability",
    topic: "Safety & Liability",
    question: "What is Pawspect\u2019s liability if something goes wrong?",
    answer:
      "Pawspect is a software platform and is not liable for any outcomes between sitters and clients. This includes pet injury, illness, property damage, or any other incident. If an issue arises, your recourse is directly with the sitter. We strongly recommend ensuring your sitter has insurance before booking. Pawspect and Data Driven Design Group, LLC are not party to any service agreement between you and your sitter.",
  },
  {
    id: "wip-1",
    topic: "What is Pawspect",
    question: "What exactly is Pawspect?",
    answer:
      "Pawspect is a software platform — not a pet-sitting agency, not an employer, and not a traditional marketplace. We build professional tools that allow independent pet sitters to run their own businesses. When you book through Pawspect, you are booking directly with an independent, self-employed sitter. Your contract for services is between you and the sitter — Pawspect facilitates the connection and handles the technology.",
  },
  {
    id: "wip-2",
    topic: "What is Pawspect",
    question: "Is Pawspect a pet-sitting agency?",
    answer:
      "No. Pawspect does not employ, supervise, or manage any sitter. We are a software company. Think of us like the tools a sitter uses to run their business — scheduling, invoicing, and communication technology. The sitter is an independent professional who has chosen to use our platform. All services, rates, and interactions are entirely their own.",
  },
  {
    id: "wip-3",
    topic: "What is Pawspect",
    question: "Why does that matter to me as a client?",
    answer:
      "It means complete transparency. The sitter you hire sets their own rates, controls their own availability, and manages their own business standards. You are dealing directly with a real, local professional — not a faceless gig economy dispatcher. Pawspect gives that sitter the tools to look professional and organized so you have a better experience.",
  },
  {
    id: "wip-4",
    topic: "What is Pawspect",
    question: "Does Pawspect guarantee pet safety or sitter quality?",
    answer:
      "Pawspect does not guarantee any specific outcome for your pet or your property. Each sitter is an independent professional responsible for their own service quality. We strongly encourage you to read reviews, request a Meet & Greet before committing to services, ask about insurance, and trust your instincts. All outcomes are between you and the sitter you choose.",
  },
  {
    id: "hbw-1",
    topic: "How Booking Works",
    question: "How do I book a sitter?",
    answer:
      "From the homepage, click 'Find a Sitter' or 'Book Now'. You will pick your desired service, dates, and time window first. The system shows available sitters matching your schedule. Browse profiles, read reviews, and select the sitter you want. Then provide your pet details and contact info, and submit your booking request. You will receive a confirmation once the sitter accepts.",
  },
  {
    id: "hbw-2",
    topic: "How Booking Works",
    question: "Do I need to create an account to book?",
    answer:
      "No account needed. You provide your name, phone number, and email during the booking process. We use your phone number and email to identify you for returning visits — so you can always look up your bookings without a password or login. Your phone number is required as the primary contact method.",
  },
  {
    id: "hbw-3",
    topic: "How Booking Works",
    question: "Why is my phone number required?",
    answer:
      "Your phone number is how your sitter will reach you in case of any questions or updates during care. It is also used to look up your bookings if you ever need to check status, find your invoices, or request a rebooking. We will not sell your phone number or use it for unsolicited marketing.",
  },
  {
    id: "hbw-4",
    topic: "How Booking Works",
    question: "What is the Meet & Greet option?",
    answer:
      "A Meet & Greet is a short introductory visit where you, your pet, and the sitter can get comfortable with each other before any paid services begin. Most sitters offer this for free. It is your best tool for ensuring the fit is right. You can request a Meet & Greet as part of the booking process, and the sitter will coordinate details with you directly.",
  },
  {
    id: "hbw-5",
    topic: "How Booking Works",
    question: "What if I need a booking on very short notice?",
    answer:
      "You can submit a booking request for any time — including same-day or last-minute. Sitters receive all requests regardless of timing and can choose to accept or decline at their own discretion. Booking ahead is always a good idea for weekends, holidays, and longer stays, but there is no restriction preventing short-notice requests from being submitted.",
  },
  {
    id: "hbw-6",
    topic: "How Booking Works",
    question: "Can I book recurring or multiple services at once?",
    answer:
      "Yes. The booking flow supports multi-service requests — you can add dog walking, drop-in visits, and other services in the same booking cart. For recurring services (like daily walks), discuss the schedule with your sitter directly after confirming the initial booking.",
  },
  {
    id: "sv-1",
    topic: "Sitter Vetting",
    question: "How are sitters reviewed before joining?",
    answer:
      "Every sitter applies to the platform and is reviewed by our admin team before being approved. Applicants must confirm they are 18 years of age or older, have adequate insurance, and understand that Pawspect is a software platform only. However, this review is informational only and does not constitute an endorsement, guarantee, or employment.",
  },
  {
    id: "sv-2",
    topic: "Sitter Vetting",
    question: "Are sitters required to have insurance?",
    answer:
      "Yes — all sitters agree to the platform requirement that they carry or obtain adequate insurance for the services they provide. This is an attestation requirement at sign-up. However, Pawspect does not verify or enforce insurance coverage directly. We strongly recommend asking your sitter about their coverage before services begin.",
  },
  {
    id: "sv-3",
    topic: "Sitter Vetting",
    question: "Can I see sitter reviews before booking?",
    answer:
      "Absolutely. Each sitter profile shows their star rating, total review count, and individual review text from past clients. Reviews are a key part of your decision — read them carefully. You can also request a Meet & Greet to assess fit before committing.",
  },
  {
    id: "sv-4",
    topic: "Sitter Vetting",
    question: "What does 'verification' mean on a sitter profile?",
    answer:
      "Any verification indicators on a sitter's profile are informational only and do not imply endorsement, guarantee, or employment by Pawspect. As an independent contractor, each sitter is solely responsible for their own professional standards.",
  },
  {
    id: "sv-6",
    topic: "Sitter Vetting",
    question: "How do I know if a sitter is qualified?",
    answer:
      "Each sitter can display professional credential badges on their profile and storefront: business license, insurance/bonding, background check, client references, use of a service agreement, certifications like pet first aid, and professional organization membership. These are self-reported by the sitter — Pawspect provides the tool but does not verify, certify, or endorse any of these claims. We strongly encourage you to do your own verification. See our 'Meet & Greet Questions' section for a full interview checklist.",
  },
  {
    id: "sv-7",
    topic: "Sitter Vetting",
    question: "Can I preview a sitter's full storefront before booking?",
    answer:
      "Yes — every sitter has a shareable public page showing their services, photo gallery, availability calendar, credentials, reviews, and a Book Me button. You can browse their full page before deciding to book. Look for the link on their profile card in search results.",
  },
  {
    id: "pai-1",
    topic: "Payments & Invoicing",
    question: "How does payment work?",
    answer:
      "Payment is arranged directly between you and your sitter. When services are complete, your sitter sends you an invoice through the platform. Your sitter chooses their preferred payment method — Venmo, Apple Pay Cash, or cash — and the invoice will include instructions. All payments go directly from you to your sitter.",
  },
  {
    id: "pai-2",
    topic: "Payments & Invoicing",
    question: "Does Pawspect take a cut of my payment?",
    answer:
      "No. All payments go directly from you to your sitter. Pawspect does not process, hold, or take any commission from your payment. Your sitter sets their own rates and receives payment in full. What you pay is exactly what the sitter receives.",
  },
  {
    id: "pai-3",
    topic: "Payments & Invoicing",
    question: "What if I disagree with an invoice amount?",
    answer:
      "Discuss it directly with your sitter. Since all payment is between you and the sitter, any billing questions or adjustments are handled directly with them. We recommend reviewing service details at booking time to set clear expectations.",
  },
  {
    id: "pai-4",
    topic: "Payments & Invoicing",
    question: "How do I find my past invoices?",
    answer:
      "Click 'My Bookings' in the navigation and enter your phone number or email. Your booking history and all invoices appear. You can view, print, or save any invoice. The platform stores your invoice history so you always have a record.",
  },
  {
    id: "sal-1",
    topic: "Safety & Liability",
    question: "What is Pawspect's liability if something goes wrong?",
    answer:
      "Pawspect is a software platform and is not a party to the service contract between you and your sitter. We bear no liability for any outcomes — including pet injury, illness, loss, property damage, or any other incident during services. All responsibility lies with the sitter as an independent professional. This is why we encourage Meet & Greets, asking about insurance, and reviewing sitter credentials carefully before booking.",
  },
  {
    id: "sal-2",
    topic: "Safety & Liability",
    question:
      "Where do the sitter and I meet for services? Do I share my address in the app?",
    answer:
      "Location, access arrangements, and visit logistics are coordinated directly between you and your sitter outside the app — for your security. Sharing specific home addresses and access details (key codes, lockbox locations) should happen through a private channel (text, phone call) you control, not the booking form. This protects your home security.",
  },
  {
    id: "sal-3",
    topic: "Safety & Liability",
    question: "What should I do if I have a serious problem with my sitter?",
    answer:
      "Contact your sitter directly first. If there is a serious safety concern, contact local authorities as appropriate. Pawspect is not equipped to mediate disputes between clients and sitters — however, you can contact us at our support email if you believe platform policies were violated.",
  },
  {
    id: "ypd-1",
    topic: "Your Privacy & Data",
    question: "Is my personal information secure?",
    answer:
      "Yes. Your booking data — name, phone, email, pet details, and transaction history — is stored securely and is only accessible to you and the sitter you book with. Pawspect does not sell your information to third parties. Our platform uses tenant-isolated data storage, meaning your data is not accessible to platform administrators by default.",
  },
  {
    id: "ypd-2",
    topic: "Your Privacy & Data",
    question: "Who can see my booking details?",
    answer:
      "Only you (by looking up your bookings with your phone or email) and the sitter you booked with can see your booking details. Platform administrators have no routine access to client personal data. Pawspect does not share your information with other sitters, advertisers, or any third parties.",
  },
  {
    id: "ypd-3",
    topic: "Your Privacy & Data",
    question: "What data does Pawspect collect about me?",
    answer:
      "We collect only what is necessary for the booking process: your name, phone number, email, pet name and type, and the services you book. We may log platform usage for security and reliability purposes. We do not collect payment information — all payments go directly between you and your sitter.",
  },
  {
    id: "ypd-4",
    topic: "Your Privacy & Data",
    question: "Did I consent to receive communications when I booked?",
    answer:
      "By providing your phone number during booking, you consent to receive booking-related communications from your sitter and the platform. We do not send unsolicited marketing. If you wish to opt out of any communications, contact us at our support email.",
  },
  {
    id: "mb-1",
    topic: "Managing Bookings",
    question: "How do I cancel or reschedule a booking?",
    answer:
      "You can cancel a booking from your booking details page at any time. If the booking is within 24 hours, a cancellation warning will appear noting that the full service amount may still be charged at the sitter's discretion. Rescheduling is arranged directly with your sitter — contact them through in-app messaging or by phone as early as possible.",
  },
  {
    id: "mb-1b",
    topic: "Managing Bookings",
    question: "What happens if I cancel within 24 hours of my booking?",
    answer:
      "Cancellations within 24 hours of the booking start time are considered late cancellations. Per Pawspect's policy agreed to at booking, the full service amount may be charged at the sitter's discretion. The sitter can update the invoice if both parties agree to a different arrangement. Pawspect provides the tools — all financial decisions about cancellations are between you and your sitter. Pawspect and Data Driven Design Group, LLC are not a party to any financial agreement and accept no liability for cancellation disputes.",
  },
  {
    id: "mb-2",
    topic: "Managing Bookings",
    question: "How do I rebook the same sitter again?",
    answer:
      "When you look up your bookings using your phone or email, each past booking has a 'Book Again' button. Tap it to instantly pre-fill your cart with the same service and sitter. You just pick a new date and confirm. It is the fastest way to rebook a sitter you trust.",
  },
  {
    id: "mb-3",
    topic: "Managing Bookings",
    question: "Can I message my sitter through the app?",
    answer:
      "Yes. The platform includes a messaging feature between clients and sitters. Once your booking is submitted, you can use in-app messaging for questions, coordination, and updates. For urgent matters or sharing sensitive access information, we recommend using your personal phone or text.",
  },
  {
    id: "mb-4",
    topic: "Managing Bookings",
    question: "How do I leave a review for my sitter?",
    answer:
      "After your sitter marks a service complete and sends you a paid invoice confirmation, that email includes a direct link to leave a rating and written review. Click the link, choose your star rating (1–5), write a comment about your experience, and submit — it takes less than a minute. Your review appears on your sitter's public page right away and helps other pet owners make confident choices.",
  },
  {
    id: "sv-5",
    topic: "Sitter Vetting",
    question: "What does the sitter's public page show me?",
    answer:
      "Each sitter's public profile page shows their photo gallery from real visits, a live availability calendar for the next two weeks, booking stats (total visits completed, happy client count, repeat client rate), any certifications and credentials they have earned, all their services and pricing, real client reviews with star ratings, and a promo offer if they are currently running one. Everything you see reflects real data from the sitter's actual work on the platform — no fabricated credentials. You can reach the page by tapping a sitter's name in search results or via the link they share publicly.",
  },
  // Meet & Greet Questions — 7-item checklist section
  {
    id: "mgq-intro",
    topic: "Meet & Greet Questions",
    question: "Why should I schedule a meet & greet before booking?",
    answer:
      "Before committing to a sitter, we encourage you to schedule a meet & greet or initial consultation. It gives you, your pet, and the sitter a chance to get comfortable before any paid services begin. It's your best opportunity to ask questions, see how the sitter interacts with your pet, and decide if the fit is right. It is entirely up to you and your sitter to discuss these details together — Pawspect provides the platform and tools, but we do not screen, verify, or guarantee any sitter credentials.",
  },
  {
    id: "mgq-1",
    topic: "Meet & Greet Questions",
    question: "Does your sitter have the proper business license or permit?",
    answer:
      'Any professional pet sitter or dog walker should hold a valid business license or permit if required in their area. You can ask your sitter to share this information during your meet & greet. Some sitters display a "Licensed to Operate" badge on their profile, which means they have self-reported having this credential. Always ask to see documentation. Note: all credential badges on Pawspect are self-reported and are not independently verified by Pawspect.',
  },
  {
    id: "mgq-2",
    topic: "Meet & Greet Questions",
    question: "Is your sitter insured and bonded?",
    answer:
      'Insurance and bonding protect both you and the sitter in case of accidents, injuries, or unexpected incidents during a visit. Ask your sitter to show proof of coverage before services begin. Look for the "Insured & Bonded" badge on their profile — this indicates the sitter has self-reported carrying coverage. Pawspect does not verify or enforce any insurance claim, so asking directly and requesting documentation is strongly recommended.',
  },
  {
    id: "mgq-3",
    topic: "Meet & Greet Questions",
    question: "Has your sitter passed a background check?",
    answer:
      'A recent background check (within the past year) is a strong indicator of a trustworthy sitter. Ask if they have completed one and through which service. Sitters with the "Background Checked" badge have self-reported having a clear history — ask for details or documentation. Pawspect does not conduct or verify background checks. Conducting your own due diligence is your responsibility.',
  },
  {
    id: "mgq-4",
    topic: "Meet & Greet Questions",
    question: "Can your sitter provide client references?",
    answer:
      'A professional sitter should be able to provide references from current or past clients. Ask for contact information or look for verified reviews on their public profile. The "References Available" badge indicates the sitter self-reports being able to provide references. Reading reviews on the sitter\'s public storefront page is a great starting point — but reaching out to a reference directly can give you added confidence.',
  },
  {
    id: "mgq-5",
    topic: "Meet & Greet Questions",
    question: "Does your sitter use a service agreement or contract?",
    answer:
      'A written agreement protects both parties by clearly outlining services, dates, rates, and policies. Ask your sitter to share their agreement before your first booking. Sitters with the "Service Agreement" badge self-report using a written contract. Having a clear, written agreement is one of the most important steps you can take to protect yourself and your pets.',
  },
  {
    id: "mgq-6",
    topic: "Meet & Greet Questions",
    question: "Is your sitter certified or trained in pet care?",
    answer:
      "Pet-care certifications — like Certified Professional Pet Sitter® (CPPS) from Pet Sitters International or pet first aid training — show a sitter's commitment to their profession and your pet's wellbeing. Ask what training and certifications they hold and when they were completed. The \"Certified or Trained\" badge indicates self-reported credentials. Pawspect does not verify certifications — always ask for details directly.",
  },
  {
    id: "mgq-7",
    topic: "Meet & Greet Questions",
    question: "Is your sitter a member of a professional organization?",
    answer:
      'Membership in organizations like Pet Sitters International (PSI) shows a dedication to ongoing education and professionalism. Ask your sitter about their affiliations. The "Professional Member" badge reflects self-reported membership in a professional or educational association. Active participation in these organizations helps sitters stay current with best practices in pet care.',
  },
  {
    id: "gh-1",
    topic: "Getting Help",
    question: "How do I contact Pawspect for support?",
    answer: `For platform questions, technical issues, or concerns about platform policy, email us at ${SUPPORT_EMAIL}. We aim to respond within one business day. Note that Pawspect cannot resolve disputes between clients and sitters — those are handled directly between the parties.`,
  },
  {
    id: "gh-2",
    topic: "Getting Help",
    question: "Is there a phone number for Pawspect support?",
    answer: `Pawspect is a self-supported digital platform. Our primary support channel is email at ${SUPPORT_EMAIL}. The platform is designed to be fully self-serve — most questions can be answered here in the FAQ or by exploring the app itself.`,
  },
  {
    id: "gh-3",
    topic: "Getting Help",
    question: "I can't find my booking — what do I do?",
    answer:
      "Go to 'My Bookings' and try looking up by both your phone number and your email address — sometimes a typo at booking time means one will work better than the other. If you still cannot find it, contact the sitter directly (if you have their contact info) or email our support team with the approximate booking date and sitter name.",
  },
];

const CLIENT_TOPICS: ClientTopic[] = [
  "All",
  "What is Pawspect",
  "How Booking Works",
  "Sitter Vetting",
  "Meet & Greet Questions",
  "Payments & Invoicing",
  "Safety & Liability",
  "Your Privacy & Data",
  "Managing Bookings",
  "Getting Help",
];

const TOPIC_ICONS: Record<Exclude<ClientTopic, "All">, React.ReactNode> = {
  "What is Pawspect": <BookOpen className="w-3 h-3" />,
  "How Booking Works": <Zap className="w-3 h-3" />,
  "Sitter Vetting": <Users className="w-3 h-3" />,
  "Meet & Greet Questions": <MessageCircle className="w-3 h-3" />,
  "Payments & Invoicing": <CreditCard className="w-3 h-3" />,
  "Safety & Liability": <Shield className="w-3 h-3" />,
  "Your Privacy & Data": <Lock className="w-3 h-3" />,
  "Managing Bookings": <Star className="w-3 h-3" />,
  "Getting Help": <HelpCircle className="w-3 h-3" />,
};

interface Props {
  navigate: (view: View) => void;
}

export default function ClientFAQPage({ navigate }: Props) {
  const [activeTopic, setActiveTopic] = useState<ClientTopic>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = CLIENT_FAQ_ITEMS.filter((item) => {
    const matchesTopic = activeTopic === "All" || item.topic === activeTopic;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.topic.toLowerCase().includes(q);
    return matchesTopic && matchesSearch;
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Nav */}
      <nav className="frosted-nav sticky top-0 z-50 border-b border-white/10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="text-lg font-display font-bold text-foreground flex items-center gap-2"
            data-ocid="client-faq.nav_home_link"
          >
            🐾 {APP_NAME}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("booking-lookup")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="client-faq.nav_my_bookings_link"
            >
              My Bookings
            </button>
            <button
              type="button"
              onClick={() => navigate("home")}
              data-ocid="client-faq.nav_book_button"
              className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
            >
              Book a Sitter
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center page-enter">
          <div className="inline-flex items-center gap-2 bg-accent/15 text-accent border border-accent/30 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            Trusted Platform
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
            Pet Owner <span className="text-primary">Help Center</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            Transparent answers about how Pawspect works, how your data is
            protected, and what to expect when booking an independent pet
            sitter.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              Your data is never sold
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Transparent platform
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary" />
              No hidden fees
            </span>
          </div>
        </div>
      </section>

      {/* Prominent Platform Disclaimer */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="relative rounded-2xl overflow-hidden border border-destructive/25 bg-destructive/5 backdrop-blur-sm p-5 sm:p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-accent to-destructive opacity-60" />
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-display font-bold text-foreground text-base mb-1">
                Important: About {APP_NAME}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {APP_NAME} is a <strong>software platform only</strong> — not a
                pet care company or agency. Sitters are independent
                professionals who use our tools to run their own businesses.
                {APP_NAME} does <strong>not</strong> employ, vet, screen,
                supervise, or guarantee any sitter or service. The
                responsibility for selecting and vetting a sitter is{" "}
                <strong>entirely yours</strong>. We strongly encourage you to
                review sitter credentials, check references, and use your best
                judgment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Identity Card */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-primary/5 backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5" />
                What Pawspect IS
              </div>
              <ul className="space-y-2 text-sm text-foreground/90">
                {[
                  "A software platform for independent pet sitters",
                  "A tool that connects you with local, self-employed professionals",
                  "A secure way to book, message, and pay — all in one place",
                  "A transparent system where you see exactly who you're booking",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                <Shield className="w-3.5 h-3.5" />
                What Pawspect is NOT
              </div>
              <ul className="space-y-2 text-sm text-foreground/90">
                {[
                  "Not a pet-sitting agency or employer",
                  "Not responsible for sitter behavior or pet outcomes",
                  "Not a party to your service contract with the sitter",
                  "Not a payment processor — money goes directly to your sitter",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5 font-bold">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted-foreground border-t border-border/40 pt-4">
            <strong className="text-foreground">The short version:</strong> We
            connect you with independent sitters. The service is between you and
            them. We build the technology that makes it easy.
          </p>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="max-w-5xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Lock className="w-5 h-5 text-primary" />,
              title: "Secure Data",
              desc: "Your booking info, pet details, and contact info are stored securely and never sold or shared with advertisers.",
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-primary" />,
              title: "Transparent Platform",
              desc: "We clearly separate what the platform does from what your sitter does. No hidden responsibilities, no fine print surprises.",
            },
            {
              icon: <CreditCard className="w-5 h-5 text-primary" />,
              title: "No Hidden Fees",
              desc: "Pawspect charges sitters for the platform, not clients. What your sitter charges you is exactly what they receive.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 flex flex-col gap-3 card-hover"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
              <h3 className="font-display font-bold text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Continuous Improvement Banner */}
      <section className="max-w-5xl mx-auto px-4 mb-12">
        <div className="rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 p-5 sm:p-6 flex items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground">
              We keep improving — for you and your pets
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Pawspect continuously improves its technology — better booking
              tools, clearer communication, and stronger security — at no extra
              cost to clients. Ever.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm">
            {CLIENT_FAQ_ITEMS.length} questions covering everything clients ask
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions and answers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="client-faq.search_input"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        {/* Topic filter pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
          {CLIENT_TOPICS.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                data-ocid={`client-faq.topic_filter.${topic.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {topic !== "All" &&
                  TOPIC_ICONS[topic as Exclude<ClientTopic, "All">]}
                {topic}
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {(searchQuery || activeTopic !== "All") && (
          <p className="text-xs text-muted-foreground mb-4">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Meet & Greet intro banner — shown when topic is active or items are in results */}
        {(activeTopic === "Meet & Greet Questions" ||
          filtered.some((i) => i.topic === "Meet & Greet Questions")) && (
          <div className="mb-5 rounded-xl border border-primary/25 bg-primary/5 backdrop-blur-sm p-5">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
              <MessageCircle className="w-3.5 h-3.5" />
              Meet & Greet Checklist
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Before committing to a sitter, schedule a meet &amp; greet or
              initial consultation. Use these 7 questions as your guide. It is
              entirely up to you and your sitter to discuss these — Pawspect
              provides the platform and tools, but does not screen, verify, or
              guarantee any sitter credentials.
            </p>
          </div>
        )}

        {/* Accordion */}
        {filtered.length === 0 ? (
          <div
            data-ocid="client-faq.empty_state"
            className="text-center py-16 text-muted-foreground"
          >
            <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-foreground mb-1">
              No results found
            </p>
            <p className="text-sm">
              Try different keywords or{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTopic("All");
                }}
              >
                clear filters
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-2" data-ocid="client-faq.list">
            {filtered.map((item, idx) => {
              const isOpen = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  data-ocid={`client-faq.item.${idx + 1}`}
                  className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    data-ocid={`client-faq.toggle.${idx + 1}`}
                    className="w-full flex items-start gap-3 text-left px-5 py-4 hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-snug pr-4">
                        {item.question}
                      </p>
                      {activeTopic !== "All" ? null : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          {
                            TOPIC_ICONS[
                              item.topic as Exclude<ClientTopic, "All">
                            ]
                          }
                          {item.topic}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-border/40 pt-4 text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Meet & Greet disclaimer — shown when those items are visible */}
        {filtered.some((i) => i.topic === "Meet & Greet Questions") && (
          <div
            data-ocid="client-faq.meet_greet_disclaimer"
            className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/8 p-5 flex gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              <strong className="text-foreground">
                Self-Reported Credentials Disclaimer:
              </strong>{" "}
              All credential badges on Pawspect profiles are self-reported by
              the sitter. Pawspect does not verify, certify, screen, or endorse
              any sitter credentials or claims. Conducting your own due
              diligence — including asking for proof of licenses, insurance,
              background checks, certifications, and references — is your
              responsibility and is strongly encouraged.
            </p>
          </div>
        )}

        {/* Support Card */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-lg mb-1">
            Still have questions?
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Our support team is here for platform questions. For booking or
            payment issues, contact your sitter directly.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            data-ocid="client-faq.support_email_link"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            Email Support
          </a>
          <p className="text-xs text-muted-foreground mt-3">{SUPPORT_EMAIL}</p>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/20 p-8 text-center">
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Ready to book?
          </h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            Find a trusted independent sitter near you. No account required —
            book in minutes.
          </p>
          <button
            type="button"
            onClick={() => navigate("booking-lookup")}
            data-ocid="client-faq.book_now_cta"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold text-base px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            Find a Sitter
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 px-4 py-8 text-center text-xs text-muted-foreground">
        <p className="mb-1">
          © {new Date().getFullYear()} {APP_NAME}. A product of Data Driven
          Design Group, LLC.
        </p>
        <p className="mb-3">
          Pawspect is a software platform only. Not a pet-sitting service,
          employer, or agent.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate("terms")}
            className="underline hover:text-foreground transition-colors"
            data-ocid="client-faq.terms_link"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => navigate("privacy")}
            className="underline hover:text-foreground transition-colors"
            data-ocid="client-faq.privacy_link"
          >
            Privacy Policy
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline hover:text-foreground transition-colors"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <p className="mt-3">
          Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
