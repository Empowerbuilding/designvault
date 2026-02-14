import React from "react";
import type { FloorPlanEditorProps } from "../types";

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  planId: _planId,
  imageUrl: _imageUrl,
}) => {
  return (
    <div className="dv-floor-plan-editor">
      <h3 className="dv-floor-plan-editor__title">Edit Floor Plan</h3>
      <textarea
        className="dv-floor-plan-editor__input"
        placeholder="Describe changes to the floor plan..."
      />
      <button className="dv-floor-plan-editor__submit">Apply Changes</button>
    </div>
  );
};
