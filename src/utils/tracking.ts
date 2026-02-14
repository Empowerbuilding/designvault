import type { FloorPlan } from "../types";

// ── Global type declarations ────────────────────────────────

type FbqMethod = "track" | "trackCustom" | "init";

interface Fbq {
  (method: FbqMethod, event: string, params?: Record<string, unknown>): void;
}

declare global {
  interface Window {
    fbq?: Fbq;
    dataLayer?: Record<string, unknown>[];
  }
}

// ── Helpers ─────────────────────────────────────────────────

function fbq(
  method: FbqMethod,
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq(method, event, params);
}

function pushDataLayer(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...data });
}

function planData(plan: FloorPlan): Record<string, unknown> {
  return {
    content_name: plan.title,
    content_ids: [plan.id],
    content_type: "floor_plan",
    content_category: plan.category ?? "uncategorized",
    style: plan.style ?? "unknown",
    beds: plan.beds,
    baths: plan.baths,
    sqft: plan.area,
    price_tier: plan.price_tier ?? "standard",
  };
}

// ── Meta Pixel ──────────────────────────────────────────────

export function trackPageView(
  pixelId: string,
  anonymousId?: string,
  trackingEndpoint?: string
): void {
  fbq("track", "PageView");

  pushDataLayer("dv_page_view", {
    dv_pixel_id: pixelId,
    dv_anonymous_id: anonymousId,
  });

  // Fire server-side tracking if endpoint configured
  if (trackingEndpoint && anonymousId) {
    trackEvent(trackingEndpoint, {
      event: "page_view",
      anonymousId,
      builderSlug: pixelId,
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackPlanView(pixelId: string, plan: FloorPlan): void {
  const data = planData(plan);

  fbq("track", "ViewContent", {
    ...data,
    value: 0,
    currency: "USD",
  });

  pushDataLayer("dv_plan_view", {
    dv_pixel_id: pixelId,
    ...data,
  });
}

export function trackAIInteraction(
  pixelId: string,
  type: "style_swap" | "floor_plan_edit",
  planId: string
): void {
  fbq("trackCustom", "DesignVaultInteraction", {
    interaction_type: type,
    plan_id: planId,
  });

  pushDataLayer("dv_ai_interaction", {
    dv_pixel_id: pixelId,
    interaction_type: type,
    plan_id: planId,
  });
}

export function trackLeadCapture(
  pixelId: string,
  plan: FloorPlan,
  value?: number
): void {
  const data = planData(plan);

  fbq("track", "Lead", {
    ...data,
    value: value ?? 0,
    currency: "USD",
  });

  pushDataLayer("dv_lead_capture", {
    dv_pixel_id: pixelId,
    ...data,
    value: value ?? 0,
  });
}

/** @deprecated Use trackPageView/trackLeadCapture/trackAIInteraction instead */
export function fireMetaPixelEvent(
  pixelId: string,
  eventName: string,
  params?: Record<string, unknown>
): void {
  fbq("track", eventName, { ...params, pixel_id: pixelId });
  pushDataLayer(`dv_${eventName.toLowerCase()}`, {
    dv_pixel_id: pixelId,
    ...params,
  });
}

// ── Session Tracking ────────────────────────────────────────

const ANON_ID_KEY = "dv-anonymous-id";

export function generateAnonymousId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();

  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (incognito, storage full, etc.)
    return crypto.randomUUID();
  }
}

export function getSessionDuration(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000);
}

export function trackEvent(
  endpoint: string,
  eventData: Record<string, unknown>
): void {
  if (!endpoint) return;

  // Fire-and-forget — don't block the UI
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...eventData,
      sentAt: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silently fail — tracking should never break the app
  });
}

// ── Performance Tracking ────────────────────────────────────

interface LatencyEntry {
  type: "style_swap" | "floor_plan_edit" | "enhance_prompt";
  durationMs: number;
  timestamp: string;
}

const latencyLog: LatencyEntry[] = [];

export function trackAILatency(
  type: LatencyEntry["type"],
  startTime: number,
  endTime: number
): void {
  const entry: LatencyEntry = {
    type,
    durationMs: endTime - startTime,
    timestamp: new Date().toISOString(),
  };

  latencyLog.push(entry);

  // Keep only last 50 entries in memory
  if (latencyLog.length > 50) {
    latencyLog.shift();
  }

  pushDataLayer("dv_ai_latency", {
    ai_type: entry.type,
    duration_ms: entry.durationMs,
  });
}

/** Returns the collected latency entries (for debugging / analytics) */
export function getLatencyLog(): readonly LatencyEntry[] {
  return latencyLog;
}
