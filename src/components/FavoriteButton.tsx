import React from "react";
import { Heart } from "lucide-react";
import type { FavoriteButtonProps } from "../types";

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  planId,
  isFavorite,
  onToggle,
  size = "md",
}) => {
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  return (
    <button
      className={`dv-favorite-btn dv-favorite-btn--${size} ${
        isFavorite ? "dv-favorite-btn--active" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(planId);
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={iconSize} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
};
