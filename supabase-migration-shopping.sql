-- Feature flag en workspace
ALTER TABLE workspaces ADD COLUMN show_shopping_list boolean NOT NULL DEFAULT false;

-- Tabla de ítems de lista de compras
CREATE TABLE shopping_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by    uuid REFERENCES members(id) NOT NULL,
  completed_by  uuid REFERENCES members(id),
  name          text NOT NULL,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_select" ON shopping_items FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM members WHERE user_id = auth.uid()));
