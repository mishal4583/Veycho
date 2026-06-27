"use client";

import { useState, type CSSProperties } from "react";
import { waveBg, WAVE_TILE } from "@/lib/wave";
import Reveal from "./Reveal";
import {
  DEFAULT_CONTENT,
  MENU_DEFAULT,
  TAG_META,
  type MenuCategory,
  type MenuItem,
  type MenuPageContent,
} from "@/lib/content-defaults";

const DARK = "#071821";
const GOLD = "#edb63f";
const CREAM = "#f4ead6";
const MUTED = "#8aa1ab";
const RUST  = "#c5613a";

const CARD_PALETTE = [
  { card: "#f6dd9b", disc: "#ecca6f" },
  { card: "#ecc3ad", disc: "#dea98a" },
  { card: "#c9d6c3", disc: "#b0c3aa" },
  { card: "#e9c7a6", disc: "#dcb892" },
  { card: "#b9d0c9", disc: "#9bbcb3" },
  { card: "#f3e7cf", disc: "#e5d4b0" },
  { card: "#cdd8c4", disc: "#b8c9ae" },
  { card: "#e7cfa0", disc: "#d8bd86" },
];

type Entry = MenuItem & { cat: MenuCategory };

function matches(entry: Entry, filter: string) {
  if (filter === "all") return true;
  if (filter === "veg") return entry.tag === "veg" || entry.is_veg === true;
  return entry.cat.key === filter;
}

function badgeFor(entry: Entry) {
  if (entry.tag && TAG_META[entry.tag]) {
    return { label: TAG_META[entry.tag].label, bg: TAG_META[entry.tag].color, color: "#fff" };
  }
  return { label: entry.cat.badge, bg: "#0b2c39", color: "#f4ead6" };
}

/* ── mobile list: small tag pill ────────────────────────────── */
function TagPill({ tag }: { tag: string }) {
  const t = TAG_META[tag];
  if (!t) return null;
  return (
    <span style={{
      background: t.color, color: "#fff",
      fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
      fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 100, lineHeight: 1.4, whiteSpace: "nowrap",
    }}>
      {t.label}
    </span>
  );
}

/* ── desktop: circular dish image / emoji fallback ───────────── */
const DISC_STRIPES =
  "repeating-linear-gradient(135deg,rgba(6,20,27,.05) 0 11px,transparent 11px 22px)";

function DishDisc({ img, emoji, disc }: { img?: string; emoji: string; disc: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{
      width: 185, height: 185, maxWidth: "62vw", borderRadius: "50%",
      backgroundColor: disc,
      backgroundImage: (!img || broken) ? DISC_STRIPES : "none",
      overflow: "hidden", display: "flex", alignItems: "center",
      justifyContent: "center", marginBottom: 16, flex: "none",
      boxShadow: "0 8px 28px rgba(0,0,0,.12)",
    }}>
      {img && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" loading="lazy" onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
            transition: "transform .4s ease" }}
          className="vc-disc-img"
        />
      ) : (
        <span style={{ fontSize: 64, lineHeight: 1 }}>{emoji}</span>
      )}
    </div>
  );
}

