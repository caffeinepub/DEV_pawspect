import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // ICP cold start is 3-15 seconds. 3 retries with linear backoff (1s, 2s, 3s)
      // covers it without hammering the canister.
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
      // Disable automatic refetch on focus — prevents thundering herd on tab switch
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// ── Synchronous localStorage hydration ────────────────────────────────────────
// Seed the React Query cache from localStorage BEFORE React renders so that
// pages always have stale-but-valid data from tick 0 — no race with component
// body initialisation or useEffect ordering.
const HYDRATE_KEYS = [
  "caller-profile",
  "all-sitters",
  "sitter-license-status",
] as const;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — must match useQueries.ts

(function hydrateQueryCacheFromStorage() {
  for (const key of HYDRATE_KEYS) {
    try {
      const raw = localStorage.getItem(`pawspect_cache_${key}`);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { data: unknown; ts: number };
      if (Date.now() - parsed.ts > CACHE_TTL_MS) continue;
      const existing = queryClient.getQueryData([key]);
      if (existing === undefined && parsed.data !== undefined) {
        queryClient.setQueryData([key], parsed.data);
        console.debug(`[ColdStart] pre-hydrated "${key}" from localStorage`);
      }
    } catch {
      // ignore any parse/storage errors — never block render
    }
  }
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <App />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
