// ── Floor Plan (matches Supabase website_floor_plans) ────────

export type FloorPlanStyle =
  | "modern"
  | "traditional"
  | "rustic"
  | "contemporary"
  | "farmhouse"
  | "hill_country";

export type FloorPlanCategory =
  | "barndominium"
  | "ranch"
  | "estate"
  | "cabin"
  | "shop_house"
  | "starter";

export type PriceTier = "economy" | "standard" | "luxury";

export interface FloorPlan {
  id: string;
  title: string;
  description: string | null;
  beds: number;
  baths: number;
  area: number;
  image_url: string;
  floor_plan_url: string | null;
  interior_urls: string[] | null;
  features: string[];
  style: FloorPlanStyle | null;
  category: FloorPlanCategory | null;
  price_tier: PriceTier | null;
  tags: string[] | null;
  featured: boolean;
  is_new: boolean;
  vote_count: number;
  click_count: number;
  display_order: number;
  created_at: string;
}

// ── Filters ──────────────────────────────────────────────────

export interface PlanFilters {
  bedrooms: number | null;
  bathrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  style: FloorPlanStyle | null;
  category: FloorPlanCategory | null;
}

// ── Session ──────────────────────────────────────────────────

export interface DesignSession {
  id: string;
  anonymousId: string;
  planId: string;
  builderSlug: string;
  modifications: Modification[];
  stylePref: string | null;
  capturedAt: string | null;
  contactId: string | null;
}

// ── Modification ─────────────────────────────────────────────

export interface Modification {
  type: "style_swap" | "floor_plan_edit" | "wishlist_item";
  prompt: string | null;
  stylePreset: string | null;
  resultUrl: string;
  originalUrl: string;
  timestamp: string;
}

// ── Lead Capture ─────────────────────────────────────────────

export interface LeadCaptureData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  planId: string;
  planTitle: string;
  planSpecs: {
    beds: number;
    baths: number;
    area: number;
  };
  modifications: Modification[];
  favorites: string[];
  stylePref: string | null;
  sessionDuration: number;
  plansViewed: number;
}

// ── Style Presets ────────────────────────────────────────────

export interface StylePreset {
  id: string;
  label: string;
  description: string;
}

export const DEFAULT_STYLE_PRESETS: StylePreset[] = [
  { id: "modern", label: "Modern", description: "Clean lines, large windows, flat roofs" },
  { id: "rustic", label: "Rustic", description: "Natural materials, wood beams, stone accents" },
  { id: "hill_country", label: "Hill Country", description: "Texas limestone, metal roofing, wide porches" },
  { id: "traditional", label: "Traditional", description: "Classic proportions, symmetrical facades" },
  { id: "farmhouse", label: "Farmhouse", description: "Board-and-batten siding, wraparound porches" },
  { id: "contemporary", label: "Contemporary", description: "Mixed materials, asymmetric design, open plans" },
];

// ── AI Interaction ───────────────────────────────────────────

export interface AIInteractionResult {
  success: boolean;
  resultUrl: string | null;
  cached: boolean;
  error: string | null;
  remainingFree: number;
}

// ── Config ───────────────────────────────────────────────────

export interface DesignVaultConfig {
  builderSlug: string;
  brandColor: string;
  brandColorLight?: string;
  ctaText?: string;
  apiBaseUrl: string;
  crmWebhookUrl?: string;
  metaPixelId?: string;
  trackingEndpoint?: string;
  maxFreeInteractions?: number;
  enableFloorPlanEdit?: boolean;
  enableStyleSwap?: boolean;
  enableFavorites?: boolean;
  enableSimilarPlans?: boolean;
  attribution?: {
    show: boolean;
    text: string;
    url: string;
  };
}

// ── Component Props ──────────────────────────────────────────

export interface DesignVaultProps {
  config: DesignVaultConfig;
  className?: string;
}

export interface ArchiveGridProps {
  onPlanSelect: (plan: FloorPlan) => void;
}

export interface PlanCardProps {
  plan: FloorPlan;
  onSelect: (plan: FloorPlan) => void;
  onFavorite?: (planId: string) => void;
  isFavorite?: boolean;
}

export interface PlanDetailProps {
  plan: FloorPlan;
  isOpen: boolean;
  onClose: () => void;
  config: DesignVaultConfig;
  allPlans?: FloorPlan[];
  onPlanSwitch?: (plan: FloorPlan) => void;
}

export interface AIToolsPanelProps {
  plan: FloorPlan;
  config: DesignVaultConfig;
  heroUrl: string;
  originalHeroUrl: string;
  floorPlanUrl: string;
  originalFloorPlanUrl: string;
  hasFloorPlanResult: boolean;
  showOriginalFloorPlan: boolean;
  onToggleFloorPlanOriginal: (show: boolean) => void;
  onResult: (result: {
    newUrl: string;
    originalUrl: string;
    type: "style_swap" | "floor_plan_edit";
  }) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

export interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  plan: FloorPlan;
  modifications: Modification[];
  config: DesignVaultConfig;
}

export interface CategoryTilesProps {
  activeCategory: FloorPlanCategory | null;
  onSelect: (category: FloorPlanCategory | null) => void;
}

export interface FilterBarProps {
  filters: PlanFilters;
  setFilters: (filters: PlanFilters) => void;
  clearFilters: () => void;
  uniqueBedrooms: number[];
  uniqueBathrooms: number[];
  areaRange: { min: number; max: number };
  uniqueStyles: FloorPlanStyle[];
  totalCount: number;
  filteredCount: number;
}

export interface FeaturedRowProps {
  title: string;
  plans: FloorPlan[];
  onPlanSelect: (plan: FloorPlan) => void;
  onFavorite: (planId: string) => void;
  isFavorite: (planId: string) => boolean;
}

export interface StyleSwapButtonsProps {
  planId: string;
  currentStyle: string | null;
  onSwap: (presetId: string) => Promise<void>;
  isProcessing: boolean;
  activePreset: string | null;
}

export interface FloorPlanEditorProps {
  planId: string;
  floorPlanUrl: string;
  originalFloorPlanUrl: string;
  hasFloorPlanResult: boolean;
  showOriginalFloorPlan: boolean;
  onToggleFloorPlanOriginal: (show: boolean) => void;
  wishlistItems: string[];
  onWishlistAdd: (text: string) => void;
  onWishlistRemove: (index: number) => void;
  onPreviewAI: () => Promise<void>;
  isProcessing: boolean;
}

export interface SimilarPlansProps {
  currentPlan: FloorPlan;
  allPlans: FloorPlan[];
  onPlanSelect: (plan: FloorPlan) => void;
}

export interface FavoriteButtonProps {
  planId: string;
  isFavorite: boolean;
  onToggle: (planId: string) => void;
  size?: "sm" | "md" | "lg";
}
