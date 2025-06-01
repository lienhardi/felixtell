-- Migration: Add image_name column to swipes table
ALTER TABLE public.swipes ADD COLUMN IF NOT EXISTS image_name text; 