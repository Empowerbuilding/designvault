import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Home, Bath, Square, Check, ArrowRight } from "lucide-react";
import { AIToolsPanel } from "./AIToolsPanel";
import { ImageLightbox } from "./ImageLightbox";
import { SimilarPlans } from "./SimilarPlans";
import { useSession } from "../hooks/useSession";
import { getSchedulerUrl } from "../utils/tracking";
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
  const panelRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Floor plan AI result state (separate from hero/exterior)
  const [floorPlanUrl, setFloorPlanUrl] = useState(plan.floor_plan_url ?? "");
  const [originalFloorPlanUrl, setOriginalFloorPlanUrl] = useState(plan.floor_plan_url ?? "");
  const [showOriginalFloorPlan, setShowOriginalFloorPlan] = useState(false);
  const [hasFloorPlanResult, setHasFloorPlanResult] = useState(false);

  // Build thumbnail list
  const thumbnails = useMemo(() => {
    const thumbs: { url: string; label: string }[] = [
      { url: plan.image_url, label: "Exterior" },
    ];
if (plan.interior_urls) {
      plan.interior_urls.forEach((url, i) => {
        thumbs.push({ url, label: `Interior ${i + 1}` });
      });
    }
    return thumbs;
  }, [plan]);

  // Derived values for the active image
  const currentOriginalUrl = thumbnails[activeIndex]?.url ?? plan.image_url;
  const currentAiUrl = aiResults[currentOriginalUrl];
  const hasAiResult = !!currentAiUrl;
  const displayUrl = showOriginal ? currentOriginalUrl : (currentAiUrl ?? currentOriginalUrl);
  const imageType: "exterior" | "interior" =
    thumbnails[activeIndex]?.label === "Exterior" ? "exterior" : "interior";

  // Track plan view on open
  useEffect(() => {
    if (isOpen) {
      setCurrentPlan(plan);
      setActiveIndex(0);
      setAiResults({});
      setShowOriginal(false);
      setFloorPlanUrl(plan.floor_plan_url ?? "");
      setOriginalFloorPlanUrl(plan.floor_plan_url ?? "");
      setHasFloorPlanResult(false);
      setShowOriginalFloorPlan(false);
      panelRef.current?.scrollTo(0, 0);
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
      if (result.type === "floor_plan_edit") {
        setFloorPlanUrl(result.newUrl);
        setOriginalFloorPlanUrl(result.originalUrl);
        setHasFloorPlanResult(true);
        setShowOriginalFloorPlan(false);
      } else {
        setAiResults((prev) => ({
          ...prev,
          [result.originalUrl]: result.newUrl,
        }));
        setShowOriginal(false);
      }
    },
    []
  );

  const handlePlanSelect = useCallback(
    (newPlan: typeof plan) => {
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

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

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
            ref={panelRef}
            className="dv-detail-panel"
            initial={{ y: isMobile ? 0 : 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isMobile ? 0 : 40, opacity: 0 }}
            transition={{ duration: isMobile ? 0.2 : 0.35, ease: "easeOut" }}
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

            {/* Scheduler button — mobile: full-width top */}
            {config.schedulerUrl && isMobile && (
              <motion.div
                className="dv-detail__scheduler-wrap dv-detail__scheduler-wrap--mobile"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
              >
                <button
                  className="dv-detail__scheduler-btn dv-detail__scheduler-btn--mobile"
                  onClick={handleSchedulerClick}
                >
                  Customize This Design
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* Scheduler button — desktop: fixed right-center pill */}
            {config.schedulerUrl && !isMobile && (
              <motion.div
                className="dv-detail__scheduler-wrap dv-detail__scheduler-wrap--desktop"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.35, ease: "easeOut" }}
              >
                <button
                  className="dv-detail__scheduler-btn dv-detail__scheduler-btn--desktop"
                  onClick={handleSchedulerClick}
                >
                  Customize This Design
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* Hero image */}
            <div className="dv-detail-hero">
              <img
                src={displayUrl}
                alt={plan.title}
                className="dv-detail-hero__img"
                onClick={() => setLightboxOpen(true)}
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
                    {thumbnails.map((thumb, index) => (
                      <button
                        key={thumb.url}
                        className={`dv-detail-thumbs__item ${
                          activeIndex === index
                            ? "dv-detail-thumbs__item--active"
                            : ""
                        }`}
                        onClick={() => {
                          setActiveIndex(index);
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
                  heroUrl={displayUrl}
                  originalHeroUrl={currentOriginalUrl}
                  imageType={imageType}
                  floorPlanUrl={showOriginalFloorPlan ? originalFloorPlanUrl : floorPlanUrl}
                  originalFloorPlanUrl={originalFloorPlanUrl}
                  hasFloorPlanResult={hasFloorPlanResult}
                  showOriginalFloorPlan={showOriginalFloorPlan}
                  onToggleFloorPlanOriginal={setShowOriginalFloorPlan}
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

            <ImageLightbox
              src={displayUrl}
              alt={plan.title}
              isOpen={lightboxOpen}
              onClose={() => setLightboxOpen(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
