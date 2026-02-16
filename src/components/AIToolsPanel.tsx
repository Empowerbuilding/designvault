import React, { useCallback, useEffect, useState } from "react";
import { Sparkles, Save, Lock, CalendarCheck, Unlock } from "lucide-react";
import { StyleSwapButtons } from "./StyleSwapButtons";
import { FloorPlanEditor } from "./FloorPlanEditor";
import { LeadCaptureModal } from "./LeadCaptureModal";
import { useAIInteractions } from "../hooks/useAIInteractions";
import { useDesignVaultContext } from "../hooks/useDesignVault";
import { getSchedulerUrl } from "../utils/tracking";
import type { AIToolsPanelProps } from "../types";

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  plan,
  config,
  heroUrl,
  originalHeroUrl,
  imageType,
  floorPlanUrl,
  originalFloorPlanUrl,
  hasFloorPlanResult,
  showOriginalFloorPlan,
  onToggleFloorPlanOriginal,
  onResult,
  onProcessingChange,
}) => {
  const {
    handleStyleSwap,
    handleFloorPlanEdit,
    isStyleSwapProcessing,
    isFloorPlanProcessing,
    needsCapture,
    hitHardLimit,
    interactionCount,
    maxFree,
    hardLimit,
    error: aiError,
  } = useAIInteractions();

  const { modifications, isCaptured, addModification } =
    useDesignVaultContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(
    plan.style ?? null
  );
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  // Reset wishlist when plan changes
  useEffect(() => {
    setWishlistItems([]);
  }, [plan.id]);

  // Sync style swap processing to PlanDetail for hero shimmer
  useEffect(() => {
    onProcessingChange(isStyleSwapProcessing);
  }, [isStyleSwapProcessing, onProcessingChange]);


  // ── Style Swap ──────────────────────────────────────────────

  const onSwap = useCallback(
    async (presetId: string) => {
      if (needsCapture) {
        setModalOpen(true);
        return;
      }

      setActivePreset(presetId);
      const result = await handleStyleSwap(plan.id, presetId, imageType, originalHeroUrl);

      if (result?.success && result.resultUrl) {
        onResult({
          newUrl: result.resultUrl,
          originalUrl: originalHeroUrl,
          type: "style_swap",
        });
      }
    },
    [needsCapture, handleStyleSwap, plan.id, imageType, originalHeroUrl, onResult]
  );

  // ── Wishlist ────────────────────────────────────────────────

  const onWishlistAdd = useCallback(
    (text: string) => {
      setWishlistItems((prev) => [...prev, text]);

      // Record as a modification so it's included in lead data
      addModification({
        type: "wishlist_item",
        prompt: text,
        stylePreset: null,
        resultUrl: "",
        originalUrl: "",
        timestamp: new Date().toISOString(),
      });
    },
    [addModification]
  );

  const onWishlistRemove = useCallback((index: number) => {
    setWishlistItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onPreviewAI = useCallback(async () => {
    if (needsCapture) {
      setModalOpen(true);
      return;
    }

    // Concatenate all wishlist items into one prompt
    const prompt =
      "Make these changes: " +
      wishlistItems.map((item, i) => `${i + 1}) ${item}`).join(" ");

    const result = await handleFloorPlanEdit(
      plan.id,
      prompt,
      plan.floor_plan_url ?? undefined
    );

    if (result?.success && result.resultUrl) {
      onResult({
        newUrl: result.resultUrl,
        originalUrl: plan.floor_plan_url ?? plan.image_url,
        type: "floor_plan_edit",
      });
    }
  }, [
    needsCapture,
    wishlistItems,
    handleFloorPlanEdit,
    plan.id,
    plan.floor_plan_url,
    plan.image_url,
    onResult,
  ]);

  // ── Modal ───────────────────────────────────────────────────

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const totalCredits = isCaptured ? hardLimit : maxFree;
  const creditsRemaining = Math.max(0, totalCredits - interactionCount);
  const postCaptureExtra = hardLimit - maxFree;

  return (
    <div className="dv-ai-tools">
      {/* Header */}
      <div className="dv-ai-tools__header">
        <Sparkles size={20} />
        <h3 className="dv-ai-tools__title">AI Design Tools</h3>
      </div>

      {/* Credit counter */}
      {!hitHardLimit && (
        <div className="dv-ai-tools__credits">
          <Sparkles size={14} className="dv-ai-tools__credits-icon" />
          <span>
            {creditsRemaining} of {totalCredits} credit{totalCredits !== 1 ? "s" : ""} remaining
          </span>
        </div>
      )}

      {/* Unlock prompt — shown pre-capture when user still has credits */}
      {!isCaptured && !needsCapture && !hitHardLimit && (
        <div className="dv-ai-tools__unlock-hint">
          <Unlock size={14} />
          <span>Share your info to unlock {postCaptureExtra} more AI designs</span>
        </div>
      )}

      {/* Gate banner — shown when user needs to save to continue */}
      {(needsCapture || (aiError && !isCaptured)) && !hitHardLimit && (
        <div className="dv-ai-tools__gate">
          <Lock size={18} className="dv-ai-tools__gate-icon" />
          <p className="dv-ai-tools__gate-title">
            You've used your free design preview
          </p>
          <p className="dv-ai-tools__gate-sub">
            Unlock {postCaptureExtra} more AI designs by sharing your info
          </p>
          <button
            className="dv-ai-tools__gate-btn"
            onClick={openModal}
          >
            <Unlock size={16} />
            Unlock {postCaptureExtra} More AI Designs
          </button>
        </div>
      )}

      {/* Hard limit — schedule consultation CTA */}
      {hitHardLimit && (
        <div className="dv-ai-tools__gate">
          <CalendarCheck size={18} className="dv-ai-tools__gate-icon" />
          <p className="dv-ai-tools__gate-title">
            You've explored all your free customizations!
          </p>
          <p className="dv-ai-tools__gate-sub">
            Ready to make this plan yours? Schedule a free consultation and
            we'll create your full custom plan set.
          </p>
          <button
            className="dv-ai-tools__gate-btn"
            onClick={() => {
              const url = getSchedulerUrl(
                config.schedulerUrl ?? "https://crm.empowerbuilding.ai/book/barnhaus-consultation"
              );
              window.open(url, "_blank", "noopener");
            }}
          >
            <CalendarCheck size={16} />
            Schedule My Consultation
          </button>
        </div>
      )}

      {/* Error message (only for non-gate/non-limit errors, e.g. network/server issues) */}
      {aiError && isCaptured && !hitHardLimit && (
        <div className="dv-ai-tools__error">{aiError}</div>
      )}

      {/* ── CHANGE EXTERIOR STYLE section ── */}
      {config.enableStyleSwap !== false && (
        <div className="dv-ai-tools__section">
          <div className="dv-ai-tools__section-header">
            <img
              src={heroUrl}
              alt="Exterior preview"
              className="dv-ai-tools__section-thumb"
              width={48}
              height={36}
            />
            <span className="dv-ai-tools__section-label">
              {imageType === "interior" ? "Change Interior Style" : "Change Exterior Style"}
            </span>
          </div>
          <StyleSwapButtons
            planId={plan.id}
            currentStyle={plan.style}
            onSwap={onSwap}
            isProcessing={isStyleSwapProcessing}
            activePreset={activePreset}
          />
        </div>
      )}

      <div className="dv-ai-tools__divider" />

      {/* ── CUSTOMIZE FLOOR PLAN section ── */}
      {config.enableFloorPlanEdit !== false && (
        <div className="dv-ai-tools__section">
          <div className="dv-ai-tools__section-header">
            <span className="dv-ai-tools__section-label">Customize Floor Plan</span>
          </div>
          <FloorPlanEditor
            planId={plan.id}
            floorPlanUrl={floorPlanUrl}
            originalFloorPlanUrl={originalFloorPlanUrl}
            hasFloorPlanResult={hasFloorPlanResult}
            showOriginalFloorPlan={showOriginalFloorPlan}
            onToggleFloorPlanOriginal={onToggleFloorPlanOriginal}
            wishlistItems={wishlistItems}
            onWishlistAdd={onWishlistAdd}
            onWishlistRemove={onWishlistRemove}
            onPreviewAI={onPreviewAI}
            isProcessing={isFloorPlanProcessing}
          />
        </div>
      )}

      <div className="dv-ai-tools__divider" />

      {/* Save Design button */}
      <button
        className="dv-ai-tools__save-btn"
        onClick={openModal}
        disabled={isCaptured}
      >
        {isCaptured ? (
          <>
            <Save size={16} />
            Design Saved
          </>
        ) : (
          <>
            <Unlock size={16} />
            Unlock {postCaptureExtra} More AI Designs
          </>
        )}
      </button>

      {/* Callout */}
      {!hitHardLimit && !isCaptured && (
        <p className="dv-ai-tools__callout">
          {maxFree} free credit{maxFree !== 1 ? "s" : ""}. Share your info to unlock {postCaptureExtra} more.
        </p>
      )}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={modalOpen}
        onClose={closeModal}
        plan={plan}
        modifications={modifications}
        config={config}
      />
    </div>
  );
};
