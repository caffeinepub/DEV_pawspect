/**
 * CoachDemoTab — Demo mode Coach & Growth tab for the sitter portal preview.
 * Uses Morgan Pawley's rich demo dataset with pre-set goals and milestones.
 */
import {
  Award,
  CalendarDays,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Pause,
  Pencil,
  PiggyBank,
  Play,
  Receipt,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useDemoMode } from "../../context/DemoModeContext";

function GoalDisplay({
  icon,
  label,
  current,
  goal,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  goal: number;
  accentColor: "indigo" | "amber";
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const barColor =
    accentColor === "amber"
      ? "linear-gradient(90deg,#f59e0b,#d97706)"
      : "linear-gradient(90deg,#6366f1,#4f46e5)";

  return (
    <div
      className={`rounded-2xl border p-5 ${accentColor === "amber" ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200" : "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200"}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${accentColor === "amber" ? "bg-amber-500" : "bg-indigo-600"}`}
        >
          {icon}
        </div>
        <button
          type="button"
          onClick={() => toast.info("Changes are disabled in demo mode")}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${accentColor === "amber" ? "bg-amber-100 hover:bg-amber-200 text-amber-700" : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"}`}
          aria-label="Edit goal"
        >
          <Pencil size={12} />
        </button>
      </div>
      <p
        className={`text-xs font-bold uppercase tracking-widest mb-1 ${accentColor === "amber" ? "text-amber-600" : "text-indigo-500"}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-extrabold tracking-tight mt-1 ${accentColor === "amber" ? "text-amber-800" : "text-indigo-800"}`}
      >
        {current}{" "}
        <span
          className={`text-sm font-medium ${accentColor === "amber" ? "text-amber-500" : "text-indigo-400"}`}
        >
          / {goal} goal
        </span>
      </p>
      <div
        className={`h-2 rounded-full mt-3 mb-1 overflow-hidden ${accentColor === "amber" ? "bg-amber-100" : "bg-indigo-100"}`}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <p
        className={`text-xs font-semibold ${accentColor === "amber" ? "text-amber-600" : "text-indigo-500"}`}
      >
        {pct}%
        {pct >= 100
          ? " — Goal crushed!"
          : pct >= 75
            ? " — Almost there!"
            : pct >= 50
              ? " — Great pace!"
              : " — Keep pushing"}
      </p>
    </div>
  );
}

export default function CoachDemoTab() {
  const { demoSitter } = useDemoMode();

  if (!demoSitter) return null;

  return (
    <div className="space-y-8" data-ocid="demo.coach.section">
      {/* Tagline */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Star size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">
              {demoSitter.name ?? "Your Business"}
            </h2>
            <p className="text-indigo-200 text-sm">
              Your personal pet care business advisor
            </p>
          </div>
        </div>
        <p className="text-white/80 text-sm leading-relaxed mt-3">
          Data-driven insights, goal tracking, and business coaching — built
          specifically for you. Your success is the mission.
        </p>
      </div>

      {/* Milestones */}
      <div className="space-y-3" data-ocid="demo.coach.milestones.section">
        {[
          {
            icon: <Trophy size={16} className="text-white" />,
            title: "$1,000 Earned",
            message:
              "Four figures in the books — you're building a real business.",
          },
          {
            icon: <Star size={16} className="text-white" />,
            title: "20 Bookings Milestone!",
            message:
              "Twenty completed bookings. You're a trusted name in pet care.",
          },
          {
            icon: <Users size={16} className="text-white" />,
            title: "5 Happy Clients",
            message:
              "A loyal client base is the foundation of a thriving business.",
          },
        ].map((m, i) => (
          <div
            key={m.title}
            className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 px-5 py-4"
            data-ocid={`demo.coach.milestone.item.${i + 1}`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              {m.icon}
            </div>
            <div>
              <p className="font-bold text-amber-800 text-sm">{m.title}</p>
              <p className="text-amber-700 text-sm mt-0.5">{m.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cancellation Invoice Follow-Up — demo shows active state with 1 pending */}
      <section data-ocid="demo.coach.cancellation-invoice.section">
        <div
          className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 p-5"
          data-ocid="demo.coach.cancellation-invoice.card"
        >
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <Receipt size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-800 text-sm mb-1">
                Follow up on a cancellation invoice
              </p>
              <p className="text-sm leading-relaxed text-amber-700">
                When a client cancels within 24 hours, your cancellation policy
                protects your time. A quick follow-up on the invoice shows
                professionalism and helps you get paid for work you've already
                prepared for. Pawspect makes it easy — your invoice is already
                there.
              </p>
              <p className="text-xs font-semibold text-amber-600 mt-2">
                1 pending cancellation invoice to review
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Goals */}
      <section data-ocid="demo.coach.goals.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Target size={16} className="text-primary" />
          Your Goals This Month
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GoalDisplay
            icon={<TrendingUp size={18} className="text-white" />}
            label="Monthly Income Goal"
            current={680}
            goal={1500}
            accentColor="indigo"
          />
          <GoalDisplay
            icon={<Receipt size={18} className="text-white" />}
            label="Monthly Booking Target"
            current={8}
            goal={12}
            accentColor="amber"
          />
          <GoalDisplay
            icon={<Users size={18} className="text-white" />}
            label="New Clients This Month"
            current={2}
            goal={4}
            accentColor="indigo"
          />
        </div>
      </section>

      {/* Insights */}
      <section data-ocid="demo.coach.insights.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          Insights for You
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: <TrendingUp size={16} className="text-white" />,
              headline: "Cat Sitting is your top earner",
              tip: "Feature Cat Sitting first on your profile. Clients who book your strongest service tend to rebook more often.",
              bg: "from-indigo-50 to-violet-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
              iconBg: "bg-indigo-600",
            },
            {
              icon: <Zap size={16} className="text-white" />,
              headline: "Weekend warrior — unlock more revenue",
              tip: "Most of your bookings land on weekends. Adding Friday availability could increase weekly income by 20–30% without extra marketing.",
              bg: "from-amber-50 to-yellow-50",
              border: "border-amber-200",
              text: "text-amber-800",
              iconBg: "bg-amber-500",
            },
          ].map((ins, i) => (
            <div
              key={ins.headline}
              className={`rounded-2xl bg-gradient-to-br ${ins.bg} border ${ins.border} p-5`}
              data-ocid={`demo.coach.insight.item.${i + 1}`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${ins.iconBg} flex items-center justify-center mb-3`}
              >
                {ins.icon}
              </div>
              <p className={`font-bold text-sm ${ins.text} mb-1`}>
                {ins.headline}
              </p>
              <p className={`text-sm leading-relaxed ${ins.text} opacity-80`}>
                {ins.tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Savings Pot */}
      <section data-ocid="demo.coach.savings.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <PiggyBank size={16} className="text-emerald-600" />
          Savings Pot
        </h3>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <PiggyBank size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-sm">
                  New Equipment Fund
                </p>
                <p className="text-emerald-600 text-xs">Target: $500</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Changes are disabled in demo mode")}
              className="w-7 h-7 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 flex items-center justify-center"
              aria-label="Edit savings goal"
            >
              <Pencil size={12} />
            </button>
          </div>
          <div className="mt-4 h-3 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: "44%",
                background: "linear-gradient(90deg,#059669,#0d9488)",
              }}
            />
          </div>
          <p className="text-sm text-emerald-700 font-medium mt-2">
            Saving 25% of monthly avg: goal reached in ~2 months
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Avg monthly: $680 — 25% saved = $170/mo
          </p>
        </div>
      </section>

      {/* Stop / Start / Continue */}
      <section data-ocid="demo.coach.stop-start-continue.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-indigo-500" />
          Stop / Start / Continue
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
                <Pause size={15} className="text-white" />
              </div>
              <p className="font-bold text-red-800 text-sm">Stop</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>
                  Leaving your profile description vague. Specific bios convert
                  40% better than generic ones.
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                <Play size={15} className="text-white" />
              </div>
              <p className="font-bold text-amber-800 text-sm">Start</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  Asking for a review after every completed service. Most
                  clients are happy to help.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>
                  Promoting weekend availability. Weekend demand is consistently
                  higher.
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                <CheckCircle size={15} className="text-white" />
              </div>
              <p className="font-bold text-emerald-800 text-sm">Continue</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  Leading with Cat Sitting — it's your top-earning service. Keep
                  it front and center.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-emerald-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  Quick confirmations — responding to bookings fast signals
                  professionalism.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Smart Growth Nudges */}
      <section data-ocid="demo.coach.smart-nudges.section">
        <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          Smart Growth Nudges
        </h3>
        <div className="space-y-3">
          {[
            {
              icon: <MessageSquare size={15} className="text-violet-600" />,
              title: "Ask for reviews — it changes everything",
              body: "You have 5 completed bookings this month. Reach out to those clients and ask for a review. Profiles with 5+ reviews get significantly more inquiries.",
              bg: "from-violet-50 to-purple-50",
              border: "border-violet-200",
              text: "text-violet-800",
            },
            {
              icon: <CalendarDays size={15} className="text-indigo-600" />,
              title: "More availability = more bookings",
              body: "Make sure your Availability tab covers evenings and weekends — those slots fill first.",
              bg: "from-indigo-50 to-blue-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
            },
            {
              icon: <RefreshCw size={15} className="text-emerald-600" />,
              title: "You've averaged $680/month — let's beat it",
              body: "Set a monthly goal above your average and commit to one extra booking per week. Small consistent actions compound fast.",
              bg: "from-emerald-50 to-teal-50",
              border: "border-emerald-200",
              text: "text-emerald-800",
            },
            {
              icon: <Award size={15} className="text-indigo-600" />,
              title: "3 reviews away from top-tier visibility",
              body: "Profiles with 5+ reviews get 4x more views. After each booking, a quick message asking for a review goes a long way.",
              bg: "from-indigo-50 to-blue-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
            },
          ].map((nudge, i) => (
            <div
              key={nudge.title}
              data-ocid={`demo.coach.nudge.item.${i + 1}`}
              className={`flex gap-4 rounded-2xl bg-gradient-to-br ${nudge.bg} border ${nudge.border} p-5`}
            >
              <div
                className={`w-9 h-9 rounded-xl bg-white/70 border ${nudge.border} flex items-center justify-center shrink-0 mt-0.5`}
              >
                {nudge.icon}
              </div>
              <div>
                <p className={`font-bold text-sm ${nudge.text} mb-0.5`}>
                  {nudge.title}
                </p>
                <p
                  className={`text-sm leading-relaxed ${nudge.text} opacity-80`}
                >
                  {nudge.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
