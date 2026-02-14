// ── Default Export ───────────────────────────────────────────
export { DesignVault as default } from "./components/DesignVault";

// ── Components ──────────────────────────────────────────────
export { DesignVault } from "./components/DesignVault";
export { ArchiveGrid } from "./components/ArchiveGrid";
export { PlanCard } from "./components/PlanCard";
export { PlanDetail } from "./components/PlanDetail";
export { AIToolsPanel } from "./components/AIToolsPanel";
export { LeadCaptureModal } from "./components/LeadCaptureModal";
export { CategoryTiles } from "./components/CategoryTiles";
export { FilterBar } from "./components/FilterBar";
export { FeaturedRow } from "./components/FeaturedRow";
export { StyleSwapButtons } from "./components/StyleSwapButtons";
export { FloorPlanEditor } from "./components/FloorPlanEditor";
export { SimilarPlans } from "./components/SimilarPlans";
export { FavoriteButton } from "./components/FavoriteButton";

// ── Hooks ───────────────────────────────────────────────────
export {
  DesignVaultProvider,
  useDesignVaultContext,
  DesignVaultContext,
} from "./hooks/useDesignVault";
export { usePlans } from "./hooks/usePlans";
export { useAIInteractions } from "./hooks/useAIInteractions";
export { useSession } from "./hooks/useSession";
export { useLeadCapture } from "./hooks/useLeadCapture";
export { useFavorites } from "./hooks/useFavorites";

// ── API Client ──────────────────────────────────────────────
export { DesignVaultAPI } from "./api/client";

// ── Types ───────────────────────────────────────────────────
export type {
  FloorPlan,
  FloorPlanStyle,
  FloorPlanCategory,
  PriceTier,
  PlanFilters,
  DesignSession,
  Modification,
  LeadCaptureData,
  StylePreset,
  AIInteractionResult,
  DesignVaultConfig,
  DesignVaultProps,
  ArchiveGridProps,
  PlanCardProps,
  PlanDetailProps,
  AIToolsPanelProps,
  LeadCaptureModalProps,
  CategoryTilesProps,
  FilterBarProps,
  FeaturedRowProps,
  StyleSwapButtonsProps,
  FloorPlanEditorProps,
  SimilarPlansProps,
  FavoriteButtonProps,
} from "./types";

export type {
  DesignVaultContextValue,
  DesignVaultProviderProps,
} from "./hooks/useDesignVault";

export { DEFAULT_STYLE_PRESETS } from "./types";

// ── Utilities ───────────────────────────────────────────────
export { ClientCache } from "./utils/cache";
export {
  trackPageView,
  trackPlanView,
  trackAIInteraction,
  trackLeadCapture,
  trackEvent,
  fireMetaPixelEvent,
  generateAnonymousId,
  getSessionDuration,
  trackAILatency,
  getLatencyLog,
} from "./utils/tracking";
