-- ============================================================
--  seed_content.sql
--  Pre-populates the CMS with the site's CURRENT copy so the admin starts
--  fully populated and editing it changes the live site. Safe to run once after
--  0001_site_content.sql. Singletons + menu items are guarded so re-running
--  will not duplicate rows. (The public site already falls back to these exact
--  values in code, so seeding is about giving the owner something to edit.)
-- ============================================================

-- ---------- settings (singleton: contact + brand + socials) ----------
insert into public.settings
  (restaurant_name, phone, whatsapp, email, address, opening_hours, google_maps_url, social_links_json)
select
  'Veycho Restaurant & Cafe',
  '+91 9292619419',
  '919292619419',
  'veychorestocafe@gmail.com',
  'Veycho Restaurant & Cafe, Near MCF School Road, Gudalai, Mandayapuram, Kalpetta, Kerala 673121',
  'Every Day · 11:00 AM — 10:00 PM',
  'https://maps.app.goo.gl/AYfwpdk2M83zC9aN7',
  '{"instagram":"","facebook":""}'::jsonb
where not exists (select 1 from public.settings);

-- ---------- story (singleton: home Story paragraph + Journey chapters) ----------
insert into public.story (title, subtitle, content, timeline_json)
select
  'Our Story',
  'Turn the pages of our story.',
  $x$We’re cooking the Wayanadan flavors you crave the way they were always meant to be — local ingredients, hand-pounded spices, and recipes carried forward by generations.$x$,
  $j$[
    {"year":"2020","title":"Founded","body":"In 2020, Jamsheed K.V opened the doors of Veycho in Kalpetta, driven by a deep love for the authentic flavors of Wayanad. What began as a single warm room and a handful of family recipes set out to share the comfort of Wayanadan home cooking with everyone who walked in."},
    {"year":"2022","title":"The Signatures","body":"Two years in, three dishes came to define the Veycho table — Pothumkaal, Vaariyellu and Paalkappa Beef. Slow-cooked with hand-pounded spices and quiet patience, they joined the menu as house signatures, and quickly became the plates guests came back for again and again."},
    {"year":"2024","title":"Resto-Cafe","body":"Veycho grew into a full resto-cafe, opening a modern wing where continental favourites sit comfortably beside heritage Wayanadan cooking. Slow-brewed coffee, hearty burgers and charcoal grills joined the menu — a place for both a quick bite and a long, unhurried evening."},
    {"year":"2026","title":"Wayanad's Table","body":"Today, Veycho stands as one of Kalpetta's most loved family dining destinations. Generous portions, genuine hospitality and the unmistakable taste of Wayanad keep the room full — turning first-time visitors into regulars who feel right at home."}
  ]$j$::jsonb
where not exists (select 1 from public.story);

