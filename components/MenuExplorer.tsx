"use client";

import { useState, type CSSProperties } from "react";
import Reveal from "./Reveal";
import {
  DEFAULT_CONTENT,
  MENU_DEFAULT,
  TAG_META,
  type MenuCategory,
  type MenuItem,
  type MenuPageContent,
} from "@/lib/content-defaults";

/* ============================================================
   Menu explorer — desktop adopts the "library of flavour" design
   (filter chips + oval capsule cards on dark), mobile keeps the
   compact text-list category layout. Toggled by the
   .vcm-desktop / .vcm-mobile helper classes in globals.css.
   Categories + page copy are passed in from the server (DB-driven),
   falling back to the bundled defaults.
   ============================================================ */

// flatten so the desktop grid is one continuous, filterable list
type Entry = MenuItem & { cat: MenuCategory };

function matches(entry: Entry, filter: string) {
  if (filter === "all") return true;
  if (filter === "veg") return entry.tag === "veg";
  return entry.cat.key === filter;
}

function badgeFor(entry: Entry) {
  if (entry.tag && TAG_META[entry.tag]) {
    return { label: TAG_META[entry.tag].label, bg: TAG_META[entry.tag].color, color: "#fff" };
  }
  return { label: entry.cat.badge, bg: "#0b2c39", color: "#f4ead6" };
}

function TagPill({ tag }: { tag: string }) {
  const t = TAG_META[tag];
  if (!t) return null;
  return (
    <span
      style={{
        background: t.color,
        color: "#fff",
        fontFamily: "var(--font-baloo), sans-serif",
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 100,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {t.label}
    </span>
  );
}

/* ---- striped image disc (shown when an item has no photo) ---- */
const DISC_STRIPES =
  "repeating-linear-gradient(135deg,rgba(6,20,27,.05) 0 11px,transparent 11px 22px)";

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
    { key: "veg", label: "Veg" },
  ];
  const allItems: Entry[] = categories.flatMap((cat) =>
    cat.items.map((it) => ({ ...it, cat }))
  );
  const visible = allItems.filter((e) => matches(e, filter));

  return (
    <>
      {/* ============ DESKTOP: filter + oval-card grid (dark) ============ */}
      <section
        className="vcm-desktop"
        data-screen-label="Menu Grid"
        style={{
          position: "relative",
          background: "#071821",
          padding: "18px 40px 130px",
          marginBottom: -1,
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          {/* sticky filter bar — sits just under the fixed promo bar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "22px 0 46px",
              position: "sticky",
              top: 34,
              background: "#071821",
              zIndex: 20,
            }}
          >
            {chips.map((chip) => {
              const on = filter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  style={{
                    cursor: "pointer",
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: on ? 700 : 600,
                    fontSize: 14,
                    letterSpacing: ".02em",
                    padding: "11px 22px",
                    borderRadius: 100,
                    background: on ? "#edb63f" : "transparent",
                    color: on ? "#071821" : "#d9cdb5",
                    border: on
                      ? "2px solid #edb63f"
                      : "2px solid rgba(244,234,214,.2)",
                    transition: "all .2s",
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 26,
              justifyItems: "center",
            }}
          >
            {visible.map((entry, i) => {
              const b = badgeFor(entry);
              const rot = i % 2 ? "1.2deg" : "-1.2deg";
              return (
                <article
                  key={`${entry.cat.key}-${entry.name}`}
                  className="vc-card"
                  style={
                    {
                      "--rot": rot,
                      width: "100%",
                      maxWidth: 320,
                      background: entry.cat.card,
                      borderRadius: 200,
                      padding: "34px 26px 30px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    } as CSSProperties
                  }
                >
                  <div
                    style={{
                      background: b.bg,
                      color: b.color,
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "7px 16px",
                      borderRadius: 100,
                      marginBottom: 18,
                    }}
                  >
                    {b.label}
                  </div>
                  <div
                    style={{
                      width: 185,
                      height: 185,
                      maxWidth: "62vw",
                      borderRadius: "50%",
                      background: entry.cat.disc,
                      backgroundImage: entry.img ? undefined : DISC_STRIPES,
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 20,
                      flex: "none",
                    }}
                  >
                    {entry.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.img}
                        alt={entry.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <span style={{ fontSize: 64, lineHeight: 1 }}>
                        {entry.cat.emoji}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 700,
                      color: "#11262f",
                      fontSize: 22,
                      margin: "0 0 12px",
                      lineHeight: 1.15,
                    }}
                  >
                    {entry.name}
                  </h3>
                  <div
                    style={{
                      fontFamily: "var(--font-anton), sans-serif",
                      fontSize: 30,
                      color: "#c5613a",
                    }}
                  >
                    {entry.price}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ MOBILE: compact list layout (cream) ============ */}
      <section
        className="vcm-mobile"
        style={{
          position: "relative",
          background: "#f1e6d0",
          marginBottom: -1,
          padding: "32px 0 clamp(120px, 16vh, 200px)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
          <div
            style={{
              textAlign: "center",
              color: "#c5613a",
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: ".2em",
              marginBottom: 8,
            }}
          >
            {content.mobileLabel}
          </div>
          <h2
            style={{
              textAlign: "center",
              fontFamily: "var(--font-anton), sans-serif",
              color: "#11262f",
              fontSize: "clamp(34px,9vw,52px)",
              lineHeight: 0.92,
              margin: "0 0 38px",
              textTransform: "uppercase",
            }}
          >
            {content.mobileHeading}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(330px,100%),1fr))",
              gap: 22,
              alignItems: "start",
            }}
          >
            {categories.map((cat, i) => (
              <Reveal
                as="article"
                key={cat.key}
                y={36}
                delay={(i % 2) * 80}
                style={{
                  background: cat.bg,
                  borderRadius: 30,
                  padding: "30px 26px 26px",
                }}
              >
                <header
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 30, lineHeight: 1 }}>
                    {cat.emoji}
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-anton), sans-serif",
                      color: "#11262f",
                      fontSize: 26,
                      margin: 0,
                      textTransform: "uppercase",
                      lineHeight: 1,
                    }}
                  >
                    {cat.title}
                  </h3>
                  {cat.note && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontFamily: "var(--font-baloo), sans-serif",
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                        color: "rgba(17,38,47,.6)",
                      }}
                    >
                      {cat.note}
                    </span>
                  )}
                </header>

                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {cat.items.map((it) => (
                    <li
                      key={it.name}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "9px 0",
                        borderTop: "1px dashed rgba(17,38,47,.2)",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                          fontFamily: "var(--font-baloo), sans-serif",
                          fontWeight: 600,
                          fontSize: 15,
                          lineHeight: 1.3,
                          color: "#11262f",
                        }}
                      >
                        {it.name}
                        {it.tag && <TagPill tag={it.tag} />}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-anton), sans-serif",
                          fontSize: 17,
                          color: "#c5613a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {it.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 46,
              color: "#7a6b52",
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: ".04em",
            }}
          >
            {content.thankyou}
          </p>
        </div>
      </section>
    </>
  );
}
