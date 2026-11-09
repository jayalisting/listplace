-- Phase 7: Retention, Housekeeping & Cost Controls Migration (UP)
-- Additive and reversible

-- 1. Create compressed historical archive for VIP tour bookings
CREATE TABLE IF NOT EXISTS vip_tour_bookings_archive (
  id INT PRIMARY KEY,
  property_id VARCHAR(50) NOT NULL,
  property_title VARCHAR(255),
  property_price VARCHAR(50),
  property_location VARCHAR(255),
  tour_type VARCHAR(50),
  tour_date VARCHAR(50),
  tour_time VARCHAR(50),
  client_name VARCHAR(255),
  client_phone VARCHAR(50),
  client_email VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  notes_compressed BYTEA,
  created_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Apply LZ4 native compression to text and bytea columns in archive table
ALTER TABLE vip_tour_bookings_archive ALTER COLUMN notes SET COMPRESSION lz4;
ALTER TABLE vip_tour_bookings_archive ALTER COLUMN notes_compressed SET COMPRESSION lz4;

-- 3. Set toast_tuple_target to 512 for aggressive compression
ALTER TABLE vip_tour_bookings_archive SET (toast_tuple_target = 512);

-- 4. Create indexes for chronological archive lookups and property joins
CREATE INDEX IF NOT EXISTS idx_vip_bookings_archive_archived ON vip_tour_bookings_archive(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_bookings_archive_property ON vip_tour_bookings_archive(property_id);

-- 5. Index for fast identification and cleanup of expired/revoked VIP tokens
CREATE INDEX IF NOT EXISTS idx_vip_tokens_retention 
ON vip_share_tokens(status, view_count, max_views, last_viewed_at, created_at);
