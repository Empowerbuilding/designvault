import React, { useCallback, useEffect, useState } from "react";
import { Sparkles, Save } from "lucide-react";
import { StyleSwapButtons } from "./StyleSwapButtons";
import { FloorPlanEditor } from "./FloorPlanEditor";
import { LeadCaptureModal } from "./LeadCaptureModal";
import { useAIInteractions } from "../hooks/useAIInteractions";
import { useDesignVaultContext } from "../hooks/useDesignVault";
import type { AIToolsPanelProps } from "../types";

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  plan,
  config,
  heroUrl,
  originalHeroUrl,
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
    isProcessing,
    needsCapture,
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

  // Sync processing state up to PlanDetail
  useEffect(() => {
    onProcessingChange(isProcessing);
  }, [isProcessing, onProcessingChange]);

  // ── Style Swap ──────────────────────────────────────────────

  const onSwap = useCallback(
    async (presetId: string) => {
      if (needsCapture) {
        setModalOpen(true);
        return;
      }

      setActivePreset(presetId);
      const result = await handleStyleSwap(plan.id, presetId);

      if (result?.success && result.resultUrl) {
        onResult({
          newUrl: result.resultUrl,
          originalUrl: originalHeroUrl,
          type: "style_swap",
        });
      }
    },
    [needsCapture, handleStyleSwap, plan.id, originalHeroUrl, onResult]
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

  return (
    <div className="dv-ai-tools">
      {/* Header */}
      <div className="dv-ai-tools__header">
        <Sparkles size={20} />
        <h3 className="dv-ai-tools__title">AI Design Tools</h3>
      </div>

      {/* Error message */}
      {aiError && <div className="dv-ai-tools__error">{aiError}</div>}

      {/* ── CHANGE EXTERIOR STYLE section ── */}
      {config.enableStyleSwap !== false && (
        <div className="dv-ai-tools__section">
          <div className="dv-ai-tools__section-header">
            <img
              src={heroUrl}
              alt="Exterior preview"
              className="dv-ai-tools__section-thumb"
            />
            <span className="dv-ai-tools__section-label">Change Exterior Style</span>
          </div>
          <StyleSwapButtons
            planId={plan.id}
            currentStyle={plan.style}
            onSwap={onSwap}
            isProcessing={isProcessing}
            activePreset={activePreset}
          />
        </div>
      )}

      <div className="dv-ai-tools__divider" />

      {/* ── CUSTOMIZE FLOOR PLAN section ── */}
      {config.enableFloorPlanEdit !== false && (
        <div className="dv-ai-tools__section">
          <div className="dv-ai-tools__section-header">
            {originalFloorPlanUrl ? (
              <img
                src={originalFloorPlanUrl}
                alt="Floor plan preview"
                className="dv-ai-tools__section-thumb"
              />
            ) : (
              <div className="dv-ai-tools__section-thumb dv-ai-tools__section-thumb--empty" />
            )}
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
            isProcessing={isProcessing}
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
        <Save size={16} />
        {isCaptured ? "Design Saved" : "Save This Design"}
      </button>

      {/* Callout */}
      <p className="dv-ai-tools__callout">
        First customization is free. Save your design to unlock more.
      </p>

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
