import React, { createContext, useContext, useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Filter, X, Heart, Star, Home, Bath, Square, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Layers, Loader2, Search, Plus, Check, Wand2, CheckCircle, Save, Unlock, Lock, CalendarCheck, Mountain, Crown, Minimize2, Warehouse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

// src/api/client.ts
var CaptureRequiredError = class extends Error {
  constructor() {
    super("Lead capture required");
    this.name = "CaptureRequiredError";
  }
};
var DesignVaultAPI = class {
  constructor(apiBaseUrl) {
    this.baseUrl = apiBaseUrl.replace(/\/$/, "");
  }
  // ── Plans ────────────────────────────────────────────────────
  async getPlans(filters) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.bedrooms !== null && filters.bedrooms !== void 0) {
        params.set("bedrooms", String(filters.bedrooms));
      }
      if (filters.bathrooms !== null && filters.bathrooms !== void 0) {
        params.set("bathrooms", String(filters.bathrooms));
      }
      if (filters.minArea !== null && filters.minArea !== void 0) {
        params.set("minArea", String(filters.minArea));
      }
      if (filters.maxArea !== null && filters.maxArea !== void 0) {
        params.set("maxArea", String(filters.maxArea));
      }
      if (filters.style !== null && filters.style !== void 0) {
        params.set("style", filters.style);
      }
      if (filters.category !== null && filters.category !== void 0) {
        params.set("category", filters.category);
      }
    }
    const query = params.toString();
    const url = `${this.baseUrl}/api/plans${query ? `?${query}` : ""}`;
    return this.get(url);
  }
  async getPlan(id) {
    return this.get(`${this.baseUrl}/api/plans/${id}`);
  }
  // ── Tracking ─────────────────────────────────────────────────
  async trackClick(planId) {
    await this.post(`${this.baseUrl}/api/plans/${planId}/click`, {});
  }
  // ── AI ───────────────────────────────────────────────────────
  async styleSwap(planId, preset, sessionId, imageType, imageUrl) {
    return this.post(
      `${this.baseUrl}/api/style-swap`,
      { planId, preset, sessionId, imageType, imageUrl }
    );
  }
  async floorPlanEdit(planId, prompt, sessionId, currentUrl) {
    return this.post(
      `${this.baseUrl}/api/floor-plan-edit`,
      { planId, prompt, sessionId, currentUrl }
    );
  }
  async enhancePrompt(prompt, imageUrl) {
    return this.post(
      `${this.baseUrl}/api/enhance-prompt`,
      { prompt, imageUrl }
    );
  }
  // ── Lead Capture ─────────────────────────────────────────────
  async saveDesign(data, sessionId, builderSlug) {
    return this.post(
      `${this.baseUrl}/api/save-design`,
      { leadData: data, sessionId, builderSlug }
    );
  }
  // ── Sessions ─────────────────────────────────────────────────
  async createSession(planId, builderSlug, anonymousId) {
    return this.post(
      `${this.baseUrl}/api/sessions`,
      { planId, builderSlug, anonymousId }
    );
  }
  // ── Internal helpers ─────────────────────────────────────────
  friendlyError(status) {
    if (status === 429) return "Too many requests \u2014 please wait a moment and try again.";
    if (status === 403) return "Save your design to unlock more AI tools.";
    if (status === 404) return "This design could not be found. Please try another.";
    if (status >= 500) return "Our servers are busy \u2014 please try again in a few seconds.";
    return "Something went wrong. Please try again.";
  }
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(this.friendlyError(res.status));
      return await res.json();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect. Please check your internet and try again.");
    }
  }
  async post(url, body) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        if (res.status === 403) {
          try {
            const data = await res.json();
            if (data?.needsCapture) throw new CaptureRequiredError();
          } catch (e) {
            if (e instanceof CaptureRequiredError) throw e;
          }
        }
        throw new Error(this.friendlyError(res.status));
      }
      const text = await res.text();
      if (!text) return void 0;
      return JSON.parse(text);
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect. Please check your internet and try again.");
    }
  }
};

