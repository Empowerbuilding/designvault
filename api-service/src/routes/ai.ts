import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { callN8nWebhook } from "../lib/n8n.js";
import { stylePresets } from "../config/stylePresets.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { log } from "../lib/logger.js";
import type { SessionModification } from "../types.js";

const router = Router();

const MAX_FREE = 1;
const HARD_LIMIT = MAX_FREE + 3;

// ── Helpers ─────────────────────────────────────────────────

async function getSession(sessionId: string) {
  const { data } = await getSupabase()
    .from("design_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  return data;
}

async function incrementSession(
  sessionId: string,
  mod: SessionModification
) {
  const session = await getSession(sessionId);
  if (!session) return null;

  const mods: SessionModification[] = [
    ...(session.modifications ?? []),
    mod,
  ];

  const { data } = await getSupabase()
    .from("design_sessions")
    .update({
      interaction_count: (session.interaction_count ?? 0) + 1,
      modifications: mods,
    })
    .eq("id", sessionId)
    .select()
    .single();

  return data;
}

function remainingFree(
  interactionCount: number,
  isCaptured: boolean
): number {
  if (isCaptured) return HARD_LIMIT - interactionCount;
  return Math.max(0, MAX_FREE - interactionCount);
}

// ── POST /api/style-swap ────────────────────────────────────

router.post("/style-swap", aiLimiter, async (req: Request, res: Response) => {
  try {
    const { planId, preset, sessionId } = req.body;

    if (!planId || !preset || !sessionId) {
      res.status(400).json({ error: "planId, preset, and sessionId required" });
      return;
    }

    if (!stylePresets[preset]) {
      res.status(400).json({ error: `Unknown preset: ${preset}` });
      return;
    }

    // Check session limits
    const session = await getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const count = session.interaction_count ?? 0;
    if (!session.is_captured && count >= MAX_FREE) {
      res.status(403).json({
        error: "Lead capture required",
        needsCapture: true,
        remainingFree: 0,
      });
      return;
    }

    if (count >= HARD_LIMIT) {
      res.status(429).json({
        error: "Session interaction limit reached",
        remainingFree: 0,
      });
      return;
    }

    // Check design_cache (composite unique index: plan_id + action_type + action_params)
    const cacheKey = `${planId}:style:${preset}`;
    const { data: cached } = await getSupabase()
      .from("design_cache")
      .select("result_url")
      .eq("plan_id", planId)
      .eq("action_type", "style_swap")
      .eq("action_params", preset)
      .single();

    if (cached) {
      log("CACHE_HIT", { cacheKey });

      // Increment hit counter (fire-and-forget)
      getSupabase().rpc("increment_cache_hit", { lookup_key: cacheKey });

      const updated = await incrementSession(sessionId, {
        type: "style_swap",
        preset,
        result_url: cached.result_url,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        resultUrl: cached.result_url,
        cached: true,
        remainingFree: remainingFree(
          (updated?.interaction_count ?? count + 1),
          updated?.is_captured ?? session.is_captured
        ),
      });
      return;
    }

    // Get plan image
    const { data: plan } = await getSupabase()
      .from("website_floor_plans")
      .select("image_url, title")
      .eq("id", planId)
      .single();

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    // Call n8n webhook
    const prompt = stylePresets[preset];
    log("STYLE_SWAP_START", { planId, preset, planTitle: plan.title });

    const result = await callN8nWebhook<{ resultUrl: string }>(
      "78eb9ad8-765f-4a20-8823-96a2e49d5f73",
      {
        imageUrl: plan.image_url,
        prompt: `Render this home in ${prompt}`,
        planId,
        preset,
      }
    );

    // Save to cache
    await getSupabase().from("design_cache").insert({
      plan_id: planId,
      action_type: "style_swap",
      action_params: preset,
      cache_key: cacheKey,
      result_url: result.resultUrl,
    });

    // Update session
    const updated = await incrementSession(sessionId, {
      type: "style_swap",
      preset,
      result_url: result.resultUrl,
      timestamp: new Date().toISOString(),
    });

    log("STYLE_SWAP_DONE", { planId, preset, resultUrl: result.resultUrl });

    res.json({
      success: true,
      resultUrl: result.resultUrl,
      cached: false,
      remainingFree: remainingFree(
        (updated?.interaction_count ?? count + 1),
        updated?.is_captured ?? session.is_captured
      ),
    });
  } catch (err) {
    log("STYLE_SWAP_ERROR", { error: String(err) });
    res.status(500).json({ error: "Style swap failed" });
  }
});

// ── POST /api/floor-plan-edit ───────────────────────────────

router.post(
  "/floor-plan-edit",
  aiLimiter,
  async (req: Request, res: Response) => {
    try {
      const { planId, prompt, sessionId, currentUrl } = req.body;

      if (!planId || !prompt || !sessionId) {
        res
          .status(400)
          .json({ error: "planId, prompt, and sessionId required" });
        return;
      }

      // Check session limits
      const session = await getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const count = session.interaction_count ?? 0;
      if (!session.is_captured && count >= MAX_FREE) {
        res.status(403).json({
          error: "Lead capture required",
          needsCapture: true,
          remainingFree: 0,
        });
        return;
      }

      if (count >= HARD_LIMIT) {
        res.status(429).json({
          error: "Session interaction limit reached",
          remainingFree: 0,
        });
        return;
      }

      // Get plan floor plan URL if no currentUrl provided
      let floorPlanUrl = currentUrl;
      if (!floorPlanUrl) {
        const { data: plan } = await getSupabase()
          .from("website_floor_plans")
          .select("floor_plan_url")
          .eq("id", planId)
          .single();

        floorPlanUrl = plan?.floor_plan_url;
      }

      log("FLOOR_PLAN_EDIT_START", { planId, prompt });

      const result = await callN8nWebhook<{ resultUrl: string }>(
        "floor-plan-edit",
        {
          currentFloorPlanUrl: floorPlanUrl,
          editPrompt: prompt,
        }
      );

      // Update session
      const updated = await incrementSession(sessionId, {
        type: "floor_plan_edit",
        prompt,
        result_url: result.resultUrl,
        timestamp: new Date().toISOString(),
      });

      log("FLOOR_PLAN_EDIT_DONE", { planId, resultUrl: result.resultUrl });

      res.json({
        success: true,
        resultUrl: result.resultUrl,
        cached: false,
        remainingFree: remainingFree(
          (updated?.interaction_count ?? count + 1),
          updated?.is_captured ?? session.is_captured
        ),
      });
    } catch (err) {
      log("FLOOR_PLAN_EDIT_ERROR", { error: String(err) });
      res.status(500).json({ error: "Floor plan edit failed" });
    }
  }
);

// ── POST /api/enhance-prompt ────────────────────────────────

router.post("/enhance-prompt", async (req: Request, res: Response) => {
  try {
    const { prompt, imageUrl } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    log("ENHANCE_PROMPT_START", { prompt });

    const result = await callN8nWebhook<{ enhancedPrompt: string }>(
      "enhance-prompt",
      { prompt, imageUrl }
    );

    log("ENHANCE_PROMPT_DONE", {
      original: prompt,
      enhanced: result.enhancedPrompt,
    });

    res.json({ enhancedPrompt: result.enhancedPrompt });
  } catch (err) {
    log("ENHANCE_PROMPT_ERROR", { error: String(err) });
    res.status(500).json({ error: "Prompt enhancement failed" });
  }
});

export default router;
