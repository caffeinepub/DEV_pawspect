/**
 * AnalyticsDemoTab — Pre-computed analytics for the sitter portal demo.
 * All values derived from the demoBookings + demoPayments dataset.
 * Enhanced with 5 world-class glassmorphism charts.
 */
import {
  Award,
  BarChart2,
  BarChart3,
  Clock,
  CreditCard,
  Gift,
  Lightbulb,
  Repeat2,
  Star,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDemoMode } from "../../context/DemoModeContext";

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Static chart data (Morgan Pawley — thriving sitter) ───────────────────────

// Weekly chart data (last 8 weeks, realistic growth)
const WEEK_CHART = [
  { week: "Mar 3", earned: 126 },
  { week: "Mar 10", earned: 189 },
  { week: "Mar 17", earned: 243 },
  { week: "Mar 24", earned: 198 },
  { week: "Mar 31", earned: 315 },
  { week: "Apr 7", earned: 378 },
  { week: "Apr 14", earned: 432 },
  { week: "Apr 21", earned: 284 },
];

// Last 12 weeks earnings trend (for line chart)
const EARNINGS_TREND = [
  { week: "W1", earnings: 98 },
  { week: "W2", earnings: 126 },
  { week: "W3", earnings: 154 },
  { week: "W4", earnings: 189 },
  { week: "W5", earnings: 168 },
  { week: "W6", earnings: 243 },
  { week: "W7", earnings: 198 },
  { week: "W8", earnings: 315 },
  { week: "W9", earnings: 342 },
  { week: "W10", earnings: 378 },
  { week: "W11", earnings: 432 },
  { week: "W12", earnings: 284 },
];

const TOTAL_TREND_EARNINGS = EARNINGS_TREND.reduce((s, d) => s + d.earnings, 0);

// Service type distribution for donut chart
const SERVICE_DONUT = [
  { name: "Dog Walking", value: 38, color: "#f59e0b" },
  { name: "Cat Sitting", value: 22, color: "#6366f1" },
  { name: "Dog Boarding", value: 18, color: "#10b981" },
  { name: "Drop-In Visit", value: 14, color: "#8b5cf6" },
  { name: "Dog Bath", value: 8, color: "#ec4899" },
];
const TOTAL_DONUT_BOOKINGS = SERVICE_DONUT.reduce((s, d) => s + d.value, 0);

// Revenue forecast — next 4 weeks
const REVENUE_FORECAST = [
  { week: "Apr 28", confirmed: 189, projected: 245 },
  { week: "May 5", confirmed: 126, projected: 310 },
  { week: "May 12", confirmed: 63, projected: 280 },
  { week: "May 19", confirmed: 0, projected: 260 },
];
const TOTAL_PROJECTED = REVENUE_FORECAST.reduce((s, d) => s + d.projected, 0);

const SERVICE_PERF = [
  { name: "Dog Walking", bookings: 4, revenue: 72 },
  { name: "Cat Sitting", bookings: 3, revenue: 108 },
  { name: "Dog Boarding", bookings: 1, revenue: 90 },
  { name: "Dog Bath", bookings: 1, revenue: 25 },
  { name: "Drop-In Visit", bookings: 2, revenue: 40 },
];

// ── Light card style — white background, black text ──────────────────────────

const DARK_CARD = "rounded-2xl p-6 border border-gray-200";
const DARK_CARD_STYLE = {
  background: "#ffffff",
};

// ── Tooltip style for light charts ───────────────────────────────────────────
const DARK_TOOLTIP_STYLE = {
  background: "#ffffff",
  border: "1px solid #d97706",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#111827",
  padding: "8px 12px",
};

// ── Retention gauge (SVG arc) ─────────────────────────────────────────────────

