import { useCallback, useMemo } from "react";
import { useDesignVaultContext } from "./useDesignVault";
import type { DesignSession, FloorPlan, Modification } from "../types";

export function useSession() {
  const {
    api,
    config,
    anonymousId,
    sessionStartTime,
    isCaptured,
    sessionId,
    setSessionId,
    modifications,
    addModification: ctxAddModification,
    plansViewed,
    addPlanViewed,
    currentPlan,
    setCurrentPlan: ctxSetCurrentPlan,
    stylePref,
  } = useDesignVaultContext();

  // Assemble a DesignSession from context state
  const session = useMemo<DesignSession | null>(() => {
    if (!sessionId) return null;
    return {
      id: sessionId,
      anonymousId,
      planId: currentPlan?.id ?? "",
      builderSlug: config.builderSlug,
      modifications,
      stylePref,
      capturedAt: isCaptured ? new Date().toISOString() : null,
      contactId: null,
    };
  }, [
    sessionId,
    anonymousId,
    currentPlan?.id,
    config.builderSlug,
    modifications,
    stylePref,
    isCaptured,
  ]);

  const addModification = useCallback(
    (mod: Modification) => {
      ctxAddModification(mod);
    },
    [ctxAddModification]
  );

  // Select a plan: store it, track the view, call trackClick, create session
  const setCurrentPlan = useCallback(
    async (plan: FloorPlan) => {
      ctxSetCurrentPlan(plan);
      addPlanViewed(plan.id);

      // Track click (fire-and-forget)
      api.trackClick(plan.id).catch(() => {});

      // Create session on first plan selection
      if (!sessionId) {
        try {
          const { sessionId: newId } = await api.createSession(
            plan.id,
            config.builderSlug,
            anonymousId
          );
          setSessionId(newId);
        } catch {
          // Non-critical — interactions will fall back to anonymousId
        }
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      sessionId,
      setSessionId,
      ctxSetCurrentPlan,
      addPlanViewed,
    ]
  );

  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  }, [sessionStartTime]);

  return {
    session,
    addModification,
    setCurrentPlan,
    plansViewed,
    getSessionDuration,
  };
}
