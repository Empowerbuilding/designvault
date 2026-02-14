import { useCallback, useState } from "react";
import { useDesignVaultContext } from "./useDesignVault";
import { fireMetaPixelEvent } from "../utils/tracking";
import type { LeadCaptureData } from "../types";

const FAVORITES_KEY = "dv-favorites";

function readFavoritesFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useLeadCapture() {
  const {
    api,
    config,
    anonymousId,
    sessionStartTime,
    sessionId,
    modifications,
    plansViewed,
    currentPlan,
    stylePref,
    setCaptured,
  } = useDesignVaultContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCapture = useCallback(() => setIsOpen(true), []);
  const closeCapture = useCallback(() => setIsOpen(false), []);

  const submitCapture = useCallback(
    async (formData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) => {
      setIsSubmitting(true);
      setError(null);

      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTime) / 1000
      );

      const data: LeadCaptureData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        planId: currentPlan?.id ?? "",
        planTitle: currentPlan?.title ?? "",
        planSpecs: {
          beds: currentPlan?.beds ?? 0,
          baths: currentPlan?.baths ?? 0,
          area: currentPlan?.area ?? 0,
        },
        modifications,
        favorites: readFavoritesFromStorage(),
        stylePref,
        sessionDuration,
        plansViewed: plansViewed.length,
      };

      try {
        await api.saveDesign(
          data,
          sessionId ?? anonymousId,
          config.builderSlug
        );

        setSubmitted(true);
        setCaptured(true);
        setIsOpen(false);

        // Fire Meta pixel Lead event if configured
        if (config.metaPixelId) {
          fireMetaPixelEvent(config.metaPixelId, "Lead", {
            content_name: currentPlan?.title,
            content_ids: [currentPlan?.id],
            content_category: currentPlan?.category,
            value: currentPlan?.area,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      api,
      config.builderSlug,
      config.metaPixelId,
      anonymousId,
      sessionStartTime,
      sessionId,
      modifications,
      plansViewed.length,
      currentPlan,
      stylePref,
      setCaptured,
    ]
  );

  return {
    isOpen,
    openCapture,
    closeCapture,
    submitCapture,
    isSubmitting,
    submitted,
    error,
  };
}
