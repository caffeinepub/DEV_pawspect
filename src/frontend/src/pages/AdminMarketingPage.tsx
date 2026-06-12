/**
 * AdminMarketingPage — admin-only page with downloadable marketing assets.
 * All graphics are premium CSS/SVG components — on-brand, no stock photos.
 *
 * KEY: Graphics use padding-bottom % intrinsic-ratio technique (not aspectRatio CSS)
 * so they always have height regardless of parent constraints.
 */
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Download,
  Mail,
  PawPrint,
  Printer,
  Share2,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import { APP_NAME } from "../config/business";

interface Props {
  navigate: (view: View) => void;
}

// ─── Font constant ─────────────────────────────────────────────────────────────
const FONT = "'Bricolage Grotesque', system-ui, -apple-system, sans-serif";

// ─── Shared SVG paw print ──────────────────────────────────────────────────────
function PawSVG({
  size = 24,
  fill = "#f59e0b",
}: {
  size?: number;
  fill?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: "block", flexShrink: 0 }}
    >
      <ellipse cx="5.5" cy="9" rx="2.2" ry="3" fill={fill} />
      <ellipse cx="9.5" cy="6.5" rx="2" ry="2.8" fill={fill} />
      <ellipse cx="14" cy="6.5" rx="2" ry="2.8" fill={fill} />
      <ellipse cx="18" cy="9" rx="2.2" ry="3" fill={fill} />
      <path
        d="M12 10.5c-3.5 0-6.5 2-6.5 5.5 0 2.5 3 4 6.5 4s6.5-1.5 6.5-4c0-3.5-3-5.5-6.5-5.5z"
        fill={fill}
      />
    </svg>
  );
}

