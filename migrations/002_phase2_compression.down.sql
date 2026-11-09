-- ============================================================================
-- MIGRATION: 002_phase2_compression.down.sql
-- PURPOSE: Rollback Phase 2 Compression Layers (100% reversible)
-- ============================================================================

SET search_path TO public, neon_auth;

-- Revert column compression to default (pglz)
ALTER TABLE properties ALTER COLUMN details SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN seller SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN description SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN landmarks SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN attributes SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN custom_faqs SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN facilities SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN documents SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN highlights SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN amenities SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN tags SET COMPRESSION default;
ALTER TABLE properties ALTER COLUMN images SET COMPRESSION default;

ALTER TABLE image_seo_records ALTER COLUMN seo_data SET COMPRESSION default;
ALTER TABLE image_seo_settings ALTER COLUMN settings SET COMPRESSION default;
ALTER TABLE vip_tour_bookings_archive ALTER COLUMN notes SET COMPRESSION default;

-- Revert toast_tuple_target to default (2048)
ALTER TABLE properties RESET (toast_tuple_target);
ALTER TABLE image_seo_records RESET (toast_tuple_target);
ALTER TABLE vip_tour_bookings_archive RESET (toast_tuple_target);

-- Drop cold storage columns
ALTER TABLE image_seo_records DROP COLUMN IF EXISTS cold_payload;
ALTER TABLE vip_tour_bookings_archive DROP COLUMN IF EXISTS notes_compressed;
