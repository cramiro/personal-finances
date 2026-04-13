-- ============================================================
-- GASTLY - Migration v2: dual-currency amounts + daily rates
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add dual-currency columns to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount_ars numeric;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount_usd numeric;

-- Table to cache one blue rate per calendar day
CREATE TABLE IF NOT EXISTS daily_rates (
  date       date PRIMARY KEY,
  blue_sell  numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_rates DISABLE ROW LEVEL SECURITY;
