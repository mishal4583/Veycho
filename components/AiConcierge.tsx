"use client";

import { useEffect, useRef, useState } from "react";

/* =============================================================================
   Veycho Concierge — ported 1:1 from the "Veycho Concierge.dc.html" design.
   Visuals (rotated cream panel, floating header/footer, gold launcher, bubbles,
   typing dots, chips, greeting) match the design exactly. The design's
   window.claude.complete() stub is swapped for the app's real /api/concierge
   backend (Gemini + Supabase).
   ========================================================================== */

type Msg = { role: "user" | "assistant"; content: string };

const ANTON = "var(--font-anton), sans-serif";
const BALOO = "var(--font-baloo), sans-serif";
const HANKEN = "var(--font-hanken), system-ui, sans-serif";

const GREETING =
  "Hi, welcome to Veycho! 🍃 I can walk you through our signature Wayanadan dishes, opening hours or how to find us. What are you craving?";
const CHIPS = ["Signature dishes?", "Opening hours?", "Where are you?", "Veg options?"];

function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem("veycho_concierge_sid");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("veycho_concierge_sid", id);
  }
  return id;
}

const stripMarkdown = (s: string) =>
  s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s*/gm, "");

/* small reusable avatar disc with the gold Anton "V" */
function Avatar({ size, radius, font }: { size: number; radius: number; font: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: "none",
        background: "#0b2c39",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: ANTON, color: "#edb63f", fontSize: font, lineHeight: 1 }}>V</span>
    </div>
  );
}

