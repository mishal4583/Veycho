import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are the Digital Concierge for "Veycho Restaurant & Cafe Wayanad" — a warm, family-run resto-cafe in Kalpetta, Wayanad, Kerala, established in 2020 by Jamsheed K.V.

Tagline: "Authentic Flavors, Unforgettable Memories." The Wayanadan greeting "Veycho" means "Have you had your food yet?" — reflect this warmth.

Tone: warm, hospitable, concise (2-4 sentences). Never robotic.

SIGNATURE DISHES (always recommend these to first-time visitors):
- Wayanadan Pothumkaal — slow-braised heritage beef shank with Wayanadan spices
- Vaariyellu — wood-fired beef ribs, marinated in coconut, pepper and indigenous masala
- Paalkappa Beef — tender tapioca in coconut milk with peppery slow-cooked beef
Other house favourites: Thengachore, White Bull Burger, Thai Grill Steak.

WAYANAD TOURISM KNOWLEDGE:
You are also a Wayanad tourism guide. Answer questions about nearby attractions, viewpoints, waterfalls, wildlife, heritage sites, trekking, and travel tips. Seamlessly combine restaurant + tourism advice. Example: "After lunch, you could visit Edakkal Caves (27 km, 45 mins drive)."

KEY NEARBY DESTINATIONS (from Veycho/Kalpetta):
- Pookode Lake — 8 km, 15 mins. Serene freshwater lake, boating. Easy, all year.
- Lakkidi View Point — 12 km, 20 mins. Misty gateway viewpoint, free entry. Easy.
- Soochipara Waterfalls — 18 km, 30 mins. Three-tiered waterfall, swimming pool. ₹40/person.
- Banasura Sagar Dam — 21 km, 35 mins. India's largest earth dam, boat rides. Easy.
- Meenmutty Falls — 25 km, 40 mins. Kerala's second largest waterfall. Moderate.
- Edakkal Caves — 27 km, 45 mins. Ancient petroglyphs 6000 BCE. Heritage. ₹40/person.
- Chembra Peak — 30 km, 50 mins. Highest peak 2100m, heart-shaped lake. Permit required.
- Wayanad Wildlife Sanctuary — 35 km, 60 mins. Elephant safari, tigers, leopards.

SAMPLE ONE-DAY ITINERARY:
Morning: Edakkal Caves or Chembra Peak trek
Midday: Lunch at Veycho (try Pothumkaal + Thengachore)
Afternoon: Banasura Sagar Dam or Pookode Lake
Evening: Lakkidi View Point for sunset

STRICT RULES:
- Answer questions about Veycho Restaurant AND Wayanad tourism/travel.
- For non-Wayanad/non-Veycho questions (politics, code, other states, etc.), respond: "I am Veycho's Digital Concierge and can assist with restaurant and Wayanad tourism questions."
- Veycho does NOT take online table reservations or bookings. Walk-ins are always welcome. If a guest asks to reserve/book a table, warmly explain there is no online booking — they can simply walk in, or call +91 9292619419 with any questions.
- Never invent menu items, prices, hours, or contact details — use only the CONTEXT below.
- If a first-time visitor asks for recommendations, lead with Pothumkaal, Vaariyellu and Paalkappa Beef, then suggest a nearby destination.
- If context lacks the answer, politely suggest contacting +91 9292619419 or veychorestocafe@gmail.com.
- Always weave Veycho dining into tourism suggestions naturally.`;

// ---- Limits (abuse / cost protection) ----
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_ITEM_CHARS = 4000;
// Best-effort in-memory throttle. On serverless this is per-instance (not global),
// so it softens — not eliminates — abuse. A durable limiter (e.g. Upstash Redis) can
// be dropped in later for hard guarantees.
const RATE_LIMIT_MAX = 12; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute per IP
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return recent.length > RATE_LIMIT_MAX;
}

function serverSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function buildContext() {
  const supabase = serverSupabase();

  const [menu, faqs, settings, story, offers, specials, destinations] = await Promise.all([
    supabase.from("menu_items").select("name,description,price,is_veg,is_chef_special,is_popular,spice_level,ingredients,tag").eq("availability", true).limit(100),
    supabase.from("faqs").select("question,answer,category").limit(50),
    supabase.from("settings").select("*").limit(1).maybeSingle(),
    supabase.from("story").select("title,subtitle,content").limit(1).maybeSingle(),
    supabase.from("offers").select("title,description,expiry_date").eq("active", true).limit(20),
    supabase.from("menu_items").select("name,description,price,tag").eq("is_chef_special", true).limit(20),
    supabase.from("destinations").select("title,short_description,distance_km,travel_time,entry_fee,best_season,difficulty_level,family_friendly").eq("status", "published").limit(20),
  ]);

  const s = settings.data as any;
  return `
