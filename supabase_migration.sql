-- SQL Migration: Fix Missing Tables and RLS
-- Run this in the Supabase SQL Editor

-- 1. Create Competitors Table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  competitor_channel_id TEXT NOT NULL,
  competitor_name TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Video Ideas Table (if missing)
CREATE TABLE IF NOT EXISTS video_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  suggested_title TEXT NOT NULL,
  suggested_description TEXT,
  recommended_tags TEXT[],
  estimated_views INTEGER,
  confidence_score FLOAT,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- 3. Create Optimizations Table (if missing)
CREATE TABLE IF NOT EXISTS optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  original_title TEXT NOT NULL,
  optimized_title TEXT NOT NULL,
  original_description TEXT,
  optimized_description TEXT,
  suggested_tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimizations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- policy for competitors
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own competitors') THEN
        CREATE POLICY "Users can manage own competitors" ON competitors
        FOR ALL USING (channel_id IN (
            SELECT id FROM channels WHERE user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        ));
    END IF;
END $$;

-- policy for ideas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own video ideas') THEN
        CREATE POLICY "Users can read own video ideas" ON video_ideas
        FOR SELECT USING (channel_id IN (
            SELECT id FROM channels WHERE user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        ));
    END IF;
END $$;

-- policy for optimizations
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own optimizations') THEN
        CREATE POLICY "Users can manage own optimizations" ON optimizations
        FOR ALL USING (user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        ));
    END IF;
END $$;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_competitors_channel_id ON competitors(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_ideas_channel_id ON video_ideas(channel_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_user_id ON optimizations(user_id);