// src/hooks/useDesignVault.ts
var ANON_ID_KEY = "dv-anonymous-id";
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
var CRM_VISITOR_KEY = "_crm_visitor_id";
var CAPTURED_KEY = "dv-captured";
function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return generateId();
  try {
    const crmId = localStorage.getItem(CRM_VISITOR_KEY);
    if (crmId) {
      localStorage.setItem(ANON_ID_KEY, crmId);
      return crmId;
    }
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return generateId();
  }
}
var DesignVaultContext = createContext(null);
function useDesignVaultContext() {
  const ctx = useContext(DesignVaultContext);
  if (!ctx) {
    throw new Error(
      "useDesignVaultContext must be used within a DesignVaultProvider"
    );
  }
  return ctx;
}
function DesignVaultProvider({
  config,
  children
}) {
  const api = useMemo(
    () => new DesignVaultAPI(config.apiBaseUrl),
    [config.apiBaseUrl]
  );
  const [anonymousId] = useState(getOrCreateAnonymousId);
  const sessionStartRef = useRef(Date.now());
  const [isCaptured, setIsCaptured] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(CAPTURED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const setCaptured = useCallback((captured) => {
    setIsCaptured(captured);
    try {
      if (captured) localStorage.setItem(CAPTURED_KEY, "1");
    } catch {
    }
  }, []);
  const [sessionId, setSessionId] = useState(null);
  const [initialInteractionCount, setInitialInteractionCount] = useState(0);
  const [modifications, setModifications] = useState([]);
  const [plansViewed, setPlansViewed] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [stylePref, setStylePref] = useState(null);
  const addModification = useCallback((mod) => {
    setModifications((prev) => [...prev, mod]);
  }, []);
  const addPlanViewed = useCallback((planId) => {
    setPlansViewed(
      (prev) => prev.includes(planId) ? prev : [...prev, planId]
    );
  }, []);
  const value = useMemo(
    () => ({
      config,
      api,
      anonymousId,
      sessionStartTime: sessionStartRef.current,
      isCaptured,
      setCaptured,
      sessionId,
      setSessionId,
      initialInteractionCount,
      setInitialInteractionCount,
      modifications,
      addModification,
      plansViewed,
      addPlanViewed,
      currentPlan,
      setCurrentPlan,
      stylePref,
      setStylePref
    }),
    [
      config,
      api,
      anonymousId,
      isCaptured,
      sessionId,
      initialInteractionCount,
      modifications,
      plansViewed,
      currentPlan,
      stylePref,
      addModification,
      addPlanViewed
    ]
  );
  return React.createElement(
    DesignVaultContext.Provider,
    { value },
    children
  );
}
var EMPTY_FILTERS = {
  bedrooms: null,
  bathrooms: null,
  minArea: null,
  maxArea: null,
  style: null,
  category: null
};
function usePlans(initialFilters) {
  const { api } = useDesignVaultContext();
  const [plans, setPlans] = useState([]);
  const [filters, setFilters] = useState(
    initialFilters ?? EMPTY_FILTERS
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getPlans().then((data) => {
      if (!cancelled) {
        setPlans(data);
        setError(null);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (filters.bedrooms !== null && plan.beds !== filters.bedrooms)
        return false;
      if (filters.bathrooms !== null && plan.baths !== filters.bathrooms)
        return false;
      if (filters.minArea !== null && plan.area < filters.minArea)
        return false;
      if (filters.maxArea !== null && plan.area > filters.maxArea)
        return false;
      if (filters.style !== null && plan.style !== filters.style) return false;
      if (filters.category !== null) {
        if (filters.category === "ranch_living") {
          if (plan.category !== "barndominium" && plan.category !== "ranch" && plan.category !== "cabin")
            return false;
        } else if (plan.category !== filters.category) {
          return false;
        }
      }
      return true;
    });
  }, [plans, filters]);
  const featuredPlans = useMemo(() => {
    return plans.filter((p) => p.featured).sort((a, b) => b.click_count - a.click_count).slice(0, 6);
  }, [plans]);
  const recentPlans = useMemo(() => {
    return [...plans].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 4);
  }, [plans]);
  const uniqueBedrooms = useMemo(
    () => [...new Set(plans.map((p) => p.beds))].sort((a, b) => a - b),
    [plans]
  );
  const uniqueBathrooms = useMemo(
    () => [...new Set(plans.map((p) => p.baths))].sort((a, b) => a - b),
    [plans]
  );
  const areaRange = useMemo(() => {
    if (plans.length === 0) return { min: 0, max: 0 };
    const areas = plans.map((p) => p.area);
    return { min: Math.min(...areas), max: Math.max(...areas) };
  }, [plans]);
  const uniqueStyles = useMemo(
    () => [
      ...new Set(plans.map((p) => p.style).filter(Boolean))
    ],
    [plans]
  );
  const uniqueCategories = useMemo(
    () => [
      ...new Set(plans.map((p) => p.category).filter(Boolean))
    ],
    [plans]
  );
  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  return {
    plans,
    filteredPlans,
    featuredPlans,
    recentPlans,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    uniqueBedrooms,
    uniqueBathrooms,
    areaRange,
    uniqueStyles,
    uniqueCategories
  };
}
var CATEGORIES = [
  { slug: "ranch_living", label: "Ranch Living", icon: /* @__PURE__ */ jsx(Mountain, { size: 22 }) },
  { slug: "estate", label: "Luxury Estate", icon: /* @__PURE__ */ jsx(Crown, { size: 22 }) },
  { slug: "starter", label: "Compact / Starter", icon: /* @__PURE__ */ jsx(Minimize2, { size: 22 }) },
  { slug: "shop_house", label: "Shop + Living", icon: /* @__PURE__ */ jsx(Warehouse, { size: 22 }) }
];
var CategoryTiles = ({
  activeCategory,
  onSelect
}) => {
  return /* @__PURE__ */ jsx("div", { className: "dv-category-tiles", children: CATEGORIES.map((cat) => /* @__PURE__ */ jsxs(
    "button",
    {
      className: `dv-category-tile ${activeCategory === cat.slug ? "dv-category-tile--active" : ""}`,
      onClick: () => onSelect(activeCategory === cat.slug ? null : cat.slug),
      children: [
        /* @__PURE__ */ jsx("span", { className: "dv-category-tile__icon", children: cat.icon }),
        /* @__PURE__ */ jsx("span", { className: "dv-category-tile__label", children: cat.label })
      ]
    },
    cat.slug
  )) });
};
var AREA_RANGES = [
  { label: "Under 1,000 sqft", min: 0, max: 999 },
  { label: "1,000 \u2013 1,500 sqft", min: 1e3, max: 1500 },
  { label: "1,500 \u2013 2,000 sqft", min: 1500, max: 2e3 },
  { label: "2,000 \u2013 2,500 sqft", min: 2e3, max: 2500 },
  { label: "2,500 \u2013 3,000 sqft", min: 2500, max: 3e3 },
  { label: "3,000+ sqft", min: 3e3, max: 99999 }
];
var STYLE_LABELS = {
  modern: "Modern",
  traditional: "Traditional",
  rustic: "Rustic",
  contemporary: "Contemporary",
  farmhouse: "Farmhouse",
  hill_country: "Hill Country"
};
function hasActiveFilters(filters) {
  return filters.bedrooms !== null || filters.bathrooms !== null || filters.minArea !== null || filters.maxArea !== null || filters.style !== null;
}
var FilterBar = ({
  filters,
  setFilters,
  clearFilters,
  uniqueBedrooms,
  uniqueBathrooms,
  uniqueStyles,
  totalCount,
  filteredCount
}) => {
  const active = hasActiveFilters(filters);
  return /* @__PURE__ */ jsxs("div", { className: "dv-filter-bar", children: [
    /* @__PURE__ */ jsx("div", { className: "dv-filter-bar__icon", children: /* @__PURE__ */ jsx(Filter, { size: 18 }) }),
    /* @__PURE__ */ jsxs("div", { className: "dv-filter-bar__selects", children: [
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "dv-filter-bar__select",
          value: filters.bedrooms ?? "",
          onChange: (e) => setFilters({
            ...filters,
            bedrooms: e.target.value ? Number(e.target.value) : null
          }),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Bedrooms" }),
            uniqueBedrooms.map((b) => /* @__PURE__ */ jsxs("option", { value: b, children: [
              b,
              " Bed",
              b !== 1 ? "s" : ""
            ] }, b))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "dv-filter-bar__select",
          value: filters.bathrooms ?? "",
          onChange: (e) => setFilters({
            ...filters,
            bathrooms: e.target.value ? Number(e.target.value) : null
          }),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Bathrooms" }),
            uniqueBathrooms.map((b) => /* @__PURE__ */ jsxs("option", { value: b, children: [
              b,
              " Bath",
              b !== 1 ? "s" : ""
            ] }, b))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "dv-filter-bar__select",
          value: filters.minArea !== null && filters.maxArea !== null ? `${filters.minArea}-${filters.maxArea}` : "",
          onChange: (e) => {
            if (!e.target.value) {
              setFilters({ ...filters, minArea: null, maxArea: null });
            } else {
              const [min, max] = e.target.value.split("-").map(Number);
              setFilters({ ...filters, minArea: min, maxArea: max });
            }
          },
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Sqft Range" }),
            AREA_RANGES.map((r) => /* @__PURE__ */ jsx("option", { value: `${r.min}-${r.max}`, children: r.label }, r.label))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "dv-filter-bar__select",
          value: filters.style ?? "",
          onChange: (e) => setFilters({
            ...filters,
            style: e.target.value || null
          }),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Style" }),
            uniqueStyles.map((s) => /* @__PURE__ */ jsx("option", { value: s, children: STYLE_LABELS[s] }, s))
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dv-filter-bar__meta", children: [
      /* @__PURE__ */ jsxs("span", { className: "dv-filter-bar__count", children: [
        "Showing ",
        filteredCount,
        " of ",
        totalCount,
        " plans"
      ] }),
      active && /* @__PURE__ */ jsxs("button", { className: "dv-filter-bar__clear", onClick: clearFilters, children: [
        /* @__PURE__ */ jsx(X, { size: 14 }),
        "Clear"
      ] })
    ] })
  ] });
};
var FavoriteButton = ({
  planId,
  isFavorite,
  onToggle,
  size = "md"
}) => {
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  return /* @__PURE__ */ jsx(
    "button",
    {
      className: `dv-favorite-btn dv-favorite-btn--${size} ${isFavorite ? "dv-favorite-btn--active" : ""}`,
      onClick: (e) => {
        e.stopPropagation();
        onToggle(planId);
      },
      "aria-label": isFavorite ? "Remove from favorites" : "Add to favorites",
      children: /* @__PURE__ */ jsx(Heart, { size: iconSize, fill: isFavorite ? "currentColor" : "none" })
    }
  );
};
var cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};
var PlanCard = ({
  plan,
  onSelect,
  onFavorite,
  isFavorite = false
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const isPopular = (plan.vote_count ?? 0) > 3;
  const isNew = plan.is_new === true;
  const allImages = [plan.image_url, ...plan.interior_urls ?? []];
  const hasMultipleImages = allImages.length > 1;
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      className: "dv-plan-card",
      variants: cardVariants,
      viewport: { once: true, margin: "-50px" },
      children: [
        /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__image", onClick: () => onSelect(plan), children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: allImages[imageIndex],
              alt: plan.title,
              className: "dv-plan-card__img",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "dv-plan-card__image-gradient" }),
          (isPopular || isNew) && /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__badges", children: [
            isPopular && /* @__PURE__ */ jsxs("span", { className: "dv-plan-card__badge dv-plan-card__badge--popular", children: [
              /* @__PURE__ */ jsx(Star, { size: 10 }),
              " POPULAR"
            ] }),
            isNew && /* @__PURE__ */ jsx("span", { className: "dv-plan-card__badge dv-plan-card__badge--new", children: "NEW" })
          ] }),
          onFavorite && /* @__PURE__ */ jsx("div", { className: "dv-plan-card__favorite", children: /* @__PURE__ */ jsx(
            FavoriteButton,
            {
              planId: plan.id,
              isFavorite,
              onToggle: onFavorite,
              size: "sm"
            }
          ) }),
          hasMultipleImages && /* @__PURE__ */ jsx("div", { className: "dv-plan-card__dots", children: allImages.map((_, i) => /* @__PURE__ */ jsx(
            "button",
            {
              className: `dv-plan-card__dot ${i === imageIndex ? "dv-plan-card__dot--active" : ""}`,
              onClick: (e) => {
                e.stopPropagation();
                setImageIndex(i);
              },
              "aria-label": `Image ${i + 1}`
            },
            i
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__content", children: [
          /* @__PURE__ */ jsx("h3", { className: "dv-plan-card__title", children: plan.title }),
          /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__specs", children: [
            /* @__PURE__ */ jsxs("span", { className: "dv-plan-card__spec", children: [
              /* @__PURE__ */ jsx(Home, { size: 14 }),
              plan.beds,
              " Bed",
              plan.beds !== 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "dv-plan-card__spec", children: [
              /* @__PURE__ */ jsx(Bath, { size: 14 }),
              plan.baths,
              " Bath",
              plan.baths !== 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "dv-plan-card__spec", children: [
              /* @__PURE__ */ jsx(Square, { size: 14 }),
              plan.area.toLocaleString(),
              " sqft"
            ] })
          ] }),
          plan.tags && plan.tags.length > 0 && /* @__PURE__ */ jsx("div", { className: "dv-plan-card__tags", children: plan.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsx("span", { className: "dv-plan-card__tag", children: tag }, tag)) }),
          /* @__PURE__ */ jsxs("button", { className: "dv-plan-card__cta", onClick: () => onSelect(plan), children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
            "Customize"
          ] })
        ] })
      ]
    }
  );
};
var FeaturedRow = ({
  title,
  plans,
  onPlanSelect,
  onFavorite,
  isFavorite
}) => {
  const scrollRef = useRef(null);
  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  };
  if (plans.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "dv-featured-row", children: [
    /* @__PURE__ */ jsxs("div", { className: "dv-featured-row__header", children: [
      /* @__PURE__ */ jsx("h2", { className: "dv-featured-row__title", children: title }),
      /* @__PURE__ */ jsxs("span", { className: "dv-featured-row__view-all", children: [
        "View all ",
        /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dv-featured-row__wrapper", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "dv-featured-row__arrow dv-featured-row__arrow--left",
          onClick: () => scroll("left"),
          "aria-label": "Scroll left",
          children: /* @__PURE__ */ jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "dv-featured-row__scroll", ref: scrollRef, children: plans.map((plan) => /* @__PURE__ */ jsx("div", { className: "dv-featured-row__item", children: /* @__PURE__ */ jsx(
        PlanCard,
        {
          plan,
          onSelect: onPlanSelect,
          onFavorite,
          isFavorite: isFavorite(plan.id)
        }
      ) }, plan.id)) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "dv-featured-row__arrow dv-featured-row__arrow--right",
          onClick: () => scroll("right"),
          "aria-label": "Scroll right",
          children: /* @__PURE__ */ jsx(ChevronRight, { size: 20 })
        }
      )
    ] })
  ] });
};
var STORAGE_KEY = "dv-favorites";
function readFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
function writeFavorites(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
  }
}
function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);
  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);
  const toggleFavorite = useCallback((planId) => {
    setFavorites(
      (prev) => prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId]
    );
  }, []);
  const isFavorite = useCallback(
    (planId) => favorites.includes(planId),
    [favorites]
  );
  return {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount: favorites.length
  };
}
function SkeletonCard() {
  return /* @__PURE__ */ jsxs("div", { className: "dv-plan-card dv-plan-card--skeleton", children: [
    /* @__PURE__ */ jsx("div", { className: "dv-plan-card__image dv-skeleton" }),
    /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__content", children: [
      /* @__PURE__ */ jsx("div", { className: "dv-skeleton dv-skeleton--text dv-skeleton--title" }),
      /* @__PURE__ */ jsx("div", { className: "dv-skeleton dv-skeleton--text dv-skeleton--specs" }),
      /* @__PURE__ */ jsx("div", { className: "dv-skeleton dv-skeleton--text dv-skeleton--tags" })
    ] })
  ] });
}
var hasAnyFilter = (filters) => filters.category !== null || filters.bedrooms !== null || filters.bathrooms !== null || filters.style !== null || filters.minArea !== null;
var ArchiveGrid = ({ onPlanSelect }) => {
  const {
    plans,
    filteredPlans,
    featuredPlans,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    uniqueBedrooms,
    uniqueBathrooms,
    areaRange,
    uniqueStyles
  } = usePlans();
  const { toggleFavorite, isFavorite } = useFavorites();
  const handleCategorySelect = (category) => {
    setFilters({ ...filters, category });
  };
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "dv-archive-grid dv-archive-grid--error", children: /* @__PURE__ */ jsxs("p", { children: [
      "Failed to load plans: ",
      error
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "dv-archive-grid", children: [
    /* @__PURE__ */ jsx(
      CategoryTiles,
      {
        activeCategory: filters.category,
        onSelect: handleCategorySelect
      }
    ),
    !hasAnyFilter(filters) && featuredPlans.length > 0 && /* @__PURE__ */ jsx(
      FeaturedRow,
      {
        title: "Featured Plans",
        plans: featuredPlans,
        onPlanSelect,
        onFavorite: toggleFavorite,
        isFavorite
      }
    ),
    /* @__PURE__ */ jsx(
      FilterBar,
      {
        filters,
        setFilters,
        clearFilters,
        uniqueBedrooms,
        uniqueBathrooms,
        areaRange,
        uniqueStyles,
        totalCount: plans.length,
        filteredCount: filteredPlans.length
      }
    ),
    loading ? /* @__PURE__ */ jsx("div", { className: "dv-plan-grid", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx(SkeletonCard, {}, i)) }) : filteredPlans.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "dv-archive-grid__empty", children: [
      /* @__PURE__ */ jsx(Layers, { size: 48 }),
      /* @__PURE__ */ jsx("h3", { children: "No plans found" }),
      /* @__PURE__ */ jsx("p", { children: "Try adjusting your filters or browse all categories." }),
      /* @__PURE__ */ jsx("button", { className: "dv-btn dv-btn--outline", onClick: clearFilters, children: "Clear Filters" })
    ] }) : /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "dv-plan-grid",
        initial: "hidden",
        animate: "visible",
        variants: {
          visible: { transition: { staggerChildren: 0.08 } }
        },
        children: filteredPlans.map((plan) => /* @__PURE__ */ jsx(
          PlanCard,
          {
            plan,
            onSelect: onPlanSelect,
            onFavorite: toggleFavorite,
            isFavorite: isFavorite(plan.id)
          },
          plan.id
        ))
      }
    )
  ] });
};

