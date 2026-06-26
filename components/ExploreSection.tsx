"use client";

import Reveal from "./Reveal";
import TransitionLink from "./TransitionLink";
import type { Destination } from "@/lib/explore";
import { DEFAULT_CONTENT, type ExploreSectionContent } from "@/lib/content-defaults";

const GOLD = "#edb63f";
const DARK = "#071821";
const SURFACE = "#0b2c39";
const CREAM = "#f4ead6";
const MUTED = "#8aa1ab";

function MiniCard({ d }: { d: Destination }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 260,
        background: SURFACE,
        borderRadius: 14,
        overflow: "hidden",
        border: "1.5px solid rgba(237,182,63,.12)",
        transition: "transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s ease, border-color .3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(0,0,0,.4)";
        (e.currentTarget as HTMLDivElement).style.borderColor = `${GOLD}66`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(237,182,63,.12)";
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "3/2", overflow: "hidden" }}>
        {d.featured_image && (
          <img src={d.featured_image} alt={d.title} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
        <div style={{ position: "absolute", inset: 0,
          background: "linear-gradient(180deg,transparent 40%,rgba(11,44,57,.85) 100%)" }} />
        {d.category && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: GOLD, borderRadius: 100, padding: "3px 9px",
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 10, color: DARK, letterSpacing: ".06em",
          }}>
            {d.category.icon} {d.category.name}
          </span>
        )}
        {d.distance_km != null && (
          <span style={{
            position: "absolute", bottom: 10, right: 10,
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 10, color: CREAM,
          }}>
            {d.distance_km} km
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{
          fontFamily: "var(--font-anton), sans-serif",
          fontSize: 17, color: CREAM, margin: "0 0 6px", lineHeight: 1.1,
        }}>
          {d.title}
        </p>
        <p style={{
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          fontSize: 12, color: MUTED, lineHeight: 1.5, margin: "0 0 12px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {d.short_description}
        </p>
        <TransitionLink
          href={`/explore/${d.slug}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 11, letterSpacing: ".08em", color: GOLD, textDecoration: "none",
          }}
        >
          Explore →
        </TransitionLink>
      </div>
    </div>
  );
}

export default function ExploreSection({
  destinations,
  content = DEFAULT_CONTENT.exploreSection,
}: {
  destinations: Destination[];
  content?: ExploreSectionContent;
}) {
  if (!destinations.length) return null;
  return (
    <section
      style={{
        background: "#060e14",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle grid pattern */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, opacity: .03,
        backgroundImage: "linear-gradient(rgba(237,182,63,1) 1px, transparent 1px), linear-gradient(90deg, rgba(237,182,63,1) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <Reveal y={24}>
          <span style={{
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 12, letterSpacing: ".24em", color: GOLD, textTransform: "uppercase",
            display: "block", marginBottom: 10,
          }}>
            {content.eyebrow}
          </span>
        </Reveal>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 40, flexWrap: "wrap" }}>
          <Reveal y={32} delay={60}>
            <h2 style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(42px,6vw,80px)",
              color: CREAM, margin: 0, lineHeight: 1,
              letterSpacing: "-.02em",
            }}>
              {content.heading}
            </h2>
            <p style={{
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: 15, color: MUTED, margin: "12px 0 0", maxWidth: 420, lineHeight: 1.6,
            }}>
              {content.description}
            </p>
          </Reveal>
          <Reveal y={24} delay={120}>
            <TransitionLink
              href="/explore"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: GOLD, color: DARK,
                border: `2px solid ${GOLD}`,
                borderRadius: 100, padding: "11px 24px",
                fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800,
                fontSize: 13, letterSpacing: ".04em", textDecoration: "none",
                transition: "opacity .2s ease", whiteSpace: "nowrap",
              }}
            >
              View All Destinations
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </TransitionLink>
          </Reveal>
        </div>
      </div>

      {/* horizontal scroll track */}
      <div
        style={{
          overflowX: "auto",
          paddingLeft: 48,
          paddingRight: 48,
          paddingBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        <div style={{ display: "inline-flex", gap: 20 }}>
          {destinations.map((d, i) => (
            <Reveal key={d.id} y={20} delay={i * 80} style={{ display: "inline-flex" }}>
              <MiniCard d={d} />
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .explore-section-inner { padding: 0 20px !important; }
        }
      `}</style>
    </section>
  );
}
