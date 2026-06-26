/**
 * Shared "wavy curtain" geometry — the gold + teal scalloped band that rises to
 * cover the screen. Used by both the mobile nav menu (components/Nav.tsx) and
 * the site-wide page transition (components/PageTransition.tsx) so the two read
 * as the same motion.
 */

export const WAVE_TILE = 160; // one bump period (px)
export const WAVE_DEPTH = 70; // how far each bump reaches up

/**
 * A repeating SVG band of rounded bumps in a single solid color.
 * `dir: "up"`   → bumps reach upward, color fills the bottom (a leading edge
 *                 that points into the area above — used at the top of a band).
 * `dir: "down"` → bumps reach downward, color fills the top (used at the bottom
 *                 of a band so a band can be scalloped on both edges).
 */
export function waveBg(color: string, dir: "up" | "down" = "up"): string {
  const w = WAVE_TILE;
  const h = WAVE_DEPTH;
  const q = w / 4;
  const d =
    dir === "up"
      ? `M0,${h} C${q},${h} ${q},0 ${w / 2},0 C${w - q},0 ${w - q},${h} ${w},${h} Z`
      : `M0,0 C${q},0 ${q},${h} ${w / 2},${h} C${w - q},${h} ${w - q},0 ${w},0 Z`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// Stacked curtain layers (later = drawn on top). Gold leads in, the deep teal
// settles last. `inDelay` staggers the rise (cover), `outDelay` the recede
// (reveal), so the layers fan apart instead of moving as one slab.
export const WAVES = [
  { color: "#edb63f", inDelay: 0, outDelay: 0.12 },
  { color: "#0b2c39", inDelay: 0.1, outDelay: 0.05 },
] as const;
