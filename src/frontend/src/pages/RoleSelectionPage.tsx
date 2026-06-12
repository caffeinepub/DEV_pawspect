import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  LayoutDashboard,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import type { View } from "../App";
import { APP_NAME } from "../config/business";
import { useCallerProfile } from "../hooks/useQueries";

interface Props {
  navigate: (view: View) => void;
}

export default function RoleSelectionPage({ navigate }: Props) {
  const { data: profile } = useCallerProfile();
  const firstName = profile?.name?.split(" ")?.[0] ?? "Friend";

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 frosted-nav">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity min-h-[44px]"
          >
            <ArrowLeft size={16} /> Home
          </button>
          <div className="flex items-center gap-2 font-display font-bold text-sm text-foreground">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <PawPrint size={14} className="text-accent-foreground" />
            </div>
            {APP_NAME}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 pb-24 md:pb-12">
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-center mb-10"
          >
            {/* Paw icon */}
            <div
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.45 0.18 265), oklch(0.55 0.20 270))",
                boxShadow: "0 12px 40px oklch(0.45 0.18 265 / 0.35)",
              }}
            >
              <PawPrint size={34} className="text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
              Welcome back,{" "}
              <span
                style={{
                  background:
                    "linear-gradient(to right, oklch(0.45 0.18 265), oklch(0.72 0.18 55))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {firstName}!
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Where would you like to go today?
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admin Dashboard card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <button
                type="button"
                data-ocid="role.admin.button"
                onClick={() => navigate("admin-dashboard")}
                className="w-full group rounded-2xl border border-border bg-card p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                style={{
                  backdropFilter: "blur(12px) saturate(160%)",
                  WebkitBackdropFilter: "blur(12px) saturate(160%)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.45 0.18 265 / 0.15), oklch(0.55 0.20 270 / 0.25))",
                    border: "1px solid oklch(0.45 0.18 265 / 0.30)",
                  }}
                >
                  <ShieldCheck size={22} className="text-primary" />
                </div>
                <h2 className="font-display font-bold text-lg text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Admin Dashboard
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage sitters, review applications, view bookings, and access
                  analytics.
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Open Admin Panel →
                </div>
              </button>
            </motion.div>

            {/* Sitter Portal card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <button
                type="button"
                data-ocid="role.sitter.button"
                onClick={() => navigate("sitter-dashboard")}
                className="w-full group rounded-2xl border border-border bg-card p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{
                  backdropFilter: "blur(12px) saturate(160%)",
                  WebkitBackdropFilter: "blur(12px) saturate(160%)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.72 0.18 55 / 0.15), oklch(0.78 0.20 40 / 0.25))",
                    border: "1px solid oklch(0.72 0.18 55 / 0.35)",
                  }}
                >
                  <LayoutDashboard
                    size={22}
                    style={{ color: "oklch(0.72 0.18 55)" }}
                  />
                </div>
                <h2 className="font-display font-bold text-lg text-foreground mb-1.5 group-hover:text-accent transition-colors">
                  My Sitter Portal
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage your bookings, update your profile, view invoices, and
                  track your earnings.
                </p>
                <div
                  className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ color: "oklch(0.72 0.18 55)" }}
                >
                  Open Sitter Portal →
                </div>
              </button>
            </motion.div>
          </div>

          {/* Quick sign-out option */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("home")}
              className="text-muted-foreground text-sm rounded-full min-h-[44px]"
            >
              Go to Homepage
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
