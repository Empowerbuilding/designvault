import { useCallback, useEffect, useMemo, useState } from "react";
import { useDesignVaultContext } from "./useDesignVault";
import type { FloorPlan, FloorPlanCategory, FloorPlanStyle, PlanFilters } from "../types";

const EMPTY_FILTERS: PlanFilters = {
  bedrooms: null,
  bathrooms: null,
  minArea: null,
  maxArea: null,
  style: null,
  category: null,
};

export function usePlans(initialFilters?: PlanFilters) {
  const { api } = useDesignVaultContext();

  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [filters, setFilters] = useState<PlanFilters>(
    initialFilters ?? EMPTY_FILTERS
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all plans once on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .getPlans()
      .then((data) => {
        if (!cancelled) {
          setPlans(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api]);

  // Client-side filtering for instant response
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (filters.bedrooms !== null && plan.beds !== filters.bedrooms)
        return false;
      if (filters.bathrooms !== null && plan.baths !== filters.bathrooms)
        return false;
      if (filters.minArea !== null && plan.area < filters.minArea)
        return false;
      if (filters.maxArea !== null && plan.area > filters.maxArea)
        return false;
      if (filters.style !== null && plan.style !== filters.style) return false;
      if (filters.category !== null) {
        if (filters.category === "ranch_living") {
          if (plan.category !== "barndominium" && plan.category !== "ranch" && plan.category !== "cabin")
            return false;
        } else if (plan.category !== filters.category) {
          return false;
        }
      }
      return true;
    });
  }, [plans, filters]);

  // Featured: featured === true, sorted by click_count desc, limit 6
  const featuredPlans = useMemo(() => {
    return plans
      .filter((p) => p.featured)
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 6);
  }, [plans]);

  // Recent: sorted by created_at desc, limit 4
  const recentPlans = useMemo(() => {
    return [...plans]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 4);
  }, [plans]);

  // ── Derived filter options ─────────────────────────────────

  const uniqueBedrooms = useMemo(
    () => [...new Set(plans.map((p) => p.beds))].sort((a, b) => a - b),
    [plans]
  );

  const uniqueBathrooms = useMemo(
    () => [...new Set(plans.map((p) => p.baths))].sort((a, b) => a - b),
    [plans]
  );

  const areaRange = useMemo(() => {
    if (plans.length === 0) return { min: 0, max: 0 };
    const areas = plans.map((p) => p.area);
    return { min: Math.min(...areas), max: Math.max(...areas) };
  }, [plans]);

  const uniqueStyles = useMemo(
    () =>
      [
        ...new Set(plans.map((p) => p.style).filter(Boolean)),
      ] as FloorPlanStyle[],
    [plans]
  );

  const uniqueCategories = useMemo(
    () =>
      [
        ...new Set(plans.map((p) => p.category).filter(Boolean)),
      ] as FloorPlanCategory[],
    [plans]
  );

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return {
    plans,
    filteredPlans,
    featuredPlans,
    recentPlans,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    uniqueBedrooms,
    uniqueBathrooms,
    areaRange,
    uniqueStyles,
    uniqueCategories,
  };
}
