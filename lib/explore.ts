// ============================================================
//  Explore Wayanad — types, static defaults, and DB helpers.
//  All helpers fall back to DEFAULT_DESTINATIONS / DEFAULT_CATEGORIES
//  if the DB tables don't exist yet (safe before migration runs).
// ============================================================

import { createClient } from "@/lib/supabase/server";

export type DestinationCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  enabled: boolean;
  created_at: string;
};

export type TravelTip = { icon: string; label: string; tip: string };

export type Destination = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string | null;
  category_id: string | null;
  category?: { name: string; slug: string; icon: string } | null;
  featured_image: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  travel_time: string | null;
  entry_fee: string | null;
  best_time: string | null;
  best_season: string | null;
  opening_hours: string | null;
  difficulty_level: string | null;
  family_friendly: boolean;
  parking_available: boolean;
  amenities: string[];
  travel_tips: TravelTip[];
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  google_rating: number | null;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
  images?: DestinationImage[];
};

export type DestinationImage = {
  id: string;
  destination_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

// ---- Static category defaults (filter pills still work before migration) ----

export const DEFAULT_CATEGORIES: DestinationCategory[] = [
  { id: "c1", name: "Waterfalls", slug: "waterfalls", icon: "💧", sort_order: 1, enabled: true, created_at: "" },
  { id: "c2", name: "Viewpoints", slug: "viewpoints", icon: "🏔", sort_order: 2, enabled: true, created_at: "" },
  { id: "c3", name: "Adventure", slug: "adventure", icon: "🧗", sort_order: 3, enabled: true, created_at: "" },
  { id: "c4", name: "Wildlife", slug: "wildlife", icon: "🦁", sort_order: 4, enabled: true, created_at: "" },
  { id: "c5", name: "Heritage", slug: "heritage", icon: "🏛", sort_order: 5, enabled: true, created_at: "" },
  { id: "c6", name: "Lakes", slug: "lakes", icon: "🌊", sort_order: 6, enabled: true, created_at: "" },
  { id: "c7", name: "Hidden Gems", slug: "hidden-gems", icon: "✨", sort_order: 7, enabled: true, created_at: "" },
];

// ---- DB helpers (fall back to defaults if tables don't exist) ----

type Row = Record<string, unknown>;

function mapRow(d: Row): Destination {
  const cat = d.destination_categories as Row | null;
  return {
    ...(d as unknown as Destination),
    amenities: Array.isArray(d.amenities) ? (d.amenities as string[]) : [],
    travel_tips: Array.isArray(d.travel_tips) ? (d.travel_tips as TravelTip[]) : [],
    category: cat ? { name: String(cat.name ?? ""), slug: String(cat.slug ?? ""), icon: String(cat.icon ?? "") } : null,
    images: Array.isArray(d.destination_images) ? (d.destination_images as DestinationImage[]) : [],
  };
}

export async function getDestinations(): Promise<Destination[]> {
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("destinations")
      .select("*, destination_categories(name,slug,icon)")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data?.length) return [];
    return (data as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function getFeaturedDestinations(): Promise<Destination[]> {
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("destinations")
      .select("*, destination_categories(name,slug,icon)")
      .eq("status", "published")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(6);
    if (error || !data?.length) return [];
    return (data as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("destinations")
      .select("*, destination_categories(name,slug,icon), destination_images(id,image_url,sort_order)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

export async function getNearbyDestinations(currentSlug: string): Promise<Destination[]> {
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("destinations")
      .select("*, destination_categories(name,slug,icon)")
      .eq("status", "published")
      .neq("slug", currentSlug)
      .order("featured", { ascending: false })
      .limit(4);
    if (error || !data?.length) return [];
    return (data as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function getDestinationCategories(): Promise<DestinationCategory[]> {
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("destination_categories")
      .select("*")
      .eq("enabled", true)
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_CATEGORIES;
    return data as DestinationCategory[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export type FoodPick = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export async function getVeychoFoodPicks(): Promise<FoodPick[]> {
  try {
    const sb = await createClient();
    // Prefer chef specials + popular items that have photos
    const { data } = await sb
      .from("menu_items")
      .select("id, name, description, image_url")
      .eq("availability", true)
      .not("image_url", "is", null)
      .or("is_chef_special.eq.true,is_popular.eq.true")
      .order("is_chef_special", { ascending: false })
      .limit(3);
    if (data?.length) return data as FoodPick[];
    // Fallback: any available items with photos
    const { data: fallback } = await sb
      .from("menu_items")
      .select("id, name, description, image_url")
      .eq("availability", true)
      .not("image_url", "is", null)
      .limit(3);
    return (fallback as FoodPick[] | null) ?? [];
  } catch {
    return [];
  }
}
