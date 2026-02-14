import { useCallback, useState } from "react";
import { useDesignVaultContext } from "./useDesignVault";
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AIInteractionResult | null>(
    null
  );
  const [interactionCount, setInteractionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const needsCapture = interactionCount >= maxFree && !isCaptured;

  const effectiveSessionId = sessionId ?? anonymousId;

  const handleStyleSwap = useCallback(
    async (
      planId: string,
      preset: string
    ): Promise<AIInteractionResult | null> => {
      if (interactionCount >= hardLimit) {
        setError("Interaction limit reached");
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await api.styleSwap(
          planId,
          preset,
          effectiveSessionId
        );
        setLastResult(result);
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
        }

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      api,
      effectiveSessionId,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.image_url,
    ]
  );

  const handleFloorPlanEdit = useCallback(
    async (
      planId: string,
      prompt: string,
      currentUrl?: string
    ): Promise<AIInteractionResult | null> => {
      if (interactionCount >= hardLimit) {
        setError("Interaction limit reached");
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const result = await api.floorPlanEdit(
          planId,
          prompt,
          effectiveSessionId,
          currentUrl
        );
        setLastResult(result);
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
        }

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      api,
      effectiveSessionId,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.floor_plan_url,
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
    isProcessing,
    lastResult,
    needsCapture,
    interactionCount,
    error,
  };
}
