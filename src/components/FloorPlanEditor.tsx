import React, { useState } from "react";
import { Plus, Sparkles, Check, X, Loader2 } from "lucide-react";
import type { FloorPlanEditorProps } from "../types";

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  floorPlanUrl,
  originalFloorPlanUrl,
  hasFloorPlanResult,
  showOriginalFloorPlan,
  onToggleFloorPlanOriginal,
  wishlistItems,
  onWishlistAdd,
  onWishlistRemove,
  onPreviewAI,
  isProcessing,
}) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    onWishlistAdd(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const displayUrl = showOriginalFloorPlan ? originalFloorPlanUrl : floorPlanUrl;

  return (
    <div className="dv-wishlist">
      {/* Floor plan image with before/after toggle */}
      {displayUrl && (
        <div className="dv-wishlist__preview">
          <img
            src={displayUrl}
            alt={hasFloorPlanResult && !showOriginalFloorPlan ? "AI-modified floor plan" : "Current floor plan"}
            className="dv-wishlist__preview-img"
          />
          {hasFloorPlanResult && (
            <div className="dv-wishlist__compare">
              <button
                className={`dv-wishlist__compare-btn ${
                  !showOriginalFloorPlan ? "dv-wishlist__compare-btn--active" : ""
                }`}
                onClick={() => onToggleFloorPlanOriginal(false)}
              >
                AI Generated
              </button>
              <button
                className={`dv-wishlist__compare-btn ${
                  showOriginalFloorPlan ? "dv-wishlist__compare-btn--active" : ""
                }`}
                onClick={() => onToggleFloorPlanOriginal(true)}
              >
                Original
              </button>
            </div>
          )}
        </div>
      )}

      <h4 className="dv-wishlist__label">Floor Plan Wishlist</h4>

      {/* Input area */}
      <div className="dv-wishlist__input-wrap">
        <textarea
          className="dv-wishlist__input"
          placeholder="What would you change? E.g. 'Add a 4th bedroom', 'Bigger garage', 'Open concept kitchen'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          rows={2}
        />
        <button
          className="dv-wishlist__add-btn"
          onClick={handleAdd}
          disabled={!input.trim() || isProcessing}
        >
          <Plus size={14} />
          Add to Wishlist
        </button>
      </div>

      {/* Wishlist items */}
      {wishlistItems.length > 0 && (
        <div className="dv-wishlist__items">
          {wishlistItems.map((item, i) => (
            <div key={i} className="dv-wishlist__item">
              <Check size={12} className="dv-wishlist__item-check" />
              <span className="dv-wishlist__item-text">{item}</span>
              <button
                className="dv-wishlist__item-remove"
                onClick={() => onWishlistRemove(i)}
                aria-label="Remove"
                disabled={isProcessing}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview AI button */}
      {wishlistItems.length > 0 && (
        <div className="dv-wishlist__ai-section">
          <button
            className="dv-wishlist__ai-btn"
            onClick={onPreviewAI}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 size={14} className="dv-wishlist__spinner" />
            ) : (
              <Sparkles size={14} />
            )}
            {isProcessing ? "Generating..." : "Preview AI Suggestion"}
          </button>
          <p className="dv-wishlist__ai-disclaimer">
            Results are AI-generated and may not be exact
          </p>
        </div>
      )}
    </div>
  );
};
