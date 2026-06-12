import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Backend, createActor } from "../backend";

/**
 * Thin wrapper that binds the project's createActor factory to useActor.
 * Use this everywhere instead of calling useActor() directly.
 *
 * Returns { actor, isFetching } — the standard Caffeine actor hook.
 * Actor is null while the backend connection is initializing.
 */
export function useBackendActor() {
  return useCaffeineActor(createActor);
}

/**
 * Compatibility shim used by useQueries.ts and AppPrefetch.
 *
 * Maps the standard Caffeine `{ actor, isFetching }` to the shape
 * `{ actor, isReady, pingFailed, retryPing }` that the app expects.
 *
 * Key improvement over the previous implementation:
 *   `isReady` is based on a one-shot "confirmed ready" latch that NEVER goes
 *   back to false once it has been set.  This prevents a brief isFetching
 *   flicker from causing AppPrefetch to think the actor became unavailable
 *   and silently skip all prefetch queries.
 *
 * pingFailed = false always (useActor handles retries internally).
 * retryPing  = reloads the page so useActor re-creates the actor from scratch.
 */
export function useActorReady(): {
  actor: Backend | null;
  isReady: boolean;
  pingFailed: boolean;
  retryPing: () => void;
} {
  const { actor, isFetching } = useCaffeineActor(createActor);

  // One-shot latch: once the actor becomes non-null and non-fetching, we
  // consider it permanently "confirmed ready" for the lifetime of this
  // component tree — even if isFetching briefly flips back to true during
  // a background refresh.
  const confirmedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (confirmedRef.current) return; // already latched — never reset
    if (actor && !isFetching) {
      confirmedRef.current = true;
      setIsReady(true);
      console.debug("[ActorReady] actor confirmed ready — latch set");
    }
  }, [actor, isFetching]);

  const retryPing = useCallback(() => {
    // Force a page reload — React Query will re-create the actor on mount.
    window.location.reload();
  }, []);

  return {
    actor: actor as Backend | null,
    isReady,
    pingFailed: false,
    retryPing,
  };
}
