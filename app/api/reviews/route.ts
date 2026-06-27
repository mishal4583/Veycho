// Public read for the reviews wall: approved, >= 4 star, newest first.
// Stats (totalCount + avgRating) come from the Google Places API (cached 1 h)
// which returns the real all-time count and overall rating for the place —
// the DB only holds the ~5 most-recently synced reviews, not the full history.
import { createClient } from "@/lib/supabase/server";
import { fetchGooglePlaceStats, reviewsConfigured } from "@/lib/google-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch display cards + Google place stats in parallel
    const [reviewsRes, googleStats] = await Promise.all([
      supabase
        .from("reviews")
        .select("name, rating, review_text, created_at")
        .eq("approved", true)
        .eq("archived", false)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(12),
      reviewsConfigured() ? fetchGooglePlaceStats() : Promise.resolve(null),
    ]);

    if (reviewsRes.error) throw reviewsRes.error;

    return Response.json({
      reviews: reviewsRes.data ?? [],
      // Real Google Maps stats (all-time count + overall rating for the place)
      totalCount: googleStats?.totalCount ?? null,
      avgRating: googleStats?.avgRating ?? null,
    });
  } catch (e: any) {
    return Response.json({ reviews: [], error: e?.message ?? "failed" });
  }
}
