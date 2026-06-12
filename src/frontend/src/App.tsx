import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import MobileNav from "./components/MobileNav";
import { useActorReady } from "./hooks/useBackend";
import { BookingDraftProvider } from "./hooks/useBookingDraft";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMarketingPage from "./pages/AdminMarketingPage";
import ApplicationConfirmation from "./pages/ApplicationConfirmation";
import BookingLookupPage from "./pages/BookingLookupPage";
import BookingTestPage from "./pages/BookingTestPage";
import BrochurePage from "./pages/BrochurePage";
import ClientDashboard from "./pages/ClientDashboard";
import ClientFAQPage from "./pages/ClientFAQPage";
import FindSittersPage from "./pages/FindSittersPage";
import GdprConfirmPage from "./pages/GdprConfirmPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import SitterApplicationPage from "./pages/SitterApplicationPage";
import SitterDashboard from "./pages/SitterDashboard";
import SitterDemoPage from "./pages/SitterDemoPage";
import SitterDetailPage, { type PrebookState } from "./pages/SitterDetailPage";
import SitterFAQPage from "./pages/SitterFAQPage";
import SitterFeaturesPage from "./pages/SitterFeaturesPage";
import SitterStorefrontPage from "./pages/SitterStorefrontPage";
import TermsPage from "./pages/TermsPage";

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Catches runtime errors in sitter pages and shows a clean fallback
// instead of a blank white screen.

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SitterPageErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[SitterPageErrorBoundary] caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              maxWidth: "420px",
              border: "1px solid #f3f4f6",
              borderRadius: "1rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🐾</div>
            <p
              style={{
                color: "#111827",
                fontWeight: 700,
                fontSize: "1.1rem",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong loading this page.
            </p>
            <p
              style={{
                color: "#4b5563",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              Please try refreshing. If the problem persists, the sitter profile
              may still be loading.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: "linear-gradient(to right, #f59e0b, #f97316)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.625rem 1.5rem",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export type View =
  | "home"
  | "find-sitters"
  | "sitter-detail"
  | "booking-lookup"
  | "client-dashboard"
  | "sitter-dashboard"
  | "admin-dashboard"
  | "admin-marketing"
  | "role-selection"
  | "sitter-apply"
  | "apply-confirmation"
  | "sitter-features"
  | "sitter-demo"
  | "sitter-storefront"
  | "login"
  | "terms"
  | "privacy"
  | "gdpr-confirm"
  | "client-faq"
  | "sitter-faq"
  | "brochure"
  | "booking-test";

/** Parse query params from the hash portion of the URL.
 *  e.g. /#/booking-lookup?email=foo@bar.com&tab=current
 *  Also detects /#/sitter/:handle routes and /#/sitter-detail?preselectSitter=true&sitterId=xxx
 */
function parseHashParams(): {
  view: string | null;
  email: string | null;
  tab: string | null;
  sitterHandle: string | null;
  preselectSitterId: bigint | null;
  prebookDate: string | null;
  prebookTime: string | null;
} {
  const hash = window.location.hash ?? "";
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path, queryString] = withoutHash.split("?");

  let email: string | null = null;
  let tab: string | null = null;
  let sitterHandle: string | null = null;
  let preselectSitterId: bigint | null = null;
  let prebookDate: string | null = null;
  let prebookTime: string | null = null;

  if (queryString) {
    const params = new URLSearchParams(queryString);
    email = params.get("email");
    tab = params.get("tab");
    prebookDate = params.get("date");
    prebookTime = params.get("time");
    const rawSitterId = params.get("sitterId");
    const preselectSitter = params.get("preselectSitter");
    if (preselectSitter === "true" && rawSitterId) {
      try {
        preselectSitterId = BigInt(rawSitterId);
      } catch {
        // ignore invalid bigint
      }
    }
  }

  // Detect /#/sitter/:handle (public storefront)
  const sitterMatch = (path ?? "").match(/^\/sitter\/([^?#/]+)/);
  if (sitterMatch) {
    sitterHandle = decodeURIComponent(sitterMatch[1]);
    return {
      view: "sitter-storefront",
      email,
      tab,
      sitterHandle,
      preselectSitterId,
      prebookDate,
      prebookTime,
    };
  }

  const view = path ? path.replace(/^\//, "") : null;
  return {
    view,
    email,
    tab,
    sitterHandle,
    preselectSitterId,
    prebookDate,
    prebookTime,
  };
}

// Exponential-backoff delays for warm-up: attempt 0 → 1s, 1 → 2s, 2 → 4s
const WARMUP_DELAYS_MS = [1_000, 2_000, 4_000] as const;
// IC cold starts can take up to 15s — give each attempt enough runway
const WARMUP_TIMEOUT_MS = 15_000;

/**
 * AppPrefetch — eagerly warms the React Query cache after actor confirms ready.
 *
 * Strategy:
 *  1. localStorage hydration already ran in main.tsx before ReactDOM.createRoot,
 *     so pages have stale-but-valid data from tick 0.
 *  2. Once isReady latches true (one-shot, never flickers back): run warm-up
 *     with exponential-backoff retries, then fire per-call guarded prefetches.
 *  3. Keep-alive every 3 minutes. On failure: retry in 30s; if that fails too,
 *     call retryPing() to reinitialise the actor.
 */
function AppPrefetch() {
  const { actor, isReady, retryPing } = useActorReady();
  const qc = useQueryClient();
  const prefetchedRef = useRef(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepAliveFailRef = useRef(0);
  const connectingToastRef = useRef<string | number | null>(null);

  // Show a subtle "Connecting…" toast while the actor is warming up.
  // Dismissed automatically once warm-up completes (success or exhausted).
  useEffect(() => {
    if (isReady) {
      if (connectingToastRef.current !== null) {
        toast.dismiss(connectingToastRef.current);
        connectingToastRef.current = null;
      }
      return;
    }
    // Only show after a short delay so it doesn't flash on fast connections
    const t = setTimeout(() => {
      if (!isReady) {
        connectingToastRef.current = toast.loading("Connecting to Pawspect…", {
          duration: Number.POSITIVE_INFINITY,
        });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [isReady]);

  useEffect(() => {
    // isReady is a one-shot latch in useActorReady — it never flickers back to
    // false, so we will never accidentally skip prefetch due to a transient
    // isFetching blip.
    if (!actor || !isReady || prefetchedRef.current) return;

    const run = async () => {
      // ── Step 1: warm-up with exponential-backoff retry ──────────────────
      // Uses getAllSitters — public, no-auth — so anonymous visitors succeed.
      let warmUpOk = false;
      for (let attempt = 0; attempt < 3 && !warmUpOk; attempt++) {
        try {
          await Promise.race([
            qc.prefetchQuery({
              queryKey: ["all-sitters"],
              queryFn: () => actor.getAllSitters(),
              // Match useAllSitters staleTime so the prefetch result is reused
              staleTime: 60_000,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("warm-up timeout")),
                WARMUP_TIMEOUT_MS,
              ),
            ),
          ]);
          warmUpOk = true;
          console.debug(`[AppPrefetch] warm-up ok on attempt ${attempt + 1}`);
        } catch (e) {
          console.warn(
            `[AppPrefetch] warm-up attempt ${attempt + 1} failed`,
            e,
          );
          if (attempt < 2) {
            await new Promise((r) =>
              setTimeout(r, WARMUP_DELAYS_MS[attempt + 1]),
            );
          }
        }
      }

      // Mark prefetch done AFTER warm-up phase (success or all retries exhausted)
      // so a future re-render never re-enters this effect.
      prefetchedRef.current = true;

      // Dismiss any lingering connecting toast
      if (connectingToastRef.current !== null) {
        toast.dismiss(connectingToastRef.current);
        connectingToastRef.current = null;
      }

      if (!warmUpOk) {
        console.warn(
          "[AppPrefetch] warm-up exhausted — skipping parallel prefetch",
        );
        return;
      }

      // ── Step 2: parallel prefetch with individual error guards ───────────
      // Each call is wrapped so one auth-required failure cannot abort the
      // others.  getCallerUserProfile and getSitterLicenseStatus require the
      // user to be logged in — failure here is normal for anonymous visitors.
      const safeCallerProfile = qc
        .prefetchQuery({
          queryKey: ["caller-profile"],
          queryFn: () => actor.getCallerUserProfile(),
          staleTime: 30_000,
        })
        .catch((e) =>
          console.debug(
            "[AppPrefetch] caller-profile skipped (not logged in?):",
            e,
          ),
        );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeLicenseStatus = (actor as any).getSitterLicenseStatus
        ? qc
            .prefetchQuery({
              queryKey: ["sitter-license-status"],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              queryFn: () => (actor as any).getSitterLicenseStatus(),
              staleTime: 30_000,
            })
            .then((result: unknown) => {
              // Write through to localStorage so next cold start can hydrate it
              try {
                localStorage.setItem(
                  "pawspect_cache_sitter-license-status",
                  JSON.stringify({ data: result, ts: Date.now() }),
                );
              } catch {
                /* storage full — ignore */
              }
              return result;
            })
            .catch((e: unknown) =>
              console.debug(
                "[AppPrefetch] sitter-license-status skipped (auth required?):",
                e,
              ),
            )
        : Promise.resolve();

      await Promise.all([safeCallerProfile, safeLicenseStatus]);
      console.debug("[AppPrefetch] parallel prefetch complete");
    };

    run();
  }, [actor, isReady, qc]);

  // ── Keep-alive: every 3 minutes, ping with getAllSitters (anon-safe) ──────
  // On first failure: schedule a retry in 30s.
  // On second consecutive failure: call retryPing() to reinitialise actor.
  useEffect(() => {
    if (!actor || !isReady) return;

    const ping = async () => {
      try {
        await actor.getAllSitters();
        keepAliveFailRef.current = 0;
        console.debug("[KeepAlive] ping ok");
      } catch (e) {
        keepAliveFailRef.current += 1;
        console.warn(
          `[KeepAlive] ping failed (consecutive failures: ${keepAliveFailRef.current})`,
          e,
        );
        if (keepAliveFailRef.current === 1) {
          // First failure: retry quickly in 30s
          setTimeout(async () => {
            try {
              await actor.getAllSitters();
              keepAliveFailRef.current = 0;
              console.debug("[KeepAlive] retry ping ok");
            } catch {
              keepAliveFailRef.current += 1;
              console.warn(
                "[KeepAlive] retry ping failed — triggering retryPing",
              );
              retryPing();
            }
          }, 30_000);
        }
      }
    };

    keepAliveRef.current = setInterval(ping, 180_000); // 3 minutes
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [actor, isReady, retryPing]);

  return null;
}

/** Inner router */
function AppRouter() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedSitterId, setSelectedSitterId] = useState<bigint | null>(null);
  const [clientEmail, setClientEmail] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [initialTab, setInitialTab] = useState<string>("");
  const [darkMode, setDarkMode] = useState(false);
  const prebookStateRef = useRef<PrebookState | null>(null);
  const [prebookKey, setPrebookKey] = useState(0);
  const [preselectMode, setPreselectMode] = useState(false);

  // On first mount, check if the URL hash has a deep-link with params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { view, email, tab, preselectSitterId, prebookDate, prebookTime } =
      parseHashParams();
    if (view) {
      const validViews: View[] = [
        "find-sitters",
        "booking-lookup",
        "client-dashboard",
        "sitter-dashboard",
        "admin-dashboard",
        "admin-marketing",
        "role-selection",
        "sitter-apply",
        "apply-confirmation",
        "sitter-features",
        "sitter-demo",
        "sitter-storefront",
        "login",
        "terms",
        "privacy",
        "gdpr-confirm",
        "client-faq",
        "sitter-faq",
        "brochure",
        "booking-test",
      ];
      // Handle /#/sitter-detail?preselectSitter=true&sitterId=xxx[&date=YYYY-MM-DD&time=HH:MM]
      if (view === "sitter-detail" && preselectSitterId !== null) {
        setSelectedSitterId(preselectSitterId);
        setPreselectMode(true);
        // If date+time params are present, prime the prebook state so the wizard
        // opens with those values pre-filled (used by "Book This Time" email links)
        if (prebookDate && prebookTime) {
          prebookStateRef.current = {
            prebookDate,
            prebookTime,
            prebookSitterId: preselectSitterId,
          };
          setPrebookKey((k) => k + 1);
        }
        setCurrentView("sitter-detail");
        return;
      }
      if (validViews.includes(view as View)) {
        if (email) setClientEmail(email);
        if (tab) setInitialTab(tab);
        setCurrentView(view as View);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const navigate = (
    view: View,
    sitterId?: bigint,
    email?: string,
    phone?: string,
  ) => {
    if (sitterId !== undefined) setSelectedSitterId(sitterId);
    if (email !== undefined) setClientEmail(email);
    if (phone !== undefined) setClientPhone(phone);
    if (view !== "sitter-detail") {
      prebookStateRef.current = null;
    }
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const navigateWithPrebook = (
    sitterId: bigint,
    prebook: PrebookState,
    contactEmail?: string,
    contactPhone?: string,
  ) => {
    prebookStateRef.current = prebook;
    setPrebookKey((k) => k + 1);
    setSelectedSitterId(sitterId);
    if (contactEmail !== undefined) setClientEmail(contactEmail);
    if (contactPhone !== undefined) setClientPhone(contactPhone);
    setCurrentView("sitter-detail");
    window.scrollTo(0, 0);
  };

  return (
    <>
      <AppPrefetch />
      {currentView === "home" && (
        <div key="home" className="page-enter">
          <HomePage
            navigate={navigate}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        </div>
      )}
      {currentView === "find-sitters" && (
        <div key="find-sitters" className="page-enter">
          <BookingDraftProvider>
            <FindSittersPage
              navigate={navigate}
              navigateWithPrebook={(sitterId, prebook) =>
                navigateWithPrebook(sitterId, prebook)
              }
            />
          </BookingDraftProvider>
        </div>
      )}
      {currentView === "sitter-detail" && selectedSitterId !== null && (
        <div key={`sitter-detail-${prebookKey}`} className="page-enter">
          <SitterDetailPage
            sitterId={selectedSitterId}
            navigate={navigate}
            prebookState={prebookStateRef.current}
            initialClientEmail={clientEmail || undefined}
            initialClientPhone={clientPhone || undefined}
            preselectMode={preselectMode}
          />
        </div>
      )}
      {currentView === "booking-lookup" && (
        <div key="booking-lookup" className="page-enter">
          <BookingLookupPage
            navigate={navigate}
            navigateWithPrebook={navigateWithPrebook}
            initialEmail={clientEmail || undefined}
            initialTab={initialTab || undefined}
          />
        </div>
      )}
      {currentView === "client-dashboard" && (
        <div key="client-dashboard" className="page-enter">
          <ClientDashboard
            navigate={navigate}
            navigateWithPrebook={navigateWithPrebook}
            initialEmail={clientEmail}
            initialTab={initialTab || undefined}
          />
        </div>
      )}
      {currentView === "sitter-dashboard" && (
        <div key="sitter-dashboard" className="page-enter">
          <SitterPageErrorBoundary>
            <SitterDashboard
              navigate={navigate}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              initialTab={initialTab || undefined}
            />
          </SitterPageErrorBoundary>
        </div>
      )}
      {currentView === "admin-dashboard" && (
        <div key="admin-dashboard" className="page-enter">
          <AdminDashboard
            navigate={navigate}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        </div>
      )}
      {currentView === "admin-marketing" && (
        <div key="admin-marketing" className="page-enter">
          <AdminMarketingPage navigate={navigate} />
        </div>
      )}
      {currentView === "sitter-apply" && (
        <div key="sitter-apply" className="page-enter">
          <SitterApplicationPage navigate={navigate} />
        </div>
      )}
      {currentView === "apply-confirmation" && (
        <div key="apply-confirmation" className="page-enter">
          <ApplicationConfirmation navigate={navigate} />
        </div>
      )}
      {currentView === "sitter-features" && (
        <div key="sitter-features" className="page-enter">
          <SitterPageErrorBoundary>
            <SitterFeaturesPage navigate={navigate} />
          </SitterPageErrorBoundary>
        </div>
      )}
      {currentView === "sitter-storefront" && (
        <div key="sitter-storefront" className="page-enter">
          <SitterPageErrorBoundary>
            <SitterStorefrontPage />
          </SitterPageErrorBoundary>
        </div>
      )}
      {currentView === "sitter-demo" && (
        <div key="sitter-demo" className="page-enter">
          <SitterDemoPage navigate={navigate} />
        </div>
      )}
      {currentView === "login" && (
        <div key="login" className="page-enter">
          <LoginPage navigate={navigate} />
        </div>
      )}
      {currentView === "role-selection" && (
        <div key="role-selection" className="page-enter">
          <RoleSelectionPage navigate={navigate} />
        </div>
      )}
      {currentView === "terms" && (
        <div key="terms" className="page-enter">
          <TermsPage navigate={navigate} />
        </div>
      )}
      {currentView === "privacy" && (
        <div key="privacy" className="page-enter">
          <PrivacyPage navigate={navigate} />
        </div>
      )}
      {currentView === "gdpr-confirm" && (
        <div key="gdpr-confirm" className="page-enter">
          <GdprConfirmPage navigate={navigate} />
        </div>
      )}
      {currentView === "client-faq" && (
        <div key="client-faq" className="page-enter">
          <ClientFAQPage navigate={navigate} />
        </div>
      )}
      {currentView === "sitter-faq" && (
        <div key="sitter-faq" className="page-enter">
          <SitterFAQPage navigate={navigate} />
        </div>
      )}
      {currentView === "brochure" && (
        <div key="brochure">
          <BrochurePage />
        </div>
      )}
      {/* MobileNav only on portal views — not on public/marketing pages */}
      {![
        "home",
        "find-sitters",
        "sitter-features",
        "sitter-storefront",
        "terms",
        "privacy",
        "client-faq",
        "sitter-faq",
        "login",
        "role-selection",
        "sitter-apply",
        "apply-confirmation",
        "admin-marketing",
        "gdpr-confirm",
        "brochure",
      ].includes(currentView) && (
        <MobileNav currentView={currentView} navigate={navigate} />
      )}
      <Toaster richColors position="top-right" />
    </>
  );
}

export default function App() {
  // ── sitter-demo bypass ────────────────────────────────────────────────────
  // The sitter-demo route is pure frontend mock data with zero backend calls.
  const { view: hashView } = parseHashParams();
  if (hashView === "sitter-demo") {
    return (
      <>
        <SitterDemoPage
          navigate={(v) => {
            window.location.hash = `/${v}`;
            window.location.reload();
          }}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }
  // ── sitter-storefront bypass ──────────────────────────────────────────────
  // Public route — no auth required. Renders directly without AppRouter wrapper.
  if (hashView === "sitter-storefront") {
    return (
      <>
        <SitterPageErrorBoundary>
          <SitterStorefrontPage />
        </SitterPageErrorBoundary>
        <Toaster richColors position="top-right" />
      </>
    );
  }
  // ── gdpr-confirm bypass ───────────────────────────────────────────────────
  // The gdpr-confirm route does NOT require authentication — it uses the token.
  if (hashView === "gdpr-confirm") {
    return (
      <>
        <GdprConfirmPage
          navigate={(v) => {
            window.location.hash = `/${v}`;
            window.location.reload();
          }}
        />
        <Toaster richColors position="top-right" />
      </>
    );
  }
  // ── brochure bypass ─────────────────────────────────────────────────────────
  // Fully public marketing page — no auth, no backend calls required.
  if (hashView === "brochure") {
    return <BrochurePage />;
  }
  // ── booking-test bypass ──────────────────────────────────────────────────────
  // Dev/QA test page showing all booking screens — no auth required.
  if (hashView === "booking-test") {
    return <BookingTestPage />;
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────

  return <AppRouter />;
}
