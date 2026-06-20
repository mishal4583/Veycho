"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Reveal from "./Reveal";
import Scallop from "./Scallop";

import {
  DEFAULT_CONTENT,
  DEFAULT_SPECIAL_DISHES,
  type ChefSpecialsContent,
  type SpecialDish,
} from "@/lib/content-defaults";

type DishStyle = {
  badge: string;
  badgeBg: string;
  badgeColor: string;
  cardBg: string;
  discBg: string;
  descColor: string;
  rot: string;
};

// Cream-only scroll room (px) around the pinned menu (desktop only).
const MENU_LEAD_IN = 180;
const MENU_LEAD_OUT = 260;

// Rotating card palette. Dish title/desc/price/photo come from the CMS
// (menu_items where is_chef_special) or the defaults; this array is only look.
const DISH_STYLES: DishStyle[] = [
  { badge: "Signature", badgeBg: "#edb63f", badgeColor: "#071821", cardBg: "#f3e7cf", discBg: "#e6d6b5", descColor: "#6b6151", rot: "-1.2deg" },
  { badge: "Heritage", badgeBg: "#0b2c39", badgeColor: "#f4ead6", cardBg: "#f6dd9b", discBg: "#ecca6f", descColor: "#6b6151", rot: "1.2deg" },
  { badge: "Wayanadan", badgeBg: "#0b2c39", badgeColor: "#f4ead6", cardBg: "#c9d6c3", discBg: "#b6c8af", descColor: "#5b6b58", rot: "-1.2deg" },
  { badge: "Veg · Chef’s Pick", badgeBg: "#2f7d4f", badgeColor: "#fff", cardBg: "#e9c7a6", discBg: "#dcb892", descColor: "#6b6151", rot: "1.2deg" },
  { badge: "Cafe", badgeBg: "#edb63f", badgeColor: "#071821", cardBg: "#ecc3ad", discBg: "#e0ad94", descColor: "#6b6151", rot: "-1.2deg" },
];

