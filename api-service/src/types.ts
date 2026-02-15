export interface FloorPlan {
  id: string;
  title: string;
  description: string | null;
  beds: number;
  baths: number;
  area: number;
  image_url: string;
  features: string[];
  display_order: number;
  vote_count: number;
  style: string | null;
  category: string | null;
  price_tier: string | null;
  is_featured: boolean;
  is_new: boolean;
  floor_plan_url: string | null;
  interior_urls: string[];
  tags: string[];
  click_count: number;
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
  webhookApiKey?: string;
  brandColor: string;
}

export interface LeadPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: "floor_plan_archive";
  anonymous_id: string;
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
