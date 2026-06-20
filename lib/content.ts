// ============================================================
//  Server content helpers
//  Read editable content from Supabase and merge it OVER the typed defaults in
//  lib/content-defaults.ts, so every field falls back to the current copy when
//  the DB row is missing/empty. Call these from Server Components only (they use
//  the cookie-backed server client). Each fetch is wrapped so a DB outage simply
//  yields the defaults instead of throwing.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CONTENT,
  DEFAULT_SPECIAL_DISHES,
  MENU_DEFAULT,
  CATEGORY_THEME,
  NEUTRAL_THEME,
  TAG_META,
  type SiteContent,
  type SpecialDish,
  type MenuCategory,
  type MenuItem,
  type JourneyChapter,
  type FooterLink,
} from "@/lib/content-defaults";

type Row = Record<string, unknown>;

// keep a DB string only when it has real content, else fall back
const s = (v: unknown, d: string): string =>
  typeof v === "string" && v.trim() ? v : d;
const arr = <T>(v: unknown, d: T[]): T[] =>
  Array.isArray(v) && v.length ? (v as T[]) : d;

function priceText(v: unknown): string {
  if (typeof v === "number") return `₹${v}`;
  if (typeof v === "string" && v.trim()) return v.startsWith("₹") ? v : `₹${v}`;
  return "";
}

/** All singleton site copy (site_content + settings + story), merged over defaults. */
export async function getSiteContent(): Promise<SiteContent> {
  const d = DEFAULT_CONTENT;
  let sections: Record<string, Row> = {};
  let settings: Row | null = null;
  let story: Row | null = null;

  try {
    const sb = await createClient();
    const [sc, st, sy] = await Promise.all([
      sb.from("site_content").select("section,data"),
      sb.from("settings").select("*").limit(1).maybeSingle(),
      sb.from("story").select("*").limit(1).maybeSingle(),
    ]);
    if (Array.isArray(sc.data)) {
      for (const r of sc.data as { section: string; data: Row }[]) {
        sections[r.section] = (r.data as Row) ?? {};
      }
    }
    settings = (st.data as Row) ?? null;
    story = (sy.data as Row) ?? null;
  } catch {
    // fall through → defaults
  }

  const get = (k: string): Row => sections[k] ?? {};
  const hero = get("hero");
  const promo = get("promo");
  const storyExtra = get("story_extra");
  const chef = get("chef_specials");
  const reviews = get("reviews");
  const visit = get("visit");
  const footer = get("footer");
  const nav = get("nav");
  const menuPage = get("menu_page");
  const galleryPage = get("gallery_page");

  const set = settings ?? {};
  const socials = (set.social_links_json as Row) ?? {};

  const chapters = arr<JourneyChapter>(
    story?.timeline_json,
    d.journey.chapters
  ).map((c, i) => ({
    year: s(c.year, d.journey.chapters[i]?.year ?? ""),
    title: s(c.title, d.journey.chapters[i]?.title ?? ""),
    body: s(c.body, d.journey.chapters[i]?.body ?? ""),
  }));

  return {
    promo: { message: s(promo.message, d.promo.message) },
    nav: {
      menuLabel: s(nav.menuLabel, d.nav.menuLabel),
      galleryLabel: s(nav.galleryLabel, d.nav.galleryLabel),
      visitLabel: s(nav.visitLabel, d.nav.visitLabel),
    },
    hero: {
      label: s(hero.label, d.hero.label),
      title: s(hero.title, d.hero.title),
      tagline: s(hero.tagline, d.hero.tagline),
      badgeText: s(hero.badgeText, d.hero.badgeText),
      videoUrl: s(hero.videoUrl, d.hero.videoUrl),
      posterUrl: s(hero.posterUrl, d.hero.posterUrl),
    },
    story: {
      paragraph: s(story?.content, d.story.paragraph),
      ctaLabel: s(storyExtra.ctaLabel, d.story.ctaLabel),
    },
    journey: {
      label: s(storyExtra.journeyLabel, d.journey.label),
      subtitle: s(storyExtra.journeySubtitle, d.journey.subtitle),
      hintDesktop: s(storyExtra.journeyHintDesktop, d.journey.hintDesktop),
      hintMobile: s(storyExtra.journeyHintMobile, d.journey.hintMobile),
      chapters,
    },
    chefSpecials: {
      label: s(chef.label, d.chefSpecials.label),
      heading: s(chef.heading, d.chefSpecials.heading),
      description: s(chef.description, d.chefSpecials.description),
      ctaHeading: s(chef.ctaHeading, d.chefSpecials.ctaHeading),
      ctaDesc: s(chef.ctaDesc, d.chefSpecials.ctaDesc),
    },
    reviews: {
      heading: s(reviews.heading, d.reviews.heading),
      ratingBadge: s(reviews.ratingBadge, d.reviews.ratingBadge),
    },
    visit: {
      heading: s(visit.heading, d.visit.heading),
      ctaParagraph: s(visit.ctaParagraph, d.visit.ctaParagraph),
      mapBadge: s(visit.mapBadge, d.visit.mapBadge),
      address: s(set.address, d.visit.address),
      phone: s(set.phone, d.visit.phone),
      whatsapp: s(set.whatsapp, d.visit.whatsapp),
      email: s(set.email, d.visit.email),
      hours: s(set.opening_hours, d.visit.hours),
      mapsUrl: s(set.google_maps_url, d.visit.mapsUrl),
    },
    footer: {
      brandName: s(footer.brandName, d.footer.brandName),
      description: s(footer.description, d.footer.description),
      explore: arr<FooterLink>(footer.explore, d.footer.explore),
      instagram: s(socials.instagram, d.footer.instagram),
      facebook: s(socials.facebook, d.footer.facebook),
      email: s(set.email, d.footer.email),
      copyright: s(footer.copyright, d.footer.copyright),
    },
    menuPage: {
      heroLabel: s(menuPage.heroLabel, d.menuPage.heroLabel),
      heroTitle: s(menuPage.heroTitle, d.menuPage.heroTitle),
      heroTagline: s(menuPage.heroTagline, d.menuPage.heroTagline),
      mobileLabel: s(menuPage.mobileLabel, d.menuPage.mobileLabel),
      mobileHeading: s(menuPage.mobileHeading, d.menuPage.mobileHeading),
      thankyou: s(menuPage.thankyou, d.menuPage.thankyou),
      footerNote: s(menuPage.footerNote, d.menuPage.footerNote),
    },
    galleryPage: {
      heroLabel: s(galleryPage.heroLabel, d.galleryPage.heroLabel),
      heroTitle: s(galleryPage.heroTitle, d.galleryPage.heroTitle),
      heroTagline: s(galleryPage.heroTagline, d.galleryPage.heroTagline),
      sectionLabel: s(galleryPage.sectionLabel, d.galleryPage.sectionLabel),
      sectionHeading: s(galleryPage.sectionHeading, d.galleryPage.sectionHeading),
    },
  };
}

