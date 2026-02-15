import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt,
  isOpen,
  onClose,
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

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [isOpen]);

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
      lastPinchDistRef.current = null;
      lastPinchCenterRef.current = null;
    } else if (e.touches.length === 2) {
      lastTouchRef.current = null;
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
      } else if (e.touches.length === 1 && scale > 1) {
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
      }
    },
    [scale, clampTranslate]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        lastTouchRef.current = null;
        lastPinchDistRef.current = null;
        lastPinchCenterRef.current = null;

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
    [scale]
  );

  // Tap to close (only when not zoomed)
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

          {/* Image container — JS handles pinch zoom + single-finger pan */}
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
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transition: scale <= 1 ? "transform 0.2s ease" : "none",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
