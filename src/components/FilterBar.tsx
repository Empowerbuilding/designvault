import React from "react";
import { Filter, X } from "lucide-react";
import type { FilterBarProps, FloorPlanStyle } from "../types";

const AREA_RANGES = [
  { label: "Under 1,000 sqft", min: 0, max: 999 },
  { label: "1,000 – 1,500 sqft", min: 1000, max: 1500 },
  { label: "1,500 – 2,000 sqft", min: 1500, max: 2000 },
  { label: "2,000 – 2,500 sqft", min: 2000, max: 2500 },
  { label: "2,500 – 3,000 sqft", min: 2500, max: 3000 },
  { label: "3,000+ sqft", min: 3000, max: 99999 },
];

const STYLE_LABELS: Record<FloorPlanStyle, string> = {
  modern: "Modern",
  traditional: "Traditional",
  rustic: "Rustic",
  contemporary: "Contemporary",
  farmhouse: "Farmhouse",
  hill_country: "Hill Country",
};

function hasActiveFilters(filters: FilterBarProps["filters"]): boolean {
  return (
    filters.bedrooms !== null ||
    filters.bathrooms !== null ||
    filters.minArea !== null ||
    filters.maxArea !== null ||
    filters.style !== null
  );
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  clearFilters,
  uniqueBedrooms,
  uniqueBathrooms,
  uniqueStyles,
  totalCount,
  filteredCount,
}) => {
  const active = hasActiveFilters(filters);

  return (
    <div className="dv-filter-bar">
      <div className="dv-filter-bar__icon">
        <Filter size={18} />
      </div>

      <div className="dv-filter-bar__selects">
        {/* Bedrooms */}
        <select
          className="dv-filter-bar__select"
          value={filters.bedrooms ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              bedrooms: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Bedrooms</option>
          {uniqueBedrooms.map((b) => (
            <option key={b} value={b}>
              {b} Bed{b !== 1 ? "s" : ""}
            </option>
          ))}
        </select>

        {/* Bathrooms */}
        <select
          className="dv-filter-bar__select"
          value={filters.bathrooms ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              bathrooms: e.target.value ? Number(e.target.value) : null,
            })
          }
        >
          <option value="">Bathrooms</option>
          {uniqueBathrooms.map((b) => (
            <option key={b} value={b}>
              {b} Bath{b !== 1 ? "s" : ""}
            </option>
          ))}
        </select>

        {/* Area Range */}
        <select
          className="dv-filter-bar__select"
          value={
            filters.minArea !== null && filters.maxArea !== null
              ? `${filters.minArea}-${filters.maxArea}`
              : ""
          }
          onChange={(e) => {
            if (!e.target.value) {
              setFilters({ ...filters, minArea: null, maxArea: null });
            } else {
              const [min, max] = e.target.value.split("-").map(Number);
              setFilters({ ...filters, minArea: min, maxArea: max });
            }
          }}
        >
          <option value="">Sqft Range</option>
          {AREA_RANGES.map((r) => (
            <option key={r.label} value={`${r.min}-${r.max}`}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Style */}
        <select
          className="dv-filter-bar__select"
          value={filters.style ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              style: (e.target.value || null) as typeof filters.style,
            })
          }
        >
          <option value="">Style</option>
          {uniqueStyles.map((s) => (
            <option key={s} value={s}>
              {STYLE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="dv-filter-bar__meta">
        <span className="dv-filter-bar__count">
          Showing {filteredCount} of {totalCount} plans
        </span>
        {active && (
          <button className="dv-filter-bar__clear" onClick={clearFilters}>
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
