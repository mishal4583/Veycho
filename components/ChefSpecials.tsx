"use client";

import TransitionLink from "./TransitionLink";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

type Dish = DishStyle &
  SpecialDish & {
    idx: string; // "01", "02", …
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

const ANTON = "var(--font-anton), sans-serif";
const BALOO = "var(--font-baloo), sans-serif";

// Mobile stacked-deck card geometry + shadow (warm-toned for the cream bg).
const CARD_RADIUS = 72;
const CARD_SHADOW = "0 22px 48px rgba(86,57,20,.22)";

// Merge CMS dish text onto the code-side palette (cycling colours if the owner
// features more than five dishes).
function buildDishes(list: SpecialDish[]): Dish[] {
  return list.map((d, i) => ({
    ...DISH_STYLES[i % DISH_STYLES.length],
    ...d,
    idx: String(i + 1).padStart(2, "0"),
  }));
}

export default function ChefSpecials({
  content = DEFAULT_CONTENT.chefSpecials,
  dishes = DEFAULT_SPECIAL_DISHES,
}: {
  content?: ChefSpecialsContent;
  dishes?: SpecialDish[];
}) {
  const cards = buildDishes(dishes);
  const pinRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef(0);
  const [pinHeight, setPinHeight] = useState<number | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);

  // The horizontal scroll-jack needs room: use it only on viewports that are
  // wide AND tall enough. Narrow phones OR short/landscape screens fall back to
  // the naturally-flowing stacked deck (which scrolls instead of clipping).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px), (max-height: 560px)");
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

      {m ? (
        <MobileMenu content={content} dishes={cards} />
      ) : (
        <DesktopMenu content={content} dishes={cards} trackRef={trackRef} />
      )}

      <Scallop edge="bottom" color="#0b2c39" />
    </section>
  );
}

// ============================================================
//  Desktop — vertical scroll → horizontal track (unchanged layout)
// ============================================================
function DesktopMenu({
  content,
  dishes,
  trackRef,
}: {
  content: ChefSpecialsContent;
  dishes: Dish[];
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Insets the content to a centered 1280px container.
  const sidePad = "max(48px, calc((100vw - 1280px) / 2))";
  const cardW = 420;

  return (
    <div
      id="vc-menusticky"
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingTop: "clamp(12px, 2vh, 40px)",
          paddingBottom: "clamp(14px, 2vh, 28px)",
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
              fontFamily: BALOO,
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
              fontFamily: ANTON,
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
          <span style={{ color: "#11262f", fontWeight: 700 }}>Scroll ←“</span>
        </Reveal>
      </div>

      <div
        id="vc-track"
        ref={trackRef}
        style={{
          display: "flex",
          gap: 36,
          paddingTop: 12,
          paddingBottom: "clamp(12px, 2vh, 40px)",
          paddingRight: 48,
          paddingLeft: sidePad,
          willChange: "transform",
          alignItems: "stretch",
        }}
      >
        {dishes.map((d) => (
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
                padding: "clamp(18px, 4.5vh, 34px) 34px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              } as CSSProperties
            }
          >
            <div
              style={{
                background: d.badgeBg,
                color: d.badgeColor,
                fontFamily: BALOO,
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
                // shrink with viewport height so the card fits short screens
                width: "min(clamp(170px, 40vw, 210px), 28vh)",
                height: "min(clamp(170px, 40vw, 210px), 28vh)",
                borderRadius: "50%",
                background: d.discBg,
                overflow: "hidden",
                marginBottom: "clamp(10px, 2.4vh, 18px)",
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
                fontFamily: BALOO,
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
            <div style={{ fontFamily: ANTON, fontSize: 38, color: "#c5613a" }}>
              {d.price}
            </div>
          </article>
        ))}

        <TransitionLink
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
              fontFamily: BALOO,
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
        </TransitionLink>
      </div>
    </div>
  );
}

// ============================================================
//  Mobile — swipeable stacked plate deck (Journey-style)
// ============================================================
function MobileMenu({
  content,
  dishes,
}: {
  content: ChefSpecialsContent;
  dishes: Dish[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        // clear the 80px scallop waves at both edges (+ breathing room) so the
        // heading and the CTA description are never cut off.
        paddingTop: 120,
        paddingBottom: 112,
      }}
    >
      <Reveal style={{ textAlign: "center", paddingLeft: 24, paddingRight: 24 }}>
        <div
          style={{
            color: "#c5613a",
            fontFamily: BALOO,
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
            fontFamily: ANTON,
            color: "#11262f",
            fontSize: "clamp(34px,9vw,52px)",
            lineHeight: 0.92,
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          {content.heading}
        </h2>
        <p
          style={{
            color: "#5b6b62",
            fontSize: 15,
            lineHeight: 1.6,
            margin: "14px auto 0",
            maxWidth: 420,
          }}
        >
          {content.description}
        </p>
        <p
          style={{
            color: "#8a7a5c",
            fontSize: 13.5,
            fontWeight: 600,
            margin: "10px auto 0",
          }}
        >
          Swipe through tonight’s plates — tap any one to read it.
        </p>
      </Reveal>

      <MenuMobileDeck dishes={dishes} />

      {/* full-menu CTA */}
      <Reveal
        y={24}
        delay={120}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          paddingTop: 8,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <TransitionLink
          href="/menu"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            background: "#0b2c39",
            color: "#f4ead6",
            textDecoration: "none",
            fontFamily: BALOO,
            fontWeight: 700,
            fontSize: 17,
            padding: "15px 28px",
            borderRadius: 100,
          }}
        >
          {content.ctaHeading.replace(/\n/g, " ")}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1.5px solid #edb63f",
              color: "#edb63f",
              fontSize: 17,
            }}
          >
            →
          </span>
        </TransitionLink>
        <p
          style={{ color: "#8a7a5c", fontSize: 14, margin: 0, textAlign: "center" }}
        >
          {content.ctaDesc}
        </p>
      </Reveal>
    </div>
  );
}

