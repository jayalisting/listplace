-- ============================================================================
-- MIGRATION: 002_phase2_compression.up.sql
-- PURPOSE: Phase 2 Compression Layers (Native LZ4 + Lower TOAST target + Cold Storage)
-- ============================================================================

SET search_path TO public, neon_auth;

-- Layer A: Native Postgres LZ4 Compression on large JSONB and TEXT columns
ALTER TABLE properties ALTER COLUMN details SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN seller SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN description SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN landmarks SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN attributes SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN custom_faqs SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN facilities SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN documents SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN highlights SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN amenities SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN tags SET COMPRESSION lz4;
ALTER TABLE properties ALTER COLUMN images SET COMPRESSION lz4;

ALTER TABLE image_seo_records ALTER COLUMN seo_data SET COMPRESSION lz4;
ALTER TABLE image_seo_settings ALTER COLUMN settings SET COMPRESSION lz4;
ALTER TABLE vip_tour_bookings_archive ALTER COLUMN notes SET COMPRESSION lz4;

-- Lower toast_tuple_target to 512 bytes on tables with mid-size JSONB so rows compress earlier
ALTER TABLE properties SET (toast_tuple_target = 512);
ALTER TABLE image_seo_records SET (toast_tuple_target = 512);
ALTER TABLE vip_tour_bookings_archive SET (toast_tuple_target = 512);

-- Layer B: Compact BYTEA columns for cold compressed payloads
ALTER TABLE image_seo_records ADD COLUMN IF NOT EXISTS cold_payload BYTEA;
ALTER TABLE vip_tour_bookings_archive ADD COLUMN IF NOT EXISTS notes_compressed BYTEA;
