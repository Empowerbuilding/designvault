import React, { useState } from "react";
import { Plus, Wand2, Check, X, Loader2, Search } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
          <div
            className="dv-wishlist__preview-clickable"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") setLightboxOpen(true); }}
          >
            <img
              src={displayUrl}
              alt={hasFloorPlanResult && !showOriginalFloorPlan ? "AI-modified floor plan" : "Current floor plan"}
              className="dv-wishlist__preview-img"
            />
            <div className="dv-wishlist__preview-zoom">
              <Search size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Before/After toggle — below floor plan image */}
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
            className="dv-wishlist__ai-btn dv-wishlist__ai-btn--primary"
            onClick={onPreviewAI}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 size={18} className="dv-wishlist__spinner" />
            ) : (
              <Wand2 size={18} />
            )}
            {isProcessing ? "Generating Your Floor Plan..." : "Generate AI Floor Plan"}
          </button>
          <p className="dv-wishlist__ai-disclaimer">
            Results are AI-generated and may not be exact
          </p>
        </div>
      )}
      <ImageLightbox
        src={displayUrl}
        alt="Floor plan"
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        aiResults={hasFloorPlanResult ? { [originalFloorPlanUrl]: floorPlanUrl } : undefined}
      />
    </div>
  );
};