-- ---------- site_content (one row per marketing block) ----------
insert into public.site_content (section, data) values
  ('hero', $j${
    "label":"WAYANAD · KERALA · SINCE 2020",
    "title":"Veycho",
    "tagline":"Bolder, fresher & more Wayanadan than ever.",
    "badgeText":"VEYCHO • RESTO-CAFE • WAYANAD • EST 2020 • ",
    "videoUrl":"/video-pothkal.mp4",
    "posterUrl":"/food-poster.svg"
  }$j$::jsonb),
  ('promo', $j${"message":"✦ Authentic Wayanadan flavors ✦ Resto-Cafe since 2020 ✦ Kalpetta, Kerala ✦ Walk-ins welcome 11am–10pm "}$j$::jsonb),
  ('nav', $j${"menuLabel":"SEE MENU","galleryLabel":"GALLERY","visitLabel":"VISIT"}$j$::jsonb),
  ('story_extra', $j${
    "ctaLabel":"READ OUR STORY",
    "journeyLabel":"THE JOURNEY · 2020 — 2026",
    "journeySubtitle":"Turn the pages of our story.",
    "journeyHintDesktop":"Four chapters, fanned like a hand of cards. Tap any page to open it and read the story.",
    "journeyHintMobile":"Four chapters of the Veycho story. Swipe to turn the pages."
  }$j$::jsonb),
  ('chef_specials', $j${
    "label":"CHEF’S SELECTION",
    "heading":"Tonight’s composed menu",
    "description":"Curated weekly by our head chef — each plate built around a single ingredient brought to its fullest expression.",
    "ctaHeading":"See the\nfull menu",
    "ctaDesc":"36 dishes across starters, mains, desserts & drinks."
  }$j$::jsonb),
  ('reviews', $j${"heading":"Happy guests.","ratingBadge":"Rated 4.1 ★ on Google · 200+ reviews"}$j$::jsonb),
  ('visit', $j${
    "heading":"An evening,\ncomposed\nfor you.",
    "ctaParagraph":"Walk-ins are always welcome. Call or message us for directions, opening hours, or any questions.",
    "mapBadge":"📍 Kalpetta, Wayanad"
  }$j$::jsonb),
  ('footer', $j${
    "brandName":"Veycho Restaurant & Cafe",
    "description":"“Authentic Flavors, Unforgettable Memories.” Resto-Cafe · Est. 2020 · Kalpetta, Kerala.",
    "explore":[
      {"label":"Journey","target":"#journey"},
      {"label":"Signatures","target":"#vc-menupin"},
      {"label":"Menu","target":"/menu"},
      {"label":"Gallery","target":"/gallery"}
    ],
    "copyright":"© 2026 Veycho Restaurant & Cafe Wayanad · Crafted with care in Kalpetta, Kerala"
  }$j$::jsonb),
  ('menu_page', $j${
    "heroLabel":"VEYCHO · WAYANAD · SINCE 2020",
    "heroTitle":"The Menu",
    "heroTagline":"Continental flavours, exceptional experiences.",
    "mobileLabel":"EAT · DRINK · STAY A WHILE",
    "mobileHeading":"Everything we plate",
    "thankyou":"Thank you for dining with us — we hope to serve you again soon.",
    "footerNote":"Veycho Resto-Cafe · Kalpetta, Wayanad · 11 AM — 10 PM"
  }$j$::jsonb),
  ('gallery_page', $j${
    "heroLabel":"VEYCHO · WAYANAD · SINCE 2020",
    "heroTitle":"The Gallery",
    "heroTagline":"Every plate, pour & good time — in pictures.",
    "sectionLabel":"MOMENTS · MEMORIES · MEALS",
    "sectionHeading":"Life at Veycho"
  }$j$::jsonb)
on conflict (section) do nothing;

-- ---------- categories (8) ----------
insert into public.categories (name, slug, sort_order) values
  ('Soup', 'soup', 1),
  ('Salads', 'salads', 2),
  ('Starters', 'starters', 3),
  ('Main Course', 'mains', 4),
  ('Burger', 'burger', 5),
  ('Pasta', 'pasta', 6),
  ('Sandwich', 'sandwich', 7),
  ('Drinks Special', 'drinks', 8)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- ---------- menu items (regular menu) — only if the table is empty ----------
