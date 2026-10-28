import { Router, Request, Response } from "express";
import { getSupabase } from "../lib/supabase.js";
import { log } from "../lib/logger.js";

const router = Router();

// ── Image delivery (B2 archive, 10/28): serve R2 mirrors + right-sized card variants ──
// Supabase SFO originals stay canonical in the DB; only response URLs are rewritten.
// Scoped to buckets mirrored on R2 (media.barnhaussteelbuilders.com) — other builders unaffected.
const SB_PUBLIC_PREFIX =
  "https://hbfjdfxephlczkfgpceg.supabase.co/storage/v1/object/public/";
const R2_PUBLIC_BASE = "https://media.barnhaussteelbuilders.com/";
const MIRRORED_BUCKETS = new Set(["Barnhaus Updated Pics", "design-studio"]);

function splitBucketPath(url: string): { bucket: string; rest: string } | null {
  if (!url.startsWith(SB_PUBLIC_PREFIX)) return null;
  const decoded = decodeURIComponent(url.slice(SB_PUBLIC_PREFIX.length));
  const slash = decoded.indexOf("/");
  if (slash < 0) return null;
  return { bucket: decoded.slice(0, slash), rest: decoded.slice(slash + 1) };
}

/** Supabase public URL -> R2 mirror URL (same bytes, edge-cached). Passes through non-mirrored URLs. */
function toR2(url: string | null | undefined): string | null {
  if (!url) return url ?? null;
  const parts = splitBucketPath(url);
  if (!parts || !MIRRORED_BUCKETS.has(parts.bucket)) return url;
  return R2_PUBLIC_BASE + encodeURI(parts.bucket + "/" + parts.rest);
}

/** Original plan image -> 800px webp card variant on R2 (opt/archive/). Null when no variant exists. */
function cardVariant(url: string | null | undefined): string | null {
  if (!url) return null;
  const parts = splitBucketPath(url);
  if (!parts || !MIRRORED_BUCKETS.has(parts.bucket)) return null;
  const file = parts.rest.slice(parts.rest.lastIndexOf("/") + 1);
  const stem = file.replace(/\.[^.]+$/, "");
  return `${R2_PUBLIC_BASE}opt/archive/${encodeURI(stem)}-800.webp`;
}

function transformPlan<T extends { image_url: string; interior_urls?: string[] | null; floor_plan_url?: string | null }>(p: T): T & { card_image_url: string | null } {
  return {
    ...p,
    image_url: toR2(p.image_url) ?? p.image_url,
    card_image_url: cardVariant(p.image_url),
    interior_urls: (p.interior_urls ?? []).map((u) => toR2(u) ?? u),
    floor_plan_url: toR2(p.floor_plan_url),
  };
}

// ── GET /api/plans ──────────────────────────────────────────
router.get("/", async (req: Request, res: Response) => {
  try {
    const { style, category, beds, baths, minArea, maxArea, featured, builderSlug } =
      req.query;

    let query = getSupabase()
      .from("website_floor_plans")
      .select("*")
      .order("display_order", { ascending: true });

    if (style) query = query.eq("style", style);
    if (category) query = query.eq("category", category);
    if (beds) query = query.eq("beds", Number(beds));
    if (baths) query = query.eq("baths", Number(baths));
    if (minArea) query = query.gte("area", Number(minArea));
    if (maxArea) query = query.lte("area", Number(maxArea));
    if (featured === "true") query = query.eq("is_featured", true);
    // Filter by builder slug: show plans where builder_slugs contains this slug OR builder_slugs is null (visible to all)
    if (builderSlug) {
      query = query.contains("builder_slugs", [builderSlug]);
    }

    const { data, error } = await query;

    if (error) {
      log("PLANS_QUERY_ERROR", { message: error.message, code: error.code, details: error.details });
      res.status(500).json({ error: error.message });
      return;
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(data.map(transformPlan));
  } catch (err) {
    log("PLANS_FETCH_ERROR", { error: String(err), stack: (err as Error).stack });
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
    res.json(transformPlan(data));
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
