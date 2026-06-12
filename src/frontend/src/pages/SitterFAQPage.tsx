import {
  BarChart3,
  BookOpen,
  ChevronDown,
  CreditCard,
  Download,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { View } from "../App";
import {
  APP_NAME,
  SUBSCRIPTION_PRICE_MONTHLY,
  SUPPORT_EMAIL,
} from "../config/business";

type SitterTopic =
  | "All"
  | "What is Pawspect"
  | "Your Tools"
  | "Your Public Page"
  | "Trial & Pricing"
  | "Subscription & Billing"
  | "Your Data Security"
  | "Platform Rules & Liability"
  | "Bookings & Availability"
  | "Invoicing & Payments"
  | "Business Growth"
  | "Privacy & GDPR"
  | "Teams & Collaboration"
  | "Getting Help";

interface SitterFAQItem {
  id: string;
  topic: SitterTopic;
  question: string;
  answer: string;
}

const SITTER_FAQ_ITEMS: SitterFAQItem[] = [
  // What is Pawspect
  {
    id: "wip-1",
    topic: "What is Pawspect",
    question: "What is Pawspect — really?",
    answer:
      "Pawspect is your Sitter Operating System. We build professional software tools so independent pet sitters like you can run your own business — with a public storefront, booking management, automated invoicing, client CRM, analytics, business coaching, and more. You run the business. We build the tools. Period.",
  },
  {
    id: "wip-2",
    topic: "What is Pawspect",
    question: "Is Pawspect my employer?",
    answer:
      "No. Pawspect is not your employer, supervisor, manager, or agency. You are an independent contractor who runs your own pet sitting business. We provide software tools that help you operate professionally. All service contracts are directly between you and your clients. You set your own prices, your own schedule, and your own standards.",
  },
  {
    id: "wip-3",
    topic: "What is Pawspect",
    question: "Does Pawspect assign me jobs or guarantee bookings?",
    answer:
      "No. Pawspect does not assign jobs, guarantee a volume of bookings, or promise any specific outcomes. We build the platform that helps you attract and manage your own clients. Your success depends on your service quality, your reviews, and your business management — and we give you world-class tools to do all of that.",
  },
  {
    id: "wip-4",
    topic: "What is Pawspect",
    question: "What makes Pawspect different from Rover or Wag?",
    answer:
      "Rover and Wag are marketplaces — they take a percentage cut of your earnings, set platform-wide pricing rules, and act as intermediaries between you and clients. Pawspect is fundamentally different: you pay a flat monthly subscription and keep 100% of your earnings. You own your client relationships. You set your prices. You build your own brand. We just power your business behind the scenes.",
  },
  // Your Tools
  {
    id: "yt-1",
    topic: "Your Tools",
    question: "What tools are included in the subscription?",
    answer: `Everything. For $${SUBSCRIPTION_PRICE_MONTHLY}/month you get: a professional public storefront, full booking and availability management, automated invoicing with line items and discounts, client and pet CRM with notes and history, business analytics and revenue tracking, a Coach & Growth hub with goal setting and business nudges, a smart Advisor that surfaces what needs your attention, in-app messaging with clients, GDPR data export and privacy tools, and a self-serve billing portal. No tiers. No feature paywalls. No platform fees.`,
  },
  {
    id: "yt-2",
    topic: "Your Tools",
    question: "What is the public storefront?",
    answer:
      "Your public storefront is a professionally designed page that showcases your services, pricing, photos, badges, and client reviews. It has its own shareable URL that you can post anywhere — social media, flyers, Google, Nextdoor. Every storefront has a Book Me button that clients can tap to start a booking request directly with you.",
  },
  {
    id: "yt-3",
    topic: "Your Tools",
    question: "What is the Coach & Growth tab?",
    answer:
      "The Coach & Growth tab is your built-in business coach. It shows your revenue trends, goal tracking, business insights, and smart nudges based on your real data — like which services are most profitable, when your busiest periods are, and what actions could grow your income. It is the difference between running a job and running a business.",
  },
  {
    id: "yt-4",
    topic: "Your Tools",
    question: "What is the Advisor panel?",
    answer:
      "The Advisor is a smart banner at the top of your portal that proactively tells you what needs attention right now — invoices you have not yet sent, overdue payments, upcoming bookings that need confirmation, profile gaps, and subscription or trial reminders. Each item has a one-tap button that takes you directly to the right place.",
  },
  {
    id: "yt-5",
    topic: "Your Tools",
    question: "What does the CRM include?",
    answer:
      "Your CRM keeps a record of every client you have booked — their contact info, pet details, booking history, and notes. You can tag clients as VIP, Regular, or New. You can send personalized deal offers or discount coupons directly from the CRM tab to one client, a selection, or all of them. Keeping your existing clients engaged is the highest-ROI thing you can do for your business.",
  },
  {
    id: "yt-6",
    topic: "Your Tools",
    question: "What are the professional credential badges on my profile?",
    answer:
      "You can self-attest to 7 professional credentials: business license, insurance/bonding, background check, client references available, use of a service agreement, certification or training (like pet first aid), and membership in a professional organization like PSI. Checked credentials appear as amber badge pills on your sitter card and storefront — they are a visible trust signal for clients. Note: these are self-reported; Pawspect does not verify, certify, or endorse any claims. Clients are responsible for their own verification.",
  },
  // Your Public Page
  {
    id: "ypp-1",
    topic: "Your Public Page",
    question: "What features are on my public profile page?",
    answer:
      "Your public page is your professional business storefront. It can display: a photo gallery of your visit photos (with legal consent handling built in), a live availability calendar showing your next 14 open days, booking stats (happy clients, visits completed, repeat client rate), certifications and credential badges, all your services with pricing, client reviews, a pinned promo offer banner, and the pet types you work with. Every section can be individually toggled on or off from your Profile settings.",
  },
  {
    id: "ypp-2",
    topic: "Your Public Page",
    question: "How do I control which sections appear on my page?",
    answer:
      "In your sitter portal, go to Profile → Page Settings. Every section of your public page has a simple on/off toggle. Turn off sections you are not ready to fill in — for example, turn off reviews until you have a few, or hide the gallery until you have photos to show. Sections with no data auto-hide by default, so your page always looks polished regardless of how much you have filled in.",
  },
  {
    id: "ypp-3",
    topic: "Your Public Page",
    question: "How do I add photos to my gallery?",
    answer:
      "Go to your Profile tab in the portal and tap the Photo Gallery section. You can upload photos directly from your device. Each upload goes through a three-part legal consent process — confirming you have rights to the image and that it meets the platform's content guidelines. Photos are stored securely and displayed on your public page in a beautiful carousel. Note: video uploads are not supported.",
  },
  {
    id: "ypp-4",
    topic: "Your Public Page",
    question: "Can I preview what my public page looks like before sharing it?",
    answer:
      "Yes — your sitter portal has a 'My Public Page' preview tab that shows exactly what clients will see when they open your shared link. Every toggle you set in your page builder is reflected instantly in the preview. What you see is exactly what your clients see.",
  },
  {
    id: "ypp-5",
    topic: "Your Public Page",
    question: "Can I control which sections appear on my public page?",
    answer:
      "Absolutely. Each section — photo gallery, availability calendar, booking stats, certifications, promo banner, response time, reviews, repeat client callout, and pet types — has its own on/off toggle in your Profile settings. Turn off sections you haven't filled in yet and turn them on when you're ready. Sections with no data auto-hide by default, so your page always looks polished.",
  },
  {
    id: "ypp-6",
    topic: "Your Public Page",
    question: "Can clients find me on Google?",
    answer:
      "Yes. Every sitter's public page is SEO-optimized with metadata tags for your name, location area, and services offered. When someone searches for a pet sitter in your area, your page is eligible to appear in search results. The more complete your profile — real photos, genuine reviews, full service list — the more competitive your page will be. You can also share your link on Nextdoor, Instagram, Google Business, and anywhere else you want to be found.",
  },
  // Trial & Pricing
  {
    id: "tp-1",
    topic: "Trial & Pricing",
    question: "How does the free trial work?",
    answer:
      "Every approved sitter gets 30 full days of access with zero restrictions and no credit card required. You get the complete platform — storefront, bookings, invoicing, CRM, analytics, and everything else — completely free during your trial. On day 30 you will be prompted to subscribe to continue.",
  },
  {
    id: "tp-2",
    topic: "Trial & Pricing",
    question: "What does the subscription cost after the trial?",
    answer: `After the trial, the subscription is $${SUBSCRIPTION_PRICE_MONTHLY}/month. All features are included — no tiers, no add-ons, no platform fees on your earnings. You keep every dollar you make. Cancel anytime directly from your Billing tab, no support call needed.`,
  },
  {
    id: "tp-3",
    topic: "Trial & Pricing",
    question: "Are there any per-booking fees or commissions?",
    answer:
      "Zero. Pawspect charges a flat monthly subscription only. Every dollar you earn from your clients goes directly to you. We do not take a percentage of your bookings, your invoices, or your tips. The pricing model is intentionally simple: flat subscription, full tools, your earnings are yours.",
  },
  // Subscription & Billing
  {
    id: "sb-1",
    topic: "Subscription & Billing",
    question: "What happens if I do not subscribe after the trial?",
    answer:
      "Your account will be frozen. You will not lose any of your data — clients, bookings, invoices, and settings are all preserved. But you will not be able to accept new bookings or send invoices until you reactivate. You can reactivate at any time from your portal, or request a GDPR data export and account anonymization at any time.",
  },
  {
    id: "sb-2",
    topic: "Subscription & Billing",
    question: "How do I manage my subscription?",
    answer:
      "Go to the Billing tab in your portal. From there you can subscribe, cancel, view billing history, and download receipts — all without contacting support. Pawspect is designed to be fully self-serve. No phone calls, no tickets, no waiting.",
  },
  {
    id: "sb-3",
    topic: "Subscription & Billing",
    question: "How do I reactivate a frozen account?",
    answer:
      "Go to the Billing tab and tap Subscribe. Once payment is confirmed, your account reactivates immediately and you regain full access to everything — all your data is right where you left it.",
  },
  // Your Data Security
  {
    id: "yds-1",
    topic: "Your Data Security",
    question: "Can Pawspect admins see my personal or financial data?",
    answer:
      "No. Admin access to sitter personal and financial data is blocked by default at the platform level — not just hidden in the interface, but enforced in the backend. Your earnings, client lists, notes, invoices, and personal details are yours alone. Admins can only see high-level platform analytics — never your private business data.",
  },
  {
    id: "yds-2",
    topic: "Your Data Security",
    question: "What if I need admin support and they need access?",
    answer:
      "There is a Support Ticket system in your portal. If you need help with a rare issue that requires admin access, you open a support ticket and explicitly grant access for that specific issue. The admin is granted only the minimum scope needed, access automatically closes when the ticket resolves, and every single step is logged in an audit trail visible to you.",
  },
  {
    id: "yds-3",
    topic: "Your Data Security",
    question: "Is there an audit trail of admin actions on my account?",
    answer:
      "Yes — every admin access event is fully audited. You can see who accessed what, when, and what was changed in your Support tab. The moment a support ticket closes, elevated access is revoked. This is a core trust feature of Pawspect — your business data is tenant-secure.",
  },
  {
    id: "yds-4",
    topic: "Your Data Security",
    question: "Can I download all my data?",
    answer:
      "Yes. Under your Profile tab, there is a Download My Data option that exports everything — your profile, bookings, invoices, clients, and reviews. This is a complete backup you can keep for your own records. Your data belongs to you, and you should always be able to take it with you.",
  },
  // Platform Rules & Liability
  {
    id: "prl-1",
    topic: "Platform Rules & Liability",
    question:
      "What is Pawspect's liability for what happens during my services?",
    answer:
      "Pawspect has zero liability for anything that occurs between you and a client. We are a software company — not a pet-sitting service, not a staffing agency, and not an insurance provider. All responsibility for your services, your conduct, and the outcomes of those services is entirely yours as an independent contractor. This is explicitly stated in our Terms of Service and in the application attestation.",
  },
  {
    id: "prl-2",
    topic: "Platform Rules & Liability",
    question: "Do I need to carry insurance?",
    answer:
      "Yes. All sitters must carry or promptly obtain adequate insurance for the pet sitting services they provide. You attested to this when you applied. While Pawspect does not verify or enforce your specific policy, carrying insurance protects you, your clients, and your business. Do not skip this — a single incident without coverage can be financially devastating.",
  },
  {
    id: "prl-3",
    topic: "Platform Rules & Liability",
    question: "What are the platform use rules?",
    answer:
      "This platform is for pet sitting services only. Any misuse — including using it for non-pet-sitting purposes, illegal activity, harassment of clients, or fraud — results in immediate account termination with no refund. You agreed to this at sign-up. Maintain safe, professional interactions with all clients.",
  },
  {
    id: "prl-4",
    topic: "Platform Rules & Liability",
    question: "What if a client makes a false claim against me?",
    answer:
      "Pawspect is not a dispute resolution service. All disputes between you and clients are handled directly between the parties. We recommend keeping detailed records, communicating through in-app messaging (which creates a written record), and taking photos during visits. If you believe a client has violated platform rules, you can contact us at our support email.",
  },
  // Bookings & Availability
  {
    id: "ba-1",
    topic: "Bookings & Availability",
    question: "How do I manage my availability?",
    answer:
      "In your portal, you control your availability by day and time. Clients can only see and select time windows where you are available — pending or confirmed bookings automatically block those slots to prevent double-booking. You can update your availability at any time from your portal.",
  },
  {
    id: "ba-2",
    topic: "Bookings & Availability",
    question: "How do I confirm or decline a booking request?",
    answer:
      "New booking requests appear in your Agenda and Bookings tab. You can review the service requested, the client's pets and contact info, and the time window, then confirm or decline. Once confirmed, the client receives a notification. We recommend responding to requests within 24 hours.",
  },
  {
    id: "ba-3",
    topic: "Bookings & Availability",
    question: "Can I contact a client directly from their booking card?",
    answer:
      "Yes. Each booking card shows the client's phone number as a tappable link. Tapping it opens a text message directly to that client — no copying numbers or switching apps. Quick and seamless.",
  },
  // Invoicing & Payments
  {
    id: "ip-1",
    topic: "Invoicing & Payments",
    question: "How do I send an invoice to a client?",
    answer:
      "After a service is complete, go to your Invoices tab and create an invoice for the booking. You can add line items, custom charges, discounts, and tips. When you are ready to send, you choose your preferred payment method — Venmo (your handle), Apple Pay Cash (your phone number), or cash. The client receives a professional branded email with the total and exactly how to pay you.",
  },
  {
    id: "ip-2",
    topic: "Invoicing & Payments",
    question: "How do I mark an invoice as paid?",
    answer:
      "In your Invoices tab, find the invoice and tap 'Mark as Paid'. The client receives a final confirmation email showing their invoice with a PAID status, plus links to rate you and book again. Only you (the sitter) or a platform admin can mark invoices paid.",
  },
  {
    id: "ip-3",
    topic: "Invoicing & Payments",
    question: "Can I add extra charges or discounts to an invoice?",
    answer:
      "Yes. When editing an invoice, you can add ad hoc line items — extra services, travel charges, supply costs, or any custom charge with a description and price. You can also add percentage discounts. The invoice total updates live as you add items.",
  },
  // Business Growth
  {
    id: "bg-1",
    topic: "Business Growth",
    question: "How do clients find me?",
    answer:
      "There are two ways: your shareable storefront link (share it anywhere — social media, Nextdoor, flyers, Google) and the platform's sitter search where clients can browse available sitters. Your storefront is your primary marketing tool. A complete profile, real reviews, and good photos are the biggest drivers of new clients.",
  },
  {
    id: "bg-2",
    topic: "Business Growth",
    question: "How do I get more reviews?",
    answer:
      "After marking an invoice paid, the client automatically receives an email with a link to rate and review you. The best way to get reviews is to deliver excellent service and send that paid confirmation promptly. Your review count and average rating are prominent on your public storefront.",
  },
  {
    id: "bg-3",
    topic: "Business Growth",
    question: "What analytics and charts does Pawspect give me?",
    answer:
      "Your Analytics tab includes a 12-week earnings trend line chart, a booking type breakdown donut (service mix at a glance), a client retention gauge showing your repeat client rate, a peak hours heatmap so you know your busiest days and times, and a 4-week revenue forecast based on your confirmed and pending bookings. All charts update in real time as bookings and payments change. Your data, visualized beautifully.",
  },
  {
    id: "bg-4",
    topic: "Business Growth",
    question: "What business insights does Pawspect show me?",
    answer:
      "Your Coach & Growth tab shows revenue by month, total bookings, average booking value, most requested services, client retention rate, earnings goals and progress, and smart nudges based on your data. The more you use the platform, the richer your analytics become.",
  },
  {
    id: "bg-5",
    topic: "Business Growth",
    question: "How do deal coupons and offers work?",
    answer:
      "From your CRM tab, you can send personalized deal offers to one, some, or all of your past clients. You choose the discount amount, write a custom message, and set an expiration date. Clients receive a beautiful branded email with their coupon code. It is your most direct re-engagement tool — ideal for slow seasons, new services, or rewarding loyal clients.",
  },
  // Privacy & GDPR
  {
    id: "gdpr-1",
    topic: "Privacy & GDPR",
    question: "Can I download or export all my data?",
    answer:
      "Yes, at any time. Go to your Profile tab and tap 'Download My Data'. You will receive a complete export of everything associated with your account — profile details, booking records, invoice history, client list, and reviews. Your data is yours and you should always be able to access it.",
  },
  {
    id: "gdpr-2",
    topic: "Privacy & GDPR",
    question: "What does 'anonymize my account' mean?",
    answer:
      "Account anonymization replaces all personally identifiable information in your account (name, email, phone, profile details) with anonymized placeholders, while preserving booking records for business integrity purposes. This is a GDPR-compliant option for sitters who want to remove their personal data from the platform. You will receive an email confirmation when the process is complete.",
  },
  {
    id: "gdpr-3",
    topic: "Privacy & GDPR",
    question: "Is my data ever shared with third parties?",
    answer:
      "No. Your personal data, earnings, client list, and business information are never sold or shared with third parties. The only data shared externally is what is required to process subscription payments (handled securely by Stripe). Platform admins have no routine access to your personal or financial data.",
  },
  // Getting Help
  {
    id: "gh-1",
    topic: "Getting Help",
    question: "How do I contact Pawspect support?",
    answer: `Email us at ${SUPPORT_EMAIL}. We aim to respond within one business day. Pawspect is designed to be fully self-supporting — most questions are answered in this FAQ, and the platform itself is built to be intuitive without a manual.`,
  },
  {
    id: "gh-2",
    topic: "Getting Help",
    question: "Will Pawspect keep improving?",
    answer:
      "Absolutely — and that is a commitment, not marketing copy. We release improvements continuously: new tools, better analytics, smarter automation, and tighter security. Your subscription price does not increase as we add features. What you pay today covers everything we build tomorrow. Sitter feedback directly shapes our roadmap.",
  },
  {
    id: "gh-3",
    topic: "Getting Help",
    question: "Is Pawspect available as a mobile app?",
    answer:
      "The sitter portal works perfectly in any mobile browser. Open it on your phone, tap 'Add to Home Screen' in your browser menu, and it works just like a native app — no app store required. All features are fully mobile-optimized.",
  },
  // Teams & Collaboration
  {
    id: "tc-1",
    topic: "Teams & Collaboration",
    question: "How do I invite another sitter to my team?",
    answer:
      "From the Teams tab in your sitter portal, search for the sitter by name, set the proposed payout split, and send an invite. The other sitter must explicitly accept the invite before the team is officially formed — both parties must agree. This is a strict approval model: no one is added to a team without their explicit consent.",
  },
  {
    id: "tc-2",
    topic: "Teams & Collaboration",
    question: "How do payout splits work for co-bookings?",
    answer:
      "When your team is assigned a co-booking, the payout is divided according to the split percentages you set when you formed the team. Each team member sees only their own share in their portal analytics and earnings summaries — the other member's share is never shown. Clients never see splits at all. You can update split percentages at any time from the Teams tab, and they take effect on new bookings.",
  },
  {
    id: "tc-3",
    topic: "Teams & Collaboration",
    question: "How does the team collaboration workspace work?",
    answer:
      "Each team has a dedicated channel in your sitter portal for real-time messaging — think of it like a private Slack channel just for your team. When a co-booking is assigned to your team, it gets its own job thread where you can assign duties (e.g. 'Morning walk — Bailey', 'Evening feeding — Linnea'), create task checklists, and track each item from Assigned to In Progress to Done. Messages refresh automatically every few seconds, so the whole team stays in sync without manual refreshing.",
  },
  {
    id: "tc-4",
    topic: "Teams & Collaboration",
    question: "Can I be in multiple teams?",
    answer:
      "Yes. You can be a member of more than one team — each with its own name, channel, split percentages, and job assignments. When viewing your Teams tab, all your active teams are shown separately, each with its own messaging channel and co-booking history. Each team's analytics and earnings are tracked independently so you always know exactly how each partnership is performing.",
  },
];

const SITTER_TOPICS: SitterTopic[] = [
  "All",
  "What is Pawspect",
  "Your Tools",
  "Your Public Page",
  "Trial & Pricing",
  "Subscription & Billing",
  "Your Data Security",
  "Platform Rules & Liability",
  "Bookings & Availability",
  "Invoicing & Payments",
  "Business Growth",
  "Privacy & GDPR",
  "Teams & Collaboration",
  "Getting Help",
];

const TOPIC_ICONS: Record<Exclude<SitterTopic, "All">, React.ReactNode> = {
  "What is Pawspect": <BookOpen className="w-3 h-3" />,
  "Your Tools": <Sparkles className="w-3 h-3" />,
  "Your Public Page": <Star className="w-3 h-3" />,
  "Trial & Pricing": <Star className="w-3 h-3" />,
  "Subscription & Billing": <CreditCard className="w-3 h-3" />,
  "Your Data Security": <Lock className="w-3 h-3" />,
  "Platform Rules & Liability": <Shield className="w-3 h-3" />,
  "Bookings & Availability": <Zap className="w-3 h-3" />,
  "Invoicing & Payments": <TrendingUp className="w-3 h-3" />,
  "Business Growth": <BarChart3 className="w-3 h-3" />,
  "Privacy & GDPR": <Download className="w-3 h-3" />,
  "Teams & Collaboration": <Users className="w-3 h-3" />,
  "Getting Help": <HelpCircle className="w-3 h-3" />,
};

interface Props {
  navigate: (view: View) => void;
}

export default function SitterFAQPage({ navigate }: Props) {
  const [activeTopic, setActiveTopic] = useState<SitterTopic>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = SITTER_FAQ_ITEMS.filter((item) => {
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
            data-ocid="sitter-faq.nav_home_link"
          >
            🐾 {APP_NAME}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("sitter-features")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="sitter-faq.nav_features_link"
            >
              Sitter Features
            </button>
            <button
              type="button"
              onClick={() => navigate("sitter-apply")}
              data-ocid="sitter-faq.nav_apply_button"
              className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-background to-background pointer-events-none" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center page-enter">
          <div className="inline-flex items-center gap-2 bg-primary/15 text-primary border border-primary/30 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Sitter Operating System
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-4">
            Sitter <span className="text-accent">Help Center</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-5">
            Your business. Your tools. Your success. Everything you need to know
            about running your pet sitting business on Pawspect.
          </p>
          <div className="inline-flex items-center gap-2 bg-accent/15 text-accent border border-accent/30 text-sm font-bold px-5 py-2 rounded-full mb-6">
            <TrendingUp className="w-4 h-4" />
            All tools included — ${SUBSCRIPTION_PRICE_MONTHLY}/month. No
            commissions. Ever.
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              Your data stays yours
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Tenant-secure storage
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              Continuously improving
            </span>
          </div>
        </div>
      </section>

      {/* Platform Identity Card */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="relative rounded-2xl overflow-hidden border border-accent/25 bg-card/60 backdrop-blur-sm p-6 sm:p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent opacity-60" />
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5" />
                What Pawspect IS
              </div>
              <ul className="space-y-2 text-sm text-foreground/90">
                {[
                  "Your Sitter Operating System — a complete business platform",
                  "Tools that make you look and operate like a pro",
                  "A flat-rate software service — no commissions on earnings",
                  "Technology you control, for your business",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5 font-bold">✓</span>
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
                  "Not your employer — you are an independent contractor",
                  "Not liable for your services, conduct, or client interactions",
                  "Not a marketplace that takes a cut of your earnings",
                  "Not responsible for client relationships or outcomes",
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
            <strong className="text-foreground">The empowering version:</strong>{" "}
            You run the business. We build the tools. Your clients are yours,
            your brand is yours, your earnings are yours. We just make the
            business side effortless.
          </p>
        </div>
      </section>

      {/* Data Security Section */}
      <section className="max-w-5xl mx-auto px-4 mb-10">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Your Data is Tenant-Secure
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            A core commitment — your personal and financial data belongs to you
            alone.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Lock className="w-5 h-5 text-primary" />,
              title: "Admin Blocked by Default",
              desc: "Platform admins cannot access your personal or financial data. Enforced at the backend level — not just hidden in the UI.",
            },
            {
              icon: <ShieldCheck className="w-5 h-5 text-primary" />,
              title: "Support Ticket Access",
              desc: "If you need help, you open a ticket and explicitly grant scoped access. It auto-revokes the moment the ticket closes.",
            },
            {
              icon: <Users className="w-5 h-5 text-primary" />,
              title: "Full Audit Trail",
              desc: "Every admin access event is logged — who accessed what, when, and what changed. Visible to you in your Support tab.",
            },
            {
              icon: <Download className="w-5 h-5 text-primary" />,
              title: "Download Your Data",
              desc: "Export a complete copy of all your data at any time — profile, bookings, invoices, clients. Your data, always accessible.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl p-5 flex flex-col gap-3 card-hover"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
              <h3 className="font-display font-bold text-foreground text-sm">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Continuous Improvement Banner */}
      <section className="max-w-5xl mx-auto px-4 mb-12">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-6 flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground text-lg">
              We keep building — for your success
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Pawspect ships improvements continuously — new tools, better
              analytics, smarter automation, and tighter security. Your
              subscription price stays the same as we add features. What you pay
              today covers everything we build tomorrow.
            </p>
          </div>
          <div className="shrink-0 hidden sm:block">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Always improving
            </span>
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
            {SITTER_FAQ_ITEMS.length} questions covering everything sitters ask
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
            data-ocid="sitter-faq.search_input"
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        {/* Topic filter pills — scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
          {SITTER_TOPICS.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                data-ocid={`sitter-faq.topic_filter.${topic.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all shrink-0 ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent shadow-md"
                    : "bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {topic !== "All" &&
                  TOPIC_ICONS[topic as Exclude<SitterTopic, "All">]}
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

        {/* Accordion */}
        {filtered.length === 0 ? (
          <div
            data-ocid="sitter-faq.empty_state"
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
                className="text-accent underline"
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
          <div className="space-y-2" data-ocid="sitter-faq.list">
            {filtered.map((item, idx) => {
              const isOpen = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  data-ocid={`sitter-faq.item.${idx + 1}`}
                  className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    data-ocid={`sitter-faq.toggle.${idx + 1}`}
                    className="w-full flex items-start gap-3 text-left px-5 py-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 text-accent">
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-snug pr-4">
                        {item.question}
                      </p>
                      {activeTopic === "All" && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          {
                            TOPIC_ICONS[
                              item.topic as Exclude<SitterTopic, "All">
                            ]
                          }
                          {item.topic}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : ""}`}
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

        {/* Support Card */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-bold text-foreground text-lg mb-1">
            Still have questions?
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            We read every email. The platform is designed to be self-supporting,
            but we are always a message away.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            data-ocid="sitter-faq.support_email_link"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            Email Support
          </a>
          <p className="text-xs text-muted-foreground mt-3">{SUPPORT_EMAIL}</p>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/20 p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4">
            30 days free · No credit card required
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Start your free trial today
          </h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            Join independent pet sitters running their business with Pawspect.
            Full access, 30 days free, then just ${SUBSCRIPTION_PRICE_MONTHLY}
            /month — no commissions, no surprises.
          </p>
          <button
            type="button"
            onClick={() => navigate("sitter-apply")}
            data-ocid="sitter-faq.apply_cta"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold text-base px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Apply Now — Free Trial
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            30-day free trial · ${SUBSCRIPTION_PRICE_MONTHLY}/month after ·
            Cancel anytime
          </p>
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
            data-ocid="sitter-faq.terms_link"
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => navigate("privacy")}
            className="underline hover:text-foreground transition-colors"
            data-ocid="sitter-faq.privacy_link"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => navigate("sitter-features")}
            className="underline hover:text-foreground transition-colors"
            data-ocid="sitter-faq.features_link"
          >
            Sitter Features
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
