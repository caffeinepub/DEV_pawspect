import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Database,
  DollarSign,
  Download,
  Gift,
  Globe,
  Lock,
  MapPin,
  PawPrint,
  Receipt,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactElement } from "react";
import type { View } from "../App";
import SitterPortalFAQ from "../components/SitterPortalFAQ";
import {
  APP_NAME,
  BUNDLE_DISCOUNT_PERCENT,
  SUBSCRIPTION_PRICE_MONTHLY,
} from "../config/business";

interface Props {
  navigate: (view: View) => void;
}

const STATS = [
  { icon: DollarSign, label: "100% of earnings tracked" },
  { icon: Receipt, label: "Invoice in seconds" },
  { icon: Zap, label: "Real-time booking alerts" },
  { icon: BookOpen, label: "Built-in business coaching" },
];

const FEATURES = [
  {
    icon: Calendar,
    name: "Smart Agenda",
    desc: "See every booking at a glance. Your daily and weekly agenda gives you a clear picture of your schedule so you never miss an appointment or double-book.",
    mockup: "agenda",
    isNew: false,
  },
  {
    icon: Receipt,
    name: "Professional Invoicing",
    desc: "Send branded invoices in seconds. Add custom line items, apply discounts, choose Venmo, Apple Pay Cash, or cash — then get paid with zero awkward conversations.",
    mockup: "invoice",
    isNew: false,
  },
  {
    icon: BarChart3,
    name: "Real-Time Analytics",
    desc: "Your data, visualized in real time. Earnings trend (12-week line chart), booking breakdown donut, client retention gauge, peak hours heatmap, and revenue forecast — all live, all beautiful, all updating as bookings come in.",
    mockup: "analytics",
    isNew: false,
  },
  {
    icon: Rocket,
    name: "Coach & Growth",
    desc: "Your personal business coach, built in. Set earnings goals, track your savings, and get smart insights that help you grow — not just manage.",
    mockup: "coach",
    isNew: false,
  },
  {
    icon: Star,
    name: "Review Management",
    desc: "Build your reputation automatically. See every review, understand your rating trend, and encourage happy clients to spread the word.",
    mockup: "reviews",
    isNew: false,
  },
  {
    icon: CalendarCheck,
    name: "Availability Control",
    desc: "You set the hours. Define exactly when you are available, prevent double-bookings automatically, and block time whenever you need a break.",
    mockup: "availability",
    isNew: false,
  },
  {
    icon: Users,
    name: "Client Management",
    desc: "Know who your best clients are. Track returning clients, booking history, and build relationships that keep them coming back.",
    mockup: "clients",
    isNew: false,
  },
  {
    icon: Wallet,
    name: "Earnings & Tax Summary",
    desc: "Stay ready for tax season. Your quarterly and year-to-date earnings are always summarized, so you never scramble at the end of the year.",
    mockup: "earnings",
    isNew: false,
  },
  {
    icon: Bell,
    name: "Smart Advisor",
    desc: "A proactive assistant that surfaces what needs attention — unsent invoices, overdue payments, pending requests, and profile gaps. Always one tap away from the right fix.",
    mockup: "advisor",
    isNew: true,
  },
  {
    icon: Gift,
    name: "Send Deal Offers",
    desc: "Turn past clients into repeat bookings. Send personalized discount offers to your client list — one client or all of them. Beautiful branded emails with auto-applied coupon codes.",
    mockup: "deals",
    isNew: true,
  },
  {
    icon: Globe,
    name: "Public Storefront",
    desc: "A beautiful, shareable public page that makes you look like a pro. Share your unique link and clients can browse your services, read reviews, and book — all without creating an account. Preview your page live inside the portal — see exactly what clients see before you share it.",
    mockup: "storefront",
    isNew: true,
  },
  {
    icon: Star,
    name: "Your Premium Business Page",
    desc: "Your shareable link is your business. Clients see your photo gallery, live availability calendar, booking stats, certifications, and a 'Book Me' button — all in a world-class design. Every section independently controlled — show your certifications only when you have them.",
    mockup: "premiumPage",
    isNew: true,
  },
  {
    icon: ShieldCheck,
    name: "Professional Credentials",
    desc: "Display self-verified professional credentials on your storefront and sitter cards. 7 trust signals: licensed, insured, background checked, references available, service agreement, certified, and professional member. Each badge independently toggled — show only what applies to you. Self-reported credentials show your commitment; clients do their own verification.",
    mockup: "credentials",
    isNew: true,
  },
  {
    icon: Users,
    name: "Sitter Teams & Collaboration",
    desc: "Invite trusted sitters to your team, set payout splits, and coordinate co-bookings with a Slack-like job board. Each co-booking gets its own thread with duty assignments and task checklists. Splits are private — clients never see them.",
    mockup: "teams",
    isNew: true,
  },
];

const COACH_BULLETS = [
  { icon: Target, text: "Earnings goal with live progress tracking" },
  { icon: Wallet, text: "Monthly savings target with smart tips" },
  {
    icon: Sparkles,
    text: "Contextual growth insights tailored to your bookings",
  },
  {
    icon: Star,
    text: "Milestone celebrations — first booking, $1K earned, and more",
  },
  {
    icon: BookOpen,
    text: "Actionable business coaching built right into your dashboard",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Boulder, CO",
    rating: 5,
    quote:
      "The invoicing feature alone saved me hours every week. My clients love how professional everything looks — and I love getting paid faster.",
  },
  {
    name: "Jordan T.",
    location: "Denver, CO",
    rating: 5,
    quote:
      "The Coach & Growth tab genuinely changed how I think about my business. I set a monthly goal and the app tells me exactly how I'm tracking. It's incredible.",
  },
  {
    name: "Alex R.",
    location: "Fort Collins, CO",
    rating: 5,
    quote:
      "I send my sitter portal link to every new inquiry. It makes me look so legit. Clients book with confidence because everything is so polished.",
  },
];

// ── Mini mockup components ─────────────────────────────────────────────
function AgendaMockup() {
  const slots = [
    { time: "9:00 AM", name: "Bella's Walk", color: "bg-indigo-400" },
    { time: "11:30 AM", name: "Max Drop-In", color: "bg-amber-400" },
    { time: "2:00 PM", name: "Luna Boarding", color: "bg-emerald-400" },
  ];
  return (
    <div className="space-y-2 p-1">
      {slots.map((s) => (
        <div
          key={s.time}
          className="flex items-center gap-3 rounded-xl p-2.5"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          <div className={`w-1.5 h-8 rounded-full ${s.color} shrink-0`} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {s.name}
            </p>
            <p className="text-[10px] text-white/50">{s.time}</p>
          </div>
          <Clock size={12} className="text-white/30 ml-auto shrink-0" />
        </div>
      ))}
    </div>
  );
}

