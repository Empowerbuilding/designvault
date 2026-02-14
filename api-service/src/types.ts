export interface FloorPlan {
  id: string;
  builder_slug: string;
  title: string;
  slug: string;
  style: string | null;
  category: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  stories: number | null;
  garages: number | null;
  description: string | null;
  features: string[];
  tags: string[];
  price_tier: string | null;
  image_url: string;
  floor_plan_url: string | null;
  interior_urls: string[];
  click_count: number;
  is_featured: boolean;
  is_new: boolean;
  display_order: number;
  created_at: string;
}

export interface DesignSession {
  id: string;
  builder_slug: string;
  anonymous_id: string;
  plan_id: string;
  interaction_count: number;
  is_captured: boolean;
  contact_id: string | null;
  captured_at: string | null;
  modifications: SessionModification[];
  created_at: string;
}

export interface SessionModification {
  type: "style_swap" | "floor_plan_edit";
  preset?: string;
  prompt?: string;
  result_url?: string;
  timestamp: string;
}

export interface DesignCacheEntry {
  id: string;
  plan_id: string;
  cache_key: string;
  result_url: string;
  created_at: string;
}

export interface BuilderConfig {
  name: string;
  webhookUrl: string | null;
  brandColor: string;
}

export interface LeadPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: "floor_plan_archive";
  metadata: {
    planId: string;
    planTitle: string;
    planSpecs: string;
    modifications: SessionModification[];
    favorites: string[];
    stylePref: string | null;
    sessionDuration: number;
    plansViewed: string[];
  };
}
