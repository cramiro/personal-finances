-- ─── Gastos Fijos (Recurring Expenses) ──────────────────────────────────────

-- 1. Feature flag en workspace
ALTER TABLE workspaces ADD COLUMN show_recurring boolean NOT NULL DEFAULT false;

-- 2. Templates de gastos fijos
CREATE TABLE recurring_templates (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,
  category_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order   int DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rt_select" ON recurring_templates FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "rt_insert" ON recurring_templates FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "rt_update" ON recurring_templates FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "rt_delete" ON recurring_templates FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));

-- 3. Overrides manuales (cuando el auto-match no detecta el gasto)
CREATE TABLE recurring_checks (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  template_id  uuid REFERENCES recurring_templates(id) ON DELETE CASCADE NOT NULL,
  year_month   text NOT NULL,  -- 'YYYY-MM'
  checked_by   uuid REFERENCES members(id) NOT NULL,
  checked_at   timestamptz DEFAULT now(),
  UNIQUE(template_id, year_month)
);

ALTER TABLE recurring_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rc_select" ON recurring_checks FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "rc_insert" ON recurring_checks FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "rc_delete" ON recurring_checks FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
