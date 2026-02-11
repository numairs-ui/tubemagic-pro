-- Migration: Add Subscription and Notification columns to Users
-- Run this in Supabase SQL Editor

-- 1. Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;

-- 2. Update RLS if needed (usually users can already read/write their own row)
-- Ensuring users can update their own notification preferences
CREATE POLICY "Users can update own notification settings" ON users
FOR UPDATE USING (clerk_user_id = auth.uid()::text)
WITH CHECK (clerk_user_id = auth.uid()::text);
