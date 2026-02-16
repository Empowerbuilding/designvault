import { useCallback, useState } from "react";
import { useDesignVaultContext } from "./useDesignVault";
import { CaptureRequiredError } from "../api/client";
import { trackCRMEvent, getCRMVisitorId } from "../utils/crmTracking";
import type { AIInteractionResult } from "../types";

export function useAIInteractions() {
  const {
    api,
    config,
    isCaptured,
    anonymousId,
    sessionId,
    currentPlan,
    addModification,
  } = useDesignVaultContext();

  const maxFree = config.maxFreeInteractions ?? 1;
  const hardLimit = maxFree + 3;

  const [isStyleSwapProcessing, setIsStyleSwapProcessing] = useState(false);
  const [isFloorPlanProcessing, setIsFloorPlanProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AIInteractionResult | null>(
    null
  );
  const [interactionCount, setInteractionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hitHardLimit, setHitHardLimit] = useState(false);
  const [serverNeedsCapture, setServerNeedsCapture] = useState(false);

  const needsCapture =
    (interactionCount >= maxFree && !isCaptured) || (serverNeedsCapture && !isCaptured);

  const effectiveSessionId = sessionId ?? anonymousId;

  const handleStyleSwap = useCallback(
    async (
      planId: string,
      preset: string,
      imageType?: "exterior" | "interior",
      imageUrl?: string
    ): Promise<AIInteractionResult | null> => {
      if (interactionCount >= hardLimit) {
        setHitHardLimit(true);
        return null;
      }

      setIsStyleSwapProcessing(true);
      setError(null);

      const crmMeta = {
        plan_id: planId,
        plan_title: currentPlan?.title ?? "",
        preset,
        interaction_number: interactionCount + 1,
        site: config.builderSlug,
        session_id: effectiveSessionId,
        anonymous_id: getCRMVisitorId() ?? anonymousId,
      };

      trackCRMEvent("style_swap_started", `Style swap: ${preset}`, crmMeta);

      try {
        const result = await api.styleSwap(
          planId,
          preset,
          effectiveSessionId,
          imageType,
          imageUrl
        );
        setLastResult(result);
        setServerNeedsCapture(false);
        setInteractionCount((c) => c + 1);

        if (result.success && result.resultUrl) {
          addModification({
            type: "style_swap",
            prompt: null,
            stylePreset: preset,
            resultUrl: result.resultUrl,
            originalUrl: currentPlan?.image_url ?? "",
            timestamp: new Date().toISOString(),
          });

          trackCRMEvent("style_swap_completed", `Style swap: ${preset}`, {
            ...crmMeta,
            result_url: result.resultUrl,
            cached: result.cached,
          });
        }

        return result;
      } catch (err) {
        if (err instanceof CaptureRequiredError) {
          if (isCaptured) {
            setError("Something went wrong syncing your saved design. Please try again.");
          } else {
            setServerNeedsCapture(true);
          }
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsStyleSwapProcessing(false);
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      effectiveSessionId,
      isCaptured,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.image_url,
      currentPlan?.title,
    ]
  );

  const handleFloorPlanEdit = useCallback(
    async (
      planId: string,
      prompt: string,
      currentUrl?: string
    ): Promise<AIInteractionResult | null> => {
      if (interactionCount >= hardLimit) {
        setHitHardLimit(true);
        return null;
      }

      setIsFloorPlanProcessing(true);
      setError(null);

      const crmMeta = {
        plan_id: planId,
        plan_title: currentPlan?.title ?? "",
        prompt,
        interaction_number: interactionCount + 1,
        site: config.builderSlug,
        session_id: effectiveSessionId,
        anonymous_id: getCRMVisitorId() ?? anonymousId,
      };

      trackCRMEvent("floor_plan_edit_started", `Floor plan edit: ${prompt.slice(0, 80)}`, crmMeta);

      try {
        const result = await api.floorPlanEdit(
          planId,
          prompt,
          effectiveSessionId,
          currentUrl
        );
        setLastResult(result);
        setServerNeedsCapture(false);
        setInteractionCount((c) => c + 1);

        if (result.success && result.resultUrl) {
          addModification({
            type: "floor_plan_edit",
            prompt,
            stylePreset: null,
            resultUrl: result.resultUrl,
            originalUrl: currentUrl ?? currentPlan?.floor_plan_url ?? "",
            timestamp: new Date().toISOString(),
          });

          trackCRMEvent("floor_plan_edit_completed", `Floor plan edit: ${prompt.slice(0, 80)}`, {
            ...crmMeta,
            result_url: result.resultUrl,
            cached: result.cached,
          });
        }

        return result;
      } catch (err) {
        if (err instanceof CaptureRequiredError) {
          if (isCaptured) {
            setError("Something went wrong syncing your saved design. Please try again.");
          } else {
            setServerNeedsCapture(true);
          }
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsFloorPlanProcessing(false);
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      effectiveSessionId,
      isCaptured,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.floor_plan_url,
      currentPlan?.title,
    ]
  );

  const handleEnhancePrompt = useCallback(
    async (
      prompt: string,
      imageUrl: string
    ): Promise<string | null> => {
      setError(null);

      try {
        const { enhancedPrompt } = await api.enhancePrompt(prompt, imageUrl);
        return enhancedPrompt;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    [api]
  );

  return {
    handleStyleSwap,
    handleFloorPlanEdit,
    handleEnhancePrompt,
    isStyleSwapProcessing,
    isFloorPlanProcessing,
    lastResult,
    needsCapture,
    hitHardLimit,
    interactionCount,
    maxFree,
    hardLimit,
    error,
  };
}
