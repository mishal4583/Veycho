"use client";

import {
  createElement,
  useEffect,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  /** Element to render (default: div). */
  as?: ElementType;
  /** Initial downward offset in px before reveal. */
  y?: number;
  /** Stagger delay in ms applied once revealed. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>;

/**
 * Reveal-on-scroll wrapper. Replaces the original rAF loop with an
 * IntersectionObserver. Honors prefers-reduced-motion.
 */
export default function Reveal({
  as = "div",
  y = 40,
  delay = 0,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node]);

  const revealStyle: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? "none" : `translateY(${y}px)`,
    transition:
      "opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)",
    transitionDelay: shown ? `${delay}ms` : "0ms",
    ...style,
  };

  return createElement(
    as,
    { ref: setNode, className, style: revealStyle, ...rest },
    children
  );
}
