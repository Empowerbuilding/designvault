import React from "react";
import type { AIToolsPanelProps } from "../types";

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({ plan }) => {
  return (
    <div className="dv-ai-tools-panel">
      <h3 className="dv-ai-tools-panel__title">AI Tools</h3>
      <p>Customize {plan.title}</p>
    </div>
  );
};