insert into public.menu_items (name, price, category_id, tag, is_veg, sort_order)
select v.name, v.price, c.id, nullif(v.tag,''), v.is_veg, v.ord
from (values
  ('Cream of Chicken', 180, 'soup', 'chicken', false, 1),
  ('Cream of Mushroom', 160, 'soup', 'veg', true, 2),
  ('Cream of Broccoli', 160, 'soup', 'veg', true, 3),
  ('Ceasar Salad', 220, 'salads', '', false, 1),
  ('Honey Mustard Salad', 210, 'salads', '', false, 2),
  ('Hawaiian Salad', 230, 'salads', '', false, 3),
  ('Loaded Fries Chicken', 230, 'starters', 'chicken', false, 1),
  ('Loaded Fries Chicken 2.0', 270, 'starters', 'chicken', false, 2),
  ('Loaded Fries Beef', 250, 'starters', 'beef', false, 3),
  ('Loaded Fries Beef 2.0', 290, 'starters', 'beef', false, 4),
  ('Loaded Fries Veg', 230, 'starters', 'veg', true, 5),
  ('BBQ Wings', 210, 'starters', 'chicken', false, 6),
  ('Ghost Pepper Wings', 240, 'starters', 'chicken', false, 7),
  ('Thai Chicken Wings', 230, 'starters', 'chicken', false, 8),
  ('Chicken Fingers', 140, 'starters', 'chicken', false, 9),
  ('Chicken Pop Corn', 140, 'starters', 'chicken', false, 10),
  ('Garlic Bread', 140, 'starters', 'veg', true, 11),
  ('French Fries', 100, 'starters', 'veg', true, 12),
  ('Thai Grilled Chicken Steak', 340, 'mains', 'chicken', false, 1),
  ('Panroasted Chicken with Herb Garlic Sauce', 310, 'mains', 'chicken', false, 2),
  ('Lemon Grilled Chicken with Mushroom Sauce', 300, 'mains', 'chicken', false, 3),
  ('Rosemary Chicken Steak', 300, 'mains', 'chicken', false, 4),
  ('Grilled Vegetables', 200, 'mains', 'veg', true, 5),
  ('White Bull Burger', 280, 'burger', 'beef', false, 1),
  ('Rockstar Beef Burger', 320, 'burger', 'beef', false, 2),
  ('Texas Burger', 250, 'burger', 'beef', false, 3),
  ('Juicy Lucy Burger', 300, 'burger', 'beef', false, 4),
  ('The Hawaiian Beef Burger', 280, 'burger', 'beef', false, 5),
  ('Veycho Beef Burger', 160, 'burger', 'beef', false, 6),
  ('Fire World Burger', 220, 'burger', 'chicken', false, 7),
  ('Rockstar Chicken Burger', 300, 'burger', 'chicken', false, 8),
  ('Chicken Steak House Burger', 260, 'burger', 'chicken', false, 9),
  ('Trouble Chicken Burger', 280, 'burger', 'chicken', false, 10),
  ('Cheesy Chicken Burger', 190, 'burger', 'chicken', false, 11),
  ('Zinger Burger', 170, 'burger', 'chicken', false, 12),
  ('Crispy Chicken Burger', 180, 'burger', 'chicken', false, 13),
  ('Veycho Chicken Burger', 150, 'burger', 'chicken', false, 14),
  ('Egg Cheese Burger', 160, 'burger', 'egg', false, 15),
  ('Madras Veggie Burger', 150, 'burger', 'veg', true, 16),
  ('Veycho Veg Burger', 130, 'burger', 'veg', true, 17),
  ('Arabiata Chicken Pasta', 230, 'pasta', 'chicken', false, 1),
  ('Arabiata Veg Pasta', 200, 'pasta', 'veg', true, 2),
  ('Al-De-Funghi Chicken Pasta', 250, 'pasta', 'chicken', false, 3),
  ('Alfredo Veg Pasta', 210, 'pasta', 'veg', true, 4),
  ('Penne Rose Chicken Pasta', 260, 'pasta', 'chicken', false, 5),
  ('Penne Rose Veg Pasta', 230, 'pasta', 'veg', true, 6),
  ('Veycho Club Chicken Sandwich', 260, 'sandwich', 'chicken', false, 1),
  ('Veycho Club Veg Sandwich', 220, 'sandwich', 'veg', true, 2),
  ('Zinger Club Chicken Sandwich', 240, 'sandwich', 'chicken', false, 3),
  ('Egg Cheese Sandwich', 150, 'sandwich', 'egg', false, 4),
  ('Chicken Loaf Sandwich', 170, 'sandwich', 'chicken', false, 5),
  ('Veg Loaf Sandwich', 130, 'sandwich', 'veg', true, 6),
  ('Fresh Lime', 25, 'drinks', '', true, 1),
  ('Mint Lime', 40, 'drinks', '', true, 2),
  ('Fresh Lime Soda', 40, 'drinks', '', true, 3),
  ('Blue Lagoon Mojito', 120, 'drinks', '', true, 4),
  ('Passion Fruit Mojito', 110, 'drinks', '', true, 5),
  ('Green Apple Mojito', 110, 'drinks', '', true, 6),
  ('Mint Mojito', 110, 'drinks', '', true, 7),
  ('Watermelon Mojito', 110, 'drinks', '', true, 8)
) as v(name, price, slug, tag, is_veg, ord)
join public.categories c on c.slug = v.slug
where not exists (select 1 from public.menu_items);

-- ---------- chef's specials (heritage cards) — only if none flagged yet ----------
insert into public.menu_items (name, description, price, tag, is_veg, is_chef_special, sort_order)
select v.name, v.descr, v.price, nullif(v.tag,''), false, true, v.ord
from (values
  ('Wayanadan Pothumkaal', 'Slow-braised heritage beef shank, hand-pounded spices, curry-leaf finish.', 530, 'beef', 1),
  ('Vaariyellu Beef Ribs', 'Wood-fired ribs marinated overnight in coconut, pepper & indigenous masala.', 560, 'beef', 2),
  ('Paalkappa Beef', 'Tender tapioca simmered in coconut milk with peppery slow-cooked beef.', 420, 'beef', 3),
  ('Thengachore', 'Heirloom Wayanadan coconut-rice with fragrant ghee and roasted spices.', 280, 'veg', 4),
  ('White Bull Burger (Signature)', 'House-ground beef patty, smoked cheese, brioche bun and hand-cut fries.', 340, 'beef', 5)
) as v(name, descr, price, tag, ord)
where not exists (select 1 from public.menu_items where is_chef_special);
