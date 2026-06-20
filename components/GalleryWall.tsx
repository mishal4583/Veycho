"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Reveal from "./Reveal";

export type GalleryImage = {
  id: string;
  image_url: string;
  title: string | null;
  category: string | null;
};

/** Brand-palette mats the photos sit on — reads as a tilted, matted photo wall. */
const MATS = ["#0b2c39", "#edb63f", "#c9d6c3", "#e9c7a6", "#0f3e4d", "#ecc3ad"];
/** Gentle, deterministic per-tile tilt so the wall feels hand-pinned. */
const ROTS = [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2, -0.7, 2.6];
const RADII = [26, 32, 22, 30, 24, 34];

const chipBase: CSSProperties = {
  fontFamily: "var(--font-baloo), sans-serif",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: ".04em",
  padding: "9px 18px",
  borderRadius: 100,
  border: "2px solid #0b2c39",
  cursor: "pointer",
  background: "transparent",
  color: "#0b2c39",
  transition: "background .25s ease, color .25s ease, transform .25s ease",
  textTransform: "uppercase",
};

export default function GalleryWall({ items }: { items: GalleryImage[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.category) set.add(it.category);
    return ["All", ...Array.from(set)];
  }, [items]);

  const [active, setActive] = useState("All");
  const filtered = useMemo(
    () => (active === "All" ? items : items.filter((i) => i.category === active)),
    [items, active]
  );

  const [open, setOpen] = useState<number | null>(null);
  const count = filtered.length;

  // Lightbox: keyboard nav + freeze the page (Lenis) while open.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % count));
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    const lenis = (window as unknown as { __lenis?: { stop?: () => void; start?: () => void } }).__lenis;
    lenis?.stop?.();
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start?.();
    };
  }, [open, count]);

  // Close the lightbox when switching filters so its index can't dangle out of range.
  const selectCategory = (c: string) => {
    setActive(c);
    setOpen(null);
  };

  if (items.length === 0) return <EmptyWall />;

  const current = open === null ? null : filtered[open];

  return (
    <>
      {categories.length > 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          {categories.map((c) => {
            const on = c === active;
            return (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                style={{
                  ...chipBase,
                  background: on ? "#0b2c39" : "transparent",
                  color: on ? "#f4ead6" : "#0b2c39",
                  transform: on ? "translateY(-1px)" : "none",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* CSS-columns masonry → varied photo heights collage, fully fluid with no
          media queries (column-width auto-fits the viewport). */}
      <div style={{ columnWidth: 270, columnGap: 18 }}>
        {filtered.map((it, i) => {
          const mat = MATS[i % MATS.length];
          const rot = ROTS[i % ROTS.length];
          const radius = RADII[i % RADII.length];
          return (
            <Reveal
              key={it.id}
              y={36}
              delay={(i % 4) * 70}
              style={{ breakInside: "avoid", marginBottom: 18 }}
            >
              <button
                className="vc-gal-tile"
                onClick={() => setOpen(i)}
                style={
                  {
                    "--rot": `${rot}deg`,
                    display: "block",
                    width: "100%",
                    border: 0,
                    padding: 9,
                    cursor: "pointer",
                    background: mat,
                    borderRadius: radius,
                    position: "relative",
                    overflow: "hidden",
                    textAlign: "left",
                  } as CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image_url}
                  alt={it.title ?? "Veycho gallery photo"}
                  loading="lazy"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    borderRadius: radius - 7,
                    objectFit: "cover",
                  }}
                />

                {it.category && (
                  <span
                    style={{
                      position: "absolute",
                      top: 18,
                      left: 18,
                      background: "#edb63f",
                      color: "#071821",
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 800,
                      fontSize: 11,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      padding: "5px 12px",
                      borderRadius: 100,
                      boxShadow: "0 6px 16px rgba(6,20,27,.25)",
                    }}
                  >
                    {it.category}
                  </span>
                )}

                {it.title && (
                  <span
                    style={{
                      position: "absolute",
                      left: 9,
                      right: 9,
                      bottom: 9,
                      display: "block",
                      padding: "34px 16px 14px",
                      borderRadius: `0 0 ${radius - 7}px ${radius - 7}px`,
                      background:
                        "linear-gradient(to top, rgba(7,24,33,.82), rgba(7,24,33,.0))",
                      color: "#f4ead6",
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      lineHeight: 1.2,
                    }}
                  >
                    {it.title}
                  </span>
                )}
              </button>
            </Reveal>
          );
        })}
      </div>

      {current && (
        <Lightbox
          image={current}
          index={open!}
          total={count}
          onClose={() => setOpen(null)}
          onPrev={() => setOpen((o) => (o === null ? o : (o - 1 + count) % count))}
          onNext={() => setOpen((o) => (o === null ? o : (o + 1) % count))}
        />
      )}
    </>
  );
}

function Lightbox({
  image,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const round: CSSProperties = {
    width: 52,
    height: 52,
    flex: "none",
    borderRadius: "50%",
    border: "2px solid #edb63f",
    background: "rgba(7,24,33,.4)",
    color: "#edb63f",
    fontSize: 22,
    fontFamily: "var(--font-baloo), sans-serif",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(4,14,19,.86)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(16px,4vw,48px)",
        animation: "vcb-pop .28s cubic-bezier(.16,1,.3,1) both",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{
          position: "absolute",
          top: 22,
          right: 24,
          ...round,
        }}
      >
        ✕
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "clamp(10px,2.5vw,26px)",
          maxWidth: "100%",
        }}
      >
        {total > 1 && (
          <button onClick={onPrev} aria-label="Previous" style={round}>
            ‹
          </button>
        )}

        <figure style={{ margin: 0, textAlign: "center" }}>
          <div
            style={{
              padding: 12,
              background: "#0b2c39",
              borderRadius: 26,
              boxShadow: "0 40px 80px rgba(0,0,0,.5)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.image_url}
              alt={image.title ?? "Veycho gallery photo"}
              style={{
                display: "block",
                maxWidth: "min(86vw, 1000px)",
                maxHeight: "72vh",
                width: "auto",
                height: "auto",
                borderRadius: 16,
                objectFit: "contain",
              }}
            />
          </div>
          <figcaption
            style={{
              marginTop: 18,
              color: "#f4ead6",
              fontFamily: "var(--font-baloo), sans-serif",
            }}
          >
            {image.title && (
              <span style={{ fontWeight: 800, fontSize: 18 }}>{image.title}</span>
            )}
            {image.title && image.category && (
              <span style={{ opacity: 0.5 }}> · </span>
            )}
            {image.category && (
              <span style={{ color: "#edb63f", fontWeight: 700, fontSize: 14 }}>
                {image.category}
              </span>
            )}
            <span
              style={{
                display: "block",
                marginTop: 6,
                color: "#8aa1ab",
                fontSize: 12,
                letterSpacing: ".2em",
              }}
            >
              {index + 1} / {total}
            </span>
          </figcaption>
        </figure>

        {total > 1 && (
          <button onClick={onNext} aria-label="Next" style={round}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}

/** Shown before any photos are uploaded — keeps the page on-brand, never blank. */
function EmptyWall() {
  const tiles = [
    { bg: "#edb63f", emoji: "☕", rot: -3 },
    { bg: "#0b2c39", emoji: "🍔", rot: 2 },
    { bg: "#c9d6c3", emoji: "🌿", rot: -2 },
    { bg: "#e9c7a6", emoji: "✦", rot: 3 },
  ];
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 18,
          marginBottom: 34,
        }}
      >
        {tiles.map((t, i) => (
          <div
            key={i}
            style={{
              width: 150,
              height: 150,
              borderRadius: 30,
              background: t.bg,
              display: "grid",
              placeItems: "center",
              fontSize: 54,
              transform: `rotate(${t.rot}deg)`,
              boxShadow: "0 14px 34px rgba(6,20,27,.14)",
            }}
          >
            {t.emoji}
          </div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--font-anton), sans-serif",
          color: "#11262f",
          fontSize: "clamp(22px,3.4vw,38px)",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        The gallery is being plated
      </p>
      <p
        style={{
          color: "#7a6b52",
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        Fresh moments from Veycho are coming soon — check back shortly.
      </p>
    </div>
  );
}