function InvoiceMockup() {
  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: "oklch(1 0 0 / 0.06)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
          Invoice #42
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "oklch(0.65 0.18 155 / 0.25)",
            color: "oklch(0.75 0.18 155)",
          }}
        >
          Sent
        </span>
      </div>
      {[
        { label: "Dog Walking × 3", amount: "$45.00" },
        { label: "Drop-In Visit × 1", amount: "$15.00" },
        {
          label: `Bundle discount (${BUNDLE_DISCOUNT_PERCENT}%)`,
          amount: "−$6.00",
        },
      ].map((row) => (
        <div
          key={row.label}
          className="flex justify-between text-[10px] text-white/55"
        >
          <span>{row.label}</span>
          <span className="font-semibold">{row.amount}</span>
        </div>
      ))}
      <div
        className="flex justify-between pt-1.5 mt-1.5 border-t text-xs font-bold text-white"
        style={{ borderColor: "oklch(1 0 0 / 0.12)" }}
      >
        <span>Total</span>
        <span style={{ color: "oklch(0.80 0.18 55)" }}>$54.00</span>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [60, 45, 80, 55, 90, 70, 85];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="p-1 space-y-3">
      <div className="flex items-end gap-1.5 h-14">
        {bars.map((h, i) => (
          <div
            key={labels[i]}
            className="flex-1 rounded-sm flex flex-col justify-end"
            style={{ height: "100%" }}
          >
            <div
              className="rounded-sm w-full"
              style={{
                height: `${h}%`,
                background:
                  i === 4
                    ? "linear-gradient(to top, oklch(0.72 0.18 55), oklch(0.80 0.2 45))"
                    : "oklch(0.55 0.15 265 / 0.6)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {labels.map((l) => (
          <p
            key={l}
            className="flex-1 text-center text-[9px] text-white/35 font-medium"
          >
            {l[0]}
          </p>
        ))}
      </div>
      <div
        className="rounded-lg px-3 py-1.5 flex justify-between items-center"
        style={{ background: "oklch(1 0 0 / 0.06)" }}
      >
        <span className="text-[10px] text-white/55">This week</span>
        <span
          className="text-xs font-bold"
          style={{ color: "oklch(0.80 0.18 55)" }}
        >
          $342
        </span>
      </div>
    </div>
  );
}

function CoachMockup() {
  return (
    <div className="p-1 space-y-2.5">
      <div
        className="rounded-xl p-3"
        style={{ background: "oklch(1 0 0 / 0.06)" }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-semibold text-white/70">
            Monthly Goal
          </p>
          <span
            className="text-[10px] font-bold"
            style={{ color: "oklch(0.80 0.18 55)" }}
          >
            68%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: "68%",
              background:
                "linear-gradient(to right, oklch(0.72 0.18 55), oklch(0.78 0.2 45))",
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-white/35">$340 earned</span>
          <span className="text-[9px] text-white/35">$500 goal</span>
        </div>
      </div>
      <div
        className="rounded-xl p-2.5 flex items-start gap-2.5"
        style={{
          background: "oklch(0.72 0.18 55 / 0.12)",
          borderLeft: "3px solid oklch(0.72 0.18 55)",
        }}
      >
        <Sparkles
          size={12}
          style={{ color: "oklch(0.80 0.18 55)" }}
          className="shrink-0 mt-0.5"
        />
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: "oklch(0.85 0.12 55)" }}
        >
          Add Sunday availability — you'd likely book 2 more clients this month.
        </p>
      </div>
    </div>
  );
}

function ReviewsMockup() {
  return (
    <div className="p-1 space-y-2">
      {[
        { name: "Emma K.", stars: 5, text: "Amazing with my pups!" },
        { name: "Tyler B.", stars: 5, text: "So reliable and caring." },
      ].map((r) => (
        <div
          key={r.name}
          className="rounded-xl p-2.5"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-white">{r.name}</p>
            <div className="flex gap-0.5">
              {Array.from({ length: r.stars }, (_, i) => i).map((i) => (
                <Star
                  key={i}
                  size={8}
                  fill="oklch(0.80 0.18 55)"
                  style={{ color: "oklch(0.80 0.18 55)" }}
                />
              ))}
            </div>
          </div>
          <p className="text-[9px] text-white/45">{r.text}</p>
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-lg font-bold text-white">4.9</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={10}
              fill="oklch(0.80 0.18 55)"
              style={{ color: "oklch(0.80 0.18 55)" }}
            />
          ))}
        </div>
        <span className="text-[10px] text-white/40">avg rating</span>
      </div>
    </div>
  );
}

function AvailabilityMockup() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const available = [true, true, false, true, true, true, false];
  return (
    <div className="p-1 space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={`${d}-${i}`} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-white/40 font-medium">{d}</span>
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold"
              style={{
                background: available[i]
                  ? "oklch(0.55 0.15 265 / 0.5)"
                  : "oklch(1 0 0 / 0.04)",
                border: available[i]
                  ? "1px solid oklch(0.65 0.18 265 / 0.6)"
                  : "1px solid oklch(1 0 0 / 0.08)",
                color: available[i]
                  ? "oklch(0.85 0.12 265)"
                  : "oklch(1 0 0 / 0.2)",
              }}
            >
              {available[i] ? "✓" : "–"}
            </div>
          </div>
        ))}
      </div>
      <div
        className="rounded-lg p-2 text-center"
        style={{ background: "oklch(0.55 0.15 265 / 0.15)" }}
      >
        <p className="text-[10px]" style={{ color: "oklch(0.80 0.12 265)" }}>
          5 days · 9 AM – 6 PM
        </p>
      </div>
    </div>
  );
}

function ClientsMockup() {
  return (
    <div className="p-1 space-y-2">
      {[
        { name: "The Johnson Family", bookings: 8, tag: "Repeat" },
        { name: "Carlos M.", bookings: 3, tag: "Regular" },
      ].map((c) => (
        <div
          key={c.name}
          className="flex items-center gap-2.5 rounded-xl p-2.5"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "oklch(0.55 0.15 265 / 0.5)", color: "white" }}
          >
            {c.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-white truncate">
              {c.name}
            </p>
            <p className="text-[9px] text-white/40">{c.bookings} bookings</p>
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: "oklch(0.72 0.18 55 / 0.18)",
              color: "oklch(0.80 0.18 55)",
            }}
          >
            {c.tag}
          </span>
        </div>
      ))}
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] text-white/35">Return rate</span>
        <span
          className="text-xs font-bold"
          style={{ color: "oklch(0.80 0.18 55)" }}
        >
          72%
        </span>
      </div>
    </div>
  );
}

function EarningsMockup() {
  const quarters = [
    { label: "Q1", amount: "$820" },
    { label: "Q2", amount: "$1,240" },
    { label: "Q3", amount: "$1,580" },
    { label: "Q4", amount: "$940" },
  ];
  return (
    <div className="p-1 space-y-1.5">
      {quarters.map((q) => (
        <div
          key={q.label}
          className="flex items-center justify-between rounded-lg px-2.5 py-2"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          <span className="text-[10px] font-semibold text-white/60">
            {q.label}
          </span>
          <span className="text-[10px] font-bold text-white">{q.amount}</span>
        </div>
      ))}
      <div
        className="flex justify-between px-2.5 py-1.5 rounded-lg mt-1"
        style={{ background: "oklch(0.72 0.18 55 / 0.15)" }}
      >
        <span
          className="text-[10px] font-semibold"
          style={{ color: "oklch(0.80 0.18 55)" }}
        >
          YTD Total
        </span>
        <span
          className="text-[10px] font-bold"
          style={{ color: "oklch(0.80 0.18 55)" }}
        >
          $4,580
        </span>
      </div>
    </div>
  );
}

function AdvisorMockup() {
  const items = [
    { label: "Invoice #12 not sent", color: "oklch(0.72 0.18 55)" },
    { label: "2 payments overdue", color: "oklch(0.65 0.18 25)" },
    { label: "Profile photo missing", color: "oklch(0.60 0.16 265)" },
  ];
  return (
    <div className="p-1 space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          <div
            className="w-1.5 h-5 rounded-full shrink-0"
            style={{ background: item.color }}
          />
          <p className="text-[10px] font-semibold text-white/75 flex-1 truncate">
            {item.label}
          </p>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: "oklch(0.72 0.18 55 / 0.15)",
              color: "oklch(0.82 0.16 55)",
            }}
          >
            Fix
          </span>
        </div>
      ))}
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-2"
        style={{
          background: "oklch(0.55 0.18 265 / 0.12)",
          border: "1px solid oklch(0.55 0.18 265 / 0.20)",
        }}
      >
        <Bell size={11} style={{ color: "oklch(0.70 0.14 265)" }} />
        <p className="text-[9px] text-white/50">3 items need your attention</p>
      </div>
    </div>
  );
}

