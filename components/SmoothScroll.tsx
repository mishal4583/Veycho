"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Site-wide damped ("laggy but smooth") scrolling via Lenis. Lenis eases the
 * *real* scroll position, so position: sticky and getBoundingClientRect-based
 * effects (e.g. the Chef Specials pin) keep working — and inherit the smoothing.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Honour reduced-motion: leave native scrolling untouched.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.07, // lower = more lag in the trail, still eased/smooth
      wheelMultiplier: 1,
      smoothWheel: true,
    });

    // expose so in-page anchors (lib/scroll.ts) can scroll through Lenis
    window.__lenis = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      if (window.__lenis === lenis) delete window.__lenis;
    };
  }, []);

  return null;
}
