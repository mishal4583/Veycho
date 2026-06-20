"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import { DEFAULT_CONTENT, type ReviewsContent } from "@/lib/content-defaults";

// Per-card look: colours from the Chef's-Selection menu cards, plus a size, tilt
// and vertical stagger that vary per index so the row reads as a hand-pinned
// scatter. The "wavy" scalloped edge itself is shared and lives in `.vc-review-card`
// (globals.css). Keeping the preset tied to the (base) index keeps the repeated
// marquee halves identical and the loop seamless.
type Style = { bg: string; w: number; h: number; vy: number; rot: number };
const STYLE_PRESETS: Style[] = [
  { bg: "#f3e7cf", w: 360, h: 360, vy: -28, rot: -5 },
  { bg: "#edb63f", w: 328, h: 388, vy: 26, rot: 5 },
  { bg: "#c9d6c3", w: 384, h: 332, vy: -16, rot: -3 },
  { bg: "#f6dd9b", w: 348, h: 376, vy: 30, rot: 4 },
  { bg: "#e9c7a6", w: 376, h: 348, vy: -22, rot: -5 },
  { bg: "#ecc3ad", w: 332, h: 392, vy: 14, rot: 5 },
];

type Card = { quote: string; author: string };

// Real Google reviews (4.1★ listing) — shown instantly and as the fallback when
// the DB has no synced reviews yet.
const FALLBACK: Card[] = [
  { quote: "Outstanding — warm, clean and welcoming, with incredibly friendly staff and food that’s outstanding in both taste and presentation.", author: "Nidhin K · ★★★★★" },
  { quote: "The Pothum Kaal beef ribs are the highlight — slow-cooked, tender and rich with deep spices. Veycho nails traditional flavours.", author: "Ben J · ★★★★★" },
  { quote: "Ghee rice and chicken curry, flavourful and perfectly cooked; crispy chicken fingers and a really nice, welcoming ambience.", author: "Ashif N · ★★★★★" },
  { quote: "The Al-di-Funghi chicken pasta beats every pasta I’ve tried so far. Staff, service and atmosphere — 10/10.", author: "Gokul Krish M · ★★★★" },
  { quote: "A really well-done café for a quick grab or a proper meal — genuine rates, good service and solid healthy options too.", author: "Bharat S · ★★★★" },
  { quote: "Delicious dishes, and the staff were genuinely warm and customer-friendly.", author: "Athulya · ★★★★★" },
];

const INK = "#2b1418";

function truncate(s: string, n = 170) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

/**
 * A scalloped, cosine-wave silhouette used to mask each testimonial card so all
 * four edges ripple — the same smooth bump (no sharp cusps) as the site's Scallop
 * dividers. Built per-card from its w/h so the bumps stay round, and kept to a
 * single mask layer (a filled SVG path) so it renders reliably without depending
 * on `mask-composite`. Bumps dip inward, so the card never grows past w×h.
 */
