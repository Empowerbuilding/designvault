import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { v4 as uuidv4 } from "uuid";
import { log } from "../lib/logger.js";

const router = Router();

// ── POST /api/sessions ──────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { planId, builderSlug, anonymousId } = req.body;

    if (!planId || !builderSlug || !anonymousId) {
      res
        .status(400)
        .json({ error: "planId, builderSlug, and anonymousId required" });
      return;
    }

    const sessionId = uuidv4();

    const { data, error } = await getSupabase()
      .from("design_sessions")
      .insert({
        id: sessionId,
        builder_slug: builderSlug,
        anonymous_id: anonymousId,
        plan_id: planId,
        interaction_count: 0,
        is_captured: false,
        modifications: [],
      })
      .select()
      .single();

    if (error) {
      log("SESSION_CREATE_ERROR", { error: error.message });
      res.status(500).json({ error: "Failed to create session" });
      return;
    }

    log("SESSION_CREATED", { sessionId, planId, builderSlug });
    res.status(201).json({ sessionId: data.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