// ─── Intrinsic ratio wrapper ───────────────────────────────────────────────────
// Uses padding-bottom % trick so the container always has height.
// widthToHeight ratio: e.g. 1/1 = 100%, 16/9 = 56.25%, 7/4 = 57.14%
function IntrinsicRatio({
  ratio,
  children,
  style,
}: {
  ratio: number; // height / width, e.g. 1 for square, 0.5625 for 16:9
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${ratio * 100}%`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Asset 1: Social Post (1080×1080 square) ──────────────────────────────────
function SocialPostGraphic() {
  const AMBER = "#f59e0b";
  const AMBER_DEEP = "#d97706";
  const INDIGO = "#6366f1";
  const BG = "#080912";

  return (
    <IntrinsicRatio ratio={1}>
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(145deg, ${BG} 0%, #0c0f1e 45%, #091018 100%)`,
          fontFamily: FONT,
          color: "white",
          overflow: "hidden",
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
              radial-gradient(ellipse 80% 50% at 50% -5%, rgba(245,158,11,0.22) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 88% 88%, rgba(99,102,241,0.20) 0%, transparent 55%),
              radial-gradient(ellipse 40% 30% at 10% 70%, rgba(99,102,241,0.10) 0%, transparent 50%)
            `,
          }}
        />

        {/* Dot-grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.14,
          }}
        />

        {/* Top amber glow line */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "6%",
            right: "6%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${AMBER}55, ${AMBER}88, ${AMBER}55, transparent)`,
          }}
        />

        {/* ── TOP BAR ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5% 7%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PawSVG size={28} fill={AMBER} />
            <span
              style={{
                fontSize: "clamp(1rem, 3vw, 1.4rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "white",
                fontFamily: FONT,
              }}
            >
              Paw<span style={{ color: AMBER }}>spect</span>
            </span>
          </div>
          <div
            style={{
              background: "rgba(245,158,11,0.14)",
              border: "1px solid rgba(245,158,11,0.38)",
              borderRadius: "100px",
              padding: "4px 12px",
              fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)",
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: AMBER,
              textTransform: "uppercase",
              fontFamily: FONT,
            }}
          >
            Sitter OS
          </div>
        </div>

        {/* ── HEADLINE BLOCK ── */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: "7%",
            right: "7%",
          }}
        >
          <div
            style={{
              fontSize: "clamp(1.4rem, 4.8vw, 3rem)",
              fontWeight: 900,
              lineHeight: 1.06,
              letterSpacing: "-0.045em",
              color: "white",
              marginBottom: "0.5rem",
              fontFamily: FONT,
            }}
          >
            Run Your Pet Sitting
            <br />
            Business Like a{" "}
            <span
              style={{
                background: `linear-gradient(90deg, ${AMBER}, #fb923c)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Pro.
            </span>
          </div>
          <div
            style={{
              fontSize: "clamp(0.55rem, 1.5vw, 0.78rem)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              fontFamily: FONT,
            }}
          >
            Smart Tools · Premium Clients · $15/month
          </div>
        </div>

        {/* ── DASHBOARD MOCKUP (right side) ── */}
        <div
          style={{
            position: "absolute",
            top: "38%",
            right: "5%",
            width: "36%",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: "16px",
              padding: "10px 10px 14px",
              boxShadow:
                "0 0 60px rgba(245,158,11,0.20), 0 0 20px rgba(99,102,241,0.14)",
            }}
          >
            {/* Notch */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "4px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "4px",
                }}
              />
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "7px" }}>
              {[
                { label: "Revenue", value: "$1,840" },
                { label: "Bookings", value: "14" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.22)",
                    borderRadius: "8px",
                    padding: "6px 4px 5px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(0.6rem, 1.6vw, 0.9rem)",
                      fontWeight: 900,
                      color: AMBER,
                      letterSpacing: "-0.03em",
                      fontFamily: FONT,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(0.38rem, 0.95vw, 0.55rem)",
                      color: "rgba(255,255,255,0.45)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      fontFamily: FONT,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
            {/* Mini chart bars */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "flex-end",
                height: "28px",
                padding: "0 4px",
                marginBottom: "6px",
              }}
            >
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: "3px",
                    background:
                      i === 5
                        ? `linear-gradient(to top, ${AMBER}, #fb923c)`
                        : "rgba(245,158,11,0.22)",
                    height: `${h}%`,
                  }}
                />
              ))}
            </div>
            {/* List items */}
            {["New booking: Sun 2pm", "Invoice #14 paid ✓"].map((txt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: "6px",
                  padding: "4px 6px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: i === 0 ? INDIGO : "#10b981",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "clamp(0.38rem, 0.95vw, 0.55rem)",
                    color: "rgba(255,255,255,0.60)",
                    fontWeight: 600,
                    fontFamily: FONT,
                  }}
                >
                  {txt}
                </span>
              </div>
            ))}
          </div>
          {/* Glow under mockup */}
          <div
            style={{
              position: "absolute",
              bottom: "-15%",
              left: "10%",
              right: "10%",
              height: "30%",
              background:
                "radial-gradient(ellipse, rgba(245,158,11,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
              zIndex: -1,
            }}
          />
        </div>

        {/* ── FEATURE ICON STRIP ── */}
        <div
          style={{
            position: "absolute",
            top: "56%",
            left: "7%",
            width: "52%",
            display: "flex",
            gap: "2%",
          }}
        >
          {[
            { icon: "📅", label: "Smart Booking" },
            { icon: "💳", label: "Invoicing" },
            { icon: "📊", label: "Analytics" },
            { icon: "⭐", label: "Reviews" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                borderRadius: "10px",
                padding: "8px 2px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <span style={{ fontSize: "clamp(0.7rem, 2vw, 1.1rem)" }}>
                {icon}
              </span>
              <span
                style={{
                  fontSize: "clamp(0.4rem, 1vw, 0.56rem)",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                  fontFamily: FONT,
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── PRICE + CTA BANNER ── */}
        <div
          style={{
            position: "absolute",
            top: "72%",
            left: "7%",
            right: "7%",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(251,146,60,0.10) 100%)",
              border: "1px solid rgba(245,158,11,0.40)",
              borderRadius: "14px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "clamp(0.55rem, 1.4vw, 0.72rem)",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,158,11,0.85)",
                  marginBottom: "3px",
                  fontFamily: FONT,
                }}
              >
                Start Free for 30 Days
              </div>
              <div
                style={{
                  fontSize: "clamp(0.85rem, 2.2vw, 1.15rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "white",
                  fontFamily: FONT,
                }}
              >
                No credit card required
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "clamp(0.42rem, 1.1vw, 0.55rem)",
                  color: "rgba(255,255,255,0.38)",
                  marginBottom: "2px",
                  fontFamily: FONT,
                }}
              >
                then
              </div>
              <div
                style={{
                  fontSize: "clamp(1.1rem, 3vw, 1.7rem)",
                  fontWeight: 900,
                  color: AMBER,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  fontFamily: FONT,
                }}
              >
                $15
                <span
                  style={{
                    fontSize: "clamp(0.5rem, 1.3vw, 0.68rem)",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.38)",
                  }}
                >
                  /mo
                </span>
              </div>
              <div
                style={{
                  fontSize: "clamp(0.38rem, 0.9vw, 0.5rem)",
                  color: "rgba(255,255,255,0.30)",
                  fontFamily: FONT,
                }}
              >
                All features · No fees
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM SEPARATOR ── */}
        <div
          style={{
            position: "absolute",
            bottom: "11%",
            left: "7%",
            right: "7%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${INDIGO}66, transparent)`,
          }}
        />

        {/* ── BOTTOM: tagline + URL ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 7% 5%",
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.45rem, 1.1vw, 0.60rem)",
              fontWeight: 600,
              color: "rgba(255,255,255,0.30)",
              letterSpacing: "0.04em",
              fontFamily: FONT,
            }}
          >
            Independent. Professional. Yours.
          </span>
          <span
            style={{
              fontSize: "clamp(0.58rem, 1.5vw, 0.78rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: AMBER_DEEP,
              fontFamily: FONT,
            }}
          >
            pawspect.co
          </span>
        </div>
      </div>
    </IntrinsicRatio>
  );
}

// ─── Asset 2: Stripe Checkout Preview (16:9) ───────────────────────────────────
function StripeCheckoutGraphic() {
  return (
    <IntrinsicRatio ratio={9 / 16}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#f6f9fc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── BROWSER CHROME ── */}
        <div
          style={{
            background: "#f1f3f5",
            borderBottom: "1px solid #dde1e7",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 14px",
            height: "36px",
            flexShrink: 0,
          }}
        >
          {/* Traffic lights */}
          {["#fc6058", "#ffbd2e", "#27c840"].map((c) => (
            <div
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                flexShrink: 0,
              }}
            />
          ))}
          {/* Address bar */}
          <div
            style={{
              flex: 1,
              marginLeft: "8px",
              background: "white",
              border: "1px solid #d2d5db",
              borderRadius: "6px",
              padding: "3px 10px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              color: "#3c4043",
            }}
          >
            {/* Lock icon */}
            <svg
              width="10"
              height="12"
              viewBox="0 0 10 12"
              fill="none"
              aria-hidden="true"
            >
              <rect x="1" y="5" width="8" height="7" rx="1.5" fill="#1e8e3e" />
              <path
                d="M3 5V3.5a2 2 0 014 0V5"
                stroke="#1e8e3e"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <span style={{ color: "#1a73e8", fontWeight: 500 }}>
              checkout.stripe.com
            </span>
            <span style={{ color: "#aaa" }}>/pay/cs_live_…</span>
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                color: "#1e8e3e",
                fontWeight: 600,
                fontSize: "10px",
              }}
            >
              🔒 Secure
            </div>
          </div>
        </div>

        {/* ── MAIN CHECKOUT LAYOUT ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* LEFT PANEL — dark product summary */}
          <div
            style={{
              width: "42%",
              background: "linear-gradient(160deg, #1a1f36 0%, #0d1117 100%)",
              padding: "clamp(14px, 3vw, 28px)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Amber glow at bottom */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 90% 50% at 50% 110%, rgba(245,158,11,0.12) 0%, transparent 65%)",
              }}
            />

            {/* Stripe wordmark SVG */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <svg
                aria-hidden="true"
                width="52"
                height="22"
                viewBox="0 0 80 30"
                fill="none"
              >
                {/* "stripe" text as styled SVG paths — simplified S-t-r-i-p-e */}
                <text
                  x="2"
                  y="22"
                  fontSize="22"
                  fontWeight="700"
                  fill="white"
                  opacity="0.90"
                  fontFamily="-apple-system, sans-serif"
                  letterSpacing="-0.5"
                >
                  stripe
                </text>
              </svg>
            </div>

            {/* Product info */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                {/* Product icon */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, rgba(245,158,11,0.28), rgba(245,158,11,0.12))",
                    border: "1px solid rgba(245,158,11,0.40)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PawSVG size={18} fill="#f59e0b" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.45)",
                      marginBottom: "1px",
                    }}
                  >
                    Subscribing to
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "white",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Pawspect Professional
                  </div>
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1,
                  }}
                >
                  $15.00
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.42)",
                      letterSpacing: 0,
                    }}
                  >
                    {" "}
                    / month
                  </span>
                </div>
              </div>

              {/* Trial badge */}
              <div
                style={{
                  background: "rgba(245,158,11,0.13)",
                  border: "1px solid rgba(245,158,11,0.28)",
                  borderRadius: "8px",
                  padding: "7px 11px",
                  fontSize: "10px",
                  color: "#f59e0b",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "12px",
                }}
              >
                ⚡ 30-day free trial — no charge today
              </div>

              {/* Feature list */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                {[
                  "Booking & scheduling system",
                  "Professional invoicing",
                  "Client CRM & analytics",
                  "Public storefront page",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: "rgba(99,102,241,0.22)",
                        border: "1px solid rgba(99,102,241,0.40)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="7"
                        height="7"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="#818cf8"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.52)",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secured by Stripe */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <svg
                width="10"
                height="13"
                viewBox="0 0 10 13"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 0L0 2v3.5C0 8.38 2.13 11.1 5 12c2.87-.9 5-3.62 5-6.5V2L5 0z"
                  fill="rgba(255,255,255,0.22)"
                />
              </svg>
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.30)",
                  fontWeight: 500,
                }}
              >
                Secured by Stripe · 256-bit SSL
              </span>
            </div>
          </div>

          {/* RIGHT PANEL — white payment form */}
          <div
            style={{
              flex: 1,
              background: "white",
              padding: "clamp(14px, 3vw, 26px)",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              overflow: "auto",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1a1f36",
                marginBottom: "2px",
              }}
            >
              Payment details
            </div>

            {/* Email field */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "3px",
                }}
              >
                Email
              </div>
              <div
                style={{
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "7px 10px",
                  fontSize: "12px",
                  color: "#9ca3af",
                  background: "#fafafa",
                }}
              >
                your@email.com
              </div>
            </div>

            {/* Card number */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "3px",
                }}
              >
                Card number
              </div>
              <div
                style={{
                  border: "1.5px solid #6366f1",
                  borderRadius: "6px",
                  padding: "7px 10px",
                  fontSize: "12px",
                  color: "#374151",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 0 0 3px rgba(99,91,255,0.09)",
                }}
              >
                <span style={{ letterSpacing: "0.12em", color: "#9ca3af" }}>
                  4242 4242 4242 4242
                </span>
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 17,
                      borderRadius: "3px",
                      background: "#1a1f5e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "6px",
                        fontWeight: 900,
                        color: "white",
                        fontStyle: "italic",
                      }}
                    >
                      VISA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry + CVC */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { label: "Expiration", placeholder: "MM / YY" },
                { label: "CVC", placeholder: "•••" },
              ].map(({ label, placeholder }) => (
                <div key={label} style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#6b7280",
                      marginBottom: "3px",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      color: "#9ca3af",
                      background: "#fafafa",
                    }}
                  >
                    {placeholder}
                  </div>
                </div>
              ))}
            </div>

            {/* Name on card */}
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#6b7280",
                  marginBottom: "3px",
                }}
              >
                Name on card
              </div>
              <div
                style={{
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "7px 10px",
                  fontSize: "12px",
                  color: "#9ca3af",
                  background: "#fafafa",
                }}
              >
                Full name
              </div>
            </div>

            {/* CTA button */}
            <button
              type="button"
              style={{
                background: "linear-gradient(135deg, #635bff 0%, #4f46e5 100%)",
                border: "none",
                borderRadius: "6px",
                padding: "10px 16px",
                color: "white",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                boxShadow: "0 4px 16px rgba(99,91,255,0.32)",
                marginTop: "2px",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 1a11 11 0 100 22A11 11 0 0012 1zm-1 16l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L20 8l-9 9z"
                  fill="white"
                />
              </svg>
              Start free trial — $0 today
            </button>

            {/* Fine print */}
            <p
              style={{
                fontSize: "9px",
                color: "#9ca3af",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              By confirming, you agree to our{" "}
              <span style={{ color: "#6366f1", textDecoration: "underline" }}>
                Terms
              </span>{" "}
              &{" "}
              <span style={{ color: "#6366f1", textDecoration: "underline" }}>
                Privacy Policy
              </span>
              . Cancel anytime.
            </p>

            {/* Powered by Stripe */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                marginTop: "auto",
                paddingTop: "4px",
              }}
            >
              <svg
                width="9"
                height="11"
                viewBox="0 0 10 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 0L0 2v3.5C0 8.38 2.13 11.1 5 12c2.87-.9 5-3.62 5-6.5V2L5 0z"
                  fill="#9ca3af"
                />
              </svg>
              <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                Powered by Stripe · PCI compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </IntrinsicRatio>
  );
}

// ─── Asset 3: Postcard Print Ad (7:4 landscape) ────────────────────────────────
function PostcardGraphic() {
  const [side, setSide] = useState<"sitter" | "client">("sitter");
  const AMBER = "#f59e0b";
  const AMBER_DEEP = "#d97706";

  return (
    <div style={{ width: "100%", fontFamily: FONT }}>
      {/* Tab switcher */}
      <div
        style={{
          display: "inline-flex",
          gap: "4px",
          padding: "4px",
          borderRadius: "12px",
          marginBottom: "12px",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        {(["sitter", "client"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: side === s ? "white" : "transparent",
              color: side === s ? "#0f172a" : "rgba(255,255,255,0.55)",
              fontFamily: FONT,
            }}
          >
            {s === "sitter" ? "Sitter Side" : "Client Side"}
          </button>
        ))}
      </div>

      {/* Card with intrinsic 7:4 ratio */}
      <IntrinsicRatio
        ratio={4 / 7}
        style={{
          borderRadius: "8px",
          border: "2px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* ── SITTER SIDE ── */}
        {side === "sitter" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, #080912 0%, #0c0f1e 50%, #091018 100%)",
              display: "flex",
              flexDirection: "column",
              padding: "clamp(14px, 4%, 28px)",
              overflow: "hidden",
            }}
          >
            {/* Background glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 90% 60% at 50% 120%, rgba(245,158,11,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 92% 10%, rgba(99,102,241,0.14) 0%, transparent 55%)",
              }}
            />
            {/* Dot grid */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: 0.12,
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                position: "relative",
                marginBottom: "6px",
              }}
            >
              <PawSVG size={16} fill={AMBER} />
              <span
                style={{
                  fontSize: "clamp(0.65rem, 2vw, 0.88rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "white",
                  fontFamily: FONT,
                }}
              >
                Paw<span style={{ color: AMBER }}>spect</span>
              </span>
            </div>

            {/* Main content */}
            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(0.5rem, 1.5vw, 0.65rem)",
                  fontWeight: 700,
                  color: "rgba(245,158,11,0.88)",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  marginBottom: "5px",
                  fontFamily: FONT,
                }}
              >
                For Independent Pet Sitters
              </div>
              <div
                style={{
                  fontSize: "clamp(0.95rem, 2.9vw, 1.6rem)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  color: "white",
                  marginBottom: "7px",
                  fontFamily: FONT,
                }}
              >
                Turn Your Love of Pets
                <br />
                Into a Professional
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Business.
                </span>
              </div>
              <p
                style={{
                  fontSize: "clamp(0.45rem, 1.2vw, 0.65rem)",
                  color: "rgba(255,255,255,0.52)",
                  lineHeight: 1.55,
                  marginBottom: "10px",
                  fontFamily: FONT,
                }}
              >
                Bookings · Invoices · CRM · Analytics · Storefront
                <br />
                No platform fees. No commissions. Just your business.
              </p>

              {/* Feature list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  marginBottom: "10px",
                }}
              >
                {[
                  "📅 Smart booking calendar",
                  "💳 Professional invoices",
                  "📊 Business analytics",
                  "🌐 Public storefront page",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "clamp(0.42rem, 1.1vw, 0.60rem)",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.65)",
                        fontFamily: FONT,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(99,102,241,0.10) 100%)",
                border: "1px solid rgba(245,158,11,0.38)",
                borderRadius: "10px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "clamp(0.4rem, 1vw, 0.54rem)",
                    fontWeight: 700,
                    color: AMBER,
                    letterSpacing: "0.06em",
                    fontFamily: FONT,
                  }}
                >
                  START FREE AT
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.62rem, 1.6vw, 0.85rem)",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.03em",
                    fontFamily: FONT,
                  }}
                >
                  pawspect.co
                </div>
              </div>
              {/* QR placeholder */}
              <div
                style={{
                  width: "clamp(28px, 8vw, 44px)",
                  height: "clamp(28px, 8vw, 44px)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderRadius: "4px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gridTemplateRows: "1fr 1fr 1fr",
                  gap: "2px",
                  padding: "3px",
                }}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      background: [0, 2, 6, 8, 4].includes(i)
                        ? "rgba(255,255,255,0.70)"
                        : "transparent",
                      borderRadius: "1px",
                    }}
                  />
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "clamp(0.38rem, 0.95vw, 0.52rem)",
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: FONT,
                  }}
                >
                  30-day trial
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.52rem, 1.3vw, 0.70rem)",
                    fontWeight: 900,
                    color: AMBER,
                    letterSpacing: "-0.02em",
                    fontFamily: FONT,
                  }}
                >
                  then $15/mo
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENT SIDE ── */}
        {side === "client" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, #fffef9 0%, #fdf8ec 60%, #fff9f0 100%)",
              display: "flex",
              flexDirection: "column",
              padding: "clamp(14px, 4%, 28px)",
              overflow: "hidden",
            }}
          >
            {/* Warm accent glows */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                pointerEvents: "none",
                width: "45%",
                height: "40%",
                background:
                  "radial-gradient(ellipse at top right, rgba(245,158,11,0.15) 0%, transparent 70%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                pointerEvents: "none",
                width: "35%",
                height: "30%",
                background:
                  "radial-gradient(ellipse at bottom left, rgba(99,102,241,0.08) 0%, transparent 65%)",
              }}
            />

            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                position: "relative",
                marginBottom: "6px",
              }}
            >
              <PawSVG size={16} fill={AMBER_DEEP} />
              <span
                style={{
                  fontSize: "clamp(0.65rem, 2vw, 0.88rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "#1e1b4b",
                  fontFamily: FONT,
                }}
              >
                Paw<span style={{ color: AMBER_DEEP }}>spect</span>
              </span>
            </div>

            {/* Content */}
            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(0.5rem, 1.4vw, 0.65rem)",
                  fontWeight: 700,
                  color: AMBER_DEEP,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  marginBottom: "5px",
                  fontFamily: FONT,
                }}
              >
                Find a Pet Sitter Near You
              </div>
              <div
                style={{
                  fontSize: "clamp(0.95rem, 2.9vw, 1.6rem)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.04em",
                  color: "#0f172a",
                  marginBottom: "7px",
                  fontFamily: FONT,
                }}
              >
                Trusted, Local, and
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Independent.
                </span>
              </div>
              <p
                style={{
                  fontSize: "clamp(0.45rem, 1.2vw, 0.65rem)",
                  color: "#6b7280",
                  lineHeight: 1.55,
                  marginBottom: "10px",
                  fontFamily: FONT,
                }}
              >
                Book a local, independent sitter — vetted, reviewed, and
                <br />
                ready to care for your pet. Book in minutes at pawspect.co
              </p>

              {/* Badges */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                  marginBottom: "10px",
                }}
              >
                {[
                  "No Platform Fees",
                  "Instant Booking",
                  "Secure Payments",
                  "Verified Sitters",
                ].map((badge) => (
                  <div
                    key={badge}
                    style={{
                      background: "rgba(245,158,11,0.10)",
                      border: "1px solid rgba(245,158,11,0.30)",
                      borderRadius: "100px",
                      padding: "2px 8px",
                      fontSize: "clamp(0.38rem, 1vw, 0.54rem)",
                      fontWeight: 700,
                      color: "#92400e",
                      fontFamily: FONT,
                    }}
                  >
                    ✓ {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                borderRadius: "10px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "clamp(0.4rem, 1vw, 0.54rem)",
                    fontWeight: 700,
                    color: AMBER,
                    letterSpacing: "0.06em",
                    fontFamily: FONT,
                  }}
                >
                  FIND SITTERS AT
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.62rem, 1.6vw, 0.85rem)",
                    fontWeight: 900,
                    color: "white",
                    letterSpacing: "-0.03em",
                    fontFamily: FONT,
                  }}
                >
                  pawspect.co
                </div>
              </div>
              {/* QR placeholder */}
              <div
                style={{
                  width: "clamp(28px, 8vw, 44px)",
                  height: "clamp(28px, 8vw, 44px)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderRadius: "4px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gridTemplateRows: "1fr 1fr 1fr",
                  gap: "2px",
                  padding: "3px",
                }}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      background: [0, 2, 6, 8, 4].includes(i)
                        ? "rgba(255,255,255,0.70)"
                        : "transparent",
                      borderRadius: "1px",
                    }}
                  />
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "clamp(0.38rem, 0.95vw, 0.52rem)",
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: FONT,
                  }}
                >
                  No account needed
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.52rem, 1.3vw, 0.70rem)",
                    fontWeight: 900,
                    color: AMBER,
                    letterSpacing: "-0.02em",
                    fontFamily: FONT,
                  }}
                >
                  Book in minutes
                </div>
              </div>
            </div>
          </div>
        )}
      </IntrinsicRatio>
    </div>
  );
}

