import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import PromoBar from "@/components/PromoBar";
import Grain from "@/components/Grain";
import Scallop from "@/components/Scallop";
import WavyMarquee from "@/components/WavyMarquee";
import Reveal from "@/components/Reveal";
import TransitionLink from "@/components/TransitionLink";
import AiConcierge from "@/components/AiConcierge";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import { getSiteContent } from "@/lib/content";
import { getDestinationBySlug, getNearbyDestinations, getVeychoFoodPicks } from "@/lib/explore";
import DestinationGalleryLightbox from "@/components/DestinationGalleryLightbox";
import DestinationReviews from "@/components/DestinationReviews";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);
  if (!dest) return { title: "Not Found" };
  return {
    title: dest.seo_title ?? `${dest.title} — Explore Wayanad · Veycho`,
    description: dest.seo_description ?? dest.short_description,
    openGraph: {
      title: dest.seo_title ?? dest.title,
      description: dest.seo_description ?? dest.short_description,
      images: dest.featured_image ? [{ url: dest.featured_image }] : undefined,
    },
  };
}

// ---- shared pill style (matches menu / gallery pages exactly) ----
const pill = {
  fontFamily: "var(--font-baloo), sans-serif",
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: ".04em",
  padding: "9px 18px",
  borderRadius: 100,
  textDecoration: "none",
} as const;