function wavyMask(w: number, h: number): string {
  const a = 10; // how far each perforation dips inward (px)
  const target = 32; // desired perforation period; actual is rounded to tile each edge
  const nx = Math.max(2, Math.round(w / target));
  const ny = Math.max(2, Math.round(h / target));
  const bx = w / nx;
  const by = h / ny;
  const qx = bx / 4; // control-point offset → smooth (cosine-like) curve
  const qy = by / 4;
  const f = (n: number) => n.toFixed(1);

  let d = "M0,0";
  // top edge (→), bumps dip down
  for (let i = 0; i < nx; i++) {
    const x = i * bx;
    d += ` C${f(x + qx)},0 ${f(x + qx)},${a} ${f(x + bx / 2)},${a} C${f(x + bx - qx)},${a} ${f(x + bx - qx)},0 ${f(x + bx)},0`;
  }
  // right edge (↓), bumps dip left
  for (let i = 0; i < ny; i++) {
    const y = i * by;
    d += ` C${w},${f(y + qy)} ${w - a},${f(y + qy)} ${w - a},${f(y + by / 2)} C${w - a},${f(y + by - qy)} ${w},${f(y + by - qy)} ${w},${f(y + by)}`;
  }
  // bottom edge (←), bumps dip up
  for (let i = 0; i < nx; i++) {
    const x = w - i * bx;
    d += ` C${f(x - qx)},${h} ${f(x - qx)},${h - a} ${f(x - bx / 2)},${h - a} C${f(x - bx + qx)},${h - a} ${f(x - bx + qx)},${h} ${f(x - bx)},${h}`;
  }
  // left edge (↑), bumps dip right
  for (let i = 0; i < ny; i++) {
    const y = h - i * by;
    d += ` C0,${f(y - qy)} ${a},${f(y - qy)} ${a},${f(y - by / 2)} C${a},${f(y - by + qy)} 0,${f(y - by + qy)} 0,${f(y - by)}`;
  }
  d += " Z";

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><path d='${d}' fill='#fff'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function Reviews({
  content = DEFAULT_CONTENT.reviews,
}: {
  content?: ReviewsContent;
}) {
  // Live, synced Google reviews from the DB (>= 4★) replace the fallback when present.
  const [cards, setCards] = useState<Card[]>(FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d?.reviews) ? d.reviews : [];
        if (alive && list.length) {
          setCards(
            list.map((r: any) => ({
              quote: truncate(String(r.review_text ?? "")),
              author: `${r.name} · ${"★".repeat(Math.max(1, Math.min(5, Math.round(r.rating ?? 5))))}`,
            })),
          );
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const base = cards.map((c, i) => ({ ...c, ...STYLE_PRESETS[i % STYLE_PRESETS.length] }));
  // Two identical halves (each base repeated enough to overflow the viewport) so
  // the -50% marquee loops seamlessly no matter how many reviews there are.
  const reps = Math.max(2, Math.ceil(1600 / (base.length * 440)));
  const half = Array.from({ length: reps }).flatMap(() => base);
  const LOOP = [...half, ...half];

  return (
    <section
      id="reviews"
      data-screen-label="Reviews"
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#0b2c39",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(150px, 18vh, 220px) 0",
      }}
    >
      <Reveal
        as="h2"
        style={{
          fontFamily: "var(--font-anton), sans-serif",
          color: "#f4ead6",
          fontSize: "clamp(44px,6vw,92px)",
          lineHeight: 0.9,
          margin: "0 0 18px",
          textTransform: "uppercase",
          textAlign: "center",
          padding: "0 48px",
        }}
      >
        {content.heading}
      </Reveal>
      <Reveal
        as="p"
        delay={120}
        style={{
          margin: "0 0 52px",
          textAlign: "center",
          color: "#edb63f",
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: ".14em",
          textTransform: "uppercase",
        }}
      >
        {content.ratingBadge}
      </Reveal>

      {/* full-bleed marquee; pauses when you hover a card */}
      <div style={{ width: "100%", overflow: "hidden" }}>
        <div
          className="vc-marquee-track"
          style={{ gap: 30, padding: "88px 14px", alignItems: "center" }}
        >
          {LOOP.map((r, i) => {
            const mask = wavyMask(r.w, r.h);
            return (
            // Wrapper carries the stagger + tilt so the card's own hover-lift
            // transform stays independent.
            <div
              key={i}
              className="vc-review-wrap"
              style={{ flex: "none", transform: `translateY(${r.vy}px) rotate(${r.rot}deg)` }}
            >
              <blockquote
                className="vc-review-card"
                style={{
                  width: r.w,
                  minHeight: r.h,
                  background: r.bg,
                  // wavy, all-edges-rippling silhouette (see wavyMask)
                  WebkitMaskImage: mask,
                  maskImage: mask,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  padding: "44px 40px",
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 24,
                }}
              >
                <p
                  style={{
                    color: INK,
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    fontSize: 20,
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  &ldquo;{r.quote}&rdquo;
                </p>
                <footer
                  style={{
                    color: "rgba(43,20,24,.62)",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  {r.author}
                </footer>
              </blockquote>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
