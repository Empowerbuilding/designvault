import React from "react";
import type { ArchiveGridProps } from "../types";

export const ArchiveGrid: React.FC<ArchiveGridProps> = ({
  plans,
  loading,
  onPlanSelect,
}) => {
  if (loading) {
    return <div className="dv-archive-grid dv-loading">Loading...</div>;
  }

  return (
    <div className="dv-archive-grid">
      {plans.map((plan) => (
        <div key={plan.id} onClick={() => onPlanSelect(plan)}>
          {plan.title}
        </div>
      ))}
    </div>
  );
};
