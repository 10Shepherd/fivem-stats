-- Run this in your Neon SQL editor to migrate to multi-server support
-- STEP 1: Create servers registry table
CREATE TABLE IF NOT EXISTS servers (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(32) UNIQUE NOT NULL,   -- cfx code e.g. '3lamjz'
  name        VARCHAR(128) NOT NULL,
  tags        TEXT[] DEFAULT '{}',           -- e.g. ARRAY['whitelisted','nopixel']
  color       VARCHAR(16) DEFAULT '#3ddc84', -- accent color per server
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  active      BOOLEAN DEFAULT TRUE
);

-- STEP 2: Add server_code to snapshots (if not already there)
ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS server_code VARCHAR(32) DEFAULT '3lamjz';

-- STEP 3: Index for fast server+time queries
CREATE INDEX IF NOT EXISTS snapshots_server_ts_idx ON snapshots (server_code, ts DESC);
CREATE INDEX IF NOT EXISTS snapshots_ts_idx ON snapshots (ts DESC);

-- STEP 4: Seed your initial server
INSERT INTO servers (code, name, tags, color)
VALUES ('3lamjz', 'NoPixel Whitelisted', ARRAY['whitelisted','nopixel'], '#3ddc84')
ON CONFLICT (code) DO NOTHING;

-- STEP 5: Backfill existing snapshots with default server_code
UPDATE snapshots SET server_code = '3lamjz' WHERE server_code IS NULL;
