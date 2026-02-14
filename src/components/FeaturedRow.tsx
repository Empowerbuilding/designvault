import React, { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PlanCard } from "./PlanCard";
import type { FeaturedRowProps } from "../types";

export const FeaturedRow: React.FC<FeaturedRowProps> = ({
  title,
  plans,
  onPlanSelect,
  onFavorite,
  isFavorite,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (plans.length === 0) return null;

  return (
    <section className="dv-featured-row">
      <div className="dv-featured-row__header">
        <h2 className="dv-featured-row__title">{title}</h2>
        <span className="dv-featured-row__view-all">
          View all <ArrowRight size={16} />
        </span>
      </div>

      <div className="dv-featured-row__wrapper">
        <button
          className="dv-featured-row__arrow dv-featured-row__arrow--left"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="dv-featured-row__scroll" ref={scrollRef}>
          {plans.map((plan) => (
            <div key={plan.id} className="dv-featured-row__item">
              <PlanCard
                plan={plan}
                onSelect={onPlanSelect}
                onFavorite={onFavorite}
                isFavorite={isFavorite(plan.id)}
              />
            </div>
          ))}
        </div>

        <button
          className="dv-featured-row__arrow dv-featured-row__arrow--right"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};
