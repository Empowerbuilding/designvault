import React from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { CategoryTiles } from "./CategoryTiles";
import { FilterBar } from "./FilterBar";
import { FeaturedRow } from "./FeaturedRow";
import { PlanCard } from "./PlanCard";
import { usePlans } from "../hooks/usePlans";
import { useFavorites } from "../hooks/useFavorites";
import type { ArchiveGridProps } from "../types";

function SkeletonCard() {
  return (
    <div className="dv-plan-card dv-plan-card--skeleton">
      <div className="dv-plan-card__image dv-skeleton" />
      <div className="dv-plan-card__content">
        <div className="dv-skeleton dv-skeleton--text dv-skeleton--title" />
        <div className="dv-skeleton dv-skeleton--text dv-skeleton--specs" />
        <div className="dv-skeleton dv-skeleton--text dv-skeleton--tags" />
      </div>
    </div>
  );
}

const hasAnyFilter = (filters: {
  category: unknown;
  bedrooms: unknown;
  bathrooms: unknown;
  style: unknown;
  minArea: unknown;
}): boolean =>
  filters.category !== null ||
  filters.bedrooms !== null ||
  filters.bathrooms !== null ||
  filters.style !== null ||
  filters.minArea !== null;

export const ArchiveGrid: React.FC<ArchiveGridProps> = ({ onPlanSelect }) => {
  const {
    plans,
    filteredPlans,
    featuredPlans,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    uniqueBedrooms,
    uniqueBathrooms,
    areaRange,
    uniqueStyles,
  } = usePlans();

  const { toggleFavorite, isFavorite } = useFavorites();

  const handleCategorySelect = (category: typeof filters.category) => {
    setFilters({ ...filters, category });
  };

  if (error) {
    return (
      <div className="dv-archive-grid dv-archive-grid--error">
        <p>Failed to load plans: {error}</p>
      </div>
    );
  }

  return (
    <div className="dv-archive-grid">
      {/* Category tiles */}
      <CategoryTiles
        activeCategory={filters.category}
        onSelect={handleCategorySelect}
      />

      {/* Featured row — only when no filters are active */}
      {!hasAnyFilter(filters) && featuredPlans.length > 0 && (
        <FeaturedRow
          title="Featured Plans"
          plans={featuredPlans}
          onPlanSelect={onPlanSelect}
          onFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        uniqueBedrooms={uniqueBedrooms}
        uniqueBathrooms={uniqueBathrooms}
        areaRange={areaRange}
        uniqueStyles={uniqueStyles}
        totalCount={plans.length}
        filteredCount={filteredPlans.length}
      />

      {/* Plan grid */}
      {loading ? (
        <div className="dv-plan-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="dv-archive-grid__empty">
          <Layers size={48} />
          <h3>No plans found</h3>
          <p>Try adjusting your filters or browse all categories.</p>
          <button className="dv-btn dv-btn--outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <motion.div
          className="dv-plan-grid"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={onPlanSelect}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite(plan.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
