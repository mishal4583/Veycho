-- ============================================================
--  0001_site_content.sql
--  Adds the flexible `site_content` table that backs the one-off marketing
--  blocks (hero, promo, footer, etc.), and removes the unused `reservations`
--  table. Run this in the Supabase SQL editor.
--
--  Also (one-time, in the dashboard → Storage): create a PUBLIC bucket named
--  `site-media` for the hero video/poster and any section images.
-- ============================================================

-- ---- flexible per-section content (section -> JSONB blob) ----
create table if not exists public.site_content (
  section     text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public site reads content; only staff may write. Mirrors the other content
-- tables (uses the existing public.is_staff(uuid) helper).
drop policy if exists "site_content public read" on public.site_content;
create policy "site_content public read"
  on public.site_content for select
  using (true);

drop policy if exists "site_content staff write" on public.site_content;
create policy "site_content staff write"
  on public.site_content for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- keep updated_at fresh
create or replace function public.touch_site_content()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before update on public.site_content
  for each row execute function public.touch_site_content();

-- ---- cleanup: remove the unused reservations table (dead part of old CMS) ----
drop table if exists public.reservations cascade;
drop type if exists public.reservation_status;
