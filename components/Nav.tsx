"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { scrollToId } from "@/lib/scroll";
import { DEFAULT_CONTENT, type NavContent } from "@/lib/content-defaults";

const pill = {
  fontFamily: "var(--font-baloo), sans-serif",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: ".04em",
  padding: "9px 18px",
  borderRadius: 100,
  textDecoration: "none",
  transition: "color .3s ease, background .3s ease, border-color .3s ease",
} as const;

// Foreground sets keyed to the brightness of the section under the navbar, so
// the items stay legible on every section.
const THEMES = {
  light: { ink: "#071821", menuBg: "#071821", menuText: "#edb63f" }, // dark text on a light section
  dark: { ink: "#f4ead6", menuBg: "#edb63f", menuText: "#071821" }, // light text on a dark section
} as const;

function sectionIsLight(el: Element): boolean {
  const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
  if (!m || m.length < 3) return true;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55;
}

// ---- rising wavy curtain geometry (mirrors components/Scallop.tsx) ----
const WAVE_TILE = 160; // one bump period (px)
const WAVE_DEPTH = 70; // how far each bump reaches up

/** A repeating SVG band: solid color below a row of rounded upward bumps. */
function waveBg(color: string): string {
  const w = WAVE_TILE;
  const h = WAVE_DEPTH;
  const q = w / 4;
  const d = `M0,${h} C${q},${h} ${q},0 ${w / 2},0 C${w - q},0 ${w - q},${h} ${w},${h} Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Stacked curtain layers (later = drawn on top). Gold leads in, the deep teal
// settles last and becomes the menu background.
const WAVES = [
  { color: "#edb63f", inDelay: 0, outDelay: 0.12 },
  { color: "#0b2c39", inDelay: 0.1, outDelay: 0.05 },
];

const LINKS = [
  { label: "Menu", kind: "route", href: "/menu", note: "Tonight’s composed plates" },
  { label: "Visit", kind: "scroll", id: "visit", note: "Hours & directions" },
  { label: "Gallery", kind: "route", href: "/gallery", note: "Inside Veycho" },
] as const;

export default function Nav({
  content = DEFAULT_CONTENT.nav,
}: {
  content?: NavContent;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMenuOpen(false); // never strand the overlay open on desktop
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const probeY = 60; // roughly the navbar's vertical centre
    let raf = 0;

    const update = () => {
      raf = 0;
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("#vc-stack > *")
      );
      const under = sections.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probeY && r.bottom > probeY;
      });
      if (under) setTheme(sectionIsLight(under) ? "light" : "dark");
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Lock the (Lenis) page scroll while the fullscreen menu is open.
  useEffect(() => {
    const lenis = window.__lenis;
    if (menuOpen) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
    return () => {
      window.__lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  // Esc closes the overlay.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const goVisit = () => {
    setMenuOpen(false);
    // let the curtain start receding, then scroll through Lenis
    setTimeout(() => scrollToId("visit"), 460);
  };

  // On mobile the bar is a solid dark rectangle, so force the light-on-dark set.
  const t = THEMES[isMobile ? "dark" : theme];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 34,
          left: 0,
          width: "100%",
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 18px" : "14px 38px",
          background: isMobile ? "#071821" : "transparent",
          boxShadow: isMobile ? "0 8px 24px rgba(0,0,0,.28)" : "none",
        }}
      >
        {/* left: Veycho wordmark (was the MENU button) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("top");
          }}
          style={{
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 800,
            fontSize: isMobile ? 24 : 30,
            color: t.ink,
            textDecoration: "none",
            letterSpacing: "-.02em",
            lineHeight: 1,
            transition: "color .3s ease",
          }}
        >
          Veycho
        </a>

        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/gallery"
              style={{ ...pill, background: "transparent", color: t.ink, border: `2px solid ${t.ink}` }}
            >
              {content.galleryLabel}
            </Link>
            <Link
              href="/menu"
              style={{ ...pill, background: t.menuBg, color: t.menuText, border: `2px solid ${t.menuBg}` }}
            >
              {content.menuLabel}
            </Link>
            <a
              href="#visit"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("visit");
              }}
              style={{ ...pill, background: "transparent", color: t.ink, border: `2px solid ${t.ink}` }}
            >
              {content.visitLabel}
            </a>
          </div>
        )}
      </nav>

      {/* ---- Mobile: hamburger toggle (sits above the overlay so it morphs to ✕) ---- */}
      {isMobile && (
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            position: "fixed",
            top: 36,
            right: 16,
            zIndex: 10001,
            width: 46,
            height: 46,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 26,
                height: 2.5,
                marginLeft: -13,
                marginTop: -1.25,
                borderRadius: 2,
                background: "#edb63f",
                transition: "transform .4s cubic-bezier(.76,0,.24,1), opacity .2s ease",
                transform: menuOpen
                  ? i === 1
                    ? "scaleX(0)"
                    : `rotate(${i === 0 ? 45 : -45}deg)`
                  : `translateY(${(i - 1) * 7}px)`,
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      )}

      {/* ---- Mobile: fullscreen wavy menu ---- */}
      {isMobile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            overflow: "hidden",
            pointerEvents: menuOpen ? "auto" : "none",
          }}
        >
          {/* rising curtain layers with scalloped leading edges */}
          {WAVES.map((wv, i) => (
            <div
              key={wv.color}
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `calc(100% + ${WAVE_DEPTH}px)`,
                zIndex: i,
                transform: menuOpen ? "translateY(0)" : "translateY(102%)",
                transition: "transform .8s cubic-bezier(.76,0,.24,1)",
                transitionDelay: `${menuOpen ? wv.inDelay : wv.outDelay}s`,
              }}
            >
              {/* solid fill */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: WAVE_DEPTH - 1,
                  bottom: 0,
                  background: wv.color,
                }}
              />
              {/* scalloped leading edge, gently drifting sideways */}
              <div
                style={{
                  position: "absolute",
                  left: -WAVE_TILE,
                  right: -WAVE_TILE,
                  top: 0,
                  height: WAVE_DEPTH,
                  backgroundImage: waveBg(wv.color),
                  backgroundRepeat: "repeat-x",
                  backgroundPosition: "left bottom",
                  backgroundSize: `${WAVE_TILE}px ${WAVE_DEPTH}px`,
                  ["--vc-scallop-tile"]: `${WAVE_TILE}px`,
                  animation: "vc-scallop-roll 5s linear infinite",
                } as CSSProperties}
              />
            </div>
          ))}

          {/* content */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              padding: "46px 26px 38px",
            }}
          >
            {/* wordmark echoes the bar */}
            <span
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: "-.02em",
                color: "#f4ead6",
                opacity: menuOpen ? 1 : 0,
                transition: "opacity .4s ease .15s",
              }}
            >
              Veycho
            </span>

            {/* big links */}
            <nav
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {LINKS.map((l, i) => {
                const reveal: CSSProperties = {
                  transform: menuOpen ? "translateY(0)" : "translateY(34px)",
                  opacity: menuOpen ? 1 : 0,
                  transition:
                    "transform .6s cubic-bezier(.16,1,.3,1), opacity .5s ease",
                  transitionDelay: menuOpen ? `${0.32 + i * 0.09}s` : "0s",
                };
                const inner = (
                  <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-baloo), sans-serif",
                        fontWeight: 700,
                        fontSize: 13,
                        color: "#edb63f",
                        letterSpacing: ".06em",
                        animation: menuOpen
                          ? `vc-menu-bob 3s ease-in-out ${i * 0.4}s infinite`
                          : "none",
                      }}
                    >
                      0{i + 1}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-anton), sans-serif",
                          fontSize: "clamp(46px, 16vw, 88px)",
                          lineHeight: 0.96,
                          textTransform: "uppercase",
                          color: "#f4ead6",
                        }}
                      >
                        {l.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-hanken), system-ui, sans-serif",
                          fontSize: 13,
                          color: "#8aa1ab",
                          marginTop: 4,
                        }}
                      >
                        {l.note}
                      </span>
                    </span>
                  </span>
                );

                if (l.kind === "scroll") {
                  return (
                    <a
                      key={l.label}
                      href={`#${l.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        goVisit();
                      }}
                      style={{ textDecoration: "none", ...reveal }}
                    >
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ textDecoration: "none", ...reveal }}
                  >
                    {inner}
                  </Link>
                );
              })}
            </nav>

            {/* footer */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(16px)",
                transition: "opacity .5s ease .55s, transform .5s ease .55s",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  color: "#edb63f",
                }}
              >
                Open daily · 11 AM – 10 PM
              </span>
              <a
                href="tel:+919292619419"
                style={{
                  fontFamily: "var(--font-hanken), system-ui, sans-serif",
                  fontSize: 15,
                  color: "#f4ead6",
                  textDecoration: "none",
                }}
              >
                +91 92926 19419
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
