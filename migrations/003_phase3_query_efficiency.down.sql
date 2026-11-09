-- ============================================================================
-- MIGRATION: 003_phase3_query_efficiency.down.sql
-- PURPOSE: Rollback Phase 3 Query and Index Efficiency
-- ============================================================================

SET search_path TO public, neon_auth;

DROP INDEX IF EXISTS idx_properties_public_category_cover;
DROP INDEX IF EXISTS idx_properties_sitemap;
