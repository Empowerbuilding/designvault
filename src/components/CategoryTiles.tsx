import React from "react";
import { Home, Mountain, Crown, TreePine, Ruler, Warehouse } from "lucide-react";
import type { CategoryTilesProps, FloorPlanCategory } from "../types";

interface CategoryConfig {
  slug: FloorPlanCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryConfig[] = [
  {
    slug: "barndominium",
    label: "Modern Barndo",
    description: "Steel-frame living",
    icon: <Home size={24} />,
  },
  {
    slug: "ranch",
    label: "Rustic Ranch",
    description: "Single-story comfort",
    icon: <Mountain size={24} />,
  },
  {
    slug: "estate",
    label: "Luxury Estate",
    description: "Premium design",
    icon: <Crown size={24} />,
  },
  {
    slug: "cabin",
    label: "Hill Country",
    description: "Texas charm",
    icon: <TreePine size={24} />,
  },
  {
    slug: "starter",
    label: "Compact / Starter",
    description: "Smart & efficient",
    icon: <Ruler size={24} />,
  },
  {
    slug: "shop_house",
    label: "Shop + Living",
    description: "Work & live",
    icon: <Warehouse size={24} />,
  },
];

export const CategoryTiles: React.FC<CategoryTilesProps> = ({
  activeCategory,
  onSelect,
}) => {
  return (
    <div className="dv-category-tiles">
      <div className="dv-category-tiles__scroll">
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
            <span className="dv-category-tile__name">{cat.label}</span>
            <span className="dv-category-tile__desc">{cat.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
