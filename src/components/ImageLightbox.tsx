import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;
const ZOOM_LABEL_TIMEOUT = 1500;

function isTouchDevice() {
  return typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [showZoomLabel, setShowZoomLabel] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const lastTapPos = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  // Reset on open/close or src change
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setShowZoomLabel(false);
  }, [isOpen, src]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Auto-hide zoom label
  const flashZoomLabel = useCallback(() => {
    setShowZoomLabel(true);
    if (zoomLabelTimer.current) clearTimeout(zoomLabelTimer.current);
    zoomLabelTimer.current = setTimeout(() => setShowZoomLabel(false), ZOOM_LABEL_TIMEOUT);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (zoomLabelTimer.current) clearTimeout(zoomLabelTimer.current);
    };
  }, []);

  // Clamp translate so image doesn't go off screen
  const clampTranslate = useCallback(
    (x: number, y: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const img = imgRef.current;
      if (!img) return { x, y };
      const rect = img.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const overflowX = Math.max(0, (rect.width - viewW) / 2 / s);
      const overflowY = Math.max(0, (rect.height - viewH) / 2 / s);
      const maxX = Math.max(overflowX, ((s - 1) * rect.width / s) / 2);
      const maxY = Math.max(overflowY, ((s - 1) * rect.height / s) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    []
  );

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      flashZoomLabel();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.002));
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    [flashZoomLabel]
  );

  // Double-click/tap toggle zoom
  const zoomToPoint = useCallback(
    (clientX: number, clientY: number) => {
      flashZoomLabel();
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        const img = imgRef.current;
        if (img) {
          const rect = img.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const offsetX = (cx - clientX) * 1;
          const offsetY = (cy - clientY) * 1;
          setScale(2.5);
          setTranslate(clampTranslate(offsetX, offsetY, 2.5));
        } else {
          setScale(2.5);
        }
      }
    },
    [scale, flashZoomLabel, clampTranslate]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      zoomToPoint(e.clientX, e.clientY);
    },
    [zoomToPoint]
  );

  // Mouse drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      dragging.current = true;
      didDrag.current = false;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      didDrag.current = true;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTranslate((prev) => clampTranslate(prev.x + dx, prev.y + dy, scale));
    },
    [scale, clampTranslate]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Touch handlers for pinch-to-zoom, drag, single-tap close, double-tap zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        if (scale > 1) {
          dragging.current = true;
          didDrag.current = false;
        }
        lastPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [scale]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault();
        flashZoomLabel();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = dist / lastPinchDist.current;
        lastPinchDist.current = dist;
        setScale((prev) => {
          const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * delta));
          if (next <= 1) setTranslate({ x: 0, y: 0 });
          return next;
        });
      } else if (e.touches.length === 1 && dragging.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        didDrag.current = true;
        lastPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        setTranslate((prev) => clampTranslate(prev.x + dx, prev.y + dy, scale));
      }
    },
    [scale, clampTranslate, flashZoomLabel]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const wasDrag = didDrag.current;
      dragging.current = false;
      didDrag.current = false;
      lastPinchDist.current = null;

      // Only process single-finger taps (no remaining touches, wasn't a drag)
      if (e.changedTouches.length === 1 && e.touches.length === 0 && !wasDrag) {
        const now = Date.now();
        const touch = e.changedTouches[0];
        const timeDelta = now - lastTapTime.current;
        const posDelta = Math.hypot(
          touch.clientX - lastTapPos.current.x,
          touch.clientY - lastTapPos.current.y
        );

        if (timeDelta < 300 && posDelta < 30) {
          // Double tap — zoom to tap point
          lastTapTime.current = 0;
          zoomToPoint(touch.clientX, touch.clientY);
        } else {
          // Record for potential double tap
          lastTapTime.current = now;
          lastTapPos.current = { x: touch.clientX, y: touch.clientY };

          // Single tap at scale 1 → close after short delay (allows double-tap)
          if (scale <= 1) {
            const tapTimer = setTimeout(() => {
              if (Date.now() - lastTapTime.current >= 280) {
                onClose();
              }
            }, 300);
            // Store cleanup (cleared if double-tap fires)
            return () => clearTimeout(tapTimer);
          }
        }
      }
    },
    [scale, onClose, zoomToPoint]
  );

  // Zoom button controls (desktop only)
  const zoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flashZoomLabel();
      setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
    },
    [flashZoomLabel]
  );

  const zoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      flashZoomLabel();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, prev - ZOOM_STEP);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    [flashZoomLabel]
  );

  // Overlay click — close on background click at scale 1
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1 && e.target === e.currentTarget) onClose();
    },
    [scale, onClose]
  );

  // Image click at scale 1 on desktop → close (matches Barnhaus behavior)
  const handleImgClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't close if we were dragging
      if (didDrag.current) return;
      e.stopPropagation();
      // On desktop at scale 1, single click closes
      if (scale <= 1 && !isTouch) {
        onClose();
      }
    },
    [scale, isTouch, onClose]
  );

  const showControls = scale > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dv-lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ touchAction: scale > 1 ? "none" : "manipulation" }}
          onClick={handleOverlayClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Close button */}
          <button
            className="dv-lightbox-overlay__close"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Zoom controls — only visible when zoomed in */}
          {showControls && (
            <div
              className="dv-lightbox-overlay__controls"
              style={{ opacity: showZoomLabel ? 1 : 0.6 }}
            >
              {!isTouch && (
                <button
                  className="dv-lightbox-overlay__zoom-btn"
                  onClick={zoomOut}
                  disabled={scale <= MIN_SCALE}
                  aria-label="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
              )}
              <span
                className="dv-lightbox-overlay__zoom-level"
                style={{ opacity: showZoomLabel ? 1 : 0 }}
              >
                {scale.toFixed(1)}x
              </span>
              {!isTouch && (
                <button
                  className="dv-lightbox-overlay__zoom-btn"
                  onClick={zoomIn}
                  disabled={scale >= MAX_SCALE}
                  aria-label="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
              )}
            </div>
          )}

          {/* Image */}
          <img
            ref={imgRef}
            className="dv-lightbox-overlay__img"
            src={src}
            alt={alt}
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              cursor: scale > 1 ? (dragging.current ? "grabbing" : "grab") : "default",
              transition: dragging.current ? "none" : "transform 0.15s ease",
              touchAction: scale > 1 ? "none" : "manipulation",
            }}
            onClick={handleImgClick}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
