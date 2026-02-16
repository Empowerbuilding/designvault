import { useCallback, useState } from "react";
import { useDesignVaultContext } from "./useDesignVault";
import { fireMetaPixelEvent } from "../utils/tracking";
import { trackCRMEvent, getCRMVisitorId } from "../utils/crmTracking";
import type { LeadCaptureData } from "../types";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function getFbTracking() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") || (() => {
    try { return localStorage.getItem("fbclid"); } catch { return null; }
  })();
  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");
  return {
    ...(fbclid && { fbclid }),
    ...(fbp && { fbp }),
    ...(fbc && { fbc }),
    client_user_agent: navigator.userAgent,
  };
}

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
        ...getFbTracking(),
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

        trackCRMEvent("lead_form_submitted", `Lead: ${formData.email}`, {
          plan_id: currentPlan?.id ?? "",
          plan_title: currentPlan?.title ?? "",
          email: formData.email,
          modifications_count: modifications.length,
          plans_viewed: plansViewed.length,
          session_duration: sessionDuration,
          site: config.builderSlug,
          session_id: sessionId ?? anonymousId,
          anonymous_id: getCRMVisitorId() ?? anonymousId,
        });

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
