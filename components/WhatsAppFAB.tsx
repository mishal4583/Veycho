"use client";

import { useState } from "react";

const SURFACE = "#0b2c39";
const GOLD    = "#edb63f";
const DARK    = "#071821";
const CREAM   = "#f4ead6";

const IG_GRADIENT = "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";

function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.118 1.529 5.845L.057 23.571a.75.75 0 0 0 .921.921l5.726-1.472A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.964-1.359l-.355-.212-3.397.873.888-3.307-.231-.369A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
    </svg>
  );
}

function IgIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const fabBase = {
  position: "fixed" as const,
  right: 26,
  zIndex: 9000,
  width: 56,
  height: 56,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `2px solid ${GOLD}`,
  textDecoration: "none",
  transition: "background .25s ease, color .25s ease, box-shadow .25s ease, transform .25s ease",
  willChange: "transform",
};

export default function WhatsAppFAB({ phone, instagram }: { phone: string; instagram?: string }) {
  const [waHovered, setWaHovered] = useState(false);
  const [igHovered, setIgHovered] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${digits}?text=${encodeURIComponent("Hi! I'd like to know more about Veycho Resto-Cafe.")}`;

  return (
    <>
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Veycho on Instagram"
          onMouseEnter={() => setIgHovered(true)}
          onMouseLeave={() => setIgHovered(false)}
          style={{
            ...fabBase,
            bottom: 166,
            background: igHovered ? IG_GRADIENT : SURFACE,
            color: igHovered ? "#fff" : CREAM,
            borderColor: igHovered ? "transparent" : GOLD,
            boxShadow: igHovered
              ? "0 6px 24px rgba(220,39,67,.35)"
              : "0 4px 16px rgba(0,0,0,.45)",
            transform: igHovered ? "scale(1.08) translateZ(0)" : "translateZ(0)",
          }}
        >
          <IgIcon size={22} />
        </a>
      )}

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onMouseEnter={() => setWaHovered(true)}
        onMouseLeave={() => setWaHovered(false)}
        style={{
          ...fabBase,
          bottom: 100,
          background: waHovered ? GOLD : SURFACE,
          color: waHovered ? DARK : CREAM,
          boxShadow: waHovered
            ? "0 6px 24px rgba(237,182,63,.4)"
            : "0 4px 16px rgba(0,0,0,.45)",
          transform: waHovered ? "scale(1.08) translateZ(0)" : "translateZ(0)",
        }}
      >
        <WhatsAppIcon size={26} />
      </a>
    </>
  );
}
