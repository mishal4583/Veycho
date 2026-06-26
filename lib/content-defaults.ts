// ============================================================
//  Site content defaults
//  Every piece of editable copy + media on the public site, as typed default
//  objects. This is the SINGLE SOURCE for two things:
//    1. the runtime fallback when the DB row is empty / Supabase is unreachable
//    2. the values seeded into Supabase (see supabase/seed_content.sql)
//  Keeping it here means the site renders identically with an empty database.
//  Pure data only — safe to import from both server helpers and client components.
// ============================================================

export type NavContent = {
  menuLabel: string;
  galleryLabel: string;
  visitLabel: string;
  exploreLabel: string;
  phone: string;
  hours: string;
  instagram: string;
};

export type ExploreSectionContent = {
  eyebrow: string;
  heading: string;
  description: string;
};

export type ExplorePageContent = {
  heroImageUrl: string;
  heroTitle: string;
  heroDescription: string;
};

export type PromoContent = { message: string };

export type HeroContent = {
  label: string;
  title: string;
  tagline: string;
  badgeText: string;
  videoUrl: string;
  posterUrl: string;
};

export type StoryContent = { paragraph: string; ctaLabel: string };

export type JourneyChapter = { year: string; title: string; body: string };
export type JourneyContent = {
  label: string;
  subtitle: string;
  hintDesktop: string;
  hintMobile: string;
  chapters: JourneyChapter[];
};

export type SpecialDish = {
  title: string;
  desc: string;
  price: string;
  img: string;
};
export type ChefSpecialsContent = {
  label: string;
  heading: string;
  description: string;
  ctaHeading: string;
  ctaDesc: string;
};

export type ReviewsContent = { heading: string; ratingBadge: string };

export type VisitContent = {
  heading: string;
  ctaParagraph: string;
  mapBadge: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  mapsUrl: string;
};

export type FooterLink = { label: string; target: string }; // "#id" | "/route"
export type FooterContent = {
  brandName: string;
  description: string;
  explore: FooterLink[];
  instagram: string;
  facebook: string;
  email: string;
  copyright: string;
};

export type MenuPageContent = {
  heroLabel: string;
  heroTitle: string;
  heroTagline: string;
  mobileLabel: string;
  mobileHeading: string;
  thankyou: string;
  footerNote: string;
};

export type GalleryPageContent = {
  heroLabel: string;
  heroTitle: string;
  heroTagline: string;
  sectionLabel: string;
  sectionHeading: string;
};

export type SiteContent = {
  promo: PromoContent;
  nav: NavContent;
  hero: HeroContent;
  story: StoryContent;
  journey: JourneyContent;
  chefSpecials: ChefSpecialsContent;
  reviews: ReviewsContent;
  visit: VisitContent;
  footer: FooterContent;
  menuPage: MenuPageContent;
  galleryPage: GalleryPageContent;
  exploreSection: ExploreSectionContent;
  explorePage: ExplorePageContent;
};

// ---- menu types (shared by MenuExplorer + content helper + seed) ----
export type MenuItem = {
  name: string;
  price: string;
  tag?: string;
  img?: string;
  description?: string;
  is_veg?: boolean;
  spice_level?: number;
  ingredients?: string;
  is_popular?: boolean;
  is_chef_special?: boolean;
};
export type MenuCategory = {
  key: string; // category slug
  title: string;
  chip: string; // short filter-chip label
  badge: string; // fallback badge for untagged items
  emoji: string;
  bg: string; // mobile list-card background
  card: string; // desktop oval-card background
  disc: string; // desktop image-disc background
  note?: string;
  items: MenuItem[];
};

// ============================================================
//  DEFAULT COPY
// ============================================================

