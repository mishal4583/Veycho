// Public read for the reviews wall: approved, >= 4 star, newest first.
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("name, rating, review_text, created_at")
      .eq("approved", true)
      .eq("archived", false)
      .gte("rating", 4)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw error;
    return Response.json({ reviews: data ?? [] });
  } catch (e: any) {
    // Fall back to the wall's built-in reviews on any error.
    return Response.json({ reviews: [], error: e?.message ?? "failed" });
  }
}
