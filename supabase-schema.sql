-- ============================================================
-- GASTLY - Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Workspaces
CREATE TABLE workspaces (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  pin_hash        text NOT NULL,
  default_currency text NOT NULL DEFAULT 'ARS',
  created_at      timestamptz DEFAULT now()
);

-- Members
CREATE TABLE members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name    text NOT NULL,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  created_at      timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  keywords        text[] NOT NULL DEFAULT '{}',
  icon            text NOT NULL DEFAULT '📦',
  color           text NOT NULL DEFAULT '#888780',
  is_default      boolean NOT NULL DEFAULT false,
  sort_order      integer NOT NULL DEFAULT 0
);

-- Expenses
CREATE TABLE expenses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  member_id       uuid REFERENCES members(id) ON DELETE SET NULL,
  amount          numeric NOT NULL,
  currency        text NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS','USD')),
  description     text NOT NULL DEFAULT '',
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  date            timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_expenses_workspace ON expenses(workspace_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_members_workspace ON members(workspace_id);
CREATE INDEX idx_categories_workspace ON categories(workspace_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Helper function: workspaces the current user belongs to
CREATE OR REPLACE FUNCTION my_workspace_ids()
RETURNS uuid[] LANGUAGE sql STABLE AS $$
  SELECT ARRAY(SELECT workspace_id FROM members WHERE user_id = auth.uid())
$$;

-- Workspaces: user can read/update workspaces they belong to
CREATE POLICY "Read own workspaces" ON workspaces FOR SELECT
  USING (id = ANY(my_workspace_ids()));
CREATE POLICY "Insert workspace" ON workspaces FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Update own workspace" ON workspaces FOR UPDATE
  USING (id = ANY(my_workspace_ids()));

-- Members: read/insert/delete within own workspaces
CREATE POLICY "Read workspace members" ON members FOR SELECT
  USING (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Insert member" ON members FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Delete workspace member" ON members FOR DELETE
  USING (workspace_id = ANY(my_workspace_ids()));

-- Categories: full CRUD within own workspaces
CREATE POLICY "Read categories" ON categories FOR SELECT
  USING (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Insert category" ON categories FOR INSERT
  WITH CHECK (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Update category" ON categories FOR UPDATE
  USING (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Delete category" ON categories FOR DELETE
  USING (workspace_id = ANY(my_workspace_ids()));

-- Expenses: full CRUD within own workspaces
CREATE POLICY "Read expenses" ON expenses FOR SELECT
  USING (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Insert expense" ON expenses FOR INSERT
  WITH CHECK (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Update expense" ON expenses FOR UPDATE
  USING (workspace_id = ANY(my_workspace_ids()));
CREATE POLICY "Delete expense" ON expenses FOR DELETE
  USING (workspace_id = ANY(my_workspace_ids()));
