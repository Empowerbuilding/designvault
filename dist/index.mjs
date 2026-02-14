import { jsx, jsxs } from 'react/jsx-runtime';
import React, { createContext, useContext, useMemo, useState, useRef, useCallback, useEffect } from 'react';

var DesignVault = ({ config, className }) => {
  return /* @__PURE__ */ jsx("div", { className: `dv-root ${className ?? ""}`, children: /* @__PURE__ */ jsxs("p", { children: [
    "DesignVault: ",
    config.builderSlug
  ] }) });
};
var ArchiveGrid = ({
  plans,
  loading,
  onPlanSelect
}) => {
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "dv-archive-grid dv-loading", children: "Loading..." });
  }
  return /* @__PURE__ */ jsx("div", { className: "dv-archive-grid", children: plans.map((plan) => /* @__PURE__ */ jsx("div", { onClick: () => onPlanSelect(plan), children: plan.title }, plan.id)) });
};
var PlanCard = ({ plan, onSelect }) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-plan-card", onClick: () => onSelect(plan), children: [
    /* @__PURE__ */ jsx("div", { className: "dv-plan-card__image", children: /* @__PURE__ */ jsx("img", { src: plan.image_url, alt: plan.title }) }),
    /* @__PURE__ */ jsxs("div", { className: "dv-plan-card__info", children: [
      /* @__PURE__ */ jsx("h3", { className: "dv-plan-card__name", children: plan.title }),
      /* @__PURE__ */ jsxs("p", { className: "dv-plan-card__specs", children: [
        plan.beds,
        " bed \xB7 ",
        plan.baths,
        " bath \xB7",
        " ",
        plan.area.toLocaleString(),
        " sqft"
      ] })
    ] })
  ] });
};
var PlanDetail = ({ plan, onClose }) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-plan-detail", children: [
    /* @__PURE__ */ jsx("button", { className: "dv-plan-detail__close", onClick: onClose, children: "Close" }),
    /* @__PURE__ */ jsx("h2", { className: "dv-plan-detail__name", children: plan.title }),
    /* @__PURE__ */ jsx("p", { className: "dv-plan-detail__description", children: plan.description })
  ] });
};
var AIToolsPanel = ({ plan }) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-ai-tools-panel", children: [
    /* @__PURE__ */ jsx("h3", { className: "dv-ai-tools-panel__title", children: "AI Tools" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Customize ",
      plan.title
    ] })
  ] });
};
var LeadCaptureModal = ({
  open,
  onClose,
  planId,
  planTitle
}) => {
  if (!open) return null;
  return /* @__PURE__ */ jsx("div", { className: "dv-lead-capture-overlay", children: /* @__PURE__ */ jsxs("div", { className: "dv-lead-capture-modal", children: [
    /* @__PURE__ */ jsx("button", { className: "dv-lead-capture-modal__close", onClick: onClose, children: "Close" }),
    /* @__PURE__ */ jsx("h2", { className: "dv-lead-capture-modal__title", children: "Get Your Custom Plan" }),
    planTitle && /* @__PURE__ */ jsxs("p", { children: [
      "Plan: ",
      planTitle
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "dv-lead-capture-modal__form", children: [
      /* @__PURE__ */ jsx("input", { type: "text", placeholder: "First Name", "data-plan-id": planId }),
      /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Last Name" }),
      /* @__PURE__ */ jsx("input", { type: "email", placeholder: "Email" }),
      /* @__PURE__ */ jsx("input", { type: "tel", placeholder: "Phone" }),
      /* @__PURE__ */ jsx("button", { type: "submit", children: "Submit" })
    ] })
  ] }) });
};
var CategoryTiles = ({
  categories,
  activeCategory,
  onSelect
}) => {
  return /* @__PURE__ */ jsx("div", { className: "dv-category-tiles", children: categories.map((cat) => /* @__PURE__ */ jsxs(
    "button",
    {
      className: `dv-category-tile ${activeCategory === cat.slug ? "dv-category-tile--active" : ""}`,
      onClick: () => onSelect(activeCategory === cat.slug ? null : cat.slug),
      children: [
        /* @__PURE__ */ jsx("span", { className: "dv-category-tile__name", children: cat.label }),
        /* @__PURE__ */ jsx("span", { className: "dv-category-tile__count", children: cat.count })
      ]
    },
    cat.slug
  )) });
};
var FilterBar = ({ filters, onChange }) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-filter-bar", children: [
    /* @__PURE__ */ jsx(
      "select",
      {
        className: "dv-filter-bar__select",
        value: filters.bedrooms ?? "",
        onChange: (e) => onChange({
          ...filters,
          bedrooms: e.target.value ? Number(e.target.value) : null
        }),
        children: /* @__PURE__ */ jsx("option", { value: "", children: "Beds" })
      }
    ),
    /* @__PURE__ */ jsx(
      "select",
      {
        className: "dv-filter-bar__select",
        value: filters.bathrooms ?? "",
        onChange: (e) => onChange({
          ...filters,
          bathrooms: e.target.value ? Number(e.target.value) : null
        }),
        children: /* @__PURE__ */ jsx("option", { value: "", children: "Baths" })
      }
    ),
    /* @__PURE__ */ jsx(
      "select",
      {
        className: "dv-filter-bar__select",
        value: filters.style ?? "",
        onChange: (e) => onChange({
          ...filters,
          style: e.target.value || null
        }),
        children: /* @__PURE__ */ jsx("option", { value: "", children: "Style" })
      }
    )
  ] });
};
var FeaturedRow = ({
  plans,
  onPlanSelect
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-featured-row", children: [
    /* @__PURE__ */ jsx("h2", { className: "dv-featured-row__title", children: "Featured Plans" }),
    /* @__PURE__ */ jsx("div", { className: "dv-featured-row__scroll", children: plans.map((plan) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "dv-featured-row__item",
        onClick: () => onPlanSelect(plan),
        children: plan.title
      },
      plan.id
    )) })
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
  planId: _planId,
  imageUrl: _imageUrl,
  onSwap
}) => {
  return /* @__PURE__ */ jsx("div", { className: "dv-style-swap-buttons", children: DEFAULT_STYLE_PRESETS.map((preset) => /* @__PURE__ */ jsx(
    "button",
    {
      className: "dv-style-swap-btn",
      onClick: () => onSwap(preset),
      title: preset.description,
      children: preset.label
    },
    preset.id
  )) });
};
var FloorPlanEditor = ({
  planId: _planId,
  imageUrl: _imageUrl
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "dv-floor-plan-editor", children: [
    /* @__PURE__ */ jsx("h3", { className: "dv-floor-plan-editor__title", children: "Edit Floor Plan" }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        className: "dv-floor-plan-editor__input",
        placeholder: "Describe changes to the floor plan..."
      }
    ),
    /* @__PURE__ */ jsx("button", { className: "dv-floor-plan-editor__submit", children: "Apply Changes" })
  ] });
};
var SimilarPlans = ({
  currentPlan,
  plans,
  onPlanSelect
}) => {
  const similar = plans.filter((p) => p.id !== currentPlan.id);
  return /* @__PURE__ */ jsxs("div", { className: "dv-similar-plans", children: [
    /* @__PURE__ */ jsx("h3", { className: "dv-similar-plans__title", children: "Similar Plans" }),
    /* @__PURE__ */ jsx("div", { className: "dv-similar-plans__row", children: similar.map((plan) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "dv-similar-plans__item",
        onClick: () => onPlanSelect(plan),
        children: plan.title
      },
      plan.id
    )) })
  ] });
};
var FavoriteButton = ({
  planId: _planId,
  size = "md"
}) => {
  return /* @__PURE__ */ jsx("button", { className: `dv-favorite-btn dv-favorite-btn--${size}`, children: /* @__PURE__ */ jsx("span", { className: "dv-favorite-btn__icon" }) });
};