/* ── desktop food card — oval pill, disc image ───────────────── */
function FoodCard({ entry, index }: { entry: Entry; index: number }) {
  const b  = badgeFor(entry);
  const rot = index % 2 ? "1.2deg" : "-1.2deg";
  const spice = Math.min(entry.spice_level ?? 0, 4);
  const palette = CARD_PALETTE[index % CARD_PALETTE.length];

  return (
    <article
      className="vc-card"
      style={{
        "--rot": rot,
        width: "100%", maxWidth: 320,
        background: palette.card,
        borderRadius: 200,
        padding: "28px 32px 56px",
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        position: "relative",
      } as CSSProperties}
    >
      {/* category / tag badge — top-left */}
      <div style={{
        position: "absolute", top: 22, left: 22,
        background: b.bg, color: b.color,
        fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
        fontSize: 11, padding: "5px 13px", borderRadius: 100, letterSpacing: ".04em",
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}>
        {b.label}
      </div>

      {/* image disc */}
      <div style={{ marginTop: 28 }}>
        <DishDisc img={entry.img} emoji={entry.cat.emoji} disc={palette.disc} />
      </div>

      {/* name + veg indicator inline */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, margin: "0 0 6px" }}>
        {entry.is_veg !== undefined && (
          <div style={{
            flexShrink: 0,
            width: 18, height: 18, borderRadius: 3,
            border: `2px solid ${entry.is_veg ? "#2f7d4f" : "#c0392b"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(255,255,255,.85)",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.is_veg ? "#2f7d4f" : "#c0392b" }} />
          </div>
        )}
        <h3 style={{
          fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800,
          color: "#11262f", fontSize: 20, margin: 0, lineHeight: 1.2,
        }}>
          {entry.name}
        </h3>
      </div>

      {/* description */}
      {entry.description && (
        <p style={{
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          fontSize: 12, color: "rgba(17,38,47,.6)", lineHeight: 1.5,
          margin: "0 0 10px", padding: "0 8px",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {entry.description}
        </p>
      )}

      {/* meta badges */}
      {(entry.is_popular || entry.is_chef_special || spice > 0) && (
        <div style={{ display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
          {entry.is_popular && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#0b2c39", color: GOLD, fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: ".08em", padding: "2px 8px", borderRadius: 100 }}>🔥 Popular</span>
          )}
          {entry.is_chef_special && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: RUST, color: "#fff", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: ".08em", padding: "2px 8px", borderRadius: 100 }}>★ Chef&apos;s</span>
          )}
          {spice > 0 && (
            <span style={{ fontSize: 12, letterSpacing: 1 }}>{"🌶".repeat(spice)}</span>
          )}
        </div>
      )}

      {/* price */}
      <div style={{
        fontFamily: "var(--font-anton), sans-serif",
        fontSize: 30, color: RUST, marginTop: 4, lineHeight: 1,
      }}>
        {entry.price}
      </div>
    </article>
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
    { key: "veg", label: "Veg" },
  ];

  const allItems: Entry[] = categories.flatMap((cat) =>
    cat.items.map((it) => ({ ...it, cat }))
  );
  const visible = allItems.filter((e) => matches(e, filter));

  return (
    <>
      <style>{`
        .vc-disc-img { transition: transform .4s ease; }
        .vc-card:hover .vc-disc-img { transform: scale(1.07); }
        .menu-chips-scroll::-webkit-scrollbar { display: none; }
        .menu-chips-scroll { scrollbar-width: none; }

        .vc-chip {
          cursor: pointer; border-radius: 100px;
          font-family: var(--font-baloo), sans-serif; letter-spacing: .02em;
          font-size: 14px; padding: 11px 24px;
          transition: all .34s cubic-bezier(.34,1.56,.64,1);
          transform: scale(1);
          will-change: transform;
        }
        .vc-chip:hover:not(.vc-chip-on) { transform: scale(1.06); opacity: .9; }
        .vc-chip-on {
          transform: scale(1.1);
          box-shadow: 0 4px 18px rgba(237,182,63,.38);
        }

@keyframes vc-cards-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vc-cards-grid { animation: vc-cards-in .28s ease-out; }
      `}</style>

      {/* ══════════ DESKTOP: oval-pill cards on cream ══════════ */}
      <section
        className="vcm-desktop"
        style={{ position: "relative", background: CREAM, paddingBottom: 100, marginBottom: -1 }}
      >
        {/* wavy chip band — full viewport width */}
        <div>
          {/* dark band */}
          <div style={{
            background: DARK,
            padding: "22px 40px 26px",
            display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center",
          }}>
            {chips.map((chip) => {
              const on = filter === chip.key;
              return (
                <button
                  key={chip.key} type="button"
                  className={`vc-chip${on ? " vc-chip-on" : ""}`}
                  onClick={() => setFilter(chip.key)}
                  style={{
                    fontWeight: on ? 700 : 600,
                    background: on ? GOLD : "transparent",
                    color: on ? DARK : CREAM,
                    border: `2px solid ${on ? GOLD : "rgba(244,234,214,.3)"}`,
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
          {/* bottom wave: cream bumps rising */}
          <div
            style={{
              height: 56,
              backgroundColor: DARK,
              backgroundImage: waveBg(CREAM, "up"),
              backgroundSize: `${WAVE_TILE}px 56px`,
              backgroundRepeat: "repeat-x",
              backgroundPosition: "0 0",
            }}
          />
        </div>

        {/* card grid */}
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "52px 40px 0" }}>
          <div
            key={filter}
            className="vc-cards-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 26, justifyItems: "center",
            }}
          >
            {visible.map((entry, i) => (
              <FoodCard key={`${entry.cat.key}-${entry.name}`} entry={entry} index={i} />
            ))}
          </div>

          {visible.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
              <p style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, color: DARK }}>
                No items in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ MOBILE: text list by category (cream) ══════════ */}
      <section
        className="vcm-mobile"
        style={{
          position: "relative", background: "#f1e6d0",
          marginBottom: -1,
          padding: "32px 0 clamp(120px, 16vh, 200px)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
          <div style={{
            textAlign: "center", color: RUST,
            fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
            fontSize: 13, letterSpacing: ".2em", marginBottom: 8,
          }}>
            {content.mobileLabel}
          </div>
          <h2 style={{
            textAlign: "center",
            fontFamily: "var(--font-anton), sans-serif", color: "#11262f",
            fontSize: "clamp(34px,9vw,52px)", lineHeight: 0.92,
            margin: "0 0 38px", textTransform: "uppercase",
          }}>
            {content.mobileHeading}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(330px,100%), 1fr))",
            gap: 22, alignItems: "start",
          }}>
            {categories.map((cat, i) => (
              <Reveal as="article" key={cat.key} y={36} delay={(i % 2) * 80}
                style={{ background: cat.bg, borderRadius: 30, padding: "30px 26px 26px" }}
              >
                <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 30, lineHeight: 1 }}>{cat.emoji}</span>
                  <h3 style={{
                    fontFamily: "var(--font-anton), sans-serif", color: "#11262f",
                    fontSize: 26, margin: 0, textTransform: "uppercase", lineHeight: 1,
                  }}>
                    {cat.title}
                  </h3>
                  {cat.note && (
                    <span style={{
                      marginLeft: "auto",
                      fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
                      fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase",
                      color: "rgba(17,38,47,.6)",
                    }}>
                      {cat.note}
                    </span>
                  )}
                </header>

                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {cat.items.map((it) => (
                    <li key={it.name} style={{
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                      gap: 12, padding: "9px 0",
                      borderTop: "1px dashed rgba(17,38,47,.2)",
                    }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
                          fontFamily: "var(--font-baloo), sans-serif", fontWeight: 600,
                          fontSize: 15, lineHeight: 1.3, color: "#11262f",
                        }}>
                          {it.is_veg !== undefined && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 13, height: 13, borderRadius: 2, flexShrink: 0,
                              border: `2px solid ${it.is_veg ? "#2f7d4f" : "#c0392b"}`,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: it.is_veg ? "#2f7d4f" : "#c0392b" }} />
                            </span>
                          )}
                          {it.name}
                          {it.tag && <TagPill tag={it.tag} />}
                          {it.is_popular && <span style={{ fontSize: 10 }}>🔥</span>}
                          {it.is_chef_special && <span style={{ fontSize: 9, fontWeight: 700, color: RUST }}>★</span>}
                          {(it.spice_level ?? 0) > 0 && (
                            <span style={{ fontSize: 10 }}>{"🌶".repeat(Math.min(it.spice_level ?? 0, 4))}</span>
                          )}
                        </span>
                        {it.description && (
                          <span style={{
                            display: "block",
                            fontFamily: "var(--font-hanken), system-ui, sans-serif",
                            fontSize: 12, color: "rgba(17,38,47,.55)", lineHeight: 1.45, marginTop: 2,
                          }}>
                            {it.description}
                          </span>
                        )}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-anton), sans-serif", fontSize: 17,
                        color: RUST, whiteSpace: "nowrap", alignSelf: "flex-start", paddingTop: 2,
                      }}>
                        {it.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <p style={{
            textAlign: "center", marginTop: 46,
            color: "#7a6b52", fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 600, fontSize: 14, letterSpacing: ".04em",
          }}>
            {content.thankyou}
          </p>
        </div>
      </section>
    </>
  );
}
