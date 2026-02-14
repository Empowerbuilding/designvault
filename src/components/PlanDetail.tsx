import React from "react";
import type { PlanDetailProps } from "../types";

export const PlanDetail: React.FC<PlanDetailProps> = ({ plan, onClose }) => {
  return (
    <div className="dv-plan-detail">
      <button className="dv-plan-detail__close" onClick={onClose}>
        Close
      </button>
      <h2 className="dv-plan-detail__name">{plan.title}</h2>
      <p className="dv-plan-detail__description">{plan.description}</p>
    </div>
  );
};
