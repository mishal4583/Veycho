"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Reveal from "./Reveal";
import Scallop from "./Scallop";
import {
  DEFAULT_CONTENT,
  type JourneyContent,
  type JourneyChapter,
} from "@/lib/content-defaults";

type ChapterTheme = {
  coverBg: string;
  coverBorder?: string;
  chapColor: string;
  brandColor: string;
  yearColor: string;
  titleColor: string;
  pillBg: string;
  pillColor: string;
  storyYearColor: string;
};

type Chapter = ChapterTheme & {
  ch: string;
  year: string;
  title: string;
  body: string;
};

// Per-chapter colour palette (kept in code — not owner-editable). The chapter
// TEXT (year / title / body) comes from the CMS and is zipped onto these by
// index. Ported from the "Story Pages" design (claude.ai/design).
const CHAPTER_THEMES: ChapterTheme[] = [
  {
    coverBg: "#edb63f",
    chapColor: "#071821",
    brandColor: "#071821",
    yearColor: "#071821",
    titleColor: "#071821",
    pillBg: "#071821",
    pillColor: "#edb63f",
    storyYearColor: "#c5613a",
  },
  {
    coverBg: "#f1e6d0",
    chapColor: "#c5613a",
    brandColor: "#11262f",
    yearColor: "#c5613a",
    titleColor: "#11262f",
    pillBg: "#11262f",
    pillColor: "#f1e6d0",
    storyYearColor: "#c5613a",
  },
  {
    coverBg: "#c9d6c3",
    chapColor: "#2f7d4f",
    brandColor: "#11262f",
    yearColor: "#2f7d4f",
    titleColor: "#11262f",
    pillBg: "#11262f",
    pillColor: "#c9d6c3",
    storyYearColor: "#2f7d4f",
  },
  {
    coverBg: "#0b2c39",
    coverBorder: "1px solid rgba(242,184,41,.25)",
    chapColor: "#edb63f",
    brandColor: "#f4ead6",
    yearColor: "#edb63f",
    titleColor: "#f4ead6",
    pillBg: "#edb63f",
    pillColor: "#071821",
    storyYearColor: "#c5613a",
  },
];

// Merge CMS chapter text onto the code-side palette (cycling colours if the
// owner adds more than four chapters).
function buildChapters(list: JourneyChapter[]): Chapter[] {
  return list.map((c, i) => ({
    ...CHAPTER_THEMES[i % CHAPTER_THEMES.length],
    ch: String(i + 1).padStart(2, "0"),
    year: c.year,
    title: c.title,
    body: c.body,
  }));
}

const ANTON = "var(--font-anton), sans-serif";
const BALOO = "var(--font-baloo), sans-serif";

function ArrowRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function ArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

const CARD_W = 300;
const CARD_H = 420;

