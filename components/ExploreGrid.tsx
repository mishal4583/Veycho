"use client";

import { useState, useMemo } from "react";
import TransitionLink from "./TransitionLink";
import Reveal from "./Reveal";
import type { Destination, DestinationCategory } from "@/lib/explore";

const GOLD = "#edb63f";
const DARK = "#071821";
const SURFACE = "#0b2c39";
const CREAM = "#f4ead6";
const MUTED = "#8aa1ab";

function StarRow({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill={i <= Math.round(rating) ? GOLD : "#2a4452"}>
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5" />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: MUTED, marginLeft: 4, fontFamily: "var(--font-hanken), sans-serif" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

function DestinationCard({ d }: { d: Destination }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: SURFACE,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        border: `1.5px solid ${hovered ? GOLD : "rgba(237,182,63,.12)"}`,
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,.4), 0 0 0 1px ${GOLD}22`
          : "0 4px 20px rgba(0,0,0,.28)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        transition: "transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s ease, border-color .3s ease",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", flexShrink: 0 }}>
        {d.featured_image ? (
          <img
            src={d.featured_image}
            alt={d.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform .6s cubic-bezier(.16,1,.3,1)" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#0d2233" }} />
        )}
        {/* gradient fade bottom */}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(180deg,transparent 50%,rgba(11,44,57,.9) 100%)" }} />
        {/* category badge */}
        {d.category && (
          <span style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(11,44,57,.85)", backdropFilter: "blur(6px)",
            border: `1px solid ${GOLD}44`,
            borderRadius: 100, padding: "4px 10px",
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 11, letterSpacing: ".08em", color: GOLD,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span>{d.category.icon}</span> {d.category.name.toUpperCase()}
          </span>
        )}
        {/* distance chip */}
        {d.distance_km != null && (
          <span style={{
            position: "absolute", bottom: 12, right: 12,
            background: GOLD, borderRadius: 100, padding: "3px 10px",
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 11, color: DARK,
          }}>
            {d.distance_km} km away
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 20px 20px" }}>
        <h3 style={{
          fontFamily: "var(--font-anton), sans-serif", fontSize: 22,
          color: CREAM, margin: 0, lineHeight: 1.1, letterSpacing: ".01em",
        }}>
          {d.title}
        </h3>
        <p style={{
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          fontSize: 13, color: MUTED, lineHeight: 1.6,
          margin: "8px 0 14px", flex: 1,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {d.short_description}
        </p>

        {/* meta row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
          {d.travel_time && (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: 12, color: MUTED,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {d.travel_time}
            </span>
          )}
          {d.google_rating != null && <StarRow rating={d.google_rating} />}
          {d.difficulty_level && (
            <span style={{ fontSize: 11, color: MUTED, fontFamily: "var(--font-hanken), system-ui, sans-serif" }}>
              {d.difficulty_level}
            </span>
          )}
        </div>

        <TransitionLink
          href={`/explore/${d.slug}`}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: hovered ? GOLD : "transparent",
            color: hovered ? DARK : GOLD,
            border: `2px solid ${GOLD}`,
            borderRadius: 100, padding: "9px 18px",
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 12, letterSpacing: ".06em", textDecoration: "none",
            transition: "background .3s ease, color .3s ease",
          }}
        >
          Explore Destination
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </TransitionLink>
      </div>
    </div>
  );
}

export default function ExploreGrid({
  destinations,
  categories,
}: {
  destinations: Destination[];
  categories: DestinationCategory[];
}) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = destinations;
    if (active !== "all") list = list.filter((d) => d.category?.slug === active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.short_description.toLowerCase().includes(q) ||
          d.category?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [destinations, active, query]);

  const pills = [{ slug: "all", name: "All", icon: "✦" }, ...categories];

  return (
    <div style={{ background: DARK }}>
      {/* search + filter bar */}
      <div style={{ padding: "clamp(24px,5vw,40px) clamp(20px,5vw,48px) 0", maxWidth: 1280, margin: "0 auto" }}>
        {/* search */}
        <div style={{ position: "relative", maxWidth: 420, width: "100%", marginBottom: 28 }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations…"
            style={{
              width: "100%", boxSizing: "border-box",
              background: SURFACE, border: `1.5px solid rgba(237,182,63,.2)`,
              borderRadius: 100, padding: "10px 16px 10px 40px",
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: 13, color: CREAM,
              outline: "none", transition: "border-color .3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = GOLD)}
            onBlur={(e) => (e.target.style.borderColor = "rgba(237,182,63,.2)")}
          />
        </div>

        {/* category pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 32 }}>
          {pills.map((p) => {
            const isActive = active === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => setActive(p.slug)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: isActive ? GOLD : SURFACE,
                  color: isActive ? DARK : MUTED,
                  border: `1.5px solid ${isActive ? GOLD : "rgba(237,182,63,.2)"}`,
                  borderRadius: 100, padding: "7px 16px",
                  fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
                  fontSize: 12, letterSpacing: ".06em", cursor: "pointer",
                  transition: "all .25s ease",
                }}
              >
                <span style={{ fontSize: 13 }}>{p.icon}</span> {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* grid */}
      <div style={{ padding: "0 clamp(20px,5vw,48px) 80px", maxWidth: 1280, margin: "0 auto" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0",
            fontFamily: "var(--font-hanken), system-ui, sans-serif", color: MUTED, fontSize: 15 }}>
            No destinations found. Try a different search or category.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(300px,100%), 1fr))",
            gap: 24,
          }}>
            {filtered.map((d, i) => (
              <Reveal key={d.id} y={30} delay={i * 60} style={{ display: "flex", flexDirection: "column" }}>
                <DestinationCard d={d} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 480px) {
          .explore-filter-bar input { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
