import React from "react";
import type { CategoryTilesProps } from "../types";

export const CategoryTiles: React.FC<CategoryTilesProps> = ({
  categories,
  activeCategory,
  onSelect,
}) => {
  return (
    <div className="dv-category-tiles">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          className={`dv-category-tile ${activeCategory === cat.slug ? "dv-category-tile--active" : ""}`}
          onClick={() =>
            onSelect(activeCategory === cat.slug ? null : cat.slug)
          }
        >
          <span className="dv-category-tile__name">{cat.label}</span>
          <span className="dv-category-tile__count">{cat.count}</span>
        </button>
      ))}
    </div>
  );
};
