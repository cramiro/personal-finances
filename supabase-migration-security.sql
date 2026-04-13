-- ============================================================
-- SECURITY MIGRATION: puntos 2, 3 y 4 del plan de acción
-- Ejecutar en Supabase SQL Editor de una sola vez
-- ============================================================


-- ----------------------------------------------------------------
-- PUNTO 2: members INSERT — solo el owner puede agregar miembros
-- (o el primer insert de un workspace nuevo, para el setup inicial)
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "members_insert" ON members;

CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (
    -- Caso A: el usuario autenticado ya es owner de ese workspace
    workspace_id IN (
      SELECT workspace_id FROM members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR
    -- Caso B: no existe ningún miembro todavía (setup inicial del workspace)
    NOT EXISTS (
      SELECT 1 FROM members m2 WHERE m2.workspace_id = workspace_id
    )
  );


-- ----------------------------------------------------------------
-- PUNTO 3: workspaces INSERT — máximo 1 workspace por usuario
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;

CREATE POLICY "workspaces_insert" ON workspaces
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM members WHERE user_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------
-- PUNTO 4: daily_rates — habilitar RLS + políticas de acceso
-- ----------------------------------------------------------------
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rates_select" ON daily_rates;
DROP POLICY IF EXISTS "rates_insert" ON daily_rates;
DROP POLICY IF EXISTS "rates_update" ON daily_rates;

CREATE POLICY "rates_select" ON daily_rates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rates_insert" ON daily_rates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rates_update" ON daily_rates
  FOR UPDATE USING (auth.uid() IS NOT NULL);
