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
  onResult,
  onProcessingChange,
}) => {
  const {
    handleStyleSwap,
    handleFloorPlanEdit,
    handleEnhancePrompt,
    isProcessing,
    needsCapture,
    error: aiError,
  } = useAIInteractions();

  const { modifications, isCaptured } = useDesignVaultContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(
    plan.style ?? null
  );

  // Sync processing state up to PlanDetail
  useEffect(() => {
    onProcessingChange(isProcessing);
  }, [isProcessing, onProcessingChange]);

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
          originalUrl: plan.image_url,
          type: "style_swap",
        });
      }
    },
    [needsCapture, handleStyleSwap, plan.id, plan.image_url, onResult]
  );

  const onEdit = useCallback(
    async (prompt: string) => {
      if (needsCapture) {
        setModalOpen(true);
        return;
      }

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
    },
    [
      needsCapture,
      handleFloorPlanEdit,
      plan.id,
      plan.floor_plan_url,
      plan.image_url,
      onResult,
    ]
  );

  const onEnhance = useCallback(
    async (prompt: string) => {
      return handleEnhancePrompt(prompt, plan.image_url);
    },
    [handleEnhancePrompt, plan.image_url]
  );

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

      {/* Style Swap */}
      {config.enableStyleSwap !== false && (
        <>
          <StyleSwapButtons
            planId={plan.id}
            currentStyle={plan.style}
            onSwap={onSwap}
            isProcessing={isProcessing}
            activePreset={activePreset}
          />
          <div className="dv-ai-tools__divider" />
        </>
      )}

      {/* Floor Plan Editor */}
      {config.enableFloorPlanEdit !== false && (
        <>
          <FloorPlanEditor
            planId={plan.id}
            currentFloorPlanUrl={plan.floor_plan_url}
            onEdit={onEdit}
            onEnhance={onEnhance}
            isProcessing={isProcessing}
          />
          <div className="dv-ai-tools__divider" />
        </>
      )}

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
