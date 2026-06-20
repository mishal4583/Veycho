// Reviews ingestion pipeline. Run on a schedule (see vercel.json cron) — it pulls
// the latest Google reviews, keeps the >= 4 star ones, and upserts new ones into
// the `reviews` table (approved + source="google") so they appear on the site.
//
// Deploy-now / configure-later: with the Google env vars unset it cleanly no-ops,
// so this can ship today and start flowing the moment the key + place id are added.
import { fetchGoogleReviews, reviewsConfigured } from "@/lib/google-reviews";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_RATING = 4;

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
// If it isn't set, the endpoint is open (handy for first deploy / manual runs).
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!reviewsConfigured()) {
    return Response.json({
      skipped: true,
      reason: "Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID to enable the Google reviews sync.",
    });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({
      skipped: true,
      reason: "Set SUPABASE_SERVICE_ROLE_KEY so the sync can write to the reviews table.",
    });
  }

  try {
    const incoming = (await fetchGoogleReviews()).filter((r) => r.rating >= MIN_RATING);
    const supabase = createAdminClient();

    // Dedupe against what we already imported (no external id, so key on name+text).
    const { data: existing } = await supabase
      .from("reviews")
      .select("name, review_text")
      .eq("source", "google");
    const seen = new Set((existing ?? []).map((r) => `${r.name}::${r.review_text}`));

    const toInsert = incoming
      .filter((r) => !seen.has(`${r.name}::${r.text}`))
      .map((r) => ({
        name: r.name,
        rating: r.rating,
        review_text: r.text,
        source: "google",
        approved: true,
        ...(r.time ? { created_at: new Date(r.time * 1000).toISOString() } : {}),
      }));

    let inserted = 0;
    if (toInsert.length) {
      const { error } = await supabase.from("reviews").insert(toInsert);
      if (error) throw error;
      inserted = toInsert.length;
    }

    return Response.json({ ok: true, fetched: incoming.length, inserted });
  } catch (e: any) {
    console.error("reviews sync failed", e);
    return Response.json({ error: e?.message ?? "sync failed" }, { status: 500 });
  }
}

export const GET = handle; // Vercel Cron calls GET
export const POST = handle; // allow manual trigger (e.g. an admin "Sync now" button)
