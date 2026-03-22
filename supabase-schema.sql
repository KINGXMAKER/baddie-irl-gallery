-- =============================================
-- BADDIE IRL GALLERY — Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  cover_image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  uploader_name TEXT,
  instagram_handle TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_photos_event_id ON photos(event_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX idx_photos_is_hidden ON photos(is_hidden);
CREATE INDEX idx_events_slug ON events(slug);

-- Insert the initial event
INSERT INTO events (name, slug, date, description)
VALUES (
  'Baddie IRL Content Day',
  'baddie-irl-content-day',
  CURRENT_DATE,
  'Drop your photos from tonight. Captured here. Shared forever.'
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Events: anyone can read
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

-- Photos: anyone can read all photos (hidden filtering done in app layer)
CREATE POLICY "Photos are readable"
  ON photos FOR SELECT
  USING (true);

-- Photos: anyone can insert (public upload)
CREATE POLICY "Anyone can upload photos"
  ON photos FOR INSERT
  WITH CHECK (true);

-- Photos: anyone can update (admin actions via passcode-protected API)
CREATE POLICY "Anyone can update photos"
  ON photos FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Photos: anyone can delete (admin actions via passcode-protected API)
CREATE POLICY "Anyone can delete photos"
  ON photos FOR DELETE
  USING (true);

-- =============================================
-- Storage Bucket
-- =============================================
-- Create this manually in Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Name: "event-photos"
-- 3. Public bucket: YES
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/heic
--
-- Then add these policies in Storage > Policies:
--
-- SELECT (read): Allow public read
--   USING (true)
--
-- INSERT (upload): Allow public upload
--   WITH CHECK (true)
--
-- DELETE: Allow authenticated delete (for admin)
--   USING (true)
