import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { DesignVaultProvider, useDesignVaultContext } from "../hooks/useDesignVault";
import { usePlans } from "../hooks/usePlans";
import { ArchiveGrid } from "./ArchiveGrid";
import { PlanDetail } from "./PlanDetail";
import { trackPageView } from "../utils/tracking";
import type { DesignVaultConfig, DesignVaultProps, FloorPlan } from "../types";

// ── Brand color helpers ─────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex
    .replace("#", "")
    .match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const out = rgb.map((c) =>
    Math.min(255, Math.round(c + (255 - c) * amount))
  );
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function brandVars(
  color: string,
  colorLight?: string
): React.CSSProperties {
  const rgb = hexToRgb(color);
  return {
    "--dv-brand": color,
    "--dv-brand-light": colorLight ?? lighten(color, 0.25),
    "--dv-brand-dim": rgb
      ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`
      : "rgba(184, 134, 11, 0.15)",
  } as React.CSSProperties;
}

// ── Inner component (lives inside provider for hook access) ──

function DesignVaultInner({ config }: { config: DesignVaultConfig }) {
  const { anonymousId } = useDesignVaultContext();
  const { plans } = usePlans();

  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);

  // Keep a ref to the last selected plan so AnimatePresence can exit-animate
  const lastPlanRef = useRef<FloorPlan | null>(null);
  if (selectedPlan) {
    lastPlanRef.current = selectedPlan;
  }

  // Track page view on mount
  useEffect(() => {
    if (config.trackingEndpoint) {
      trackPageView(config.builderSlug, anonymousId, config.trackingEndpoint);
    }
  }, [config.trackingEndpoint, config.builderSlug, anonymousId]);

  // URL param deep linking: ?plan=<title> or ?plan=<id>
  useEffect(() => {
    if (plans.length === 0 || selectedPlan) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (!planParam) return;

    const decoded = decodeURIComponent(planParam);
    const match = plans.find(
      (p) =>
        p.title.toLowerCase() === decoded.toLowerCase() || p.id === decoded
    );
    if (match) setSelectedPlan(match);
  }, [plans, selectedPlan]);

  const handlePlanSelect = useCallback((plan: FloorPlan) => {
    setSelectedPlan(plan);
  }, []);

  const handleDetailClose = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  const handlePlanSwitch = useCallback((plan: FloorPlan) => {
    setSelectedPlan(plan);
  }, []);

  // Use lastPlanRef so PlanDetail stays mounted during exit animation
  const detailPlan = selectedPlan ?? lastPlanRef.current;

  return (
    <>
      {/* Hero */}
      <header className="dv-hero">
        <div className="dv-hero__badge">
          <Sparkles size={13} />
          AI-Powered Design
        </div>
        <h1 className="dv-hero__title">Design Your Dream Home</h1>
        <p className="dv-hero__subtitle">Browse. Customize. Build.</p>
        <p className="dv-hero__desc">
          Explore {plans.length > 0 ? `${plans.length}+` : ""} custom floor
          plans and use AI to make them yours
        </p>
      </header>

      {/* Archive grid */}
      <main className="dv-container">
        <ArchiveGrid onPlanSelect={handlePlanSelect} />
      </main>

      {/* Plan detail overlay */}
      {detailPlan && (
        <PlanDetail
          plan={detailPlan}
          isOpen={!!selectedPlan}
          onClose={handleDetailClose}
          config={config}
          allPlans={plans}
          onPlanSwitch={handlePlanSwitch}
        />
      )}

      {/* Attribution footer */}
      {config.attribution?.show && (
        <footer className="dv-attribution">
          <span>Designed by </span>
          <a
            href={config.attribution.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {config.attribution.text}
          </a>
        </footer>
      )}
    </>
  );
}

// ── Main export ─────────────────────────────────────────────

export const DesignVault: React.FC<DesignVaultProps> = ({
  config,
  className,
}) => {
  return (
    <DesignVaultProvider config={config}>
      <div
        className={`dv-root ${className ?? ""}`}
        style={brandVars(config.brandColor, config.brandColorLight)}
      >
        <DesignVaultInner config={config} />
      </div>
    </DesignVaultProvider>
  );
};
