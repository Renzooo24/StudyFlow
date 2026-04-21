-- ── ai_generations table ──────────────────────────────────────────────────────
-- Tracks AI flashcard generation usage for free-plan rate limiting.
-- Free users are limited to 3 generations per calendar month.

CREATE TABLE IF NOT EXISTS ai_generations (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  type            TEXT         NOT NULL CHECK (type IN ('flashcards', 'coach')),
  cards_generated INTEGER      NOT NULL DEFAULT 0
);

-- Fast monthly lookup per user (used in the free-limit check)
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_month
  ON ai_generations (user_id, created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generation history (e.g. for a usage counter in the UI)
CREATE POLICY "Users can read own ai_generations"
  ON ai_generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts are performed exclusively by the Edge Function via the service-role key,
-- which bypasses RLS — no INSERT policy is needed for authenticated users.
