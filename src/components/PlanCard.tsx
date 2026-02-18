import React, { useState } from "react";
import { motion } from "framer-motion";
import { Home, Bath, Square, Sparkles, Star } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import type { PlanCardProps } from "../types";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelect,
  onFavorite,
  isFavorite = false,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const isPopular = (plan.vote_count ?? 0) > 3;
  const isNew = plan.is_new === true;

  const allImages = [plan.image_url, ...(plan.interior_urls ?? [])];
  const hasMultipleImages = allImages.length > 1;

  return (
    <motion.div
      className="dv-plan-card"
      variants={cardVariants}
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Image area */}
      <div className="dv-plan-card__image" onClick={() => onSelect(plan)}>
        <img
          src={allImages[imageIndex]}
          alt={plan.title}
          className="dv-plan-card__img"
          loading="lazy"
        />
        <div className="dv-plan-card__image-gradient" />

        {/* Badges — top left */}
        {(isPopular || isNew) && (
          <div className="dv-plan-card__badges">
            {isPopular && (
              <span className="dv-plan-card__badge dv-plan-card__badge--popular">
                <Star size={10} /> POPULAR
              </span>
            )}
            {isNew && (
              <span className="dv-plan-card__badge dv-plan-card__badge--new">
                NEW
              </span>
            )}
          </div>
        )}


        {/* Favorite button — on image, below AI badge */}
        {onFavorite && (
          <div className="dv-plan-card__favorite">
            <FavoriteButton
              planId={plan.id}
              isFavorite={isFavorite}
              onToggle={onFavorite}
              size="sm"
            />
          </div>
        )}

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

        {/* Full-width CTA */}
        <button className="dv-plan-card__cta" onClick={() => onSelect(plan)}>
          <Sparkles size={14} />
          Customize
        </button>
      </div>
    </motion.div>
  );
};