function RetentionGauge({ percent }: { percent: number }) {
  const r = 56;
  const cx = 80;
  const cy = 72;
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;
  const angle = startAngle + sweepAngle * (percent / 100);

  function polarToCart(cx: number, cy: number, r: number, angle: number) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const bgStart = polarToCart(cx, cy, r, Math.PI);
  const bgEnd = polarToCart(cx, cy, r, 2 * Math.PI);
  const fillEnd = polarToCart(cx, cy, r, angle);
  const largeArc = sweepAngle * (percent / 100) > Math.PI ? 1 : 0;

  return (
    <svg
      width="160"
      height="90"
      className="mx-auto block"
      aria-label={`Retention gauge: ${percent}%`}
      role="img"
    >
      <title>{`Client retention: ${percent}%`}</title>
      {/* Track */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 0 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x} ${fillEnd.y}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))" }}
      />
      {/* Center text */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#d97706"
        style={{ fontSize: 24, fontWeight: 800 }}
      >
        {percent}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#374151"
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.08em",
          opacity: 0.9,
        }}
      >
        REPEAT CLIENTS
      </text>
    </svg>
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HEATMAP_DATA = [
  { day: "Mon", morning: 2, afternoon: 1, evening: 0, night: 0 },
  { day: "Tue", morning: 1, afternoon: 0, evening: 0, night: 0 },
  { day: "Wed", morning: 2, afternoon: 1, evening: 0, night: 0 },
  { day: "Thu", morning: 1, afternoon: 1, evening: 0, night: 0 },
  { day: "Fri", morning: 1, afternoon: 0, evening: 0, night: 0 },
  { day: "Sat", morning: 3, afternoon: 1, evening: 0, night: 0 },
  { day: "Sun", morning: 0, afternoon: 0, evening: 0, night: 0 },
];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"] as const;
type TimeSlotKey = "morning" | "afternoon" | "evening" | "night";

function heatColor(val: number): string {
  if (val === 0) return "#f3f4f6";
  if (val >= 3) return "rgba(217,119,6,0.90)";
  if (val >= 2) return "rgba(245,158,11,0.65)";
  return "rgba(251,191,36,0.40)";
}