export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dest, nearby, c, foodPicks] = await Promise.all([
    getDestinationBySlug(slug),
    getNearbyDestinations(slug),
    getSiteContent(),
    getVeychoFoodPicks(),
  ]);

  if (!dest) notFound();

  // Always include the featured image first, then any extra gallery images
  const galleryImages: string[] = [
    ...(dest.featured_image ? [dest.featured_image] : []),
    ...(dest.images
      ?.filter((i) => i.image_url !== dest.featured_image)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => i.image_url) ?? []),
  ];

  const marqueeWords = [
    dest.title,
    dest.category?.name ?? "Explore",
    "Wayanad",
    "Discover",
    dest.distance_km ? `${dest.distance_km} km` : "Kerala",
    "Experience",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: dest.title,
    description: dest.short_description,
    image: dest.featured_image ?? undefined,
    url: `https://veycho.com/explore/${dest.slug}`,
    ...(dest.latitude && dest.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: dest.latitude, longitude: dest.longitude } }
      : {}),
    ...(dest.google_rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: dest.google_rating, bestRating: 5 } }
      : {}),
  };

  const hasPhoto = Boolean(dest.featured_image);
  // With photo: dark overlay → light text. Without: gold bg → dark text (original).
  const heroTextColor = hasPhoto ? "#ffffff" : "#071821";
  const heroSubColor  = hasPhoto ? "#f4ead6" : "#071821";
  const heroGoldColor = hasPhoto ? "#edb63f" : "#071821";
  const heroChipBg    = hasPhoto ? "rgba(244,234,214,.15)" : "rgba(7,24,33,.12)";
  const heroChipBorder= hasPhoto ? "1px solid rgba(244,234,214,.25)" : "none";

  // Reviews section (dark #071821) always sits above food, so scallop is always dark→gold
  const foodSectionTopColor = "#071821";

  // Colour above the reviews section: tips (cream) → dark reviews needs a scallop;
  // gallery (dark) → same colour, no scallop; about (cream) → needs scallop.
  const reviewsTopColor =
    dest.travel_tips?.length > 0 ? "#f1e6d0" :
    galleryImages.length > 0 ? "#071821" :
    "#f1e6d0";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PromoBar message={c.promo.message} />
      <Grain />

      <main style={{ position: "relative", background: "#f1e6d0" }}>

        {/* ================================================================
            HERO — cover photo background with dark overlay
        ================================================================ */}
        <section
          style={{
            position: "relative",
            minHeight: "80vh",
            background: hasPhoto ? "#071821" : "#edb63f",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "150px 32px 80px",
            marginBottom: -1,
          }}
        >
          {/* cover photo (only when available) */}
          {hasPhoto && (
            <Image
              src={dest.featured_image!}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={90}
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          )}

          {/* dark gradient overlay — only with photo */}
          {hasPhoto && (
            <div
              aria-hidden
              style={{
                position: "absolute", inset: 0, zIndex: 1,
                background: "linear-gradient(180deg, rgba(7,24,33,.72) 0%, rgba(7,24,33,.38) 40%, rgba(7,24,33,.55) 70%, rgba(7,24,33,.9) 100%)",
              }}
            />
          )}

          {/* soft radial glow — only on gold fallback */}
          {!hasPhoto && (
            <div aria-hidden style={{ position: "absolute", top: -60, right: -40, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(7,24,33,.06),transparent 70%)" }} />
          )}

          {/* gold top accent line */}
          <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#edb63f", zIndex: 2 }} />

          {/* back navigation */}
          <div style={{ position: "absolute", top: "clamp(60px,8vh,96px)", left: "clamp(20px,5vw,38px)", display: "flex", gap: 10, flexWrap: "wrap", zIndex: 2 }}>
            <TransitionLink
              href="/explore"
              style={{ ...pill, background: "#071821", color: "#f4ead6" }}
            >
              ← EXPLORE
            </TransitionLink>
            <TransitionLink
              href="/"
              style={{ ...pill, background: "transparent", color: heroTextColor, border: `2px solid ${hasPhoto ? "rgba(244,234,214,.4)" : "#071821"}` }}
            >
              HOME
            </TransitionLink>
          </div>

          {/* share button — top right */}
          <div style={{ position: "absolute", top: "clamp(60px,8vh,96px)", right: "clamp(20px,5vw,38px)", zIndex: 2 }}>
            <ShareButton title={`${dest.title} — Explore Wayanad · Veycho`} variant="icon" />
          </div>

          {/* category eyebrow */}
          {dest.category && (
            <Reveal y={20}>
              <p
                style={{
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700,
                  color: heroGoldColor,
                  fontSize: 14,
                  letterSpacing: ".24em",
                  marginBottom: 10,
                  position: "relative", zIndex: 1,
                  opacity: hasPhoto ? 1 : 0.72,
                }}
              >
                {dest.category.icon}&nbsp;&nbsp;
                {dest.category.name.toUpperCase()} · WAYANAD
              </p>
            </Reveal>
          )}

          {/* big destination title */}
          <Reveal
            as="h1"
            y={44}
            delay={80}
            style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800,
              color: heroTextColor,
              fontSize: "clamp(52px,11vw,190px)",
              lineHeight: 0.86,
              letterSpacing: "-.04em",
              margin: 0,
              position: "relative", zIndex: 1,
              textShadow: hasPhoto ? "0 4px 32px rgba(0,0,0,.4)" : "none",
            }}
          >
            {dest.title}
          </Reveal>

          {/* tagline — distance + season */}
          <Reveal
            as="p"
            y={30}
            delay={180}
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              color: heroSubColor,
              fontSize: "clamp(14px,2vw,26px)",
              textTransform: "uppercase",
              letterSpacing: ".04em",
              margin: "22px 0 0",
              opacity: 0.85,
              position: "relative", zIndex: 1,
            }}
          >
            {[
              dest.distance_km != null && `${dest.distance_km} km from Veycho`,
              dest.travel_time,
              dest.best_season,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Reveal>

          {/* rating + difficulty chips */}
          <Reveal y={20} delay={250}>
            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
              {dest.google_rating != null && (
                <span
                  style={{
                    background: "#071821", color: "#edb63f",
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 700, fontSize: 12, letterSpacing: ".08em",
                    padding: "6px 14px", borderRadius: 100,
                  }}
                >
                  ⭐ {dest.google_rating} Google Rating
                </span>
              )}
              {dest.difficulty_level && (
                <span
                  style={{
                    background: heroChipBg, color: heroSubColor,
                    backdropFilter: hasPhoto ? "blur(6px)" : "none",
                    border: heroChipBorder,
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 700, fontSize: 12, letterSpacing: ".08em",
                    padding: "6px 14px", borderRadius: 100,
                  }}
                >
                  🏃 {dest.difficulty_level}
                </span>
              )}
              {dest.family_friendly && (
                <span
                  style={{
                    background: heroChipBg, color: heroSubColor,
                    backdropFilter: hasPhoto ? "blur(6px)" : "none",
                    border: heroChipBorder,
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 700, fontSize: 12, letterSpacing: ".08em",
                    padding: "6px 14px", borderRadius: 100,
                  }}
                >
                  👨‍👩‍👧 Family Friendly
                </span>
              )}
            </div>
          </Reveal>

          {/* dark scallop drips down into the marquee band below */}
          <Scallop edge="bottom" color="#071821" />
        </section>

        {/* ================================================================
            WAVY MARQUEE BAND — dark, same as gallery page separator
        ================================================================ */}
        <WavyMarquee
          words={marqueeWords}
          bg="#071821"
          color="#f4ead6"
          accent="#edb63f"
          fontSize="clamp(28px,5vw,72px)"
          duration={28}
          amplitude={14}
          tilt={2.4}
          padding="56px 0"
          style={{ marginBottom: -1 }}
        />

        {/* ================================================================
            ABOUT + QUICK INFO — cream section
        ================================================================ */}
        <section
          style={{
            position: "relative",
            background: "#f1e6d0",
            padding: "0 0 clamp(80px,10vh,130px)",
            marginBottom: -1,
          }}
        >
          {/* dark band drips down into cream */}
          <Scallop edge="top" color="#071821" />

          <div
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "clamp(80px,13vh,160px) clamp(20px,5vw,38px) 0",
            }}
          >
            {/* section label */}
            <Reveal>
              <p
                style={{
                  textAlign: "center",
                  color: "#c5613a",
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700, fontSize: 13, letterSpacing: ".2em",
                  marginBottom: 8,
                }}
              >
                THE DESTINATION
              </p>
            </Reveal>
            <Reveal as="h2" delay={60} style={{
              textAlign: "center",
              fontFamily: "var(--font-anton), sans-serif",
              color: "#11262f",
              fontSize: "clamp(30px,5vw,64px)",
              lineHeight: 0.92, margin: "0 0 56px",
              textTransform: "uppercase",
            }}>
              {dest.title}
            </Reveal>

            {/* 2-col: description left, quick info right */}
            <div
              className="dest-body-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 300px",
                gap: "clamp(32px,5vw,64px)",
                alignItems: "start",
              }}
            >
              {/* ---- left: description ---- */}
              <div>
                {/* short description highlight */}
                <p
                  style={{
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(17px,2.2vw,22px)",
                    color: "#071821",
                    lineHeight: 1.5,
                    marginBottom: 28,
                    borderLeft: "4px solid #edb63f",
                    paddingLeft: 20,
                  }}
                >
                  {dest.short_description}
                </p>

                {/* full description */}
                {dest.description &&
                  dest.description.split("\n\n").map((para, i) => (
                    <Reveal key={i} y={20} delay={i * 40}>
                      <p
                        style={{
                          fontFamily: "var(--font-hanken), system-ui, sans-serif",
                          fontSize: "clamp(14px,1.4vw,16px)",
                          color: "#2d4a55",
                          lineHeight: 1.85,
                          marginBottom: 20,
                        }}
                      >
                        {para}
                      </p>
                    </Reveal>
                  ))}

                {/* CTA row inside about */}
                {dest.google_maps_url && (
                  <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
                    <a
                      href={dest.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...pill,
                        background: "#071821", color: "#f4ead6",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}
                    >
                      📍 Open in Maps
                    </a>
                    {dest.latitude && dest.longitude && (
                      <a
                        href={`https://maps.google.com/maps?saddr=Veycho+Restaurant+Kalpetta+Wayanad&daddr=${encodeURIComponent(`${dest.title} Wayanad`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...pill,
                          background: "transparent", color: "#071821",
                          border: "2px solid #071821",
                          display: "inline-flex", alignItems: "center", gap: 6,
                        }}
                      >
                        🚗 Navigate from Veycho
                      </a>
                    )}
                  </div>
                )}

                {/* Amenities chips — shown when admin has added them */}
                {(dest.amenities?.length > 0 || dest.family_friendly || dest.parking_available) && (
                  <Reveal y={16} delay={60}>
                    <div style={{ marginTop: 32 }}>
                      <p style={{
                        fontFamily: "var(--font-baloo), sans-serif",
                        fontWeight: 700, fontSize: 11, letterSpacing: ".18em",
                        color: "#c5613a", textTransform: "uppercase", marginBottom: 12,
                      }}>
                        Amenities
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {dest.family_friendly && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "#071821", color: "#f4ead6",
                            fontFamily: "var(--font-baloo), sans-serif",
                            fontWeight: 700, fontSize: 12, letterSpacing: ".06em",
                            padding: "7px 14px", borderRadius: 100,
                          }}>
                            👨‍👩‍👧 Family Friendly
                          </span>
                        )}
                        {dest.parking_available && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "#071821", color: "#f4ead6",
                            fontFamily: "var(--font-baloo), sans-serif",
                            fontWeight: 700, fontSize: 12, letterSpacing: ".06em",
                            padding: "7px 14px", borderRadius: 100,
                          }}>
                            🅿️ Parking Available
                          </span>
                        )}
                        {dest.amenities?.map((a) => (
                          <span key={a} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "#071821", color: "#f4ead6",
                            fontFamily: "var(--font-baloo), sans-serif",
                            fontWeight: 700, fontSize: 12, letterSpacing: ".06em",
                            padding: "7px 14px", borderRadius: 100,
                          }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                )}
              </div>

              {/* ---- right: quick info cards ---- */}
              <Reveal y={24} delay={80}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "📍", label: "Distance", value: dest.distance_km != null ? `${dest.distance_km} km from Veycho` : null },
                    { icon: "⏱", label: "Travel Time", value: dest.travel_time },
                    { icon: "🎟", label: "Entry Fee", value: dest.entry_fee },
                    { icon: "🕐", label: "Opening Hours", value: dest.opening_hours },
                    { icon: "⏰", label: "Best Time", value: dest.best_time },
                    { icon: "🗓", label: "Best Season", value: dest.best_season },
                    { icon: "🏃", label: "Difficulty", value: dest.difficulty_level },
                    { icon: "🚗", label: "Parking", value: dest.parking_available ? "Available" : null },
                  ]
                    .filter((r) => r.value)
                    .map((r) => (
                      <div
                        key={r.label}
                        style={{
                          background: "#071821",
                          borderRadius: 12,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                        <div>
                          <p
                            style={{
                              fontFamily: "var(--font-baloo), sans-serif",
                              fontWeight: 700, fontSize: 10,
                              letterSpacing: ".14em", color: "#edb63f",
                              textTransform: "uppercase", margin: 0,
                            }}
                          >
                            {r.label}
                          </p>
                          <p
                            style={{
                              fontFamily: "var(--font-hanken), system-ui, sans-serif",
                              fontSize: 13, color: "#f4ead6",
                              margin: "2px 0 0", lineHeight: 1.4,
                            }}
                          >
                            {r.value}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================================================================
            PHOTO GALLERY — dark section (only if images exist)
        ================================================================ */}
        {galleryImages.length > 0 && (
          <section
            style={{
              position: "relative",
              background: "#071821",
              overflow: "hidden",
              padding: "0 0 clamp(80px,10vh,120px)",
              marginBottom: -1,
            }}
          >
            {/* cream from above drips down */}
            <Scallop edge="top" color="#f1e6d0" />

            <div
              style={{
                maxWidth: 1280, margin: "0 auto",
                padding: "clamp(80px,13vh,160px) clamp(20px,5vw,38px) 0",
              }}
            >
              <Reveal>
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-baloo), sans-serif",
                    fontWeight: 700, fontSize: 13, letterSpacing: ".2em",
                    color: "#edb63f", marginBottom: 8,
                  }}
                >
                  PHOTO GALLERY
                </p>
              </Reveal>
              <Reveal as="h2" delay={60} style={{
                textAlign: "center",
                fontFamily: "var(--font-anton), sans-serif",
                color: "#f4ead6",
                fontSize: "clamp(28px,4vw,56px)",
                lineHeight: 0.92, margin: "0 0 44px",
                textTransform: "uppercase",
              }}>
                {dest.title} in Pictures
              </Reveal>

              <Reveal y={24} delay={80}>
                <DestinationGalleryLightbox images={galleryImages} title={dest.title} />
              </Reveal>
            </div>
          </section>
        )}

        {/* ================================================================
            TRAVEL TIPS — only shown when admin has added tips
        ================================================================ */}
        {dest.travel_tips?.length > 0 && (
        <section
          style={{
            position: "relative",
            background: "#f1e6d0",
            padding: "0 0 clamp(80px,10vh,120px)",
            marginBottom: -1,
          }}
        >
          <Scallop edge="top" color="#071821" />

          <div
            style={{
              maxWidth: 1280, margin: "0 auto",
              padding: "clamp(80px,13vh,160px) clamp(20px,5vw,38px) 0",
            }}
          >
            <Reveal>
              <p style={{
                textAlign: "center", color: "#c5613a",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: ".2em", marginBottom: 8,
              }}>
                BEFORE YOU GO
              </p>
            </Reveal>
            <Reveal as="h2" delay={60} style={{
              textAlign: "center",
              fontFamily: "var(--font-anton), sans-serif",
              color: "#11262f",
              fontSize: "clamp(28px,4vw,56px)",
              lineHeight: 0.92, margin: "0 0 48px",
              textTransform: "uppercase",
            }}>
              Travel Tips
            </Reveal>

            <div
              className="tips-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {dest.travel_tips.map((t, idx) => (
                <Reveal key={idx} y={20}>
                  <div
                    style={{
                      background: "#071821",
                      borderRadius: 14, padding: "22px 22px",
                      height: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 24 }}>{t.icon}</span>
                      <span
                        style={{
                          fontFamily: "var(--font-baloo), sans-serif",
                          fontWeight: 700, fontSize: 11, color: "#edb63f",
                          letterSpacing: ".14em", textTransform: "uppercase",
                        }}
                      >
                        {t.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-hanken), system-ui, sans-serif",
                        fontSize: 13, color: "#8aa1ab", lineHeight: 1.7, margin: 0,
                      }}
                    >
                      {t.tip}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ================================================================
            VISITOR REVIEWS — dark section, always shown
        ================================================================ */}
        <DestinationReviews
          destinationId={dest.id}
          destinationTitle={dest.title}
          topColor={reviewsTopColor}
        />

        {/* ================================================================
            VEYCHO FOOD RECOMMENDATION — gold section (bookend to hero)
        ================================================================ */}
        {foodPicks.length > 0 && (
        <section
          style={{
            position: "relative",
            background: "#edb63f",
            overflow: "hidden",
            padding: "0 clamp(20px,4vw,32px) clamp(80px,10vh,120px)",
            marginBottom: -1,
            textAlign: "center",
          }}
        >
          <Scallop edge="top" color={foodSectionTopColor} />

          <div
            style={{
              maxWidth: 900, margin: "0 auto",
              padding: "clamp(100px,13vh,160px) 0 0",
            }}
          >
            <Reveal y={20}>
              <p
                style={{
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700, color: "#071821",
                  fontSize: 14, letterSpacing: ".24em", marginBottom: 10, opacity: 0.65,
                }}
              >
                FUEL YOUR ADVENTURE
              </p>
            </Reveal>

            <Reveal as="h2" y={40} delay={60} style={{
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 800, color: "#071821",
              fontSize: "clamp(38px,7vw,110px)",
              lineHeight: 0.88, letterSpacing: "-.04em", margin: "0 0 10px",
            }}>
              Before You Go,<br />Eat at Veycho
            </Reveal>

            <Reveal y={24} delay={130}>
              <p
                style={{
                  fontFamily: "var(--font-hanken), system-ui, sans-serif",
                  fontSize: "clamp(14px,1.6vw,18px)",
                  color: "#071821", opacity: 0.7,
                  lineHeight: 1.7, margin: "0 auto 44px",
                  maxWidth: 520,
                }}
              >
                Our kitchen opens at 11 AM — the perfect stop for a hearty meal before
                heading out to {dest.title}. You&apos;ll need the energy.
              </p>
            </Reveal>

            {/* dish cards row */}
            <Reveal y={24} delay={180}>
              <div
                className="dest-food-dishes"
                style={{
                  display: "flex", gap: 18, justifyContent: "center",
                  flexWrap: "wrap", marginBottom: 40,
                }}
              >
                {foodPicks.map((dish) => (
                  <div
                    key={dish.id}
                    className="dest-food-card"
                    style={{
                      background: "#071821",
                      borderRadius: 14, overflow: "hidden",
                      width: "clamp(160px,22vw,220px)",
                      textAlign: "left",
                      boxShadow: "0 12px 32px rgba(7,24,33,.2)",
                    }}
                  >
                    {dish.image_url && (
                      <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    )}
                    <div style={{ padding: "14px 16px 18px" }}>
                      <p
                        style={{
                          fontFamily: "var(--font-baloo), sans-serif",
                          fontWeight: 800, fontSize: 14, color: "#edb63f",
                          margin: "0 0 4px", lineHeight: 1.2,
                        }}
                      >
                        {dish.name}
                      </p>
                      {dish.description && (
                        <p
                          style={{
                            fontFamily: "var(--font-hanken), system-ui, sans-serif",
                            fontSize: 12, color: "#8aa1ab", margin: 0, lineHeight: 1.5,
                          }}
                        >
                          {dish.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal y={16} delay={220}>
              <TransitionLink
                href="/menu"
                style={{
                  ...pill,
                  background: "#071821", color: "#edb63f",
                  fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                View Full Menu →
              </TransitionLink>
            </Reveal>
          </div>

          {/* gold drips into the dark nearby section */}
          <Scallop edge="bottom" color="#071821" />
        </section>
        )}

        {/* ================================================================
            NEARBY ATTRACTIONS — dark section
        ================================================================ */}
        {nearby.length > 0 && (
          <section
            style={{
              position: "relative",
              background: "#071821",
              overflow: "hidden",
              padding: "0 0 clamp(80px,10vh,120px)",
              marginBottom: -1,
            }}
          >
            <div
              style={{
                maxWidth: 1280, margin: "0 auto",
                padding: "clamp(80px,10vh,120px) clamp(20px,5vw,38px) 0",
              }}
            >
              <Reveal>
                <p style={{
                  textAlign: "center",
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700, fontSize: 13, letterSpacing: ".2em",
                  color: "#edb63f", marginBottom: 8,
                }}>
                  ALSO NEARBY
                </p>
              </Reveal>
              <Reveal as="h2" delay={60} style={{
                textAlign: "center",
                fontFamily: "var(--font-anton), sans-serif",
                color: "#f4ead6",
                fontSize: "clamp(28px,4vw,56px)",
                lineHeight: 0.92, margin: "0 0 48px",
                textTransform: "uppercase",
              }}>
                More to Discover
              </Reveal>

              <div
                className="dest-nearby-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(240px,100%), 1fr))",
                  gap: 20,
                }}
              >
                {nearby.map((n, i) => (
                  <Reveal key={n.id} y={20} delay={i * 70}>
                    <TransitionLink
                      href={`/explore/${n.slug}`}
                      className="dest-nearby-card"
                      style={{
                        display: "block", textDecoration: "none",
                        background: "#0b2c39",
                        borderRadius: 14, overflow: "hidden",
                        border: "1.5px solid rgba(237,182,63,.12)",
                      }}
                    >
                      {n.featured_image && (
                        <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                          <img
                            src={n.featured_image}
                            alt={n.title}
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                      )}
                      <div style={{ padding: "16px 18px 20px" }}>
                        {n.category && (
                          <p style={{
                            fontFamily: "var(--font-baloo), sans-serif",
                            fontWeight: 700, fontSize: 10,
                            color: "#edb63f", letterSpacing: ".1em",
                            textTransform: "uppercase", margin: "0 0 6px",
                          }}>
                            {n.category.icon} {n.category.name}
                          </p>
                        )}
                        <p style={{
                          fontFamily: "var(--font-anton), sans-serif",
                          fontSize: 20, color: "#f4ead6", margin: "0 0 6px",
                        }}>
                          {n.title}
                        </p>
                        {n.distance_km != null && (
                          <p style={{
                            fontFamily: "var(--font-hanken), system-ui, sans-serif",
                            fontSize: 12, color: "#8aa1ab", margin: 0,
                          }}>
                            {n.distance_km} km · {n.travel_time}
                          </p>
                        )}
                      </div>
                    </TransitionLink>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ================================================================
            FOOTER — dark, matching the menu / gallery footer exactly
        ================================================================ */}
        <footer
          style={{
            position: "relative",
            background: "#071821",
            overflow: "hidden",
            paddingBottom: 46,
          }}
        >
          {/* Reviews section (dark) always sits above the footer (also dark) — no scallop needed */}

          <div style={{ padding: "clamp(100px,14vh,180px) 0 40px" }}>
            <WavyMarquee
              words={["Explore Wayanad", dest.title, "Veycho", dest.category?.name ?? "Adventure", "Kerala"]}
              color="#f4ead6"
              accent="#edb63f"
              fontSize="clamp(40px,8vw,130px)"
              duration={30}
              amplitude={16}
              tilt={2.5}
              padding="0"
            />
            <WavyMarquee
              words={["Kalpetta", "Est 2020", "Authentic", "Wayanad Flavors", "Veycho"]}
              color="#edb63f"
              accent="#f4ead6"
              fontSize="clamp(24px,5vw,80px)"
              duration={22}
              reverse
              amplitude={12}
              tilt={2}
              padding="6px 0 0"
              style={{ opacity: 0.88 }}
            />
          </div>

          <div
            style={{
              display: "flex", flexWrap: "wrap",
              alignItems: "center", justifyContent: "space-between",
              gap: 16, maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,5vw,38px)",
            }}
          >
            <span style={{ color: "#8aa1ab", fontSize: 14, fontWeight: 500 }}>
              Veycho Resto-Cafe · Kalpetta, Wayanad · 11 AM – 10 PM
            </span>
            <TransitionLink
              href="/explore"
              style={{
                ...pill,
                color: "#edb63f",
                border: "2px solid #edb63f",
                background: "transparent",
                fontSize: 14,
              }}
            >
              ← BACK TO EXPLORE
            </TransitionLink>
          </div>
        </footer>
      </main>

      <AiConcierge />
      <WhatsAppFAB phone={c.visit.phone} />

      <style>{`
        .dest-gallery-cell:hover .dest-gallery-img { transform: scale(1.06); }
        .dest-gallery-img { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .dest-nearby-card { transition: border-color .3s ease, transform .4s cubic-bezier(.16,1,.3,1); }
        .dest-nearby-card:hover { border-color: rgba(237,182,63,.4) !important; transform: translateY(-6px); }
        @media (max-width: 860px) {
          .dest-body-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .tips-grid { grid-template-columns: 1fr !important; }
          /* food dishes: 2 columns instead of 3 horizontal cards */
          .dest-food-dishes { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .dest-food-card { width: auto !important; }
          /* nearby: single column */
          .dest-nearby-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 420px) {
          /* food dishes: stack fully on very small phones */
          .dest-food-dishes { grid-template-columns: 1fr !important; max-width: 320px; margin-left: auto; margin-right: auto; }
        }
        /* touch devices — disable hover transforms that cause layout reflow */
        @media (hover: none) {
          .dest-nearby-card:hover { transform: none !important; }
        }
      `}</style>
    </>
  );
}
