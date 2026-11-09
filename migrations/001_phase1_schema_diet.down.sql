-- ============================================================================
-- MIGRATION: 001_phase1_schema_diet.down.sql
-- PURPOSE: Rollback Phase 1 Schema Diet (100% reversible)
-- ============================================================================

SET search_path TO public, neon_auth;

-- 1. Revert properties types
ALTER TABLE properties ALTER COLUMN bedrooms TYPE INTEGER;
ALTER TABLE properties ALTER COLUMN bathrooms TYPE INTEGER;
ALTER TABLE properties ALTER COLUMN reviews TYPE INTEGER;
ALTER TABLE properties ALTER COLUMN display_order TYPE INTEGER;
ALTER TABLE properties ALTER COLUMN strength_score TYPE INTEGER;
ALTER TABLE properties ALTER COLUMN price_numeric TYPE NUMERIC(10,2);
ALTER TABLE properties DROP COLUMN IF EXISTS lat;
ALTER TABLE properties DROP COLUMN IF EXISTS lng;
ALTER TABLE properties DROP COLUMN IF EXISTS amenity_ids;

-- Revert amenities lookup
DROP TABLE IF EXISTS amenities_lookup;

-- 2. Revert vip_share_tokens
ALTER TABLE vip_share_tokens ALTER COLUMN max_views TYPE INTEGER;
ALTER TABLE vip_share_tokens ALTER COLUMN view_count TYPE INTEGER;
DROP INDEX IF EXISTS idx_vip_tokens_hash;
ALTER TABLE vip_share_tokens DROP COLUMN IF EXISTS token_hash;
CREATE INDEX IF NOT EXISTS idx_vip_tokens_lookup ON vip_share_tokens(token, property_id);

-- 3. Revert image_seo_records
DROP INDEX IF EXISTS idx_image_seo_url_hash;
ALTER TABLE image_seo_records DROP COLUMN IF EXISTS url_hash;
ALTER TABLE image_seo_records DROP COLUMN IF EXISTS score;

-- 4. Revert vip_tour_bookings
ALTER TABLE vip_tour_bookings DROP COLUMN IF EXISTS status_code;
DROP TABLE IF EXISTS vip_tour_bookings_archive;