export default function AnalyticsDemoTab() {
  const { demoPrivateData, demoReviews, demoTips } = useDemoMode();

  const goalDollars = (demoPrivateData.earningsGoal ?? 0) / 100; // $1,500
  const thisMonthEarned = 680;
  const goalPct = Math.min(
    100,
    Math.round((thisMonthEarned / goalDollars) * 100),
  );

  const totalTips = useMemo(
    () => demoTips.reduce((s, t) => s + Number(t.amountCents) / 100, 0),
    [demoTips],
  );
  const avgRating = useMemo(
    () =>
      demoReviews.length > 0
        ? demoReviews.reduce((s, r) => s + r.rating, 0) / demoReviews.length
        : 0,
    [demoReviews],
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <h2 className="font-display text-xl font-bold flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" />
        Your Analytics
      </h2>

      {/* ── Hero earnings cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="relative rounded-2xl p-5 overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #fefce8 100%)",
            borderColor: "#c7d2fe",
          }}
          data-ocid="demo.analytics.this-month.card"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm mb-3">
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">
            This Month
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #d97706)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${fmt(thisMonthEarned)}
          </p>
          <p className="text-xs mt-1 font-medium text-emerald-600">
            ↑ 24% from last month
          </p>
        </div>

        <div
          className="relative rounded-2xl p-5 overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)",
            borderColor: "#fde68a",
          }}
          data-ocid="demo.analytics.lifetime.card"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm mb-3">
            <Trophy size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            Lifetime Earnings
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #d97706, #ea580c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            $2,840.00
          </p>
          <p className="text-xs mt-1 font-semibold text-amber-700">
            On a roll!
          </p>
        </div>

        <div
          className="relative rounded-2xl p-5 overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
            borderColor: "#ddd6fe",
          }}
          data-ocid="demo.analytics.avg-booking.card"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm mb-3">
            <BarChart2 size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">
            Avg Per Booking
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            $52.00
          </p>
          <p className="text-xs mt-1 text-violet-500 font-medium">
            from 23 completed bookings
          </p>
        </div>

        <div
          className="relative rounded-2xl p-5 overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            borderColor: "#a7f3d0",
          }}
          data-ocid="demo.analytics.projected.card"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm mb-3">
            <Target size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
            Projected This Month
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #059669, #0d9488)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            $1,020.00
          </p>
          <p className="text-xs mt-1 text-emerald-600 font-medium">
            Based on your current pace
          </p>
        </div>
      </div>

      {/* ── Goal tracker ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-5"
        style={{
          background: "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)",
          borderColor: "#fde68a",
        }}
        data-ocid="demo.analytics.goal.section"
      >
        <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Target size={15} className="text-amber-600" />
          Monthly Earnings Goal
        </h3>
        <div className="flex items-center justify-between text-xs font-medium mb-2">
          <span className="text-amber-700">${fmt(thisMonthEarned)} earned</span>
          <span className="text-amber-600 font-bold">{goalPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-amber-100 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${goalPct}%`,
              background:
                "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #ea580c 100%)",
            }}
          />
        </div>
        <p className="text-xs text-amber-700 font-medium">
          Great progress! Keep booking. Goal: ${fmt(goalDollars)}
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHART 1 — Earnings Trend Line Chart (12 weeks)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className={DARK_CARD}
        style={DARK_CARD_STYLE}
        data-ocid="demo.analytics.earnings-trend.section"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={14} className="text-amber-500" />
              Earnings Trend — Last 12 Weeks
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              Consistent growth trajectory
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "#6b7280" }}>
              12-week total
            </p>
            <p className="text-base font-extrabold text-amber-600">
              ${fmt(TOTAL_TREND_EARNINGS)}
            </p>
          </div>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={EARNINGS_TREND}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value: number) => [`$${fmt(value)}`, "Earnings"]}
                contentStyle={DARK_TOOLTIP_STYLE}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                itemStyle={{ color: "#d97706" }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#d97706"
                strokeWidth={2.5}
                fill="url(#amberGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#d97706", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHART 2 & 3 — Donut + Retention Gauge side by side
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut chart — Booking type distribution */}
        <div
          className={DARK_CARD}
          style={DARK_CARD_STYLE}
          data-ocid="demo.analytics.booking-donut.section"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-amber-500" />
            Booking Mix
          </h3>
          <p className="text-xs mb-3" style={{ color: "#6b7280" }}>
            Which services you're booked for most
          </p>

          {/* Donut with center label via absolute overlay */}
          <div className="relative" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SERVICE_DONUT}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {SERVICE_DONUT.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value} bookings`,
                    "Service",
                  ]}
                  contentStyle={DARK_TOOLTIP_STYLE}
                  labelStyle={{ color: "#111827", fontWeight: 600 }}
                  itemStyle={{ color: "#111827" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label — absolute positioned, always visible */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ top: 0 }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#d97706",
                  lineHeight: 1,
                }}
              >
                {TOTAL_DONUT_BOOKINGS}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#374151",
                  letterSpacing: "0.08em",
                  marginTop: 3,
                }}
              >
                BOOKINGS
              </span>
            </div>
          </div>

          {/* Custom HTML legend — always renders correctly */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {SERVICE_DONUT.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: entry.color,
                    display: "inline-block",
                  }}
                />
                <span className="text-xs truncate" style={{ color: "#374151" }}>
                  {entry.name}
                </span>
                <span
                  className="text-xs font-bold ml-auto shrink-0"
                  style={{ color: "#6b7280" }}
                >
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Retention gauge */}
        <div
          className={DARK_CARD}
          style={DARK_CARD_STYLE}
          data-ocid="demo.analytics.retention-gauge.section"
        >
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Repeat2 size={14} className="text-amber-500" />
            Client Retention
          </h3>
          <p className="text-xs mb-3" style={{ color: "#6b7280" }}>
            Percentage of clients who book again
          </p>
          <RetentionGauge percent={68} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Repeat Clients", value: "3", color: "#d97706" },
              { label: "Total Clients", value: "5", color: "#111827" },
              { label: "Retention Rate", value: "68%", color: "#059669" },
              { label: "Avg Bookings", value: "3.8×", color: "#7c3aed" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <p className="text-lg font-extrabold" style={{ color }}>
                  {value}
                </p>
                <p
                  className="text-[10px] mt-0.5 leading-tight"
                  style={{ color: "#6b7280" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHART 4 — Peak Hours Heatmap
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className={DARK_CARD}
        style={DARK_CARD_STYLE}
        data-ocid="demo.analytics.peak-hours.section"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              Peak Booking Times
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              When clients need you most — Saturday mornings are your busiest
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: "rgba(217,119,6,0.10)",
              border: "1px solid rgba(217,119,6,0.30)",
              color: "#92400e",
            }}
          >
            Peak: Sat AM
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-5 gap-1.5 mb-2">
          <div />
          {TIME_SLOTS.map((t) => (
            <div
              key={t}
              className="text-[10px] font-semibold text-center"
              style={{ color: "#374151" }}
            >
              {t.slice(0, 3)}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {HEATMAP_DATA.map(({ day, ...vals }) => (
            <div key={day} className="grid grid-cols-5 gap-1.5 items-center">
              <span
                className="text-[11px] font-semibold w-8"
                style={{ color: "#374151" }}
              >
                {day}
              </span>
              {TIME_SLOTS.map((t) => {
                const key = t.toLowerCase() as TimeSlotKey;
                const val = vals[key];
                return (
                  <div
                    key={t}
                    title={`${day} ${t}: ${val} booking${val !== 1 ? "s" : ""}`}
                    className="h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: heatColor(val),
                      color:
                        val >= 3
                          ? "rgba(255,255,255,0.95)"
                          : val >= 2
                            ? "#92400e"
                            : val > 0
                              ? "#78350f"
                              : "#9ca3af",
                    }}
                  >
                    {val > 0 ? val : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 mt-4 pt-3"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
            Intensity:
          </span>
          {[
            { label: "None", bg: "#f3f4f6" },
            { label: "Low", bg: "rgba(251,191,36,0.40)" },
            { label: "Med", bg: "rgba(245,158,11,0.65)" },
            { label: "High", bg: "rgba(217,119,6,0.90)" },
          ].map(({ label, bg }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-4 rounded" style={{ background: bg }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CHART 5 — Revenue Forecast (next 4 weeks)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className={DARK_CARD}
        style={DARK_CARD_STYLE}
        data-ocid="demo.analytics.revenue-forecast.section"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Target size={14} className="text-amber-500" />
              Revenue Forecast — Next 4 Weeks
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              Confirmed bookings + projected at current pace
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "#6b7280" }}>
              Projected monthly
            </p>
            <p
              className="text-base font-extrabold"
              style={{ color: "#059669" }}
            >
              ${fmt(TOTAL_PROJECTED)}
            </p>
          </div>
        </div>

        {/* Custom HTML legend */}
        <div className="flex items-center gap-5 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="rounded"
              style={{
                width: 12,
                height: 12,
                background: "#d97706",
                display: "inline-block",
              }}
            />
            <span className="text-xs font-medium" style={{ color: "#374151" }}>
              Confirmed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="rounded"
              style={{
                width: 12,
                height: 12,
                background: "#2563eb",
                opacity: 0.45,
                display: "inline-block",
              }}
            />
            <span className="text-xs font-medium" style={{ color: "#374151" }}>
              Projected
            </span>
          </div>
        </div>

        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={REVENUE_FORECAST}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${fmt(value)}`,
                  name === "confirmed" ? "Confirmed" : "Projected",
                ]}
                contentStyle={DARK_TOOLTIP_STYLE}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
                itemStyle={{ color: "#111827" }}
              />
              <Bar dataKey="confirmed" fill="#d97706" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="projected"
                fill="#2563eb"
                fillOpacity={0.45}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Weekly earnings bar chart (original) ───────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border p-5"
        data-ocid="demo.analytics.weekly-chart.section"
      >
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-primary" />
          Weekly Earnings — Last 8 Weeks
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={WEEK_CHART}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              formatter={(value: number) => [`$${fmt(value)}`, "Earned"]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="earned" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top Services ─────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.analytics.service-performance.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
          }}
        >
          <BarChart2 size={15} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-900">
            Your Services — What&apos;s Working
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Service
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Bookings
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Revenue
                </th>
                <th className="px-5 py-2.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Avg / Booking
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SERVICE_PERF.sort((a, b) => b.revenue - a.revenue).map(
                (svc, idx) => (
                  <tr
                    key={svc.name}
                    className={`transition-colors hover:bg-muted/20 ${idx === 0 ? "bg-indigo-50/40" : ""}`}
                  >
                    <td className="px-5 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold shrink-0">
                            <Award size={10} /> Top
                          </span>
                        )}
                        {svc.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground font-medium">
                      {svc.bookings}
                    </td>
                    <td className="px-5 py-3 text-right text-indigo-700 font-semibold">
                      ${fmt(svc.revenue)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      ${fmt(svc.revenue / svc.bookings)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Client Retention Stats ──────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        data-ocid="demo.analytics.retention.section"
      >
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            borderColor: "#bbf7d0",
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm mb-3">
            <Repeat2 size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
            Repeat Clients
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #059669, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            3
          </p>
          <p className="text-xs text-emerald-700 font-medium">
            Loyal clients are your best growth engine.
          </p>
        </div>
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderColor: "#bfdbfe",
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm mb-3">
            <Users size={18} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-1">
            Retention Rate
          </p>
          <p
            className="text-3xl font-extrabold tracking-tight mb-1"
            style={{
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            78%
          </p>
          <p className="text-xs text-blue-700 font-medium">
            Exceptional retention. Clients trust you deeply.
          </p>
        </div>
      </div>

      {/* ── Tip history ──────────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.analytics.tips.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Gift size={15} className="text-purple-600" />
            <h3 className="text-sm font-bold text-purple-900">Tip History</h3>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full">
            Total: ${fmt(totalTips)}
          </span>
        </div>
        <div className="p-5 space-y-2">
          {demoTips
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .map((tip, i) => (
              <div
                key={`${tip.bookingId}-${i}`}
                data-ocid={`demo.analytics.tips.item.${i + 1}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-purple-50/60 border border-purple-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                    <Gift size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {tip.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(
                        Number(tip.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-base font-extrabold text-purple-700">
                  +${fmt(Number(tip.amountCents) / 100)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.analytics.reviews.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Star size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-amber-900">
              Reviews Received
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
              {fmt(avgRating)} avg
            </span>
            <span className="text-xs text-muted-foreground bg-muted/60 border border-border px-2.5 py-1 rounded-full">
              {demoReviews.length} reviews
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {demoReviews
            .sort((a, b) => Number(b.createdAt - a.createdAt))
            .map((review, i) => (
              <div
                key={`${review.bookingId}-${i}`}
                data-ocid={`demo.analytics.reviews.item.${i + 1}`}
                className="rounded-xl border border-border/60 p-4 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        size={13}
                        className={
                          si < review.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        }
                      />
                    ))}
                    <span className="ml-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      {review.rating}/5
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      {new Date(
                        Number(review.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {review.clientName}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  &ldquo;{review.reviewText}&rdquo;
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* ── Tax summary ────────────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.analytics.tax-summary.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          }}
        >
          <CreditCard size={15} className="text-blue-600" />
          <h3 className="text-sm font-bold text-blue-900">
            Tax &amp; Earnings Summary — 2026
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                borderColor: "#bfdbfe",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                YTD Earned
              </p>
              <p className="text-2xl font-extrabold text-blue-800">$2,840.00</p>
              <p className="text-xs text-blue-600 mt-1">Jan–Dec 2026</p>
            </div>
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                borderColor: "#bbf7d0",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">
                Projected Annual
              </p>
              <p className="text-2xl font-extrabold text-emerald-800">
                $7,200.00
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                At your current pace
              </p>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
              <Lightbulb size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 mb-0.5">
                Tax Planning Tip
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Set aside 25–30% of every payment for self-employment taxes.
                Quarterly estimated payments are due in April, June, September,
                and January.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Discount patterns ──────────────────────────────────────────── */}
      <div
        className="bg-card rounded-2xl border border-border overflow-hidden"
        data-ocid="demo.analytics.discount-pricing.section"
      >
        <div
          className="px-5 py-4 border-b border-border flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          }}
        >
          <Tag size={15} className="text-amber-600" />
          <h3 className="text-sm font-bold text-amber-900">
            Discount &amp; Pricing Patterns
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Discounts Given", val: "1" },
              { label: "Total Discounted", val: "$12.00" },
              { label: "Avg Discount", val: "10.0%" },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="rounded-xl p-3 border text-center"
                style={{
                  background: "linear-gradient(135deg, #fffbeb, #fef9c3)",
                  borderColor: "#fde68a",
                }}
              >
                <p className="text-2xl font-extrabold text-amber-700">{val}</p>
                <p className="text-xs font-medium text-amber-600 mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-3 py-2.5 text-left font-bold text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                    Original
                  </th>
                  <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                    Final
                  </th>
                  <th className="px-3 py-2.5 text-right font-bold text-muted-foreground uppercase tracking-wide">
                    Discount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-foreground font-medium">
                    Apr 6, 2026
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground line-through">
                    $120.00
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">
                    $108.00
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      <TrendingDown size={9} /> 10%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
