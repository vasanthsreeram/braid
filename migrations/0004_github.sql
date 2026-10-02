-- Provider access is separate from WorkOS identity/session cookies.
-- Tokens are encrypted with origin and WorkOS-user binding before persistence.
CREATE TABLE IF NOT EXISTS github_accounts (
  user TEXT PRIMARY KEY,
  github_id TEXT NOT NULL,
  login TEXT NOT NULL,
  sealed TEXT,
  updated INTEGER NOT NULL
);
