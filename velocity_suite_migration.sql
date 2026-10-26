-- Migration 003: TubeMagic Velocity suite
-- Run AFTER supabase_migration.sql and settings_migration.sql, in the Supabase SQL Editor.
--
-- Strictly additive and idempotent: creates new tables/functions and adds nullable
-- columns. No existing table, column, row, or policy is altered or dropped, so it is
-- safe to re-run and safe on a database that already holds user data.
--
-- All new tables have RLS enabled with NO policies: they are only reachable through
-- the service-role key on the server (API routes), never from the browser.

-- ---------------------------------------------------------------------------
-- 1. Generic response cache (YouTube Data API responses, AI revival packages)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key  TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. YouTube quota ledger (10,000 units/day, resets at midnight Pacific Time)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS youtube_quota_usage (
  usage_date DATE PRIMARY KEY,
  units_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE youtube_quota_usage ENABLE ROW LEVEL SECURITY;

-- Atomically reserve quota units. Returns FALSE (and reserves nothing) when the
-- reservation would push today's total past p_budget.
CREATE OR REPLACE FUNCTION try_consume_youtube_quota(p_units INTEGER, p_budget INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
  v_used  INTEGER;
BEGIN
  INSERT INTO youtube_quota_usage (usage_date, units_used)
  VALUES (v_today, 0)
  ON CONFLICT (usage_date) DO NOTHING;

  SELECT units_used INTO v_used FROM youtube_quota_usage WHERE usage_date = v_today FOR UPDATE;

  IF v_used + p_units > p_budget THEN
    RETURN FALSE;
  END IF;

  UPDATE youtube_quota_usage
  SET units_used = units_used + p_units, updated_at = NOW()
  WHERE usage_date = v_today;

  RETURN TRUE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Fixed-window rate limiter shared across serverless instances
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key   TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  hits         INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION consume_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row rate_limits%ROWTYPE;
BEGIN
  INSERT INTO rate_limits (bucket_key, window_start, hits)
  VALUES (p_key, NOW(), 0)
  ON CONFLICT (bucket_key) DO NOTHING;

  SELECT * INTO v_row FROM rate_limits WHERE bucket_key = p_key FOR UPDATE;

  IF v_row.window_start + make_interval(secs => p_window_seconds) <= NOW() THEN
    v_row.window_start := NOW();
    v_row.hits := 0;
  END IF;

  IF v_row.hits >= p_limit THEN
    UPDATE rate_limits SET window_start = v_row.window_start, hits = v_row.hits WHERE bucket_key = p_key;
    RETURN QUERY SELECT FALSE, 0, v_row.window_start + make_interval(secs => p_window_seconds);
    RETURN;
  END IF;

  UPDATE rate_limits SET window_start = v_row.window_start, hits = v_row.hits + 1 WHERE bucket_key = p_key;
  RETURN QUERY SELECT TRUE, p_limit - v_row.hits - 1, v_row.window_start + make_interval(secs => p_window_seconds);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. OpenAI token ledger (per-user and global daily token budgets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key          TEXT NOT NULL,          -- Clerk user id, or "ip:<hash>" for the public grader
  feature           TEXT NOT NULL,
  model             TEXT NOT NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage(user_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at DESC);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Total tokens since p_since. Pass NULL for p_user_key to get the global total.
CREATE OR REPLACE FUNCTION ai_tokens_used_since(p_user_key TEXT, p_since TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0)::BIGINT
  FROM ai_usage
  WHERE created_at >= p_since
    AND (p_user_key IS NULL OR user_key = p_user_key);
$$;

-- ---------------------------------------------------------------------------
-- 5. Vision CTR evaluations (doubles as the evaluation cache and user history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vision_evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key         TEXT NOT NULL,          -- sha256(image bytes | title | niche | detail)
  clerk_user_id     TEXT,                   -- NULL for anonymous public-grader runs
  source            TEXT NOT NULL CHECK (source IN ('public', 'dashboard')),
  title             TEXT NOT NULL,
  niche             TEXT,
  image_bytes       INTEGER,
  result            JSONB NOT NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vision_evaluations_cache_key ON vision_evaluations(cache_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vision_evaluations_user ON vision_evaluations(clerk_user_id, created_at DESC);
ALTER TABLE vision_evaluations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. Leads captured by the public Thumbnail CTR Grader
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grader_leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  evaluation_id UUID REFERENCES vision_evaluations(id) ON DELETE SET NULL,
  ip_hash       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grader_leads_email ON grader_leads(lower(email));
ALTER TABLE grader_leads ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 7. Video stats history (powers decay detection for the Revival workflow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_stats_snapshots (
  id               BIGSERIAL PRIMARY KEY,
  youtube_video_id TEXT NOT NULL,
  view_count       BIGINT NOT NULL,
  like_count       BIGINT,
  comment_count    BIGINT,
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_video_stats_snapshots_video ON video_stats_snapshots(youtube_video_id, captured_at DESC);
ALTER TABLE video_stats_snapshots ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. Stripe webhook idempotency + richer subscription state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_events (
  id           TEXT PRIMARY KEY,            -- Stripe event id (evt_...)
  type         TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 9. Housekeeping: call periodically (e.g. Supabase cron) to trim expired rows
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_expired_velocity_data()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM api_cache WHERE expires_at < NOW();
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 days';
  DELETE FROM youtube_quota_usage WHERE usage_date < CURRENT_DATE - 90;
$$;

-- Only the service role may call these helpers.
REVOKE ALL ON FUNCTION try_consume_youtube_quota(INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ai_tokens_used_since(TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION purge_expired_velocity_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION try_consume_youtube_quota(INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION ai_tokens_used_since(TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION purge_expired_velocity_data() TO service_role;