export default function ChefSpecials({
  content = DEFAULT_CONTENT.chefSpecials,
  dishes = DEFAULT_SPECIAL_DISHES,
}: {
  content?: ChefSpecialsContent;
  dishes?: SpecialDish[];
}) {
  const cards = dishes.map((d, i) => ({
    ...DISH_STYLES[i % DISH_STYLES.length],
    ...d,
  }));
  const pinRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef(0);
  const [pinHeight, setPinHeight] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  // On phones we drop the scroll-jack pin entirely for a native swipe carousel.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Desktop: map vertical scroll progress through a tall pinned section to a
  // horizontal translate of the track (vertical scroll -> sideways).
  useEffect(() => {
    if (isMobile) {
      // height falls back to auto via `m ? undefined : pinHeight` in the JSX
      if (trackRef.current) trackRef.current.style.transform = "none";
      return;
    }
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;

    let raf = 0;

    const measure = () => {
      const overflowX = Math.max(0, track.scrollWidth - window.innerWidth + 48);
      overflowRef.current = overflowX;
      const lead = overflowX > 0 ? MENU_LEAD_IN + MENU_LEAD_OUT : 0;
      setPinHeight(window.innerHeight + overflowX + lead);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const overflowX = overflowRef.current;
        if (overflowX <= 0) {
          track.style.transform = "translateX(0)";
          return;
        }
        const scrollPast = -pin.getBoundingClientRect().top;
        let p = (scrollPast - MENU_LEAD_IN) / overflowX;
        p = Math.min(Math.max(p, 0), 1);
        track.style.transform = `translateX(${-p * overflowX}px)`;
      });
    };

    measure();
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 1000);
    onScroll();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        measure();
        onScroll();
      });
      ro.observe(track);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [isMobile]);

  const m = isMobile;
  // Desktop insets the content to a centered 1280px container; phones use a
  // small edge gutter so the swipe carousel runs nearly full-bleed.
  const sidePad = m ? 20 : "max(48px, calc((100vw - 1280px) / 2))";

  const cardW = m ? "82vw" : 420;
  const cardSnap: CSSProperties = m
    ? { scrollSnapAlign: "center", maxWidth: 380 }
    : {};

  return (
    <section
      id="vc-menupin"
      data-screen-label="Chef Specials"
      ref={pinRef}
      style={{
        position: "relative",
        background: "#f1e6d0",
        height: m ? undefined : pinHeight,
      }}
    >
      {/* entry scallop */}
      <Scallop edge="top" color="#0f3e4d" />

      <div
        id="vc-menusticky"
        style={
          m
            ? {
                position: "static",
                display: "flex",
                flexDirection: "column",
                paddingTop: 96,
                paddingBottom: 44,
              }
            : {
                position: "sticky",
                top: 0,
                height: "100vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingTop: m ? 8 : "clamp(12px, 2vh, 40px)",
            paddingBottom: m ? 22 : "clamp(14px, 2vh, 28px)",
            paddingLeft: sidePad,
            paddingRight: sidePad,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Reveal y={36}>
            <div
              style={{
                color: "#c5613a",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: ".2em",
                marginBottom: 12,
              }}
            >
              {content.label}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-anton), sans-serif",
                color: "#11262f",
                fontSize: "clamp(34px,5vw,72px)",
                lineHeight: 0.92,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {content.heading}
            </h2>
          </Reveal>
          <Reveal
            as="p"
            y={30}
            delay={120}
            style={{
              maxWidth: 360,
              color: "#5b6b62",
              fontSize: 15,
              lineHeight: 1.6,
              margin: "0 0 6px",
            }}
          >
            {content.description}{" "}
            <span style={{ color: "#11262f", fontWeight: 700 }}>
              {m ? "Swipe →" : "Scroll ↓"}
            </span>
          </Reveal>
        </div>

        <div
          id="vc-track"
          ref={trackRef}
          style={
            m
              ? {
                  display: "flex",
                  gap: 16,
                  paddingTop: 8,
                  paddingBottom: 56,
                  paddingLeft: 20,
                  paddingRight: 20,
                  alignItems: "stretch",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  scrollPadding: "0 20px",
                  WebkitOverflowScrolling: "touch",
                }
              : {
                  display: "flex",
                  gap: 36,
                  paddingTop: 12,
                  paddingBottom: "clamp(12px, 2vh, 40px)",
                  paddingRight: 48,
                  paddingLeft: sidePad,
                  willChange: "transform",
                  alignItems: "stretch",
                }
          }
        >
          {cards.map((d) => (
            <article
              key={d.title}
              className="vc-card"
              style={
                {
                  "--rot": d.rot,
                  flex: "none",
                  width: cardW,
                  background: d.cardBg,
                  borderRadius: 260,
                  padding: m ? "30px 26px 30px" : "32px 34px 34px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  ...cardSnap,
                } as CSSProperties
              }
            >
              <div
                style={{
                  background: d.badgeBg,
                  color: d.badgeColor,
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "9px 19px",
                  borderRadius: 100,
                  marginBottom: 16,
                }}
              >
                {d.badge}
              </div>
              <div
                style={{
                  width: "clamp(170px, 40vw, 210px)",
                  height: "clamp(170px, 40vw, 210px)",
                  borderRadius: "50%",
                  background: d.discBg,
                  overflow: "hidden",
                  marginBottom: 18,
                  flex: "none",
                }}
              >
                {d.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.img}
                    alt={d.title}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : null}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700,
                  color: "#11262f",
                  fontSize: 27,
                  margin: "0 0 10px",
                  lineHeight: 1.1,
                }}
              >
                {d.title}
              </h3>
              <p
                style={{
                  color: d.descColor,
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  margin: "0 0 14px",
                }}
              >
                {d.desc}
              </p>
              <div
                style={{
                  fontFamily: "var(--font-anton), sans-serif",
                  fontSize: 38,
                  color: "#c5613a",
                }}
              >
                {d.price}
              </div>
            </article>
          ))}

          <Link
            href="/menu"
            className="vc-cta-card"
            style={{
              flex: "none",
              width: cardW,
              borderRadius: 260,
              background: "#0b2c39",
              color: "#f4ead6",
              textDecoration: "none",
              padding: "42px 34px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 22,
              ...cardSnap,
            }}
          >
            <div
              style={{
                width: 115,
                height: 115,
                borderRadius: "50%",
                border: "1.5px solid #edb63f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#edb63f",
                fontSize: 42,
              }}
            >
              →
            </div>
            <h3
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 31,
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              <span style={{ whiteSpace: "pre-line" }}>{content.ctaHeading}</span>
            </h3>
            <p style={{ color: "#8aa1ab", fontSize: 16, margin: 0 }}>
              {content.ctaDesc}
            </p>
          </Link>
        </div>
      </div>

      <Scallop edge="bottom" color="#0b2c39" />
    </section>
  );
}
