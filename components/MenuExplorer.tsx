"use client";

import { useState, useCallback, useRef, type CSSProperties } from "react";
import Reveal from "./Reveal";
import {
  DEFAULT_CONTENT,
  MENU_DEFAULT,
  TAG_META,
  type MenuCategory,
  type MenuItem,
  type MenuPageContent,
} from "@/lib/content-defaults";

const DARK    = "#071821";
const SURFACE = "#0b2c39";
const GOLD    = "#edb63f";
const CREAM   = "#f4ead6";
const MUTED   = "#8aa1ab";
const RUST    = "#c5613a";

type Entry = MenuItem & { cat: MenuCategory };

function matches(entry: Entry, filter: string) {
  if (filter === "all") return true;
  if (filter === "veg") return entry.tag === "veg" || entry.is_veg === true;
  return entry.cat.key === filter;
}

/* ── veg / non-veg square indicator ─────────────────────────── */
function VegDot({ veg }: { veg?: boolean }) {
  if (veg === undefined) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
      border: `2px solid ${veg ? "#2f7d4f" : "#c0392b"}`,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: veg ? "#2f7d4f" : "#c0392b",
      }} />
    </span>
  );
}

/* ── small badge pill ────────────────────────────────────────── */
function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      background: bg, color,
      fontFamily: "var(--font-baloo), sans-serif",
      fontWeight: 700, fontSize: 9, letterSpacing: ".08em",
      padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/* ── image area with emoji fallback ─────────────────────────── */
function CardImage({ src, emoji, disc, alt }: { src?: string; emoji: string; disc: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  const hasImg = Boolean(src) && !broken;
  return (
    <div style={{
      position: "relative", aspectRatio: "4/3", overflow: "hidden",
      background: hasImg ? DARK : disc,
      flexShrink: 0,
    }}>
      {hasImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src} alt={alt} loading="lazy"
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
            transition: "transform .4s ease" }}
          className="menu-card-img"
        />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: disc,
          backgroundImage: "repeating-linear-gradient(135deg,rgba(6,20,27,.06) 0 10px,transparent 10px 20px)",
        }}>
          <span style={{ fontSize: 52, lineHeight: 1, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.2))" }}>{emoji}</span>
        </div>
      )}
      {/* dark gradient over image */}
      {hasImg && (
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(7,24,33,.08) 0%, rgba(7,24,33,.55) 100%)",
        }} />
      )}
    </div>
  );
}

/* ── unified food card (desktop + mobile) ────────────────────── */
function FoodCard({ entry }: { entry: Entry }) {
  const [hovered, setHovered] = useState(false);
  const spice = Math.min(entry.spice_level ?? 0, 4);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE,
        borderRadius: 16, overflow: "hidden",
        border: `1.5px solid ${hovered ? GOLD : "rgba(237,182,63,.14)"}`,
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,.45), 0 0 0 1px rgba(237,182,63,.25)"
          : "0 2px 10px rgba(0,0,0,.25)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "transform .28s ease, box-shadow .28s ease, border-color .2s ease",
      }}
    >
      {/* top image */}
      <CardImage src={entry.img} emoji={entry.cat.emoji} disc={entry.cat.disc} alt={entry.name} />

      {/* card body */}
      <div style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* category + veg row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase",
            color: GOLD, opacity: 0.85,
          }}>
            {entry.cat.badge}
          </span>
          <VegDot veg={entry.is_veg} />
        </div>

        {/* name */}
        <h3 style={{
          fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800,
          fontSize: "clamp(15px, 1.8vw, 19px)", color: CREAM,
          margin: "0 0 5px", lineHeight: 1.2,
        }}>
          {entry.name}
        </h3>

        {/* description */}
        {entry.description && (
          <p style={{
            fontFamily: "var(--font-hanken), system-ui, sans-serif",
            fontSize: 12, color: MUTED, lineHeight: 1.5,
            margin: "0 0 10px", flex: 1,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {entry.description}
          </p>
        )}

        {/* badges row */}
        {(entry.is_popular || entry.is_chef_special || spice > 0) && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {entry.is_popular    && <Badge bg={DARK} color={GOLD}>🔥 Popular</Badge>}
            {entry.is_chef_special && <Badge bg={RUST} color="#fff">★ Chef&apos;s</Badge>}
            {spice > 0           && <Badge bg="rgba(192,57,43,.2)" color="#e74c3c">{"🌶".repeat(spice)}</Badge>}
          </div>
        )}

        {/* price */}
        <div style={{
          fontFamily: "var(--font-anton), sans-serif",
          fontSize: "clamp(20px, 2.2vw, 26px)", color: RUST,
          marginTop: "auto", lineHeight: 1,
        }}>
          {entry.price}
        </div>
      </div>
    </article>
  );
}

