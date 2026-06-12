import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Dog,
  DollarSign,
  HandshakeIcon,
  Heart,
  Lock,
  PawPrint,
  Share2,
  Shield,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { View } from "../App";
import type { Public } from "../backend.d";
import LegalModal from "../components/LegalModal";
import { PhotoUpload } from "../components/PhotoUpload";
import { APP_NAME, SERVICES_LIST } from "../config/business";
import {
  useAllSitters,
  useCreateSitter,
  useSaveProfile,
} from "../hooks/useQueries";

// Legal versioning — increment when Terms or Privacy Policy are updated
import { TERMS_VERSION } from "./TermsPage";

const SERVICES = SERVICES_LIST.filter(
  (s) => !["Small Pet Care", "Bird Care"].includes(s),
);

const EXPERIENCE_OPTIONS = [
  { value: "<1", label: "Less than 1 year" },
  { value: "1-2", label: "1–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years" },
];

interface Props {
  navigate: (view: View) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  photoUrl: string;
  services: string[];
  hourlyRate: string;
  experience: string;
  ownPets: string;
  whyApplying: string;
  ref1Name: string;
  ref1Contact: string;
  ref2Name: string;
  ref2Contact: string;
  yearsExperience: string;
  certifications: string;
  languages: string;
  homeEnvironment: string;
  birthdate: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  photoUrl: "",
  services: [],
  hourlyRate: "",
  experience: "",
  ownPets: "",
  whyApplying: "",
  ref1Name: "",
  ref1Contact: "",
  ref2Name: "",
  ref2Contact: "",
  yearsExperience: "",
  certifications: "",
  languages: "",
  homeEnvironment: "",
  birthdate: "",
};

// Step 1 = Attestation, Step 2 = Your Info, Step 3 = Experience & Fit, Step 4 = Services & Rates
const STEP_LABELS = [
  "Before You Apply",
  "Your Info",
  "Experience & Fit",
  "Services & Rates",
];
const TOTAL_STEPS = 4;

const STEP_CONFIG = [
  { label: "Before You Apply", icon: Shield },
  { label: "Your Info", icon: User },
  { label: "Experience & Fit", icon: Heart },
  { label: "Services & Rates", icon: DollarSign },
];

