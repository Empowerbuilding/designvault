import type {
  AIInteractionResult,
  FloorPlan,
  LeadCaptureData,
  PlanFilters,
} from "../types";

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
    sessionId: string
  ): Promise<AIInteractionResult> {
    return this.post<AIInteractionResult>(
      `${this.baseUrl}/api/style-swap`,
      { planId, preset, sessionId }
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
      { ...data, sessionId, builderSlug }
    );
  }

  // ── Sessions ─────────────────────────────────────────────────

  async createSession(
    planId: string,
    builderSlug: string,
    anonymousId: string
  ): Promise<{ sessionId: string }> {
    return this.post<{ sessionId: string }>(
      `${this.baseUrl}/api/sessions`,
      { planId, builderSlug, anonymousId }
    );
  }

  // ── Internal helpers ─────────────────────────────────────────

  private async get<T>(url: string): Promise<T> {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `GET ${url} failed (${res.status}): ${body}`
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`GET ${url} failed: ${String(err)}`);
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
        const text = await res.text();
        throw new Error(
          `POST ${url} failed (${res.status}): ${text}`
        );
      }
      // Some endpoints (trackClick) may return 204 with no body
      const text = await res.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`POST ${url} failed: ${String(err)}`);
    }
  }
}
