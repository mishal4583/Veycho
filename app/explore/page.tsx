import type { Metadata } from "next";
import PromoBar from "@/components/PromoBar";
import Nav from "@/components/Nav";
import Grain from "@/components/Grain";
import SiteFooter from "@/components/SiteFooter";
import AiConcierge from "@/components/AiConcierge";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import ExploreGrid from "@/components/ExploreGrid";
import Reveal from "@/components/Reveal";
import Scallop from "@/components/Scallop";
import TransitionLink from "@/components/TransitionLink";
import { getSiteContent } from "@/lib/content";
import { getDestinations, getDestinationCategories } from "@/lib/explore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Wayanad — Veycho Resto-Cafe",
  description:
    "Discover the beauty, culture, and unforgettable experiences waiting just beyond your dining table. Waterfalls, viewpoints, wildlife, heritage, and hidden gems around Wayanad.",
  openGraph: {
    title: "Explore Wayanad — Veycho Resto-Cafe",
    description: "Discover waterfalls, viewpoints, wildlife, heritage sites, and hidden gems around Wayanad.",
    images: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80" }],
  },
};

const GOLD = "#edb63f";
const DARK = "#071821";
const SURFACE = "#0b2c39";
const CREAM = "#f4ead6";
const MUTED = "#8aa1ab";

export default async function ExplorePage() {
  const [c, destinations, categories] = await Promise.all([
    getSiteContent(),
    getDestinations(),
    getDestinationCategories(),
  ]);

  return (
    <>
      <PromoBar message={c.promo.message} />
      <Nav content={c.nav} />
      <Grain />

      {/* ---- Hero ---- */}
      <section
        style={{
          position: "relative",
          minHeight: "80vh",
          background: DARK,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* background image with gold overlay */}
        {c.explorePage.heroImageUrl && (
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url('${c.explorePage.heroImageUrl}')`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.35,
            }}
          />
        )}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(7,24,33,.2) 0%, rgba(7,24,33,.7) 60%, #071821 100%)",
          }}
        />
        {/* gold top accent */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GOLD,
        }} />

        {/* content */}
        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 1280, margin: "0 auto", width: "100%",
          padding: "clamp(140px,18vh,180px) clamp(20px,5vw,48px) clamp(40px,6vh,80px)",
        }}>
          <Reveal y={20}>
            <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <TransitionLink href="/" style={{
                fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
                fontSize: 12, color: GOLD, textDecoration: "none", letterSpacing: ".08em",
              }}>
                VEYCHO
              </TransitionLink>
              <span style={{ color: MUTED, fontSize: 12 }}>”º</span>
              <span style={{
                fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
                fontSize: 12, color: MUTED, letterSpacing: ".08em",
              }}>
                EXPLORE WAYANAD
              </span>
            </nav>
          </Reveal>

          <Reveal y={40} delay={60}>
            <h1 style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(60px,10vw,160px)",
              color: CREAM, margin: 0, lineHeight: 0.9,
              letterSpacing: "-.02em",
            }}>
              {c.explorePage.heroTitle.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 0 ? line : <span style={{ color: GOLD }}>{line}</span>}
                </span>
              ))}
            </h1>
          </Reveal>

          <Reveal y={24} delay={140}>
            <p style={{
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: "clamp(15px,2vw,18px)", color: MUTED,
              maxWidth: 560, lineHeight: 1.7,
              margin: "24px 0 36px",
            }}>
              {c.explorePage.heroDescription}
            </p>
          </Reveal>

          <Reveal y={20} delay={200}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="#destinations"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: GOLD, color: DARK,
                  borderRadius: 100, padding: "12px 28px",
                  fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800,
                  fontSize: 13, letterSpacing: ".04em", textDecoration: "none",
                }}
              >
                Discover Destinations
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
              </a>
              <TransitionLink
                href="/menu"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", color: CREAM,
                  border: `2px solid rgba(244,234,214,.3)`,
                  borderRadius: 100, padding: "12px 28px",
                  fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: ".04em", textDecoration: "none",
                }}
              >
                View Menu
              </TransitionLink>
            </div>
          </Reveal>

          {/* stat pills */}
          <Reveal y={16} delay={260}>
            <div style={{ display: "flex", gap: 12, marginTop: "clamp(28px,4vh,48px)", flexWrap: "wrap" }}>
              {[
                { n: destinations.length + "+", label: "Destinations" },
                { n: "35+", label: "km Radius" },
                { n: "8", label: "Categories" },
                { n: "Free", label: "Entry (many sites)" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: SURFACE, borderRadius: 12, padding: "12px 20px",
                  border: "1px solid rgba(237,182,63,.15)",
                }}>
                  <div style={{
                    fontFamily: "var(--font-anton), sans-serif",
                    fontSize: 24, color: GOLD, lineHeight: 1,
                  }}>{s.n}</div>
                  <div style={{
                    fontFamily: "var(--font-hanken), system-ui, sans-serif",
                    fontSize: 11, color: MUTED, marginTop: 2, letterSpacing: ".06em",
                  }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Destinations Grid (client island) ---- */}
      <div id="destinations">
        <ExploreGrid destinations={destinations} categories={categories} />
      </div>

      {/* Gold bridge: gives the footer's gold scallop a color anchor (dark grid → gold strip → dark footer) */}
      <div style={{ position: "relative", background: GOLD, overflow: "hidden", padding: "clamp(120px,16vh,160px) clamp(20px,5vw,48px) clamp(72px,9vh,96px)", textAlign: "center" }}>
        <Scallop edge="top" color={DARK} />
        <p style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800, fontSize: "clamp(22px,3vw,34px)", color: DARK, margin: "0 0 16px", letterSpacing: "-.01em" }}>
          Hungry after exploring?
        </p>
        <TransitionLink
          href="/menu"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: DARK, color: GOLD, borderRadius: 100, padding: "13px 30px", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: ".06em", textDecoration: "none" }}
        >
          See Our Menu
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </TransitionLink>
      </div>

      <SiteFooter content={c.footer} />
      <AiConcierge />
      <WhatsAppFAB phone={c.visit.phone} />

      <style>{`
        @media (max-width: 640px) {
          .explore-hero-inner { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (max-width: 480px) {
          .explore-stat-pill { padding: 10px 14px !important; }
          .explore-stat-n { font-size: 20px !important; }
        }
      `}</style>
    </>
  );
}
