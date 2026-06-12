import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Eye,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Moon,
  PawPrint,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { View } from "../App";
import { APP_NAME, SERVICES_LIST } from "../config/business";

const POPULAR_SERVICES = SERVICES_LIST.slice(0, 7).map((label) => ({
  label,
  filter: label.toLowerCase(),
}));

const TRUST_ITEMS = [
  {
    icon: Star,
    label: "Reviewed & Rated",
    sub: "Real client reviews on every sitter",
  },
  {
    icon: Heart,
    label: "Independent Sitters",
    sub: "Self-employed pet care professionals",
  },
  {
    icon: CalendarCheck,
    label: "Flexible Booking",
    sub: "Cancel or change anytime",
  },
  {
    icon: ShieldCheck,
    label: "US-Based Only",
    sub: "US pet sitters only",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Calendar,
    title: "Tell Us When",
    desc: "Pick your dates, service type, and preferred time window.",
  },
  {
    step: "02",
    icon: Heart,
    title: "Pick Your Sitter",
    desc: "Browse available sitters, read real reviews, and choose your favorite.",
  },
  {
    step: "03",
    icon: Star,
    title: "Enjoy Peace of Mind",
    desc: "Track every visit in real-time. Your sitter logs check-ins and completions live.",
  },
];

const WHY_FEATURES = [
  {
    icon: Zap,
    title: "Book in 60 Seconds",
    body: "No account, no password. Just your phone or email. Find a sitter, pick your dates, done.",
  },
  {
    icon: Eye,
    title: "Know Your Sitter",
    body: "Read real reviews, see their profile, and schedule a meet & greet before committing.",
  },
  {
    icon: RefreshCw,
    title: "Real-Time Updates",
    body: "Track your pet care as it happens. Your sitter logs check-ins, notes, and completions live.",
  },
  {
    icon: Receipt,
    title: "Invoices & Payments",
    body: "Every booking comes with a clear invoice. Pay how you prefer — cash, Venmo, Apple Pay.",
  },
  {
    icon: ShieldCheck,
    title: "Platform Transparency",
    body: `${APP_NAME} is a software platform only. Your service agreement is directly with your independently operating sitter — we provide the tools.`,
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    body: "Message your sitter directly through the platform or use the contact info they provide.",
  },
];

interface Props {
  navigate: (view: View, sitterId?: bigint) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
}

