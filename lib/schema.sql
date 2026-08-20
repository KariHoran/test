-- Bloggers table
CREATE TABLE IF NOT EXISTS bloggers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  instagram_username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'blogger' CHECK (role IN ('blogger', 'admin')),
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reels table
CREATE TABLE IF NOT EXISTS reels (
  id SERIAL PRIMARY KEY,
  blogger_id INTEGER NOT NULL REFERENCES bloggers(id) ON DELETE CASCADE,
  instagram_url TEXT NOT NULL,
  cover_url TEXT,
  views INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'updating', 'error')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_reels_blogger_id ON reels(blogger_id);
CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status);
