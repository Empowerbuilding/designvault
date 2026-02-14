import * as React from 'react';
import React__default from 'react';

type FloorPlanStyle = "modern" | "traditional" | "rustic" | "contemporary" | "farmhouse" | "hill_country";
type FloorPlanCategory = "barndominium" | "ranch" | "estate" | "cabin" | "shop_house" | "starter";
type PriceTier = "economy" | "standard" | "luxury";
interface FloorPlan {
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
    click_count: number;
    display_order: number;
    created_at: string;
}
interface PlanFilters {
    bedrooms: number | null;
    bathrooms: number | null;
    minArea: number | null;
    maxArea: number | null;
    style: FloorPlanStyle | null;
    category: FloorPlanCategory | null;
}
interface DesignSession {
    id: string;
    anonymousId: string;
    planId: string;
    builderSlug: string;
    modifications: Modification[];
    stylePref: string | null;
    capturedAt: string | null;
    contactId: string | null;
}
interface Modification {
    type: "style_swap" | "floor_plan_edit";
    prompt: string | null;
    stylePreset: string | null;
    resultUrl: string;
    originalUrl: string;
    timestamp: string;
}
interface LeadCaptureData {
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
interface StylePreset {
    id: string;
    label: string;
    description: string;
}
declare const DEFAULT_STYLE_PRESETS: StylePreset[];
interface AIInteractionResult {
    success: boolean;
    resultUrl: string | null;
    cached: boolean;
    error: string | null;
    remainingFree: number;
}
interface DesignVaultConfig {
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
interface DesignVaultProps {
    config: DesignVaultConfig;
    className?: string;
}
interface ArchiveGridProps {
    plans: FloorPlan[];
    loading?: boolean;
    onPlanSelect: (plan: FloorPlan) => void;
}
interface PlanCardProps {
    plan: FloorPlan;
    onSelect: (plan: FloorPlan) => void;
}
interface PlanDetailProps {
    plan: FloorPlan;
    onClose: () => void;
}
interface AIToolsPanelProps {
    plan: FloorPlan;
}
interface LeadCaptureModalProps {
    open: boolean;
    onClose: () => void;
    planId?: string;
    planTitle?: string;
}
interface CategoryTilesProps {
    categories: {
        slug: string;
        label: string;
        count: number;
    }[];
    activeCategory: string | null;
    onSelect: (category: string | null) => void;
}
interface FilterBarProps {
    filters: PlanFilters;
    onChange: (filters: PlanFilters) => void;
}
interface FeaturedRowProps {
    plans: FloorPlan[];
    onPlanSelect: (plan: FloorPlan) => void;
}
interface StyleSwapButtonsProps {
    planId: string;
    imageUrl: string;
    onSwap: (preset: StylePreset) => void;
}
interface FloorPlanEditorProps {
    planId: string;
    imageUrl: string;
}
interface SimilarPlansProps {
    currentPlan: FloorPlan;
    plans: FloorPlan[];
    onPlanSelect: (plan: FloorPlan) => void;
}
interface FavoriteButtonProps {
    planId: string;
    size?: "sm" | "md" | "lg";
}

declare const DesignVault: React__default.FC<DesignVaultProps>;

declare const ArchiveGrid: React__default.FC<ArchiveGridProps>;

declare const PlanCard: React__default.FC<PlanCardProps>;

declare const PlanDetail: React__default.FC<PlanDetailProps>;

declare const AIToolsPanel: React__default.FC<AIToolsPanelProps>;

declare const LeadCaptureModal: React__default.FC<LeadCaptureModalProps>;

declare const CategoryTiles: React__default.FC<CategoryTilesProps>;

declare const FilterBar: React__default.FC<FilterBarProps>;

declare const FeaturedRow: React__default.FC<FeaturedRowProps>;

declare const StyleSwapButtons: React__default.FC<StyleSwapButtonsProps>;

declare const FloorPlanEditor: React__default.FC<FloorPlanEditorProps>;

declare const SimilarPlans: React__default.FC<SimilarPlansProps>;

declare const FavoriteButton: React__default.FC<FavoriteButtonProps>;

declare class DesignVaultAPI {
    private baseUrl;
    constructor(apiBaseUrl: string);
    getPlans(filters?: PlanFilters): Promise<FloorPlan[]>;
    getPlan(id: string): Promise<FloorPlan>;
    trackClick(planId: string): Promise<void>;
    styleSwap(planId: string, preset: string, sessionId: string): Promise<AIInteractionResult>;
    floorPlanEdit(planId: string, prompt: string, sessionId: string, currentUrl?: string): Promise<AIInteractionResult>;
    enhancePrompt(prompt: string, imageUrl: string): Promise<{
        enhancedPrompt: string;
    }>;
    saveDesign(data: LeadCaptureData, sessionId: string, builderSlug: string): Promise<{
        success: boolean;
    }>;
    createSession(planId: string, builderSlug: string, anonymousId: string): Promise<{
        sessionId: string;
    }>;
    private get;
    private post;
}

interface DesignVaultContextValue {
    config: DesignVaultConfig;
    api: DesignVaultAPI;
    anonymousId: string;
    sessionStartTime: number;
    isCaptured: boolean;
    setCaptured: (captured: boolean) => void;
    sessionId: string | null;
    setSessionId: (id: string | null) => void;
    modifications: Modification[];
    addModification: (mod: Modification) => void;
    plansViewed: string[];
    addPlanViewed: (planId: string) => void;
    currentPlan: FloorPlan | null;
    setCurrentPlan: (plan: FloorPlan | null) => void;
    stylePref: string | null;
    setStylePref: (pref: string | null) => void;
}
declare const DesignVaultContext: React__default.Context<DesignVaultContextValue | null>;
declare function useDesignVaultContext(): DesignVaultContextValue;
interface DesignVaultProviderProps {
    config: DesignVaultConfig;
    children: React__default.ReactNode;
}
declare function DesignVaultProvider({ config, children, }: DesignVaultProviderProps): React__default.FunctionComponentElement<React__default.ProviderProps<DesignVaultContextValue | null>>;

declare function usePlans(initialFilters?: PlanFilters): {
    plans: FloorPlan[];
    filteredPlans: FloorPlan[];
    featuredPlans: FloorPlan[];
    recentPlans: FloorPlan[];
    loading: boolean;
    error: string | null;
    filters: PlanFilters;
    setFilters: React.Dispatch<React.SetStateAction<PlanFilters>>;
    clearFilters: () => void;
    uniqueBedrooms: number[];
    uniqueBathrooms: number[];
    areaRange: {
        min: number;
        max: number;
    };
    uniqueStyles: FloorPlanStyle[];
    uniqueCategories: FloorPlanCategory[];
};

declare function useAIInteractions(): {
    handleStyleSwap: (planId: string, preset: string) => Promise<AIInteractionResult | null>;
    handleFloorPlanEdit: (planId: string, prompt: string, currentUrl?: string) => Promise<AIInteractionResult | null>;
    handleEnhancePrompt: (prompt: string, imageUrl: string) => Promise<string | null>;
    isProcessing: boolean;
    lastResult: AIInteractionResult | null;
    needsCapture: boolean;
    interactionCount: number;
    error: string | null;
};

declare function useSession(): {
    session: DesignSession | null;
    addModification: (mod: Modification) => void;
    setCurrentPlan: (plan: FloorPlan) => Promise<void>;
    plansViewed: string[];
    getSessionDuration: () => number;
};

declare function useLeadCapture(): {
    isOpen: boolean;
    openCapture: () => void;
    closeCapture: () => void;
    submitCapture: (formData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }) => Promise<void>;
    isSubmitting: boolean;
    submitted: boolean;
    error: string | null;
};

declare function useFavorites(): {
    favorites: string[];
    toggleFavorite: (planId: string) => void;
    isFavorite: (planId: string) => boolean;
    favoritesCount: number;
};

declare class ClientCache {
    private store;
    private ttl;
    constructor(ttlMs?: number);
    get<T>(key: string): T | null;
    set<T>(key: string, data: T): void;
    invalidate(key: string): void;
    clear(): void;
}

declare function trackPageView(_builderSlug: string, _anonymousId: string, _trackingEndpoint?: string): void;
declare function trackEvent(_event: string, _properties: Record<string, unknown>, _trackingEndpoint?: string): void;
declare function fireMetaPixelEvent(_pixelId: string, _eventName: string, _params?: Record<string, unknown>): void;

export { type AIInteractionResult, AIToolsPanel, type AIToolsPanelProps, ArchiveGrid, type ArchiveGridProps, CategoryTiles, type CategoryTilesProps, ClientCache, DEFAULT_STYLE_PRESETS, type DesignSession, DesignVault, DesignVaultAPI, type DesignVaultConfig, DesignVaultContext, type DesignVaultContextValue, type DesignVaultProps, DesignVaultProvider, type DesignVaultProviderProps, FavoriteButton, type FavoriteButtonProps, FeaturedRow, type FeaturedRowProps, FilterBar, type FilterBarProps, type FloorPlan, type FloorPlanCategory, FloorPlanEditor, type FloorPlanEditorProps, type FloorPlanStyle, type LeadCaptureData, LeadCaptureModal, type LeadCaptureModalProps, type Modification, PlanCard, type PlanCardProps, PlanDetail, type PlanDetailProps, type PlanFilters, type PriceTier, SimilarPlans, type SimilarPlansProps, type StylePreset, StyleSwapButtons, type StyleSwapButtonsProps, fireMetaPixelEvent, trackEvent, trackPageView, useAIInteractions, useDesignVaultContext, useFavorites, useLeadCapture, usePlans, useSession };