export const DEFAULT_CONTENT: SiteContent = {
  promo: {
    message:
      "✦ Authentic Wayanadan flavours ✦ Resto-Cafe since 2020 ✦ Kalpetta, Kerala ✦ Walk-ins welcome 11am–10pm ",
  },
  nav: {
    menuLabel: "SEE MENU",
    galleryLabel: "GALLERY",
    visitLabel: "VISIT",
    exploreLabel: "Explore",
    phone: "+91 9292619419",
    hours: "Open daily · 11 AM – 10 PM",
    instagram: "",
  },
  hero: {
    label: "WAYANAD · KERALA · SINCE 2020",
    title: "Veycho",
    tagline: "Bolder, fresher & more Wayanadan than ever.",
    badgeText: "VEYCHO • RESTO-CAFE • WAYANAD • EST 2020 • ",
    videoUrl: "/video-pothkal.mp4",
    posterUrl: "/food-poster.svg",
  },
  story: {
    paragraph:
      "We’re cooking the Wayanadan flavours you crave the way they were always meant to be — local ingredients, hand-pounded spices, and recipes carried forward by generations.",
    ctaLabel: "READ OUR STORY",
  },
  journey: {
    label: "THE JOURNEY · 2020 — 2026",
    subtitle: "Turn the pages of our story.",
    hintDesktop:
      "Four chapters, fanned like a hand of cards. Tap any page to open it and read the story.",
    hintMobile: "Four chapters of the Veycho story. Swipe to turn the pages.",
    chapters: [
      {
        year: "2020",
        title: "Founded",
        body: "In 2020, Jamsheed K.V opened the doors of Veycho in Kalpetta, driven by a deep love for the authentic flavours of Wayanad. What began as a single warm room and a handful of family recipes set out to share the comfort of Wayanadan home cooking with everyone who walked in.",
      },
      {
        year: "2022",
        title: "The Signatures",
        body: "Two years in, three dishes came to define the Veycho table — Pothumkaal, Vaariyellu and Paalkappa Beef. Slow-cooked with hand-pounded spices and quiet patience, they joined the menu as house signatures, and quickly became the plates guests came back for again and again.",
      },
      {
        year: "2024",
        title: "Resto-Cafe",
        body: "Veycho grew into a full resto-cafe, opening a modern wing where continental favourites sit comfortably beside heritage Wayanadan cooking. Slow-brewed coffee, hearty burgers and charcoal grills joined the menu — a place for both a quick bite and a long, unhurried evening.",
      },
      {
        year: "2026",
        title: "Wayanad's Table",
        body: "Today, Veycho stands as one of Kalpetta's most loved family dining destinations. Generous portions, genuine hospitality and the unmistakable taste of Wayanad keep the room full — turning first-time visitors into regulars who feel right at home.",
      },
    ],
  },
  chefSpecials: {
    label: "CHEF’S SELECTION",
    heading: "Tonight’s composed menu",
    description:
      "Curated weekly by our head chef — each plate built around a single ingredient brought to its fullest expression.",
    ctaHeading: "See the\nfull menu",
    ctaDesc: "36 dishes across starters, mains, desserts & drinks.",
  },
  reviews: {
    heading: "Happy guests.",
    ratingBadge: "Rated 4.1 ★ on Google · 200+ reviews",
  },
  visit: {
    heading: "An evening,\ncomposed\nfor you.",
    ctaParagraph:
      "Walk-ins are always welcome. Call or message us for directions, opening hours, or any questions.",
    mapBadge: "📍 Kalpetta, Wayanad",
    address:
      "Veycho Restaurant & Cafe, Near MCF School Road, Gudalai, Mandayapuram, Kalpetta, Kerala 673121",
    phone: "+91 9292619419",
    whatsapp: "919292619419",
    email: "veychorestocafe@gmail.com",
    hours: "Every Day · 11:00 AM — 10:00 PM",
    mapsUrl: "https://maps.app.goo.gl/AYfwpdk2M83zC9aN7",
  },
  footer: {
    brandName: "Veycho Restaurant & Cafe",
    description:
      "“Authentic Flavours, Unforgettable Memories.” Resto-Cafe · Est. 2020 · Kalpetta, Kerala.",
    explore: [
      { label: "Journey", target: "#journey" },
      { label: "Signatures", target: "#vc-menupin" },
      { label: "Menu", target: "/menu" },
      { label: "Gallery", target: "/gallery" },
      { label: "Explore Wayanad", target: "/explore" },
    ],
    instagram: "",
    facebook: "",
    email: "veychorestocafe@gmail.com",
    copyright:
      "© 2026 Veycho Restaurant & Cafe Wayanad · Crafted with care in Kalpetta, Kerala",
  },
  menuPage: {
    heroLabel: "VEYCHO · WAYANAD · SINCE 2020",
    heroTitle: "The Menu",
    heroTagline: "Continental flavours, exceptional experiences.",
    mobileLabel: "EAT · DRINK · STAY A WHILE",
    mobileHeading: "Everything we plate",
    thankyou: "Thank you for dining with us — we hope to serve you again soon.",
    footerNote: "Veycho Resto-Cafe · Kalpetta, Wayanad · 11 AM — 10 PM",
  },
  galleryPage: {
    heroLabel: "VEYCHO · WAYANAD · SINCE 2020",
    heroTitle: "The Gallery",
    heroTagline: "Every plate, pour & good time — in pictures.",
    sectionLabel: "MOMENTS · MEMORIES · MEALS",
    sectionHeading: "Life at Veycho",
  },
  exploreSection: {
    eyebrow: "Beyond the Table",
    heading: "Explore Wayanad",
    description: "Make your visit unforgettable. Discover the beauty waiting just beyond your dining table.",
  },
  explorePage: {
    heroImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    heroTitle: "Explore\nWayanad",
    heroDescription: "From misty mountains and thundering waterfalls to wildlife sanctuaries and ancient heritage sites — discover the best experiences around Veycho.",
  },
};