=== RESTAURANT INFO ===
${s ? `Name: ${s.restaurant_name}
Phone: ${s.phone ?? ""} | WhatsApp: ${s.whatsapp ?? ""} | Email: ${s.email ?? ""}
Address: ${s.address ?? ""}
Hours: ${s.opening_hours ?? ""}` : ""}

=== STORY ===
${story.data ? `${(story.data as any).title ?? ""}\n${(story.data as any).content ?? ""}` : ""}

=== CHEF SPECIALS ===
${(specials.data ?? []).map((d: any) => `• ${d.name} — ₹${d.price} — ${d.description ?? ""}`).join("\n")}

=== MENU (${menu.data?.length ?? 0} items) ===
${(menu.data ?? []).map((m: any) => `• ${m.name} (${m.is_veg ? "veg" : "non-veg"}) — ₹${m.price}${m.tag ? ` [${m.tag}]` : ""} — ${m.description ?? ""}${m.ingredients ? ` Ingredients: ${m.ingredients}.` : ""}`).join("\n")}

=== ACTIVE OFFERS ===
${(offers.data ?? []).map((o: any) => `• ${o.title} — ${o.description ?? ""}`).join("\n") || "(none)"}

=== FAQs ===
${(faqs.data ?? []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}

=== NEARBY WAYANAD DESTINATIONS (from DB) ===
${(destinations.data ?? []).map((d: any) => `• ${d.title} — ${d.distance_km ?? "?"}km, ${d.travel_time ?? "?"} — ${d.short_description ?? ""} | Entry: ${d.entry_fee ?? "varies"} | Best: ${d.best_season ?? "all year"} | Difficulty: ${d.difficulty_level ?? "varies"} | Family: ${d.family_friendly ? "yes" : "no"}`).join("\n")}
`.trim();
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return Response.json({ error: "Too many requests. Please slow down a moment." }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as {
      message?: unknown;
      history?: unknown;
      session_id?: unknown;
    } | null;

    const rawMessage = typeof body?.message === "string" ? body.message.trim() : "";
    if (!rawMessage) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }
    if (rawMessage.length > MAX_MESSAGE_CHARS) {
      return Response.json({ error: "Message is too long." }, { status: 400 });
    }
    const message = rawMessage;

    const history = Array.isArray(body?.history)
      ? (body!.history as unknown[])
          .filter(
            (m): m is { role: "user" | "assistant"; content: string } =>
              !!m &&
              typeof m === "object" &&
              (((m as any).role === "user") || ((m as any).role === "assistant")) &&
              typeof (m as any).content === "string",
          )
          .slice(-MAX_HISTORY_TURNS)
          .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_ITEM_CHARS) }))
      : [];

    const session_id =
      typeof body?.session_id === "string" ? body.session_id.slice(0, 100) : null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: "AI not configured" }, { status: 503 });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const context = await buildContext();

    // Gemini uses roles "user" and "model" (no "system"/"assistant").
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}` }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      },
    );

    if (res.status === 429) return Response.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    if (!res.ok) {
      const t = await res.text();
      console.error("Gemini API error", res.status, t);
      return Response.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await res.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("").trim() ||
      "I'm having trouble responding right now. Please try again, or contact +91 9292619419.";

    // Log async (fire-and-forget)
    try {
      await serverSupabase().from("chat_logs").insert({ session_id, question: message, answer });
    } catch (e) {
      console.error("chat_log insert failed", e);
    }

    return Response.json({ answer });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
