-- Execute este SQL no Supabase SQL Editor
-- Dashboard > SQL Editor > New query

-- Criar tabela principal
CREATE TABLE IF NOT EXISTS user_movies (
  id BIGSERIAL PRIMARY KEY,
  movie_id INTEGER NOT NULL UNIQUE,
  movie_title TEXT NOT NULL,
  poster_path TEXT,
  release_date TEXT,
  vote_average DECIMAL(4,2) DEFAULT 0,
  runtime INTEGER DEFAULT NULL,
  status TEXT NOT NULL CHECK (status IN ('watched', 'not_watched', 'want_to_watch')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_movies_movie_id ON user_movies(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON user_movies(status);

-- Permitir acesso público (sem autenticação por ora)
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON user_movies
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Se a tabela já existia, adicione a coluna runtime:
-- ALTER TABLE user_movies ADD COLUMN IF NOT EXISTS runtime INTEGER DEFAULT NULL;
