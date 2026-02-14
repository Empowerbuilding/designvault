import React, { useMemo } from "react";
import { Home, Bath, Square } from "lucide-react";
import type { FloorPlan, SimilarPlansProps } from "../types";

function scoreSimilarity(a: FloorPlan, b: FloorPlan): number {
  let score = 0;
  if (a.style && a.style === b.style) score += 3;
  if (a.category && a.category === b.category) score += 3;
  if (Math.abs(a.beds - b.beds) <= 1) score += 2;
  if (Math.abs(a.area - b.area) <= 500) score += 2;
  if (a.price_tier && a.price_tier === b.price_tier) score += 1;
  return score;
}

export const SimilarPlans: React.FC<SimilarPlansProps> = ({
  currentPlan,
  allPlans,
  onPlanSelect,
}) => {
  const similar = useMemo(() => {
    return allPlans
      .filter((p) => p.id !== currentPlan.id)
      .map((p) => ({ plan: p, score: scoreSimilarity(currentPlan, p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((s) => s.score > 0)
      .map((s) => s.plan);
  }, [currentPlan, allPlans]);

  if (similar.length === 0) return null;

  return (
    <div className="dv-similar-plans">
      <h3 className="dv-similar-plans__title">Similar Plans</h3>
      <div className="dv-similar-plans__grid">
        {similar.map((plan) => (
          <button
            key={plan.id}
            className="dv-similar-plans__card"
            onClick={() => onPlanSelect(plan)}
          >
            <img
              src={plan.image_url}
              alt={plan.title}
              className="dv-similar-plans__img"
              loading="lazy"
            />
            <div className="dv-similar-plans__info">
              <span className="dv-similar-plans__name">{plan.title}</span>
              <span className="dv-similar-plans__specs">
                <Home size={12} /> {plan.beds}
                <Bath size={12} /> {plan.baths}
                <Square size={12} /> {plan.area.toLocaleString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
