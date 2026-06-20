"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { scrollToId } from "@/lib/scroll";
import { WAVES, WAVE_DEPTH, WAVE_TILE, waveBg } from "@/lib/wave";

/* ============================================================
   Site-wide wavy-curtain page transition.

   Any internal navigation routed through `navigate()` plays the same
   gold + teal scalloped curtain the mobile menu uses: it rises to cover
   the screen, the route change (or in-page scroll) happens *behind* the
   curtain, then the curtain recedes to reveal the new page. Because both
   directions go through here, "forward" and "back" navigations animate
   identically — on desktop and mobile alike.
   ============================================================ */

type Target =
  | { type: "route"; href: string }
  | { type: "scroll"; id: string };

type NavOptions = {
  /**
   * Skip the rising animation and jump straight to "covered". Used when the
   * screen is *already* covered (e.g. the mobile menu overlay is open), so the
   * global curtain takes over seamlessly instead of waving a second time.
   */
  immediate?: boolean;
};

type TransitionApi = { navigate: (target: Target, opts?: NavOptions) => void };

const TransitionContext = createContext<TransitionApi | null>(null);

export function usePageTransition(): TransitionApi {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error("usePageTransition must be used within <PageTransition>");
  }
  return ctx;
}

// idle  → parked below the fold
// sweep → ONE continuous wipe, below → above; the page swaps invisibly at the
//         instant it is fully covered (no pause, no second stroke)
// snap  → jump straight to "covered" (used when the screen is already covered,
//         e.g. the mobile menu) then hand off to "reveal"
// reveal→ the second half only (covered → above), for the snap hand-off
type Phase = "idle" | "sweep" | "snap" | "reveal";

const SWEEP_MS = 900; // full single wipe (below → above)
const REVEAL_MS = 520; // reveal-only half (covered → above), for the hand-off
const COVER_AT = SWEEP_MS / 2; // mid-sweep: fully covered → swap the page here
const EASE = "cubic-bezier(.76,0,.24,1)";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Jump (no smooth) to an in-page target, threading through Lenis if present. */
function jumpToId(id: string) {
  const target: number | HTMLElement | null =
    id === "top" ? 0 : document.getElementById(id);
  if (target === null) return;
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, { immediate: true, force: true });
    return;
  }
  const top = typeof target === "number" ? target : target.offsetTop;
  window.scrollTo({ top, behavior: "auto" });
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const pendingRef = useRef<Target | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  // mirror phase into a ref so navigate() can read it synchronously
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const runAction = (t: Target | null) => {
    if (!t) return;
    if (t.type === "route") router.push(t.href);
    else jumpToId(t.id);
  };

  const lockScroll = useCallback((lock: boolean) => {
    const lenis = window.__lenis;
    if (lock) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, []);

  const navigate = useCallback(
    (target: Target, opts?: NavOptions) => {
      // Reduced motion: do the action immediately, no curtain.
      if (prefersReducedMotion()) {
        if (target.type === "route") router.push(target.href);
        else scrollToId(target.id);
        return;
      }
      if (phaseRef.current !== "idle") return; // ignore clicks mid-transition
      const next: Phase = opts?.immediate ? "snap" : "sweep";
      pendingRef.current = target;
      phaseRef.current = next;
      lockScroll(true);
      setPhase(next);
    },
    [router, lockScroll]
  );

  const finishIdle = useCallback(() => {
    clearTimers();
    pendingRef.current = null;
    lockScroll(false);
    setPhase("idle");
  }, [lockScroll]);

  // Drive the single continuous sweep.
  useEffect(() => {
    if (phase === "sweep") {
      clearTimers();
      // Swap the page at the covered mid-point — the wipe never stops, so this
      // reads as one motion: the old page wipes up, the new page wipes in.
      timersRef.current.push(
        window.setTimeout(() => runAction(pendingRef.current), COVER_AT),
        window.setTimeout(finishIdle, SWEEP_MS)
      );
    } else if (phase === "snap") {
      // Screen is already covered (mobile menu): act now, then reveal-sweep.
      clearTimers();
      runAction(pendingRef.current);
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = window.requestAnimationFrame(() => setPhase("reveal"));
      });
    } else if (phase === "reveal") {
      clearTimers();
      timersRef.current.push(window.setTimeout(finishIdle, REVEAL_MS));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => clearTimers(), []);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <Curtain phase={phase} />
    </TransitionContext.Provider>
  );
}

/* ---- the full-screen curtain ----
   One single, continuous upward wipe (no rise-then-recede): the band starts
   below the viewport, sweeps up to cover, then keeps going off the top to
   reveal the new page. Scalloped on both edges so the leading edge is wavy
   on the way in *and* on the way out. */
function Curtain({ phase }: { phase: Phase }) {
  const idle = phase === "idle";
  // below → covering → above, always travelling the same direction.
  const transform =
    phase === "snap"
      ? "translateY(0)" // already covered (held), about to reveal
      : phase === "sweep" || phase === "reveal"
        ? "translateY(-100%)" // sweep all the way up and off the top
        : "translateY(100%)"; // idle: parked below the fold

  const scallop = (color: string, dir: "up" | "down"): CSSProperties =>
    ({
      position: "absolute",
      left: -WAVE_TILE,
      right: -WAVE_TILE,
      top: dir === "up" ? 0 : undefined,
      bottom: dir === "down" ? 0 : undefined,
      height: WAVE_DEPTH,
      backgroundImage: waveBg(color, dir),
      backgroundRepeat: "repeat-x",
      backgroundPosition: dir === "up" ? "left bottom" : "left top",
      backgroundSize: `${WAVE_TILE}px ${WAVE_DEPTH}px`,
      "--vc-scallop-tile": `${WAVE_TILE}px`,
      animation: "vc-scallop-roll 5s linear infinite",
    }) as CSSProperties;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        overflow: "hidden",
        pointerEvents: idle ? "none" : "auto",
      }}
    >
      {WAVES.map((wv, i) => {
        // Transition only while actively sweeping; snap otherwise so the
        // "immediate" hand-off and the idle re-park don't animate. A small
        // per-layer delay fans the two colours so it reads as a wave, not a slab.
        const transition =
          phase === "sweep"
            ? `transform ${SWEEP_MS}ms ${EASE} ${wv.inDelay}s`
            : phase === "reveal"
              ? `transform ${REVEAL_MS}ms ${EASE} ${wv.inDelay}s`
              : "none";
        return (
          <div
            key={wv.color}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: -WAVE_DEPTH,
              height: `calc(100% + ${2 * WAVE_DEPTH}px)`,
              zIndex: i,
              transform,
              transition,
            }}
          >
            {/* top scalloped edge — leads the cover */}
            <div style={scallop(wv.color, "up")} />
            {/* solid fill between the two scalloped edges */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: WAVE_DEPTH - 1,
                bottom: WAVE_DEPTH - 1,
                background: wv.color,
              }}
            />
            {/* bottom scalloped edge — leads the reveal */}
            <div style={scallop(wv.color, "down")} />
          </div>
        );
      })}
    </div>
  );
}
