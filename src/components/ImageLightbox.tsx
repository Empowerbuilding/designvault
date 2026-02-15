import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  images?: { url: string; label: string }[];
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt,
  isOpen,
  onClose,
  images,
  activeIndex = 0,
  onIndexChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Transform state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Swipe-to-navigate tracking (only at 1x zoom)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeDeltaRef = useRef(0);
  const wasPinchingRef = useRef(false);

  const canSwipe = !!images && images.length > 1 && !!onIndexChange;
  const displaySrc = images?.[activeIndex]?.url ?? src;

  // Reset on open/close or image change
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [isOpen, activeIndex]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Clamp translate so image edges don't go past viewport center
  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number) => {
      const img = imgRef.current;
      const container = containerRef.current;
      if (!img || !container) return { x: tx, y: ty };

      const imgW = img.naturalWidth || img.offsetWidth;
      const imgH = img.naturalHeight || img.offsetHeight;
      const cW = container.clientWidth;
      const cH = container.clientHeight;

      // Compute displayed image size (object-fit: contain)
      const imgAspect = imgW / imgH;
      const cAspect = cW / cH;
      let displayW: number, displayH: number;
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
        y: Math.min(maxY, Math.max(-maxY, ty)),
      };
    },
    []
  );

  // Get distance between two touches
  const getTouchDist = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (t1: React.Touch, t2: React.Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
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
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2) {
        // Pinch zoom
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        if (lastPinchDistRef.current != null) {
          const ratio = dist / lastPinchDistRef.current;
          setScale((prev) => {
            const next = Math.min(5, Math.max(1, prev * ratio));
            // If zooming back to 1, reset translate
            if (next <= 1) {
              setTranslate({ x: 0, y: 0 });
            }
            return next;
          });
        }

        if (lastPinchCenterRef.current != null) {
          const dx = center.x - lastPinchCenterRef.current.x;
          const dy = center.y - lastPinchCenterRef.current.y;
          setTranslate((prev) =>
            clampTranslate(prev.x + dx, prev.y + dy, scale)
          );
        }

        lastPinchDistRef.current = dist;
        lastPinchCenterRef.current = center;
      } else if (e.touches.length === 1) {
        if (scale > 1) {
          // Single-finger pan (only when zoomed)
          if (lastTouchRef.current) {
            const dx = e.touches[0].clientX - lastTouchRef.current.x;
            const dy = e.touches[0].clientY - lastTouchRef.current.y;
            setTranslate((prev) =>
              clampTranslate(prev.x + dx, prev.y + dy, scale)
            );
          }
          lastTouchRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        } else if (canSwipe && swipeStartRef.current && !wasPinchingRef.current) {
          // Track horizontal swipe delta at 1x zoom
          swipeDeltaRef.current =
            e.touches[0].clientX - swipeStartRef.current.x;
        }
      }
    },
    [scale, clampTranslate, canSwipe]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        // Check for swipe-to-navigate at 1x zoom
        if (
          canSwipe &&
          scale <= 1.1 &&
          !wasPinchingRef.current &&
          Math.abs(swipeDeltaRef.current) > 50
        ) {
          if (swipeDeltaRef.current < -50 && activeIndex < images!.length - 1) {
            onIndexChange!(activeIndex + 1);
          } else if (swipeDeltaRef.current > 50 && activeIndex > 0) {
            onIndexChange!(activeIndex - 1);
          }
          // Reset refs and skip the tap-to-close logic
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

        // Snap back to 1x if close
        if (scale < 1.1) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        }
      } else if (e.touches.length === 1) {
        // Went from pinch to single finger — start panning
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;
      }
    },
    [scale, canSwipe, activeIndex, images, onIndexChange]
  );

  // Tap to close (only when not zoomed and not swiping)
  const handleClick = useCallback(() => {
    if (scale <= 1.1) {
      onClose();
    }
  }, [scale, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dv-lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close button */}
          <button
            className="dv-lightbox-overlay__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Image container — JS handles pinch zoom + single-finger pan + swipe nav */}
          <div
            className="dv-lightbox-scroll"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
            style={{ touchAction: "none" }}
          >
            <img
              ref={imgRef}
              className="dv-lightbox-scroll__img"
              src={displaySrc}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transition: scale <= 1 ? "transform 0.2s ease" : "none",
              }}
            />
          </div>

          {/* Dot indicators */}
          {canSwipe && (
            <div className="dv-lightbox-dots">
              {images!.map((_, i) => (
                <button
                  key={i}
                  className={`dv-lightbox-dots__dot ${
                    i === activeIndex ? "dv-lightbox-dots__dot--active" : ""
                  }`}
                  onClick={() => onIndexChange!(i)}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