/* ── filter chips ────────────────────────────────────────────── */
function FilterBar({
  chips, filter, onChange, sticky,
}: {
  chips: { key: string; label: string }[];
  filter: string;
  onChange: (k: string) => void;
  sticky?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex", gap: 8, flexWrap: sticky ? "wrap" : "nowrap",
        overflowX: sticky ? undefined : "auto",
        justifyContent: sticky ? "center" : undefined,
        padding: sticky ? "22px 0 36px" : "16px 20px",
        position: sticky ? "sticky" : undefined,
        top: sticky ? 34 : undefined,
        background: sticky ? DARK : undefined,
        zIndex: sticky ? 20 : undefined,
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch" as never,
      }}
    >
      {chips.map((chip) => {
        const on = filter === chip.key;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            style={{
              cursor: "pointer", flexShrink: 0,
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: on ? 700 : 600,
              fontSize: 13, letterSpacing: ".02em",
              padding: "9px 20px", borderRadius: 100,
              background: on ? GOLD : "rgba(244,234,214,.07)",
              color: on ? DARK : CREAM,
              border: `1.5px solid ${on ? GOLD : "rgba(244,234,214,.18)"}`,
              transition: "all .18s ease",
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── main export ─────────────────────────────────────────────── */
export default function MenuExplorer({
  categories = MENU_DEFAULT,
  content = DEFAULT_CONTENT.menuPage,
}: {
  categories?: MenuCategory[];
  content?: MenuPageContent;
}) {
  const [filter, setFilter] = useState("all");

  const chips = [
    { key: "all", label: "All" },
    ...categories.map((c) => ({ key: c.key, label: c.chip })),
    { key: "veg", label: "🌿 Veg" },
  ];

  const allItems: Entry[] = categories.flatMap((cat) =>
    cat.items.map((it) => ({ ...it, cat }))
  );
  const visible = allItems.filter((e) => matches(e, filter));

  return (
    <>
      <style>{`
        .menu-card-img { transition: transform .4s ease; }
        article:hover .menu-card-img { transform: scale(1.06); }
        .menu-chips-mobile::-webkit-scrollbar { display: none; }

        /* desktop grid */
        @media (min-width: 760px) {
          .menu-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1100px) {
          .menu-grid { grid-template-columns: repeat(4, 1fr); }
        }
        /* mobile cards */
        @media (max-width: 759px) {
          .menu-grid-mobile { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .menu-grid-mobile { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════ DESKTOP ══════════════ */}
      <section
        className="vcm-desktop"
        style={{ position: "relative", background: DARK, padding: "0 40px 130px", marginBottom: -1 }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          {/* sticky filter */}
          <FilterBar chips={chips} filter={filter} onChange={setFilter} sticky />

          {/* count pill */}
          <div style={{
            textAlign: "right", marginBottom: 20,
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 600,
            fontSize: 12, color: MUTED, letterSpacing: ".06em",
          }}>
            {visible.length} {visible.length === 1 ? "item" : "items"}
          </div>

          {/* card grid */}
          <div className="menu-grid" style={{ display: "grid", gap: 20 }}>
            {visible.map((entry) => (
              <FoodCard key={`${entry.cat.key}-${entry.name}`} entry={entry} />
            ))}
          </div>

          {visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
              <p style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700 }}>
                No items in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ MOBILE ══════════════ */}
      <section
        className="vcm-mobile"
        style={{ position: "relative", background: DARK, marginBottom: -1, paddingBottom: "clamp(100px, 14vh, 160px)" }}
      >
        {/* heading */}
        <div style={{ textAlign: "center", padding: "32px 20px 0" }}>
          <p style={{
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            color: GOLD, fontSize: 12, letterSpacing: ".2em",
            textTransform: "uppercase", marginBottom: 6,
          }}>
            {content.mobileLabel}
          </p>
          <h2 style={{
            fontFamily: "var(--font-anton), sans-serif", color: CREAM,
            fontSize: "clamp(30px, 9vw, 46px)", lineHeight: 0.95,
            margin: "0 0 4px", textTransform: "uppercase",
          }}>
            {content.mobileHeading}
          </h2>
        </div>

        {/* scrollable filter chips */}
        <div className="menu-chips-mobile">
          <FilterBar chips={chips} filter={filter} onChange={setFilter} />
        </div>

        {/* 2-col card grid */}
        <div className="menu-grid-mobile" style={{ display: "grid", gap: 12, padding: "0 14px" }}>
          {visible.map((entry) => (
            <FoodCard key={`${entry.cat.key}-${entry.name}`} entry={entry} />
          ))}
        </div>

        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
            <p style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, color: CREAM }}>
              No items here yet.
            </p>
          </div>
        )}

        <p style={{
          textAlign: "center", marginTop: 40, padding: "0 20px",
          color: MUTED, fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 600, fontSize: 13, letterSpacing: ".04em",
        }}>
          {content.thankyou}
        </p>
      </section>
    </>
  );
}
