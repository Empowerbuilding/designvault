import React from "react";
import type { FeaturedRowProps } from "../types";

export const FeaturedRow: React.FC<FeaturedRowProps> = ({
  plans,
  onPlanSelect,
}) => {
  return (
    <div className="dv-featured-row">
      <h2 className="dv-featured-row__title">Featured Plans</h2>
      <div className="dv-featured-row__scroll">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="dv-featured-row__item"
            onClick={() => onPlanSelect(plan)}
          >
            {plan.title}
          </div>
        ))}
      </div>
    </div>
  );
};
