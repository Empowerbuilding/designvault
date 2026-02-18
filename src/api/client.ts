import type {
  AIInteractionResult,
  FloorPlan,
  LeadCaptureData,
  PlanFilters,
} from "../types";

export class CaptureRequiredError extends Error {
  constructor() {
    super("Lead capture required");
    this.name = "CaptureRequiredError";
  }
}

export class DesignVaultAPI {
  private baseUrl: string;

  constructor(apiBaseUrl: string) {
    this.baseUrl = apiBaseUrl.replace(/\/$/, "");
  }

  // ── Plans ────────────────────────────────────────────────────

  async getPlans(filters?: PlanFilters): Promise<FloorPlan[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.bedrooms !== null && filters.bedrooms !== undefined) {
        params.set("bedrooms", String(filters.bedrooms));
      }
      if (filters.bathrooms !== null && filters.bathrooms !== undefined) {
        params.set("bathrooms", String(filters.bathrooms));
      }
      if (filters.minArea !== null && filters.minArea !== undefined) {
        params.set("minArea", String(filters.minArea));
      }
      if (filters.maxArea !== null && filters.maxArea !== undefined) {
        params.set("maxArea", String(filters.maxArea));
      }
      if (filters.style !== null && filters.style !== undefined) {
        params.set("style", filters.style);
      }
      if (filters.category !== null && filters.category !== undefined) {
        params.set("category", filters.category);
      }
    }

    const query = params.toString();
    const url = `${this.baseUrl}/api/plans${query ? `?${query}` : ""}`;

    return this.get<FloorPlan[]>(url);
  }

  async getPlan(id: string): Promise<FloorPlan> {
    return this.get<FloorPlan>(`${this.baseUrl}/api/plans/${id}`);
  }

  // ── Tracking ─────────────────────────────────────────────────

  async trackClick(planId: string): Promise<void> {
    await this.post<void>(`${this.baseUrl}/api/plans/${planId}/click`, {});
  }

  // ── AI ───────────────────────────────────────────────────────

  async styleSwap(
    planId: string,
    preset: string,
    sessionId: string,
    imageType?: "exterior" | "interior",
    imageUrl?: string
  ): Promise<AIInteractionResult> {
    return this.post<AIInteractionResult>(
      `${this.baseUrl}/api/style-swap`,
      { planId, preset, sessionId, imageType, imageUrl }
    );
  }

  async floorPlanEdit(
    planId: string,
    prompt: string,
    sessionId: string,
    currentUrl?: string
  ): Promise<AIInteractionResult> {
    return this.post<AIInteractionResult>(
      `${this.baseUrl}/api/floor-plan-edit`,
      { planId, prompt, sessionId, currentUrl }
    );
  }

  async enhancePrompt(
    prompt: string,
    imageUrl: string
  ): Promise<{ enhancedPrompt: string }> {
    return this.post<{ enhancedPrompt: string }>(
      `${this.baseUrl}/api/enhance-prompt`,
      { prompt, imageUrl }
    );
  }

  // ── Lead Capture ─────────────────────────────────────────────

  async saveDesign(
    data: LeadCaptureData,
    sessionId: string,
    builderSlug: string
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `${this.baseUrl}/api/save-design`,
      { leadData: data, sessionId, builderSlug }
    );
  }

  // ── Sessions ─────────────────────────────────────────────────

  async createSession(
    planId: string,
    builderSlug: string,
    anonymousId: string
  ): Promise<{ sessionId: string; totalInteractionCount: number; isCaptured: boolean }> {
    return this.post<{ sessionId: string; totalInteractionCount: number; isCaptured: boolean }>(
      `${this.baseUrl}/api/sessions`,
      { planId, builderSlug, anonymousId }
    );
  }

  // ── Internal helpers ─────────────────────────────────────────

  private friendlyError(status: number): string {
    if (status === 429) return "Too many requests — please wait a moment and try again.";
    if (status === 403) return "Save your design to unlock more AI tools.";
    if (status === 404) return "This design could not be found. Please try another.";
    if (status >= 500) return "Our servers are busy — please try again in a few seconds.";
    return "Something went wrong. Please try again.";
  }

  private async get<T>(url: string): Promise<T> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(this.friendlyError(res.status));
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect. Please check your internet and try again.");
    }
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Parse 403 to detect "needs capture" vs generic forbidden
        if (res.status === 403) {
          try {
            const data = await res.json();
            if (data?.needsCapture) throw new CaptureRequiredError();
          } catch (e) {
            if (e instanceof CaptureRequiredError) throw e;
          }
        }
        throw new Error(this.friendlyError(res.status));
      }
      // Some endpoints (trackClick) may return 204 with no body
      const text = await res.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect. Please check your internet and try again.");
    }
  }
}
