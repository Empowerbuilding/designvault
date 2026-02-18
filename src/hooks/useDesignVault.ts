import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { DesignVaultAPI } from "../api/client";
import type { DesignVaultConfig, FloorPlan, Modification } from "../types";

// ── Anonymous ID ─────────────────────────────────────────────

const ANON_ID_KEY = "dv-anonymous-id";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const CRM_VISITOR_KEY = "_crm_visitor_id";
const CAPTURED_KEY = "dv-captured";

function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return generateId();
  try {
    // Prefer the CRM tracking script's visitor ID so page views link to the contact
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

// ── Context ──────────────────────────────────────────────────

export interface DesignVaultContextValue {
  config: DesignVaultConfig;
  api: DesignVaultAPI;
  anonymousId: string;
  sessionStartTime: number;

  // Lead capture gate
  isCaptured: boolean;
  setCaptured: (captured: boolean) => void;

  // Session tracking (shared across hooks)
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  initialInteractionCount: number;
  setInitialInteractionCount: (count: number) => void;
  modifications: Modification[];
  addModification: (mod: Modification) => void;
  plansViewed: string[];
  addPlanViewed: (planId: string) => void;
  currentPlan: FloorPlan | null;
  setCurrentPlan: (plan: FloorPlan | null) => void;
  stylePref: string | null;
  setStylePref: (pref: string | null) => void;
}

export const DesignVaultContext =
  createContext<DesignVaultContextValue | null>(null);

export function useDesignVaultContext(): DesignVaultContextValue {
  const ctx = useContext(DesignVaultContext);
  if (!ctx) {
    throw new Error(
      "useDesignVaultContext must be used within a DesignVaultProvider"
    );
  }
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────

export interface DesignVaultProviderProps {
  config: DesignVaultConfig;
  children: React.ReactNode;
}

export function DesignVaultProvider({
  config,
  children,
}: DesignVaultProviderProps) {
  const api = useMemo(
    () => new DesignVaultAPI(config.apiBaseUrl),
    [config.apiBaseUrl]
  );

  const [anonymousId] = useState(getOrCreateAnonymousId);
  const sessionStartRef = useRef(Date.now());

  const [isCaptured, setIsCaptured] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(CAPTURED_KEY) === "1"; } catch { return false; }
  });
  const setCaptured = useCallback((captured: boolean) => {
    setIsCaptured(captured);
    try { if (captured) localStorage.setItem(CAPTURED_KEY, "1"); } catch { /* noop */ }
  }, []);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialInteractionCount, setInitialInteractionCount] = useState(0);
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [plansViewed, setPlansViewed] = useState<string[]>([]);
  const [currentPlan, setCurrentPlan] = useState<FloorPlan | null>(null);
  const [stylePref, setStylePref] = useState<string | null>(null);

  const addModification = useCallback((mod: Modification) => {
    setModifications((prev) => [...prev, mod]);
  }, []);

  const addPlanViewed = useCallback((planId: string) => {
    setPlansViewed((prev) =>
      prev.includes(planId) ? prev : [...prev, planId]
    );
  }, []);

  const value = useMemo<DesignVaultContextValue>(
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
      setStylePref,
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
      addPlanViewed,
    ]
  );

  return React.createElement(
    DesignVaultContext.Provider,
    { value },
    children
  );
}
