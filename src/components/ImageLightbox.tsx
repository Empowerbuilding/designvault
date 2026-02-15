import React, { useCallback, useEffect, useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

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

  // Center scroll position when image loads
  const handleImageLoad = () => {
    const container = scrollRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    const scrollLeft = (img.offsetWidth - container.clientWidth) / 2;
    const scrollTop = (img.offsetHeight - container.clientHeight) / 2;
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: "instant",
    });
  };

  // ── Single-finger pan via JS (touch-action: pinch-zoom gives us control) ──

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      lastTouchRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !lastTouchRef.current) return;

    const container = scrollRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const deltaX = lastTouchRef.current.x - touch.clientX;
    const deltaY = lastTouchRef.current.y - touch.clientY;

    // Let the native scroll container handle bounds naturally
    container.scrollBy(deltaX, deltaY);

    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchRef.current = null;
  }, []);

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

          {/* Scrollable container — JS handles single-finger pan */}
          <div
            className="dv-lightbox-scroll"
            ref={scrollRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              className="dv-lightbox-scroll__img"
              src={src}
              alt={alt}
              draggable={false}
              onLoad={handleImageLoad}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
