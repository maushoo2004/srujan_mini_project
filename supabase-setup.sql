-- Supabase SQL Setup for CyberShield MVP
-- Run this in your Supabase SQL Editor

-- =====================================================
-- USERS TABLE (Custom user profile/metadata)
-- =====================================================
-- Note: Supabase automatically creates auth.users for authentication
-- This table is for additional user profile information if needed
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile automatically when someone signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_risk_level ON activity_logs(risk_level);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can view own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs;

-- Create policy so users can only see their own logs
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy so users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- VIEWS FOR STATISTICS
-- =====================================================
-- Optional: Create a view for activity statistics
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
  user_id,
  COUNT(*) as total_scans,
  COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_risk_count,
  COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk_count,
  MAX(timestamp) as last_scan
FROM activity_logs
GROUP BY user_id;

-- =====================================================
-- ENABLE EMAIL/PASSWORD AUTHENTICATION
-- =====================================================
-- Go to: Authentication > Providers > Email
-- Make sure "Enable Email provider" is turned ON
-- Confirm users can sign up (default is enabled)

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Your database is now ready with:
-- 1. auth.users (Supabase built-in for authentication)
-- 2. users (custom profile table with automatic creation)
-- 3. activity_logs (for URL scanning history)
-- 4. All security policies (RLS) configured
-- 5. Automatic triggers for user creation
