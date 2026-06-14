CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_expenses_title_trgm ON expenses USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_expenses_notes_trgm ON expenses USING GIN (COALESCE(notes, '') gin_trgm_ops);
