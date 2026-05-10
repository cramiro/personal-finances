-- ============================================================
-- FIX: members RLS circular dependency
--
-- Problem: my_workspace_ids() queries the members table without
-- SECURITY DEFINER, triggering the same RLS policy recursively.
-- PostgreSQL breaks the loop by returning only the current user's
-- own row, so workspace members can't see each other.
--
-- Fix: recreate the function with SECURITY DEFINER so it bypasses
-- RLS when fetching workspace_ids, then all members of the same
-- workspace become visible to each other.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Recreate the helper function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION my_workspace_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT workspace_id FROM members WHERE user_id = auth.uid()
  )
$$;

-- 2. Recreate the members SELECT policy to use the fixed function
--    (policy likely already uses my_workspace_ids() — this ensures it's clean)
DROP POLICY IF EXISTS "members_select" ON members;

CREATE POLICY "members_select" ON members
  FOR SELECT
  USING (workspace_id = ANY(my_workspace_ids()));
