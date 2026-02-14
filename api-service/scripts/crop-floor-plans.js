#!/usr/bin/env node

/**
 * crop-floor-plans.js
 *
 * Crops the floor-plan portion from concept-card images and uploads
 * them to Supabase Storage, then updates each plan's floor_plan_url.
 *
 * Usage:
 *   node --env-file=.env scripts/crop-floor-plans.js            # full run
 *   node --env-file=.env scripts/crop-floor-plans.js --dry-run   # first 3 only
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// ── Configuration ────────────────────────────────────────────

/**
 * How much of the image to keep, measured from the crop edge.
 * 0.45 = bottom 45% of the image. Adjust if the floor plan
 * occupies a different portion of the concept cards.
 */
const CROP_RATIO = 0.55;

/**
 * How much to trim from each side (left and right).
 * 0.05 = trim 5% from each edge, keeping the center 90%.
 * Removes landscape/scenery that often appears at the edges.
 */
const SIDE_CROP_RATIO = 0.05;

/**
 * Which edge to crop from. "bottom" keeps the bottom portion,
 * "left" would keep the left portion, etc.
 * Currently only "bottom" and "left" are implemented.
 */
const CROP_FROM = "bottom";

/** Supabase Storage bucket name */
const BUCKET = "Barnhaus Updated Pics";

/** Path prefix inside the bucket */
const PATH_PREFIX = "Archive/floor-plans";

/** Delay between uploads in ms (avoids rate limiting) */
const UPLOAD_DELAY_MS = 2000;

/** Minimum pixel dimension — skip images smaller than this */
const MIN_DIMENSION = 100;

// ── Flags ────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes("--dry-run");
const DRY_RUN_LIMIT = 3;

// ── Supabase client ──────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Run with --env-file=.env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Helpers ──────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Crop a portion of the image based on CROP_FROM and CROP_RATIO.
 * Returns a sharp instance with the cropped region.
 */
async function cropFloorPlan(buffer) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();

  if (!width || !height) throw new Error("Cannot read image dimensions");
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(
      `Image too small (${width}x${height}), min ${MIN_DIMENSION}px`
    );
  }

  let extractRegion;

  if (CROP_FROM === "bottom") {
    // Keep the bottom CROP_RATIO, trimming SIDE_CROP_RATIO from each edge
    const left = Math.round(width * SIDE_CROP_RATIO);
    const top = Math.round(height * (1 - CROP_RATIO));
    const cropWidth = Math.round(width * (1 - 2 * SIDE_CROP_RATIO));
    const cropHeight = Math.round(height * CROP_RATIO);
    extractRegion = { left, top, width: cropWidth, height: cropHeight };
  } else if (CROP_FROM === "left") {
    // Keep the left CROP_RATIO of the image
    const cropWidth = Math.round(width * CROP_RATIO);
    extractRegion = { left: 0, top: 0, width: cropWidth, height };
  } else {
    throw new Error(`Unsupported CROP_FROM value: "${CROP_FROM}"`);
  }

  return sharp(buffer).extract(extractRegion).webp({ quality: 85 }).toBuffer();
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(
    DRY_RUN
      ? `DRY RUN — processing first ${DRY_RUN_LIMIT} plans only`
      : "Full run — processing all plans"
  );
  console.log(
    `Config: CROP_RATIO=${CROP_RATIO}, CROP_FROM="${CROP_FROM}", BUCKET="${BUCKET}"\n`
  );

  // Fetch all plans
  const { data: plans, error } = await supabase
    .from("website_floor_plans")
    .select("id, title, image_url, floor_plan_url")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch plans:", error.message);
    process.exit(1);
  }

  console.log(`Found ${plans.length} total plans\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const plan of plans) {
    // Skip plans that already have a floor_plan_url
    if (plan.floor_plan_url) {
      skipped++;
      console.log(`  SKIP (already has floor_plan_url): ${plan.title}`);
      continue;
    }

    // Dry-run limit
    if (DRY_RUN && processed >= DRY_RUN_LIMIT) {
      console.log(
        `\nDry-run limit reached (${DRY_RUN_LIMIT}). Stopping.`
      );
      break;
    }

    try {
      console.log(`  Processing: ${plan.title}`);

      // 1. Download the concept card image
      const imageBuffer = await downloadImage(plan.image_url);
      console.log(
        `    Downloaded (${(imageBuffer.length / 1024).toFixed(0)} KB)`
      );

      // 2. Crop the floor plan portion
      const croppedBuffer = await cropFloorPlan(imageBuffer);
      console.log(
        `    Cropped to ${CROP_FROM} ${CROP_RATIO * 100}% (${(croppedBuffer.length / 1024).toFixed(0)} KB webp)`
      );

      // 3. Upload to Supabase Storage
      const slug = slugify(plan.title);
      const storagePath = `${PATH_PREFIX}/${slug}.webp`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, croppedBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      console.log(`    Uploaded: ${publicUrl}`);

      // 5. Update the plan's floor_plan_url
      const { error: updateError } = await supabase
        .from("website_floor_plans")
        .update({ floor_plan_url: publicUrl })
        .eq("id", plan.id);

      if (updateError) {
        throw new Error(`DB update failed: ${updateError.message}`);
      }

      processed++;
      console.log(`  Cropped and uploaded floor plan for: ${plan.title}\n`);

      // Rate-limit delay
      if (!DRY_RUN || processed < DRY_RUN_LIMIT) {
        await sleep(UPLOAD_DELAY_MS);
      }
    } catch (err) {
      errors++;
      console.warn(`  WARNING — skipping "${plan.title}": ${err.message}\n`);
    }
  }

  // Summary
  const remaining = plans.length - skipped - processed - errors;
  console.log("─".repeat(50));
  console.log(
    `Done. Processed ${processed} plans, skipped ${skipped} (already had floor_plan_url)` +
      (errors > 0 ? `, ${errors} errors` : "") +
      (DRY_RUN && remaining > 0
        ? `, ${remaining} remaining (run without --dry-run)`
        : "")
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
