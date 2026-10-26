-- Migration 000: Base schema (users, channels, videos)
-- Run FIRST on a new Supabase project, before the other migration files.
--
-- These core tables were originally created by hand in the Supabase dashboard and
-- were never captured in the repo. This file reconstructs them from how the app
-- reads and writes them. Every statement is IF NOT EXISTS, so running it against a
-- database that already has these tables changes nothing.

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id       TEXT NOT NULL UNIQUE,
  email               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channels (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  youtube_channel_id  TEXT NOT NULL UNIQUE,      -- upsert onConflict target
  channel_name        TEXT NOT NULL,
  channel_url         TEXT,
  niche               TEXT,
  subscriber_count    BIGINT DEFAULT 0,
  total_views         BIGINT DEFAULT 0,
  total_videos        INTEGER DEFAULT 0,
  thumbnail_url       TEXT,
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);

CREATE TABLE IF NOT EXISTS videos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  youtube_video_id    TEXT NOT NULL UNIQUE,      -- upsert onConflict target
  title               TEXT NOT NULL,
  description         TEXT,
  published_at        TIMESTAMPTZ NOT NULL,
  view_count          BIGINT DEFAULT 0,
  like_count          BIGINT DEFAULT 0,
  comment_count       BIGINT DEFAULT 0,
  duration            INTEGER DEFAULT 0,         -- seconds
  tags                TEXT[],
  thumbnail_url       TEXT,
  fetched_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_channel_published ON videos(channel_id, published_at DESC);

-- The app only touches these through the service-role key on the server.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
