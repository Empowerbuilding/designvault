/**
 * Safe wrapper around the external CRM tracking script (window.CRMTracking).
 * All calls are no-ops if the tracking script isn't loaded.
 */

const CRM_VISITOR_KEY = "_crm_visitor_id";

/** Returns the CRM visitor ID, preferring the tracking script's live value. */
export function getCRMVisitorId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.CRMTracking?.getVisitorId?.() ??
      localStorage.getItem(CRM_VISITOR_KEY);
  } catch {
    return null;
  }
}

/** Fire a CRM activity event. Safe to call even if tracking.js isn't loaded. */
export function trackCRMEvent(
  type: string,
  title: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    window.CRMTracking?.trackEvent(type, title, metadata);
  } catch {
    // Tracking should never break the app
  }
}
