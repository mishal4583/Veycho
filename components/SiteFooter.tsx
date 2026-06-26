"use client";

import Scallop from "./Scallop";
import TransitionLink from "./TransitionLink";
import { usePageTransition } from "./PageTransition";
import { DEFAULT_CONTENT, type FooterContent } from "@/lib/content-defaults";

function IgIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const IG_GRADIENT = "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)";

const colLink = {
  color: "#8aa1ab",
  textDecoration: "none",
  fontSize: 15,
} as const;

const colHead = {
  color: "#edb63f",
  fontFamily: "var(--font-baloo), sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: ".2em",
} as const;

export default function SiteFooter({
  content = DEFAULT_CONTENT.footer,
  topScallop = true,
  topScallopColor = "#edb63f",
}: {
  content?: FooterContent;
  topScallop?: boolean;
  topScallopColor?: string;
}) {
  const { navigate } = usePageTransition();
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        background: "#071821",
        padding: "90px clamp(20px,5vw,48px) 40px",
      }}
    >
      {topScallop && <Scallop edge="top" color={topScallopColor} />}

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 800,
            color: "#edb63f",
            fontSize: "clamp(80px,20vw,300px)",
            lineHeight: 0.8,
            letterSpacing: "-.04em",
            textAlign: "center",
          }}
        >
          {DEFAULT_CONTENT.hero.title}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 30,
            flexWrap: "wrap",
            borderTop: "1px solid rgba(244,234,214,.1)",
            marginTop: 30,
            paddingTop: 30,
          }}
        >
          <div style={{ maxWidth: 300 }}>
            <p
              style={{
                color: "#f4ead6",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 18,
                margin: "0 0 8px",
              }}
            >
              {content.brandName}
            </p>
            <p
              style={{
                color: "#7c9298",
                fontSize: 14,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {content.description}
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
            <span style={colHead}>EXPLORE</span>
            {content.explore.map((l) =>
              l.target.startsWith("#") ? (
                <a
                  key={l.label}
                  href={l.target}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({ type: "scroll", id: l.target.slice(1) });
                  }}
                  style={colLink}
                >
                  {l.label}
                </a>
              ) : (
                <TransitionLink key={l.label} href={l.target} style={colLink}>
                  {l.label}
                </TransitionLink>
              )
            )}
          </div>

          <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
            <span style={colHead}>FOLLOW</span>
            {content.instagram && (
              <a
                href={content.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 9,
                  background: IG_GRADIENT,
                  borderRadius: 100, padding: "9px 18px",
                  color: "#fff", textDecoration: "none",
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700, fontSize: 13, letterSpacing: ".04em",
                  alignSelf: "flex-start",
                }}
              >
                <IgIcon size={15} />
                Follow on Instagram
              </a>
            )}
            {content.facebook && (
              <a href={content.facebook} target="_blank" rel="noopener noreferrer" style={colLink}>
                Facebook
              </a>
            )}
            <a href={`mailto:${content.email}`} style={colLink}>
              Email us
            </a>
          </div>
        </div>

        <p
          style={{
            color: "#5e7882",
            fontSize: 12.5,
            margin: "30px 0 0",
            textAlign: "center",
          }}
        >
          {content.copyright}
        </p>
      </div>
    </footer>
  );
}
