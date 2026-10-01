CREATE TABLE repos (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, owner TEXT NOT NULL, name TEXT NOT NULL, physical TEXT UNIQUE NOT NULL, visibility TEXT NOT NULL CHECK(visibility IN ('private','public')), state TEXT NOT NULL CHECK(state IN ('creating','ready','failed')), parent TEXT);
CREATE INDEX repo_tenant ON repos(tenant);
CREATE TABLE grants (repo TEXT NOT NULL REFERENCES repos(id), user TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('reader','contributor','writer','admin')), PRIMARY KEY(repo,user));
CREATE TABLE tickets (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, repo TEXT NOT NULL, oid TEXT NOT NULL, size INTEGER NOT NULL, key TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE proposals (id TEXT PRIMARY KEY, repo TEXT NOT NULL REFERENCES repos(id), task TEXT NOT NULL REFERENCES repos(id), base TEXT NOT NULL, candidate TEXT NOT NULL, author TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','approved','rejected')));
