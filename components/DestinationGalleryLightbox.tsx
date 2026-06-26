"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  images: string[];
  title: string;
}

export default function DestinationGalleryLightbox({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, close, prev, next]);

  // Lock scroll while lightbox is open
  useEffect(() => {
    if (activeIndex === null) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  if (!images.length) return null;

  const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : images.length === 3 ? 3 : images.length === 4 ? 2 : 3;

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .dest-lightbox-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dest-lightbox-grid button { grid-column: auto !important; aspect-ratio: 4/3 !important; }
        }
      `}</style>
      <div
        className="dest-lightbox-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
        }}
      >
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            aria-label={`View photo ${i + 1} of ${images.length} — ${title}`}
            style={{
              display: "block",
              width: "100%",
              padding: 0,
              border: "none",
              background: "none",
              cursor: "zoom-in",
              overflow: "hidden",
              borderRadius: 4,
              aspectRatio: i === 0 && images.length > 3 ? "16/9" : "4/3",
              gridColumn: i === 0 && images.length > 3 ? "1 / span 2" : undefined,
            }}
          >
            <img
              src={src}
              alt={`${title} photo ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
            />
          </button>
        ))}
      </div>

      {activeIndex !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} gallery`}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(7, 24, 33, 0.96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={close}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
              touchStartX.current = null;
            }}
          >
            {/* Close */}
            <button
              onClick={close}
              aria-label="Close lightbox"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              ✕
            </button>

            {/* Counter */}
            <span
              style={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                letterSpacing: "0.08em",
                pointerEvents: "none",
              }}
            >
              {activeIndex + 1} / {images.length}
            </span>

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
                style={{
                  position: "absolute",
                  left: 16,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ‹
              </button>
            )}

            {/* Main image */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={images[activeIndex]}
                alt={`${title} — photo ${activeIndex + 1}`}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  borderRadius: 6,
                  boxShadow: "0 25px 80px rgba(0,0,0,0.7)",
                  display: "block",
                }}
              />
            </div>

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
                style={{
                  position: "absolute",
                  right: 16,
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ›
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
