import React from "react";
import type { FavoriteButtonProps } from "../types";

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  planId: _planId,
  size = "md",
}) => {
  return (
    <button className={`dv-favorite-btn dv-favorite-btn--${size}`}>
      <span className="dv-favorite-btn__icon" />
    </button>
  );
};
