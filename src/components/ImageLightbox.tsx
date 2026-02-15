import React, { useEffect, useRef } from "react";
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

    // Center the image in the scrollable area
    const scrollLeft = (img.offsetWidth - container.clientWidth) / 2;
    const scrollTop = (img.offsetHeight - container.clientHeight) / 2;
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: "instant",
    });
  };

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

          {/* Scrollable container — native scroll handles pan */}
          <div className="dv-lightbox-scroll" ref={scrollRef}>
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
