import React from "react";
import type { PlanCardProps } from "../types";

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect }) => {
  return (
    <div className="dv-plan-card" onClick={() => onSelect(plan)}>
      <div className="dv-plan-card__image">
        <img src={plan.image_url} alt={plan.title} />
      </div>
      <div className="dv-plan-card__info">
        <h3 className="dv-plan-card__name">{plan.title}</h3>
        <p className="dv-plan-card__specs">
          {plan.beds} bed &middot; {plan.baths} bath &middot;{" "}
          {plan.area.toLocaleString()} sqft
        </p>
      </div>
    </div>
  );
};