// ─── Asset configs ─────────────────────────────────────────────────────────────
const ASSET_CONFIGS = [
  {
    id: "social",
    label: "Social Post Graphic",
    tag: "Instagram · Facebook · Nextdoor",
    icon: Smartphone,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
    downloadName: "pawspect-social-post.png",
    dimensions: "1080 × 1080 px (square)",
    headline: "Built for sitters who mean business",
    body: "Post this on Nextdoor, Instagram, or your neighborhood Facebook group. One image, one link — let Pawspect do the explaining. Show pet owners you're the real deal: professional tools, instant booking, zero drama.",
    bullets: [
      "Optimized for square social feeds",
      "High contrast — readable on mobile",
      "Share directly or post as a story",
    ],
    ctaLabel: "Print / Save Social Post",
    accentColor: "oklch(0.55 0.22 270)",
    bg: "linear-gradient(145deg, oklch(0.16 0.12 270 / 0.95), oklch(0.20 0.16 275 / 0.95))",
    borderColor: "oklch(0.55 0.22 270 / 0.35)",
    component: SocialPostGraphic,
  },
  {
    id: "stripe",
    label: "Stripe Checkout Preview",
    tag: "Website · Email · Landing Page",
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
    downloadName: "pawspect-stripe-checkout.png",
    dimensions: "1400 × 800 px (landscape 16:9)",
    headline: "Make the decision easy — here's exactly what you get",
    body: "$15/month. No platform fees. No commission on your bookings. This graphic shows new sitters exactly what the checkout looks like so there are zero surprises at signup.",
    bullets: [
      "Faithful replica of the real Stripe checkout UI",
      "Perfect for email newsletters and landing pages",
      "Clear value proposition at a glance",
    ],
    ctaLabel: "Print / Save Stripe Preview",
    accentColor: "oklch(0.72 0.18 55)",
    bg: "linear-gradient(145deg, oklch(0.16 0.10 50 / 0.95), oklch(0.20 0.15 55 / 0.95))",
    borderColor: "oklch(0.72 0.18 55 / 0.35)",
    component: StripeCheckoutGraphic,
  },
  {
    id: "postcard",
    label: "Print Postcard (4×6)",
    tag: "Print · Physical Mail · Flyer",
    icon: BarChart3,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    downloadName: "pawspect-postcard-print.png",
    dimensions: "4×6 ratio — print at Staples/FedEx Office",
    headline: "Put Pawspect in people's hands — literally",
    body: "Print this at your local Staples or FedEx Office for pennies. Leave a stack at dog parks, vet waiting rooms, pet stores, and community boards. Every card is a lead that comes to you — not a platform that takes 30%.",
    bullets: [
      "Sitter + client sides with one-tap toggle",
      "Print-ready at standard 4×6 size",
      "Works at Staples, FedEx Office, or Canva Print",
    ],
    ctaLabel: "Print / Save Postcard",
    accentColor: "oklch(0.60 0.16 145)",
    bg: "linear-gradient(145deg, oklch(0.16 0.10 145 / 0.95), oklch(0.20 0.14 145 / 0.95))",
    borderColor: "oklch(0.60 0.16 145 / 0.35)",
    component: PostcardGraphic,
  },
] as const;

