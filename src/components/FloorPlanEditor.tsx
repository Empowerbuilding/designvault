import React, { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import type { FloorPlanEditorProps } from "../types";

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  currentFloorPlanUrl,
  onEdit,
  onEnhance,
  isProcessing,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    const enhanced = await onEnhance(prompt);
    if (enhanced) setPrompt(enhanced);
    setIsEnhancing(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return;
    await onEdit(prompt);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="dv-floor-plan-editor">
      <h4 className="dv-floor-plan-editor__label">Floor Plan Editor</h4>

      {/* Preview */}
      {currentFloorPlanUrl && (
        <div className="dv-floor-plan-editor__preview">
          <img
            src={currentFloorPlanUrl}
            alt="Current floor plan"
            className="dv-floor-plan-editor__preview-img"
          />
        </div>
      )}

      {/* Input area */}
      <div className="dv-floor-plan-editor__input-wrap">
        <textarea
          className="dv-floor-plan-editor__input"
          placeholder='Try: "Add a 4th bedroom" or "Make the kitchen bigger"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          rows={3}
        />

        <div className="dv-floor-plan-editor__actions">
          <button
            className="dv-floor-plan-editor__enhance"
            onClick={handleEnhance}
            disabled={!prompt.trim() || isEnhancing || isProcessing}
            title="Enhance your prompt with AI"
          >
            {isEnhancing ? (
              <Loader2 size={14} className="dv-floor-plan-editor__spinner" />
            ) : (
              <Sparkles size={14} />
            )}
            Enhance
          </button>

          <button
            className="dv-floor-plan-editor__submit"
            onClick={handleSubmit}
            disabled={!prompt.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 size={14} className="dv-floor-plan-editor__spinner" />
            ) : (
              <Send size={14} />
            )}
            Apply Edit
          </button>
        </div>
      </div>
    </div>
  );
};
