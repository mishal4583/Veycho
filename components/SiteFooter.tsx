"use client";

import Scallop from "./Scallop";
import TransitionLink from "./TransitionLink";
import { usePageTransition } from "./PageTransition";
import { DEFAULT_CONTENT, type FooterContent } from "@/lib/content-defaults";

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
}: {
  content?: FooterContent;
}) {
  const { navigate } = usePageTransition();
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 2,
        background: "#071821",
        padding: "90px 48px 40px",
      }}
    >
      <Scallop edge="top" color="#edb63f" />

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
            <a href={content.instagram || "#"} style={colLink}>
              Instagram
            </a>
            <a href={content.facebook || "#"} style={colLink}>
              Facebook
            </a>
            <a href={`mailto:${content.email}`} style={colLink}>
              Email
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
