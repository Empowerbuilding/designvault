import React from "react";
import { Loader2 } from "lucide-react";
import { DEFAULT_STYLE_PRESETS } from "../types";
import type { StyleSwapButtonsProps } from "../types";

export const StyleSwapButtons: React.FC<StyleSwapButtonsProps> = ({
  currentStyle,
  onSwap,
  isProcessing,
  activePreset,
}) => {
  return (
    <div className="dv-style-swap">
      <h4 className="dv-style-swap__label">Style Swap</h4>
      <div className="dv-style-swap__grid">
        {DEFAULT_STYLE_PRESETS.map((preset) => {
          const isActive = activePreset === preset.id;
          const isOriginal = currentStyle === preset.id && !activePreset;
          const isThisProcessing = isProcessing && isActive;

          return (
            <button
              key={preset.id}
              className={`dv-style-swap__btn ${
                isActive || isOriginal ? "dv-style-swap__btn--active" : ""
              }`}
              onClick={() => onSwap(preset.id)}
              disabled={isProcessing}
              title={preset.description}
            >
              <span className="dv-style-swap__btn-label">{preset.label}</span>
              {isThisProcessing && (
                <Loader2 size={14} className="dv-style-swap__spinner" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
