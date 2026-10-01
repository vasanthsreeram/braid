CREATE TABLE invites (id TEXT PRIMARY KEY, repo TEXT NOT NULL REFERENCES repos(id), email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('reader','contributor','writer','admin')), issuer TEXT NOT NULL, expires INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','accepted','revoked')), accepted_by TEXT);
CREATE TABLE native_tokens (id TEXT PRIMARY KEY, repo TEXT NOT NULL REFERENCES repos(id), user TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE merges (repo TEXT PRIMARY KEY REFERENCES repos(id), proposal TEXT NOT NULL, base TEXT NOT NULL, candidate TEXT NOT NULL, ref TEXT NOT NULL, fence TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('publishing','merged','failed')), error TEXT);
CREATE TABLE revoked_sessions (id TEXT PRIMARY KEY, created INTEGER NOT NULL);
CREATE TRIGGER accept_invite AFTER UPDATE OF state ON invites WHEN OLD.state='pending' AND NEW.state='accepted' BEGIN
  INSERT INTO grants(repo,user,role) VALUES(NEW.repo,NEW.accepted_by,NEW.role) ON CONFLICT(repo,user) DO UPDATE SET role=excluded.role;
END;
