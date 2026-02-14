import React, { useState } from "react";
import { motion } from "framer-motion";
import { Home, Bath, Square, Layers, Star } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import type { PlanCardProps } from "../types";

function isNewPlan(createdAt: string): boolean {
  const created = new Date(createdAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return created > thirtyDaysAgo;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelect,
  onFavorite,
  isFavorite = false,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const isPopular = plan.click_count >= 50;
  const isNew = isNewPlan(plan.created_at);

  const allImages = [plan.image_url, ...(plan.interior_urls ?? [])];
  const hasMultipleImages = allImages.length > 1;

  return (
    <motion.div
      className="dv-plan-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
    >
      {/* Image area */}
      <div className="dv-plan-card__image" onClick={() => onSelect(plan)}>
        <img
          src={allImages[imageIndex]}
          alt={plan.title}
          className="dv-plan-card__img"
          loading="lazy"
        />

        {/* Badges */}
        <div className="dv-plan-card__badges">
          {isPopular && (
            <span className="dv-plan-card__badge dv-plan-card__badge--popular">
              <Star size={12} />
              Popular
            </span>
          )}
          {isNew && (
            <span className="dv-plan-card__badge dv-plan-card__badge--new">
              New
            </span>
          )}
        </div>

        {/* Carousel dots */}
        {hasMultipleImages && (
          <div className="dv-plan-card__dots">
            {allImages.map((_, i) => (
              <button
                key={i}
                className={`dv-plan-card__dot ${
                  i === imageIndex ? "dv-plan-card__dot--active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setImageIndex(i);
                }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="dv-plan-card__content">
        <h3 className="dv-plan-card__title">{plan.title}</h3>

        <div className="dv-plan-card__specs">
          <span className="dv-plan-card__spec">
            <Home size={14} />
            {plan.beds} Bed{plan.beds !== 1 ? "s" : ""}
          </span>
          <span className="dv-plan-card__spec">
            <Bath size={14} />
            {plan.baths} Bath{plan.baths !== 1 ? "s" : ""}
          </span>
          <span className="dv-plan-card__spec">
            <Square size={14} />
            {plan.area.toLocaleString()} sqft
          </span>
        </div>

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="dv-plan-card__tags">
            {plan.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="dv-plan-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="dv-plan-card__actions">
          <button className="dv-plan-card__cta" onClick={() => onSelect(plan)}>
            <Layers size={14} />
            Customize
          </button>
          {onFavorite && (
            <FavoriteButton
              planId={plan.id}
              isFavorite={isFavorite}
              onToggle={onFavorite}
              size="sm"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
