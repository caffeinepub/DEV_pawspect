import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Gift,
  Heart,
  Home,
  PawPrint,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import type { View } from "../App";
import { APP_NAME, SUBSCRIPTION_PRICE_MONTHLY } from "../config/business";

interface Props {
  navigate: (view: View) => void;
}

const INFO_ROWS = [
  {
    icon: Clock,
    iconColor: "text-amber-300",
    bgColor: "bg-amber-500/10 border-amber-400/20",
    title: "Application Under Review",
    body: "Our team personally reviews each application to ensure every sitter meets our standards. We'll be in touch within 1–3 business days.",
  },
  {
    icon: Gift,
    iconColor: "text-emerald-300",
    bgColor: "bg-emerald-500/10 border-emerald-400/20",
    title: "30-Day Free Trial on Approval",
    body: "Once approved, your account is fully unlocked for 30 days at no cost. Explore every feature, take bookings, and grow your business.",
  },
  {
    icon: CreditCard,
    iconColor: "text-sky-300",
    bgColor: "bg-sky-500/10 border-sky-400/20",
    title: "Simple Pricing After Your Trial",
    body: `Continue growing your pet sitting business for just $${SUBSCRIPTION_PRICE_MONTHLY}/month — cancel anytime. No annual commitment required.`,
  },
  {
    icon: Shield,
    iconColor: "text-violet-300",
    bgColor: "bg-violet-500/10 border-violet-400/20",
    title: "Insurance & Safe Interactions Required",
    body: `As an independent service provider on ${APP_NAME}, you are required to carry adequate pet care insurance and maintain safe, professional interactions with every client.`,
  },
  {
    icon: PawPrint,
    iconColor: "text-pink-300",
    bgColor: "bg-pink-500/10 border-pink-400/20",
    title: "Pet Sitting Services Only",
    body: `${APP_NAME} is exclusively a pet sitting services platform. Use of this platform for any other purpose is strictly prohibited.`,
  },
  {
    icon: AlertTriangle,
    iconColor: "text-red-300",
    bgColor: "bg-red-500/10 border-red-400/20",
    title: "Zero Tolerance for Misuse",
    body: "Any detected misuse of the platform — including but not limited to fraud, inappropriate conduct, or services outside the allowed scope — will result in immediate account termination.",
  },
];

export default function ApplicationConfirmation({ navigate }: Props) {
  const bgStyle = {
    background:
      "linear-gradient(135deg, oklch(0.28 0.18 265) 0%, oklch(0.35 0.22 280) 50%, oklch(0.40 0.16 255) 100%)",
  };

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={bgStyle}
      data-ocid="apply-confirmation.page"
    >
      {/* Header */}
      <header className="py-5 px-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate("home")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors min-h-[44px]"
          data-ocid="apply-confirmation.back_button"
        >
          <ArrowLeft size={15} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 pb-24 md:pb-12">
        <div className="w-full max-w-lg space-y-5">
          {/* ── Hero success area ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 220,
                damping: 12,
                delay: 0.15,
              }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.72 0.18 55 / 0.30) 0%, oklch(0.72 0.18 55 / 0.08) 70%)",
                boxShadow: "0 0 48px oklch(0.72 0.18 55 / 0.35)",
              }}
            >
              <CheckCircle
                size={52}
                className="text-amber-300 drop-shadow-lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                Application Submitted!
              </h1>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-sm mx-auto">
                You're one step closer to building your pet sitting business.
                We'll review your application and be in touch soon.
              </p>
            </motion.div>

            {/* Warm separator */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="h-px w-24 mx-auto rounded-full"
              style={{ background: "oklch(0.72 0.18 55 / 0.50)" }}
            />
          </motion.div>

          {/* ── Info rows ── */}
          <div className="space-y-3">
            {INFO_ROWS.map((row, i) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={row.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-sm ${row.bgColor}`}
                  style={{ background: undefined }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10 border border-white/10">
                    <Icon size={18} className={row.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm mb-0.5 leading-snug">
                      {row.title}
                    </p>
                    <p className="text-white/65 text-sm leading-relaxed">
                      {row.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Heart note ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex items-center justify-center gap-2 text-white/45 text-xs pt-1"
          >
            <Heart size={12} className="text-pink-400 shrink-0" />
            <span>We're excited to potentially have you in our community</span>
            <Heart size={12} className="text-pink-400 shrink-0" />
          </motion.div>

          {/* ── CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            <Button
              data-ocid="apply-confirmation.primary_button"
              className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
              style={{
                backgroundColor: "oklch(0.72 0.18 55)",
                color: "#1a1a2e",
              }}
              onClick={() => navigate("home")}
            >
              <Home size={18} className="shrink-0" />
              Return to Home
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
