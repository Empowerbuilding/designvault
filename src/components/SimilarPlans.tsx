import React from "react";
import type { SimilarPlansProps } from "../types";

export const SimilarPlans: React.FC<SimilarPlansProps> = ({
  currentPlan,
  plans,
  onPlanSelect,
}) => {
  const similar = plans.filter((p) => p.id !== currentPlan.id);

  return (
    <div className="dv-similar-plans">
      <h3 className="dv-similar-plans__title">Similar Plans</h3>
      <div className="dv-similar-plans__row">
        {similar.map((plan) => (
          <div
            key={plan.id}
            className="dv-similar-plans__item"
            onClick={() => onPlanSelect(plan)}
          >
            {plan.title}
          </div>
        ))}
      </div>
    </div>
  );
};
