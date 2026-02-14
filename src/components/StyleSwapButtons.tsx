import React from "react";
import type { StyleSwapButtonsProps } from "../types";
import { DEFAULT_STYLE_PRESETS } from "../types";

export const StyleSwapButtons: React.FC<StyleSwapButtonsProps> = ({
  planId: _planId,
  imageUrl: _imageUrl,
  onSwap,
}) => {
  return (
    <div className="dv-style-swap-buttons">
      {DEFAULT_STYLE_PRESETS.map((preset) => (
        <button
          key={preset.id}
          className="dv-style-swap-btn"
          onClick={() => onSwap(preset)}
          title={preset.description}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};
