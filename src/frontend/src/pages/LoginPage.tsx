import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import { APP_NAME } from "../config/business";
import {
  useAllSitters,
  useCallerProfile,
  useIsAdmin,
  useSaveProfile,
} from "../hooks/useQueries";

interface Props {
  navigate: (view: View) => void;
}

const BENEFITS = [
  {
    icon: Fingerprint,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "One tap. You're in.",
    desc: "Face ID, Touch ID, or Windows Hello — exactly like unlocking your phone.",
  },
  {
    icon: Shield,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    title: "Nothing to steal.",
    desc: "Your login lives on your device. There's no password in a database that can be breached.",
  },
  {
    icon: Lock,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Phishing-proof by design.",
    desc: `Fake sites can't trick you — your device only authenticates on the real ${APP_NAME}.`,
  },
  {
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Faster than any password.",
    desc: 'No typing, no resetting, no "forgot password" — ever again.',
  },
];

const COMPARISON = [
  {
    traditional: "Can be stolen in a data breach",
    passkey: "Nothing to steal — login lives on your device",
  },
  {
    traditional: "Easy to forget or lose",
    passkey: "Never forgotten — your face is your password",
  },
  {
    traditional: "Vulnerable to phishing attacks",
    passkey: "Phishing-proof by cryptographic design",
  },
  {
    traditional: "Requires email verification",
    passkey: "Instant sign-in, no email needed",
  },
  {
    traditional: "Reused across sites = huge risk",
    passkey: `Unique to ${APP_NAME}, always`,
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Smartphone,
    title: 'Tap "Sign In Securely"',
    desc: "A small security popup appears — like signing into your bank.",
  },
  {
    step: "2",
    icon: Fingerprint,
    title: "Verify with your device",
    desc: "Use Face ID, Touch ID, or Windows Hello. Takes about 2 seconds.",
  },
  {
    step: "3",
    icon: CheckCircle2,
    title: "You're in",
    desc: "Instantly authenticated. No password, no wait, no hassle.",
  },
];