// ---- one plate, front (cover) ----
function DishCover({ d, radius }: { d: Dish; radius: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: d.cardBg,
        border: "1px solid rgba(120,80,30,.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "30px 26px",
      }}
    >
      <span
        style={{
          background: d.badgeBg,
          color: d.badgeColor,
          fontFamily: BALOO,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: ".02em",
          padding: "8px 17px",
          borderRadius: 100,
        }}
      >
        {d.badge}
      </span>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 152,
            height: 152,
            borderRadius: "50%",
            background: d.discBg,
            overflow: "hidden",
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
            fontFamily: BALOO,
            fontWeight: 800,
            color: "#11262f",
            fontSize: 23,
            margin: 0,
            lineHeight: 1.08,
          }}
        >
          {d.title}
        </h3>
        <div
          style={{ fontFamily: ANTON, fontSize: 34, color: "#c5613a", lineHeight: 1 }}
        >
          {d.price}
        </div>
      </div>
      <span
        style={{
          background: "rgba(17,38,47,.08)",
          color: "#11262f",
          fontFamily: BALOO,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: ".04em",
          padding: "9px 16px",
          borderRadius: 100,
        }}
      >
        Tap to read →
      </span>
    </div>
  );
}

// ---- one plate, flip side (description) ----
function DishStory({
  d,
  radius,
  onClose,
}: {
  d: Dish;
  radius: number;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        background: "#f4ead6",
        display: "flex",
        flexDirection: "column",
        padding: "30px 30px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}
      >
        <span
          style={{ fontFamily: ANTON, fontSize: 28, color: "#c5613a", lineHeight: 1 }}
        >
          {d.price}
        </span>
        <span style={{ height: 1, flex: 1, background: "rgba(7,24,33,.16)" }} />
        <span
          style={{
            fontFamily: BALOO,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: ".18em",
            color: "#8a7a5c",
            textTransform: "uppercase",
          }}
        >
          {d.badge}
        </span>
      </div>
      <h3
        style={{
          fontFamily: BALOO,
          fontWeight: 800,
          fontSize: 25,
          color: "#11262f",
          margin: "10px 0 12px",
          lineHeight: 1.05,
        }}
      >
        {d.title}
      </h3>
      <p
        data-lenis-prevent
        style={{
          color: d.descColor,
          fontSize: 15,
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
          overflowY: "auto",
          touchAction: "pan-y",
        }}
      >
        {d.desc}
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          alignSelf: "flex-start",
          marginTop: 16,
          border: "1.5px solid rgba(7,24,33,.2)",
          background: "transparent",
          color: "#11262f",
          fontFamily: BALOO,
          fontWeight: 700,
          fontSize: 13,
          padding: "10px 18px",
          borderRadius: 100,
          cursor: "pointer",
        }}
      >
        ← Back to plates
      </button>
    </div>
  );
}

