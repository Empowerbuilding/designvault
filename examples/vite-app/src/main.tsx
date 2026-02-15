import React from "react";
import ReactDOM from "react-dom/client";
import { DesignVault } from "designvault";
import type { DesignVaultConfig } from "designvault";
import "designvault/styles.css";

const config: DesignVaultConfig = {
  builderSlug: "barnhaus",
  brandColor: "#B8860B",
  apiBaseUrl: "https://3d.barnhaussteelbuilders.com",
  metaPixelId: "",
  ctaText: "Save My Design",
  enableStyleSwap: true,
  enableFloorPlanEdit: true,
  enableFavorites: true,
  enableSimilarPlans: true,
  maxFreeInteractions: 1,
  schedulerUrl: "https://crm.empowerbuilding.ai/book/30-minute-consultation",
  attribution: {
    show: true,
    text: "Empower Building",
    url: "https://empowerbuilding.ai",
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DesignVault config={config} />
  </React.StrictMode>
);
