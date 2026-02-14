import React from "react";
import type { FilterBarProps } from "../types";

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  return (
    <div className="dv-filter-bar">
      <select
        className="dv-filter-bar__select"
        value={filters.bedrooms ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            bedrooms: e.target.value ? Number(e.target.value) : null,
          })
        }
      >
        <option value="">Beds</option>
      </select>

      <select
        className="dv-filter-bar__select"
        value={filters.bathrooms ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            bathrooms: e.target.value ? Number(e.target.value) : null,
          })
        }
      >
        <option value="">Baths</option>
      </select>

      <select
        className="dv-filter-bar__select"
        value={filters.style ?? ""}
        onChange={(e) =>
          onChange({
            ...filters,
            style: (e.target.value || null) as typeof filters.style,
          })
        }
      >
        <option value="">Style</option>
      </select>
    </div>
  );
};