export default function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [input, setInput] = useState("");
  const [convo, setConvo] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Phones get a full-screen panel; the rotated card would clip off-screen.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Restore any persisted conversation (last 20 turns) after mount.
  useEffect(() => {
    try {
      const s = JSON.parse(window.localStorage.getItem("vcb_convo") || "[]");
      if (Array.isArray(s)) setConvo(s);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist conversation.
  useEffect(() => {
    try {
      window.localStorage.setItem("vcb_convo", JSON.stringify(convo.slice(-20)));
    } catch {
      /* ignore */
    }
  }, [convo]);

  const scrollDown = () => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (open) scrollDown();
  }, [convo, typing, open]);

  const handleSend = async (raw: string) => {
    const text = (raw || "").trim();
    if (!text || busy) return;
    setInput("");
    const history = convo; // prior turns, before this message
    setConvo((c) => [...c, { role: "user", content: text }]);
    setBusy(true);
    setTyping(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, session_id: getSessionId() }),
      });
      const data = await res.json().catch(() => ({}));
      let out = res.ok
        ? (data.answer ?? "").trim() || "Sorry, I didn't catch that — could you ask again?"
        : data.error || "Sorry, I didn't catch that — could you ask again?";
      out = stripMarkdown(out);
      setTyping(false);
      setConvo((c) => [...c, { role: "assistant", content: out }]);
    } catch {
      setTyping(false);
      setConvo((c) => [
        ...c,
        {
          role: "assistant",
          content:
            "I'm having a little trouble right now. Please call us at +91 92926 19419 and we'll be glad to help!",
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  const setPanel = (v: boolean) => {
    setOpen(v);
    if (v) setTimeout(() => inputRef.current?.focus(), 60);
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 26,
        bottom: 26,
        // when the full-screen mobile panel is open, sit above the nav menu/hamburger
        zIndex: open && isMobile ? 10002 : 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 16,
        fontFamily: HANKEN,
      }}
    >
      {/* PANEL */}
      {open && (
        <div
          id="vcb-panel"
          role="dialog"
          aria-label="Veycho Concierge"
          style={
            isMobile
              ? {
                  // full-screen on phones — no rotation/clipping
                  display: "flex",
                  position: "fixed",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  background: "#f1e6d0",
                  overflow: "hidden",
                  animation: "vcb-pop-panel-m .4s cubic-bezier(.16,1,.3,1)",
                }
              : {
                  display: "flex",
                  position: "relative",
                  width: 382,
                  maxWidth: "calc(100vw - 36px)",
                  height: 582,
                  maxHeight: "calc(100vh - 116px)",
                  background: "#f1e6d0",
                  borderRadius: 30,
                  overflow: "hidden",
                  boxShadow: "0 34px 80px rgba(0,0,0,.5)",
                  transform: "rotate(-3deg)",
                  transformOrigin: "bottom right",
                  animation: "vcb-pop-panel .46s cubic-bezier(.16,1,.3,1)",
                }
          }
        >
          {/* messages (scroll behind floating header & input) */}
          <div
            id="vcb-msgs"
            ref={msgsRef}
            style={{
              position: "absolute",
              inset: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: isMobile
                ? "calc(82px + env(safe-area-inset-top)) 18px calc(98px + env(safe-area-inset-bottom))"
                : "82px 18px 98px",
              display: "flex",
              flexDirection: "column",
              gap: 13,
            }}
          >
            {/* greeting (always first) */}
            <Bubble role="assistant" text={GREETING} />
            {convo.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {typing && <Typing />}
          </div>

          {/* floating header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: isMobile
                ? "calc(16px + env(safe-area-inset-top)) 16px 32px"
                : "16px 16px 32px",
              background:
                "linear-gradient(180deg,#f1e6d0 0%,#f1e6d0 42%,rgba(241,230,208,.8) 72%,rgba(241,230,208,0) 100%)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "#0b2c39",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <span style={{ fontFamily: ANTON, color: "#edb63f", fontSize: 21, lineHeight: 1 }}>V</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: BALOO,
                  fontWeight: 800,
                  color: "#11262f",
                  fontSize: 17,
                  lineHeight: 1.05,
                }}
              >
                Veycho Concierge
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  color: "#7a6c4d",
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#2f7d4f",
                    display: "inline-block",
                  }}
                />
                Online · replies instantly
              </div>
            </div>
            <button
              aria-label="Close"
              onClick={() => setPanel(false)}
              style={{
                flex: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "rgba(11,44,57,.1)",
                color: "#0b2c39",
                fontSize: 15,
                cursor: "pointer",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* floating bottom: chips + input */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 5,
              padding: isMobile
                ? "36px 14px calc(15px + env(safe-area-inset-bottom))"
                : "36px 14px 15px",
              background:
                "linear-gradient(0deg,#f1e6d0 0%,#f1e6d0 54%,rgba(241,230,208,.8) 80%,rgba(241,230,208,0) 100%)",
            }}
          >
            {convo.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 4px 11px" }}>
                {CHIPS.map((c) => (
                  <Chip key={c} label={c} onClick={() => handleSend(c)} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                id="vcb-input"
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Ask about dishes, hours, directions…"
                style={{
                  flex: 1,
                  background: "#fffaf0",
                  border: "1px solid rgba(11,44,57,.12)",
                  borderRadius: 100,
                  color: "#11262f",
                  fontFamily: HANKEN,
                  fontSize: 14.5,
                  padding: "13px 18px",
                  outline: "none",
                  boxShadow: "0 6px 18px rgba(6,20,27,.08)",
                }}
              />
              <button
                aria-label="Send"
                onClick={() => handleSend(input)}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08) rotate(-6deg)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) rotate(0deg)")}
                style={{
                  flex: "none",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "none",
                  background: "#edb63f",
                  color: "#071821",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  transition: "transform .15s",
                  boxShadow: "0 6px 18px rgba(6,20,27,.12)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#071821"
                  strokeWidth={3.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12h15" />
                  <path d="M13 6l7 6-7 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCHER */}
      <button
        aria-label="Ask Veycho"
        onClick={() => setPanel(true)}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.07)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        style={{
          display: open ? "none" : "flex",
          border: "none",
          cursor: "pointer",
          background: "#edb63f",
          borderRadius: "50%",
          width: 64,
          height: 64,
          padding: 7,
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          boxShadow: "0 14px 32px rgba(0,0,0,.42)",
          transition: "transform .2s",
        }}
      >
        <span
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "#0b2c39",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#edb63f", fontSize: 26, lineHeight: 1 }}>✦</span>
        </span>
      </button>
    </div>
  );
}

/* ---- message bubble ---- */
function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        gap: 9,
        alignItems: "flex-end",
        animation: "vcb-pop .28s cubic-bezier(.16,1,.3,1)",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser && <Avatar size={28} radius={9} font={13} />}
      <div
        style={{
          maxWidth: "80%",
          fontFamily: BALOO,
          fontWeight: 500,
          fontSize: 14.5,
          lineHeight: 1.5,
          padding: "11px 15px",
          borderRadius: 20,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          ...(isUser
            ? { background: "#0b2c39", color: "#f4ead6", borderBottomRightRadius: 6 }
            : { background: "#ffffff", color: "#22302a", borderBottomLeftRadius: 6 }),
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ---- typing indicator ---- */
function Typing() {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-end", justifyContent: "flex-start" }}>
      <Avatar size={28} radius={9} font={13} />
      <div
        style={{
          background: "#ffffff",
          borderBottomLeftRadius: 6,
          borderRadius: 20,
          padding: "14px 16px",
          display: "flex",
          gap: 5,
          alignItems: "center",
        }}
      >
        {[0, 0.18, 0.36].map((d) => (
          <span
            key={d}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#c5613a",
              animation: `vcb-blink 1s infinite ${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- suggestion chip ---- */
function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#edb63f";
        e.currentTarget.style.borderColor = "#edb63f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "rgba(11,44,57,.22)";
      }}
      style={{
        border: "1px solid rgba(11,44,57,.22)",
        background: "transparent",
        color: "#0b2c39",
        fontFamily: BALOO,
        fontWeight: 700,
        fontSize: 12.5,
        padding: "8px 14px",
        borderRadius: 100,
        cursor: "pointer",
        transition: "all .18s",
      }}
    >
      {label}
    </button>
  );
}
