"use client";

import { useEffect, useRef } from "react";

/**
 * Replaces the mouse pointer with a 🍔 built from CSS layers that eases toward
 * the cursor (lerp) for the same damped feel as the scroll.
 *
 *  - Wiggle it (shake left/right) and the fillings tumble out, then refill.
 *  - Click to take a bite — a chunk is masked out of the whole burger. Bite
 *    again and again until it's gone; it refills itself after a short pause.
 *
 * Mouse only — touch devices keep the native cursor.
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // mouse only, and never on phone-sized screens (covers touch laptops and
    // mobile device emulation that still report a fine pointer)
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(max-width: 760px)").matches) return;
    const burger = el.querySelector<HTMLElement>(".vc-burger");
    if (!burger) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lerp = reduce ? 1 : 0.16; // lower = laggier trail

    document.documentElement.classList.add("vc-cursor-on");

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let cs = 1; // current (rendered) scale
    let hot = false;
    let shown = false;
    let spillTimer = 0;
    let resetTimer = 0;
    let chompTimer = 0;
    let overIframe = false;

    // ---- bites: circular chunks masked out of the burger, one per click ----
    const BITES = [
      { x: "100%", y: "40%", r: 12 },
      { x: "0%", y: "60%", r: 12 },
      { x: "92%", y: "4%", r: 10 },
      { x: "8%", y: "100%", r: 13 },
    ];
    const MAX_BITES = BITES.length;
    let bites = 0;

    const applyBites = (count: number) => {
      if (count <= 0) {
        burger.style.webkitMaskImage = "none";
        burger.style.maskImage = "none";
        return;
      }
      const imgs = BITES.slice(0, count)
        .map(
          (b) =>
            `radial-gradient(circle at ${b.x} ${b.y}, transparent 0 ${b.r}px, #000 ${b.r + 1}px)`
        )
        .join(",");
      burger.style.webkitMaskImage = imgs;
      burger.style.maskImage = imgs;
      burger.style.webkitMaskRepeat = "no-repeat";
      burger.style.maskRepeat = "no-repeat";
      // intersect every layer so the union of the holes is removed
      burger.style.webkitMaskComposite = "source-in";
      burger.style.maskComposite = "intersect";
    };

    const resetBurger = () => {
      bites = 0;
      applyBites(0);
      burger.style.opacity = "1";
      burger.style.transform = "scale(1)";
    };

    const bite = () => {
      window.clearTimeout(resetTimer);
      if (bites < MAX_BITES) {
        bites += 1;
        applyBites(bites);
        if (bites >= MAX_BITES) {
          // last bite — the burger's gone: shrink + fade away
          burger.style.opacity = "0";
          burger.style.transform = "scale(.4)";
        } else {
          // a satisfying little chomp
          burger.style.transform = "scale(.82)";
          window.clearTimeout(chompTimer);
          chompTimer = window.setTimeout(() => {
            if (bites < MAX_BITES) burger.style.transform = "scale(1)";
          }, 150);
        }
      }
      // refill after a pause (sooner once it has fully vanished)
      resetTimer = window.setTimeout(
        resetBurger,
        bites >= MAX_BITES ? 1300 : 2400
      );
    };

    // ---- wiggle: shaking the cursor spills the fillings out ----
    const triggerSpill = () => {
      el.classList.add("vc-spill");
      window.clearTimeout(spillTimer);
      spillTimer = window.setTimeout(() => el.classList.remove("vc-spill"), 1400);
    };
    let lastX = tx;
    let lastDir = 0;
    let flips: number[] = [];
    let lastWiggleAt = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (overIframe) {
        // Back on the page after leaving the map/iframe — re-enable cursor:none,
        // snap to the re-entry point (no long slide), and force a re-reveal.
        overIframe = false;
        document.documentElement.classList.add("vc-cursor-on");
        cx = tx;
        cy = ty;
        shown = false;
      }
      if (!shown) {
        shown = true;
        if (reduce) {
          cx = tx;
          cy = ty;
        }
        el.style.opacity = "1";
      }
      // detect a wiggle = several quick horizontal direction reversals
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (Math.abs(dx) > 4) {
        const dir = dx > 0 ? 1 : -1;
        if (lastDir !== 0 && dir !== lastDir) {
          const now = e.timeStamp;
          flips.push(now);
          while (flips.length && now - flips[0] > 600) flips.shift();
          if (flips.length >= 4 && now - lastWiggleAt > 1500) {
            lastWiggleAt = now;
            flips = [];
            triggerSpill();
          }
        }
        lastDir = dir;
      }
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      // Over a cross-origin iframe (e.g. the Google map) the parent window stops
      // receiving mousemove, so the burger would freeze there. Hide it and hand
      // the native cursor back; onMove restores it once we're back on the page.
      if (t && t.tagName === "IFRAME") {
        overIframe = true;
        el.style.opacity = "0";
        document.documentElement.classList.remove("vc-cursor-on");
        return;
      }
      hot = !!t?.closest?.(
        "a,button,[role='button'],input,textarea,select,label,summary"
      );
    };
    const onDown = () => bite();
    const onLeave = () => {
      shown = false;
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    document.addEventListener("mouseleave", onLeave);

    let raf = 0;
    const loop = () => {
      const sTarget = hot ? 1.35 : 1;
      cx += (tx - cx) * lerp;
      cy += (ty - cy) * lerp;
      cs += (sTarget - cs) * (reduce ? 1 : 0.2);
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${cs})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(spillTimer);
      window.clearTimeout(resetTimer);
      window.clearTimeout(chompTimer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("vc-cursor-on");
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="vc-cursor" style={{ opacity: 0 }}>
      <div className="vc-burger">
        <span className="b-top" />
        <span className="b-lettuce" />
        <span className="b-cheese" />
        <span className="b-patty" />
        <span className="b-bottom" />
      </div>
    </div>
  );
}
