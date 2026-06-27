// Fetches reviews from the Google Places API (Place Details). Google has no
// push/webhook for new reviews, so the pipeline polls this on a schedule.
// Place Details returns up to 5 of the place's reviews, but the response also
// contains user_ratings_total (all-time count) and rating (overall avg) for the place.
export type NormalizedReview = {
  name: string;
  rating: number;
  text: string;
  time: number; // unix seconds (review publish time), 0 if unknown
};

export type PlaceStats = {
  totalCount: number;  // user_ratings_total from Google
  avgRating: string;   // overall place rating, e.g. "4.1"
};

/** True only when both the API key and the place id are configured. */
export function reviewsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID);
}

async function callPlacesApi(fields: string): Promise<any> {
  const key = process.env.GOOGLE_PLACES_API_KEY!;
  const placeId = process.env.GOOGLE_PLACE_ID!;
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", fields);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Places API HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") {
    throw new Error(`Places API status ${data.status}${data.error_message ? `: ${data.error_message}` : ""}`);
  }
  return data.result;
}

/** Returns the aggregate rating and total review count for the place (cached 1 h). */
export async function fetchGooglePlaceStats(): Promise<PlaceStats | null> {
  if (!reviewsConfigured()) return null;
  try {
    const result = await callPlacesApi("rating,user_ratings_total");
    const totalCount = Number(result.user_ratings_total ?? 0);
    const avgRating = result.rating != null ? Number(result.rating).toFixed(1) : null;
    if (!totalCount || !avgRating) return null;
    return { totalCount, avgRating };
  } catch {
    return null;
  }
}

export async function fetchGoogleReviews(): Promise<NormalizedReview[]> {
  if (!reviewsConfigured()) return [];
  try {
    const result = await callPlacesApi("reviews");
    const reviews = Array.isArray(result?.reviews) ? result.reviews : [];
    return reviews
      .map((r: any): NormalizedReview => ({
        name: String(r.author_name ?? "Guest").trim(),
        rating: Number(r.rating ?? 0),
        text: String(r.text ?? "").trim(),
        time: Number(r.time ?? 0),
      }))
      .filter((r: NormalizedReview) => r.text.length > 0 && r.rating > 0);
  } catch {
    return [];
  }
}