export default function LoginPage({ navigate }: Props) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: allSitters = [] } = useAllSitters();
  const saveProfile = useSaveProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setSaved(true);
      setJustSaved(true);
    }
  }, [profile]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!justSaved || adminLoading) return;
    const timer = setTimeout(() => {
      if (isAdmin) {
        // Marcus Berggren is admin-only — always routes straight to admin
        if (profile?.name === "Marcus Berggren") {
          navigate("admin-dashboard");
          return;
        }
        // Any admin who also has a sitter profile gets role selection
        const principal = identity?.getPrincipal().toString();
        const hasSitterProfile = principal
          ? (allSitters as Array<{ owner?: { toString(): string } }>).some(
              (s) => s.owner?.toString() === principal,
            )
          : false;
        // Fallback: name-based dual-role for Linnea/Bailey (survives redeploys)
        const isDualRoleByName =
          profile?.name === "Linnea Berggren" ||
          profile?.name === "Bailey Berggren";
        if (hasSitterProfile || isDualRoleByName) {
          navigate("role-selection");
        } else {
          navigate("admin-dashboard");
        }
      } else {
        // Default to home; user can navigate from there
        navigate("home");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    justSaved,
    isAdmin,
    adminLoading,
    profile,
    identity,
    allSitters,
    navigate,
  ]);

  // Fallback: if still loading admin status after 6s, redirect to home
  useEffect(() => {
    if (!justSaved) return;
    const fallback = setTimeout(() => {
      navigate("home");
    }, 6000);
    return () => clearTimeout(fallback);
  }, [justSaved, navigate]);

  const handleSave = async () => {
    setSaveError("");
    try {
      await saveProfile.mutateAsync({
        name,
        email: email || undefined,
        role: "user",
      });
      setSaved(true);
      setJustSaved(true);
      toast.success(`Welcome to ${APP_NAME}!`);
      queryClient.invalidateQueries({ queryKey: ["is-admin"] });
    } catch (err) {
      // Surface the specific backend error text (e.g. {err: "Canister is stopped"})
      const raw = err instanceof Error ? err.message : String(err);
      // Strip noise prefixes from backend rejection messages
      const clean = raw
        .replace(/^Error:\s*/i, "")
        .replace(/^Reject text:\s*/i, "")
        .trim();
      setSaveError(
        clean ||
          "Unable to save your profile. Please check your connection and try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 frosted-nav">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-sm text-primary hover:opacity-80 transition-opacity min-h-[44px]"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <span className="font-display font-semibold text-xs sm:text-sm text-muted-foreground truncate ml-4">
            Sitter &amp; Admin Portal
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-16 pb-24 md:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left — Trust & Value (hidden on mobile when logged in — card is primary) */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`space-y-6 lg:space-y-8 ${identity ? "hidden lg:block" : ""}`}
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                <ShieldCheck size={13} />
                <span className="break-words">
                  Trusted by pet care professionals
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                The most secure way
                <br />
                <span className="text-primary">to sign in.</span>
                <br />
                <span className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground">
                  No password needed.
                </span>
              </h1>
              <p className="mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                {APP_NAME} uses the same technology as Apple Pay and Face ID —
                your identity never leaves your device, and it can never be
                stolen.
              </p>
            </div>

            {/* Benefit cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                  className="bg-card rounded-2xl border border-border p-4 flex gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${b.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <b.icon size={16} className={b.color} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground">
                      {b.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {b.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-sm text-foreground mb-4">
                How it works — 3 steps, 3 seconds
              </h3>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground">
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowComparison((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline min-h-[44px]"
              >
                {showComparison ? (
                  <>
                    <X size={14} /> Hide comparison
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} /> Why is this better than a password?
                  </>
                )}
              </button>

              <AnimatePresence>
                {showComparison && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                      <div className="grid grid-cols-2 bg-muted/50">
                        <div className="px-3 sm:px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <X size={11} className="text-red-500 shrink-0" />
                          <span className="truncate">Traditional</span>
                        </div>
                        <div className="px-3 sm:px-4 py-2.5 text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2
                            size={11}
                            className="text-emerald-500 shrink-0"
                          />
                          <span className="truncate">{APP_NAME}</span>
                        </div>
                      </div>
                      {COMPARISON.map((row) => (
                        <div
                          key={row.traditional}
                          className="grid grid-cols-2 border-t border-border"
                        >
                          <div className="px-3 sm:px-4 py-3 text-xs text-muted-foreground flex items-start gap-1.5">
                            <X
                              size={12}
                              className="text-red-400 flex-shrink-0 mt-0.5"
                            />
                            <span>{row.traditional}</span>
                          </div>
                          <div className="px-3 sm:px-4 py-3 text-xs text-foreground bg-emerald-50/50 flex items-start gap-1.5">
                            <CheckCircle2
                              size={12}
                              className="text-emerald-500 flex-shrink-0 mt-0.5"
                            />
                            <span>{row.passkey}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right — Sign-in card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-card rounded-3xl border border-border shadow-xl p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {!identity ? (
                  <motion.div
                    key="pre-login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Icon */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                        <Fingerprint
                          size={28}
                          className="text-primary-foreground"
                        />
                      </div>
                      <h2 className="font-display text-2xl font-bold">
                        Sign in to {APP_NAME}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        For sitters and admins
                      </p>
                    </div>

                    {/* Primary CTA — full width on all screens */}
                    <div className="space-y-3">
                      <Button
                        data-ocid="login.primary_button"
                        onClick={login}
                        disabled={isLoggingIn}
                        className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-base font-bold shadow-lg shadow-primary/20 gap-2"
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2
                              size={18}
                              className="animate-spin shrink-0"
                            />
                            Verifying your identity...
                          </>
                        ) : (
                          <>
                            <Fingerprint size={18} className="shrink-0" />
                            Sign In with Face ID / Touch ID
                          </>
                        )}
                      </Button>

                      <p className="text-center text-xs text-muted-foreground">
                        A popup will open. Tap your fingerprint or face.
                        <br />
                        <span className="font-medium text-foreground">
                          Takes about 3 seconds.
                        </span>
                      </p>
                    </div>

                    {/* Trust indicators */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                      {[
                        { icon: Lock, label: "End-to-end\nencrypted" },
                        { icon: Shield, label: "No password\nstored" },
                        { icon: ShieldCheck, label: "Phishing-\nproof" },
                      ].map((t) => (
                        <div
                          key={t.label}
                          className="bg-muted/40 rounded-xl p-2 sm:p-3 text-center"
                        >
                          <t.icon
                            size={16}
                            className="text-primary mx-auto mb-1"
                          />
                          <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground whitespace-pre-line leading-tight">
                            {t.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-center text-muted-foreground/70 leading-relaxed">
                      When you click Sign In, a security dialog will appear from
                      our auth provider. This is normal and expected.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="post-login"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5"
                  >
                    {/* Verified badge */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 flex items-center gap-3 border border-emerald-200 dark:border-emerald-700/40">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          ✓ You&apos;re verified
                        </p>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5 truncate">
                          ID: {identity.getPrincipal().toString().slice(0, 18)}
                          ...
                        </p>
                      </div>
                    </div>

                    {profileLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-10 bg-muted rounded-xl" />
                        <div className="h-10 bg-muted rounded-xl" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-display font-bold text-lg">
                            {saved
                              ? "Welcome back!"
                              : `Welcome to ${APP_NAME}!`}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {saved
                              ? "Your profile is all set."
                              : "Just a few details to get you started."}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="login-name">Your Name</Label>
                            <Input
                              data-ocid="login.name.input"
                              id="login-name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Sarah Johnson"
                              className="rounded-xl h-11 text-base"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="login-email">
                              Email{" "}
                              <span className="text-muted-foreground font-normal">
                                (optional, for booking alerts)
                              </span>
                            </Label>
                            <Input
                              data-ocid="login.email.input"
                              id="login-email"
                              type="email"
                              inputMode="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="rounded-xl h-11 text-base"
                            />
                          </div>
                        </div>

                        <Button
                          data-ocid="login.save_button"
                          onClick={handleSave}
                          disabled={saveProfile.isPending || !name}
                          className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-semibold"
                        >
                          {saveProfile.isPending ? (
                            <>
                              <Loader2
                                size={14}
                                className="mr-2 animate-spin"
                              />
                              Saving...
                            </>
                          ) : (
                            "Continue →"
                          )}
                        </Button>
                        {saveError && (
                          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                            <p className="text-sm text-destructive font-medium leading-snug">
                              {saveError}
                            </p>
                            <Button
                              data-ocid="login.retry.button"
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSaveError("");
                                handleSave();
                              }}
                              className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-8 px-4"
                            >
                              Try Again
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {saved && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 border-t border-border pt-4"
                      >
                        <Button
                          data-ocid="login.dashboard.button"
                          onClick={() => {
                            if (isAdmin) {
                              if (profile?.name === "Marcus Berggren") {
                                navigate("admin-dashboard");
                                return;
                              }
                              const principal = identity
                                ?.getPrincipal()
                                .toString();
                              const hasSitterProfile = principal
                                ? (
                                    allSitters as Array<{
                                      owner?: { toString(): string };
                                    }>
                                  ).some(
                                    (s) => s.owner?.toString() === principal,
                                  )
                                : false;
                              const isDualRoleByName =
                                profile?.name === "Linnea Berggren" ||
                                profile?.name === "Bailey Berggren";
                              navigate(
                                hasSitterProfile || isDualRoleByName
                                  ? "role-selection"
                                  : "admin-dashboard",
                              );
                            } else {
                              navigate("sitter-dashboard");
                            }
                          }}
                          className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 gap-2"
                        >
                          {isAdmin
                            ? "Open Admin Dashboard"
                            : "Open My Dashboard"}
                          <ArrowRight size={16} />
                        </Button>
                        {!isAdmin && (
                          <Button
                            variant="ghost"
                            onClick={() => navigate("admin-dashboard")}
                            className="w-full rounded-2xl text-muted-foreground text-sm gap-1 min-h-[44px]"
                            data-ocid="login.admin_panel.button"
                          >
                            <ShieldCheck size={14} /> Go to Admin Panel
                          </Button>
                        )}
                        <Button
                          data-ocid="login.logout.button"
                          onClick={clear}
                          variant="ghost"
                          className="w-full rounded-2xl text-muted-foreground text-sm min-h-[44px]"
                        >
                          Sign out
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Social proof below card */}
            <p className="text-center text-xs text-muted-foreground mt-4 px-4">
              The same passkey technology used by Apple, Google, and Microsoft.
              <br />
              <span className="font-medium text-foreground">
                Trusted by millions worldwide.
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
