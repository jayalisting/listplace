-- ============================================================================
-- MIGRATION: 003_phase3_query_efficiency.up.sql
-- PURPOSE: Phase 3 Query and Index Efficiency (Covering Partial Indexes)
-- ============================================================================

SET search_path TO public, neon_auth;

-- 1. Covering Partial Index for Public Listing Grids and Category Portals
-- Serves Homepage & /residential, /commercial, /industrial, /agriculture as an Index-Only Scan
CREATE INDEX IF NOT EXISTS idx_properties_public_category_cover 
ON properties (category, featured_home DESC, display_order ASC, id DESC)
INCLUDE (title, price, price_numeric, location, city, images, bedrooms, bathrooms, area, status, listing_type, rating, reviews, is_new, is_exclusive, is_trophy, lat, lng)
WHERE (visibility IS NULL OR visibility != 'private');

-- 2. Covering Partial Index for Sitemaps
-- Enables sitemap.xml to read id + updated_at with zero heap reads
CREATE INDEX IF NOT EXISTS idx_properties_sitemap
ON properties (updated_at DESC)
INCLUDE (id, created_at)
WHERE (visibility IS NULL OR visibility = 'public' OR visibility = 'published');

-- 3. Cleanup unused redundant indexes
DROP INDEX IF EXISTS idx_vip_tokens_lookup;

