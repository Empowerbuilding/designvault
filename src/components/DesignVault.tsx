import React from "react";
import type { DesignVaultProps } from "../types";

export const DesignVault: React.FC<DesignVaultProps> = ({ config, className }) => {
  return (
    <div className={`dv-root ${className ?? ""}`}>
      <p>DesignVault: {config.builderSlug}</p>
    </div>
  );
};
