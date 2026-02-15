import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { builders } from "../config/builders.js";
import { log } from "../lib/logger.js";
import type { LeadPayload } from "../types.js";

const router = Router();

// ── POST /api/save-design ───────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  try {
    const { leadData, sessionId, builderSlug } = req.body;

    if (!leadData || !sessionId || !builderSlug) {
      res
        .status(400)
        .json({ error: "leadData, sessionId, and builderSlug required" });
      return;
    }

    const { firstName, lastName, email, phone } = leadData;
    if (!firstName || !lastName || !email || !phone) {
      res.status(400).json({ error: "All lead fields are required" });
      return;
    }

    // Get session for metadata
    const { data: session } = await getSupabase()
      .from("design_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Get plan details for metadata
    const { data: plan } = await getSupabase()
      .from("website_floor_plans")
      .select("id, title, beds, baths, area, style")
      .eq("id", session.plan_id)
      .single();

    const planSpecs = plan
      ? `${plan.beds ?? "?"}bd/${plan.baths ?? "?"}ba/${plan.area ?? "?"}sqft`
      : "";

    // Build lead payload
    const payload: LeadPayload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      source: "floor_plan_archive",
      anonymous_id: session.anonymous_id ?? "",
      metadata: {
        planId: session.plan_id,
        planTitle: plan?.title ?? "",
        planSpecs,
        modifications: session.modifications ?? [],
        favorites: leadData.favorites ?? [],
        stylePref: leadData.stylePref ?? null,
        sessionDuration: leadData.sessionDuration ?? 0,
        plansViewed: leadData.plansViewed ?? [],
      },
    };

    // Forward to builder CRM webhook
    const builder = builders[builderSlug];
    if (builder?.webhookUrl) {
      try {
        log("CRM_WEBHOOK_START", {
          builderSlug,
          webhookUrl: builder.webhookUrl,
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (builder.webhookApiKey) {
          headers["x-api-key"] = builder.webhookApiKey;
        }

        const webhookRes = await fetch(builder.webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        log("CRM_WEBHOOK_DONE", {
          builderSlug,
          status: webhookRes.status,
        });
      } catch (err) {
        // Don't fail the lead save if webhook fails
        log("CRM_WEBHOOK_ERROR", {
          builderSlug,
          error: String(err),
        });
      }
    }

    // Update session: mark as captured
    const now = new Date().toISOString();
    await getSupabase()
      .from("design_sessions")
      .update({
        is_captured: true,
        contact_id: email, // Use email as contact reference
        captured_at: now,
      })
      .eq("id", sessionId);

    log("LEAD_SAVED", {
      sessionId,
      builderSlug,
      email,
      planId: session.plan_id,
    });

    res.json({ success: true });
  } catch (err) {
    log("LEAD_SAVE_ERROR", { error: String(err) });
    res.status(500).json({ error: "Failed to save design" });
  }
});

export default router;
