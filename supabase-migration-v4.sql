-- Migration v4: secure invite token system

-- 1. Tabla invites
CREATE TABLE invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  used_at      timestamptz,
  used_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_invites_token ON invites(token);

-- 2. RLS en invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer por token (para validar al unirse)
CREATE POLICY "invites_select" ON invites
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo el owner del workspace puede crear invitaciones
CREATE POLICY "invites_insert" ON invites
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Cualquier usuario autenticado puede marcar el token como usado
CREATE POLICY "invites_update" ON invites
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 3. Reemplazar policy members_insert para incluir token válido como caso C
DROP POLICY IF EXISTS "members_insert" ON members;

CREATE POLICY "members_insert" ON members
  FOR INSERT WITH CHECK (
    -- A: el usuario ya es owner de ese workspace
    workspace_id IN (
      SELECT workspace_id FROM members WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR
    -- B: primer miembro del workspace (setup inicial)
    NOT EXISTS (SELECT 1 FROM members m2 WHERE m2.workspace_id = workspace_id)
    OR
    -- C: existe un invite válido, no usado y no expirado para ese workspace
    EXISTS (
      SELECT 1 FROM invites i
      WHERE i.workspace_id = workspace_id
        AND i.used_at IS NULL
        AND i.expires_at > now()
    )
  );
