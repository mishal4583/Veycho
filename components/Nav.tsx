"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { scrollToId } from "@/lib/scroll";
import { DEFAULT_CONTENT, type NavContent } from "@/lib/content-defaults";
import { WAVES, WAVE_DEPTH, WAVE_TILE, waveBg } from "@/lib/wave";
import { usePageTransition } from "./PageTransition";
import TransitionLink from "./TransitionLink";

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

// Curtain geometry (WAVE_TILE/WAVE_DEPTH/waveBg/WAVES) is shared with the
// site-wide page transition — see lib/wave.ts.

function IgIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const IG_GRADIENT = "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";

const LINK_NOTES = {
  Menu: "Tonight’s composed plates",
  Explore: "Discover Wayanad",
  Gallery: "Inside Veycho",
  Visit: "Hours & directions",
} as const;

/* ---- mobile "sticker": a hand-drawn, wavy-edged ellipse badge ----
   A closed SVG path traced around an ellipse whose radius gently undulates
   (cos(bumps·Î¸)), smoothed through its points with a Catmull-Rom → cubic
   conversion so the edge reads as an organic wavy oval, not a gear. */
const STICKER_W = 184;
const STICKER_H = 100;

function wavyEllipsePath(w: number, h: number, bumps: number, amp: number, pad: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - amp - pad;
  const ry = h / 2 - amp - pad;
  const steps = bumps * 6;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const mod = amp * Math.cos(bumps * a);
    pts.push([cx + (rx + mod) * Math.cos(a), cy + (ry + mod) * Math.sin(a)]);
  }
  const n = pts.length;
  const f = (x: number) => x.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}Z`;
}

const STICKER_BG = (() => {
  const d = wavyEllipsePath(STICKER_W, STICKER_H, 9, 3.5, 3);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${STICKER_W} ${STICKER_H}'>` +
    `<path d='${d}' fill='#0b2c39' stroke='#edb63f' stroke-width='2.5'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

export default function Nav({
  content = DEFAULT_CONTENT.nav,
}: {
  content?: NavContent;
}) {
  const links = [
    { label: content.menuLabel,    kind: "route"  as const, href: "/menu",    note: LINK_NOTES.Menu    },
    { label: content.galleryLabel, kind: "route"  as const, href: "/gallery", note: LINK_NOTES.Gallery },
    { label: content.visitLabel,   kind: "scroll" as const, id: "visit",      note: LINK_NOTES.Visit   },
    { label: content.exploreLabel, kind: "route"  as const, href: "/explore", note: LINK_NOTES.Explore },
  ];

  const { navigate } = usePageTransition();
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
      let under: HTMLElement | null | undefined = sections.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probeY && r.bottom > probeY;
      });
      // Fallback for pages without #vc-stack (explore, menu, gallery …):
      // probe whatever element sits at the navbar's vertical centre.
      if (!under) {
        let el = document.elementFromPoint(window.innerWidth / 2, probeY) as HTMLElement | null;
        while (el && getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)") {
          el = el.parentElement as HTMLElement | null;
        }
        under = el ?? undefined;
      }
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
    if (window.location.pathname === "/") {
      navigate({ type: "scroll", id: "visit" }, { immediate: true });
    } else {
      navigate({ type: "route", href: "/#visit" });
    }
  };

  const goHome = () => {
    setMenuOpen(false);
    if (window.location.pathname === "/") {
      navigate({ type: "scroll", id: "top" }, { immediate: true });
    } else {
      navigate({ type: "route", href: "/" });
    }
  };

  // On mobile the bar is a solid dark rectangle, so force the light-on-dark set.
  const t = THEMES[isMobile ? "dark" : theme];

  return (
    <>
      {/* ---- Desktop: transparent top bar with wordmark + pills ---- */}
      {!isMobile && (
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
            padding: "14px 38px",
            background: "transparent",
            boxShadow: "none",
          }}
        >
          {/* left: Veycho wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (window.location.pathname === "/") {
                scrollToId("top");
              } else {
                navigate({ type: "route", href: "/" });
              }
            }}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              fontSize: 30,
              color: t.ink,
              textDecoration: "none",
              letterSpacing: "-.02em",
              lineHeight: 1,
              transition: "color .3s ease",
            }}
          >
            Veycho
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TransitionLink
              href="/menu"
              style={{ ...pill, background: t.menuBg, color: t.menuText, border: `2px solid ${t.menuBg}` }}
            >
              {content.menuLabel}
            </TransitionLink>
            <TransitionLink
              href="/gallery"
              style={{ ...pill, background: "transparent", color: t.ink, border: `2px solid ${t.ink}` }}
            >
              {content.galleryLabel}
            </TransitionLink>
            <a
              href="/#visit"
              onClick={(e) => {
                e.preventDefault();
                if (window.location.pathname === "/") {
                  navigate({ type: "scroll", id: "visit" });
                } else {
                  navigate({ type: "route", href: "/#visit" });
                }
              }}
              style={{ ...pill, background: "transparent", color: t.ink, border: `2px solid ${t.ink}` }}
            >
              {content.visitLabel}
            </a>
            <TransitionLink
              href="/explore"
              style={{ ...pill, background: "transparent", color: t.ink, border: `2px solid ${t.ink}` }}
            >
              {content.exploreLabel}
            </TransitionLink>
            {content.instagram && (
              <a
                href={content.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Veycho on Instagram"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${t.ink}`, color: t.ink, textDecoration: "none",
                  transition: "background .25s ease, color .25s ease, border-color .25s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = IG_GRADIENT;
                  el.style.color = "#fff";
                  el.style.borderColor = "transparent";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = "transparent";
                  el.style.color = t.ink;
                  el.style.borderColor = t.ink;
                }}
              >
                <IgIcon size={17} />
              </a>
            )}
          </div>
        </nav>
      )}

      {/* ---- Mobile: wavy "sticker" badge — brand + hamburger in one. Sits
           above the overlay so its lines morph to âœ• and it doubles as close. ---- */}
      {isMobile && (
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            position: "fixed",
            top: 40,
            left: 14,
            zIndex: 10001,
            width: STICKER_W,
            height: STICKER_H,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            transform: menuOpen ? "rotate(2deg) scale(1.04)" : "rotate(-5deg)",
            transition: "transform .45s cubic-bezier(.34,1.3,.5,1)",
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,.34))",
          }}
        >
          {/* wavy teal blob with a gold hand-drawn outline */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: STICKER_BG,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />
          {/* brand + hamburger, riding the sticker's tilt */}
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                goHome();
              }}
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 800,
                fontSize: 23,
                letterSpacing: "-.02em",
                color: "#f4ead6",
                lineHeight: 1,
                textDecoration: "none",
              }}
            >
              Veycho
            </a>
            <span style={{ position: "relative", width: 23, height: 16, flex: "none" }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    width: 23,
                    height: 2.6,
                    marginTop: -1.3,
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
            </span>
          </span>
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
            {/* brand lives in the sticker now (top-left), so the menu just
                opens straight into the links */}

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
              {links.map((l, i) => {
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
                    onClick={(e) => {
                      if (
                        e.metaKey || e.ctrlKey || e.shiftKey ||
                        e.altKey || e.button !== 0
                      ) {
                        return; // let the browser open a new tab
                      }
                      e.preventDefault();
                      setMenuOpen(false);
                      // Menu is already covering — hand off without a second rise.
                      navigate({ type: "route", href: l.href }, { immediate: true });
                    }}
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
                {content.hours}
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <a
                  href={`tel:${content.phone.replace(/\s+/g, "")}`}
                  style={{
                    fontFamily: "var(--font-hanken), system-ui, sans-serif",
                    fontSize: 15,
                    color: "#f4ead6",
                    textDecoration: "none",
                  }}
                >
                  {content.phone}
                </a>
                {content.instagram && (
                  <a
                    href={content.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      background: IG_GRADIENT,
                      borderRadius: 100, padding: "7px 14px",
                      color: "#fff", textDecoration: "none",
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 700, fontSize: 12, letterSpacing: ".06em",
                    }}
                  >
                    <IgIcon size={14} />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
