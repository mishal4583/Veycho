"use client";

import { useState } from "react";

const SURFACE = "#0b2c39";
const GOLD    = "#edb63f";
const DARK    = "#071821";
const CREAM   = "#f4ead6";

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ShareButton({
  title,
  url,
  variant = "pill",
}: {
  title?: string;
  url?: string;
  /** "pill" = labelled pill (for hero CTA rows), "icon" = 42×42 circle (for nav corners) */
  variant?: "pill" | "icon";
}) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  async function share() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title ?? "Check this out on Veycho — Explore Wayanad";

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // user cancelled — do nothing
        return;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const active = copied || hovered;

  if (variant === "icon") {
    return (
      <button
        onClick={share}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Share this page"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: active ? GOLD : "transparent",
          color: active ? DARK : CREAM,
          border: `2px solid ${active ? GOLD : "rgba(244,234,214,.4)"}`,
          cursor: "pointer",
          transition: "background .2s ease, color .2s ease, border-color .2s ease",
        }}
      >
        {copied ? <CheckIcon size={16} /> : <ShareIcon size={16} />}
      </button>
    );
  }

  // pill variant
  return (
    <button
      onClick={share}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Share this page"
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: active ? GOLD : SURFACE,
        color: active ? DARK : CREAM,
        border: `2px solid ${GOLD}`,
        borderRadius: 100, padding: "12px 24px",
        fontFamily: "var(--font-baloo), sans-serif",
        fontWeight: 700, fontSize: 13, letterSpacing: ".04em",
        cursor: "pointer",
        transition: "background .2s ease, color .2s ease",
      }}
    >
      {copied ? <CheckIcon size={14} /> : <ShareIcon size={14} />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