// ---- mobile: a stacked, swipeable plate deck ----
// Cards sit piled on top of each other. Swipe the top card off and it cycles to
// the back; tap a card and its description flips open. Transforms are written to
// the DOM imperatively (during drag) and re-applied on order/open change, so the
// drag override and React layout never fight over the same `transform`.
function MenuMobileDeck({ dishes }: { dishes: Dish[] }) {
  const [order, setOrder] = useState<number[]>(() => dishes.map((_, i) => i));
  const [open, setOpen] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    el: HTMLDivElement;
    moved: boolean;
  } | null>(null);

  const layout = useCallback(() => {
    dishes.forEach((_, ci) => {
      const el = cardRefs.current[ci];
      if (!el) return;
      el.style.transition =
        "transform .5s cubic-bezier(.16,1,.3,1), opacity .4s ease";
      if (open === ci) {
        el.style.transform = "translateY(0) scale(1)";
        el.style.opacity = "1";
        el.style.zIndex = "100";
        el.style.pointerEvents = "auto";
        return;
      }
      if (open !== null) {
        el.style.transform = "translateY(36px) scale(.92)";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.zIndex = "1";
        return;
      }
      const pos = order.indexOf(ci);
      const peek = Math.min(pos, 3);
      el.style.transform = `translateY(${peek * 14}px) scale(${1 - peek * 0.05})`;
      el.style.opacity = pos > 3 ? "0" : "1";
      el.style.zIndex = String(dishes.length - pos);
      el.style.pointerEvents = pos === 0 ? "auto" : "none";
    });
  }, [order, open, dishes]);

  useEffect(() => {
    layout();
  }, [layout]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>, ci: number) => {
    if (open !== null || ci !== order[0]) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.style.transition = "none";
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, el, moved: false };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
    d.el.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${
      dx * 0.05
    }deg)`;
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      setOpen(order[0]); // a tap → flip the plate
      return;
    }
    if (Math.abs(dx) > 80) {
      // fling away, then drop this card to the back of the stack
      const dir = dx > 0 ? 1 : -1;
      d.el.style.transition = "transform .4s ease, opacity .4s ease";
      d.el.style.transform = `translate(${dir * 480}px, 24px) rotate(${
        dir * 16
      }deg)`;
      d.el.style.opacity = "0";
      const el = d.el;
      window.setTimeout(() => {
        el.style.transition = "none";
        el.style.transform = "translateY(56px) scale(.82)";
        setOrder((o) => [...o.slice(1), o[0]]);
      }, 300);
    } else {
      layout(); // snap back
    }
  };
  const onCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    layout();
  };

  const activeDot = open !== null ? open : order[0];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        paddingTop: 30,
        paddingBottom: 26,
      }}
    >
      <div style={{ position: "relative", width: "min(86vw,360px)", height: 500 }}>
        {dishes.map((d, ci) => (
          <div
            key={`${d.idx}-${d.title}`}
            ref={(el) => {
              cardRefs.current[ci] = el;
            }}
            onPointerDown={(e) => onDown(e, ci)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
            style={
              {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 460,
                borderRadius: CARD_RADIUS,
                overflow: "hidden",
                background: d.cardBg,
                border: "1px solid rgba(120,80,30,.12)",
                boxShadow: CARD_SHADOW,
                cursor: "pointer",
                touchAction: "pan-y",
                willChange: "transform",
                // initial resting stack (the effect re-applies the same values)
                transform: `translateY(${Math.min(ci, 3) * 14}px) scale(${
                  1 - Math.min(ci, 3) * 0.05
                })`,
                opacity: ci > 3 ? 0 : 1,
                zIndex: dishes.length - ci,
              } as CSSProperties
            }
          >
            <DishCover d={d} radius={CARD_RADIUS} />
            {open === ci && (
              <DishStory d={d} radius={CARD_RADIUS} onClose={() => setOpen(null)} />
            )}
          </div>
        ))}
      </div>

      {/* dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {dishes.map((d, i) => (
          <span
            key={`${d.idx}-mdot`}
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: i === activeDot ? "#c5613a" : "rgba(17,38,47,.2)",
              transform: i === activeDot ? "scale(1.4)" : "scale(1)",
              transition: "all .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}