function DealsMockup() {
  return (
    <div className="p-1 space-y-2">
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: "oklch(1 0 0 / 0.06)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
            Deal Offer
          </span>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: "oklch(0.72 0.18 55 / 0.20)",
              color: "oklch(0.82 0.16 55)",
            }}
          >
            3 clients
          </span>
        </div>
        <p className="text-[11px] font-semibold text-white">
          15% off your next walk! 🐾
        </p>
        <p className="text-[9px] text-white/40">
          Code: LOYAL15 · Expires in 7 days
        </p>
      </div>
      <div className="flex gap-2">
        {["Emma K.", "Carlos M.", "The Lees"].map((name) => (
          <div
            key={name}
            className="flex-1 rounded-lg py-1.5 px-1 text-center"
            style={{ background: "oklch(1 0 0 / 0.05)" }}
          >
            <div
              className="w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: "oklch(0.55 0.15 265 / 0.5)" }}
            >
              {name[0]}
            </div>
            <p className="text-[8px] text-white/40 truncate">
              {name?.split(" ")?.[0] ?? "Friend"}
            </p>
          </div>
        ))}
      </div>
      <div
        className="rounded-lg px-3 py-1.5 flex justify-between items-center"
        style={{ background: "oklch(0.72 0.18 55 / 0.10)" }}
      >
        <span className="text-[9px] text-white/50">Last offer redeemed</span>
        <span
          className="text-[9px] font-bold"
          style={{ color: "oklch(0.82 0.16 55)" }}
        >
          2×
        </span>
      </div>
    </div>
  );
}

function StorefrontMockup() {
  return (
    <div className="p-1 space-y-2">
      {/* Profile row */}
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: "oklch(1 0 0 / 0.06)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.18 265), oklch(0.42 0.20 280))",
          }}
        >
          MP
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-white truncate">
            Morgan Pawley
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={7}
                fill="oklch(0.80 0.18 55)"
                style={{ color: "oklch(0.80 0.18 55)" }}
              />
            ))}
            <span className="text-[9px] text-white/45 ml-0.5">4.9</span>
          </div>
        </div>
        <div
          className="text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.62 0.20 45))",
            color: "oklch(0.12 0.04 55)",
          }}
        >
          Book Me
        </div>
      </div>
      {/* Services */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { e: "🐕", n: "Dog Walking", p: "$20/hr" },
          { e: "🏠", n: "Drop-In", p: "$18" },
          { e: "🌙", n: "Overnight", p: "$65" },
          { e: "🛁", n: "Dog Bath", p: "$30" },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-lg p-2 flex items-center gap-1.5"
            style={{ background: "oklch(1 0 0 / 0.05)" }}
          >
            <span className="text-sm">{s.e}</span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold text-white truncate">
                {s.n}
              </p>
              <p
                className="text-[8px]"
                style={{ color: "oklch(0.82 0.16 55)" }}
              >
                {s.p}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Link chip */}
      <div
        className="rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
        style={{
          background: "oklch(0.72 0.18 55 / 0.12)",
          border: "1px solid oklch(0.72 0.18 55 / 0.25)",
        }}
      >
        <Globe size={9} style={{ color: "oklch(0.82 0.16 55)" }} />
        <span
          className="text-[9px] font-mono"
          style={{ color: "oklch(0.82 0.16 55)" }}
        >
          pawspect.co/sitter/you
        </span>
      </div>
    </div>
  );
}

