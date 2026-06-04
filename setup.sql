-- Run this once in your Neon SQL editor to set up the database
-- Go to: console.neon.tech → your project → SQL Editor

CREATE TABLE IF NOT EXISTS snapshots (
  id        SERIAL PRIMARY KEY,
  ts        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  player_count  INT NOT NULL DEFAULT 0,
  max_players   INT NOT NULL DEFAULT 32,
  players_json  JSONB NOT NULL DEFAULT '[]'
);

-- Index for fast time-range queries
CREATE INDEX IF NOT EXISTS snapshots_ts_idx ON snapshots (ts DESC);

-- Optional: auto-delete rows older than 30 days to keep DB small
-- You can run this manually or set up a pg_cron job in Neon
-- DELETE FROM snapshots WHERE ts < NOW() - INTERVAL '30 days';