// src/api/client.ts
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
  async styleSwap(planId, preset, sessionId) {
    return this.post(
      `${this.baseUrl}/api/style-swap`,
      { planId, preset, sessionId }
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
      { ...data, sessionId, builderSlug }
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
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `GET ${url} failed (${res.status}): ${body}`
        );
      }
      return await res.json();
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`GET ${url} failed: ${String(err)}`);
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
        const text2 = await res.text();
        throw new Error(
          `POST ${url} failed (${res.status}): ${text2}`
        );
      }
      const text = await res.text();
      if (!text) return void 0;
      return JSON.parse(text);
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`POST ${url} failed: ${String(err)}`);
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
function getOrCreateAnonymousId() {
  if (typeof window === "undefined") return generateId();
  try {
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
  const [isCaptured, setCaptured] = useState(false);
  const [sessionId, setSessionId] = useState(null);
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
      if (filters.category !== null && plan.category !== filters.category)
        return false;
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
function useAIInteractions() {
  const {
    api,
    config,
    isCaptured,
    anonymousId,
    sessionId,
    currentPlan,
    addModification
  } = useDesignVaultContext();
  const maxFree = config.maxFreeInteractions ?? 1;
  const hardLimit = maxFree + 3;
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(
    null
  );
  const [interactionCount, setInteractionCount] = useState(0);
  const [error, setError] = useState(null);
  const needsCapture = interactionCount >= maxFree && !isCaptured;
  const effectiveSessionId = sessionId ?? anonymousId;
  const handleStyleSwap = useCallback(
    async (planId, preset) => {
      if (interactionCount >= hardLimit) {
        setError("Interaction limit reached");
        return null;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const result = await api.styleSwap(
          planId,
          preset,
          effectiveSessionId
        );
        setLastResult(result);
        setInteractionCount((c) => c + 1);
        if (result.success && result.resultUrl) {
          addModification({
            type: "style_swap",
            prompt: null,
            stylePreset: preset,
            resultUrl: result.resultUrl,
            originalUrl: currentPlan?.image_url ?? "",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      api,
      effectiveSessionId,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.image_url
    ]
  );
  const handleFloorPlanEdit = useCallback(
    async (planId, prompt, currentUrl) => {
      if (interactionCount >= hardLimit) {
        setError("Interaction limit reached");
        return null;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const result = await api.floorPlanEdit(
          planId,
          prompt,
          effectiveSessionId,
          currentUrl
        );
        setLastResult(result);
        setInteractionCount((c) => c + 1);
        if (result.success && result.resultUrl) {
          addModification({
            type: "floor_plan_edit",
            prompt,
            stylePreset: null,
            resultUrl: result.resultUrl,
            originalUrl: currentUrl ?? currentPlan?.floor_plan_url ?? "",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      api,
      effectiveSessionId,
      interactionCount,
      hardLimit,
      addModification,
      currentPlan?.floor_plan_url
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
    isProcessing,
    lastResult,
    needsCapture,
    interactionCount,
    error
  };
}
function useSession() {
  const {
    api,
    config,
    anonymousId,
    sessionStartTime,
    isCaptured,
    sessionId,
    setSessionId,
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
          const { sessionId: newId } = await api.createSession(
            plan.id,
            config.builderSlug,
            anonymousId
          );
          setSessionId(newId);
        } catch {
        }
      }
    },
    [
      api,
      config.builderSlug,
      anonymousId,
      sessionId,
      setSessionId,
      ctxSetCurrentPlan,
      addPlanViewed
    ]
  );
  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / 1e3);
  }, [sessionStartTime]);
  return {
    session,
    addModification,
    setCurrentPlan,
    plansViewed,
    getSessionDuration
  };
}

// src/utils/tracking.ts
function trackPageView(_builderSlug, _anonymousId, _trackingEndpoint) {
}
function trackEvent(_event, _properties, _trackingEndpoint) {
}
function fireMetaPixelEvent(_pixelId, _eventName, _params) {
}

// src/hooks/useLeadCapture.ts
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
        plansViewed: plansViewed.length
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

// src/utils/cache.ts
var DEFAULT_TTL_MS = 5 * 60 * 1e3;
var ClientCache = class {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.store = /* @__PURE__ */ new Map();
    this.ttl = ttlMs;
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key, data) {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttl });
  }
  invalidate(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
};

export { AIToolsPanel, ArchiveGrid, CategoryTiles, ClientCache, DEFAULT_STYLE_PRESETS, DesignVault, DesignVaultAPI, DesignVaultContext, DesignVaultProvider, FavoriteButton, FeaturedRow, FilterBar, FloorPlanEditor, LeadCaptureModal, PlanCard, PlanDetail, SimilarPlans, StyleSwapButtons, fireMetaPixelEvent, trackEvent, trackPageView, useAIInteractions, useDesignVaultContext, useFavorites, useLeadCapture, usePlans, useSession };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map