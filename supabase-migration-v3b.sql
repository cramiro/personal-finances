-- Migration v3b: allow members to update their own last_seen fields

CREATE POLICY "members_update_own" ON members
  FOR UPDATE USING (
    workspace_id = ANY(my_workspace_ids())
  );
