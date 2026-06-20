// Fetches reviews from the Google Places API (Place Details). Google has no
// push/webhook for new reviews, so the pipeline polls this on a schedule.
// Place Details returns up to 5 of the place's reviews.
export type NormalizedReview = {
  name: string;
  rating: number;
  text: string;
  time: number; // unix seconds (review publish time), 0 if unknown
};

/** True only when both the API key and the place id are configured. */
export function reviewsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

export async function fetchGoogleReviews(): Promise<NormalizedReview[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("key", key);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") {
    throw new Error(`Places API status ${data.status}${data.error_message ? `: ${data.error_message}` : ""}`);
  }

  const reviews = Array.isArray(data.result?.reviews) ? data.result.reviews : [];
  return reviews
    .map((r: any): NormalizedReview => ({
      name: String(r.author_name ?? "Guest").trim(),
      rating: Number(r.rating ?? 0),
      text: String(r.text ?? "").trim(),
      time: Number(r.time ?? 0),
    }))
    .filter((r: NormalizedReview) => r.text.length > 0 && r.rating > 0);
}
