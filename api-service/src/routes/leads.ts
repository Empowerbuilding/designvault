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

    // Get ALL sessions for this user to capture full browsing history
    const { data: allSessions } = await getSupabase()
      .from("design_sessions")
      .select("plan_id, modifications, interaction_count, created_at")
      .eq("anonymous_id", session.anonymous_id)
      .eq("builder_slug", builderSlug)
      .order("created_at", { ascending: true });

    // Get plan details for ALL viewed plans
    const allPlanIds = [...new Set((allSessions || []).map(s => s.plan_id))];
    const { data: allPlans } = await getSupabase()
      .from("website_floor_plans")
      .select("id, title, beds, baths, area, style, image_url")
      .in("id", allPlanIds);

    // Current plan details (from allPlans to avoid extra query)
    const plan = (allPlans || []).find(p => p.id === session.plan_id) ?? null;

    const planSpecs = plan
      ? `${plan.beds ?? "?"}bd/${plan.baths ?? "?"}ba/${plan.area ?? "?"}sqft`
      : "";

    // Build full browsing summary
    const plansViewedDetails = (allPlans || []).map(p => ({
      id: p.id,
      title: p.title,
      specs: `${p.beds ?? "?"}bd/${p.baths ?? "?"}ba/${p.area ?? "?"}sqft`,
    }));

    // Collect ALL modifications across all sessions
    const allModifications = (allSessions || [])
      .flatMap(s => s.modifications || []);

    // Facebook tracking data (forwarded from client)
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    // Build lead payload
    const payload: LeadPayload = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      source: "floor_plan_archive",
      anonymous_id: session.anonymous_id ?? "",
      ...(leadData.fbclid && { fbclid: leadData.fbclid }),
      ...(leadData.fbp && { fbp: leadData.fbp }),
      ...(leadData.fbc && { fbc: leadData.fbc }),
      ...(leadData.client_user_agent && { client_user_agent: leadData.client_user_agent }),
      ...(clientIp && { client_ip_address: clientIp }),
      metadata: {
        planId: session.plan_id,
        planTitle: plan?.title ?? "",
        planSpecs,
        modifications: allModifications,
        favorites: leadData.favorites ?? [],
        stylePref: leadData.stylePref ?? null,
        sessionDuration: leadData.sessionDuration ?? 0,
        plansViewed: plansViewedDetails,
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

    // Fire n8n "design saved" email automation webhook
    const n8nDesignWebhook = process.env.N8N_DESIGN_SAVED_WEBHOOK;
    if (n8nDesignWebhook) {
      try {
        await fetch(n8nDesignWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            plan_id: session.plan_id,
            plan_title: plan?.title ?? "",
            plan_specs: planSpecs,
            plan_image: plan?.image_url ?? "",
            modifications: allModifications,
            plans_viewed: plansViewedDetails,
            session_id: sessionId,
            builder_slug: builderSlug,
            scheduler_url:
              "https://crm.empowerbuilding.ai/book/30-minute-consultation",
          }),
        });
        log("N8N_DESIGN_SAVED_WEBHOOK_OK", { email, sessionId });
      } catch (err) {
        log("N8N_DESIGN_SAVED_WEBHOOK_ERROR", { error: String(err) });
      }
    }

    // Update session: mark as captured (only set is_captured — contact_id may
    // be a UUID column so setting it to an email can cause the entire UPDATE
    // to fail, which silently prevents is_captured from being set too)
    const { error: updateError } = await getSupabase()
      .from("design_sessions")
      .update({ is_captured: true })
      .eq("id", sessionId);

    if (updateError) {
      log("SESSION_UPDATE_ERROR", { sessionId, error: updateError.message });
      res.status(500).json({ error: "Failed to update session" });
      return;
    }

    // Also mark any other sessions for this anonymous user as captured
    // so switching plans doesn't lose captured status
    await getSupabase()
      .from("design_sessions")
      .update({ is_captured: true })
      .eq("anonymous_id", session.anonymous_id)
      .eq("builder_slug", builderSlug)
      .eq("is_captured", false);

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
