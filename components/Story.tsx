"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { scrollToId } from "@/lib/scroll";
import { DEFAULT_CONTENT, type StoryContent } from "@/lib/content-defaults";

// How much scroll (in viewport heights) reveals the whole paragraph. Once it's
// consumed the sticky pin releases and the next slide scrolls in.
const READ_VH = 2.8;
// Colour of read text, and how faint unread text sits against the background.
const READ = "#f4ead6";
const DIM = 0.12;

// Helvetica-style stack, falling back to the app's Hanken Grotesk grotesk.
const SANS =
  '"Helvetica Neue", Helvetica, var(--font-hanken), Arial, sans-serif';

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

export default function Story({
  content = DEFAULT_CONTENT.story,
}: {
  content?: StoryContent;
}) {
  const STORY_WORDS = content.paragraph.split(" ");
  const STORY_TOTAL = STORY_WORDS.length;

  const pinRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [pinHeight, setPinHeight] = useState<number | undefined>(undefined);

  // Map vertical scroll progress through the tall pinned section to a moving
  // read-front; each word fades (CSS transition) as the front crosses it.
  // Opacity is written straight to the DOM (no React re-render per frame).
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;

    // Reduced motion: show everything settled, skip the pin + reveal.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wordRefs.current.forEach((el) => el && (el.style.opacity = "1"));
      if (ctaRef.current) ctaRef.current.style.opacity = "1";
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transform = "none";
      }
      return;
    }

    // Entrance: a damped "stack up" rise, played once when the section enters.
    let io: IntersectionObserver | undefined;
    const content = contentRef.current;
    if (content && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              content.style.animation =
                "vc-stack-rise 1.15s cubic-bezier(.2,1.25,.35,1) both";
              io?.disconnect();
              break;
            }
          }
        },
        { threshold: 0.12 }
      );
      io.observe(pin);
    } else if (content) {
      content.style.opacity = "1";
      content.style.transform = "none";
    }

    let raf = 0;
    let readPx = window.innerHeight * READ_VH;

    const measure = () => {
      readPx = window.innerHeight * READ_VH;
      setPinHeight(window.innerHeight + readPx);
    };

    const paint = () => {
      const scrollPast = -pin.getBoundingClientRect().top;
      const progress = clamp(scrollPast / readPx, 0, 1);
      const front = progress * STORY_TOTAL; // words fully revealed so far
      const refs = wordRefs.current;
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i];
        if (!el) continue;
        el.style.opacity = front >= i + 1 ? "1" : String(DIM);
      }
      // "Read our story" stays visible the whole time the section is on screen
      // (no longer gated behind the scroll-reveal finishing).
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    measure();
    paint();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      id="story"
      data-screen-label="Story"
      ref={pinRef}
      style={{
        position: "relative",
        background: "#0b2c39",
        height: pinHeight,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "clamp(150px, 18vh, 220px) 48px",
        }}
      >
        <div
          ref={contentRef}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: 0,
            transform: "translateY(90px)",
            willChange: "opacity, transform",
          }}
        >
          <p
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: "clamp(30px,4.4vw,68px)",
              lineHeight: 1.18,
              letterSpacing: "-.015em",
              maxWidth: 1080,
              margin: "0 0 44px",
              textWrap: "balance",
            }}
          >
            {STORY_WORDS.map((word, i) => (
              <Fragment key={i}>
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                  style={{
                    display: "inline-block",
                    color: READ,
                    opacity: DIM,
                    transition: "opacity .4s ease",
                  }}
                >
                  {word}
                </span>
                {i < STORY_TOTAL - 1 ? " " : null}
              </Fragment>
            ))}
          </p>

          <a
            ref={ctaRef}
            href="#journey"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("journey");
            }}
            style={{
              background: "#edb63f",
              color: "#071821",
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: ".04em",
              padding: "16px 32px",
              borderRadius: 100,
              textDecoration: "none",
              opacity: 1,
              transform: "translateY(0)",
              transition: "opacity .5s ease, transform .5s ease",
            }}
          >
            {content.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
