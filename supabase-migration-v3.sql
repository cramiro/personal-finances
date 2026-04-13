-- Migration v3: last connection tracking for members

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS last_seen_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_device   TEXT,
  ADD COLUMN IF NOT EXISTS last_location TEXT;