// src/types/index.ts
var DEFAULT_STYLE_PRESETS = [
  { id: "modern", label: "Modern", description: "Clean lines, large windows, flat roofs" },
  { id: "rustic", label: "Rustic", description: "Natural materials, wood beams, stone accents" },
  { id: "hill_country", label: "Hill Country", description: "Texas limestone, metal roofing, wide porches" },
  { id: "traditional", label: "Traditional", description: "Classic proportions, symmetrical facades" },
  { id: "farmhouse", label: "Farmhouse", description: "Board-and-batten siding, wraparound porches" },
  { id: "contemporary", label: "Contemporary", description: "Mixed materials, asymmetric design, open plans" }
];
var StyleSwapButtons = ({
  currentStyle,
  onSwap,
  isProcessing,
  activePreset
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-style-swap", children: [
    /* @__PURE__ */ jsx("h4", { className: "dv-style-swap__label", children: "Style Swap" }),
    /* @__PURE__ */ jsx("div", { className: "dv-style-swap__grid", children: DEFAULT_STYLE_PRESETS.map((preset) => {
      const isActive = activePreset === preset.id;
      const isOriginal = currentStyle === preset.id && !activePreset;
      const isThisProcessing = isProcessing && isActive;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          className: `dv-style-swap__btn ${isActive || isOriginal ? "dv-style-swap__btn--active" : ""}`,
          onClick: () => onSwap(preset.id),
          disabled: isProcessing,
          title: preset.description,
          children: [
            /* @__PURE__ */ jsx("span", { className: "dv-style-swap__btn-label", children: preset.label }),
            isThisProcessing && /* @__PURE__ */ jsx(Loader2, { size: 14, className: "dv-style-swap__spinner" })
          ]
        },
        preset.id
      );
    }) })
  ] });
};
var ImageLightbox = ({
  src,
  alt,
  isOpen,
  onClose,
  images,
  activeIndex = 0,
  onIndexChange,
  aiResults
}) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [showOriginal, setShowOriginal] = useState(false);
  const lastTouchRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  const lastPinchCenterRef = useRef(null);
  const swipeStartRef = useRef(null);
  const swipeDeltaRef = useRef(0);
  const wasPinchingRef = useRef(false);
  const canSwipe = !!images && images.length > 1 && !!onIndexChange;
  const originalUrl = images?.[activeIndex]?.url ?? src;
  const aiUrl = aiResults?.[originalUrl];
  const hasAiResult = !!aiUrl;
  const displaySrc = hasAiResult && !showOriginal ? aiUrl : originalUrl;
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      setShowOriginal(false);
    }
  }, [isOpen, activeIndex]);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  const clampTranslate = useCallback(
    (tx, ty, s) => {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return { x: tx, y: ty };
      const imgW = img.naturalWidth || img.offsetWidth;
      const imgH = img.naturalHeight || img.offsetHeight;
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      const imgAspect = imgW / imgH;
      const cAspect = cW / cH;
      let displayW, displayH;
      if (imgAspect > cAspect) {
        displayW = cW;
        displayH = cW / imgAspect;
      } else {
        displayH = cH;
        displayW = cH * imgAspect;
      }
      const scaledW = displayW * s;
      const scaledH = displayH * s;
      const maxX = Math.max(0, (scaledW - cW) / 2);
      const maxY = Math.max(0, (scaledH - cH) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, tx)),
        y: Math.min(maxY, Math.max(-maxY, ty))
      };
    },
    []
  );
  const getTouchDist = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const getTouchCenter = (t1, t2) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2
  });
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      swipeDeltaRef.current = 0;
      wasPinchingRef.current = false;
      lastPinchDistRef.current = null;
      lastPinchCenterRef.current = null;
    } else if (e.touches.length === 2) {
      lastTouchRef.current = null;
      swipeStartRef.current = null;
      wasPinchingRef.current = true;
      lastPinchDistRef.current = getTouchDist(e.touches[0], e.touches[1]);
      lastPinchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
    }
  }, []);
  const handleTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        if (lastPinchDistRef.current != null) {
          const ratio = dist / lastPinchDistRef.current;
          setScale((prev) => {
            const next = Math.min(5, Math.max(1, prev * ratio));
            if (next <= 1) {
              setTranslate({ x: 0, y: 0 });
            }
            return next;
          });
        }
        if (lastPinchCenterRef.current != null) {
          const dx = center.x - lastPinchCenterRef.current.x;
          const dy = center.y - lastPinchCenterRef.current.y;
          setTranslate(
            (prev) => clampTranslate(prev.x + dx, prev.y + dy, scale)
          );
        }
        lastPinchDistRef.current = dist;
        lastPinchCenterRef.current = center;
      } else if (e.touches.length === 1) {
        if (scale > 1) {
          if (lastTouchRef.current) {
            const dx = e.touches[0].clientX - lastTouchRef.current.x;
            const dy = e.touches[0].clientY - lastTouchRef.current.y;
            setTranslate(
              (prev) => clampTranslate(prev.x + dx, prev.y + dy, scale)
            );
          }
          lastTouchRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        } else if (canSwipe && swipeStartRef.current && !wasPinchingRef.current) {
          swipeDeltaRef.current = e.touches[0].clientX - swipeStartRef.current.x;
        }
      }
    },
    [scale, clampTranslate, canSwipe]
  );
  const handleTouchEnd = useCallback(
    (e) => {
      if (e.touches.length === 0) {
        if (canSwipe && scale <= 1.1 && !wasPinchingRef.current && Math.abs(swipeDeltaRef.current) > 50) {
          if (swipeDeltaRef.current < -50 && activeIndex < images.length - 1) {
            onIndexChange(activeIndex + 1);
          } else if (swipeDeltaRef.current > 50 && activeIndex > 0) {
            onIndexChange(activeIndex - 1);
          }
          swipeDeltaRef.current = 0;
          swipeStartRef.current = null;
          lastTouchRef.current = null;
          lastPinchDistRef.current = null;
          lastPinchCenterRef.current = null;
          return;
        }
        lastTouchRef.current = null;
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
        swipeStartRef.current = null;
        swipeDeltaRef.current = 0;
        if (scale < 1.1) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
      } else if (e.touches.length === 1) {
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
      }
    },
    [scale, canSwipe, activeIndex, images, onIndexChange]
  );
  const handleClick = useCallback(() => {
    if (scale <= 1.1) {
      onClose();
    }
  }, [scale, onClose]);
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxs(
    motion.div,
    {
      className: "dv-lightbox-overlay",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "dv-lightbox-overlay__close",
            onClick: onClose,
            "aria-label": "Close",
            children: /* @__PURE__ */ jsx(X, { size: 24 })
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "dv-lightbox-scroll",
            ref: containerRef,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onClick: handleClick,
            style: { touchAction: "none" },
            children: /* @__PURE__ */ jsx(
              "img",
              {
                ref: imgRef,
                className: "dv-lightbox-scroll__img",
                src: displaySrc,
                alt,
                draggable: false,
                style: {
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transition: scale <= 1 ? "transform 0.2s ease" : "none"
                }
              }
            )
          }
        ),
        hasAiResult && /* @__PURE__ */ jsxs("div", { className: "dv-lightbox-compare", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `dv-lightbox-compare__btn ${!showOriginal ? "dv-lightbox-compare__btn--active" : ""}`,
              onClick: (e) => {
                e.stopPropagation();
                setShowOriginal(false);
              },
              children: "AI Generated"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `dv-lightbox-compare__btn ${showOriginal ? "dv-lightbox-compare__btn--active" : ""}`,
              onClick: (e) => {
                e.stopPropagation();
                setShowOriginal(true);
              },
              children: "Original"
            }
          )
        ] }),
        canSwipe && /* @__PURE__ */ jsx("div", { className: "dv-lightbox-dots", children: images.map((_, i) => /* @__PURE__ */ jsx(
          "button",
          {
            className: `dv-lightbox-dots__dot ${i === activeIndex ? "dv-lightbox-dots__dot--active" : ""}`,
            onClick: () => onIndexChange(i),
            "aria-label": `Image ${i + 1}`
          },
          i
        )) })
      ]
    }
  ) });
};
var FloorPlanEditor = ({
  floorPlanUrl,
  originalFloorPlanUrl,
  hasFloorPlanResult,
  showOriginalFloorPlan,
  onToggleFloorPlanOriginal,
  wishlistItems,
  onWishlistAdd,
  onWishlistRemove,
  onPreviewAI,
  isProcessing
}) => {
  const [input, setInput] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    onWishlistAdd(text);
    setInput("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };
  const displayUrl = showOriginalFloorPlan ? originalFloorPlanUrl : floorPlanUrl;
  return /* @__PURE__ */ jsxs("div", { className: "dv-wishlist", children: [
    displayUrl && /* @__PURE__ */ jsx("div", { className: "dv-wishlist__preview", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "dv-wishlist__preview-clickable",
        onClick: () => setLightboxOpen(true),
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === "Enter") setLightboxOpen(true);
        },
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: displayUrl,
              alt: hasFloorPlanResult && !showOriginalFloorPlan ? "AI-modified floor plan" : "Current floor plan",
              className: "dv-wishlist__preview-img"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "dv-wishlist__preview-zoom", children: /* @__PURE__ */ jsx(Search, { size: 16 }) })
        ]
      }
    ) }),
    hasFloorPlanResult && /* @__PURE__ */ jsxs("div", { className: "dv-wishlist__compare", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `dv-wishlist__compare-btn ${!showOriginalFloorPlan ? "dv-wishlist__compare-btn--active" : ""}`,
          onClick: () => onToggleFloorPlanOriginal(false),
          children: "AI Generated"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `dv-wishlist__compare-btn ${showOriginalFloorPlan ? "dv-wishlist__compare-btn--active" : ""}`,
          onClick: () => onToggleFloorPlanOriginal(true),
          children: "Original"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("h4", { className: "dv-wishlist__label", children: "Floor Plan Wishlist" }),
    /* @__PURE__ */ jsxs("div", { className: "dv-wishlist__input-wrap", children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "dv-wishlist__input",
          placeholder: "What would you change? E.g. 'Add a 4th bedroom', 'Bigger garage', 'Open concept kitchen'...",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: handleKeyDown,
          disabled: isProcessing,
          rows: 2
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "dv-wishlist__add-btn",
          onClick: handleAdd,
          disabled: !input.trim() || isProcessing,
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            "Add to Wishlist"
          ]
        }
      )
    ] }),
    wishlistItems.length > 0 && /* @__PURE__ */ jsx("div", { className: "dv-wishlist__items", children: wishlistItems.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "dv-wishlist__item", children: [
      /* @__PURE__ */ jsx(Check, { size: 12, className: "dv-wishlist__item-check" }),
      /* @__PURE__ */ jsx("span", { className: "dv-wishlist__item-text", children: item }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "dv-wishlist__item-remove",
          onClick: () => onWishlistRemove(i),
          "aria-label": "Remove",
          disabled: isProcessing,
          children: /* @__PURE__ */ jsx(X, { size: 12 })
        }
      )
    ] }, i)) }),
    wishlistItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dv-wishlist__ai-section", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "dv-wishlist__ai-btn dv-wishlist__ai-btn--primary",
          onClick: onPreviewAI,
          disabled: isProcessing,
          children: [
            isProcessing ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "dv-wishlist__spinner" }) : /* @__PURE__ */ jsx(Wand2, { size: 18 }),
            isProcessing ? "Generating Your Floor Plan..." : "Generate AI Floor Plan"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "dv-wishlist__ai-disclaimer", children: "Results are AI-generated and may not be exact" })
    ] }),
    /* @__PURE__ */ jsx(
      ImageLightbox,
      {
        src: originalFloorPlanUrl,
        alt: "Floor plan",
        isOpen: lightboxOpen,
        onClose: () => setLightboxOpen(false),
        aiResults: hasFloorPlanResult ? { [originalFloorPlanUrl]: floorPlanUrl } : void 0
      }
    )
  ] });
};

