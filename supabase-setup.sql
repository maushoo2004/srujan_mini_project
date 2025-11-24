-- =====================================================
-- CYBERSHIELD MVP - COMPLETE DATABASE SETUP
-- =====================================================
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this ENTIRE script
-- 4. Click "Run" to execute
-- =====================================================

-- Clean up existing objects (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop tables if they exist (this will cascade drop policies)
DROP TABLE IF EXISTS public.reported_numbers CASCADE;
DROP TABLE IF EXISTS public.sms_messages CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================
-- USERS TABLE (Custom user profile/metadata)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone_number = COALESCE(EXCLUDED.phone_number, public.users.phone_number),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ACTIVITY LOGS TABLE (URL Scanning History)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_risk_level ON public.activity_logs(risk_level);

-- Enable Row Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity logs
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SMS MESSAGES TABLE (SMS Scam Detection)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_number TEXT NOT NULL,
  receiver_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'pending' CHECK (risk_level IN ('pending', 'safe', 'dangerous')),
  ai_explanation TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_receiver ON public.sms_messages(receiver_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sender ON public.sms_messages(sender_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_risk_level ON public.sms_messages(risk_level);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sent_at ON public.sms_messages(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SMS messages (Open for demo/testing)
-- In production, restrict these based on receiver_number
CREATE POLICY "Anyone can view sms messages"
  ON public.sms_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert sms messages"
  ON public.sms_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sms messages"
  ON public.sms_messages FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete sms messages"
  ON public.sms_messages FOR DELETE
  USING (true);

-- =====================================================
-- REPORTED NUMBERS TABLE (SMS Sender Blocking System)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reported_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_number TEXT NOT NULL,
  report_count INTEGER DEFAULT 0,
  reported_by TEXT[] DEFAULT '{}', -- Array of phone numbers who reported
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reported_numbers_sender ON public.reported_numbers(sender_number);
CREATE INDEX IF NOT EXISTS idx_reported_numbers_report_count ON public.reported_numbers(report_count);

-- Enable Row Level Security
ALTER TABLE public.reported_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reported numbers (Open for demo/testing)
CREATE POLICY "Anyone can view reported numbers"
  ON public.reported_numbers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reported numbers"
  ON public.reported_numbers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update reported numbers"
  ON public.reported_numbers FOR UPDATE
  USING (true);

-- =====================================================
-- ENABLE REALTIME FOR SMS MESSAGES
-- =====================================================
-- Enable realtime updates for SMS table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_messages;

-- =====================================================
-- SETUP COMPLETE! ✅
-- =====================================================
-- Your CyberShield database is now ready with:
-- 
-- ✅ auth.users (Supabase built-in authentication)
-- ✅ public.users (user profiles with phone numbers)
-- ✅ public.activity_logs (URL scanning history)
-- ✅ public.sms_messages (SMS scam detection with real-time)
-- ✅ All Row Level Security (RLS) policies configured
-- ✅ Automatic user profile creation on signup
-- ✅ Real-time enabled for SMS messages
-- ✅ Proper indexes for performance
-- 
-- NEXT STEPS:
-- 1. Verify "Email" provider is enabled:
--    Go to: Authentication > Providers > Email (should be ON)
-- 
-- 2. Test registration:
--    - Register a new user with phone number
--    - Check if user appears in auth.users and public.users
-- 
-- 3. Test SMS features:
--    - Use Scammer Console to send test SMS
--    - Check Inbox and Flagged SMS pages
-- 
-- =====================================================
