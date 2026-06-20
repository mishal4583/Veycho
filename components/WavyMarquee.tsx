import type { CSSProperties } from "react";

type WavyMarqueeProps = {
  /** Words to scroll. Rendered twice back-to-back so the -50% loop is seamless. */
  words: string[];
  fontSize?: string;
  /** Text colour. */
  color?: string;
  /** Colour of the ✦ that trails each word. */
  accent?: string;
  /** Strip background (default transparent so it inherits the section behind it). */
  bg?: string;
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  /** Peak vertical wave travel in px. */
  amplitude?: number;
  /** Per-word tilt in degrees (alternates sign). */
  tilt?: number;
  padding?: string;
  style?: CSSProperties;
};

/**
 * A scrolling marquee that *waves* — each word is pushed along a sine curve and
 * tilted, so the line ripples as it travels. Reuses the site's `vc-marquee`
 * keyframe (0 → -50%); rendering the word list twice means -50% lands exactly on
 * the seam for a seamless loop. The wave offset is computed per single copy so
 * both halves match. Pauses on hover (inherited from `.vc-marquee-track`).
 */
export default function WavyMarquee({
  words,
  fontSize = "clamp(28px,5vw,64px)",
  color = "#f4ead6",
  accent = "#edb63f",
  bg = "transparent",
  duration = 30,
  reverse = false,
  amplitude = 12,
  tilt = 2.5,
  padding = "26px 0",
  style,
}: WavyMarqueeProps) {
  const n = words.length;

  const copy = (prefix: string) =>
    words.map((w, i) => (
      <span
        key={prefix + i}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.28em",
          paddingRight: "0.5em",
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 800,
          fontSize,
          lineHeight: 1,
          letterSpacing: "-.02em",
          color,
          whiteSpace: "nowrap",
          // sine across one copy → ripple; tilt alternates for bounce
          transform: `translateY(${(
            Math.sin((i / n) * Math.PI * 2) * amplitude
          ).toFixed(2)}px) rotate(${i % 2 ? tilt : -tilt}deg)`,
        }}
      >
        {w}
        <span style={{ color: accent, fontSize: "0.55em" }}>✦</span>
      </span>
    ));

  return (
    <div
      aria-hidden
      style={{ background: bg, overflow: "hidden", padding, ...style }}
    >
      <div
        className="vc-marquee-track"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {copy("a-")}
        {copy("b-")}
      </div>
    </div>
  );
}
