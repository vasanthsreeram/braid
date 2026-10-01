CREATE TABLE operations (repo TEXT PRIMARY KEY REFERENCES repos(id), kind TEXT NOT NULL CHECK(kind IN ('create','import','fork')), source TEXT, refs TEXT NOT NULL);