// Chef's-Specials dishes — the curated cards. Live data comes from menu_items
// where is_chef_special = true; this is the fallback + seed source.
export const DEFAULT_SPECIAL_DISHES: SpecialDish[] = [
  {
    title: "Wayanadan Pothumkaal",
    desc: "Slow-braised heritage beef shank, hand-pounded spices, curry-leaf finish.",
    price: "₹530",
    img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Vaariyellu Beef Ribs",
    desc: "Wood-fired ribs marinated overnight in coconut, pepper & indigenous masala.",
    price: "₹560",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Paalkappa Beef",
    desc: "Tender tapioca simmered in coconut milk with peppery slow-cooked beef.",
    price: "₹420",
    img: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Thengachore",
    desc: "Heirloom Wayanadan coconut-rice with fragrant ghee and roasted spices.",
    price: "₹280",
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "White Bull Burger",
    desc: "House-ground beef patty, smoked cheese, brioche bun and hand-cut fries.",
    price: "₹340",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&auto=format&fit=crop",
  },
];

// Per-category presentation theme, keyed by category slug. The categories table
// stores no colour/emoji, so this stays in code; getMenu() merges it with the
// DB rows. New categories without a slug here fall back to NEUTRAL_THEME.
export type CategoryTheme = {
  chip: string;
  badge: string;
  emoji: string;
  bg: string;
  card: string;
  disc: string;
};

export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  soup: { chip: "Soup", badge: "Soup", emoji: "🍲", bg: "#c9d6c3", card: "#c9d6c3", disc: "#b6c8af" },
  salads: { chip: "Salads", badge: "Salad", emoji: "🥗", bg: "#bcd9a6", card: "#cdd8c4", disc: "#bcc9b1" },
  starters: { chip: "Starters", badge: "Starter", emoji: "🍟", bg: "#f6dd9b", card: "#f6dd9b", disc: "#ecca6f" },
  mains: { chip: "Mains", badge: "Main", emoji: "🍽️", bg: "#e9c7a6", card: "#e9c7a6", disc: "#dcb892" },
  burger: { chip: "Burger", badge: "Burger", emoji: "🍔", bg: "#ecc3ad", card: "#ecc3ad", disc: "#e0ad94" },
  pasta: { chip: "Pasta", badge: "Pasta", emoji: "🍝", bg: "#f4a3c1", card: "#f3e7cf", disc: "#e6d6b5" },
  sandwich: { chip: "Sandwich", badge: "Sandwich", emoji: "🥪", bg: "#8ecae6", card: "#b9d0c9", disc: "#a6c2b9" },
  drinks: { chip: "Drinks", badge: "Drink", emoji: "🍹", bg: "#edb63f", card: "#e7cfa0", disc: "#d8bd86" },
};

export const NEUTRAL_THEME: CategoryTheme = {
  chip: "More",
  badge: "Dish",
  emoji: "🍽️",
  bg: "#dfe7d8",
  card: "#e7ddc8",
  disc: "#d8ccb3",
};

