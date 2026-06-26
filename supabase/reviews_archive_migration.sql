-- Add archived column to reviews table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Index for the public query (approved=true, archived=false, rating>=4)
CREATE INDEX IF NOT EXISTS reviews_public_idx ON reviews (approved, archived, rating, created_at DESC)
  WHERE approved = true AND archived = false;
