import Reveal from "./Reveal";
import Scallop from "./Scallop";
import { DEFAULT_CONTENT, type VisitContent } from "@/lib/content-defaults";

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div style={{ borderBottom: "1px solid rgba(7,24,33,.14)", paddingBottom: 8 }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "#7a6526",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "3px 0 0",
          fontSize: 15,
          lineHeight: 1.4,
          color: "#071821",
          fontWeight: 500,
        }}
      >
        {value}
      </p>
    </div>
  );
  return href ? (
    <a href={href} style={{ display: "block", textDecoration: "none" }}>
      {inner}
    </a>
  ) : (
    inner
  );
}

export default function Visit({
  content = DEFAULT_CONTENT.visit,
}: {
  content?: VisitContent;
}) {
  const ADDRESS = content.address;
  const PHONE = content.phone;
  const PHONE_HREF = `tel:${content.phone.replace(/[^\d+]/g, "")}`;
  const WHATSAPP_HREF = `https://wa.me/${content.whatsapp.replace(/[^\d]/g, "")}`;
  const EMAIL = content.email;
  const HOURS = content.hours;
  const MAPS_URL = content.mapsUrl;
  const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(
    ADDRESS
  )}&output=embed`;
  return (
    <section
      id="visit"
      data-screen-label="Visit"
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#edb63f",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(150px, 18vh, 220px) 48px",
      }}
    >
      <Scallop edge="top" color="#0b2c39" />

      <div className="vc-visit-grid">
        <Reveal
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              color: "#071821",
              fontSize: "clamp(40px,5.6vw,86px)",
              lineHeight: 1.06,
              margin: "0 0 16px",
              textTransform: "uppercase",
              whiteSpace: "pre-line",
            }}
          >
            {content.heading}
          </h2>
          <p
            style={{
              color: "#3a3220",
              fontSize: 15,
              lineHeight: 1.5,
              margin: "0 0 20px",
              maxWidth: 440,
              fontWeight: 500,
            }}
          >
            {content.ctaParagraph}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 460,
              marginBottom: 24,
            }}
          >
            <Detail label="Address" value={ADDRESS} href={MAPS_URL} />
            <Detail label="Phone" value={PHONE} href={PHONE_HREF} />
            <Detail label="WhatsApp" value="Chat with us" href={WHATSAPP_HREF} />
            <Detail label="Email" value={EMAIL} href={`mailto:${EMAIL}`} />
            <Detail label="Hours" value={HOURS} />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href={PHONE_HREF}
              style={{
                background: "#071821",
                color: "#edb63f",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 800,
                fontSize: 16,
                padding: "16px 30px",
                borderRadius: 100,
                textDecoration: "none",
              }}
            >
              CALL US
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "transparent",
                border: "2px solid #071821",
                color: "#071821",
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px 30px",
                borderRadius: 100,
                textDecoration: "none",
              }}
            >
              WHATSAPP
            </a>
          </div>
        </Reveal>

        <Reveal
          y={46}
          delay={140}
          style={{
            borderRadius: 30,
            minHeight: 360,
            background: "#0f3e4d",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <iframe
            title="Veycho Restaurant & Cafe Wayanad map"
            src={MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 22,
              left: 22,
              background: "#071821",
              color: "#edb63f",
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: "9px 18px",
              borderRadius: 100,
              pointerEvents: "none",
            }}
          >
            {content.mapBadge}
          </div>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              bottom: 18,
              right: 18,
              background: "rgba(7,24,33,.9)",
              color: "#edb63f",
              fontFamily: "var(--font-baloo), sans-serif",
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              padding: "10px 16px",
              borderRadius: 100,
              textDecoration: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            View on Google Maps
          </a>
        </Reveal>
      </div>
    </section>
  );
}
