import { Printer } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

// ─── Brand constants ─────────────────────────────────────────────────────────
const INDIGO = "#4F46E5";
const CHARCOAL = "#1a1a2e";
const AMBER = "#F59E0B";
const WHITE = "#FFFFFF";
const CREAM = "#FAFAF7";

// ─── Pexels URL helper — ONLY this format reliably renders ───────────────────
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

// ─── Print CSS ───────────────────────────────────────────────────────────────
const printCSS = `
  @media print {
    @page { size: letter portrait; margin: 0; }
    body { margin: 0; padding: 0; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .brochure-page {
      page-break-after: always !important;
      break-after: page !important;
      height: 11in !important;
      min-height: 11in !important;
      overflow: hidden !important;
    }
  }
`;

// ─── Base page style ─────────────────────────────────────────────────────────
const pageBase: React.CSSProperties = {
  width: "8.5in",
  minHeight: "11in",
  position: "relative",
  overflow: "hidden",
  pageBreakAfter: "always",
  breakAfter: "page" as React.CSSProperties["breakAfter"],
  fontFamily: "'Inter', sans-serif",
  WebkitPrintColorAdjust: "exact" as const,
  printColorAdjust: "exact" as const,
};

// ─── Full-bleed image layer ───────────────────────────────────────────────────
function ImageLayer({
  id,
  position = "center",
}: { id: number; position?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('${px(id)}')`,
        backgroundSize: "cover",
        backgroundPosition: position,
        backgroundRepeat: "no-repeat",
        WebkitPrintColorAdjust: "exact" as const,
        printColorAdjust: "exact" as const,
      }}
    />
  );
}

// ─── Gradient overlay ────────────────────────────────────────────────────────
function GradientOverlay({ gradient }: { gradient: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: gradient,
        WebkitPrintColorAdjust: "exact" as const,
        printColorAdjust: "exact" as const,
      }}
    />
  );
}

// ─── Content layer ───────────────────────────────────────────────────────────
function ContentLayer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Amber accent bar ────────────────────────────────────────────────────────
function AmberBar({ bottom = false }: { bottom?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        ...(bottom ? { bottom: 0 } : { top: 0 }),
        left: 0,
        right: 0,
        height: "8px",
        background: AMBER,
        zIndex: 2,
        WebkitPrintColorAdjust: "exact" as const,
        printColorAdjust: "exact" as const,
      }}
    />
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function Label({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div
      style={{
        color: light ? AMBER : INDIGO,
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "4px",
        textTransform: "uppercase" as const,
        marginBottom: "20px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {text}
    </div>
  );
}

// ─── Pull quote ───────────────────────────────────────────────────────────────
function PullQuote({
  text,
  color = AMBER,
}: {
  text: string;
  color?: string;
}) {
  return (
    <div style={{ marginTop: "32px", marginBottom: "32px" }}>
      <div
        style={{
          fontSize: "80px",
          lineHeight: "0.5",
          color: color,
          opacity: 0.3,
          fontFamily: "'Playfair Display', Georgia, serif",
          marginBottom: "8px",
        }}
      >
        &ldquo;
      </div>
      <p
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontSize: "30px",
          lineHeight: 1.35,
          color: color,
          margin: 0,
          paddingLeft: "16px",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — COVER (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P01Cover() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={29134569} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.70) 100%)" />
      <AmberBar bottom />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px 80px",
        }}
      >
        {/* Top — logo mark */}
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "72px",
              fontWeight: 900,
              color: WHITE,
              letterSpacing: "8px",
              margin: 0,
              lineHeight: 1,
            }}
          >
            PAWSPECT
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.88)",
              fontSize: "22px",
              fontWeight: 300,
              marginTop: "16px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            The Professional Platform for Independent Pet Sitters
          </p>
        </div>
        {/* Center — badge */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              background: AMBER,
              color: CHARCOAL,
              padding: "14px 36px",
              borderRadius: "100px",
              fontWeight: 700,
              fontSize: "18px",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            30-Day Free Trial &nbsp;&bull;&nbsp; $15/month
          </div>
        </div>
        {/* Bottom — domain */}
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: "16px",
              fontFamily: "'Inter', sans-serif",
              margin: 0,
            }}
          >
            pawspect.co
          </p>
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — THE PROBLEM (TYPE A — full bleed, heavier overlay)
// ═══════════════════════════════════════════════════════════════════════════════
function P02Problem() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={11404610} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.78) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          maxWidth: "800px",
        }}
      >
        <Label text="The Problem" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "54px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            margin: "0 0 28px",
          }}
        >
          Running Your Pet Sitting Business Shouldn&rsquo;t Require 5 Separate
          Apps
        </h2>
        <PullQuote
          text="Scheduling, invoicing, client communication, analytics &mdash; most sitters juggle it all manually."
          color={AMBER}
        />
        <p
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: "16px",
            lineHeight: 1.8,
            fontFamily: "'Inter', sans-serif",
            maxWidth: "640px",
            marginBottom: "16px",
          }}
        >
          You&rsquo;re texting confirmations, chasing invoices over email, and
          tracking client notes in a spreadsheet. Every day is more admin than
          animals.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.70)",
            fontSize: "16px",
            lineHeight: 1.8,
            fontFamily: "'Inter', sans-serif",
            maxWidth: "640px",
          }}
        >
          There&rsquo;s a better way &mdash; and it was built specifically for
          you.
        </p>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — THE SOLUTION (TYPE D — dark editorial, solid background)
// ═══════════════════════════════════════════════════════════════════════════════
function P03Solution() {
  const features = [
    {
      icon: "📅",
      title: "Booking",
      desc: "Clients book in minutes, no account needed. Recurring, multi-service, and team bookings.",
    },
    {
      icon: "🧾",
      title: "Invoicing",
      desc: "Professional invoices auto-generated on every booking. Line-item breakdowns, discounts, payment tracking.",
    },
    {
      icon: "📊",
      title: "Analytics",
      desc: "Revenue trends, client retention, service mix, earnings forecast &mdash; all in real time.",
    },
  ];
  return (
    <section
      className="brochure-page"
      style={{
        ...pageBase,
        background: CHARCOAL,
      }}
    >
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="The Solution" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "60px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.1,
            margin: "0 0 20px",
          }}
        >
          One Platform. Everything You Need.
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: "18px",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "56px",
          }}
        >
          Purpose-built for independent US-based sitters.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "32px",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                padding: "36px 28px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: AMBER,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "20px",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: WHITE,
                  margin: "0 0 12px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.60)",
                  fontSize: "15px",
                  lineHeight: 1.75,
                  fontFamily: "'Inter', sans-serif",
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — SITTER PORTAL (TYPE B — left image, right white)
// ═══════════════════════════════════════════════════════════════════════════════
function P04SitterPortal() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(6732360)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
      {/* Right — white content */}
      <div
        style={{
          width: "50%",
          background: WHITE,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Sitter Portal" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 28px",
          }}
        >
          Your Business Command Center
        </h2>
        {[
          "Outlook-style agenda & calendar",
          "Coach & Growth goal tracking",
          "Live analytics dashboard",
          "Client CRM with deal offers",
          "GDPR export & audit tools",
        ].map((feat) => (
          <div
            key={feat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: CHARCOAL,
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: AMBER,
                flexShrink: 0,
              }}
            />
            {feat}
          </div>
        ))}
        <div style={{ marginTop: "36px" }}>
          <p
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "22px",
              color: INDIGO,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            &ldquo;From bookings to tax summaries &mdash; your entire business
            in one place.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 5 — BOOKING FLOW (TYPE C — left white, right image)
// ═══════════════════════════════════════════════════════════════════════════════
function P05BookingFlow() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — white content */}
      <div
        style={{
          width: "50%",
          background: WHITE,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Booking" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 28px",
          }}
        >
          Clients Book You in Minutes
        </h2>
        <div style={{ marginBottom: "28px" }}>
          {[
            { step: "01", label: "Enter ZIP code" },
            { step: "02", label: "Choose service & date" },
            { step: "03", label: "Select a sitter" },
            { step: "04", label: "Review & confirm" },
            { step: "05", label: "Instant notification" },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "10px 0",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
              }}
            >
              <span
                style={{
                  color: AMBER,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 700,
                  fontSize: "18px",
                  minWidth: "32px",
                }}
              >
                {s.step}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: CHARCOAL,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            color: INDIGO,
            margin: 0,
          }}
        >
          No account needed. No friction.
        </p>
      </div>
      {/* Right — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(4977464)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.40) 100%)",
          }}
        />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 6 — CLIENT EXPERIENCE (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P06ClientExperience() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={6732360} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.72) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="The Client Experience" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "54px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            margin: "0 0 32px",
            maxWidth: "720px",
          }}
        >
          Booking a Trusted Local Sitter Has Never Been Easier
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            maxWidth: "680px",
            marginBottom: "40px",
          }}
        >
          {["Real Reviews", "Credential Badges", "Instant Confirmation"].map(
            (t) => (
              <div
                key={t}
                style={{
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "center" as const,
                  color: WHITE,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {t}
              </div>
            ),
          )}
        </div>
        <PullQuote
          text="80% of clients rebook their first sitter."
          color={AMBER}
        />
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 7 — ANALYTICS & EARNINGS (TYPE B — left image, right cream)
// ═══════════════════════════════════════════════════════════════════════════════
function P07Analytics() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(6801643)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.50) 100%)",
          }}
        />
      </div>
      {/* Right — cream content */}
      <div
        style={{
          width: "50%",
          background: CREAM,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Analytics" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 28px",
          }}
        >
          Know Your Numbers
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            "Revenue Trends",
            "Booking Volume",
            "Client Retention",
            "Earnings Forecast",
          ].map((s) => (
            <div
              key={s}
              style={{
                background: WHITE,
                borderRadius: "10px",
                padding: "16px 20px",
                borderLeft: `4px solid ${AMBER}`,
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: CHARCOAL,
              }}
            >
              {s}
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            color: "rgba(26,26,46,0.70)",
            lineHeight: 1.7,
          }}
        >
          Real-time dashboards built for pet sitters, not enterprise teams.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 8 — INVOICING & PAYMENTS (TYPE C — left cream, right image)
// ═══════════════════════════════════════════════════════════════════════════════
function P08Invoicing() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — cream content */}
      <div
        style={{
          width: "50%",
          background: CREAM,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Invoicing" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 28px",
          }}
        >
          Professional Invoices That Get Paid Faster
        </h2>
        {[
          "Line-item breakdowns with price math",
          "Bundle discounts & ad hoc services",
          "Payment date tracking per invoice",
          "Sitter email & phone on client copy",
        ].map((feat) => (
          <div
            key={feat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              color: CHARCOAL,
            }}
          >
            <span style={{ color: AMBER, fontWeight: 700, fontSize: "16px" }}>
              ✓
            </span>
            {feat}
          </div>
        ))}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "18px",
            fontWeight: 500,
            color: CHARCOAL,
            marginTop: "28px",
            lineHeight: 1.5,
          }}
        >
          Clients get a clean, branded invoice every time.
        </p>
      </div>
      {/* Right — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(6801871)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.40) 100%)",
          }}
        />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 9 — TEAM COLLABORATION (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P09TeamCollab() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={27177012} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.75) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Teams" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "54px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            margin: "0 0 8px",
            maxWidth: "720px",
          }}
        >
          Build Your Dream Team of Pet Sitters
        </h2>
        <PullQuote
          text="Set split percentages. Share bookings. Keep every sitter&rsquo;s earnings accurate."
          color={AMBER}
        />
        <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
          {["Invite & Approve", "Payout Splits", "Shared Job Threads"].map(
            (f) => (
              <div
                key={f}
                style={{
                  background: "rgba(245,158,11,0.18)",
                  border: `1.5px solid ${AMBER}`,
                  borderRadius: "8px",
                  padding: "12px 24px",
                  color: WHITE,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {f}
              </div>
            ),
          )}
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 10 — PUBLIC SITTER PAGE (TYPE B — left image, right white)
// ═══════════════════════════════════════════════════════════════════════════════
function P10PublicPage() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(1006374)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
      {/* Right — white content */}
      <div
        style={{
          width: "50%",
          background: WHITE,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Your Public Page" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "42px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.12,
            margin: "0 0 24px",
          }}
        >
          Replace Your Website With a Page That Actually Converts
        </h2>
        {[
          "Cinematic photo gallery",
          "Credential & trust badges",
          "Live availability calendar",
          "Verified client reviews",
          "One-tap booking CTA",
        ].map((feat) => (
          <div
            key={feat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "9px 0",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: CHARCOAL,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: AMBER,
                flexShrink: 0,
              }}
            />
            {feat}
          </div>
        ))}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "20px",
            fontWeight: 600,
            color: INDIGO,
            marginTop: "28px",
          }}
        >
          Share one link. Let your work speak.
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 11 — MOBILE FIRST (TYPE D — dark editorial)
// ═══════════════════════════════════════════════════════════════════════════════
function P11MobileFirst() {
  const devices = [
    {
      platform: "iOS Safari",
      highlight: "Native booking flow optimized for iPhone",
    },
    {
      platform: "Android Chrome",
      highlight: "Full portal access on any Android device",
    },
    {
      platform: "Desktop",
      highlight: "Power-user view with all dashboards in view",
    },
  ];
  return (
    <section
      className="brochure-page"
      style={{
        ...pageBase,
        background: CHARCOAL,
      }}
    >
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Mobile-First" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "56px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.1,
            margin: "0 0 20px",
            maxWidth: "700px",
          }}
        >
          Runs Beautifully on Any Device
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "24px",
            marginTop: "40px",
            marginBottom: "48px",
          }}
        >
          {devices.map((d) => (
            <div
              key={d.platform}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(245,158,11,0.30)",
                borderTop: `3px solid ${AMBER}`,
                borderRadius: "12px",
                padding: "28px 24px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: AMBER,
                  margin: "0 0 12px",
                }}
              >
                {d.platform}
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                  margin: 0,
                }}
              >
                {d.highlight}
              </p>
            </div>
          ))}
        </div>
        <PullQuote
          text="Built for sitters who are always on the go."
          color={AMBER}
        />
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 12 — TRUST & LEGAL (TYPE C — left cream, right image)
// ═══════════════════════════════════════════════════════════════════════════════
function P12TrustLegal() {
  const items = [
    "Independent operator acknowledgment",
    "Insurance attestation on signup",
    "GDPR & CCPA export tools",
    "Timestamped audit trail",
    "Versioned consent records",
    "US-only platform enforcement",
    "Client data retention policy",
  ];
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — cream content */}
      <div
        style={{
          width: "50%",
          background: CREAM,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Trust &amp; Compliance" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 28px",
          }}
        >
          Built to Protect You
        </h2>
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "8px 0",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: CHARCOAL,
            }}
          >
            <span
              style={{
                color: AMBER,
                fontWeight: 700,
                fontSize: "16px",
                flexShrink: 0,
                lineHeight: "1.4",
              }}
            >
              ✓
            </span>
            {item}
          </div>
        ))}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "rgba(26,26,46,0.55)",
            marginTop: "20px",
          }}
        >
          Data Driven Design Group, LLC &mdash; Colorado, USA
        </p>
      </div>
      {/* Right — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(7213105)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 13 — SECURITY & PRIVACY (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P13SecurityPrivacy() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={7213105} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Security" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "54px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            margin: "0 0 16px",
            maxWidth: "720px",
          }}
        >
          Your Data. Your Business. Your Control.
        </h2>
        <PullQuote
          text="Admins cannot access your personal or financial data without your explicit, time-limited permission."
          color={AMBER}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            "All admin access is time-limited, audited, and requires your explicit grant",
            "Full data export and account anonymization available any time",
          ].map((b) => (
            <div
              key={b}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "14px",
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "16px",
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: AMBER, fontWeight: 700, flexShrink: 0 }}>
                &#8594;
              </span>
              {b}
            </div>
          ))}
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 14 — AD HOC JOBS & ACCOUNTING (TYPE B — left image, right white)
// ═══════════════════════════════════════════════════════════════════════════════
function P14AdHocJobs() {
  return (
    <section className="brochure-page" style={{ ...pageBase, display: "flex" }}>
      {/* Left — image */}
      <div style={{ width: "50%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(6801643)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
      {/* Right — white content */}
      <div
        style={{
          width: "50%",
          background: WHITE,
          padding: "80px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          WebkitPrintColorAdjust: "exact" as const,
          printColorAdjust: "exact" as const,
        }}
      >
        <Label text="Off-App Accounting" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "42px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.12,
            margin: "0 0 24px",
          }}
        >
          Log Every Job, Even Ones Booked Off the App
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            color: "rgba(26,26,46,0.72)",
            lineHeight: 1.75,
            marginBottom: "24px",
          }}
        >
          Some clients prefer to call or text. Log those jobs directly in your
          portal &mdash; they flow automatically into your earnings, analytics,
          and tax summary. Team payout splits apply to ad hoc jobs too.
        </p>
        <div
          style={{
            background: "rgba(79,70,229,0.07)",
            border: `1.5px solid ${INDIGO}`,
            borderRadius: "10px",
            padding: "16px 20px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: CHARCOAL,
          }}
        >
          Non-app clients are never contacted by Pawspect.
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 15 — DATA RIGHTS (TYPE D — dark editorial)
// ═══════════════════════════════════════════════════════════════════════════════
function P15DataRights() {
  const rights = [
    {
      num: "01",
      title: "Export Data",
      desc: "Download all your sitter and booking data in one click at any time.",
    },
    {
      num: "02",
      title: "Anonymize",
      desc: "Request full account anonymization with a permanent audit log entry.",
    },
    {
      num: "03",
      title: "Audit Trail",
      desc: "Every admin action, login, and data access is logged permanently.",
    },
    {
      num: "04",
      title: "Delete on Request",
      desc: "Your data is yours. We retain nothing after an anonymization request.",
    },
  ];
  return (
    <section
      className="brochure-page"
      style={{
        ...pageBase,
        background: CHARCOAL,
      }}
    >
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Your Rights" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "52px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.1,
            margin: "0 0 48px",
          }}
        >
          GDPR &amp; CCPA Compliant From Day One
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          {rights.map((r) => (
            <div
              key={r.num}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "12px",
                padding: "28px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "48px",
                  fontWeight: 900,
                  color: AMBER,
                  opacity: 0.9,
                  lineHeight: 1,
                  marginBottom: "16px",
                }}
              >
                {r.num}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: WHITE,
                  margin: "0 0 10px",
                }}
              >
                {r.title}
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                  margin: 0,
                }}
              >
                {r.desc}
              </p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "20px",
            fontWeight: 500,
            color: WHITE,
          }}
        >
          Your data is yours. Always.
        </p>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 16 — PRICING (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P16Pricing() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={16876005} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(245,158,11,0.30) 0%, rgba(0,0,0,0.82) 60%, rgba(0,0,0,0.88) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Pricing" light />
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "120px",
              fontWeight: 900,
              color: WHITE,
              lineHeight: 1,
            }}
          >
            $15
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "28px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            /month
          </span>
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.88)",
            fontSize: "20px",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "32px",
            fontWeight: 400,
          }}
        >
          Everything included. No platform fees. No hidden charges.
        </p>
        <div style={{ marginBottom: "36px" }}>
          {[
            "All features &mdash; no tiers, no add-ons",
            "Unlimited bookings & clients",
            "Email support included",
            "Cancel any time",
          ].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "10px",
                color: "rgba(255,255,255,0.88)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "16px",
              }}
            >
              <span style={{ color: AMBER, fontWeight: 700 }}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "inline-block",
            background: AMBER,
            color: CHARCOAL,
            padding: "14px 40px",
            borderRadius: "100px",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          30-Day Free Trial
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 17 — HOW TO GET STARTED (TYPE E — light/cream with decorative photo)
// ═══════════════════════════════════════════════════════════════════════════════
function P17GetStarted() {
  const steps = [
    {
      num: "01",
      title: "Apply and get approved",
      desc: "Submit your professional application. Admin reviews and approves within 24 hours.",
    },
    {
      num: "02",
      title: "Set services, rates & availability",
      desc: "Customize your services menu, per-service rates, and service area ZIP codes.",
    },
    {
      num: "03",
      title: "Share your link and start earning",
      desc: "Your public storefront is live. Share it via text or social. First bookings arrive immediately.",
    },
  ];
  return (
    <section
      className="brochure-page"
      style={{
        ...pageBase,
        background: CREAM,
        display: "flex",
      }}
    >
      {/* Left/Center — main content */}
      <div
        style={{
          flex: 1,
          padding: "80px 60px 80px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Label text="Get Started" />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "52px",
            fontWeight: 900,
            color: CHARCOAL,
            lineHeight: 1.1,
            margin: "0 0 48px",
          }}
        >
          Up and Running in Under 10 Minutes
        </h2>
        {steps.map((s) => (
          <div
            key={s.num}
            style={{ display: "flex", gap: "24px", marginBottom: "32px" }}
          >
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "48px",
                fontWeight: 900,
                color: AMBER,
                lineHeight: 1,
                minWidth: "64px",
                flexShrink: 0,
              }}
            >
              {s.num}
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: CHARCOAL,
                  margin: "0 0 8px",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  color: "rgba(26,26,46,0.65)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {s.desc}
              </p>
            </div>
          </div>
        ))}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "18px",
            fontWeight: 600,
            color: INDIGO,
            marginTop: "16px",
          }}
        >
          Start your free trial at pawspect.co
        </p>
      </div>
      {/* Right — decorative photo */}
      <div
        style={{
          width: "38%",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('${px(5255228)}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 18 — TESTIMONIALS / ABOUT (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P18Testimonials() {
  const testimonials = [
    {
      quote:
        "I replaced my Wix site, my Square invoices, and my spreadsheets — all in one app. My clients love the booking experience.",
      name: "Sarah M.",
      city: "Denver, CO",
    },
    {
      quote:
        "The team split feature is a game-changer. My partner and I co-sit dogs and Pawspect handles every penny of the accounting automatically.",
      name: "Jordan T.",
      city: "Austin, TX",
    },
  ];
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={3842416} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.82) 100%)" />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <Label text="Our Community" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "54px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.12,
            margin: "0 0 48px",
            maxWidth: "700px",
          }}
        >
          Built by Pet Lovers, for Pet Professionals
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            maxWidth: "720px",
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.20)",
                borderRadius: "16px",
                padding: "28px 32px",
                backdropFilter: "blur(4px)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "18px",
                  color: WHITE,
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                }}
              >
                {"“"}
                {t.quote}
                {"”"}
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: AMBER,
                  margin: 0,
                  letterSpacing: "1px",
                }}
              >
                &mdash; {t.name}, {t.city}
              </p>
            </div>
          ))}
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 19 — COMPANY / ABOUT (TYPE D — dark editorial)
// ═══════════════════════════════════════════════════════════════════════════════
function P19About() {
  const facts = [
    "Founded in Colorado",
    "Software-only platform",
    "US-based sitters only",
    "$0 platform fees",
  ];
  return (
    <section
      className="brochure-page"
      style={{
        ...pageBase,
        background: CHARCOAL,
      }}
    >
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          maxWidth: "820px",
        }}
      >
        <Label text="About Pawspect" light />
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "52px",
            fontWeight: 900,
            color: WHITE,
            lineHeight: 1.1,
            margin: "0 0 32px",
          }}
        >
          A Platform Built on Trust
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "17px",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.85,
            marginBottom: "40px",
          }}
        >
          Pawspect is a product of Data Driven Design Group, LLC, built to give
          independent pet sitters the same professional tools that large pet
          care franchises enjoy &mdash; without the fees, the gig economy risks,
          or the loss of control over your own business.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {facts.map((f) => (
            <div
              key={f}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                padding: "16px 20px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {f}
            </div>
          ))}
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "48px",
            fontWeight: 900,
            color: AMBER,
          }}
        >
          pawspect.co
        </div>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 20 — BACK COVER (TYPE A — full bleed)
// ═══════════════════════════════════════════════════════════════════════════════
function P20BackCover() {
  return (
    <section className="brochure-page" style={{ ...pageBase }}>
      <ImageLayer id={33942441} position="center" />
      <GradientOverlay gradient="linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.70) 100%)" />
      <AmberBar bottom />
      <ContentLayer
        style={{
          height: "11in",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "80px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "80px",
            fontWeight: 900,
            color: WHITE,
            letterSpacing: "10px",
            margin: "0 0 16px",
            lineHeight: 1,
          }}
        >
          PAWSPECT
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "20px",
            fontWeight: 300,
            color: "rgba(255,255,255,0.85)",
            marginBottom: "48px",
          }}
        >
          The Professional Platform for Independent Pet Sitters
        </p>
        {/* QR Code card */}
        <div
          style={{
            background: WHITE,
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
            WebkitPrintColorAdjust: "exact" as const,
            printColorAdjust: "exact" as const,
          }}
        >
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fwww.pawspect.co"
            alt="QR code linking to www.pawspect.co"
            width={200}
            height={200}
            style={{ display: "block", borderRadius: "8px" }}
          />
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: CHARCOAL,
              margin: "12px 0 0",
            }}
          >
            Scan to visit pawspect.co
          </p>
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "rgba(255,255,255,0.60)",
            margin: 0,
          }}
        >
          &copy; {new Date().getFullYear()} Data Driven Design Group, LLC &bull;
          Colorado, USA
        </p>
      </ContentLayer>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function BrochurePage() {
  // Add Google Fonts — Playfair Display + Inter
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = printCSS;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@300;400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  return (
    <>
      {/* Floating print button */}
      <button
        type="button"
        className="no-print"
        aria-label="Print brochure"
        onClick={() => window.print()}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "#4F46E5",
          color: WHITE,
          padding: "12px 24px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Printer size={18} />
        Print Brochure
      </button>

      <P01Cover />
      <P02Problem />
      <P03Solution />
      <P04SitterPortal />
      <P05BookingFlow />
      <P06ClientExperience />
      <P07Analytics />
      <P08Invoicing />
      <P09TeamCollab />
      <P10PublicPage />
      <P11MobileFirst />
      <P12TrustLegal />
      <P13SecurityPrivacy />
      <P14AdHocJobs />
      <P15DataRights />
      <P16Pricing />
      <P17GetStarted />
      <P18Testimonials />
      <P19About />
      <P20BackCover />
    </>
  );
}
