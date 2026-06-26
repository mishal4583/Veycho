-- ============================================================
--  Destination Reviews
--  Run once in: Supabase Dashboard → SQL Editor → New query
--  Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================

create table if not exists public.destination_reviews (
  id             uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  author_name    text not null,
  rating         integer not null check (rating between 1 and 5),
  body           text not null,
  visit_type     text check (visit_type in ('solo', 'couple', 'family', 'group')),
  visit_month    text,
  created_at     timestamptz not null default now()
);

create index if not exists dest_reviews_dest_idx
  on public.destination_reviews(destination_id, created_at desc);

alter table public.destination_reviews enable row level security;

-- Anyone can read reviews
drop policy if exists "Public read destination_reviews" on public.destination_reviews;
create policy "Public read destination_reviews"
  on public.destination_reviews for select using (true);

-- Anyone (anon) can submit a review
drop policy if exists "Public insert destination_reviews" on public.destination_reviews;
create policy "Public insert destination_reviews"
  on public.destination_reviews for insert with check (true);

-- Only staff can delete (for spam moderation via Supabase dashboard)
drop policy if exists "Staff delete destination_reviews" on public.destination_reviews;
create policy "Staff delete destination_reviews"
  on public.destination_reviews for delete
  using (public.is_staff(auth.uid()));