// ─── Pitch points ──────────────────────────────────────────────────────────────
const WHY_SITTER = [
  {
    icon: TrendingUp,
    title: "Your business, your earnings",
    body: "Zero commission. Zero platform fees. You set your prices. Clients pay you directly. We charge one flat $15/month — that's it.",
  },
  {
    icon: Star,
    title: "Look like the pro you are",
    body: "A public storefront with your services, reviews, and photos. One shareable link. Clients book at 11pm. You wake up to confirmed appointments.",
  },
  {
    icon: Users,
    title: "Your clients stay yours",
    body: "CRM, repeat booking history, coupon offers, and direct messaging — all yours. No platform owns your client relationships.",
  },
  {
    icon: Zap,
    title: "Everything in one place",
    body: "Booking, invoicing, analytics, and a business coach — in your pocket. Not 6 different apps.",
  },
];

const WHY_CLIENT = [
  {
    icon: Check,
    title: "Sitters who invest in their craft",
    body: "A sitter who pays for professional tools is a sitter who takes their work seriously. That's exactly who you want with your pet.",
  },
  {
    icon: Star,
    title: "Transparent, direct relationship",
    body: "You book directly with your sitter. No middleman taking 30%. Your sitter keeps more — so they can keep doing what they love.",
  },
  {
    icon: Mail,
    title: "Informed every step of the way",
    body: "Booking confirmation, visit updates, and invoices land in your inbox automatically. No chasing, no guessing.",
  },
  {
    icon: Users,
    title: "No account required",
    body: "Find a sitter, book, pay, and get visit updates — without creating yet another account. Just your email or phone.",
  },
];

