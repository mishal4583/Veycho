-- ============================================================
--  Explore Wayanad — DB + Storage migration
--  Run once in: Supabase Dashboard → SQL Editor → New query
--  Safe to re-run (all statements use IF NOT EXISTS / ON CONFLICT).
-- ============================================================

-- ── 1. Tables ─────────────────────────────────────────────

create table if not exists public.destination_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text not null default '📍',
  sort_order  integer not null default 0,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.destinations (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  short_description text not null default '',
  description       text,
  category_id       uuid references public.destination_categories(id) on delete set null,
  featured_image    text,
  google_maps_url   text,
  latitude          double precision,
  longitude         double precision,
  distance_km       integer,
  travel_time       text,
  entry_fee         text,
  best_time         text,
  best_season       text,
  opening_hours     text,
  difficulty_level  text,
  family_friendly   boolean not null default true,
  parking_available boolean not null default true,
  featured          boolean not null default false,
  google_rating     double precision,
  seo_title         text,
  seo_description   text,
  status            text not null default 'draft'
                      check (status in ('published', 'draft')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.destination_images (
  id             uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  image_url      text not null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ── 1b. Add columns added after initial migration (safe if already exist) ──

alter table public.destinations
  add column if not exists amenities text[] not null default '{}';

alter table public.destinations
  add column if not exists travel_tips jsonb not null default '[]';

-- ── 2. Indexes ────────────────────────────────────────────

create index if not exists destinations_status_idx   on public.destinations(status);
create index if not exists destinations_featured_idx  on public.destinations(featured);
create index if not exists destinations_slug_idx      on public.destinations(slug);
create index if not exists dest_images_dest_idx       on public.destination_images(destination_id);

-- ── 3. updated_at trigger ─────────────────────────────────

create or replace function public.update_destinations_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists destinations_updated_at on public.destinations;
create trigger destinations_updated_at
  before update on public.destinations
  for each row execute function public.update_destinations_updated_at();

-- ── 4. Row Level Security ─────────────────────────────────

alter table public.destination_categories enable row level security;
alter table public.destinations           enable row level security;
alter table public.destination_images     enable row level security;

-- destination_categories
drop policy if exists "Public read destination_categories"   on public.destination_categories;
drop policy if exists "Staff manage destination_categories"  on public.destination_categories;

create policy "Public read destination_categories"
  on public.destination_categories for select
  using (enabled = true);

create policy "Staff manage destination_categories"
  on public.destination_categories for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- destinations
drop policy if exists "Public read published destinations" on public.destinations;
drop policy if exists "Staff manage destinations"          on public.destinations;

create policy "Public read published destinations"
  on public.destinations for select
  using (status = 'published');

create policy "Staff manage destinations"
  on public.destinations for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- destination_images
drop policy if exists "Public read destination_images" on public.destination_images;
drop policy if exists "Staff manage destination_images" on public.destination_images;

create policy "Public read destination_images"
  on public.destination_images for select
  using (true);

create policy "Staff manage destination_images"
  on public.destination_images for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- ── 5. Storage bucket ─────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'explore-images',
  'explore-images',
  true,
  10485760,
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Storage object policies (drop + recreate for idempotency)
drop policy if exists "explore-images public read"   on storage.objects;
drop policy if exists "explore-images staff upload"  on storage.objects;
drop policy if exists "explore-images staff update"  on storage.objects;
drop policy if exists "explore-images staff delete"  on storage.objects;

create policy "explore-images public read"
  on storage.objects for select
  using (bucket_id = 'explore-images');

create policy "explore-images staff upload"
  on storage.objects for insert
  with check (bucket_id = 'explore-images' and public.is_staff(auth.uid()));

create policy "explore-images staff update"
  on storage.objects for update
  using (bucket_id = 'explore-images' and public.is_staff(auth.uid()));

create policy "explore-images staff delete"
  on storage.objects for delete
  using (bucket_id = 'explore-images' and public.is_staff(auth.uid()));

-- ── 6. Seed default categories ────────────────────────────

insert into public.destination_categories (name, slug, icon, sort_order) values
  ('Waterfalls',   'waterfalls',   '💧', 1),
  ('Viewpoints',   'viewpoints',   '🏔', 2),
  ('Adventure',    'adventure',    '🧗', 3),
  ('Wildlife',     'wildlife',     '🦁', 4),
  ('Heritage',     'heritage',     '🏛', 5),
  ('Lakes',        'lakes',        '🌊', 6),
  ('Hidden Gems',  'hidden-gems',  '✨', 7)
on conflict (slug) do nothing;
