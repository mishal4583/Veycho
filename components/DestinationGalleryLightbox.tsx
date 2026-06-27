"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

const DARK    = "#071821";
const SURFACE = "#0b2c39";
const GOLD    = "#edb63f";
const CREAM   = "#f4ead6";
const MUTED   = "#8aa1ab";

interface Props { images: string[]; title: string }

/* ── icons ──────────────────────────────────────────────────── */
const ChevLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const CloseX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ZoomIn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

/* ── shared nav button style ─────────────────────────────────── */
const navBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 44, height: 44, borderRadius: "50%",
  background: SURFACE, color: CREAM,
  border: `2px solid ${GOLD}`,
  cursor: "pointer", flexShrink: 0,
  transition: "background .2s, color .2s",
};

/* ── individual grid thumbnail ───────────────────────────────── */
function Thumb({
  src, alt, onClick, aspectRatio = "4/3",
  gridColumn, gridRow, overlay,
}: {
  src: string; alt: string; onClick: () => void;
  aspectRatio?: string;
  gridColumn?: string; gridRow?: string;
  overlay?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={alt}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", padding: 0, border: "none", background: "none",
        cursor: "zoom-in", overflow: "hidden", borderRadius: 10,
        aspectRatio, width: "100%", position: "relative",
        gridColumn, gridRow,
      }}
    >
      <img
        src={src} alt={alt} loading="lazy"
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          transition: "transform .4s ease",
          transform: hovered ? "scale(1.06)" : "scale(1)",
        }}
      />
      {/* gold shimmer overlay on hover */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 10,
        background: `rgba(237,182,63,${hovered ? 0.18 : 0})`,
        transition: "background .3s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {hovered && !overlay && (
          <span style={{
            background: SURFACE, color: GOLD, borderRadius: "50%",
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${GOLD}`, boxShadow: "0 4px 16px rgba(0,0,0,.4)",
          }}>
            <ZoomIn />
          </span>
        )}
        {overlay}
      </div>
    </button>
  );
}

/* ── main component ──────────────────────────────────────────── */
export default function DestinationGalleryLightbox({ images, title }: Props) {
  const [active, setActive]     = useState<number | null>(null);
  const [visible, setVisible]   = useState(true);
  const touchStartX             = useRef<number | null>(null);
  const thumbsRef               = useRef<HTMLDivElement>(null);
  const GRID_MAX                = 5; // max shown in grid; rest accessible via lightbox

  /* ── lightbox navigation ── */
  const goTo = useCallback((i: number) => {
    setVisible(false);
    setTimeout(() => { setActive(i); setVisible(true); }, 160);
  }, []);

  const open  = useCallback((i: number) => { setActive(i); setVisible(true); }, []);
  const close = useCallback(() => setActive(null), []);
  const prev  = useCallback(() => { if (active === null) return; goTo((active - 1 + images.length) % images.length); }, [active, images.length, goTo]);
  const next  = useCallback(() => { if (active === null) return; goTo((active + 1) % images.length); }, [active, images.length, goTo]);

  /* ── keyboard ── */
  useEffect(() => {
    if (active === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape")      close();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [active, close, prev, next]);

  /* ── scroll lock ── */
  useEffect(() => {
    if (active === null) return;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [active]);

  /* ── auto-scroll thumbnail strip ── */
  useEffect(() => {
    if (active === null || !thumbsRef.current) return;
    const el = thumbsRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  if (!images.length) return null;

  const shown = images.slice(0, GRID_MAX);
  const extra = images.length - GRID_MAX;

  /* ── grid layout by image count ── */
  const renderGrid = () => {
    const n = shown.length;

    if (n === 1) {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <Thumb src={shown[0]} alt={`${title} — photo 1`} onClick={() => open(0)} aspectRatio="16/9" />
        </div>
      );
    }

    if (n === 2) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {shown.map((src, i) => (
            <Thumb key={i} src={src} alt={`${title} — photo ${i + 1}`} onClick={() => open(i)} aspectRatio="4/3" />
          ))}
        </div>
      );
    }

    if (n === 3) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: 8 }}>
          {/* top: panoramic hero */}
          <Thumb src={shown[0]} alt={`${title} — photo 1`} onClick={() => open(0)}
            aspectRatio="21/9" gridColumn="1 / 3" />
          {/* bottom row */}
          <Thumb src={shown[1]} alt={`${title} — photo 2`} onClick={() => open(1)} aspectRatio="4/3" />
          <Thumb src={shown[2]} alt={`${title} — photo 3`} onClick={() => open(2)} aspectRatio="4/3" />
        </div>
      );
    }

    if (n === 4) {
      // Left: large portrait spanning 3 rows; Right: 3 stacked (editorial layout)
      return (
        <div style={{ display: "grid", gridTemplateColumns: "55% 1fr", gridTemplateRows: "repeat(3, auto)", gap: 8 }}>
          <button
            onClick={() => open(0)}
            aria-label={`${title} — photo 1`}
            style={{
              gridColumn: "1", gridRow: "1 / 4",
              display: "block", padding: 0, border: "none", background: "none",
              cursor: "zoom-in", overflow: "hidden", borderRadius: 10, position: "relative",
            }}
          >
            <img src={shown[0]} alt={`${title} — photo 1`} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(237,182,63,0)", transition: "background .3s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(237,182,63,.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(237,182,63,0)")}
            />
          </button>
          <Thumb src={shown[1]} alt={`${title} — photo 2`} onClick={() => open(1)} aspectRatio="4/3" />
          <Thumb src={shown[2]} alt={`${title} — photo 3`} onClick={() => open(2)} aspectRatio="4/3" />
          <Thumb src={shown[3]} alt={`${title} — photo 4`} onClick={() => open(3)} aspectRatio="4/3" />
        </div>
      );
    }

    // 5 images: panoramic hero + 4-grid below
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "auto auto", gap: 8 }}>
        {/* hero full-width */}
        <Thumb src={shown[0]} alt={`${title} — photo 1`} onClick={() => open(0)}
          aspectRatio="21/9" gridColumn="1 / 5" />
        {/* bottom 4 */}
        {shown.slice(1).map((src, j) => {
          const i = j + 1;
          const isLast = i === shown.length - 1 && extra > 0;
          return (
            <Thumb key={i} src={src} alt={`${title} — photo ${i + 1}`} onClick={() => open(i)}
              aspectRatio="4/3"
              overlay={isLast && extra > 0 ? (
                <span style={{
                  position: "absolute", inset: 0, background: "rgba(7,24,33,.72)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 10, flexDirection: "column", gap: 4,
                }}>
                  <span style={{ fontFamily: "var(--font-anton), sans-serif", color: GOLD, fontSize: 28, lineHeight: 1 }}>+{extra}</span>
                  <span style={{ fontFamily: "var(--font-baloo), sans-serif", color: CREAM, fontSize: 11, letterSpacing: ".08em" }}>MORE</span>
                </span>
              ) : undefined}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* Mobile: override grid → horizontal snap carousel */
        @media (max-width: 640px) {
          .dgl-grid { display: none !important; }
          .dgl-carousel { display: flex !important; }
          /* Hide thumbnail strip in lightbox on mobile */
          .dgl-thumbs { display: none !important; }
          .dgl-nav-btn { width: 38px !important; height: 38px !important; }
        }
        @media (min-width: 641px) {
          .dgl-carousel { display: none !important; }
        }
        .dgl-carousel::-webkit-scrollbar { display: none; }
        .dgl-carousel { scrollbar-width: none; }
        .dgl-thumbs::-webkit-scrollbar { height: 4px; }
        .dgl-thumbs::-webkit-scrollbar-track { background: rgba(255,255,255,.05); }
        .dgl-thumbs::-webkit-scrollbar-thumb { background: ${GOLD}; border-radius: 2px; }
        .dgl-nav-btn:hover { background: ${GOLD} !important; color: ${DARK} !important; }
      `}</style>

      {/* ── Desktop grid ── */}
      <div className="dgl-grid">
        {renderGrid()}
        {extra > 0 && shown.length < 5 && (
          <button onClick={() => open(GRID_MAX - 1)}
            style={{
              marginTop: 8, width: "100%", padding: "10px",
              background: "transparent", border: `1px solid rgba(237,182,63,.3)`,
              borderRadius: 8, color: GOLD,
              fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 13,
              cursor: "pointer", letterSpacing: ".06em",
            }}>
            + {extra} more photo{extra > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* ── Mobile carousel ── */}
      <div className="dgl-carousel" style={{
        overflowX: "auto", scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch" as never,
        gap: 12, padding: "0 20px",
        alignItems: "stretch",
      }}>
        {images.map((src, i) => (
          <button key={i} onClick={() => open(i)}
            aria-label={`${title} — photo ${i + 1}`}
            style={{
              scrollSnapAlign: "center", flexShrink: 0,
              width: "78vw", aspectRatio: "4/3",
              padding: 0, border: "none", background: "none",
              cursor: "zoom-in", borderRadius: 12, overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,.3)",
            }}>
            <img src={src} alt={`${title} — photo ${i + 1}`} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
        {/* right padding spacer */}
        <div style={{ flexShrink: 0, width: 8 }} />
      </div>
      {/* mobile dots */}
      <div className="dgl-carousel" style={{
        overflowX: "hidden", gap: 6, padding: "10px 0 0",
        justifyContent: "center", pointerEvents: "none",
      }}>
        {images.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: i === (active ?? 0) ? GOLD : MUTED,
            transition: "background .2s",
          }} />
        ))}
      </div>

      {/* ── Lightbox ── */}
      {active !== null && createPortal(
        <div
          role="dialog" aria-modal aria-label={`${title} gallery`}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(7,24,33,.97)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
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
          {/* top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", zIndex: 2,
            background: "linear-gradient(180deg, rgba(7,24,33,.85) 0%, transparent 100%)",
          }}>
            {/* title + counter */}
            <div>
              <div style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, color: CREAM, fontSize: 14 }}>
                {title}
              </div>
              <div style={{ fontFamily: "var(--font-baloo), sans-serif", color: GOLD, fontSize: 12, letterSpacing: ".08em" }}>
                {active + 1} / {images.length}
              </div>
            </div>
            {/* close */}
            <button onClick={close} aria-label="Close" className="dgl-nav-btn" style={navBtn}>
              <CloseX />
            </button>
          </div>

          {/* main image */}
          <div onClick={(e) => e.stopPropagation()} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", padding: "80px 72px 16px",
          }}>
            <img
              key={active}
              src={images[active]}
              alt={`${title} — photo ${active + 1}`}
              style={{
                maxWidth: "100%", maxHeight: "100%",
                objectFit: "contain", borderRadius: 8,
                boxShadow: "0 32px 80px rgba(0,0,0,.6)",
                display: "block",
                opacity: visible ? 1 : 0,
                transition: "opacity .15s ease",
              }}
            />
          </div>

          {/* prev / next */}
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo" className="dgl-nav-btn"
                style={{ ...navBtn, position: "absolute", left: 16 }}>
                <ChevLeft />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo" className="dgl-nav-btn"
                style={{ ...navBtn, position: "absolute", right: 16 }}>
                <ChevRight />
              </button>
            </>
          )}

          {/* thumbnail strip (desktop only) */}
          {images.length > 1 && (
            <div
              ref={thumbsRef}
              className="dgl-thumbs"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex", gap: 8, overflowX: "auto",
                padding: "12px 20px 16px", width: "100%",
                maxWidth: 900, alignSelf: "center",
              }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  style={{
                    flexShrink: 0, width: 72, height: 52,
                    padding: 0, border: `2px solid ${i === active ? GOLD : "transparent"}`,
                    borderRadius: 6, overflow: "hidden", cursor: "pointer",
                    opacity: i === active ? 1 : 0.55,
                    transition: "opacity .2s, border-color .2s",
                  }}
                >
                  <img src={src} alt="" loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
