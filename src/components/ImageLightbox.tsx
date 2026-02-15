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

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset on open/close or src change
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
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

  // Clamp translate so image doesn't go off screen
  const clampTranslate = useCallback(
    (x: number, y: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const img = imgRef.current;
      if (!img) return { x, y };
      const rect = img.getBoundingClientRect();
      const imgW = rect.width / s; // unscaled width
      const imgH = rect.height / s;
      const maxX = ((s - 1) * imgW) / 2;
      const maxY = ((s - 1) * imgH) / 2;
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
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.002));
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    []
  );

  // Double-click toggle zoom
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    },
    [scale]
  );

  // Mouse drag pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      e.preventDefault();
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [scale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
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

  // Touch handlers for pinch-to-zoom and drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1 && scale > 1) {
        dragging.current = true;
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
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        lastPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        setTranslate((prev) => clampTranslate(prev.x + dx, prev.y + dy, scale));
      }
    },
    [scale, clampTranslate]
  );

  const handleTouchEnd = useCallback(() => {
    dragging.current = false;
    lastPinchDist.current = null;
  }, []);

  // Zoom controls
  const zoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP));
    },
    []
  );

  const zoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, prev - ZOOM_STEP);
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    []
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the overlay background (not zoomed in)
      if (scale <= 1 && e.target === e.currentTarget) onClose();
    },
    [scale, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="dv-lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
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

          {/* Zoom controls */}
          <div className="dv-lightbox-overlay__controls">
            <button
              className="dv-lightbox-overlay__zoom-btn"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="dv-lightbox-overlay__zoom-level">
              {Math.round(scale * 100)}%
            </span>
            <button
              className="dv-lightbox-overlay__zoom-btn"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Image */}
          <img
            ref={imgRef}
            className="dv-lightbox-overlay__img"
            src={src}
            alt={alt}
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              cursor: scale > 1 ? "grab" : "zoom-in",
              transition: dragging.current ? "none" : "transform 0.15s ease",
            }}
            onClick={handleDoubleClick}
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
