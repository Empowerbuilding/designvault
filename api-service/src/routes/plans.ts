import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";

const router = Router();

// ── GET /api/plans ──────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { style, category, beds, baths, minArea, maxArea, featured } =
      req.query;

    let query = getSupabase()
      .from("website_floor_plans")
      .select("*")
      .order("display_order", { ascending: true });

    if (style) query = query.eq("style", style);
    if (category) query = query.eq("category", category);
    if (beds) query = query.eq("bedrooms", Number(beds));
    if (baths) query = query.eq("bathrooms", Number(baths));
    if (minArea) query = query.gte("sqft", Number(minArea));
    if (maxArea) query = query.lte("sqft", Number(maxArea));
    if (featured === "true") query = query.eq("is_featured", true);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// ── GET /api/plans/:id ──────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase()
      .from("website_floor_plans")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

// ── POST /api/plans/:id/click ───────────────────────────────
router.post("/:id/click", async (req: Request, res: Response) => {
  try {
    const { error } = await getSupabase().rpc("increment_click_count", {
      plan_id: req.params.id,
    });

    // Fallback if RPC doesn't exist: manual increment
    if (error) {
      const { data: plan } = await getSupabase()
        .from("website_floor_plans")
        .select("click_count")
        .eq("id", req.params.id)
        .single();

      if (plan) {
        await getSupabase()
          .from("website_floor_plans")
          .update({ click_count: (plan.click_count ?? 0) + 1 })
          .eq("id", req.params.id);
      }
    }

    res.status(204).end();
  } catch (err) {
    res.status(204).end(); // Don't fail the client on tracking errors
  }
});

export default router;
