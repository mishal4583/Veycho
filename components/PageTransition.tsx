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
   Site-wide wavy-curtain page transition — 3-phase design.

   Phase sequence for a normal link click:
     idle → cover → hold → reveal → idle

   cover : curtain rises from below to cover the screen (COVER_MS).
   hold  : curtain stays covering; router.push fires immediately so the
           server has the full HOLD_MS window to respond before reveal.
   reveal: curtain rises off the top, exposing the new page (REVEAL_MS).

   The mobile-menu "snap" path (screen already covered) skips the cover
   phase: snap → hold → reveal → idle.
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

const FALLBACK_API: TransitionApi = {
  navigate: (target) => {
    if (typeof window === "undefined") return;
    if (target.type === "route") window.location.assign(target.href);
    else document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth" });
  },
};

export function usePageTransition(): TransitionApi {
  return useContext(TransitionContext) ?? FALLBACK_API;
}

// idle  → parked below the fold
// cover → curtain rising from below to cover screen
// hold  → fully covering; new page loads behind it
// reveal→ curtain rising off the top to expose new page
// snap  → instantly jump to covered (mobile menu handoff), then hold
type Phase = "idle" | "cover" | "hold" | "reveal" | "snap";

const COVER_MS  = 220; // rise from below to cover screen
const HOLD_MS   = 320; // hold covered while server responds
const REVEAL_MS = 230; // rise off the top to expose new page
const EASE      = "cubic-bezier(.76,0,.24,1)";
const EASE_OUT  = "cubic-bezier(.16,1,.3,1)";

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
      const next: Phase = opts?.immediate ? "snap" : "cover";
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

  useEffect(() => {
    if (phase === "cover") {
      clearTimers();
      // Move to hold once the cover animation completes.
      timersRef.current.push(
        window.setTimeout(() => setPhase("hold"), COVER_MS)
      );
    } else if (phase === "hold") {
      clearTimers();
      // Fire the route push immediately — the page loads while we hold.
      runAction(pendingRef.current);
      // Double-RAF before reveal so the browser commits the hold state
      // (transition:none) before we re-enable transitions for the upward sweep.
      timersRef.current.push(
        window.setTimeout(() => {
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = window.requestAnimationFrame(() => setPhase("reveal"));
          });
        }, HOLD_MS)
      );
    } else if (phase === "snap") {
      // Screen is already covered (mobile menu). Fire the action immediately,
      // then hold for HOLD_MS before revealing so the server can respond.
      clearTimers();
      runAction(pendingRef.current);
      timersRef.current.push(
        window.setTimeout(() => {
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = window.requestAnimationFrame(() => setPhase("reveal"));
          });
        }, HOLD_MS)
      );
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
   cover : rises from below to cover  (translateY 100% → 0%)
   hold  : stays put, no transition   (translateY 0%)
   reveal: rises further off the top  (translateY 0% → -100%)
   snap  : instantly snaps to covered (translateY 0%, no transition)
   idle  : parked below the fold      (translateY 100%, no transition) */
function Curtain({ phase }: { phase: Phase }) {
  const idle = phase === "idle";

  const transform =
    phase === "idle"
      ? "translateY(100%)"   // parked below
      : phase === "reveal"
        ? "translateY(-100%)" // fully above, exposing new page
        : "translateY(0)";    // cover / hold / snap — at center covering screen

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
        // Animate only during cover (rising in) and reveal (rising out).
        // Hold and snap use "none" so the curtain stays still — this is also
        // what ensures the double-RAF trick correctly primes the reveal sweep.
        const transition =
          phase === "cover"
            ? `transform ${COVER_MS}ms ${EASE} ${wv.inDelay}s`
            : phase === "reveal"
              ? `transform ${REVEAL_MS}ms ${EASE_OUT} ${wv.outDelay}s`
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