// Full menu — fallback + seed source. Order here defines display + chip order.
export const MENU_DEFAULT: MenuCategory[] = [
  {
    key: "soup",
    title: "Soup",
    ...CATEGORY_THEME.soup,
    items: [
      { name: "Cream of Chicken", price: "₹180", tag: "chicken" },
      { name: "Cream of Mushroom", price: "₹160", tag: "veg" },
      { name: "Cream of Broccoli", price: "₹160", tag: "veg" },
    ],
  },
  {
    key: "salads",
    title: "Salads",
    ...CATEGORY_THEME.salads,
    note: "Chicken / Veg",
    items: [
      { name: "Ceasar Salad", price: "₹220 / ₹180" },
      { name: "Honey Mustard Salad", price: "₹210 / ₹170" },
      { name: "Hawaiian Salad", price: "₹230 / ₹190" },
    ],
  },
  {
    key: "starters",
    title: "Starters",
    ...CATEGORY_THEME.starters,
    items: [
      { name: "Loaded Fries Chicken", price: "₹230", tag: "chicken" },
      { name: "Loaded Fries Chicken 2.0", price: "₹270", tag: "chicken" },
      { name: "Loaded Fries Beef", price: "₹250", tag: "beef" },
      { name: "Loaded Fries Beef 2.0", price: "₹290", tag: "beef" },
      { name: "Loaded Fries Veg", price: "₹230", tag: "veg" },
      { name: "BBQ Wings", price: "₹210", tag: "chicken" },
      { name: "Ghost Pepper Wings", price: "₹240", tag: "chicken" },
      { name: "Thai Chicken Wings", price: "₹230", tag: "chicken" },
      { name: "Chicken Fingers", price: "₹140", tag: "chicken" },
      { name: "Chicken Pop Corn", price: "₹140", tag: "chicken" },
      { name: "Garlic Bread", price: "₹140", tag: "veg" },
      { name: "French Fries", price: "₹100", tag: "veg" },
    ],
  },
  {
    key: "mains",
    title: "Main Course",
    ...CATEGORY_THEME.mains,
    items: [
      { name: "Thai Grilled Chicken Steak", price: "₹340", tag: "chicken" },
      { name: "Panroasted Chicken with Herb Garlic Sauce", price: "₹310", tag: "chicken" },
      { name: "Lemon Grilled Chicken with Mushroom Sauce", price: "₹300", tag: "chicken" },
      { name: "Rosemary Chicken Steak", price: "₹300", tag: "chicken" },
      { name: "Grilled Vegetables", price: "₹200", tag: "veg" },
    ],
  },
  {
    key: "burger",
    title: "Burger",
    ...CATEGORY_THEME.burger,
    items: [
      { name: "White Bull Burger", price: "₹280", tag: "beef" },
      { name: "Rockstar Beef Burger", price: "₹320", tag: "beef" },
      { name: "Texas Burger", price: "₹250", tag: "beef" },
      { name: "Juicy Lucy Burger", price: "₹300", tag: "beef" },
      { name: "The Hawaiian Beef Burger", price: "₹280", tag: "beef" },
      { name: "Veycho Beef Burger", price: "₹160", tag: "beef" },
      { name: "Fire World Burger", price: "₹220", tag: "chicken" },
      { name: "Rockstar Chicken Burger", price: "₹300", tag: "chicken" },
      { name: "Chicken Steak House Burger", price: "₹260", tag: "chicken" },
      { name: "Trouble Chicken Burger", price: "₹280", tag: "chicken" },
      { name: "Cheesy Chicken Burger", price: "₹190", tag: "chicken" },
      { name: "Zinger Burger", price: "₹170", tag: "chicken" },
      { name: "Crispy Chicken Burger", price: "₹180", tag: "chicken" },
      { name: "Veycho Chicken Burger", price: "₹150", tag: "chicken" },
      { name: "Egg Cheese Burger", price: "₹160", tag: "egg" },
      { name: "Madras Veggie Burger", price: "₹150", tag: "veg" },
      { name: "Veycho Veg Burger", price: "₹130", tag: "veg" },
    ],
  },
  {
    key: "pasta",
    title: "Pasta",
    ...CATEGORY_THEME.pasta,
    items: [
      { name: "Arabiata Chicken Pasta", price: "₹230", tag: "chicken" },
      { name: "Arabiata Veg Pasta", price: "₹200", tag: "veg" },
      { name: "Al-De-Funghi Chicken Pasta", price: "₹250", tag: "chicken" },
      { name: "Alfredo Veg Pasta", price: "₹210", tag: "veg" },
      { name: "Penne Rose Chicken Pasta", price: "₹260", tag: "chicken" },
      { name: "Penne Rose Veg Pasta", price: "₹230", tag: "veg" },
    ],
  },
  {
    key: "sandwich",
    title: "Sandwich",
    ...CATEGORY_THEME.sandwich,
    items: [
      { name: "Veycho Club Chicken Sandwich", price: "₹260", tag: "chicken" },
      { name: "Veycho Club Veg Sandwich", price: "₹220", tag: "veg" },
      { name: "Zinger Club Chicken Sandwich", price: "₹240", tag: "chicken" },
      { name: "Egg Cheese Sandwich", price: "₹150", tag: "egg" },
      { name: "Chicken Loaf Sandwich", price: "₹170", tag: "chicken" },
      { name: "Veg Loaf Sandwich", price: "₹130", tag: "veg" },
    ],
  },
  {
    key: "drinks",
    title: "Drinks Special",
    ...CATEGORY_THEME.drinks,
    items: [
      { name: "Fresh Lime", price: "₹25" },
      { name: "Mint Lime", price: "₹40" },
      { name: "Fresh Lime Soda", price: "₹40" },
      { name: "Blue Lagoon Mojito", price: "₹120" },
      { name: "Passion Fruit Mojito", price: "₹110" },
      { name: "Green Apple Mojito", price: "₹110" },
      { name: "Mint Mojito", price: "₹110" },
      { name: "Watermelon Mojito", price: "₹110" },
    ],
  },
];

export const TAG_META: Record<string, { label: string; color: string }> = {
  beef: { label: "Beef", color: "#8a3b2a" },
  chicken: { label: "Chicken", color: "#a4662b" },
  veg: { label: "Veg", color: "#2f7d4f" },
  egg: { label: "Egg", color: "#b98a1f" },
};