export default function HomePage({ navigate, darkMode, setDarkMode }: Props) {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 frosted-nav transition-all duration-300 ${
          scrolled ? "shadow-md" : "shadow-none border-b-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-2.5 font-display font-bold text-xl text-foreground hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm shadow-accent/40 shrink-0">
              <PawPrint size={17} className="text-accent-foreground" />
            </div>
            <span className="truncate">{APP_NAME}</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              {
                label: "Find a Sitter",
                action: () => navigate("find-sitters"),
              },
              {
                label: "My Bookings",
                action: () => navigate("booking-lookup"),
              },
              { label: "Sitter Portal", action: () => navigate("login") },
              { label: "Client FAQ", action: () => navigate("client-faq") },
            ].map(({ label, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="relative px-4 py-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                {label}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
              </button>
            ))}
            <button
              type="button"
              data-ocid="home.sitter_features.link"
              onClick={() => navigate("sitter-features")}
              className="relative ml-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.18), oklch(0.78 0.20 45 / 0.12))",
                borderColor: "oklch(0.72 0.18 55 / 0.55)",
                color: "oklch(0.72 0.18 55)",
                boxShadow: "0 0 12px oklch(0.72 0.18 55 / 0.18)",
              }}
            >
              <Star size={11} className="shrink-0" fill="oklch(0.72 0.18 55)" />
              For Sitters
            </button>
            <button
              type="button"
              data-ocid="home.sitter_apply.link"
              onClick={() => navigate("sitter-apply")}
              className="relative px-4 py-2 text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              Become a Sitter
              <span className="absolute bottom-1 left-4 right-4 h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full" />
            </button>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {setDarkMode && (
              <button
                type="button"
                data-ocid="nav.dark_mode.toggle"
                onClick={() => setDarkMode(!darkMode)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                aria-label={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <Button
              data-ocid="home.find_sitter.nav_button"
              onClick={() => navigate("find-sitters")}
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm px-5 shadow-sm shadow-accent/30"
              size="sm"
            >
              Find a Sitter
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {/* ── HERO — cinematic full-bleed ───────────────────────── */}
        <section className="relative overflow-hidden min-h-[560px] sm:min-h-[700px] lg:min-h-[860px] flex items-end sm:items-center">
          {/* Photography layer */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80"
              alt="A happy golden retriever and cat together — your pets are in good hands"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
              loading="eager"
              fetchPriority="high"
            />
            {/* Multi-stop cinematic overlay — rich bottom-left, transparent top-right */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(120deg, oklch(0.10 0.04 260 / 0.96) 0%, oklch(0.14 0.05 260 / 0.88) 30%, oklch(0.18 0.04 260 / 0.65) 60%, oklch(0.20 0.03 260 / 0.25) 100%)",
              }}
            />
            {/* Bottom vignette for text contrast */}
            <div
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  "linear-gradient(to top, oklch(0.10 0.04 260 / 0.80) 0%, transparent 100%)",
              }}
            />
          </div>

          {/* Decorative paw — ambient */}
          <div className="absolute top-16 right-12 opacity-[0.06] pointer-events-none hidden lg:block">
            <PawPrint size={96} className="text-white rotate-12" />
          </div>

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-24 sm:py-24 lg:py-32 w-full">
            <div className="max-w-2xl w-full animate-fade-in-up">
              {/* Single eyebrow pill */}
              <div className="flex mb-6">
                <div
                  data-ocid="home.no_account.badge"
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    background: "oklch(0.72 0.18 55 / 0.20)",
                    borderColor: "oklch(0.72 0.18 55 / 0.50)",
                    color: "oklch(0.95 0.10 55)",
                  }}
                >
                  <Zap size={11} className="shrink-0" />
                  No account needed · Book in 60 seconds
                </div>
              </div>

              {/* Headline — editorial scale */}
              <h1
                className="font-display font-extrabold leading-[1.02] mb-5 break-words"
                style={{
                  fontSize: "clamp(3rem, 7vw, 5.5rem)",
                  letterSpacing: "-0.03em",
                  background:
                    "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.92) 55%, oklch(0.92 0.14 55) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "none",
                  filter: "drop-shadow(0 2px 24px oklch(0 0 0 / 0.35))",
                }}
              >
                Pet Care,
                <br />
                Perfected.
              </h1>

              <p className="text-white/90 text-lg sm:text-xl max-w-xl leading-relaxed mb-8 animate-fade-in-up animate-delay-100">
                Find passionate, trusted sitters in your neighborhood. Book in
                minutes, track every visit in real-time.
              </p>

              {/* CTA buttons — premium sizing */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-0 animate-fade-in-up animate-delay-200">
                <Button
                  size="lg"
                  data-ocid="home.find_sitter.button"
                  onClick={() => navigate("find-sitters")}
                  className="w-full sm:w-auto rounded-full px-9 text-base font-bold h-14 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 hover:shadow-2xl hover:shadow-accent/50 hover:-translate-y-1 active:scale-[0.97] transition-all duration-200"
                >
                  Find a Sitter
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  data-ocid="home.sitter_apply.button"
                  onClick={() => navigate("sitter-apply")}
                  className="w-full sm:w-auto rounded-full px-8 text-base font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm h-14 transition-all duration-200"
                >
                  Become a Sitter
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => navigate("booking-lookup")}
                  className="w-full sm:w-auto rounded-full px-6 text-base font-medium text-white/75 hover:text-white hover:bg-white/10 h-14"
                >
                  Track My Booking →
                </Button>
              </div>
              {/* Sitter portal call-to-action */}
              <div className="mt-6">
                <button
                  type="button"
                  data-ocid="home.sitter_features.link"
                  onClick={() => navigate("sitter-features")}
                  className="group inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: "oklch(0.72 0.18 55 / 0.15)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    WebkitBackdropFilter: "blur(16px) saturate(180%)",
                    border: "1px solid oklch(0.72 0.18 55 / 0.40)",
                    color: "oklch(0.92 0.14 55)",
                    boxShadow: "0 4px 16px oklch(0.72 0.18 55 / 0.18)",
                  }}
                >
                  <Star size={13} className="shrink-0" fill="currentColor" />
                  Running a pet sitting business? See your portal
                  <ChevronRight
                    size={14}
                    className="shrink-0 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce hidden sm:flex flex-col items-center gap-1">
            <ChevronDown size={22} className="text-white/50" />
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────────── */}
        <section className="bg-card border-y border-border/40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-0 divide-y-0 md:divide-x md:divide-border/40">
              {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 sm:gap-4 px-0 md:px-6 first:pl-0 last:pr-0 min-w-0"
                >
                  <div className="w-11 h-11 rounded-2xl bg-accent/12 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-foreground leading-tight truncate">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SITTER HIGHLIGHT BAND ────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(100deg, oklch(0.18 0.08 265) 0%, oklch(0.22 0.10 260) 50%, oklch(0.28 0.10 50) 100%)",
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 80% 50%, oklch(0.72 0.18 55 / 0.14) 0%, transparent 55%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-12">
              {/* Left — headline */}
              <div className="text-center lg:text-left min-w-0">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: "oklch(0.80 0.16 55)" }}
                >
                  For Sitters
                </p>
                <h3
                  className="font-display font-extrabold leading-tight"
                  style={{
                    fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
                    letterSpacing: "-0.02em",
                    background:
                      "linear-gradient(to right, #ffffff, rgba(255,255,255,0.80))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Your business, beautifully managed — with a premium public
                  storefront.
                </h3>
              </div>

              {/* Center — 4 feature teasers */}
              <div className="flex flex-row gap-4 sm:gap-6 shrink-0">
                {[
                  { icon: Calendar, label: "Smart Agenda" },
                  { icon: Receipt, label: "Pro Invoicing" },
                  { icon: BarChart3, label: "Business Coach" },
                  { icon: Globe, label: "Premium Page" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: "oklch(0.72 0.18 55 / 0.18)",
                        border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                      }}
                    >
                      <Icon
                        size={16}
                        style={{ color: "oklch(0.82 0.16 55)" }}
                      />
                    </div>
                    <p className="text-[11px] sm:text-xs font-semibold text-white/70 whitespace-nowrap">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right — CTA */}
              <div className="shrink-0">
                <button
                  type="button"
                  data-ocid="home.sitter_highlight.cta_button"
                  onClick={() => navigate("sitter-features")}
                  className="group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl whitespace-nowrap"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
                    color: "oklch(0.12 0.02 50)",
                    boxShadow: "0 4px 20px oklch(0.72 0.18 55 / 0.40)",
                  }}
                >
                  <BookOpen size={14} className="shrink-0" />
                  Explore the Sitter Portal
                  <ChevronRight
                    size={14}
                    className="shrink-0 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────── */}
        <section className="py-20 sm:py-24 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-3">
                Simple as 1-2-3
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                How It Works
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 relative">
              {/* Amber connector line — desktop */}
              <div
                className="hidden sm:block absolute top-9 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px z-0"
                style={{
                  background:
                    "linear-gradient(to right, oklch(0.72 0.18 55 / 0.4), oklch(0.72 0.18 55 / 0.7), oklch(0.72 0.18 55 / 0.4))",
                }}
              />
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }) => (
                <div
                  key={step}
                  className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 sm:text-center flex-1 bg-card rounded-2xl p-6 sm:p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 z-10"
                >
                  {/* Editorial ghost number */}
                  <div
                    className="absolute top-4 right-5 font-display font-extrabold text-6xl leading-none pointer-events-none select-none"
                    style={{ color: "oklch(var(--foreground) / 0.04)" }}
                  >
                    {step}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 sm:mx-auto sm:mb-5 shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.2 35))",
                      boxShadow: "0 8px 24px oklch(0.72 0.18 55 / 0.35)",
                    }}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl text-foreground mb-2">
                      {title}
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY PAWSPECT — dark section ──────────────────── */}
        <section
          id="why-pawspect"
          className="py-20 sm:py-28 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.12 0.03 265) 0%, oklch(0.15 0.04 255) 50%, oklch(0.18 0.04 270) 100%)",
          }}
        >
          {/* Ambient radial glow — amber at top-center */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none opacity-10"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.72 0.18 55) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 80%, oklch(0.55 0.18 255 / 0.15) 0%, transparent 55%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <p className="text-accent font-semibold text-xs uppercase tracking-widest mb-4">
                Built for you
              </p>
              <h2
                className="font-display font-extrabold tracking-tight mb-4"
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                  background:
                    "linear-gradient(to right, #ffffff, rgba(255,255,255,0.85), oklch(0.90 0.14 55))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Why {APP_NAME}?
              </h2>
              <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Everything you need, nothing you don&apos;t.
              </p>
            </div>

            <div
              data-ocid="why.features.list"
              className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
            >
              {WHY_FEATURES.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  data-ocid={`why.feature.item.${i + 1}`}
                  className="group rounded-2xl p-5 sm:p-7 border transition-all duration-300 hover:-translate-y-2 cursor-default"
                  style={{
                    background: "oklch(1 0 0 / 0.05)",
                    backdropFilter: "blur(16px) saturate(180%)",
                    WebkitBackdropFilter: "blur(16px) saturate(180%)",
                    borderColor: "oklch(1 0 0 / 0.10)",
                    boxShadow: "0 4px 24px oklch(0 0 0 / 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "oklch(1 0 0 / 0.10)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "oklch(1 0 0 / 0.18)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "oklch(1 0 0 / 0.05)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "oklch(1 0 0 / 0.10)";
                  }}
                >
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.25), oklch(0.72 0.18 55 / 0.12))",
                      border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                    }}
                  >
                    <Icon size={19} style={{ color: "oklch(0.88 0.14 55)" }} />
                  </div>
                  <h3
                    className="font-display font-bold mb-2 text-white"
                    style={{ fontSize: "0.975rem", letterSpacing: "-0.01em" }}
                  >
                    {title}
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── POPULAR SERVICES ─────────────────────────────────── */}
        <section className="section-gap max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-16 sm:pt-20">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Popular Services
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
                Everything your pet needs, all in one place
              </p>
            </div>
          </div>
          {/* Filter tab strip with background tray */}
          <div className="bg-muted/30 rounded-2xl p-2 inline-flex flex-wrap gap-2">
            <button
              type="button"
              data-ocid="services.filter.tab"
              onClick={() => setServiceFilter("all")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                serviceFilter === "all"
                  ? "bg-accent text-accent-foreground shadow-sm shadow-accent/30"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              All Services
            </button>
            {POPULAR_SERVICES.map((svc) => (
              <button
                key={svc.filter}
                type="button"
                data-ocid={`services.${svc.filter.replace(/[^a-z0-9]/g, "_")}.tab`}
                onClick={() =>
                  setServiceFilter(
                    serviceFilter === svc.filter ? "all" : svc.filter,
                  )
                }
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  serviceFilter === svc.filter
                    ? "bg-accent text-accent-foreground shadow-sm shadow-accent/30"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {svc.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── FIND A SITTER CTA — replaces sitter grid ─────────── */}
        <section
          id="sitters-section"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
        >
          <div
            data-ocid="home.find_sitters.section"
            className="relative overflow-hidden rounded-3xl p-8 sm:p-12 md:p-16 text-center border"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.05 265 / 0.95) 0%, oklch(0.18 0.07 260 / 0.95) 50%, oklch(0.20 0.08 255 / 0.95) 100%)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderColor: "oklch(1 0 0 / 0.10)",
              boxShadow:
                "0 0 0 1px oklch(1 0 0 / 0.05), 0 24px 64px oklch(0 0 0 / 0.30)",
            }}
          >
            {/* Decorative amber glow */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 70% 30%, oklch(0.72 0.18 55 / 0.15) 0%, transparent 60%)",
              }}
            />
            {/* Decorative indigo glow */}
            <div
              className="absolute inset-0 pointer-events-none rounded-3xl"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 80%, oklch(0.55 0.18 255 / 0.18) 0%, transparent 55%)",
              }}
            />

            {/* Floating paw prints — decorative */}
            <div className="absolute top-6 left-6 opacity-[0.07] pointer-events-none hidden sm:block">
              <PawPrint size={48} className="text-white rotate-[-15deg]" />
            </div>
            <div className="absolute bottom-6 right-8 opacity-[0.07] pointer-events-none hidden sm:block">
              <PawPrint size={36} className="text-white rotate-[20deg]" />
            </div>

            <div className="relative">
              {/* Eyebrow pill */}
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    background: "oklch(0.72 0.18 55 / 0.18)",
                    borderColor: "oklch(0.72 0.18 55 / 0.45)",
                    color: "oklch(0.92 0.14 55)",
                  }}
                >
                  <MapPin size={11} className="shrink-0" />
                  Local, trusted, independent sitters
                </div>
                <div
                  data-ocid="home.us_only.badge"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    background: "oklch(0.52 0.15 145 / 0.18)",
                    borderColor: "oklch(0.52 0.15 145 / 0.45)",
                    color: "oklch(0.82 0.12 145)",
                  }}
                >
                  <ShieldCheck size={11} className="shrink-0" />
                  US-based sitters only
                </div>
              </div>

              {/* Headline */}
              <h2
                className="font-display font-extrabold mb-4 tracking-tight"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  background:
                    "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.90) 60%, oklch(0.92 0.14 55) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.03em",
                }}
              >
                Find Your Perfect Sitter
              </h2>

              <p className="text-white/65 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-8">
                Enter your zip code to discover trusted independent sitters in
                your area. No account required.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-9">
                {[
                  "Filter by service",
                  "Filter by date",
                  "Read real reviews",
                  "Book in minutes",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="text-xs font-medium px-3 py-1.5 rounded-full text-white/60"
                    style={{
                      background: "oklch(1 0 0 / 0.07)",
                      border: "1px solid oklch(1 0 0 / 0.12)",
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {/* Primary CTA */}
              <Button
                size="lg"
                data-ocid="home.find_sitters_near_me.button"
                onClick={() => navigate("find-sitters")}
                className="rounded-full px-10 text-base font-bold h-14 shadow-2xl hover:-translate-y-1 active:scale-[0.97] transition-all duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.72 0.18 55), oklch(0.78 0.20 45))",
                  color: "oklch(0.12 0.02 50)",
                  boxShadow:
                    "0 8px 32px oklch(0.72 0.18 55 / 0.45), 0 2px 8px oklch(0 0 0 / 0.20)",
                }}
              >
                <Search size={18} className="mr-2 shrink-0" />
                Find Sitters Near Me
              </Button>

              <p className="mt-4 text-white/35 text-xs max-w-md mx-auto leading-relaxed">
                {APP_NAME} is a software platform. Sitters on this platform are
                independent professionals — not employees, contractors, or
                agents of {APP_NAME}. All service arrangements are between the
                sitter and client.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA BANNER — Become a Sitter ─────────────────────── */}
        <section className="py-16 sm:py-20 relative overflow-hidden">
          {/* Premium deep gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.30 0.12 255) 0%, oklch(0.25 0.10 265) 45%, oklch(0.38 0.14 40) 100%)",
            }}
          />
          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 75% 40%, oklch(0.72 0.18 55 / 0.22) 0%, transparent 60%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 tracking-tight">
              Ready to find your perfect pet sitter?
            </h2>
            <p className="text-white/65 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Connect with passionate, caring sitters who treat your pets like
              family.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
              <Button
                size="lg"
                data-ocid="home.find_sitter_cta.button"
                onClick={() => navigate("find-sitters")}
                className="w-full sm:w-auto rounded-full px-9 font-bold text-base h-14 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                Browse Sitters
              </Button>
              <Button
                size="lg"
                variant="outline"
                data-ocid="home.sitter_apply.button"
                onClick={() => navigate("sitter-apply")}
                className="w-full sm:w-auto rounded-full px-9 font-semibold text-base border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm h-14"
              >
                Become a Sitter
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer
        style={{ backgroundColor: "oklch(0.13 0.04 265)" }}
        className="text-white/60 py-12 sm:py-14 px-4 pb-20 md:pb-14"
      >
        {/* Top gradient border */}
        <div
          className="h-px w-full mb-10 sm:mb-12"
          style={{
            background:
              "linear-gradient(to right, transparent, oklch(0.72 0.18 55 / 0.3), transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            {/* Brand */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <PawPrint size={16} className="text-accent" />
                </div>
                <span className="font-display font-bold text-white text-2xl truncate">
                  {APP_NAME}
                </span>
              </div>
              <p className="text-sm text-white/45 max-w-xs leading-relaxed">
                Software tools for independent pet sitters — connecting pet
                owners with local, self-employed professionals. {APP_NAME} does
                not employ, supervise, or guarantee any sitter or service.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-full md:w-auto">
              <div>
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">
                  For Pet Owners
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    data-ocid="footer.find_sitters.link"
                    onClick={() => navigate("find-sitters")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Find a Sitter
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("booking-lookup")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Track Booking
                  </button>
                  <button
                    type="button"
                    data-ocid="footer.client_faq.link"
                    onClick={() => navigate("client-faq")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Client Q&amp;A
                  </button>
                </div>
              </div>
              <div>
                <p className="text-white/35 text-xs font-semibold uppercase tracking-widest mb-4">
                  For Sitters
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    data-ocid="footer.sitter_features.link"
                    onClick={() => navigate("sitter-features")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Sitter Portal Overview
                  </button>
                  <button
                    type="button"
                    data-ocid="home.sitter_apply.link"
                    onClick={() => navigate("sitter-apply")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Become a Sitter
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("login")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Sitter Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("login")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    data-ocid="footer.sitter_faq.link"
                    onClick={() => navigate("sitter-faq")}
                    className="text-sm text-left hover:text-white transition-colors"
                  >
                    Sitter Q&amp;A
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-xs text-white/30">
                © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </p>
              <button
                type="button"
                onClick={() => navigate("terms")}
                className="text-xs text-white/35 hover:text-white/65 underline transition-colors"
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                onClick={() => navigate("privacy")}
                className="text-xs text-white/35 hover:text-white/65 underline transition-colors"
              >
                Privacy Policy
              </button>
            </div>
            <p className="text-xs text-white/30">
              Built with love using{" "}
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
        </div>
      </footer>
    </div>
  );
}