// ─── AssetCard ─────────────────────────────────────────────────────────────────
function AssetCard({ asset }: { asset: (typeof ASSET_CONFIGS)[number] }) {
  const [lightbox, setLightbox] = useState(false);
  const assetRef = useRef<HTMLDivElement>(null);
  const GraphicComponent = asset.component;

  const handlePrint = () => {
    const el = assetRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><title>${asset.label}</title>
      <style>
        @font-face { font-family: 'Bricolage Grotesque'; src: url('/assets/fonts/BricolageGrotesque.woff2') format('woff2'); }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .asset { width: 100%; max-width: 1000px; }
        @media print { body { margin: 0; } .asset { max-width: 100%; } }
      </style>
    </head><body><div class="asset">${el.outerHTML}</div></body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups and try again.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      setTimeout(() => {
        win.print();
      }, 300);
    };
    toast.success(`${asset.label} opened for printing / saving`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/#/admin/marketing`,
      );
      toast.success("Marketing page URL copied to clipboard");
    } catch {
      toast.error("Could not copy — try manually copying the address bar.");
    }
  };

  const Icon = asset.icon;

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <dialog
          open
          aria-label={`${asset.label} full size`}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-8 w-full h-full border-0 m-0"
          style={{
            background: "rgba(0,0,0,0.94)",
            backdropFilter: "blur(12px)",
            maxWidth: "100vw",
            maxHeight: "100vh",
          }}
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === "Escape" && setLightbox(false)}
          data-ocid={`marketing.${asset.id}.lightbox`}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <GraphicComponent />
          </div>
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors text-lg font-bold"
            aria-label="Close lightbox"
            data-ocid={`marketing.${asset.id}.close_button`}
          >
            ✕
          </button>
        </dialog>
      )}

      <div
        className="rounded-3xl border overflow-hidden"
        style={{ background: asset.bg, borderColor: asset.borderColor }}
        data-ocid={`marketing.${asset.id}.card`}
      >
        {/* Graphic preview — uses intrinsic ratio so it always has height */}
        <button
          type="button"
          className="relative cursor-zoom-in group w-full text-left p-0 border-0 bg-transparent block"
          onClick={() => setLightbox(true)}
          aria-label={`View ${asset.label} full size`}
          data-ocid={`marketing.${asset.id}.preview_button`}
        >
          {/* Preview wrapper: no maxHeight clipping, let the intrinsic ratio size it */}
          <div ref={assetRef} style={{ width: "100%", display: "block" }}>
            <GraphicComponent />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-slate-800 text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View full size
            </div>
          </div>
        </button>

        {/* Meta */}
        <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${asset.iconBg}`}
          >
            <Icon size={18} className={asset.iconColor} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h3 className="font-display text-lg font-bold text-white">
                {asset.label}
              </h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `${asset.accentColor.replace(")", " / 0.15)")}`,
                  border: `1px solid ${asset.accentColor.replace(")", " / 0.28)")}`,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {asset.tag}
              </span>
            </div>
            <p className="text-xs text-white/50">{asset.dimensions}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-2">
          <p className="text-sm font-bold text-white mb-1.5">
            {asset.headline}
          </p>
          <p className="text-xs text-white/65 leading-relaxed mb-4">
            {asset.body}
          </p>
          <ul className="space-y-1.5 mb-5">
            {asset.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: `${asset.accentColor.replace(")", " / 0.20)")}`,
                  }}
                >
                  <Check size={10} className="text-white/80" />
                </div>
                <span className="text-xs text-white/70">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA row */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handlePrint}
            className="flex-1 h-11 rounded-2xl font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${asset.accentColor}, ${asset.accentColor.replace(")", " / 0.72)")})`,
              color: "white",
              border: "none",
            }}
            data-ocid={`marketing.${asset.id}.download_button`}
          >
            <Printer size={15} className="mr-2" />
            {asset.ctaLabel}
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="h-11 rounded-2xl font-semibold text-sm text-white border-white/20 hover:bg-white/10 hover:border-white/30"
            data-ocid={`marketing.${asset.id}.copy_link_button`}
          >
            <Share2 size={15} className="mr-2" />
            Share Page
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Pitch section ─────────────────────────────────────────────────────────────
function PitchSection({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: typeof WHY_SITTER;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-1">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(({ icon: ItemIcon, title: t, body }) => (
          <div
            key={t}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: accent }}
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ItemIcon size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground mb-1">{t}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminMarketingPage({ navigate }: Props) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.12 0.10 265) 0%, oklch(0.10 0.06 240) 50%, oklch(0.12 0.08 200) 100%)",
      }}
      data-ocid="admin.marketing.page"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.14 0.12 265 / 0.97), oklch(0.14 0.12 265 / 0.90))",
          backdropFilter: "blur(16px)",
          borderColor: "oklch(0.40 0.12 265 / 0.30)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("admin-dashboard")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Back to admin"
            data-ocid="admin.marketing.back_button"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.72 0.18 55 / 0.25)" }}
          >
            <PawPrint size={18} className="text-amber-300" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base font-bold text-white leading-tight">
              Marketing Assets
            </h1>
            <p className="text-xs text-white/50">{APP_NAME} · Admin only</p>
          </div>
          <div className="ml-auto">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: "oklch(0.72 0.18 55 / 0.18)",
                border: "1px solid oklch(0.72 0.18 55 / 0.30)",
                color: "oklch(0.85 0.14 60)",
              }}
            >
              🔒 Admin Only
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center py-6">
          <div
            className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.18 55 / 0.30) 0%, oklch(0.72 0.18 55 / 0.08) 70%)",
              boxShadow: "0 0 40px oklch(0.72 0.18 55 / 0.20)",
              border: "1px solid oklch(0.72 0.18 55 / 0.25)",
            }}
          >
            <PawPrint size={30} className="text-amber-300" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Your wow moment starts here.
          </h1>
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Three production-ready marketing assets — designed to make{" "}
            <span className="text-amber-300 font-semibold">{APP_NAME}</span>{" "}
            irresistible to sitters and pet owners alike. Pure CSS/SVG — no
            stock photos, no AI images.
          </p>
        </div>

        {/* Asset grid */}
        <section data-ocid="admin.marketing.assets.section">
          <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Download size={16} className="text-amber-300" />
            Downloadable Assets
          </h2>
          <div className="space-y-8">
            {ASSET_CONFIGS.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </section>

        {/* Pitch sections */}
        <section data-ocid="admin.marketing.sitter_pitch.section">
          <PitchSection
            title="Why sitters choose Pawspect"
            subtitle="Use these talking points on social, in emails, or when someone asks 'what is this?'"
            items={WHY_SITTER}
            accent="oklch(0.55 0.12 270 / 0.08)"
          />
        </section>

        <section data-ocid="admin.marketing.client_pitch.section">
          <PitchSection
            title="Why clients book through Pawspect"
            subtitle="What pet owners care about — in the words that actually land."
            items={WHY_CLIENT}
            accent="oklch(0.55 0.10 60 / 0.08)"
          />
        </section>

        {/* Distribution guide */}
        <div
          className="rounded-3xl p-6 sm:p-8 border"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.16 0.14 265 / 0.90), oklch(0.20 0.18 270 / 0.90))",
            borderColor: "oklch(0.50 0.18 265 / 0.30)",
          }}
          data-ocid="admin.marketing.distribution.section"
        >
          <h2 className="font-display text-lg font-bold text-white mb-4">
            Where to use each asset
          </h2>
          <div className="space-y-4">
            {[
              {
                asset: "Social Post (square)",
                channels:
                  "Nextdoor, Instagram, Facebook Groups, Local Community Pages",
                tip: "Post in neighborhood groups — tag it 'local business' to boost visibility",
              },
              {
                asset: "Stripe Checkout Preview",
                channels:
                  "Email newsletters, pawspect.co landing page, sitter onboarding email",
                tip: "Use when explaining pricing — removes payment anxiety before sitters click Subscribe",
              },
              {
                asset: "Print Postcard (4×6)",
                channels:
                  "Dog parks, vet clinics, pet stores, dog groomers, community bulletin boards",
                tip: "Print 50 copies at Staples (~$5) and drop them at local dog parks and community boards",
              },
            ].map(({ asset: a, channels, tip }) => (
              <div
                key={a}
                className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl"
                style={{ background: "oklch(1 0 0 / 0.05)" }}
              >
                <div className="shrink-0">
                  <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-1 rounded-lg">
                    {a}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white/80 font-medium mb-1">
                    {channels}
                  </p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    💡 {tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex justify-center pb-8">
          <button
            type="button"
            onClick={() => navigate("admin-dashboard")}
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-2"
            data-ocid="admin.marketing.back_to_admin.link"
          >
            <ArrowLeft size={14} />
            Back to Admin Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
