import type { CSSProperties } from "react";

type ScallopProps = {
  /** Which edge of the parent section to attach the scallops to. */
  edge?: "top" | "bottom";
  /**
   * Color of the rolling bumps. Pass the adjacent section's background so the
   * two sections interlock as one continuous unit.
   */
  color?: string;
  style?: CSSProperties;
};

/**
 * Animated scalloped ribbon edge — a rolling wave of bumps in a single solid
 * color over a transparent backing (no background strip). Built from an SVG
 * cosine wave so both the peaks AND the valleys are smoothly rounded (no sharp
 * cusps). The bumps bulge into the section and read as the neighbouring
 * section's edge spilling across the seam. Parent must be position: relative.
 */
export default function Scallop({
  edge = "top",
  color = "#edb63f",
  style,
}: ScallopProps) {
  // Bump geometry — tweak these two freely:
  //   radius = half of one bump's width   depth = how far it bulges in
  const radius = 90;
  const depth = 80;
  const tile = radius * 2; // one full wave period (width)

  const w = tile;
  const h = depth;
  const q = w / 4; // control-point offset → smooth (cosine-like) curves

  // Wave outline. Peaks reach fully into the section, valleys round back to the
  // seam with a horizontal tangent so adjacent periods meet seamlessly.
  const d =
    edge === "top"
      ? // bumps hang down from the top seam (color fills the top)
        `M0,0 C${q},0 ${q},${h} ${w / 2},${h} C${w - q},${h} ${w - q},0 ${w},0 Z`
      : // bumps rise up to the bottom seam (color fills the bottom)
        `M0,${h} C${q},${h} ${q},0 ${w / 2},0 C${w - q},0 ${w - q},${h} ${w},${h} Z`;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`;

  const base = {
    position: "absolute",
    [edge]: 0,
    left: -tile,
    width: `calc(100% + ${tile * 2}px)`,
    height: depth,
    backgroundColor: "transparent",
    backgroundRepeat: "repeat-x",
    backgroundSize: `${tile}px ${depth}px`,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    // one tile width — the keyframe reads this to roll seamlessly at any size
    ["--vc-scallop-tile"]: `${tile}px`,
    animation: "vc-scallop-roll 5s linear infinite",
    zIndex: 4,
    pointerEvents: "none",
    ...style,
  } as CSSProperties;

  return <div aria-hidden style={base} />;
}
