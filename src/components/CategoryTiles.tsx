import React from "react";
import { Home, Mountain, Crown, TreePine, Minimize2, Warehouse } from "lucide-react";
import type { CategoryTilesProps, FloorPlanCategory } from "../types";

interface CategoryConfig {
  slug: FloorPlanCategory;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryConfig[] = [
  { slug: "barndominium", label: "Modern Barndo", icon: <Home size={22} /> },
  { slug: "ranch", label: "Rustic Ranch", icon: <Mountain size={22} /> },
  { slug: "estate", label: "Luxury Estate", icon: <Crown size={22} /> },
  { slug: "cabin", label: "Hill Country", icon: <TreePine size={22} /> },
  { slug: "starter", label: "Compact / Starter", icon: <Minimize2 size={22} /> },
  { slug: "shop_house", label: "Shop + Living", icon: <Warehouse size={22} /> },
];

export const CategoryTiles: React.FC<CategoryTilesProps> = ({
  activeCategory,
  onSelect,
}) => {
  return (
    <div className="dv-category-tiles">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          className={`dv-category-tile ${
            activeCategory === cat.slug ? "dv-category-tile--active" : ""
          }`}
          onClick={() =>
            onSelect(activeCategory === cat.slug ? null : cat.slug)
          }
        >
          <span className="dv-category-tile__icon">{cat.icon}</span>
          <span className="dv-category-tile__label">{cat.label}</span>
        </button>
      ))}
    </div>
  );
};