/** The full menu, grouped by category and themed. Falls back to MENU_DEFAULT. */
export async function getMenu(): Promise<MenuCategory[]> {
  try {
    const sb = await createClient();
    const [cats, items] = await Promise.all([
      sb.from("categories").select("*").order("sort_order"),
      sb
        .from("menu_items")
        .select("*")
        .eq("availability", true)
        .order("sort_order"),
    ]);
    const catRows = (cats.data as Row[]) ?? [];
    const itemRows = (items.data as Row[]) ?? [];
    if (!catRows.length) return MENU_DEFAULT;

    const out: MenuCategory[] = catRows.map((c) => {
      const slug = String(c.slug ?? "");
      const theme = CATEGORY_THEME[slug] ?? NEUTRAL_THEME;
      const mine = itemRows.filter((it) => it.category_id === c.id);
      const items: MenuItem[] = mine.map((it) => {
        const rawTag =
          typeof it.tag === "string" ? it.tag.toLowerCase() : "";
        const tag = TAG_META[rawTag] ? rawTag : it.is_veg ? "veg" : undefined;
        return {
          name: String(it.name ?? ""),
          price: priceText(it.price),
          tag,
          img: typeof it.image_url === "string" && it.image_url ? it.image_url : undefined,
        };
      });
      return {
        key: slug || String(c.id),
        title: String(c.name ?? theme.chip),
        chip: theme.chip,
        badge: theme.badge,
        emoji: theme.emoji,
        bg: theme.bg,
        card: theme.card,
        disc: theme.disc,
        items,
      };
    });
    // keep only categories that actually have items
    const filled = out.filter((c) => c.items.length);
    return filled.length ? filled : MENU_DEFAULT;
  } catch {
    return MENU_DEFAULT;
  }
}

/** Chef's-Specials dishes (menu_items.is_chef_special). Falls back to defaults. */
export async function getChefSpecials(): Promise<SpecialDish[]> {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("menu_items")
      .select("name,description,price,image_url")
      .eq("is_chef_special", true)
      .eq("availability", true)
      .order("sort_order");
    const rows = (data as Row[]) ?? [];
    if (!rows.length) return DEFAULT_SPECIAL_DISHES;
    return rows.map((r) => ({
      title: String(r.name ?? ""),
      desc: typeof r.description === "string" ? r.description : "",
      price: priceText(r.price),
      img: typeof r.image_url === "string" && r.image_url ? r.image_url : "",
    }));
  } catch {
    return DEFAULT_SPECIAL_DISHES;
  }
}