function PremiumPageMockup() {
  return (
    <div className="p-1 space-y-2">
      {/* Gallery strip */}
      <div className="flex gap-1.5 h-14 overflow-hidden rounded-lg">
        {[
          "oklch(0.30 0.10 265 / 0.8)",
          "oklch(0.25 0.12 260 / 0.8)",
          "oklch(0.35 0.08 50 / 0.6)",
        ].map((bg, i) => (
          <div
            key={i}
            className="flex-1 rounded-md flex items-center justify-center text-lg"
            style={{ background: bg }}
          >
            {i === 0 ? "🐕" : i === 1 ? "🐾" : "📸"}
          </div>
        ))}
        <div
          className="flex-1 rounded-md flex items-center justify-center text-[9px] font-bold text-white/60"
          style={{ background: "oklch(1 0 0 / 0.06)" }}
        >
          +4
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Happy Clients", val: "47" },
          { label: "Visits Done", val: "210" },
          { label: "Repeat Rate", val: "72%" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg py-1.5 px-1 text-center"
            style={{ background: "oklch(1 0 0 / 0.06)" }}
          >
            <p
              className="text-xs font-extrabold"
              style={{ color: "oklch(0.82 0.16 55)" }}
            >
              {s.val}
            </p>
            <p className="text-[8px] text-white/40 leading-tight mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>
      {/* Page controls row */}
      <div
        className="rounded-xl px-3 py-2 flex items-center gap-2"
        style={{
          background: "oklch(0.55 0.18 265 / 0.12)",
          border: "1px solid oklch(0.55 0.18 265 / 0.22)",
        }}
      >
        <div
          className="w-4 h-4 rounded flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.72 0.18 55 / 0.25)" }}
        >
          <span className="text-[9px]" style={{ color: "oklch(0.82 0.16 55)" }}>
            ✓
          </span>
        </div>
        <p className="text-[9px] text-white/65 flex-1">
          Page builder — show / hide any section
        </p>
      </div>
      {/* Share row */}
      <div className="flex gap-1.5">
        {["📱 iMessage", "📸 Instagram", "🏘️ Nextdoor"].map((s) => (
          <div
            key={s}
            className="flex-1 rounded-lg py-1 text-center text-[8px] text-white/50"
            style={{ background: "oklch(1 0 0 / 0.05)" }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsMockup() {
  const members = [
    {
      initials: "BB",
      name: "Bailey B.",
      split: "60%",
      color: "oklch(0.55 0.18 265 / 0.55)",
    },
    {
      initials: "LB",
      name: "Linnea B.",
      split: "40%",
      color: "oklch(0.52 0.18 155 / 0.55)",
    },
  ];
  const messages = [
    { initials: "BB", text: "I'll handle morning drop-offs", time: "9:14 AM" },
    {
      initials: "LB",
      text: "On it for the afternoon walks 🐾",
      time: "9:16 AM",
    },
  ];
  return (
    <div className="p-1 space-y-2">
      {/* Team members + splits */}
      <div
        className="rounded-xl p-2.5 space-y-1.5"
        style={{ background: "oklch(1 0 0 / 0.06)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 mb-1">
          Team · Payout Split
        </p>
        {members.map((m) => (
          <div key={m.initials} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
              style={{ background: m.color }}
            >
              {m.initials}
            </div>
            <p className="text-[10px] font-semibold text-white flex-1 truncate">
              {m.name}
            </p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "oklch(0.72 0.18 55 / 0.18)",
                color: "oklch(0.82 0.16 55)",
              }}
            >
              {m.split}
            </span>
          </div>
        ))}
      </div>
      {/* Job thread */}
      <div
        className="rounded-xl p-2.5 space-y-1.5"
        style={{ background: "oklch(1 0 0 / 0.05)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/35 mb-1">
          Job Thread · Mon Mar 3
        </p>
        {messages.map((msg) => (
          <div key={msg.text} className="flex items-start gap-1.5">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0 mt-0.5"
              style={{ background: "oklch(0.55 0.15 265 / 0.6)" }}
            >
              {msg.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] text-white/70 leading-relaxed">
                {msg.text}
              </p>
            </div>
            <span className="text-[8px] text-white/25 shrink-0">
              {msg.time}
            </span>
          </div>
        ))}
      </div>
      {/* Duty checklist */}
      <div className="flex gap-1.5">
        {[
          { label: "Morning walk", done: true },
          { label: "Pm drop-in", done: false },
        ].map((task) => (
          <div
            key={task.label}
            className="flex-1 rounded-lg px-2 py-1.5 flex items-center gap-1.5"
            style={{ background: "oklch(1 0 0 / 0.05)" }}
          >
            <div
              className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-extrabold shrink-0"
              style={{
                background: task.done
                  ? "oklch(0.72 0.18 55 / 0.25)"
                  : "oklch(1 0 0 / 0.08)",
                border: task.done
                  ? "1px solid oklch(0.72 0.18 55 / 0.5)"
                  : "1px solid oklch(1 0 0 / 0.12)",
                color: task.done ? "oklch(0.82 0.16 55)" : "oklch(1 0 0 / 0.2)",
              }}
            >
              {task.done ? "✓" : ""}
            </div>
            <p
              className="text-[9px] truncate"
              style={{
                color: task.done ? "oklch(0.88 0.08 55)" : "oklch(1 0 0 / 0.4)",
              }}
            >
              {task.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CredentialsMockup() {
  const credentials = [
    { label: "Licensed to Operate", checked: true },
    { label: "Insured & Bonded", checked: true },
    { label: "Background Checked", checked: true },
    { label: "References Available", checked: true },
    { label: "Service Agreement", checked: false },
    { label: "Certified or Trained", checked: true },
    { label: "Professional Member", checked: false },
  ];
  return (
    <div className="p-1 space-y-1.5">
      {credentials.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5"
          style={{ background: "oklch(1 0 0 / 0.05)" }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[9px] font-extrabold"
            style={{
              background: c.checked
                ? "oklch(0.72 0.18 55 / 0.25)"
                : "oklch(1 0 0 / 0.06)",
              border: c.checked
                ? "1px solid oklch(0.72 0.18 55 / 0.50)"
                : "1px solid oklch(1 0 0 / 0.12)",
              color: c.checked ? "oklch(0.82 0.16 55)" : "oklch(1 0 0 / 0.2)",
            }}
          >
            {c.checked ? "✓" : "–"}
          </div>
          <p
            className="text-[10px] font-medium flex-1 truncate"
            style={{
              color: c.checked ? "oklch(0.88 0.08 55)" : "oklch(1 0 0 / 0.35)",
            }}
          >
            {c.label}
          </p>
        </div>
      ))}
      <div
        className="rounded-lg px-2.5 py-1.5 mt-1"
        style={{ background: "oklch(0.55 0.18 265 / 0.10)" }}
      >
        <p className="text-[9px] text-white/40 text-center">
          Self-reported · Not verified by Pawspect
        </p>
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => ReactElement> = {
  agenda: AgendaMockup,
  invoice: InvoiceMockup,
  analytics: AnalyticsMockup,
  coach: CoachMockup,
  reviews: ReviewsMockup,
  availability: AvailabilityMockup,
  clients: ClientsMockup,
  earnings: EarningsMockup,
  advisor: AdvisorMockup,
  deals: DealsMockup,
  storefront: StorefrontMockup,
  premiumPage: PremiumPageMockup,
  credentials: CredentialsMockup,
  teams: TeamsMockup,
};

export default function SitterFeaturesPage({ navigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* ── STICKY NAV ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 frosted-nav border-b shadow-sm"
        style={{ borderColor: "oklch(1 0 0 / 0.10)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            data-ocid="sitter-features.home.link"
            onClick={() => navigate("home")}
            className="flex items-center gap-2.5 font-display font-bold text-xl text-foreground hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm shadow-accent/40 shrink-0">
              <PawPrint size={17} className="text-accent-foreground" />
            </div>
            <span>{APP_NAME}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-ocid="sitter-features.login.link"
              onClick={() => navigate("login")}
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In to Portal
            </button>
            <Button
              data-ocid="sitter-features.apply.button"
              onClick={() => navigate("sitter-apply")}
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm px-5 shadow-sm shadow-accent/30"
              size="sm"
            >
              Apply Now
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {/* ── HERO ────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden min-h-[540px] sm:min-h-[620px] flex items-center"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.12 0.04 265) 0%, oklch(0.16 0.05 260) 40%, oklch(0.20 0.06 255) 100%)",
          }}
        >
          {/* Ambient glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 15% 50%, oklch(0.45 0.18 265 / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 30%, oklch(0.72 0.18 55 / 0.12) 0%, transparent 50%)",
            }}
          />
          {/* Decorative paw prints */}
          <div className="absolute top-12 right-8 opacity-[0.04] pointer-events-none hidden lg:block">
            <PawPrint size={180} className="text-white rotate-12" />
          </div>
          <div className="absolute bottom-8 left-16 opacity-[0.03] pointer-events-none hidden md:block">
            <PawPrint size={100} className="text-white -rotate-12" />
          </div>
          {/* Floating dot grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.80 0.05 265) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 w-full text-center">
            <div
              data-ocid="sitter-features.hero.badge"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 border"
              style={{
                background: "oklch(0.72 0.18 55 / 0.15)",
                borderColor: "oklch(0.72 0.18 55 / 0.40)",
                color: "oklch(0.88 0.14 55)",
              }}
            >
              <Rocket size={11} className="shrink-0" />
              The Sitter Portal — Your Business, Your Rules
            </div>
            <div
              data-ocid="sitter-features.us_only.badge"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 border"
              style={{
                background: "oklch(0.52 0.15 145 / 0.18)",
                borderColor: "oklch(0.52 0.15 145 / 0.45)",
                color: "oklch(0.82 0.12 145)",
              }}
            >
              <ShieldCheck size={11} className="shrink-0" />
              Available for US-based pet sitters only
            </div>

            <h1
              className="font-display font-extrabold leading-[1.03] mb-6 break-words"
              style={{
                fontSize: "clamp(2.6rem, 6.5vw, 5rem)",
                letterSpacing: "-0.03em",
                background:
                  "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.88) 50%, oklch(0.88 0.14 55) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Business,
              <br />
              Beautifully Managed
            </h1>

            <p className="text-white/65 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-6">
              Everything you need to run your pet sitting business — bookings,
              invoices, analytics, and coaching — in one beautiful place.
            </p>
            <p
              data-ocid="sitter-features.platform_disclaimer.notice"
              className="text-white/40 text-xs max-w-xl mx-auto leading-relaxed mb-10"
            >
              {APP_NAME} is a software platform. By using {APP_NAME}, sitters
              operate as independent professionals — not as employees or
              contractors of Data Driven Design Group, LLC.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                data-ocid="sitter-features.hero.apply_button"
                onClick={() => navigate("sitter-apply")}
                className="w-full sm:w-auto rounded-full px-10 text-base font-bold h-14 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 hover:-translate-y-1 active:scale-[0.97] transition-all duration-200"
              >
                Start Your Application
              </Button>
              <Button
                size="lg"
                variant="outline"
                data-ocid="sitter-features.hero.demo_button"
                onClick={() => navigate("sitter-demo")}
                className="w-full sm:w-auto rounded-full px-10 text-base font-semibold h-14 border-white/40 text-white bg-white/12 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              >
                See It in Action
              </Button>
              <Button
                size="lg"
                variant="outline"
                data-ocid="sitter-features.hero.signin_button"
                onClick={() => navigate("login")}
                className="w-full sm:w-auto rounded-full px-10 text-base font-semibold h-14 border-white/25 text-white bg-white/8 hover:bg-white/15 backdrop-blur-sm transition-all duration-200"
              >
                Sign In to Portal
              </Button>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ───────────────────────────────────────── */}
        <section
          className="border-y"
          style={{
            background: "oklch(0.14 0.04 265)",
            borderColor: "oklch(1 0 0 / 0.08)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {STATS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "oklch(1 0 0 / 0.07)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid oklch(1 0 0 / 0.09)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "oklch(0.72 0.18 55 / 0.18)",
                      border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                    }}
                  >
                    <Icon size={16} style={{ color: "oklch(0.82 0.16 55)" }} />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE GRID ────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 sm:mb-18">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-3">
                Everything in one place
              </p>
              <h2
                className="font-display font-extrabold tracking-tight mb-4"
                style={{
                  fontSize: "clamp(1.9rem, 4vw, 3rem)",
                }}
              >
                Built for independent pet sitters
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Every feature your business needs — designed to save time, look
                professional, and help you grow your independent pet sitting
                business.
              </p>
            </div>

            <div
              data-ocid="sitter-features.features.list"
              className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6"
            >
              {FEATURES.map(({ icon: Icon, name, desc, mockup, isNew }, i) => {
                const MockupComponent = MOCKUP_MAP[mockup];
                return (
                  <div
                    key={name}
                    data-ocid={`sitter-features.feature.item.${i + 1}`}
                    className="group rounded-3xl border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                    style={{
                      background:
                        "linear-gradient(145deg, oklch(var(--card)) 60%, oklch(var(--card)) 100%)",
                      borderColor: isNew
                        ? "oklch(0.72 0.18 55 / 0.45)"
                        : "oklch(var(--border))",
                    }}
                  >
                    {/* "New!" badge */}
                    {isNew && (
                      <div
                        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.80 0.20 45))",
                          color: "oklch(0.15 0.04 55)",
                          boxShadow: "0 2px 10px oklch(0.72 0.18 55 / 0.45)",
                        }}
                      >
                        New!
                      </div>
                    )}

                    {/* Upper — mockup preview */}
                    <div
                      className="p-5 sm:p-6"
                      style={{
                        background:
                          "linear-gradient(145deg, oklch(0.16 0.05 260) 0%, oklch(0.20 0.06 255) 100%)",
                      }}
                    >
                      <MockupComponent />
                    </div>

                    {/* Lower — copy */}
                    <div className="p-5 sm:p-6 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isNew
                              ? "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.18), oklch(0.72 0.18 55 / 0.08))"
                              : "linear-gradient(135deg, oklch(0.55 0.18 265 / 0.15), oklch(0.55 0.18 265 / 0.06))",
                            border: isNew
                              ? "1px solid oklch(0.72 0.18 55 / 0.35)"
                              : "1px solid oklch(0.55 0.18 265 / 0.25)",
                          }}
                        >
                          <Icon
                            size={18}
                            style={{
                              color: isNew ? "oklch(0.80 0.18 55)" : undefined,
                            }}
                            className={isNew ? "" : "text-primary"}
                          />
                        </div>
                        <h3 className="font-display font-bold text-lg text-foreground tracking-tight">
                          {name}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SEE YOUR PAGE IN ACTION ──────────────────────────── */}
        <section
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.12 0.04 265) 0%, oklch(0.16 0.05 260) 40%, oklch(0.20 0.06 255) 100%)",
          }}
          data-ocid="sitter-features.storefront.section"
        >
          {/* Ambient glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 60%, oklch(0.45 0.18 265 / 0.16) 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, oklch(0.72 0.18 55 / 0.12) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.80 0.05 265) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
                style={{
                  background: "oklch(0.72 0.18 55 / 0.15)",
                  borderColor: "oklch(0.72 0.18 55 / 0.40)",
                  color: "oklch(0.88 0.14 55)",
                }}
              >
                <Globe size={11} className="shrink-0" />
                New! — Public Storefront
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
                See Your Page in Action
              </h2>
              <p
                className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                style={{ color: "oklch(1 0 0 / 0.55)" }}
              >
                Every sitter gets a beautiful, shareable public page. This is
                what yours looks like to clients.
              </p>
            </div>

            {/* Two-column layout: mockup left, copy right */}
            <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-14">
              {/* Left — storefront mockup preview */}
              <div className="w-full lg:flex-1 min-w-0">
                <div
                  className="rounded-3xl overflow-hidden shadow-2xl"
                  style={{
                    background:
                      "linear-gradient(145deg, oklch(0.14 0.05 260), oklch(0.18 0.06 255))",
                    border: "1px solid oklch(1 0 0 / 0.12)",
                    boxShadow:
                      "0 8px 48px oklch(0 0 0 / 0.40), 0 0 0 1px oklch(1 0 0 / 0.06)",
                  }}
                >
                  {/* Hero */}
                  <div
                    className="relative px-6 pt-8 pb-6"
                    style={{
                      background:
                        "linear-gradient(145deg, oklch(0.12 0.04 265) 0%, oklch(0.16 0.05 260) 55%, oklch(0.20 0.06 255) 100%)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage:
                          "radial-gradient(ellipse at 15% 50%, oklch(0.45 0.18 265 / 0.14) 0%, transparent 55%)",
                      }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-lg shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.55 0.18 265), oklch(0.42 0.20 280))",
                          border: "3px solid oklch(1 0 0 / 0.15)",
                        }}
                      >
                        MP
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-extrabold text-xl text-white">
                          Morgan Pawley
                        </p>
                        <p className="text-white/55 text-sm mt-0.5">
                          Certified, insured, and passionate about pets
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={12}
                                fill="oklch(0.80 0.18 55)"
                                style={{ color: "oklch(0.80 0.18 55)" }}
                              />
                            ))}
                          </div>
                          <span
                            className="text-sm font-bold"
                            style={{ color: "oklch(0.86 0.16 55)" }}
                          >
                            4.9
                          </span>
                          <span className="text-xs text-white/40">
                            · 28 reviews
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/45">
                          <MapPin size={10} />
                          Boulder, CO
                        </div>
                      </div>
                    </div>
                    <div className="relative flex flex-wrap gap-2 mt-4">
                      {["CPR Certified", "Insured", "Top Rated"].map((b) => (
                        <span
                          key={b}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            background: "oklch(0.55 0.18 265 / 0.22)",
                            border: "1px solid oklch(0.55 0.18 265 / 0.38)",
                            color: "oklch(0.82 0.12 265)",
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="relative mt-5 rounded-full px-8 h-11 text-sm font-bold"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.62 0.20 45))",
                        color: "oklch(0.12 0.04 55)",
                        boxShadow: "0 4px 20px oklch(0.72 0.18 55 / 0.40)",
                      }}
                    >
                      Book Me
                    </button>
                  </div>

                  {/* Services grid */}
                  <div className="px-5 py-5">
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: "oklch(1 0 0 / 0.35)" }}
                    >
                      Services &amp; Pricing
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { e: "🐕", n: "Dog Walking", p: "$20/hr" },
                        { e: "🏠", n: "Drop-In Visit", p: "$18/visit" },
                        { e: "🌙", n: "Overnight Stay", p: "$65/night" },
                        { e: "🛁", n: "Dog Bath", p: "$30" },
                        { e: "🐱", n: "Cat Sitting", p: "$16/visit" },
                      ].map((s) => (
                        <div
                          key={s.n}
                          className="rounded-xl p-3 flex items-center gap-2"
                          style={{
                            background: "oklch(1 0 0 / 0.05)",
                            border: "1px solid oklch(1 0 0 / 0.08)",
                          }}
                        >
                          <span className="text-xl shrink-0">{s.e}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {s.n}
                            </p>
                            <p
                              className="text-[11px] font-bold"
                              style={{ color: "oklch(0.82 0.16 55)" }}
                            >
                              {s.p}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews snippet */}
                  <div
                    className="px-5 pb-5 border-t"
                    style={{ borderColor: "oklch(1 0 0 / 0.07)" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest mt-4 mb-3"
                      style={{ color: "oklch(1 0 0 / 0.35)" }}
                    >
                      Client Reviews
                    </p>
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: "oklch(1 0 0 / 0.05)",
                        border: "1px solid oklch(1 0 0 / 0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">
                          Sarah T.
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={9}
                              fill="oklch(0.80 0.18 55)"
                              style={{ color: "oklch(0.80 0.18 55)" }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed">
                        Morgan is absolutely wonderful with my golden retriever.
                        Always on time and sends adorable update photos!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — copy */}
              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 lg:pt-4">
                <div>
                  <h3
                    className="font-display font-extrabold leading-tight mb-4"
                    style={{
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      background:
                        "linear-gradient(to right, #ffffff, rgba(255,255,255,0.85))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Your Professional Storefront
                  </h3>
                  <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                    Every sitter gets a beautiful public page. Share it on
                    social media, text it to friends, or add it to your business
                    card. Clients can see your services, read real reviews, and
                    book with one tap — no account needed.
                  </p>
                </div>

                <ul className="space-y-3.5">
                  {[
                    "Photo gallery carousel — legal-grade photo consent built in",
                    "Live availability calendar showing your next 14 days",
                    "Stats: happy clients, visits completed, repeat client rate",
                    "Certifications & credentials badges on display",
                    "Promo offer banner — pin your current deal for clients to see",
                    "Full page builder — show or hide any section you choose",
                    "Share to Instagram, iMessage, Nextdoor in one tap",
                    "SEO-optimized — shows up when people search for pet sitters",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 mt-0.5"
                        style={{ color: "oklch(0.80 0.18 55)" }}
                      />
                      <span className="text-white/70 text-sm leading-snug">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Mock link pill */}
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: "oklch(1 0 0 / 0.06)",
                    border: "1px solid oklch(1 0 0 / 0.12)",
                  }}
                >
                  <Globe
                    size={14}
                    style={{ color: "oklch(0.75 0.14 265)" }}
                    className="shrink-0"
                  />
                  <span
                    className="text-sm font-mono flex-1 min-w-0 truncate"
                    style={{ color: "oklch(0.80 0.12 265)" }}
                  >
                    pawspect.co/sitter/your-name
                  </span>
                  <Copy
                    size={13}
                    style={{ color: "oklch(0.60 0.10 265)" }}
                    className="shrink-0"
                  />
                </div>

                <button
                  type="button"
                  data-ocid="sitter-features.storefront.apply_button"
                  onClick={() => navigate("sitter-apply")}
                  className="rounded-full px-8 h-12 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.62 0.20 45))",
                    color: "oklch(0.12 0.04 55)",
                    boxShadow: "0 4px 20px oklch(0.72 0.18 55 / 0.35)",
                  }}
                >
                  Apply to Get Your Page
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── YOUR DATA IS ALWAYS PRIVATE ─────────────────────── */}
        <section className="py-16 sm:py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              data-ocid="sitter-features.data-privacy.section"
              className="rounded-3xl overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.14 0.05 265) 0%, oklch(0.18 0.06 258) 60%, oklch(0.22 0.07 250) 100%)",
                border: "1px solid oklch(0.55 0.18 265 / 0.35)",
              }}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 80% 50%, oklch(0.55 0.18 265 / 0.15) 0%, transparent 55%)",
                }}
              />
              <div className="relative p-8 sm:p-10 lg:p-12">
                {/* Header */}
                <div className="flex items-start gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: "oklch(0.55 0.18 265 / 0.25)",
                      border: "1px solid oklch(0.55 0.18 265 / 0.40)",
                    }}
                  >
                    <ShieldCheck
                      size={22}
                      style={{ color: "oklch(0.75 0.14 265)" }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2
                        className="font-display font-extrabold text-white"
                        style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                      >
                        Your Data is Always Private
                      </h2>
                      <span
                        className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.80 0.20 45))",
                          color: "oklch(0.15 0.04 55)",
                          boxShadow: "0 2px 10px oklch(0.72 0.18 55 / 0.45)",
                        }}
                      >
                        New!
                      </span>
                    </div>
                    <p className="text-white/60 text-base leading-relaxed max-w-xl">
                      Your personal and financial data is protected at the
                      platform level — not just policy. Here&apos;s exactly how.
                    </p>
                  </div>
                </div>

                {/* Three trust points */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    {
                      icon: Lock,
                      title:
                        "Admins cannot see your personal or financial data",
                      body: "Enforced at the platform level, not just a policy. Admin access to sitter private data is blocked by default — always.",
                      color: "oklch(0.75 0.14 265)",
                      bg: "oklch(0.55 0.18 265 / 0.15)",
                      border: "oklch(0.55 0.18 265 / 0.30)",
                    },
                    {
                      icon: Shield,
                      title: "Access only with your permission",
                      body: "If you ever need support, you control when an admin can view your account. Access is automatically revoked when your ticket is closed.",
                      color: "oklch(0.80 0.18 55)",
                      bg: "oklch(0.72 0.18 55 / 0.12)",
                      border: "oklch(0.72 0.18 55 / 0.25)",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Every access event is audited",
                      body: "A complete log of every action is maintained and visible to you in your portal. Total accountability, always.",
                      color: "oklch(0.70 0.18 155)",
                      bg: "oklch(0.50 0.18 155 / 0.12)",
                      border: "oklch(0.50 0.18 155 / 0.25)",
                    },
                  ].map(({ icon: Icon, title, body, color, bg, border }) => (
                    <div
                      key={title}
                      className="rounded-2xl p-5 flex flex-col gap-3"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                        }}
                      >
                        <Icon size={18} style={{ color }} />
                      </div>
                      <p className="font-semibold text-white text-sm leading-snug">
                        {title}
                      </p>
                      <p className="text-white/55 text-xs leading-relaxed flex-1">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COACH & GROWTH DEEP DIVE ────────────────────────── */}
        <section
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.28 0.12 50) 0%, oklch(0.22 0.10 45) 40%, oklch(0.18 0.08 35) 100%)",
          }}
        >
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 80% 20%, oklch(0.72 0.20 55 / 0.20) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.90 0.10 55) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
              {/* Left — copy */}
              <div className="flex-1 min-w-0">
                <Badge
                  className="mb-6 font-semibold text-xs uppercase tracking-widest px-3 py-1.5"
                  style={{
                    background: "oklch(0.72 0.18 55 / 0.20)",
                    borderColor: "oklch(0.72 0.18 55 / 0.40)",
                    color: "oklch(0.88 0.14 55)",
                  }}
                >
                  Coach &amp; Growth
                </Badge>
                <h2
                  className="font-display font-extrabold leading-tight mb-5"
                  style={{
                    fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                    letterSpacing: "-0.025em",
                    background:
                      "linear-gradient(to right, #ffffff, rgba(255,255,255,0.85))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  More than a dashboard — it&apos;s your business coach.
                </h2>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                  The Coach &amp; Growth tab gives you the clarity and
                  motivation to build a thriving pet care business — one booking
                  at a time.
                </p>
                <ul className="space-y-4 mb-10">
                  {COACH_BULLETS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: "oklch(0.72 0.18 55 / 0.18)",
                          border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                        }}
                      >
                        <Icon
                          size={14}
                          style={{ color: "oklch(0.82 0.16 55)" }}
                        />
                      </div>
                      <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                        {text}
                      </p>
                    </li>
                  ))}
                </ul>
                <Button
                  data-ocid="sitter-features.coach.cta_button"
                  onClick={() => navigate("sitter-apply")}
                  className="group rounded-full px-8 h-12 text-sm font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  See it in action
                  <ChevronRight
                    size={15}
                    className="ml-1.5 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </div>

              {/* Right — visual panel */}
              <div className="w-full lg:w-80 shrink-0">
                <div
                  className="rounded-3xl overflow-hidden shadow-2xl"
                  style={{
                    background: "oklch(0.14 0.05 260)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                  }}
                >
                  {/* Header bar */}
                  <div
                    className="px-5 py-4 flex items-center gap-3 border-b"
                    style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "oklch(0.72 0.18 55 / 0.20)" }}
                    >
                      <Rocket
                        size={16}
                        style={{ color: "oklch(0.82 0.16 55)" }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Coach &amp; Growth
                      </p>
                      <p className="text-[10px] text-white/40">
                        Your business insights
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Goal progress */}
                    <div
                      className="rounded-2xl p-4"
                      style={{ background: "oklch(1 0 0 / 0.05)" }}
                    >
                      <div className="flex justify-between mb-2">
                        <p className="text-xs font-semibold text-white/70">
                          Monthly Earnings Goal
                        </p>
                        <span
                          className="text-xs font-bold"
                          style={{ color: "oklch(0.82 0.16 55)" }}
                        >
                          68%
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "68%",
                            background:
                              "linear-gradient(to right, oklch(0.72 0.18 55), oklch(0.80 0.20 45))",
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-white/35">
                          $340 this month
                        </span>
                        <span className="text-[10px] text-white/35">
                          $500 goal
                        </span>
                      </div>
                    </div>

                    {/* Insight card */}
                    <div
                      className="rounded-2xl p-4 space-y-2.5"
                      style={{
                        background: "oklch(0.72 0.18 55 / 0.10)",
                        border: "1px solid oklch(0.72 0.18 55 / 0.20)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          size={13}
                          style={{ color: "oklch(0.82 0.16 55)" }}
                        />
                        <p
                          className="text-[11px] font-bold"
                          style={{ color: "oklch(0.82 0.16 55)" }}
                        >
                          Growth Insight
                        </p>
                      </div>
                      <p className="text-[11px] text-white/65 leading-relaxed">
                        Your top service is Dog Walking. Consider offering a
                        morning bundle — clients who book 3+ walks get{" "}
                        {BUNDLE_DISCOUNT_PERCENT}% off.
                      </p>
                    </div>

                    {/* Milestone */}
                    <div
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style={{ background: "oklch(1 0 0 / 0.05)" }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "oklch(0.72 0.18 55 / 0.22)" }}
                      >
                        <Star
                          size={14}
                          fill="oklch(0.80 0.18 55)"
                          style={{ color: "oklch(0.80 0.18 55)" }}
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white">
                          25 Bookings Completed 🎉
                        </p>
                        <p className="text-[9px] text-white/40">
                          Milestone reached this month
                        </p>
                      </div>
                    </div>

                    {/* Savings tip */}
                    <div
                      className="rounded-2xl p-3 flex items-center gap-3"
                      style={{
                        background: "oklch(0.55 0.18 265 / 0.12)",
                        border: "1px solid oklch(0.55 0.18 265 / 0.22)",
                      }}
                    >
                      <Wallet
                        size={14}
                        style={{ color: "oklch(0.70 0.16 265)" }}
                        className="shrink-0"
                      />
                      <p className="text-[10px] text-white/65 leading-relaxed">
                        Save 20% of each payment → reach $1K savings by October.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────── */}
        <section
          className="py-20 sm:py-24"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.12 0.03 265) 0%, oklch(0.15 0.04 255) 100%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-3">
                From sitters like you
              </p>
              <h2
                className="font-display font-extrabold tracking-tight"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  background:
                    "linear-gradient(to right, #ffffff, rgba(255,255,255,0.80))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Sitters love the portal
              </h2>
            </div>
            <div
              data-ocid="sitter-features.testimonials.list"
              className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  data-ocid={`sitter-features.testimonial.item.${i + 1}`}
                  className="rounded-3xl p-6 sm:p-7 flex flex-col gap-4"
                  style={{
                    background: "oklch(1 0 0 / 0.05)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    WebkitBackdropFilter: "blur(16px) saturate(180%)",
                    border: "1px solid oklch(1 0 0 / 0.10)",
                    boxShadow: "0 4px 32px oklch(0 0 0 / 0.20)",
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }, (_, k) => k).map((k) => (
                      <Star
                        key={k}
                        size={14}
                        fill="oklch(0.80 0.18 55)"
                        style={{ color: "oklch(0.80 0.18 55)" }}
                      />
                    ))}
                  </div>

                  <p className="text-white/70 text-sm sm:text-base leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.location}</p>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{
                        background: "oklch(0.55 0.18 265 / 0.20)",
                        border: "1px solid oklch(0.55 0.18 265 / 0.30)",
                      }}
                    >
                      <PawPrint
                        size={10}
                        style={{ color: "oklch(0.70 0.14 265)" }}
                      />
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: "oklch(0.70 0.14 265)" }}
                      >
                        {APP_NAME}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING & TRIAL ─────────────────────────────────── */}
        <section
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.10 0.03 265) 0%, oklch(0.13 0.04 258) 100%)",
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 100%, oklch(0.72 0.18 55 / 0.10) 0%, transparent 65%), radial-gradient(ellipse at 20% 20%, oklch(0.45 0.18 265 / 0.10) 0%, transparent 55%)",
            }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-3">
                Simple, transparent pricing
              </p>
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
                No tiers. No hidden fees.
              </h2>
              <p className="text-white/55 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                Just one simple plan — everything included, cancel anytime.
              </p>
            </div>

            {/* Main pricing card */}
            <div
              data-ocid="sitter-features.pricing.card"
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: "oklch(1 0 0 / 0.06)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid oklch(1 0 0 / 0.12)",
                boxShadow:
                  "0 8px 64px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.12)",
              }}
            >
              <div className="p-8 sm:p-10 lg:p-12">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16">
                  {/* Left — price display */}
                  <div className="shrink-0 text-center lg:text-left">
                    {/* Trial badge */}
                    <div
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border"
                      style={{
                        background: "oklch(0.72 0.18 55 / 0.15)",
                        borderColor: "oklch(0.72 0.18 55 / 0.40)",
                        color: "oklch(0.88 0.14 55)",
                      }}
                    >
                      <Sparkles size={11} className="shrink-0" />
                      30-Day Free Trial
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-1 justify-center lg:justify-start mb-1">
                      <span
                        className="font-display font-extrabold leading-none"
                        style={{
                          fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                          background:
                            "linear-gradient(135deg, oklch(0.88 0.18 55), oklch(0.78 0.20 45))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        ${SUBSCRIPTION_PRICE_MONTHLY}
                      </span>
                      <span className="text-white/50 text-base font-medium pb-3">
                        /mo
                      </span>
                    </div>
                    <p className="text-white/40 text-sm">
                      after your free trial
                    </p>
                  </div>

                  {/* Divider */}
                  <div
                    className="hidden lg:block w-px self-stretch"
                    style={{ background: "oklch(1 0 0 / 0.10)" }}
                  />
                  <div
                    className="lg:hidden w-full h-px"
                    style={{ background: "oklch(1 0 0 / 0.10)" }}
                  />

                  {/* Right — feature list */}
                  <div className="flex-1 min-w-0">
                    <ul className="space-y-3.5">
                      {[
                        "Full access to every feature — no feature gating",
                        "Unlimited bookings, invoices, and client records",
                        "Coach & Growth business insights included",
                        "No platform fees on any of your earnings",
                        "Cancel anytime, no contracts or lock-in",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <CheckCircle2
                            size={17}
                            className="shrink-0 mt-0.5"
                            style={{ color: "oklch(0.80 0.18 55)" }}
                          />
                          <span className="text-white/75 text-sm sm:text-base leading-snug">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA row */}
                <div
                  className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center gap-4 justify-between"
                  style={{ borderColor: "oklch(1 0 0 / 0.10)" }}
                >
                  <Button
                    size="lg"
                    data-ocid="sitter-features.pricing.apply_button"
                    onClick={() => navigate("sitter-apply")}
                    className="w-full sm:w-auto rounded-full px-10 text-base font-bold h-13 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200"
                  >
                    Start Free Trial
                  </Button>
                  <p className="text-white/35 text-xs text-center sm:text-right max-w-xs leading-relaxed">
                    No credit card required for trial.
                    <br />
                    Subscription activates only after 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── YOUR DATA YOUR CONTROL ──────────────────────────── */}
        <section
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.11 0.04 265) 0%, oklch(0.14 0.05 260) 60%, oklch(0.17 0.06 255) 100%)",
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 80% 30%, oklch(0.55 0.18 265 / 0.14) 0%, transparent 55%), radial-gradient(ellipse at 20% 70%, oklch(0.72 0.18 55 / 0.08) 0%, transparent 55%)",
            }}
          />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <ShieldCheck size={11} className="shrink-0" />
                New! — Tenant-Secure Data
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
                Your Data, Your Control
              </h2>
              <p
                className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                style={{ color: "oklch(1 0 0 / 0.55)" }}
              >
                Sitter data is tenant-secure. Admins cannot access your personal
                or financial information — ever.
              </p>
            </div>

            {/* Three trust pillar cards */}
            <div
              data-ocid="sitter-features.data-control.section"
              className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10"
            >
              {[
                {
                  icon: Download,
                  title: "Download Anytime",
                  body: "Export your complete business data — bookings, invoices, client records, and profile — as a downloadable file, whenever you want. Your data belongs to you.",
                  color: "oklch(0.80 0.18 55)",
                  bg: "oklch(0.72 0.18 55 / 0.12)",
                  border: "oklch(0.72 0.18 55 / 0.25)",
                },
                {
                  icon: Lock,
                  title: "Fully Private",
                  body: "Admins see only aggregate platform stats. Your personal data, earnings, and client records are private to you. Zero admin access without your explicit permission.",
                  color: "oklch(0.75 0.14 265)",
                  bg: "oklch(0.55 0.18 265 / 0.15)",
                  border: "oklch(0.55 0.18 265 / 0.30)",
                },
                {
                  icon: Database,
                  title: "You Stay in Control",
                  body: "If you ever need to leave, your data leaves with you. Anonymize your account or take a full export with one tap. No lock-in. No hoops to jump through.",
                  color: "oklch(0.70 0.18 155)",
                  bg: "oklch(0.50 0.18 155 / 0.12)",
                  border: "oklch(0.50 0.18 155 / 0.25)",
                },
              ].map(({ icon: Icon, title, body, color, bg, border }) => (
                <div
                  key={title}
                  data-ocid={`sitter-features.data-control.card.${title.toLowerCase().replace(/\s+/g, "_")}`}
                  className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <Icon size={22} style={{ color }} />
                  </div>
                  <p className="font-bold text-white text-base leading-snug">
                    {title}
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed flex-1">
                    {body}
                  </p>
                </div>
              ))}
            </div>

            {/* Additional trust detail */}
            <div
              className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5"
              style={{
                background: "oklch(1 0 0 / 0.05)",
                border: "1px solid oklch(1 0 0 / 0.10)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "oklch(0.55 0.18 265 / 0.20)",
                  border: "1px solid oklch(0.55 0.18 265 / 0.35)",
                }}
              >
                <Shield size={18} style={{ color: "oklch(0.75 0.14 265)" }} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-white">
                  Admin access only with your permission — and it&apos;s fully
                  audited
                </p>
                <p className="text-sm text-white/55 leading-relaxed">
                  If you ever need admin assistance, you open a support ticket
                  that grants temporary, scoped access. The moment your ticket
                  is resolved, access is automatically revoked. Every action is
                  logged in a full audit trail visible to you in your portal.
                  Total accountability, always.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <SitterPortalFAQ />

        {/* ── FULL SITTER Q&A LINK ────────────────────────────── */}
        <section
          className="py-10 sm:py-12 border-t"
          style={{
            background: "oklch(0.12 0.04 265)",
            borderColor: "oklch(1 0 0 / 0.08)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: "oklch(0.80 0.18 55)" }}
              >
                More questions?
              </p>
              <p className="text-white/60 text-sm sm:text-base max-w-sm leading-relaxed">
                Visit the full Sitter Q&amp;A — deep answers on billing, data
                security, the portal, and how {APP_NAME} empowers your business.
              </p>
            </div>
            <button
              type="button"
              data-ocid="sitter-features.sitter_faq.link"
              onClick={() => navigate("sitter-faq")}
              className="group shrink-0 inline-flex items-center gap-2 rounded-full px-6 h-12 text-sm font-bold transition-all hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.62 0.20 45))",
                color: "oklch(0.12 0.04 55)",
                boxShadow: "0 4px 20px oklch(0.72 0.18 55 / 0.35)",
              }}
            >
              Sitter Help Center →
            </button>
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────── */}
        <section
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.14 0.05 265) 0%, oklch(0.18 0.06 260) 50%, oklch(0.22 0.07 255) 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 0%, oklch(0.72 0.18 55 / 0.12) 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <PawPrint
                size={40}
                className="mx-auto mb-6 opacity-30"
                style={{ color: "oklch(0.80 0.18 55)" }}
              />
              <h2
                className="font-display font-extrabold leading-tight mb-5"
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  letterSpacing: "-0.025em",
                  background:
                    "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.88) 60%, oklch(0.88 0.14 55) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Ready to run your business the smart way?
              </h2>
              <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Join a platform built to help pet sitters look professional,
                grow their client base, and get paid effortlessly.
              </p>
            </div>

            <Button
              size="lg"
              data-ocid="sitter-features.final.apply_button"
              onClick={() => navigate("sitter-apply")}
              className="w-full sm:w-auto rounded-full px-14 text-base font-bold h-16 bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl shadow-accent/40 hover:-translate-y-1 active:scale-[0.97] transition-all duration-200"
            >
              Apply to Become a Sitter
            </Button>

            <div className="mt-6">
              <button
                type="button"
                data-ocid="sitter-features.final.signin_link"
                onClick={() => navigate("login")}
                className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/75 transition-colors hover:underline underline-offset-4"
              >
                Already a sitter? Sign in to your portal
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: "oklch(0.11 0.03 265)",
          borderColor: "oklch(1 0 0 / 0.07)",
        }}
        className="text-white/55 py-10 px-4 pb-20 md:pb-10 border-t"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <PawPrint size={14} className="text-accent" />
            </div>
            <span className="font-display font-bold text-white text-lg">
              {APP_NAME}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate("home")}
              className="text-xs hover:text-white transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate("sitter-apply")}
              className="text-xs hover:text-white transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => navigate("login")}
              className="text-xs hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("terms")}
              className="text-xs hover:text-white transition-colors"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => navigate("privacy")}
              className="text-xs hover:text-white transition-colors"
            >
              Privacy
            </button>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/55 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
