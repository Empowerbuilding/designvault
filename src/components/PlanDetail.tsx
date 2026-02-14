import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Home, Bath, Square, Check } from "lucide-react";
import { AIToolsPanel } from "./AIToolsPanel";
import { SimilarPlans } from "./SimilarPlans";
import { useSession } from "../hooks/useSession";
import type { PlanDetailProps } from "../types";

export const PlanDetail: React.FC<PlanDetailProps> = ({
  plan,
  isOpen,
  onClose,
  config,
  allPlans,
  onPlanSwitch,
}) => {
  const { setCurrentPlan } = useSession();

  const [heroUrl, setHeroUrl] = useState(plan.image_url);
  const [originalUrl, setOriginalUrl] = useState(plan.image_url);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAiResult, setHasAiResult] = useState(false);

  // Build thumbnail list
  const thumbnails = useMemo(() => {
    const thumbs: { url: string; label: string }[] = [
      { url: plan.image_url, label: "Exterior" },
    ];
    if (plan.floor_plan_url) {
      thumbs.push({ url: plan.floor_plan_url, label: "Floor Plan" });
    }
    if (plan.interior_urls) {
      plan.interior_urls.forEach((url, i) => {
        thumbs.push({ url, label: `Interior ${i + 1}` });
      });
    }
    return thumbs;
  }, [plan]);

  // Track plan view on open
  useEffect(() => {
    if (isOpen) {
      setCurrentPlan(plan);
      setHeroUrl(plan.image_url);
      setOriginalUrl(plan.image_url);
      setHasAiResult(false);
      setShowOriginal(false);
    }
  }, [isOpen, plan, setCurrentPlan]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleResult = useCallback(
    (result: {
      newUrl: string;
      originalUrl: string;
      type: "style_swap" | "floor_plan_edit";
    }) => {
      setHeroUrl(result.newUrl);
      setOriginalUrl(result.originalUrl);
      setHasAiResult(true);
      setShowOriginal(false);
    },
    []
  );

  const handlePlanSelect = useCallback(
    (newPlan: typeof plan) => {
      if (onPlanSwitch) {
        onPlanSwitch(newPlan);
      } else {
        setCurrentPlan(newPlan);
        setHeroUrl(newPlan.image_url);
        setOriginalUrl(newPlan.image_url);
        setHasAiResult(false);
        setShowOriginal(false);
      }
    },
    [onPlanSwitch, setCurrentPlan]
  );

  const displayUrl = showOriginal ? originalUrl : heroUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dv-detail-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="dv-detail-panel"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="dv-detail-panel__close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={24} />
            </button>

            {/* Hero image */}
            <div className="dv-detail-hero">
              <img
                src={displayUrl}
                alt={plan.title}
                className="dv-detail-hero__img"
              />

              {isProcessing && (
                <div className="dv-detail-hero__processing">
                  <div className="dv-detail-hero__shimmer" />
                  <span className="dv-detail-hero__processing-text">
                    AI is generating...
                  </span>
                </div>
              )}

              <div className="dv-detail-hero__gradient" />

              <div className="dv-detail-hero__info">
                <h1 className="dv-detail-hero__title">{plan.title}</h1>
                <div className="dv-detail-hero__specs">
                  <span>
                    <Home size={16} /> {plan.beds} Beds
                  </span>
                  <span>
                    <Bath size={16} /> {plan.baths} Baths
                  </span>
                  <span>
                    <Square size={16} /> {plan.area.toLocaleString()} sqft
                  </span>
                </div>
              </div>

              {/* Before/After toggle */}
              {hasAiResult && (
                <div className="dv-detail-hero__compare">
                  <button
                    className={`dv-detail-hero__compare-btn ${
                      !showOriginal
                        ? "dv-detail-hero__compare-btn--active"
                        : ""
                    }`}
                    onClick={() => setShowOriginal(false)}
                  >
                    AI Generated
                  </button>
                  <button
                    className={`dv-detail-hero__compare-btn ${
                      showOriginal
                        ? "dv-detail-hero__compare-btn--active"
                        : ""
                    }`}
                    onClick={() => setShowOriginal(true)}
                  >
                    Original
                  </button>
                </div>
              )}
            </div>

            {/* Body: grid layout */}
            <div className="dv-detail-body">
              {/* Thumbnails — left column on desktop, first on mobile */}
              {thumbnails.length > 1 && (
                <div className="dv-detail-body__thumbs">
                  <div className="dv-detail-thumbs">
                    {thumbnails.map((thumb) => (
                      <button
                        key={thumb.url}
                        className={`dv-detail-thumbs__item ${
                          heroUrl === thumb.url && !hasAiResult
                            ? "dv-detail-thumbs__item--active"
                            : ""
                        }`}
                        onClick={() => {
                          setHeroUrl(thumb.url);
                          setOriginalUrl(thumb.url);
                          setHasAiResult(false);
                          setShowOriginal(false);
                        }}
                      >
                        <img src={thumb.url} alt={thumb.label} />
                        <span className="dv-detail-thumbs__label">
                          {thumb.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Tools — right sidebar on desktop, after thumbs on mobile */}
              <div className="dv-detail-body__sidebar">
                <AIToolsPanel
                  plan={plan}
                  config={config}
                  onResult={handleResult}
                  onProcessingChange={setIsProcessing}
                />
              </div>

              {/* Main content — left column */}
              <div className="dv-detail-body__main">
                {plan.description && (
                  <p className="dv-detail-description">{plan.description}</p>
                )}

                {plan.features.length > 0 && (
                  <div className="dv-detail-features">
                    <h3 className="dv-detail-features__title">Features</h3>
                    <div className="dv-detail-features__grid">
                      {plan.features.map((feature) => (
                        <div
                          key={feature}
                          className="dv-detail-features__item"
                        >
                          <Check size={16} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Similar Plans — bottom of left column on desktop, very bottom on mobile */}
              {config.enableSimilarPlans !== false &&
                allPlans &&
                allPlans.length > 1 && (
                  <div className="dv-detail-body__similar">
                    <SimilarPlans
                      currentPlan={plan}
                      allPlans={allPlans}
                      onPlanSelect={handlePlanSelect}
                    />
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