// src/utils/tracking.ts
function fbq(method, event, params) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq(method, event, params);
}
function pushDataLayer(event, data) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...data });
}
function planData(plan) {
  return {
    content_name: plan.title,
    content_ids: [plan.id],
    content_type: "floor_plan",
    content_category: plan.category ?? "uncategorized",
    style: plan.style ?? "unknown",
    beds: plan.beds,
    baths: plan.baths,
    sqft: plan.area,
    price_tier: plan.price_tier ?? "standard"
  };
}
function trackPageView(pixelId, anonymousId, trackingEndpoint) {
  fbq("track", "PageView");
  pushDataLayer("dv_page_view", {
    dv_pixel_id: pixelId,
    dv_anonymous_id: anonymousId
  });
  if (trackingEndpoint && anonymousId) {
    trackEvent(trackingEndpoint, {
      event: "page_view",
      anonymousId,
      builderSlug: pixelId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
function trackPlanView(pixelId, plan) {
  const data = planData(plan);
  fbq("track", "ViewContent", {
    ...data,
    value: 0,
    currency: "USD"
  });
  pushDataLayer("dv_plan_view", {
    dv_pixel_id: pixelId,
    ...data
  });
}
function trackAIInteraction(pixelId, type, planId) {
  fbq("trackCustom", "DesignVaultInteraction", {
    interaction_type: type,
    plan_id: planId
  });
  pushDataLayer("dv_ai_interaction", {
    dv_pixel_id: pixelId,
    interaction_type: type,
    plan_id: planId
  });
}
function trackLeadCapture(pixelId, plan, value) {
  const data = planData(plan);
  fbq("track", "Lead", {
    ...data,
    value: value ?? 0,
    currency: "USD"
  });
  pushDataLayer("dv_lead_capture", {
    dv_pixel_id: pixelId,
    ...data,
    value: value ?? 0
  });
}
function fireMetaPixelEvent(pixelId, eventName, params) {
  fbq("track", eventName, { ...params, pixel_id: pixelId });
  pushDataLayer(`dv_${eventName.toLowerCase()}`, {
    dv_pixel_id: pixelId,
    ...params
  });
}
var ANON_ID_KEY2 = "dv-anonymous-id";
function generateAnonymousId() {
  if (typeof window === "undefined") return crypto.randomUUID();
  try {
    const existing = localStorage.getItem(ANON_ID_KEY2);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY2, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
function getSessionDuration(startTime) {
  return Math.round((Date.now() - startTime) / 1e3);
}
function trackEvent(endpoint, eventData) {
  if (!endpoint) return;
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...eventData,
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    })
  }).catch(() => {
  });
}
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function getSchedulerUrl(baseUrl) {
  if (typeof window === "undefined") return baseUrl;
  const url = new URL(baseUrl);
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") || (() => {
    try {
      return localStorage.getItem("fbclid");
    } catch {
      return null;
    }
  })();
  if (fbclid) url.searchParams.set("fbclid", fbclid);
  const fbp = getCookie("_fbp");
  if (fbp) url.searchParams.set("fbp", fbp);
  const fbc = getCookie("_fbc");
  if (fbc) url.searchParams.set("fbc", fbc);
  return url.toString();
}
var latencyLog = [];
function trackAILatency(type, startTime, endTime) {
  const entry = {
    type,
    durationMs: endTime - startTime,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  latencyLog.push(entry);
  if (latencyLog.length > 50) {
    latencyLog.shift();
  }
  pushDataLayer("dv_ai_latency", {
    ai_type: entry.type,
    duration_ms: entry.durationMs
  });
}
function getLatencyLog() {
  return latencyLog;
}

// src/utils/crmTracking.ts
var CRM_VISITOR_KEY2 = "_crm_visitor_id";
function getCRMVisitorId() {
  if (typeof window === "undefined") return null;
  try {
    return window.CRMTracking?.getVisitorId?.() ?? localStorage.getItem(CRM_VISITOR_KEY2);
  } catch {
    return null;
  }
}
function trackCRMEvent(type, title, metadata) {
  if (typeof window === "undefined") return;
  try {
    window.CRMTracking?.trackEvent(type, title, metadata);
  } catch {
  }
}

// src/hooks/useLeadCapture.ts
function getCookie2(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
function getFbTracking() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") || (() => {
    try {
      return localStorage.getItem("fbclid");
    } catch {
      return null;
    }
  })();
  const fbp = getCookie2("_fbp");
  const fbc = getCookie2("_fbc");
  return {
    ...fbclid && { fbclid },
    ...fbp && { fbp },
    ...fbc && { fbc },
    client_user_agent: navigator.userAgent
  };
}
var FAVORITES_KEY = "dv-favorites";
function readFavoritesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
function useLeadCapture() {
  const {
    api,
    config,
    anonymousId,
    sessionStartTime,
    sessionId,
    modifications,
    plansViewed,
    currentPlan,
    stylePref,
    setCaptured
  } = useDesignVaultContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const openCapture = useCallback(() => setIsOpen(true), []);
  const closeCapture = useCallback(() => setIsOpen(false), []);
  const submitCapture = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setError(null);
      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTime) / 1e3
      );
      const data = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        planId: currentPlan?.id ?? "",
        planTitle: currentPlan?.title ?? "",
        planSpecs: {
          beds: currentPlan?.beds ?? 0,
          baths: currentPlan?.baths ?? 0,
          area: currentPlan?.area ?? 0
        },
        modifications,
        favorites: readFavoritesFromStorage(),
        stylePref,
        sessionDuration,
        plansViewed: plansViewed.length,
        ...getFbTracking()
      };
      try {
        await api.saveDesign(
          data,
          sessionId ?? anonymousId,
          config.builderSlug
        );
        setSubmitted(true);
        setCaptured(true);
        setIsOpen(false);
        trackCRMEvent("lead_form_submitted", `Lead: ${formData.email}`, {
          plan_id: currentPlan?.id ?? "",
          plan_title: currentPlan?.title ?? "",
          email: formData.email,
          modifications_count: modifications.length,
          plans_viewed: plansViewed.length,
          session_duration: sessionDuration,
          site: config.builderSlug,
          session_id: sessionId ?? anonymousId,
          anonymous_id: getCRMVisitorId() ?? anonymousId
        });
        if (config.metaPixelId) {
          fireMetaPixelEvent(config.metaPixelId, "Lead", {
            content_name: currentPlan?.title,
            content_ids: [currentPlan?.id],
            content_category: currentPlan?.category,
            value: currentPlan?.area
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      api,
      config.builderSlug,
      config.metaPixelId,
      anonymousId,
      sessionStartTime,
      sessionId,
      modifications,
      plansViewed.length,
      currentPlan,
      stylePref,
      setCaptured
    ]
  );
  return {
    isOpen,
    openCapture,
    closeCapture,
    submitCapture,
    isSubmitting,
    submitted,
    error
  };
}
var SKIP_KEY = "dv-lead-skip-count";
function getSkipCount() {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(SKIP_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}
function incrementSkipCount() {
  const next = getSkipCount() + 1;
  try {
    localStorage.setItem(SKIP_KEY, String(next));
  } catch {
  }
  return next;
}
function summarizeMod(mod) {
  if (mod.type === "style_swap" && mod.stylePreset) {
    const label = mod.stylePreset.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return `Style swap to ${label}`;
  }
  if (mod.type === "wishlist_item" && mod.prompt) {
    return mod.prompt.length > 50 ? `Wishlist: ${mod.prompt.slice(0, 47)}\u2026` : `Wishlist: ${mod.prompt}`;
  }
  if (mod.type === "floor_plan_edit" && mod.prompt) {
    return mod.prompt.length > 50 ? mod.prompt.slice(0, 50) + "\u2026" : mod.prompt;
  }
  return mod.type === "style_swap" ? "Style customization" : "Floor plan edit";
}
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateFields(data) {
  const errors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required";
  if (!data.lastName.trim()) errors.lastName = "Last name is required";
  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }
  const digits = data.phone.replace(/\D/g, "");
  if (!digits) {
    errors.phone = "Phone number is required";
  } else if (digits.length < 10) {
    errors.phone = "Please enter a valid phone number (10+ digits)";
  }
  return errors;
}
var LeadCaptureModal = ({
  isOpen,
  onClose,
  onSubmit,
  plan,
  modifications,
  config
}) => {
  const {
    submitCapture,
    isSubmitting,
    submitted,
    error: hookError
  } = useLeadCapture();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(/* @__PURE__ */ new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [skipCount, setSkipCount] = useState(getSkipCount);
  useEffect(() => {
    if (isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setErrors({});
      setTouched(/* @__PURE__ */ new Set());
      setShowSuccess(false);
      setSkipCount(getSkipCount());
    }
  }, [isOpen]);
  useEffect(() => {
    if (submitted && isOpen && !showSuccess) {
      setShowSuccess(true);
      onSubmit?.();
      const timer = setTimeout(onClose, 2e3);
      return () => clearTimeout(timer);
    }
  }, [submitted, isOpen, showSuccess, onSubmit, onClose]);
  const handleBlur = useCallback(
    (field) => {
      setTouched((prev) => {
        const next = new Set(prev);
        next.add(field);
        return next;
      });
      setErrors(validateFields({ firstName, lastName, email, phone }));
    },
    [firstName, lastName, email, phone]
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { firstName, lastName, email, phone };
    const fieldErrors = validateFields(data);
    setErrors(fieldErrors);
    setTouched(/* @__PURE__ */ new Set(["firstName", "lastName", "email", "phone"]));
    if (Object.keys(fieldErrors).length > 0) return;
    await submitCapture({
      ...data,
      phone: phone.replace(/\D/g, "")
    });
  };
  const handleSkip = useCallback(() => {
    incrementSkipCount();
    setSkipCount((c) => c + 1);
    onClose();
  }, [onClose]);
  const handleBackdropClick = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);
  const canSkip = skipCount < 2;
  const builderName = config.builderSlug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const postCaptureExtra = 3;
  const fieldError = (field) => touched.has(field) && errors[field] ? errors[field] : null;
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "dv-lead-overlay",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
      onClick: handleBackdropClick,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "dv-lead-modal",
          initial: { scale: 0.95, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.95, opacity: 0 },
          transition: { duration: 0.25, ease: "easeOut" },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "dv-lead-modal__close",
                onClick: onClose,
                "aria-label": "Close",
                disabled: isSubmitting,
                children: /* @__PURE__ */ jsx(X, { size: 20 })
              }
            ),
            showSuccess ? (
              /* ── Success confirmation ── */
              /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__success", children: [
                /* @__PURE__ */ jsx(CheckCircle, { size: 48, className: "dv-lead-modal__success-icon" }),
                /* @__PURE__ */ jsxs("h2", { className: "dv-lead-modal__title", children: [
                  "Design Saved \u2014 ",
                  postCaptureExtra,
                  " Credits Unlocked!"
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "dv-lead-modal__subtitle", children: [
                  "Your custom design is on its way to your inbox. Plus you've got ",
                  postCaptureExtra,
                  " more AI customizations to try."
                ] })
              ] })
            ) : (
              /* ── Form ── */
              /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__header", children: [
                  /* @__PURE__ */ jsx(Sparkles, { size: 24, className: "dv-lead-modal__header-icon" }),
                  /* @__PURE__ */ jsxs("h2", { className: "dv-lead-modal__title", children: [
                    "Save Your Design & Unlock ",
                    postCaptureExtra,
                    " More"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "dv-lead-modal__subtitle", children: [
                    "We'll email your custom design for",
                    " ",
                    /* @__PURE__ */ jsx("strong", { children: plan.title }),
                    " \u2014 plus you'll get",
                    " ",
                    postCaptureExtra,
                    " more AI credits to keep customizing."
                  ] })
                ] }),
                modifications.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__mods", children: [
                  /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__mods-label", children: "Your customizations:" }),
                  /* @__PURE__ */ jsx("div", { className: "dv-lead-modal__mods-list", children: modifications.map((mod, i) => /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__mod-tag", children: summarizeMod(mod) }, i)) })
                ] }),
                hookError && /* @__PURE__ */ jsx("div", { className: "dv-lead-modal__api-error", children: hookError }),
                /* @__PURE__ */ jsxs(
                  "form",
                  {
                    className: "dv-lead-modal__form",
                    onSubmit: handleSubmit,
                    noValidate: true,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__row", children: [
                        /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__field", children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              className: `dv-lead-modal__input ${fieldError("firstName") ? "dv-lead-modal__input--error" : ""}`,
                              type: "text",
                              placeholder: "First Name",
                              value: firstName,
                              onChange: (e) => setFirstName(e.target.value),
                              onBlur: () => handleBlur("firstName"),
                              disabled: isSubmitting,
                              autoComplete: "given-name"
                            }
                          ),
                          fieldError("firstName") && /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__field-error", children: fieldError("firstName") })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__field", children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              className: `dv-lead-modal__input ${fieldError("lastName") ? "dv-lead-modal__input--error" : ""}`,
                              type: "text",
                              placeholder: "Last Name",
                              value: lastName,
                              onChange: (e) => setLastName(e.target.value),
                              onBlur: () => handleBlur("lastName"),
                              disabled: isSubmitting,
                              autoComplete: "family-name"
                            }
                          ),
                          fieldError("lastName") && /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__field-error", children: fieldError("lastName") })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__field", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            className: `dv-lead-modal__input ${fieldError("email") ? "dv-lead-modal__input--error" : ""}`,
                            type: "email",
                            placeholder: "Email",
                            value: email,
                            onChange: (e) => setEmail(e.target.value),
                            onBlur: () => handleBlur("email"),
                            disabled: isSubmitting,
                            autoComplete: "email"
                          }
                        ),
                        fieldError("email") && /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__field-error", children: fieldError("email") })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "dv-lead-modal__field", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            className: `dv-lead-modal__input ${fieldError("phone") ? "dv-lead-modal__input--error" : ""}`,
                            type: "tel",
                            placeholder: "Phone",
                            value: phone,
                            onChange: (e) => setPhone(e.target.value),
                            onBlur: () => handleBlur("phone"),
                            disabled: isSubmitting,
                            autoComplete: "tel"
                          }
                        ),
                        fieldError("phone") && /* @__PURE__ */ jsx("span", { className: "dv-lead-modal__field-error", children: fieldError("phone") })
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "dv-lead-modal__privacy", children: [
                        "Your info will be shared with",
                        " ",
                        /* @__PURE__ */ jsx("strong", { children: builderName }),
                        " to help you build this home."
                      ] }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          className: "dv-lead-modal__submit",
                          type: "submit",
                          disabled: isSubmitting,
                          children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, { children: [
                            /* @__PURE__ */ jsx(
                              Loader2,
                              {
                                size: 18,
                                className: "dv-lead-modal__spinner"
                              }
                            ),
                            "Saving..."
                          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                            /* @__PURE__ */ jsx(Save, { size: 16 }),
                            config.ctaText || "Save My Design"
                          ] })
                        }
                      )
                    ]
                  }
                ),
                canSkip && /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "dv-lead-modal__skip",
                    onClick: handleSkip,
                    disabled: isSubmitting,
                    type: "button",
                    children: "Skip for now"
                  }
                )
              ] })
            )
          ]
        }
      )
    }
  ) });
};
function useAIInteractions() {
  const {
    api,
    config,
    isCaptured,
    anonymousId,
    sessionId,
    currentPlan,
    addModification,
    initialInteractionCount
  } = useDesignVaultContext();
  const maxFree = config.maxFreeInteractions ?? 1;
  const hardLimit = maxFree + 3;
  const [isStyleSwapProcessing, setIsStyleSwapProcessing] = useState(false);
  const [isFloorPlanProcessing, setIsFloorPlanProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(
    null
  );
  const INTERACTION_COUNT_KEY = `dv-interactions-${config.builderSlug}`;
  const [interactionCount, setInteractionCount] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = localStorage.getItem(INTERACTION_COUNT_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [error, setError] = useState(null);
  const [hitHardLimit, setHitHardLimit] = useState(false);
  const [serverNeedsCapture, setServerNeedsCapture] = useState(false);
  const seededRef = useRef(false);
  useEffect(() => {
    if (initialInteractionCount > 0 && !seededRef.current) {
      seededRef.current = true;
      setInteractionCount(initialInteractionCount);
      if (initialInteractionCount >= hardLimit) {
        setHitHardLimit(true);
      }
    }
  }, [initialInteractionCount, hardLimit]);
  useEffect(() => {
    try {
      localStorage.setItem(INTERACTION_COUNT_KEY, String(interactionCount));
    } catch {
    }
  }, [interactionCount, INTERACTION_COUNT_KEY]);
  const needsCapture = interactionCount >= maxFree && !isCaptured || serverNeedsCapture && !isCaptured;
  const effectiveSessionId = sessionId ?? anonymousId;
  const handleStyleSwap = useCallback(
    async (planId, preset, imageType, imageUrl) => {
      if (interactionCount >= hardLimit) {
        setHitHardLimit(true);
        return null;
      }
      setIsStyleSwapProcessing(true);
      setError(null);
      const crmMeta = {
        plan_id: planId,
        plan_title: currentPlan?.title ?? "",
        preset,
        interaction_number: interactionCount + 1,
        site: config.builderSlug,
        session_id: effectiveSessionId,
        anonymous_id: getCRMVisitorId() ?? anonymousId
      };
      trackCRMEvent("style_swap_started", `Style swap: ${preset}`, crmMeta);
      try {
        const result = await api.styleSwap(
          planId,
          preset,
          effectiveSessionId,
          imageType,
          imageUrl
        );
        setLastResult(result);
        setServerNeedsCapture(false);
        const limit = isCaptured ? hardLimit : maxFree;
        setInteractionCount(limit - result.remainingFree);
        if (result.success && result.resultUrl) {
          addModification({
            type: "style_swap",
            prompt: null,
            stylePreset: preset,
            resultUrl: result.resultUrl,
            originalUrl: currentPlan?.image_url ?? "",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          trackCRMEvent("style_swap_completed", `Style swap: ${preset}`, {
            ...crmMeta,
            result_url: result.resultUrl,
            cached: result.cached
          });
        }
        return result;
      } catch (err) {
        if (err instanceof CaptureRequiredError) {
          setInteractionCount(maxFree);
          if (isCaptured) {
            setError("Something went wrong syncing your saved design. Please try again.");
          } else {
            setServerNeedsCapture(true);
          }
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsStyleSwapProcessing(false);
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      effectiveSessionId,
      isCaptured,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.image_url,
      currentPlan?.title
    ]
  );
  const handleFloorPlanEdit = useCallback(
    async (planId, prompt, currentUrl) => {
      if (interactionCount >= hardLimit) {
        setHitHardLimit(true);
        return null;
      }
      setIsFloorPlanProcessing(true);
      setError(null);
      const crmMeta = {
        plan_id: planId,
        plan_title: currentPlan?.title ?? "",
        prompt,
        interaction_number: interactionCount + 1,
        site: config.builderSlug,
        session_id: effectiveSessionId,
        anonymous_id: getCRMVisitorId() ?? anonymousId
      };
      trackCRMEvent("floor_plan_edit_started", `Floor plan edit: ${prompt.slice(0, 80)}`, crmMeta);
      try {
        const result = await api.floorPlanEdit(
          planId,
          prompt,
          effectiveSessionId,
          currentUrl
        );
        setLastResult(result);
        setServerNeedsCapture(false);
        const limit = isCaptured ? hardLimit : maxFree;
        setInteractionCount(limit - result.remainingFree);
        if (result.success && result.resultUrl) {
          addModification({
            type: "floor_plan_edit",
            prompt,
            stylePreset: null,
            resultUrl: result.resultUrl,
            originalUrl: currentUrl ?? currentPlan?.floor_plan_url ?? "",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          trackCRMEvent("floor_plan_edit_completed", `Floor plan edit: ${prompt.slice(0, 80)}`, {
            ...crmMeta,
            result_url: result.resultUrl,
            cached: result.cached
          });
        }
        return result;
      } catch (err) {
        if (err instanceof CaptureRequiredError) {
          setInteractionCount(maxFree);
          if (isCaptured) {
            setError("Something went wrong syncing your saved design. Please try again.");
          } else {
            setServerNeedsCapture(true);
          }
          return null;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsFloorPlanProcessing(false);
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      effectiveSessionId,
      isCaptured,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.floor_plan_url,
      currentPlan?.title
    ]
  );
  const handleEnhancePrompt = useCallback(
    async (prompt, imageUrl) => {
      setError(null);
      try {
        const { enhancedPrompt } = await api.enhancePrompt(prompt, imageUrl);
        return enhancedPrompt;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    [api]
  );
  return {
    handleStyleSwap,
    handleFloorPlanEdit,
    handleEnhancePrompt,
    isStyleSwapProcessing,
    isFloorPlanProcessing,
    lastResult,
    needsCapture,
    hitHardLimit,
    interactionCount,
    maxFree,
    hardLimit,
    error
  };
}
var AIToolsPanel = ({
  plan,
  config,
  heroUrl,
  originalHeroUrl,
  imageType,
  floorPlanUrl,
  originalFloorPlanUrl,
  hasFloorPlanResult,
  showOriginalFloorPlan,
  onToggleFloorPlanOriginal,
  onResult,
  onProcessingChange
}) => {
  const {
    handleStyleSwap,
    handleFloorPlanEdit,
    isStyleSwapProcessing,
    isFloorPlanProcessing,
    needsCapture,
    hitHardLimit,
    interactionCount,
    maxFree,
    hardLimit,
    error: aiError
  } = useAIInteractions();
  const { modifications, isCaptured, addModification } = useDesignVaultContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(
    plan.style ?? null
  );
  const [wishlistItems, setWishlistItems] = useState([]);
  useEffect(() => {
    setWishlistItems([]);
  }, [plan.id]);
  useEffect(() => {
    onProcessingChange(isStyleSwapProcessing);
  }, [isStyleSwapProcessing, onProcessingChange]);
  const onSwap = useCallback(
    async (presetId) => {
      if (needsCapture) {
        setModalOpen(true);
        return;
      }
      setActivePreset(presetId);
      const result = await handleStyleSwap(plan.id, presetId, imageType, originalHeroUrl);
      if (result?.success && result.resultUrl) {
        onResult({
          newUrl: result.resultUrl,
          originalUrl: originalHeroUrl,
          type: "style_swap"
        });
      }
    },
    [needsCapture, handleStyleSwap, plan.id, imageType, originalHeroUrl, onResult]
  );
  const onWishlistAdd = useCallback(
    (text) => {
      setWishlistItems((prev) => [...prev, text]);
      addModification({
        type: "wishlist_item",
        prompt: text,
        stylePreset: null,
        resultUrl: "",
        originalUrl: "",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    },
    [addModification]
  );
  const onWishlistRemove = useCallback((index) => {
    setWishlistItems((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const onPreviewAI = useCallback(async () => {
    if (needsCapture) {
      setModalOpen(true);
      return;
    }
    const prompt = "Make these changes: " + wishlistItems.map((item, i) => `${i + 1}) ${item}`).join(" ");
    const result = await handleFloorPlanEdit(
      plan.id,
      prompt,
      plan.floor_plan_url ?? void 0
    );
    if (result?.success && result.resultUrl) {
      onResult({
        newUrl: result.resultUrl,
        originalUrl: plan.floor_plan_url ?? plan.image_url,
        type: "floor_plan_edit"
      });
    }
  }, [
    needsCapture,
    wishlistItems,
    handleFloorPlanEdit,
    plan.id,
    plan.floor_plan_url,
    plan.image_url,
    onResult
  ]);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const totalCredits = isCaptured ? hardLimit : maxFree;
  const creditsRemaining = Math.max(0, totalCredits - interactionCount);
  const postCaptureExtra = hardLimit - maxFree;
  return /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools", children: [
    /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__header", children: [
      /* @__PURE__ */ jsx(Sparkles, { size: 20 }),
      /* @__PURE__ */ jsx("h3", { className: "dv-ai-tools__title", children: "AI Design Tools" })
    ] }),
    !hitHardLimit && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__credits", children: [
      /* @__PURE__ */ jsx(Sparkles, { size: 14, className: "dv-ai-tools__credits-icon" }),
      /* @__PURE__ */ jsxs("span", { children: [
        creditsRemaining,
        " of ",
        totalCredits,
        " credit",
        totalCredits !== 1 ? "s" : "",
        " remaining"
      ] })
    ] }),
    !isCaptured && !needsCapture && !hitHardLimit && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__unlock-hint", children: [
      /* @__PURE__ */ jsx(Unlock, { size: 14 }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Save your design to unlock ",
        postCaptureExtra,
        " more AI credits"
      ] })
    ] }),
    (needsCapture || aiError && !isCaptured) && !hitHardLimit && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__gate", children: [
      /* @__PURE__ */ jsx(Lock, { size: 18, className: "dv-ai-tools__gate-icon" }),
      /* @__PURE__ */ jsx("p", { className: "dv-ai-tools__gate-title", children: "You've used your free design preview" }),
      /* @__PURE__ */ jsxs("p", { className: "dv-ai-tools__gate-sub", children: [
        "Save your design and unlock ",
        postCaptureExtra,
        " more AI customizations"
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "dv-ai-tools__gate-btn",
          onClick: openModal,
          children: [
            /* @__PURE__ */ jsx(Save, { size: 16 }),
            "Save Design & Unlock ",
            postCaptureExtra,
            " More"
          ]
        }
      )
    ] }),
    hitHardLimit && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__gate", children: [
      /* @__PURE__ */ jsx(CalendarCheck, { size: 18, className: "dv-ai-tools__gate-icon" }),
      /* @__PURE__ */ jsx("p", { className: "dv-ai-tools__gate-title", children: "You've explored all your free customizations!" }),
      /* @__PURE__ */ jsx("p", { className: "dv-ai-tools__gate-sub", children: "Ready to make this plan yours? Schedule a free consultation and we'll create your full custom plan set." }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "dv-ai-tools__gate-btn",
          onClick: () => {
            const url = getSchedulerUrl(
              config.schedulerUrl ?? "https://crm.empowerbuilding.ai/book/barnhaus-consultation"
            );
            window.open(url, "_blank", "noopener");
          },
          children: [
            /* @__PURE__ */ jsx(CalendarCheck, { size: 16 }),
            "Schedule My Consultation"
          ]
        }
      )
    ] }),
    aiError && isCaptured && !hitHardLimit && /* @__PURE__ */ jsx("div", { className: "dv-ai-tools__error", children: aiError }),
    config.enableStyleSwap !== false && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__section", children: [
      /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__section-header", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: heroUrl,
            alt: "Exterior preview",
            className: "dv-ai-tools__section-thumb",
            width: 48,
            height: 36
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "dv-ai-tools__section-label", children: imageType === "interior" ? "Change Interior Style" : "Change Exterior Style" })
      ] }),
      /* @__PURE__ */ jsx(
        StyleSwapButtons,
        {
          planId: plan.id,
          currentStyle: plan.style,
          onSwap,
          isProcessing: isStyleSwapProcessing,
          activePreset
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dv-ai-tools__divider" }),
    config.enableFloorPlanEdit !== false && /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools__section", children: [
      /* @__PURE__ */ jsx("div", { className: "dv-ai-tools__section-header", children: /* @__PURE__ */ jsx("span", { className: "dv-ai-tools__section-label", children: "Customize Floor Plan" }) }),
      /* @__PURE__ */ jsx(
        FloorPlanEditor,
        {
          planId: plan.id,
          floorPlanUrl,
          originalFloorPlanUrl,
          hasFloorPlanResult,
          showOriginalFloorPlan,
          onToggleFloorPlanOriginal,
          wishlistItems,
          onWishlistAdd,
          onWishlistRemove,
          onPreviewAI,
          isProcessing: isFloorPlanProcessing
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dv-ai-tools__divider" }),
    /* @__PURE__ */ jsx(
      "button",
      {
        className: "dv-ai-tools__save-btn",
        onClick: openModal,
        disabled: isCaptured,
        children: isCaptured ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { size: 16 }),
          "Design Saved"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Save, { size: 16 }),
          "Save Design & Unlock ",
          postCaptureExtra,
          " More"
        ] })
      }
    ),
    !hitHardLimit && !isCaptured && /* @__PURE__ */ jsxs("p", { className: "dv-ai-tools__callout", children: [
      "First customization is free. Save your design to unlock ",
      postCaptureExtra,
      " more."
    ] }),
    /* @__PURE__ */ jsx(
      LeadCaptureModal,
      {
        isOpen: modalOpen,
        onClose: closeModal,
        plan,
        modifications,
        config
      }
    )
  ] });
};
function scoreSimilarity(a, b) {
  let score = 0;
  if (a.style && a.style === b.style) score += 3;
  if (a.category && a.category === b.category) score += 3;
  if (Math.abs(a.beds - b.beds) <= 1) score += 2;
  if (Math.abs(a.area - b.area) <= 500) score += 2;
  if (a.price_tier && a.price_tier === b.price_tier) score += 1;
  return score;
}
var SimilarPlans = ({
  currentPlan,
  allPlans,
  onPlanSelect
}) => {
  const similar = useMemo(() => {
    return allPlans.filter((p) => p.id !== currentPlan.id).map((p) => ({ plan: p, score: scoreSimilarity(currentPlan, p) })).sort((a, b) => b.score - a.score).slice(0, 3).filter((s) => s.score > 0).map((s) => s.plan);
  }, [currentPlan, allPlans]);
  if (similar.length === 0) return null;
  return /* @__PURE__ */ jsxs("div", { className: "dv-similar-plans", children: [
    /* @__PURE__ */ jsx("h3", { className: "dv-similar-plans__title", children: "Similar Plans" }),
    /* @__PURE__ */ jsx("div", { className: "dv-similar-plans__grid", children: similar.map((plan) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: "dv-similar-plans__card",
        onClick: () => onPlanSelect(plan),
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: plan.image_url,
              alt: plan.title,
              className: "dv-similar-plans__img",
              loading: "lazy"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "dv-similar-plans__info", children: [
            /* @__PURE__ */ jsx("span", { className: "dv-similar-plans__name", children: plan.title }),
            /* @__PURE__ */ jsxs("span", { className: "dv-similar-plans__specs", children: [
              /* @__PURE__ */ jsx(Home, { size: 12 }),
              " ",
              plan.beds,
              /* @__PURE__ */ jsx(Bath, { size: 12 }),
              " ",
              plan.baths,
              /* @__PURE__ */ jsx(Square, { size: 12 }),
              " ",
              plan.area.toLocaleString()
            ] })
          ] })
        ]
      },
      plan.id
    )) })
  ] });
};
function useSession() {
  const {
    api,
    config,
    anonymousId,
    sessionStartTime,
    isCaptured,
    setCaptured,
    sessionId,
    setSessionId,
    setInitialInteractionCount,
    modifications,
    addModification: ctxAddModification,
    plansViewed,
    addPlanViewed,
    currentPlan,
    setCurrentPlan: ctxSetCurrentPlan,
    stylePref
  } = useDesignVaultContext();
  const session = useMemo(() => {
    if (!sessionId) return null;
    return {
      id: sessionId,
      anonymousId,
      planId: currentPlan?.id ?? "",
      builderSlug: config.builderSlug,
      modifications,
      stylePref,
      capturedAt: isCaptured ? (/* @__PURE__ */ new Date()).toISOString() : null,
      contactId: null
    };
  }, [
    sessionId,
    anonymousId,
    currentPlan?.id,
    config.builderSlug,
    modifications,
    stylePref,
    isCaptured
  ]);
  const addModification = useCallback(
    (mod) => {
      ctxAddModification(mod);
    },
    [ctxAddModification]
  );
  const setCurrentPlan = useCallback(
    async (plan) => {
      ctxSetCurrentPlan(plan);
      addPlanViewed(plan.id);
      api.trackClick(plan.id).catch(() => {
      });
      if (!sessionId) {
        try {
          const { sessionId: newId, totalInteractionCount, isCaptured: serverCaptured } = await api.createSession(plan.id, config.builderSlug, anonymousId);
          setSessionId(newId);
          setInitialInteractionCount(totalInteractionCount);
          if (serverCaptured && !isCaptured) setCaptured(true);
        } catch {
        }
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      isCaptured,
      sessionId,
      setSessionId,
      setInitialInteractionCount,
      setCaptured,
      ctxSetCurrentPlan,
      addPlanViewed
    ]
  );
  const getSessionDuration2 = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / 1e3);
  }, [sessionStartTime]);
  return {
    session,
    addModification,
    setCurrentPlan,
    plansViewed,
    getSessionDuration: getSessionDuration2
  };
}
var heroSlideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 })
};
var PlanDetail = ({
  plan,
  isOpen,
  onClose,
  config,
  allPlans,
  onPlanSwitch
}) => {
  const { setCurrentPlan } = useSession();
  const { config: dvConfig, anonymousId, sessionId } = useDesignVaultContext();
  const panelRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiResults, setAiResults] = useState({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(1);
  const [floorPlanUrl, setFloorPlanUrl] = useState(plan.floor_plan_url ?? "");
  const [originalFloorPlanUrl, setOriginalFloorPlanUrl] = useState(plan.floor_plan_url ?? "");
  const [showOriginalFloorPlan, setShowOriginalFloorPlan] = useState(false);
  const [hasFloorPlanResult, setHasFloorPlanResult] = useState(false);
  const thumbnails = useMemo(() => {
    const thumbs = [
      { url: plan.image_url, label: "Exterior" }
    ];
    if (plan.interior_urls) {
      plan.interior_urls.forEach((url, i) => {
        thumbs.push({ url, label: `Interior ${i + 1}` });
      });
    }
    return thumbs;
  }, [plan]);
  const currentOriginalUrl = thumbnails[activeIndex]?.url ?? plan.image_url;
  const currentAiUrl = aiResults[currentOriginalUrl];
  const hasAiResult = !!currentAiUrl;
  const displayUrl = showOriginal ? currentOriginalUrl : currentAiUrl ?? currentOriginalUrl;
  const imageType = thumbnails[activeIndex]?.label === "Exterior" ? "exterior" : "interior";
  useEffect(() => {
    if (isOpen) {
      setCurrentPlan(plan);
      setActiveIndex(0);
      setAiResults({});
      setShowOriginal(false);
      setSwipeDirection(1);
      setFloorPlanUrl(plan.floor_plan_url ?? "");
      setOriginalFloorPlanUrl(plan.floor_plan_url ?? "");
      setHasFloorPlanResult(false);
      setShowOriginalFloorPlan(false);
      panelRef.current?.scrollTo(0, 0);
      trackCRMEvent("plan_viewed", plan.title, {
        plan_id: plan.id,
        plan_title: plan.title,
        beds: plan.beds,
        baths: plan.baths,
        sqft: plan.area,
        site: dvConfig.builderSlug,
        session_id: sessionId ?? anonymousId,
        anonymous_id: getCRMVisitorId() ?? anonymousId
      });
    }
  }, [isOpen, plan, setCurrentPlan, dvConfig.builderSlug, anonymousId, sessionId]);
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);
  const handleResult = useCallback(
    (result) => {
      if (result.type === "floor_plan_edit") {
        setFloorPlanUrl(result.newUrl);
        setOriginalFloorPlanUrl(result.originalUrl);
        setHasFloorPlanResult(true);
        setShowOriginalFloorPlan(false);
      } else {
        setAiResults((prev) => ({
          ...prev,
          [result.originalUrl]: result.newUrl
        }));
        setShowOriginal(false);
      }
    },
    []
  );
  const handlePlanSelect = useCallback(
    (newPlan) => {
      if (onPlanSwitch) {
        onPlanSwitch(newPlan);
      } else {
        setCurrentPlan(newPlan);
        setActiveIndex(0);
        setAiResults({});
        setShowOriginal(false);
        setFloorPlanUrl(newPlan.floor_plan_url ?? "");
        setOriginalFloorPlanUrl(newPlan.floor_plan_url ?? "");
        setHasFloorPlanResult(false);
        setShowOriginalFloorPlan(false);
      }
    },
    [onPlanSwitch, setCurrentPlan]
  );
  const handleSchedulerClick = useCallback(() => {
    if (!config.schedulerUrl) return;
    window.open(getSchedulerUrl(config.schedulerUrl), "_blank", "noopener");
  }, [config.schedulerUrl]);
  const handleHeroSwipe = useCallback(
    (_event, info) => {
      const { offset, velocity } = info;
      const swipedLeft = offset.x < -50 || velocity.x < -300;
      const swipedRight = offset.x > 50 || velocity.x > 300;
      if (swipedLeft && activeIndex < thumbnails.length - 1) {
        setSwipeDirection(1);
        setActiveIndex((prev) => prev + 1);
        setShowOriginal(false);
      } else if (swipedRight && activeIndex > 0) {
        setSwipeDirection(-1);
        setActiveIndex((prev) => prev - 1);
        setShowOriginal(false);
      }
    },
    [activeIndex, thumbnails.length]
  );
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsx(
    motion.div,
    {
      className: "dv-detail-overlay",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          ref: panelRef,
          className: "dv-detail-panel",
          initial: { y: isMobile ? 0 : 40, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: isMobile ? 0 : 40, opacity: 0 },
          transition: { duration: isMobile ? 0.2 : 0.35, ease: "easeOut" },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "dv-detail-panel__close",
                onClick: onClose,
                "aria-label": "Close",
                children: /* @__PURE__ */ jsx(X, { size: 24 })
              }
            ),
            config.schedulerUrl && isMobile && /* @__PURE__ */ jsx("div", { className: "dv-detail__scheduler-row", children: /* @__PURE__ */ jsxs(
              motion.button,
              {
                className: "dv-detail__scheduler-btn dv-detail__scheduler-btn--mobile",
                onClick: handleSchedulerClick,
                initial: { y: -20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.3, duration: 0.3, ease: "easeOut" },
                children: [
                  "Get a Quote on This Plan",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
                ]
              }
            ) }),
            config.schedulerUrl && !isMobile && /* @__PURE__ */ jsxs(
              motion.button,
              {
                className: "dv-detail__scheduler-btn dv-detail__scheduler-btn--desktop",
                onClick: handleSchedulerClick,
                initial: { x: 40, opacity: 0 },
                animate: { x: 0, opacity: 1 },
                transition: { delay: 0.5, duration: 0.35, ease: "easeOut" },
                children: [
                  "Get a Quote on This Plan",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "dv-detail-hero", children: [
              /* @__PURE__ */ jsx(AnimatePresence, { initial: false, mode: "popLayout", custom: swipeDirection, children: /* @__PURE__ */ jsx(
                motion.div,
                {
                  className: "dv-detail-hero__swipe-container",
                  drag: thumbnails.length > 1 ? "x" : false,
                  dragConstraints: { left: 0, right: 0 },
                  dragElastic: 0.2,
                  onDragEnd: handleHeroSwipe,
                  onTap: () => setLightboxOpen(true),
                  custom: swipeDirection,
                  initial: "enter",
                  animate: "center",
                  exit: "exit",
                  variants: heroSlideVariants,
                  transition: { duration: 0.3, ease: "easeInOut" },
                  style: { touchAction: "pan-y" },
                  children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: displayUrl,
                      alt: plan.title,
                      className: "dv-detail-hero__img",
                      draggable: false
                    }
                  )
                },
                activeIndex
              ) }),
              isProcessing && /* @__PURE__ */ jsxs("div", { className: "dv-detail-hero__processing", children: [
                /* @__PURE__ */ jsx("div", { className: "dv-detail-hero__shimmer" }),
                /* @__PURE__ */ jsx("span", { className: "dv-detail-hero__processing-text", children: "AI is generating..." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "dv-detail-hero__gradient" }),
              /* @__PURE__ */ jsx("div", { className: "dv-detail-hero__info", children: /* @__PURE__ */ jsxs("div", { className: "dv-detail-hero__specs", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(Home, { size: 16 }),
                  " ",
                  plan.beds,
                  " Beds"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(Bath, { size: 16 }),
                  " ",
                  plan.baths,
                  " Baths"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx(Square, { size: 16 }),
                  " ",
                  plan.area.toLocaleString(),
                  " sqft"
                ] })
              ] }) }),
              thumbnails.length > 1 && /* @__PURE__ */ jsx("div", { className: "dv-detail-hero__dots", children: thumbnails.map((_, i) => /* @__PURE__ */ jsx(
                "button",
                {
                  className: `dv-detail-hero__dot ${i === activeIndex ? "dv-detail-hero__dot--active" : ""}`,
                  onClick: () => {
                    setSwipeDirection(i > activeIndex ? 1 : -1);
                    setActiveIndex(i);
                    setShowOriginal(false);
                  },
                  "aria-label": `Image ${i + 1}`
                },
                i
              )) })
            ] }),
            hasAiResult && /* @__PURE__ */ jsxs("div", { className: "dv-detail-hero__compare", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: `dv-detail-hero__compare-btn ${!showOriginal ? "dv-detail-hero__compare-btn--active" : ""}`,
                  onClick: () => setShowOriginal(false),
                  children: "AI Generated"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: `dv-detail-hero__compare-btn ${showOriginal ? "dv-detail-hero__compare-btn--active" : ""}`,
                  onClick: () => setShowOriginal(true),
                  children: "Original"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "dv-detail-body", children: [
              thumbnails.length > 1 && /* @__PURE__ */ jsx("div", { className: "dv-detail-body__thumbs", children: /* @__PURE__ */ jsx("div", { className: "dv-detail-thumbs", children: thumbnails.map((thumb, index) => /* @__PURE__ */ jsxs(
                "button",
                {
                  className: `dv-detail-thumbs__item ${activeIndex === index ? "dv-detail-thumbs__item--active" : ""}`,
                  onClick: () => {
                    setSwipeDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                    setShowOriginal(false);
                  },
                  children: [
                    /* @__PURE__ */ jsx("img", { src: thumb.url, alt: thumb.label }),
                    /* @__PURE__ */ jsx("span", { className: "dv-detail-thumbs__label", children: thumb.label })
                  ]
                },
                thumb.url
              )) }) }),
              /* @__PURE__ */ jsx("div", { className: "dv-detail-body__sidebar", children: /* @__PURE__ */ jsx(
                AIToolsPanel,
                {
                  plan,
                  config,
                  heroUrl: displayUrl,
                  originalHeroUrl: currentOriginalUrl,
                  imageType,
                  floorPlanUrl: showOriginalFloorPlan ? originalFloorPlanUrl : floorPlanUrl,
                  originalFloorPlanUrl,
                  hasFloorPlanResult,
                  showOriginalFloorPlan,
                  onToggleFloorPlanOriginal: setShowOriginalFloorPlan,
                  onResult: handleResult,
                  onProcessingChange: setIsProcessing
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "dv-detail-body__main", children: [
                plan.description && /* @__PURE__ */ jsx("p", { className: "dv-detail-description", children: plan.description }),
                plan.features.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dv-detail-features", children: [
                  /* @__PURE__ */ jsx("h3", { className: "dv-detail-features__title", children: "Features" }),
                  /* @__PURE__ */ jsx("div", { className: "dv-detail-features__grid", children: plan.features.map((feature) => /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "dv-detail-features__item",
                      children: [
                        /* @__PURE__ */ jsx(Check, { size: 16 }),
                        /* @__PURE__ */ jsx("span", { children: feature })
                      ]
                    },
                    feature
                  )) })
                ] })
              ] }),
              config.enableSimilarPlans !== false && allPlans && allPlans.length > 1 && /* @__PURE__ */ jsx("div", { className: "dv-detail-body__similar", children: /* @__PURE__ */ jsx(
                SimilarPlans,
                {
                  currentPlan: plan,
                  allPlans,
                  onPlanSelect: handlePlanSelect
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx(
              ImageLightbox,
              {
                src: displayUrl,
                alt: plan.title,
                isOpen: lightboxOpen,
                onClose: () => setLightboxOpen(false),
                images: thumbnails,
                activeIndex,
                onIndexChange: (i) => {
                  setSwipeDirection(i > activeIndex ? 1 : -1);
                  setActiveIndex(i);
                  setShowOriginal(false);
                },
                aiResults
              }
            )
          ]
        }
      )
    }
  ) });
};
function hexToRgb(hex) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const out = rgb.map(
    (c) => Math.min(255, Math.round(c + (255 - c) * amount))
  );
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
function brandVars(color, colorLight) {
  const rgb = hexToRgb(color);
  return {
    "--dv-brand": color,
    "--dv-brand-light": colorLight ?? lighten(color, 0.25),
    "--dv-brand-dim": rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)` : "rgba(184, 134, 11, 0.15)"
  };
}
function DesignVaultInner({ config }) {
  const { anonymousId } = useDesignVaultContext();
  const { plans } = usePlans();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const lastPlanRef = useRef(null);
  if (selectedPlan) {
    lastPlanRef.current = selectedPlan;
  }
  useEffect(() => {
    if (config.trackingEndpoint) {
      trackPageView(config.builderSlug, anonymousId, config.trackingEndpoint);
    }
  }, [config.trackingEndpoint, config.builderSlug, anonymousId]);
  useEffect(() => {
    if (plans.length === 0 || selectedPlan) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (!planParam) return;
    const decoded = decodeURIComponent(planParam);
    const match = plans.find(
      (p) => p.title.toLowerCase() === decoded.toLowerCase() || p.id === decoded
    );
    if (match) setSelectedPlan(match);
  }, [plans, selectedPlan]);
  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan(plan);
  }, []);
  const handleDetailClose = useCallback(() => {
    setSelectedPlan(null);
  }, []);
  const handlePlanSwitch = useCallback((plan) => {
    setSelectedPlan(plan);
  }, []);
  const detailPlan = selectedPlan ?? lastPlanRef.current;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("header", { className: "dv-hero", children: [
      /* @__PURE__ */ jsxs("div", { className: "dv-hero__badge", children: [
        /* @__PURE__ */ jsx(Sparkles, { size: 13 }),
        "Interactive Floor Plans"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "dv-hero__title", children: "Find Your Perfect Floor Plan" }),
      /* @__PURE__ */ jsx("p", { className: "dv-hero__subtitle", children: "Browse. Customize. Build With Confidence." }),
      /* @__PURE__ */ jsx("p", { className: "dv-hero__desc", children: "Explore 67+ steel building floor plans and see your vision come to life. Ready to build? Our team is here to help." }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://crm.empowerbuilding.ai/book/30-minute-consultation",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "dv-hero__cta-btn",
          children: "Schedule a Free Consultation \u2192"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("main", { className: "dv-container", children: /* @__PURE__ */ jsx(ArchiveGrid, { onPlanSelect: handlePlanSelect }) }),
    detailPlan && /* @__PURE__ */ jsx(
      PlanDetail,
      {
        plan: detailPlan,
        isOpen: !!selectedPlan,
        onClose: handleDetailClose,
        config,
        allPlans: plans,
        onPlanSwitch: handlePlanSwitch
      }
    ),
    config.attribution?.show && /* @__PURE__ */ jsxs("footer", { className: "dv-attribution", children: [
      /* @__PURE__ */ jsx("span", { children: "Designed by " }),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: config.attribution.url,
          target: "_blank",
          rel: "noopener noreferrer",
          children: config.attribution.text
        }
      )
    ] })
  ] });
}
var DesignVault = ({
  config,
  className
}) => {
  return /* @__PURE__ */ jsx(DesignVaultProvider, { config, children: /* @__PURE__ */ jsx(
    "div",
    {
      className: `dv-root ${className ?? ""}`,
      style: brandVars(config.brandColor, config.brandColorLight),
      children: /* @__PURE__ */ jsx(DesignVaultInner, { config })
    }
  ) });
};

export { AIToolsPanel, ArchiveGrid, CategoryTiles, DEFAULT_STYLE_PRESETS, DesignVault, DesignVaultAPI, DesignVaultContext, DesignVaultProvider, FavoriteButton, FeaturedRow, FilterBar, FloorPlanEditor, LeadCaptureModal, PlanCard, PlanDetail, SimilarPlans, StyleSwapButtons, DesignVault as default, fireMetaPixelEvent, generateAnonymousId, getLatencyLog, getSchedulerUrl, getSessionDuration, trackAIInteraction, trackAILatency, trackEvent, trackLeadCapture, trackPageView, trackPlanView, useAIInteractions, useDesignVaultContext, useFavorites, useLeadCapture, usePlans, useSession };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map