import { DEFAULT_CONTENT } from "@/lib/content-defaults";

export default function PromoBar({
  message = DEFAULT_CONTENT.promo.message,
}: {
  message?: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 90,
        background: "#edb63f",
        overflow: "hidden",
        borderBottom: "2px solid #071821",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          whiteSpace: "nowrap",
          animation: "vc-marquee 24s linear infinite",
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: ".16em",
          color: "#071821",
          padding: "8px 0",
          textTransform: "uppercase",
        }}
      >
        {/* duplicated for a seamless -50% marquee loop */}
        <span style={{ padding: "0 26px" }}>
          {message}
          {message}
        </span>
      </div>
    </div>
  );
}
