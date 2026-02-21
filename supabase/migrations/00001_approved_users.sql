-- Table: only these emails can use the admin app.
-- Add rows via Supabase Dashboard → Table Editor, or run:
--   INSERT INTO approved_users (email) VALUES ('admin@example.com');
CREATE TABLE IF NOT EXISTS approved_users (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- RLS: each user can only check if their own email is in the list (read-only).
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can check own approval"
  ON approved_users
  FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Only you (or a service role) should add/remove approved users.
-- Option A: run INSERT/UPDATE/DELETE from Dashboard SQL Editor as project owner.
-- Option B: add a policy that allows a specific admin role (e.g. service_role only).
-- For now, use Dashboard or SQL Editor to manage rows.

COMMENT ON TABLE approved_users IS 'Emails allowed to log in to the auction admin app. Manage via Dashboard → Table Editor or SQL.';
