import type { Metadata } from "next";
import TransitionLink from "@/components/TransitionLink";
import PromoBar from "@/components/PromoBar";
import Grain from "@/components/Grain";
import Scallop from "@/components/Scallop";
import Reveal from "@/components/Reveal";
import WavyMarquee from "@/components/WavyMarquee";
import GalleryWall, { type GalleryImage } from "@/components/GalleryWall";
import AiConcierge from "@/components/AiConcierge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Gallery — Veycho Resto-Cafe · Wayanad",
  description:
    "A visual diary of Veycho — plates, pours and good company. Snapshots from our resto-cafe in Kalpetta, Wayanad.",
};

// Reflect admin uploads immediately; this page reads live from the gallery table.
export const dynamic = "force-dynamic";

async function getImages(): Promise<GalleryImage[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("gallery")
      .select("id,image_url,title,category")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    // Supabase not configured / unreachable — fall back to the on-brand empty state.
    return [];
  }
}

const HOME = ["Captured at Veycho", "Good food", "Good vibes", "Stay a while"];
const VEYCHO = Array.from({ length: 8 }, () => "Veycho");

export default async function GalleryPage() {
  const images = await getImages();

  return (
    <>
      <PromoBar />
      <Grain />

      <main style={{ position: "relative", background: "#f1e6d0" }}>
        {/* ---- hero ---- */}
        <section
          style={{
            position: "relative",
            minHeight: "70vh",
            background: "#edb63f",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "150px 32px 70px",
            marginBottom: -1,
          }}
        >
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
              position: "absolute",
              top: 96,
              left: 38,
              display: "flex",
              gap: 10,
            }}
          >
            <TransitionLink
              href="/"
              style={{
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
            <TransitionLink
              href="/menu"
              style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: ".04em",
                padding: "9px 18px",
                borderRadius: 100,
                textDecoration: "none",
                background: "transparent",
                color: "#071821",
                border: "2px solid #071821",
              }}
            >
              SEE MENU
            </TransitionLink>
          </div>

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
            VEYCHO · WAYANAD · SINCE 2020
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
            The Gallery
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
            Every plate, pour &amp; good time — in pictures.
          </Reveal>

          {/* dark scallop drips down → flows into the wavy marquee band */}
          <Scallop edge="bottom" color="#071821" />
        </section>

        {/* ---- wavy marquee band ---- */}
        <WavyMarquee
          words={HOME}
          bg="#071821"
          color="#f4ead6"
          accent="#edb63f"
          fontSize="clamp(34px,6vw,84px)"
          duration={26}
          amplitude={14}
          tilt={2.4}
          padding="48px 0"
          style={{ marginBottom: -1 }}
        />

        {/* ---- the wall ---- */}
        <section
          style={{
            position: "relative",
            background: "#f1e6d0",
            marginBottom: -1,
            padding: "0 0 clamp(120px,16vh,200px)",
          }}
        >
          {/* dark scallop from the band drips into the cream wall */}
          <Scallop edge="top" color="#071821" />

          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "clamp(110px,15vh,180px) 24px 0",
            }}
          >
            <Reveal
              style={{
                textAlign: "center",
                color: "#c5613a",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: ".2em",
                marginBottom: 8,
              }}
            >
              MOMENTS · MEMORIES · MEALS
            </Reveal>
            <Reveal
              as="h2"
              delay={70}
              style={{
                textAlign: "center",
                fontFamily: "var(--font-anton), sans-serif",
                color: "#11262f",
                fontSize: "clamp(34px,5vw,68px)",
                lineHeight: 0.92,
                margin: "0 0 44px",
                textTransform: "uppercase",
              }}
            >
              Life at Veycho
            </Reveal>

            <GalleryWall items={images} />
          </div>
        </section>

        {/* ---- big, wavy, repeated-Veycho marquee footer ---- */}
        <footer
          style={{
            position: "relative",
            background: "#071821",
            overflow: "hidden",
            paddingBottom: 46,
          }}
        >
          {/* cream scallop drips down into the dark footer */}
          <Scallop edge="top" color="#f1e6d0" />

          <div style={{ padding: "150px 0 40px" }}>
            <WavyMarquee
              words={VEYCHO}
              color="#f4ead6"
              accent="#edb63f"
              fontSize="clamp(64px,12vw,188px)"
              duration={32}
              amplitude={16}
              tilt={2.5}
              padding="0"
            />
            <WavyMarquee
              words={VEYCHO}
              color="#edb63f"
              accent="#f4ead6"
              fontSize="clamp(36px,7vw,104px)"
              duration={24}
              reverse
              amplitude={12}
              tilt={2}
              padding="6px 0 0"
              style={{ opacity: 0.92 }}
            />
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
            <span style={{ color: "#8aa1ab", fontSize: 14, fontWeight: 500 }}>
              Veycho Resto-Cafe · Kalpetta, Wayanad · 11 AM — 10 PM
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
