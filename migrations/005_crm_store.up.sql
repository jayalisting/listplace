-- Phase 8 / CRM Integration Migration (UP)
-- High performance, low-RAM, low-compute unified CRM store

CREATE TABLE IF NOT EXISTS crm_store (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{"people":[],"props":[],"tasks":[],"files":[],"trash":[],"settings":{}}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Aggressive compression and fast TOAST threshold (LZ4)
ALTER TABLE crm_store ALTER COLUMN data SET COMPRESSION lz4;
ALTER TABLE crm_store SET (toast_tuple_target = 512);

-- Index for update timestamps
CREATE INDEX IF NOT EXISTS idx_crm_store_updated ON crm_store(updated_at DESC);