export default function Journey({
  content = DEFAULT_CONTENT.journey,
}: {
  content?: JourneyContent;
}) {
  const chapters = buildChapters(content.chapters);
  const rootRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // On phones the fanned deck is replaced by a native swipe carousel.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // All deck choreography is imperative DOM work (desktop only): entrance, fan
  // layout, fold-open, the curved-page hover, dots and backdrop. Kept out of
  // React state so hand-injected nodes are never touched by reconciliation.
  useEffect(() => {
    if (isMobile) return;
    const root = rootRef.current;
    if (!root) return;
    const deck = root.querySelector<HTMLElement>("#sp-deck");
    if (!deck) return;

    const cards = Array.from(deck.querySelectorAll<HTMLElement>(".sp-card"));
    const dots = Array.from(root.querySelectorAll<HTMLElement>(".sp-dot"));
    const backdrop = root.querySelector<HTMLElement>("#sp-backdrop");
    const hint = root.querySelector<HTMLElement>("#sp-hint");
    const n = cards.length;
    const ac = new AbortController();
    const { signal } = ac;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clamp = (v: number, lo: number, hi: number) =>
      v < lo ? lo : v > hi ? hi : v;
    const SMOOTH =
      "transform .72s cubic-bezier(.16,1,.3,1), opacity .55s ease";

    let open = -1;
    // 0 → tight shrunk stack, 1 → full fanned "hand of cards". Driven by scroll.
    let progress = reduce ? 1 : 0;

    // Closed deck: a scroll-linked fan. Interpolates each card from the stack
    // (p=0) to the spread (p=1). Painted with transition:none so it tracks the
    // wheel 1:1; `smooth` is only used when easing back from an open page.
    const paintClosed = (smooth = false) => {
      const p = progress;
      cards.forEach((card, i) => {
        const cover = card.querySelector<HTMLElement>(".sp-cover")!;
        const story = card.querySelector<HTMLElement>(".sp-story")!;
        const fold = card.querySelector<HTMLElement>(".sp-fold")!;
        fold.style.transform = "none";
        fold.style.boxShadow = "none";
        const off = i - (n - 1) / 2;
        const rotMag = Math.min(14, 70 / n);   // 14° for ≤5 cards, 10° for 7
        const yMag   = Math.min(33, 165 / n);  // 33px for ≤5 cards, 24px for 7
        const tx = p * off * 132;
        const stackTy = 34 + off * 4;
        const fanTy = Math.abs(off) * yMag;
        const ty = stackTy + (fanTy - stackTy) * p;
        const rot = p * off * rotMag;
        const scale = 0.9 + 0.1 * p;
        card.style.transition = smooth ? SMOOTH : "none";
        card.style.transitionDelay = "0ms";
        card.style.transform = `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})`;
        card.style.opacity = "1";
        card.style.zIndex = String(10 + i);
        card.style.pointerEvents = p > 0.7 ? "auto" : "none";
        card.style.boxShadow = "0 26px 60px rgba(0,0,0,.5)";
        cover.style.opacity = "1";
        story.style.opacity = "0";
        story.style.pointerEvents = "none";
      });
      dots.forEach((d) => {
        d.style.background = "rgba(244,234,214,.28)";
        d.style.transform = "scale(1)";
      });
      if (backdrop) {
        backdrop.style.opacity = "0";
        backdrop.style.pointerEvents = "none";
      }
      if (hint) hint.style.opacity = p > 0.85 ? "1" : "0";
    };

    // Open page: the chosen card lifts and flips to its story, the rest tuck away.
    const paintOpen = () => {
      cards.forEach((card, i) => {
        const cover = card.querySelector<HTMLElement>(".sp-cover")!;
        const story = card.querySelector<HTMLElement>(".sp-story")!;
        const fold = card.querySelector<HTMLElement>(".sp-fold")!;
        fold.style.transform = "none";
        fold.style.boxShadow = "none";
        card.style.transition = SMOOTH;
        card.style.transitionDelay = "0ms";
        if (i === open) {
          card.style.transform =
            "translateX(0px) translateY(-34px) rotate(0deg) scale(1.1)";
          card.style.opacity = "1";
          card.style.zIndex = "60";
          card.style.pointerEvents = "auto";
          card.style.boxShadow = "0 40px 90px rgba(0,0,0,.6)";
          cover.style.opacity = "0";
          story.style.opacity = "1";
          story.style.pointerEvents = "auto";
        } else {
          const dir = i < open ? -1 : 1;
          const depth = Math.abs(i - open);
          card.style.transform = `translateX(${dir * (150 + depth * 26)}px) translateY(${70 + depth * 12}px) rotate(${dir * 12}deg) scale(.82)`;
          card.style.opacity = ".16";
          card.style.zIndex = String(10 + i);
          card.style.pointerEvents = "none";
          card.style.boxShadow = "0 18px 40px rgba(0,0,0,.4)";
          cover.style.opacity = "1";
          story.style.opacity = "0";
          story.style.pointerEvents = "none";
        }
      });
      dots.forEach((d, i) => {
        const active = i === open;
        d.style.background = active ? "#edb63f" : "rgba(244,234,214,.28)";
        d.style.transform = active ? "scale(1.5)" : "scale(1)";
      });
      if (backdrop) {
        backdrop.style.opacity = "1";
        backdrop.style.pointerEvents = "auto";
      }
      if (hint) hint.style.opacity = "0";
    };

    const openCard = (i: number) => {
      if (progress < 0.7) return; // only tappable once mostly fanned
      open = i;
      paintOpen();
    };
    const closeCard = () => {
      if (open === -1) return;
      open = -1;
      paintClosed(true); // ease back into the fan
    };

    cards.forEach((card, i) => {
      card.addEventListener(
        "click",
        (e) => {
          if ((e.target as HTMLElement).closest(".sp-close")) {
            closeCard();
            return;
          }
          if (open === i) {
            closeCard();
            return;
          }
          openCard(i);
        },
        { signal }
      );
      // hover: turn the page. Transform only the inner fold (a single element —
      // no sliced strips, no seams) and leave the card box where it is, so the
      // cursor never slides off it and re-triggers the hover (no flicker).
      const hoverFold = card.querySelector<HTMLElement>(".sp-fold")!;
      card.addEventListener(
        "mouseenter",
        () => {
          if (open !== -1 || progress < 0.85) return;
          hoverFold.style.transform = "translateY(-20px) rotateY(-16deg)";
          hoverFold.style.boxShadow = "0 44px 80px rgba(0,0,0,.5)";
          card.style.boxShadow = "none";
          card.style.zIndex = "40";
        },
        { signal }
      );
      card.addEventListener(
        "mouseleave",
        () => {
          if (open !== -1 || progress < 0.85) return;
          hoverFold.style.transform = "none";
          hoverFold.style.boxShadow = "none";
          card.style.boxShadow = "0 26px 60px rgba(0,0,0,.5)";
          card.style.zIndex = String(10 + i);
        },
        { signal }
      );
    });

    dots.forEach((d, i) =>
      d.addEventListener(
        "click",
        () => {
          if (open === i) closeCard();
          else openCard(i);
        },
        { signal }
      )
    );
    backdrop?.addEventListener("click", closeCard, { signal });
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") closeCard();
      },
      { signal }
    );

    // ---- scroll-linked fan: widen the stack as the section scrolls in ----
    // Map the section's travel through the viewport to progress 0→1, so the
    // deck stays a shrunk stack at the bottom and spreads into the full fan as
    // it rises toward centre (and re-stacks on the way back up).
    let raf = 0;
    const measure = () => {
      const vh = window.innerHeight;
      const top = root.getBoundingClientRect().top;
      progress = clamp((vh - top) / (vh * 0.85), 0, 1);
      if (open === -1) paintClosed(false);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };

    if (reduce) {
      progress = 1;
      paintClosed(false);
    } else {
      measure();
      window.addEventListener("scroll", onScroll, { passive: true, signal });
      window.addEventListener("resize", onScroll, { signal });
    }

    return () => {
      cancelAnimationFrame(raf);
      ac.abort();
    };
  }, [isMobile]);

  const m = isMobile;

  return (
    <section
      id="journey"
      data-screen-label="Journey"
      ref={rootRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#0f3e4d",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // same vertical rhythm as the Reviews / Visit sections
        padding: "clamp(150px, 18vh, 220px) 24px",
      }}
    >
      {/* top scallop: Story spills down into Journey */}
      <Scallop edge="top" color="#0b2c39" />

      {/* backdrop: tap to close an open page */}
      <div
        id="sp-backdrop"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 8,
          background: "rgba(7,24,33,.5)",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity .5s ease",
        }}
      />

      {/* title */}
      <Reveal style={{ position: "relative", zIndex: 5, textAlign: "center" }}>
        <div
          style={{
            color: "#edb63f",
            fontFamily: BALOO,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: ".3em",
            marginBottom: 10,
          }}
        >
          {content.label}
        </div>
        <h2
          style={{
            fontFamily: ANTON,
            fontWeight: 400,
            color: "#f4ead6",
            fontSize: "clamp(34px,5vw,72px)",
            lineHeight: 0.92,
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          {content.subtitle}
        </h2>
        <p
          id="sp-hint"
          style={{
            color: "#82979e",
            fontSize: 14.5,
            lineHeight: 1.5,
            margin: "12px auto 0",
            maxWidth: 440,
            transition: "opacity .4s ease",
          }}
        >
          {m ? content.hintMobile : content.hintDesktop}
        </p>
      </Reveal>

      {/* deck (desktop) */}
      {!m && (
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1600,
        }}
      >
        <div
          className="sp-deck-wrap"
          style={chapters.length > 5 ? {
            transform: `scale(${(5 / chapters.length).toFixed(3)})`,
            transformOrigin: "50% 50%",
          } : undefined}
        >
          <div
            id="sp-deck"
            style={{
              position: "relative",
              width: CARD_W,
              height: CARD_H,
              transformStyle: "preserve-3d",
            }}
          >
            {chapters.map((c, i) => (
              <article
                key={c.ch}
                className="sp-card"
                data-i={i}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: CARD_W,
                  height: CARD_H,
                  borderRadius: 20,
                  cursor: "pointer",
                  transformOrigin: "50% 150%",
                  transform: stackedInitial(i, chapters.length),
                  opacity: 0,
                  transition:
                    "transform .72s cubic-bezier(.16,1,.3,1), opacity .55s ease",
                  boxShadow: "0 26px 60px rgba(0,0,0,.5)",
                  perspective: 1200,
                }}
              >
                <div
                  className="sp-fold"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 20,
                    transition:
                      "transform .7s cubic-bezier(.16,1,.3,1), box-shadow .7s",
                    transformOrigin: "0% 50%",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  }}
                >
                  {/* cover */}
                  <div
                    className="sp-cover"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 20,
                      overflow: "hidden",
                      background: c.coverBg,
                      border: c.coverBorder,
                      display: "flex",
                      flexDirection: "column",
                      padding: "30px 28px",
                      transition: "opacity .5s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: BALOO,
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: ".22em",
                          color: c.chapColor,
                        }}
                      >
                        CHAPTER {c.ch}
                      </span>
                      <span
                        style={{
                          fontFamily: BALOO,
                          fontWeight: 800,
                          fontSize: 16,
                          letterSpacing: "-.02em",
                          color: c.brandColor,
                        }}
                      >
                        Veycho
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: ANTON,
                          fontSize: 70,
                          lineHeight: 0.86,
                          color: c.yearColor,
                          letterSpacing: "-.01em",
                        }}
                      >
                        {c.year}
                      </div>
                      <div
                        style={{
                          fontFamily: BALOO,
                          fontWeight: 800,
                          fontSize: 34,
                          lineHeight: 1.02,
                          color: c.titleColor,
                          marginTop: 8,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          marginTop: 22,
                          display: "inline-flex",
                          alignSelf: "flex-start",
                          alignItems: "center",
                          gap: 8,
                          background: c.pillBg,
                          color: c.pillColor,
                          fontFamily: BALOO,
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: ".04em",
                          padding: "9px 18px",
                          borderRadius: 100,
                        }}
                      >
                        Tap to read <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>

                  {/* story */}
                  <div
                    className="sp-story"
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 20,
                      background: "#f4ead6",
                      display: "flex",
                      flexDirection: "column",
                      padding: "28px 30px",
                      opacity: 0,
                      pointerEvents: "none",
                      transition: "opacity .5s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: ANTON,
                          fontSize: 30,
                          color: c.storyYearColor,
                          lineHeight: 1,
                        }}
                      >
                        {c.year}
                      </span>
                      <span
                        style={{
                          height: 1,
                          flex: 1,
                          background: "rgba(7,24,33,.16)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: BALOO,
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: ".2em",
                          color: "#8a7a5c",
                        }}
                      >
                        CH. {c.ch}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: BALOO,
                        fontWeight: 800,
                        fontSize: 26,
                        color: "#11262f",
                        margin: "8px 0 12px",
                        lineHeight: 1.04,
                      }}
                    >
                      {c.title}
                    </h3>
                    <p
                      style={{
                        color: "#4a5a52",
                        fontSize: 14.5,
                        lineHeight: 1.5,
                        margin: 0,
                        flex: 1,
                      }}
                    >
                      {c.body}
                    </p>
                    <button
                      type="button"
                      className="sp-close"
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 18,
                        display: "inline-flex", alignItems: "center", gap: 7,
                        border: "1.5px solid rgba(7,24,33,.25)",
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
                      <ArrowLeft size={13} /> Back to pages
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* swipe-to-dismiss stacked deck (mobile) */}
      {m && <MobileDeck chapters={chapters} />}

      {/* footer dots (desktop) */}
      {!m && (
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            paddingTop: 32,
          }}
        >
          {chapters.map((c, i) => (
            <span
              key={c.ch}
              className="sp-dot"
              data-d={i}
              style={{
                display: "block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "rgba(244,234,214,.25)",
                border: "1.5px solid rgba(237,182,63,.4)",
                cursor: "pointer",
                transition: "all .3s ease",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---- mobile: a stacked, swipeable card deck ----
// Cards sit piled on top of each other. Swipe the top card off and it cycles to
// the back; tap a card and its story flips open. Transforms are written to the
// DOM imperatively (during drag) and re-applied on order/open change, so the
// drag override and React layout never fight over the same `transform`.
function MobileDeck({ chapters }: { chapters: Chapter[] }) {
  const [order, setOrder] = useState<number[]>(() =>
    chapters.map((_, i) => i)
  );
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
    chapters.forEach((_, ci) => {
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
      el.style.zIndex = String(chapters.length - pos);
      el.style.pointerEvents = pos === 0 ? "auto" : "none";
    });
  }, [order, open]);

  useEffect(() => {
    layout();
  }, [layout]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>, ci: number) => {
    if (open !== null || ci !== order[0]) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.style.transition = "none";
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      el,
      moved: false,
    };
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
      setOpen(order[0]); // a tap → open the story
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
        position: "relative",
        zIndex: 10,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div style={{ position: "relative", width: "min(86vw,360px)", height: 500 }}>
        {chapters.map((c, ci) => (
          <div
            key={c.ch}
            ref={(el) => {
              cardRefs.current[ci] = el;
            }}
            onPointerDown={(e) => onDown(e, ci)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 440,
              borderRadius: 22,
              overflow: "hidden",
              background: c.coverBg,
              border: c.coverBorder,
              boxShadow: "0 24px 54px rgba(0,0,0,.4)",
              cursor: "pointer",
              touchAction: "pan-y",
              willChange: "transform",
              // initial resting stack (the effect re-applies the same values)
              transform: `translateY(${Math.min(ci, 3) * 14}px) scale(${
                1 - Math.min(ci, 3) * 0.05
              })`,
              opacity: ci > 3 ? 0 : 1,
              zIndex: chapters.length - ci,
            }}
          >
            {/* cover */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "30px 28px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: BALOO,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: ".22em",
                    color: c.chapColor,
                  }}
                >
                  CHAPTER {c.ch}
                </span>
                <span
                  style={{
                    fontFamily: BALOO,
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: "-.02em",
                    color: c.brandColor,
                  }}
                >
                  Veycho
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    fontFamily: ANTON,
                    fontSize: 64,
                    lineHeight: 0.86,
                    color: c.yearColor,
                  }}
                >
                  {c.year}
                </div>
                <div
                  style={{
                    fontFamily: BALOO,
                    fontWeight: 800,
                    fontSize: 32,
                    lineHeight: 1.02,
                    color: c.titleColor,
                    marginTop: 8,
                  }}
                >
                  {c.title}
                </div>
                <span
                  style={{
                    marginTop: 20,
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: c.pillBg,
                    color: c.pillColor,
                    fontFamily: BALOO,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: ".04em",
                    padding: "9px 18px",
                    borderRadius: 100,
                  }}
                >
                  Tap to read <ArrowRight size={13} />
                </span>
              </div>
            </div>

            {/* story (revealed on tap) */}
            {open === ci && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#f4ead6",
                  display: "flex",
                  flexDirection: "column",
                  padding: "28px 26px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: ANTON,
                      fontSize: 28,
                      color: c.storyYearColor,
                      lineHeight: 1,
                    }}
                  >
                    {c.year}
                  </span>
                  <span
                    style={{ height: 1, flex: 1, background: "rgba(7,24,33,.16)" }}
                  />
                  <span
                    style={{
                      fontFamily: BALOO,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: ".2em",
                      color: "#8a7a5c",
                    }}
                  >
                    CH. {c.ch}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: BALOO,
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#11262f",
                    margin: "8px 0 12px",
                    lineHeight: 1.04,
                  }}
                >
                  {c.title}
                </h3>
                <p
                  data-lenis-prevent
                  style={{
                    color: "#4a5a52",
                    fontSize: 15,
                    lineHeight: 1.6,
                    margin: 0,
                    flex: 1,
                    overflowY: "auto",
                    touchAction: "pan-y",
                  }}
                >
                  {c.body}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 16,
                    display: "inline-flex", alignItems: "center", gap: 7,
                    border: "1.5px solid rgba(7,24,33,.25)",
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
                  <ArrowLeft size={13} /> Back to pages
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {chapters.map((c, i) => (
          <span
            key={c.ch}
            style={{
              display: "inline-block",
              width: 10, height: 10, borderRadius: "50%",
              backgroundColor: i === activeDot ? "#edb63f" : "rgba(244,234,214,.25)",
              border: `1.5px solid ${i === activeDot ? "#edb63f" : "rgba(237,182,63,.4)"}`,
              transform: i === activeDot ? "scale(1.3)" : "scale(1)",
              transition: "all .3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Initial inline transform (matches the effect's `stacked`) so the deck paints
// as a neat stack on first frame, before the entrance fans it out.
function stackedInitial(i: number, n: number) {
  return `translateX(0px) translateY(${34 + (i - (n - 1) / 2) * 4}px) rotate(0deg) scale(.9)`;
}
