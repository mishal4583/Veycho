import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import PromoBar from "@/components/PromoBar";
import Grain from "@/components/Grain";
import Scallop from "@/components/Scallop";
import Reveal from "@/components/Reveal";
import AiConcierge from "@/components/AiConcierge";
import MenuExplorer from "@/components/MenuExplorer";
import { getMenu, getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Menu — Veycho Resto-Cafe · Wayanad",
  description:
    "The full Veycho menu — soups, salads, starters, mains, burgers, pasta, sandwiches and signature mojitos. Continental flavours in Kalpetta, Wayanad.",
};

// Menu + copy are editable from the admin — render on each request.
export const dynamic = "force-dynamic";

// Big wavy "Veycho" marquee — two identical halves so the -50% loop is seamless;
// per-item vertical offset + tilt gives the wave (pattern repeats every 2 → safe).
const MARQUEE = Array.from({ length: 12 });

export default async function MenuPage() {
  const [menu, c] = await Promise.all([getMenu(), getSiteContent()]);
  const mp = c.menuPage;

  return (
    <>
      <PromoBar message={c.promo.message} />
      <Grain />

      <main style={{ position: "relative", background: "#f1e6d0" }}>
        {/* ---- hero (kept — the menu title) ---- */}
        <section
          style={{
            position: "relative",
            // under a full screen so the next section's heading shows clearly
            // at the bottom of the viewport (matches the reference)
            minHeight: "78vh",
            background: "#edb63f",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "150px 32px 60px",
            marginBottom: -1, // overlap the next section: no 1px seam at the scallop
          }}
        >
          {/* soft glow, top-right (mirrors the home hero) */}
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

          <TransitionLink
            href="/"
            style={{
              position: "absolute",
              top: 96,
              left: 38,
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: ".04em",
              padding: "9px 18px",
              borderRadius: 100,
              textDecoration: "none",
              background: "#071821",
              color: "#f4ead6",
            }}
          >
            ← HOME
          </TransitionLink>

          <Reveal
            y={24}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              color: "#071821",
              fontSize: 14,
              letterSpacing: ".24em",
              marginBottom: 10,
            }}
          >
            {mp.heroLabel}
          </Reveal>

          <Reveal
            as="h1"
            y={44}
            delay={80}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              color: "#071821",
              fontSize: "clamp(78px,15vw,220px)",
              lineHeight: 0.82,
              letterSpacing: "-.04em",
              margin: 0,
            }}
          >
            {mp.heroTitle}
          </Reveal>

          <Reveal
            as="p"
            y={30}
            delay={180}
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              color: "#071821",
              fontSize: "clamp(16px,2.4vw,30px)",
              textTransform: "uppercase",
              letterSpacing: ".02em",
              margin: "22px 0 0",
            }}
          >
            {mp.heroTagline}
          </Reveal>

          {/* transition into the body — cream on mobile (current), dark on desktop */}
          <div className="vcm-mobile">
            <Scallop edge="bottom" color="#f1e6d0" />
          </div>
          <div className="vcm-desktop">
            <Scallop edge="bottom" color="#071821" />
          </div>
        </section>

        {/* ---- the menu body (desktop card grid · mobile list) ---- */}
        <MenuExplorer categories={menu} content={mp} />

        {/* ---- big, wavy, repeated-Veycho marquee footer (kept) ---- */}
        <footer
          style={{
            position: "relative",
            background: "#071821",
            overflow: "hidden",
            paddingBottom: 46,
          }}
        >
          {/* scallop into the footer — a real cream→dark transition on mobile;
              on desktop the grid is already dark, so it flows in seamlessly */}
          <div className="vcm-mobile">
            <Scallop edge="top" color="#f1e6d0" />
          </div>

          <div style={{ padding: "150px 0 40px" }}>
            {/* row 1 — huge, scrolls left */}
            <div
              className="vc-marquee-track"
              style={{ animationDuration: "32s" }}
            >
              {MARQUEE.map((_, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.32em",
                    paddingRight: "0.32em",
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(64px,12vw,188px)",
                    lineHeight: 1,
                    letterSpacing: "-.03em",
                    color: "#f4ead6",
                    transform: `translateY(${i % 2 ? 16 : -14}px) rotate(${
                      i % 2 ? 2.5 : -2.5
                    }deg)`,
                  }}
                >
                  Veycho
                  <span style={{ color: "#edb63f", fontSize: "0.5em" }}>✦</span>
                </span>
              ))}
            </div>

            {/* row 2 — smaller, gold, scrolls the other way */}
            <div
              className="vc-marquee-track"
              style={{
                animationDuration: "24s",
                animationDirection: "reverse",
                marginTop: 6,
                opacity: 0.92,
              }}
            >
              {MARQUEE.map((_, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.32em",
                    paddingRight: "0.32em",
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(36px,7vw,104px)",
                    lineHeight: 1,
                    letterSpacing: "-.02em",
                    color: "#edb63f",
                    transform: `translateY(${i % 2 ? -10 : 12}px) rotate(${
                      i % 2 ? -2 : 2
                    }deg)`,
                  }}
                >
                  Veycho
                  <span style={{ color: "#f4ead6", fontSize: "0.5em" }}>✦</span>
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 38px",
            }}
          >
            <span
              style={{
                color: "#8aa1ab",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {mp.footerNote}
            </span>
            <TransitionLink
              href="/"
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: ".04em",
                color: "#edb63f",
                textDecoration: "none",
                border: "2px solid #edb63f",
                padding: "10px 22px",
                borderRadius: 100,
              }}
            >
              ← BACK HOME
            </TransitionLink>
          </div>
        </footer>
      </main>

      <AiConcierge />
    </>
  );
}