/** Compact step indicator — progress bar on mobile, full labels on sm+ */
function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      {/* Mobile: "Step N of 4" + progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/70">
            Step {step} of {total}
          </span>
          <span className="text-xs font-bold text-white">
            {STEP_LABELS[step - 1]}
          </span>
        </div>
        <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-300 rounded-full transition-all duration-500"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step labels with icons */}
      <div className="hidden sm:flex items-center justify-center gap-1">
        {STEP_CONFIG.map((s, i) => {
          const Icon = s.icon;
          const isActive = i + 1 === step;
          const isDone = i + 1 < step;
          return (
            <div key={s.label} className="flex items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                </div>
                <span
                  className={`text-[9px] font-medium whitespace-nowrap ${
                    isActive ? "text-amber-300" : "text-white/40"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < total - 1 && (
                <div
                  className={`w-7 h-0.5 mb-4 rounded-full ${
                    isDone ? "bg-emerald-500" : "bg-white/15"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SitterApplicationPage({ navigate }: Props) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: allSitters = [] } = useAllSitters();
  const createSitter = useCreateSitter();
  const saveProfile = useSaveProfile();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  // Step 1 attestation state
  const [attestedAge, setAttestedAge] = useState(false);
  const [attestedInsurance, setAttestedInsurance] = useState(false);
  const [attestedPlatform, setAttestedPlatform] = useState(false);
  const [attestedNonEmployment, setAttestedNonEmployment] = useState(false);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(
    null,
  );

  const principal = identity?.getPrincipal();
  const myProfile = principal
    ? (allSitters as Public[]).find(
        (s) => s.owner?.toString() === principal.toString(),
      )
    : undefined;

  const set = (key: keyof FormData, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (svc: string) => {
    set(
      "services",
      form.services.includes(svc)
        ? form.services.filter((s) => s !== svc)
        : [...form.services, svc],
    );
  };

  // Age validation: must be >= 18
  const birthdateAge = (() => {
    if (!form.birthdate) return null;
    const dob = new Date(form.birthdate);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  })();
  const birthdateValid = birthdateAge !== null && birthdateAge >= 18;
  const birthdateError =
    form.birthdate && !birthdateValid
      ? "You must be at least 18 years old to apply as a sitter."
      : null;

  const handleSubmit = async () => {
    const refs = [
      form.ref1Name && `${form.ref1Name} (${form.ref1Contact})`,
      form.ref2Name && `${form.ref2Name} (${form.ref2Contact})`,
    ]
      .filter(Boolean)
      .join(" | ");

    const extraDetails = [
      form.yearsExperience
        ? `Years of Experience: ${form.yearsExperience}`
        : "",
      form.certifications
        ? `Certifications & Training: ${form.certifications}`
        : "",
      form.languages ? `Languages Spoken: ${form.languages}` : "",
      form.homeEnvironment ? `Home Environment: ${form.homeEnvironment}` : "",
    ].filter(Boolean);

    const fullBio = [
      form.bio,
      "",
      "--- Application Details ---",
      `Experience: ${form.experience}`,
      `Own pets: ${form.ownPets === "yes" ? "Yes" : "No"}`,
      `Why ${APP_NAME}: ${form.whyApplying}`,
      refs ? `References: ${refs}` : "",
      ...extraDetails,
      "",
      `--- Agreements (Terms v${TERMS_VERSION}) ---`,
      `Non-employment acknowledged: ${attestedNonEmployment ? "Yes" : "No"}`,
      `Terms accepted: ${agreedToTerms ? "Yes" : "No"}`,
      `Privacy accepted: ${agreedToPrivacy ? "Yes" : "No"}`,
    ]
      .filter((l) => l !== "")
      .join("\n");

    try {
      await createSitter.mutateAsync({
        name: form.name,
        bio: fullBio,
        location: form.location,
        photoUrl: form.photoUrl,
        services: form.services,
        hourlyRate: BigInt(Math.round(Number(form.hourlyRate))),
        phone: form.phone.replace(/\D/g, ""),
        birthdate: form.birthdate
          ? BigInt(new Date(form.birthdate).getTime()) * 1_000_000n
          : undefined,
      } as Parameters<typeof createSitter.mutateAsync>[0]);
      // Store email in UserProfile so it appears on client-facing invoices/emails
      if (form.email.trim()) {
        await saveProfile.mutateAsync({
          name: form.name,
          role: "user",
          email: form.email.trim(),
        });
      }
      navigate("apply-confirmation");
    } catch {
      // error surfaced via createSitter.isError
    }
  };

  const bgStyle = {
    background:
      "linear-gradient(135deg, oklch(0.28 0.18 265) 0%, oklch(0.35 0.22 280) 50%, oklch(0.40 0.16 255) 100%)",
  };

  // --- NOT LOGGED IN ---
  if (!identity) {
    return (
      <div
        className="min-h-screen flex flex-col overflow-x-hidden"
        style={bgStyle}
      >
        <header className="py-5 px-4">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12 pb-24 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-5">
                <PawPrint size={32} className="text-white" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Join Our Sitter Community
              </h1>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                Turn your passion for pets into a rewarding side income.
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-6">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-white/80 mb-5 text-center">
                  To apply, you'll need to verify your identity with a secure
                  passkey — no password required.
                </p>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    {
                      icon: Shield,
                      title: "Phishing-proof",
                      desc: "Your account can't be hacked or stolen",
                    },
                    {
                      icon: Zap,
                      title: "One tap to sign in",
                      desc: "Face ID or fingerprint — instant access",
                    },
                    {
                      icon: Lock,
                      title: "No password to remember",
                      desc: "The same tech used by Apple & Google",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Icon size={15} className="text-amber-300" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-white/60">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  data-ocid="sitter-apply.primary_button"
                  className="w-full rounded-xl font-bold text-base h-14"
                  style={{
                    backgroundColor: "oklch(0.72 0.18 55)",
                    color: "#1a1a2e",
                  }}
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield size={18} className="shrink-0" />
                      Sign In with Face ID / Touch ID
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 justify-center text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 shrink-0" /> Top
                sitters earn $1,200/mo
              </span>
              <span className="flex items-center gap-1">
                <Dog size={12} className="shrink-0" /> Flexible schedule
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} className="text-rose-400 shrink-0" /> Do what
                you love
              </span>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // --- SUCCESS / ALREADY HAS PROFILE ---
  if (myProfile) {
    const isApproved = myProfile?.isActive ?? false;
    const displayName = myProfile?.name || "you";
    const appDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div
        className="min-h-screen flex flex-col overflow-x-hidden"
        style={bgStyle}
      >
        <header className="py-5 px-4">
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12 pb-24 md:pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-5"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 10,
                  stiffness: 200,
                  delay: 0.1,
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-emerald-500/20"
              >
                <CheckCircle2 size={44} className="text-emerald-400" />
              </motion.div>

              <Badge
                data-ocid="sitter-apply.success_state"
                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-sm font-bold px-4 py-1.5 mb-4"
              >
                {isApproved ? "✓ Approved!" : "✓ Application Submitted!"}
              </Badge>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                {isApproved
                  ? `Welcome, ${displayName}!`
                  : "Application Received!"}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                {isApproved
                  ? "Congratulations! Your profile is live. Clients can now discover and book you."
                  : "Your application is under review. You'll be notified once approved."}
              </p>
            </div>

            {!isApproved && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-5 space-y-3">
                  <p className="text-white/80 text-sm font-semibold">
                    What happens next:
                  </p>
                  {[
                    {
                      icon: CheckCircle2,
                      label: "Application received",
                      done: true,
                      color: "text-emerald-400",
                    },
                    {
                      icon: Clock,
                      label: "Admin review (1–3 business days)",
                      done: false,
                      color: "text-amber-400",
                    },
                    {
                      icon: PawPrint,
                      label: "Check status via your Sitter Portal",
                      done: false,
                      color: "text-white/50",
                    },
                    {
                      icon: Star,
                      label: "Once approved, you'll appear in search",
                      done: false,
                      color: "text-white/50",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <Icon size={16} className={`${item.color} shrink-0`} />
                        <span
                          className={`text-sm ${item.done ? "text-emerald-300 font-medium" : "text-white/70"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {!isApproved && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Candidate Card
                    </p>
                    <Share2 size={13} className="text-white/30" />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-lg font-display">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-white text-base truncate">
                        {displayName}
                      </p>
                      <p className="text-white/50 text-xs">
                        {APP_NAME} Sitter Candidate
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-white/40 text-xs">
                    <Calendar size={12} className="shrink-0" />
                    <span>Applied {appDate}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {isApproved ? (
                <Button
                  data-ocid="sitter-apply.primary_button"
                  className="w-full rounded-full h-14 font-bold text-base"
                  style={{
                    backgroundColor: "oklch(0.72 0.18 55)",
                    color: "#1a1a2e",
                  }}
                  onClick={() => navigate("sitter-dashboard")}
                >
                  Go to My Dashboard
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  data-ocid="sitter-apply.primary_button"
                  className="w-full rounded-full h-14 font-bold text-base"
                  style={{
                    backgroundColor: "oklch(0.72 0.18 55)",
                    color: "#1a1a2e",
                  }}
                  onClick={() => navigate("sitter-dashboard")}
                >
                  <PawPrint size={16} className="mr-2 shrink-0" />
                  Go to Sitter Portal
                </Button>
              )}
              <Button
                data-ocid="sitter-apply.secondary_button"
                variant="outline"
                className="w-full rounded-full h-12 font-semibold border-white/30 text-white bg-white/10 hover:bg-white/20"
                onClick={() => navigate("home")}
              >
                Back to Home
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // --- APPLICATION FORM ---

  // Step 1 (Attestation): all four boxes must be checked
  const canProceedStep1 =
    attestedAge &&
    attestedInsurance &&
    attestedPlatform &&
    attestedNonEmployment;

  // Step 2 (Your Info)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canProceedStep2 =
    form.name.trim() &&
    emailValid &&
    form.location.trim().length === 5 &&
    /^\d{5}$/.test(form.location.trim()) &&
    form.bio.trim() &&
    form.phone.trim() &&
    form.birthdate &&
    birthdateValid;

  // Step 3 (Experience & Fit)
  const canProceedStep3 =
    form.experience && form.ownPets && form.whyApplying.trim();

  // Step 4 (Services & Rates)
  const canSubmit =
    form.services.length > 0 &&
    form.hourlyRate &&
    agreedToTerms &&
    agreedToPrivacy;

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={bgStyle}
    >
      <header className="py-5 px-4">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : navigate("home"))}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">
            {step > 1 ? "Back" : "Back to Home"}
          </span>
        </button>
      </header>

      <main className="flex-1 px-4 py-4 sm:py-6 flex flex-col items-center pb-24 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-white/20">
              <Sparkles size={13} className="text-amber-300 shrink-0" />
              Sitter Application
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              Join Our Sitter Community
            </h1>
          </div>

          <StepIndicator step={step} total={TOTAL_STEPS} />

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {/* ── STEP 1: Before You Apply (Attestation) ── */}
                {step === 1 && (
                  <motion.div
                    key="step1-attestation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {/* Header */}
                    <div
                      className="rounded-xl p-4 border"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(217,119,6,0.20) 0%, rgba(217,119,6,0.08) 100%)",
                        borderColor: "rgba(217,119,6,0.50)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                          <AlertTriangle size={20} className="text-amber-300" />
                        </div>
                        <div>
                          <h2 className="font-display text-base font-bold text-white leading-tight">
                            Before You Apply
                          </h2>
                          <p className="text-xs text-amber-300/80 font-medium">
                            Required attestations — please read carefully
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {APP_NAME} is a technology platform that connects pet
                        owners with independent sitters. Before continuing, you
                        must confirm the following. All four items are required.
                      </p>
                    </div>

                    {/* Checkbox 1 — Age */}
                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        attestedAge
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-white/5 border-white/20"
                      }`}
                    >
                      <Checkbox
                        id="attest-age"
                        checked={attestedAge}
                        onCheckedChange={(v) => setAttestedAge(v === true)}
                        className="mt-0.5 border-amber-400/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0 w-5 h-5"
                        data-ocid="sitter-apply.attest_age_checkbox"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <User size={13} className="text-amber-300 shrink-0" />
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                            Age Requirement
                          </span>
                        </div>
                        <label
                          htmlFor="attest-age"
                          className="text-sm text-white/80 leading-relaxed cursor-pointer select-none"
                        >
                          I confirm I am{" "}
                          <strong className="text-white">
                            18 years of age or older
                          </strong>
                          . I understand that providing false information may
                          result in removal from the platform.
                        </label>
                      </div>
                    </div>

                    {/* Checkbox 2 — Insurance */}
                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        attestedInsurance
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-white/5 border-white/20"
                      }`}
                    >
                      <Checkbox
                        id="attest-insurance"
                        checked={attestedInsurance}
                        onCheckedChange={(v) =>
                          setAttestedInsurance(v === true)
                        }
                        className="mt-0.5 border-amber-400/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0 w-5 h-5"
                        data-ocid="sitter-apply.attest_insurance_checkbox"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield
                            size={13}
                            className="text-amber-300 shrink-0"
                          />
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                            Insurance Requirement
                          </span>
                        </div>
                        <label
                          htmlFor="attest-insurance"
                          className="text-sm text-white/80 leading-relaxed cursor-pointer select-none"
                        >
                          I confirm I carry, or will obtain prior to accepting
                          any bookings,{" "}
                          <strong className="text-white">
                            adequate pet care insurance coverage
                          </strong>
                          . I understand it is my sole responsibility to
                          maintain appropriate insurance.
                        </label>
                      </div>
                    </div>

                    {/* Checkbox 3 — Platform Acknowledgment */}
                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        attestedPlatform
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-white/5 border-white/20"
                      }`}
                    >
                      <Checkbox
                        id="attest-platform"
                        checked={attestedPlatform}
                        onCheckedChange={(v) => setAttestedPlatform(v === true)}
                        className="mt-0.5 border-amber-400/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0 w-5 h-5"
                        data-ocid="sitter-apply.attest_platform_checkbox"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap size={13} className="text-amber-300 shrink-0" />
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                            Platform Acknowledgment
                          </span>
                        </div>
                        <label
                          htmlFor="attest-platform"
                          className="text-sm text-white/80 leading-relaxed cursor-pointer select-none"
                        >
                          I understand that{" "}
                          <strong className="text-white">{APP_NAME}</strong> is
                          a{" "}
                          <strong className="text-white">
                            technology platform only
                          </strong>
                          . {APP_NAME} does not itself provide, employ, or
                          supervise pet sitting services. All services are
                          provided independently by me as a{" "}
                          <strong className="text-white">
                            self-employed service provider
                          </strong>
                          . All liability for services, interactions, and
                          outcomes rests solely with me and my clients.
                        </label>
                      </div>
                    </div>

                    {/* Checkbox 4 — Non-Employment Acknowledgment (GAP 5) */}
                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        attestedNonEmployment
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-white/5 border-white/20"
                      }`}
                    >
                      <Checkbox
                        id="attest-non-employment"
                        checked={attestedNonEmployment}
                        onCheckedChange={(v) =>
                          setAttestedNonEmployment(v === true)
                        }
                        className="mt-0.5 border-amber-400/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0 w-5 h-5"
                        data-ocid="sitter-apply.attest_non_employment_checkbox"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <HandshakeIcon
                            size={13}
                            className="text-amber-300 shrink-0"
                          />
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                            Independent Operator
                          </span>
                        </div>
                        <label
                          htmlFor="attest-non-employment"
                          className="text-sm text-white/80 leading-relaxed cursor-pointer select-none"
                        >
                          I understand I am an{" "}
                          <strong className="text-white">
                            independent operator
                          </strong>{" "}
                          using {APP_NAME}&rsquo;s software tools. I am{" "}
                          <strong className="text-white">not</strong> an
                          employee, contractor, or agent of {APP_NAME} or Data
                          Driven Design Group, LLC.
                        </label>
                      </div>
                    </div>

                    {/* Progress hint */}
                    {!canProceedStep1 && (
                      <p className="text-xs text-white/40 text-center px-2">
                        Please confirm all items above to continue
                      </p>
                    )}
                    {canProceedStep1 && (
                      <p className="text-xs text-emerald-300 text-center px-2 flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={13} className="shrink-0" />
                        All attestations confirmed — you may proceed
                      </p>
                    )}

                    {/* Data privacy trust signal */}
                    <div
                      className="rounded-xl px-4 py-3 flex items-start gap-3 border"
                      style={{
                        background: "rgba(99,102,241,0.10)",
                        borderColor: "rgba(99,102,241,0.30)",
                      }}
                    >
                      <Lock
                        size={14}
                        className="text-indigo-300 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-indigo-200 leading-relaxed">
                        <strong className="font-semibold text-indigo-100">
                          🔒 Your data is tenant-secure.
                        </strong>{" "}
                        Pawspect admins cannot see your personal or financial
                        information. If you ever need account support, you
                        control access — all activity is audited.
                      </p>
                    </div>

                    <Button
                      data-ocid="sitter-apply.attest_continue_button"
                      className="w-full h-12 min-h-[48px] rounded-xl font-bold text-base"
                      style={{
                        backgroundColor: canProceedStep1
                          ? "oklch(0.72 0.18 55)"
                          : undefined,
                        color: canProceedStep1 ? "#1a1a2e" : undefined,
                      }}
                      onClick={() => setStep(2)}
                      disabled={!canProceedStep1}
                    >
                      Continue to Application
                      <ArrowRight size={16} className="ml-2 shrink-0" />
                    </Button>
                  </motion.div>
                )}

                {/* ── STEP 2: Your Info ── */}
                {step === 2 && (
                  <motion.div
                    key="step2-info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Name + Phone — side by side on desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                          Full Name *
                        </Label>
                        <Input
                          data-ocid="sitter-apply.input"
                          value={form.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Sarah Johnson"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                          Phone Number *
                        </Label>
                        <Input
                          data-ocid="sitter-apply.phone_input"
                          type="tel"
                          inputMode="tel"
                          value={form.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          placeholder="(555) 123-4567"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Your Email Address *
                      </Label>
                      <Input
                        data-ocid="sitter-apply.email_input"
                        type="email"
                        inputMode="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@email.com"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                      />
                      <p className="mt-1.5 text-xs text-white/45 leading-relaxed">
                        Used on all client-facing invoices and booking
                        communications
                      </p>
                      {form.email.trim() && !emailValid && (
                        <p
                          data-ocid="sitter-apply.email.field_error"
                          className="mt-1.5 text-sm text-red-300 flex items-center gap-1.5"
                        >
                          <span className="text-red-400">⚠</span> Please enter a
                          valid email address.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Service Area Zip Code *
                      </Label>
                      <Input
                        data-ocid="sitter-apply.zip_input"
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        pattern="[0-9]{5}"
                        value={form.location}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 5);
                          set("location", val);
                        }}
                        placeholder="e.g. 80210"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                      />
                      <p className="mt-1.5 text-xs text-white/45 leading-relaxed">
                        Your zip code is used to match you with local clients.
                        Only your neighborhood (e.g. &ldquo;Boulder Area&rdquo;)
                        is shown publicly — never your exact address.
                      </p>
                      {form.location.length > 0 && form.location.length < 5 && (
                        <p
                          data-ocid="sitter-apply.zip.field_error"
                          className="mt-1.5 text-sm text-red-300 flex items-center gap-1.5"
                        >
                          <span className="text-red-400">⚠</span> Please enter a
                          valid 5-digit zip code.
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Date of Birth *
                      </Label>
                      <Input
                        data-ocid="sitter-apply.birthdate_input"
                        type="date"
                        value={form.birthdate}
                        onChange={(e) => set("birthdate", e.target.value)}
                        max={
                          new Date(Date.now() - 18 * 365.25 * 86400000)
                            .toISOString()
                            .split("T")[0]
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                      />
                      {birthdateError && (
                        <p
                          data-ocid="sitter-apply.birthdate.field_error"
                          className="mt-1.5 text-sm text-red-300 flex items-center gap-1.5"
                        >
                          <span className="text-red-400">⚠</span>{" "}
                          {birthdateError}
                        </p>
                      )}
                      {birthdateValid && form.birthdate && (
                        <p className="mt-1.5 text-sm text-emerald-300">
                          Age verified: {birthdateAge} years old
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        About You *
                      </Label>
                      <Textarea
                        data-ocid="sitter-apply.textarea"
                        value={form.bio}
                        onChange={(e) => set("bio", e.target.value)}
                        placeholder="Tell pet owners what makes you an amazing sitter..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-base min-h-[100px] resize-none w-full"
                        rows={4}
                      />
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/15 w-full">
                      <PhotoUpload
                        currentPhotoUrl={form.photoUrl || undefined}
                        onUploadComplete={(url) => set("photoUrl", url)}
                        label="Profile Photo (optional)"
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Years of Experience{" "}
                        <span className="text-white/40 font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        data-ocid="sitter-apply.years_exp_input"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="50"
                        value={form.yearsExperience}
                        onChange={(e) => set("yearsExperience", e.target.value)}
                        placeholder="How many years have you been caring for pets?"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Certifications &amp; Training{" "}
                        <span className="text-white/40 font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Textarea
                        data-ocid="sitter-apply.certifications_textarea"
                        value={form.certifications}
                        onChange={(e) => set("certifications", e.target.value)}
                        placeholder="Pet First Aid, Dog Obedience Training Certificate..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-base resize-none w-full"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                          Languages Spoken{" "}
                          <span className="text-white/40 font-normal">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          data-ocid="sitter-apply.languages_input"
                          value={form.languages}
                          onChange={(e) => set("languages", e.target.value)}
                          placeholder="English, Spanish..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                          Home Environment{" "}
                          <span className="text-white/40 font-normal">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          data-ocid="sitter-apply.home_env_textarea"
                          value={form.homeEnvironment}
                          onChange={(e) =>
                            set("homeEnvironment", e.target.value)
                          }
                          placeholder="Fenced yard, no other pets..."
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base w-full"
                        />
                      </div>
                    </div>

                    <Button
                      data-ocid="sitter-apply.primary_button"
                      className="w-full h-12 min-h-[48px] rounded-xl font-bold text-base"
                      style={{
                        backgroundColor: "oklch(0.72 0.18 55)",
                        color: "#1a1a2e",
                      }}
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                    >
                      Continue
                      <ArrowRight size={16} className="ml-2 shrink-0" />
                    </Button>
                  </motion.div>
                )}

                {/* ── STEP 3: Experience & Fit ── */}
                {step === 3 && (
                  <motion.div
                    key="step3-experience"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">
                        Years of Pet Care Experience *
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set("experience", opt.value)}
                            className={`h-11 min-h-[44px] rounded-xl text-sm font-semibold transition-all border ${
                              form.experience === opt.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/5 text-white/70 border-white/20 hover:bg-white/10"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-2 block">
                        Do you have pets of your own? *
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {["yes", "no"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => set("ownPets", val)}
                            className={`h-11 min-h-[44px] rounded-xl text-sm font-semibold transition-all border capitalize ${
                              form.ownPets === val
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-white/5 text-white/70 border-white/20 hover:bg-white/10"
                            }`}
                          >
                            {val === "yes" ? "Yes!" : "Not right now"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Why do you want to be a {APP_NAME} sitter? *
                      </Label>
                      <Textarea
                        data-ocid="sitter-apply.textarea"
                        value={form.whyApplying}
                        onChange={(e) => set("whyApplying", e.target.value)}
                        placeholder="Share your passion for pets and what makes you stand out..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-base min-h-[100px] resize-none w-full"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white/80 text-sm font-medium block">
                        References{" "}
                        <span className="text-white/40 font-normal">
                          (optional)
                        </span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={form.ref1Name}
                          onChange={(e) => set("ref1Name", e.target.value)}
                          placeholder="Ref 1 Name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 text-base"
                        />
                        <Input
                          value={form.ref1Contact}
                          onChange={(e) => set("ref1Contact", e.target.value)}
                          placeholder="Phone or email"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 text-base"
                        />
                        <Input
                          value={form.ref2Name}
                          onChange={(e) => set("ref2Name", e.target.value)}
                          placeholder="Ref 2 Name"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 text-base"
                        />
                        <Input
                          value={form.ref2Contact}
                          onChange={(e) => set("ref2Contact", e.target.value)}
                          placeholder="Phone or email"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 text-base"
                        />
                      </div>
                    </div>

                    <Button
                      data-ocid="sitter-apply.primary_button"
                      className="w-full h-12 min-h-[48px] rounded-xl font-bold text-base"
                      style={{
                        backgroundColor: "oklch(0.72 0.18 55)",
                        color: "#1a1a2e",
                      }}
                      onClick={() => setStep(4)}
                      disabled={!canProceedStep3}
                    >
                      Continue
                      <ArrowRight size={16} className="ml-2 shrink-0" />
                    </Button>
                  </motion.div>
                )}

                {/* ── STEP 4: Services & Rates ── */}
                {step === 4 && (
                  <motion.div
                    key="step4-services"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-3 block">
                        Services You Offer *
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {SERVICES.map((svc) => (
                          <button
                            key={svc}
                            type="button"
                            onClick={() => toggleService(svc)}
                            className={`flex items-center gap-3 p-3 min-h-[52px] rounded-xl border cursor-pointer transition-all w-full text-left ${
                              form.services.includes(svc)
                                ? "bg-primary/20 border-primary text-white"
                                : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <Checkbox
                              checked={form.services.includes(svc)}
                              onCheckedChange={() => toggleService(svc)}
                              className="border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                            />
                            <span className="text-sm font-medium">{svc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80 text-sm font-medium mb-1.5 block">
                        Base Hourly Rate ($/hr) *
                      </Label>
                      <div className="relative">
                        <DollarSign
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <Input
                          data-ocid="sitter-apply.input"
                          type="number"
                          inputMode="decimal"
                          min="5"
                          max="200"
                          value={form.hourlyRate}
                          onChange={(e) => set("hourlyRate", e.target.value)}
                          placeholder="25"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 text-base pl-9 w-full"
                        />
                      </div>
                      <p className="text-xs text-white/40 mt-1">
                        You can set per-service rates in your dashboard after
                        approval.
                      </p>
                    </div>

                    {/* Legal acceptance */}
                    <div className="space-y-3">
                      {/* Accept All Agreements button — GAP 6 */}
                      <button
                        type="button"
                        data-ocid="sitter-apply.accept_all_button"
                        onClick={() => {
                          // Checks all agreement checkboxes on this step (Terms + Privacy)
                          setAgreedToTerms(true);
                          setAgreedToPrivacy(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-semibold text-sm transition-all"
                      >
                        <CheckCircle2 size={16} className="shrink-0" />✓ Accept
                        All Agreements
                      </button>
                      <p className="text-xs text-white/40 text-center -mt-1">
                        Or review and check each item individually:
                      </p>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/15">
                        <Checkbox
                          id="sitter-terms"
                          checked={agreedToTerms}
                          onCheckedChange={(v) => setAgreedToTerms(v === true)}
                          className="mt-0.5 border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0 w-5 h-5"
                          data-ocid="sitter-apply.terms_checkbox"
                        />
                        <label
                          htmlFor="sitter-terms"
                          className="text-sm text-white/70 leading-relaxed cursor-pointer select-none"
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setLegalModal("terms")}
                            className="text-amber-300 underline hover:text-amber-200 transition-colors"
                          >
                            Terms &amp; Conditions
                          </button>
                          {!agreedToTerms && (
                            <span className="text-white/40 text-xs ml-1">
                              (click to read &amp; agree)
                            </span>
                          )}
                        </label>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/15">
                        <Checkbox
                          id="sitter-privacy"
                          checked={agreedToPrivacy}
                          onCheckedChange={(v) =>
                            setAgreedToPrivacy(v === true)
                          }
                          className="mt-0.5 border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0 w-5 h-5"
                          data-ocid="sitter-apply.privacy_checkbox"
                        />
                        <label
                          htmlFor="sitter-privacy"
                          className="text-sm text-white/70 leading-relaxed cursor-pointer select-none"
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => setLegalModal("privacy")}
                            className="text-amber-300 underline hover:text-amber-200 transition-colors"
                          >
                            Privacy Policy
                          </button>
                          {!agreedToPrivacy && (
                            <span className="text-white/40 text-xs ml-1">
                              (click to read &amp; agree)
                            </span>
                          )}
                        </label>
                      </div>

                      <p className="text-xs text-white/40 px-1 leading-relaxed">
                        I understand that {APP_NAME} is a booking platform only.
                        I am an independent contractor responsible for my own
                        services, and all agreements are between me and my
                        clients.
                      </p>
                    </div>

                    <Button
                      data-ocid="sitter-apply.submit_button"
                      className="w-full h-12 min-h-[48px] rounded-xl font-bold text-base"
                      style={{
                        backgroundColor: "oklch(0.72 0.18 55)",
                        color: "#1a1a2e",
                      }}
                      onClick={handleSubmit}
                      disabled={!canSubmit || createSitter.isPending}
                    >
                      {createSitter.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="shrink-0" />
                          Submit Application
                        </span>
                      )}
                    </Button>

                    {createSitter.isError && (
                      <p
                        data-ocid="sitter-apply.error_state"
                        className="text-red-400 text-sm text-center"
                      >
                        Something went wrong. Please try again.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <LegalModal
        open={legalModal === "terms"}
        type="terms"
        onAgree={() => setAgreedToTerms(true)}
        onClose={() => setLegalModal(null)}
      />
      <LegalModal
        open={legalModal === "privacy"}
        type="privacy"
        onAgree={() => setAgreedToPrivacy(true)}
        onClose={() => setLegalModal(null)}
      />
    </div>
  );
}
