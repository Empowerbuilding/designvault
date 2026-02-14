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
    is_new: boolean;
    vote_count: number;
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
    onPlanSelect: (plan: FloorPlan) => void;
}
interface PlanCardProps {
    plan: FloorPlan;
    onSelect: (plan: FloorPlan) => void;
    onFavorite?: (planId: string) => void;
    isFavorite?: boolean;
}
interface PlanDetailProps {
    plan: FloorPlan;
    isOpen: boolean;
    onClose: () => void;
    config: DesignVaultConfig;
    allPlans?: FloorPlan[];
    onPlanSwitch?: (plan: FloorPlan) => void;
}
interface AIToolsPanelProps {
    plan: FloorPlan;
    config: DesignVaultConfig;
    onResult: (result: {
        newUrl: string;
        originalUrl: string;
        type: "style_swap" | "floor_plan_edit";
    }) => void;
    onProcessingChange: (isProcessing: boolean) => void;
}
interface LeadCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: () => void;
    isSubmitting?: boolean;
    plan: FloorPlan;
    modifications: Modification[];
    config: DesignVaultConfig;
}
interface CategoryTilesProps {
    activeCategory: FloorPlanCategory | null;
    onSelect: (category: FloorPlanCategory | null) => void;
}
interface FilterBarProps {
    filters: PlanFilters;
    setFilters: (filters: PlanFilters) => void;
    clearFilters: () => void;
    uniqueBedrooms: number[];
    uniqueBathrooms: number[];
    areaRange: {
        min: number;
        max: number;
    };
    uniqueStyles: FloorPlanStyle[];
    totalCount: number;
    filteredCount: number;
}
interface FeaturedRowProps {
    title: string;
    plans: FloorPlan[];
    onPlanSelect: (plan: FloorPlan) => void;
    onFavorite: (planId: string) => void;
    isFavorite: (planId: string) => boolean;
}
interface StyleSwapButtonsProps {
    planId: string;
    currentStyle: string | null;
    onSwap: (presetId: string) => Promise<void>;
    isProcessing: boolean;
    activePreset: string | null;
}
interface FloorPlanEditorProps {
    planId: string;
    currentFloorPlanUrl: string | null;
    onEdit: (prompt: string) => Promise<void>;
    onEnhance: (prompt: string) => Promise<string | null>;
    isProcessing: boolean;
}
interface SimilarPlansProps {
    currentPlan: FloorPlan;
    allPlans: FloorPlan[];
    onPlanSelect: (plan: FloorPlan) => void;
}
interface FavoriteButtonProps {
    planId: string;
    isFavorite: boolean;
    onToggle: (planId: string) => void;
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
    /** Build a cache key from plan + action */
    static key(planId: string, actionType: string, params: string): string;
    /** Returns cached URL if present and less than TTL old, else null */
    get(key: string): string | null;
    /** Store an AI result URL */
    set(key: string, url: string): void;
    /** Remove a specific entry */
    invalidate(key: string): void;
    /** Clear all entries */
    clear(): void;
    /** Number of entries currently stored */
    get size(): number;
}

type FbqMethod = "track" | "trackCustom" | "init";
interface Fbq {
    (method: FbqMethod, event: string, params?: Record<string, unknown>): void;
}
declare global {
    interface Window {
        fbq?: Fbq;
        dataLayer?: Record<string, unknown>[];
    }
}
declare function trackPageView(pixelId: string, anonymousId?: string, trackingEndpoint?: string): void;
declare function trackPlanView(pixelId: string, plan: FloorPlan): void;
declare function trackAIInteraction(pixelId: string, type: "style_swap" | "floor_plan_edit", planId: string): void;
declare function trackLeadCapture(pixelId: string, plan: FloorPlan, value?: number): void;
/** @deprecated Use trackPageView/trackLeadCapture/trackAIInteraction instead */
declare function fireMetaPixelEvent(pixelId: string, eventName: string, params?: Record<string, unknown>): void;
declare function generateAnonymousId(): string;
declare function getSessionDuration(startTime: number): number;
declare function trackEvent(endpoint: string, eventData: Record<string, unknown>): void;
interface LatencyEntry {
    type: "style_swap" | "floor_plan_edit" | "enhance_prompt";
    durationMs: number;
    timestamp: string;
}
declare function trackAILatency(type: LatencyEntry["type"], startTime: number, endTime: number): void;
/** Returns the collected latency entries (for debugging / analytics) */
declare function getLatencyLog(): readonly LatencyEntry[];

export { type AIInteractionResult, AIToolsPanel, type AIToolsPanelProps, ArchiveGrid, type ArchiveGridProps, CategoryTiles, type CategoryTilesProps, ClientCache, DEFAULT_STYLE_PRESETS, type DesignSession, DesignVault, DesignVaultAPI, type DesignVaultConfig, DesignVaultContext, type DesignVaultContextValue, type DesignVaultProps, DesignVaultProvider, type DesignVaultProviderProps, FavoriteButton, type FavoriteButtonProps, FeaturedRow, type FeaturedRowProps, FilterBar, type FilterBarProps, type FloorPlan, type FloorPlanCategory, FloorPlanEditor, type FloorPlanEditorProps, type FloorPlanStyle, type LeadCaptureData, LeadCaptureModal, type LeadCaptureModalProps, type Modification, PlanCard, type PlanCardProps, PlanDetail, type PlanDetailProps, type PlanFilters, type PriceTier, SimilarPlans, type SimilarPlansProps, type StylePreset, StyleSwapButtons, type StyleSwapButtonsProps, DesignVault as default, fireMetaPixelEvent, generateAnonymousId, getLatencyLog, getSessionDuration, trackAIInteraction, trackAILatency, trackEvent, trackLeadCapture, trackPageView, trackPlanView, useAIInteractions, useDesignVaultContext, useFavorites, useLeadCapture, usePlans, useSession };
