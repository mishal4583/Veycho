"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Reveal from "./Reveal";
import Scallop from "./Scallop";

// destination_reviews is not in the generated types yet — cast to bypass
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

const GOLD = "#edb63f";
const DARK = "#071821";
const SURFACE = "#0b2c39";
const CREAM = "#f4ead6";
const MUTED = "#8aa1ab";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  visit_type: string | null;
  visit_month: string | null;
  created_at: string;
};

const VISIT_LABELS: Record<string, string> = {
  solo: "Solo",
  couple: "Couple",
  family: "Family",
  group: "Group",
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

function initial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "?";
}

function relDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// â”€â”€ Star display â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12"
          fill={i <= rating ? GOLD : "#1e3d4d"}>
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5" />
        </svg>
      ))}
    </span>
  );
}

// â”€â”€ Interactive star input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 5, cursor: "pointer" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={32} height={32} viewBox="0 0 12 12"
          fill={(hover || value) >= i ? GOLD : "#1e3d4d"}
          style={{ transition: "fill .15s ease", flexShrink: 0 }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9.2,11 6,9.2 2.8,11 3.5,7.5 1,5 4.5,4.5" />
        </svg>
      ))}
    </span>
  );
}

// â”€â”€ Card A: Giant quote mark, stars bottom-left, author bottom-right â”€â”€â”€â”€â”€â”€
function CardQuote({ r }: { r: Review }) {
  return (
    <div style={{
      background: SURFACE,
      borderRadius: 18,
      padding: "26px 22px 20px",
      position: "relative",
      overflow: "hidden",
      border: "1px solid rgba(237,182,63,.1)",
    }}>
      {/* decorative quote */}
      <div aria-hidden style={{
        position: "absolute", top: -18, right: 12,
        fontFamily: "Georgia, serif",
        fontSize: 120, lineHeight: 1,
        color: GOLD, opacity: .07,
        pointerEvents: "none", userSelect: "none",
      }}>
        â
      </div>

      <Stars rating={r.rating} size={13} />

      <p style={{
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        fontSize: 14, lineHeight: 1.8, color: CREAM,
        margin: "14px 0 20px", position: "relative",
      }}>
        {r.body}
      </p>

      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8, flexWrap: "wrap",
        borderTop: "1px solid rgba(237,182,63,.1)", paddingTop: 14,
      }}>
        <span style={{
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 700, fontSize: 13, color: GOLD,
        }}>
          {r.author_name}
        </span>
        <span style={{
          fontFamily: "var(--font-hanken), sans-serif",
          fontSize: 11, color: MUTED,
        }}>
          {r.visit_month ?? relDate(r.created_at)}
          {r.visit_type && ` · ${VISIT_LABELS[r.visit_type] ?? r.visit_type}`}
        </span>
      </div>
    </div>
  );
}

