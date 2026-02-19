-- Super-Admin Portal Migration
-- Run this in the Supabase SQL Editor

-- Add is_super_admin column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Set jared@vectorux.com as the initial super admin
UPDATE user_profiles SET is_super_admin = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'jared@vectorux.com' LIMIT 1);
