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

// ── n8n response extractors ─────────────────────────────────

const IMAGE_URL_KEYS = [
  "enhancedImage",
  "editedFloorPlan",
  "generatedFloorPlan",
  "floorPlan",
  "image",
  "output",
  "url",
  "result",
  "resultUrl",
  "generatedImage",
  "imageUrl",
] as const;

const PROMPT_KEYS = [
  "enhancedPrompt",
  "prompt",
  "result",
  "output",
  "text",
  "enhanced",
] as const;

function extractImageUrl(data: Record<string, unknown>): string | null {
  for (const key of IMAGE_URL_KEYS) {
    const val = data[key];
    if (typeof val === "string" && val.length > 0) {
      log("N8N_EXTRACT_IMAGE", { key, url: val });
      return val;
    }
  }
  log("N8N_EXTRACT_IMAGE_FAIL", { keys: Object.keys(data) });
  return null;
}

function extractPrompt(data: Record<string, unknown>): string | null {
  for (const key of PROMPT_KEYS) {
    const val = data[key];
    if (typeof val === "string" && val.length > 0) {
      log("N8N_EXTRACT_PROMPT", { key });
      return val;
    }
  }
  log("N8N_EXTRACT_PROMPT_FAIL", { keys: Object.keys(data) });
  return null;
}

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

/** Sum interaction_count across ALL sessions for this anonymous user + builder */
async function getTotalInteractionCount(
  anonymousId: string,
  builderSlug: string
): Promise<number> {
  const { data } = await getSupabase()
    .from("design_sessions")
    .select("interaction_count")
    .eq("anonymous_id", anonymousId)
    .eq("builder_slug", builderSlug);

  if (!data) return 0;
  return data.reduce((sum, s) => sum + (s.interaction_count ?? 0), 0);
}

// ── POST /api/style-swap ────────────────────────────────────

router.post("/style-swap", aiLimiter, async (req: Request, res: Response) => {
  try {
    const { planId, preset, sessionId, imageType, imageUrl } = req.body;

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

    // If this session isn't marked captured, check if the user captured on another session
    if (!session.is_captured) {
      const { data: captured } = await getSupabase()
        .from("design_sessions")
        .select("contact_id")
        .eq("anonymous_id", session.anonymous_id)
        .eq("is_captured", true)
        .limit(1)
        .single();

      if (captured) {
        // Backfill this session's captured status
        await getSupabase()
          .from("design_sessions")
          .update({ is_captured: true })
          .eq("id", sessionId);
        session.is_captured = true;
        session.contact_id = captured.contact_id;
      }
    }

    const count = await getTotalInteractionCount(session.anonymous_id, session.builder_slug);
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

    const cacheKey = `${planId}:style:${preset}`;

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
    const presetPrompt = stylePresets[preset];
    const isInterior = imageType === "interior";
    const prompt = isInterior
      ? `Restyle this exact same interior room, keeping the identical layout, furniture placement, and room dimensions. Only change the interior materials, finishes, colors, and decor to match this style: ${presetPrompt}. Keep the same camera angle, perspective, and composition. Photorealistic interior photography.`
      : `Restyle this exact same home, keeping the identical structure, shape, roofline, windows, and layout. Only change the exterior materials, finishes, and landscaping to match this style: ${presetPrompt}. Keep the same camera angle, perspective, and composition. Photorealistic architectural photography.`;
    const effectiveImageUrl = imageUrl || plan.image_url;
    log("STYLE_SWAP_START", { planId, preset, imageType: imageType ?? "exterior", planTitle: plan.title });

    const n8nResult = await callN8nWebhook<Record<string, unknown>>(
      "designvaultkey",
      {
        imageUrl: effectiveImageUrl,
        prompt,
        planId,
        preset,
      }
    );

    const resultUrl = extractImageUrl(n8nResult);
    if (!resultUrl) {
      log("STYLE_SWAP_NO_URL", { planId, preset, responseKeys: Object.keys(n8nResult) });
      res.status(502).json({ error: "No image URL in n8n response" });
      return;
    }

    // Save to cache
    await getSupabase().from("design_cache").insert({
      plan_id: planId,
      action_type: "style_swap",
      action_params: preset,
      cache_key: cacheKey,
      result_url: resultUrl,
    });

    // Update session
    const updated = await incrementSession(sessionId, {
      type: "style_swap",
      preset,
      result_url: resultUrl,
      timestamp: new Date().toISOString(),
    });

    log("STYLE_SWAP_DONE", { planId, preset, resultUrl });

    res.json({
      success: true,
      resultUrl,
      cached: false,
      remainingFree: remainingFree(
        count + 1,
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

      // If this session isn't marked captured, check if the user captured on another session
      if (!session.is_captured) {
        const { data: captured } = await getSupabase()
          .from("design_sessions")
          .select("contact_id")
          .eq("anonymous_id", session.anonymous_id)
          .eq("is_captured", true)
          .limit(1)
          .single();

        if (captured) {
          await getSupabase()
            .from("design_sessions")
            .update({ is_captured: true })
            .eq("id", sessionId);
          session.is_captured = true;
          session.contact_id = captured.contact_id;
        }
      }

      const count = await getTotalInteractionCount(session.anonymous_id, session.builder_slug);
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
        log("FLOOR_PLAN_LOOKUP", { planId, floor_plan_url: floorPlanUrl ?? null });
      }

      if (!floorPlanUrl) {
        log("FLOOR_PLAN_EDIT_NO_SOURCE", { planId });
        res.status(400).json({
          error: "This plan does not have a floor plan image yet. Cannot edit.",
        });
        return;
      }

      log("FLOOR_PLAN_EDIT_START", { planId, prompt, floorPlanUrl });

      const n8nResult = await callN8nWebhook<Record<string, unknown>>(
        "designvaultkey",
        {
          currentFloorPlanUrl: floorPlanUrl,
          editPrompt: prompt,
        }
      );

      log("FLOOR_PLAN_EDIT_N8N_RESPONSE", { planId, responseKeys: Object.keys(n8nResult) });

      const resultUrl = extractImageUrl(n8nResult);
      if (!resultUrl) {
        log("FLOOR_PLAN_EDIT_NO_URL", { planId, responseKeys: Object.keys(n8nResult) });
        res.status(502).json({ error: "No image URL in n8n response" });
        return;
      }

      // Update session
      const updated = await incrementSession(sessionId, {
        type: "floor_plan_edit",
        prompt,
        result_url: resultUrl,
        timestamp: new Date().toISOString(),
      });

      log("FLOOR_PLAN_EDIT_DONE", { planId, resultUrl });

      res.json({
        success: true,
        resultUrl,
        cached: false,
        remainingFree: remainingFree(
          count + 1,
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

    const n8nResult = await callN8nWebhook<Record<string, unknown>>(
      "enhance-prompt",
      { prompt, imageUrl }
    );

    const enhancedPrompt = extractPrompt(n8nResult);
    if (!enhancedPrompt) {
      log("ENHANCE_PROMPT_NO_TEXT", { responseKeys: Object.keys(n8nResult) });
      res.status(502).json({ error: "No prompt in n8n response" });
      return;
    }

    log("ENHANCE_PROMPT_DONE", {
      original: prompt,
      enhanced: enhancedPrompt,
    });

    res.json({ enhancedPrompt });
  } catch (err) {
    log("ENHANCE_PROMPT_ERROR", { error: String(err) });
    res.status(500).json({ error: "Prompt enhancement failed" });
  }
});

export default router;
