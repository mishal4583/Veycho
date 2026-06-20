"use client";

import { useEffect, useRef } from "react";
import Reveal from "./Reveal";
import Scallop from "./Scallop";
import { DEFAULT_CONTENT, type HeroContent } from "@/lib/content-defaults";

export default function Hero({ content = DEFAULT_CONTENT.hero }: { content?: HeroContent }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force muted autoplay + loop (some browsers drop these on hydration).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    tryPlay();
    const onEnded = () => {
      v.currentTime = 0;
      tryPlay();
    };
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <section
      id="top"
      data-screen-label="Hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#edb63f",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* soft radial glow, top-right */}
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,rgba(7,24,33,.06),transparent 70%)",
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "150px 48px 30px",
          position: "relative",
        }}
      >
        {/* spinning circular badge */}
        <div
          className="vc-hero-badge"
          style={{ position: "absolute", top: 104, right: 44, width: 190, height: 190 }}
        >
          <svg
            viewBox="0 0 200 200"
            style={{ width: 190, height: 190, animation: "vc-spin 18s linear infinite" }}
          >
            <defs>
              <path
                id="vc-circ"
                d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
              />
            </defs>
            <text
              fill="#071821"
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontSize: "15.5px",
                fontWeight: 700,
                letterSpacing: "1.4px",
              }}
            >
              <textPath href="#vc-circ">{content.badgeText}</textPath>
            </text>
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: "50%",
                background: "#071821",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#edb63f",
                fontSize: 32,
              }}
            >
              ✦
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Reveal
            y={24}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              color: "#071821",
              fontSize: 14,
              letterSpacing: ".24em",
              marginBottom: 6,
            }}
          >
            {content.label}
          </Reveal>

          <Reveal
            as="h1"
            y={44}
            delay={80}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              color: "#071821",
              fontSize: "clamp(86px,15vw,236px)",
              lineHeight: 0.84,
              letterSpacing: "-.04em",
              margin: 0,
            }}
          >
            {content.title}
          </Reveal>

          <Reveal
            y={30}
            delay={180}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(10px, 3vw, 20px)",
              marginTop: 18,
              flexWrap: "nowrap",
            }}
          >
            <span style={{ color: "#071821", fontSize: "clamp(22px,5vw,34px)", lineHeight: 1, flexShrink: 0 }}>✦</span>
            <h2
              style={{
                fontFamily: "var(--font-anton), sans-serif",
                fontWeight: 400,
                color: "#071821",
                fontSize: "clamp(24px,3vw,46px)",
                lineHeight: 1.05,
                margin: 0,
                minWidth: 0,
                textTransform: "uppercase",
                letterSpacing: ".01em",
              }}
            >
              {content.tagline}
            </h2>
            <span style={{ color: "#071821", fontSize: "clamp(22px,5vw,34px)", lineHeight: 1, flexShrink: 0 }}>✦</span>
          </Reveal>
        </div>
      </div>

      {/* 16:9 food video band with animated scallop edges */}
      <div
        style={{
          position: "relative",
          width: "100%",
          flex: "none",
          background: "#06202a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: "62vh",
            minHeight: 300,
            background: "#06202a",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={content.videoUrl}
            poster={content.posterUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* darkening gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(7,24,33,.18),rgba(7,24,33,.5))",
            }}
          />
          {/* top scallop: yellow hero background drips down over the video */}
          <Scallop edge="top" color="#edb63f" />
        </div>
      </div>
    </section>
  );
}
