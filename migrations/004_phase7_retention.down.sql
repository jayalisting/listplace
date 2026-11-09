-- Phase 7: Retention, Housekeeping & Cost Controls Migration (DOWN)
-- Reverts Phase 7 changes safely

DROP INDEX IF EXISTS idx_vip_tokens_retention;
DROP TABLE IF EXISTS vip_tour_bookings_archive CASCADE;

