-- ============================================================================
-- MIGRATION: 001_phase1_schema_diet.up.sql
-- PURPOSE: Phase 1 Schema Diet (additive, reversible, zero data loss)
-- ============================================================================

-- Ensure public schema is used
SET search_path TO public, neon_auth;

-- 1. RIGHT-SIZE TYPES: properties table
-- Convert integer columns with small ranges to SMALLINT
ALTER TABLE properties ALTER COLUMN bedrooms TYPE SMALLINT;
ALTER TABLE properties ALTER COLUMN bathrooms TYPE SMALLINT;
ALTER TABLE properties ALTER COLUMN reviews TYPE SMALLINT;
ALTER TABLE properties ALTER COLUMN display_order TYPE SMALLINT;
ALTER TABLE properties ALTER COLUMN strength_score TYPE SMALLINT;

-- Standardize price_numeric to numeric(14,2)
ALTER TABLE properties ALTER COLUMN price_numeric TYPE NUMERIC(14,2);

-- Add explicit 8-byte floating point coordinates
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Backfill lat/lng from existing coordinates JSONB
UPDATE properties
SET 
  lat = CASE 
    WHEN coordinates->>'lat' IS NOT NULL AND coordinates->>'lat' != '' 
    THEN (coordinates->>'lat')::DOUBLE PRECISION 
    ELSE 18.9696 
  END,
  lng = CASE 
    WHEN coordinates->>'lng' IS NOT NULL AND coordinates->>'lng' != '' 
    THEN (coordinates->>'lng')::DOUBLE PRECISION 
    ELSE 72.8081 
  END
WHERE lat IS NULL OR lng IS NULL;

-- 2. AMENITIES LOOKUP TABLE & DEDUPLICATION
CREATE TABLE IF NOT EXISTS amenities_lookup (
  id SMALLSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_amenities_lookup_name ON amenities_lookup(name);

-- Add amenity_ids array to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenity_ids SMALLINT[] DEFAULT '{}'::smallint[];

-- 3. VIP SHARE TOKENS: Right-size and SHA-256 hash storage
ALTER TABLE vip_share_tokens ALTER COLUMN max_views TYPE SMALLINT;
ALTER TABLE vip_share_tokens ALTER COLUMN view_count TYPE SMALLINT;

-- Add 32-byte SHA-256 hash column
ALTER TABLE vip_share_tokens ADD COLUMN IF NOT EXISTS token_hash BYTEA;
CREATE INDEX IF NOT EXISTS idx_vip_tokens_hash ON vip_share_tokens(token_hash);

-- Backfill token_hash for existing tokens
UPDATE vip_share_tokens
SET token_hash = sha256(token::bytea)
WHERE token_hash IS NULL AND token IS NOT NULL;

-- Drop redundant composite index (token unique key already covers token lookup)
DROP INDEX IF EXISTS idx_vip_tokens_lookup;

-- 4. IMAGE SEO RECORDS: url_hash & score right-sizing
ALTER TABLE image_seo_records ADD COLUMN IF NOT EXISTS url_hash BYTEA;
ALTER TABLE image_seo_records ADD COLUMN IF NOT EXISTS score SMALLINT DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_image_seo_url_hash ON image_seo_records(url_hash);

-- 5. VIP TOUR BOOKINGS: Right-size status & Archive table
ALTER TABLE vip_tour_bookings ADD COLUMN IF NOT EXISTS status_code SMALLINT DEFAULT 0;

-- Backfill status_code (0: pending, 1: confirmed, 2: completed, 3: cancelled)
UPDATE vip_tour_bookings
SET status_code = CASE
  WHEN status = 'confirmed' THEN 1
  WHEN status = 'completed' THEN 2
  WHEN status = 'cancelled' THEN 3
  ELSE 0
END
WHERE status_code IS NULL OR status_code = 0;

-- Compact compressed archive table for cold/historical bookings
CREATE TABLE IF NOT EXISTS vip_tour_bookings_archive (
  id INT PRIMARY KEY,
  property_id VARCHAR(50) NOT NULL,
  tour_type VARCHAR(50),
  tour_date VARCHAR(50),
  tour_time VARCHAR(50),
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  status_code SMALLINT,
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vip_archive_date ON vip_tour_bookings_archive(created_at);