// â”€â”€ Card B: Letter-avatar, gold left accent border â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CardAvatar({ r }: { r: Review }) {
  return (
    <div style={{
      background: "#0a1f2b",
      borderRadius: 18,
      padding: "20px 20px 20px 22px",
      borderTop: "1px solid rgba(237,182,63,.15)",
      borderRight: "1px solid rgba(237,182,63,.15)",
      borderBottom: "1px solid rgba(237,182,63,.15)",
      borderLeft: `4px solid ${GOLD}`,
    }}>
      {/* header: avatar + name + visit badge */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 10, marginBottom: 14, flexWrap: "wrap",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: `linear-gradient(135deg, ${GOLD}, #c5613a)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-baloo), sans-serif",
          fontWeight: 800, fontSize: 16, color: DARK, flexShrink: 0,
        }}>
          {initial(r.author_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 13, color: CREAM, margin: 0 }}>
            {r.author_name}
          </p>
          <p style={{ fontFamily: "var(--font-hanken), sans-serif", fontSize: 11, color: MUTED, margin: 0 }}>
            {r.visit_month ?? relDate(r.created_at)}
          </p>
        </div>
        {r.visit_type && (
          <span style={{
            background: "rgba(237,182,63,.1)",
            border: "1px solid rgba(237,182,63,.25)",
            borderRadius: 100, padding: "3px 10px",
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 700, fontSize: 10, letterSpacing: ".08em",
            color: GOLD, whiteSpace: "nowrap",
          }}>
            {VISIT_LABELS[r.visit_type] ?? r.visit_type}
          </span>
        )}
      </div>

      <Stars rating={r.rating} size={12} />

      <p style={{
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
        fontSize: 14, lineHeight: 1.78, color: "#b8cdd6",
        margin: "12px 0 0",
      }}>
        {r.body}
      </p>
    </div>
  );
}

// â”€â”€ Card C: Gold-tinted header strip with stars + visit type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CardStrip({ r }: { r: Review }) {
  return (
    <div style={{
      background: "#0d2233",
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(237,182,63,.1)",
    }}>
      {/* top strip */}
      <div style={{
        background: "rgba(237,182,63,.08)",
        borderBottom: "1px solid rgba(237,182,63,.15)",
        padding: "10px 18px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 8, flexWrap: "wrap",
      }}>
        <Stars rating={r.rating} size={12} />
        {r.visit_type && (
          <span style={{
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 700, fontSize: 10, letterSpacing: ".12em", color: GOLD,
          }}>
            {(VISIT_LABELS[r.visit_type] ?? r.visit_type).toUpperCase()}
          </span>
        )}
      </div>

      {/* body */}
      <div style={{ padding: "18px 18px 20px" }}>
        <p style={{
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          fontSize: 14, lineHeight: 1.78, color: CREAM,
          margin: "0 0 16px",
        }}>
          {r.body}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: SURFACE,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 800, fontSize: 12, color: GOLD, flexShrink: 0,
          }}>
            {initial(r.author_name)}
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 13, color: CREAM }}>
              {r.author_name}
            </span>
            <span style={{ fontFamily: "var(--font-hanken), sans-serif", fontSize: 11, color: MUTED, marginLeft: 8 }}>
              {r.visit_month ?? relDate(r.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DestinationReviews({
  destinationId,
  destinationTitle,
  topColor,
}: {
  destinationId: string;
  destinationTitle: string;
  topColor: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [visitType, setVisitType] = useState("");
  const [visitMonth, setVisitMonth] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sb.from("destination_reviews")
      .select("*")
      .eq("destination_id", destinationId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: { data: Review[] | null }) => {
        setReviews(data ?? []);
        setLoading(false);
      });
  }, [destinationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!rating) { setError("Please select a star rating."); return; }
    if (body.trim().length < 15) { setError("Please write at least a sentence about your experience."); return; }
    setError("");
    setSubmitting(true);

    const { error: err } = await sb.from("destination_reviews").insert({
      destination_id: destinationId,
      author_name: name.trim(),
      rating,
      body: body.trim(),
      visit_type: visitType || null,
      visit_month: visitMonth.trim() || null,
    });

    setSubmitting(false);
    if (err) {
      console.error("destination_reviews insert error:", err);
      const msg = err.message?.includes("relation") || err.message?.includes("does not exist")
        ? "Database table not found — run supabase/destination_reviews_migration.sql first."
        : `Could not submit: ${err.message}`;
      setError(msg);
      return;
    }

    setReviews((prev) => [{
      id: Math.random().toString(36),
      author_name: name.trim(),
      rating,
      body: body.trim(),
      visit_type: visitType || null,
      visit_month: visitMonth.trim() || null,
      created_at: new Date().toISOString(),
    }, ...prev]);

    setSubmitted(true);
    setName(""); setRating(0); setBody(""); setVisitType(""); setVisitMonth("");
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const inp: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    background: "#0b2c39",
    border: "1.5px solid rgba(237,182,63,.2)",
    borderRadius: 10,
    padding: "11px 14px",
    fontFamily: "var(--font-hanken), system-ui, sans-serif",
    fontSize: 14,
    color: CREAM,
    outline: "none",
    transition: "border-color .25s",
  };

  return (
    <section style={{
      position: "relative",
      background: DARK,
      overflow: "hidden",
      padding: "0 0 clamp(80px,10vh,120px)",
      marginBottom: -1,
    }}>
      {topColor !== DARK && <Scallop edge="top" color={topColor} />}

      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "clamp(80px,13vh,160px) clamp(20px,5vw,38px) 0",
      }}>

        {/* Section heading */}
        <Reveal>
          <p style={{
            textAlign: "center",
            fontFamily: "var(--font-baloo), sans-serif",
            fontWeight: 700, fontSize: 13, letterSpacing: ".2em",
            color: GOLD, marginBottom: 8,
          }}>
            VISITOR EXPERIENCES
          </p>
        </Reveal>
        <Reveal as="h2" delay={60} style={{
          textAlign: "center",
          fontFamily: "var(--font-anton), sans-serif",
          color: CREAM,
          fontSize: "clamp(28px,4vw,56px)",
          lineHeight: 0.92, margin: "0 0 12px",
          textTransform: "uppercase",
        }}>
          What Travellers Say
        </Reveal>

        {/* Aggregate rating */}
        {!loading && reviews.length > 0 && (
          <Reveal delay={80}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <Stars rating={Math.round(avgRating)} size={16} />
              <span style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700, fontSize: 14, color: MUTED, marginLeft: 10,
              }}>
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          </Reveal>
        )}

        {/* Cards */}
        {loading ? (
          <div style={{
            textAlign: "center", padding: "40px 0 56px",
            fontFamily: "var(--font-hanken), sans-serif", fontSize: 14, color: MUTED,
          }}>
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <Reveal>
            <div style={{
              textAlign: "center", padding: "44px 24px",
              border: "2px dashed rgba(237,182,63,.18)",
              borderRadius: 18, marginBottom: 52,
            }}>
              <p style={{
                fontFamily: "var(--font-baloo), sans-serif",
                fontWeight: 700, fontSize: 18, color: CREAM, margin: "0 0 6px",
              }}>
                No reviews yet
              </p>
              <p style={{
                fontFamily: "var(--font-hanken), sans-serif",
                fontSize: 14, color: MUTED, margin: 0,
              }}>
                Be the first to share your experience at {destinationTitle}!
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="dest-reviews-masonry" style={{
              columns: "280px", columnGap: 20, marginBottom: 60,
            }}>
              {reviews.map((r, i) => (
                <div key={r.id} style={{ breakInside: "avoid", marginBottom: 20 }}>
                  {i % 3 === 0 && <CardQuote r={r} />}
                  {i % 3 === 1 && <CardAvatar r={r} />}
                  {i % 3 === 2 && <CardStrip r={r} />}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        {/* Submission form */}
        <Reveal y={24} delay={80}>
          <div style={{
            maxWidth: 640, margin: "0 auto",
            background: SURFACE,
            borderRadius: 20,
            padding: "clamp(26px,4vw,42px)",
            border: "1px solid rgba(237,182,63,.18)",
          }}>
            <h3 style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(22px,3vw,34px)",
              color: CREAM, margin: "0 0 6px",
              textTransform: "uppercase",
            }}>
              Share Your Experience
            </h3>
            <p style={{
              fontFamily: "var(--font-hanken), system-ui, sans-serif",
              fontSize: 13, color: MUTED, margin: "0 0 26px", lineHeight: 1.6,
            }}>
              Visited {destinationTitle}? Help fellow travellers with your honest experience — no account needed.
            </p>

            {submitted && (
              <div style={{
                background: "rgba(47,125,79,.15)",
                border: "1px solid rgba(47,125,79,.35)",
                borderRadius: 12, padding: "14px 18px", marginBottom: 22,
              }}>
                <p style={{
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 700, fontSize: 14, color: "#5ecf8a", margin: 0,
                }}>
                  âœ“ Thank you! Your review is now live above.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Name */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: GOLD, textTransform: "uppercase", marginBottom: 6 }}>
                  Your Name *
                </label>
                <input
                  style={inp}
                  placeholder="e.g. Rahul M."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(237,182,63,.2)")}
                  maxLength={60}
                />
              </div>

              {/* Star rating */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: GOLD, textTransform: "uppercase", marginBottom: 10 }}>
                  Your Rating *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <StarInput value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <span style={{
                      fontFamily: "var(--font-baloo), sans-serif",
                      fontWeight: 700, fontSize: 13, color: MUTED,
                    }}>
                      {RATING_LABELS[rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Visit type */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: GOLD, textTransform: "uppercase", marginBottom: 8 }}>
                  Visited As
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["solo", "couple", "family", "group"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVisitType((v) => (v === t ? "" : t))}
                      style={{
                        padding: "7px 16px", borderRadius: 100,
                        fontFamily: "var(--font-baloo), sans-serif",
                        fontWeight: 700, fontSize: 12, letterSpacing: ".04em",
                        background: visitType === t ? GOLD : "transparent",
                        color: visitType === t ? DARK : MUTED,
                        border: `1.5px solid ${visitType === t ? GOLD : "rgba(237,182,63,.2)"}`,
                        cursor: "pointer", transition: "all .2s ease",
                      }}
                    >
                      {VISIT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visit date */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: GOLD, textTransform: "uppercase", marginBottom: 6 }}>
                  When Did You Visit?
                </label>
                <input
                  style={{ ...inp, maxWidth: 240 }}
                  placeholder="e.g. June 2025"
                  value={visitMonth}
                  onChange={(e) => setVisitMonth(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(237,182,63,.2)")}
                  maxLength={30}
                />
              </div>

              {/* Experience body */}
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-baloo), sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".14em", color: GOLD, textTransform: "uppercase", marginBottom: 6 }}>
                  Your Experience *
                </label>
                <textarea
                  style={{ ...inp, minHeight: 120, resize: "vertical", lineHeight: 1.65 } as React.CSSProperties}
                  placeholder="What did you love? Tips for getting there, best time to go, what to bring..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = GOLD)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(237,182,63,.2)")}
                  maxLength={1000}
                  rows={4}
                />
                <div style={{
                  textAlign: "right",
                  fontFamily: "var(--font-hanken), sans-serif",
                  fontSize: 11, color: MUTED, marginTop: 4,
                }}>
                  {body.length}/1000
                </div>
              </div>

              {error && (
                <p style={{
                  fontFamily: "var(--font-hanken), sans-serif",
                  fontSize: 13, color: "#f87171", margin: 0,
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? SURFACE : GOLD,
                  color: submitting ? MUTED : DARK,
                  border: "none",
                  borderRadius: 100,
                  padding: "14px 32px",
                  fontFamily: "var(--font-baloo), sans-serif",
                  fontWeight: 800, fontSize: 13, letterSpacing: ".08em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all .25s ease",
                  alignSelf: "flex-start",
                }}
              >
                {submitting ? "Posting…" : "Post Review →"}
              </button>
            </form>
          </div>
        </Reveal>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .dest-reviews-masonry { columns: 1 !important; }
        }
      `}</style>
    </section>
  );
}
