-- ============================================================
-- Migration 002: Add preferred side + avatar storage
-- ============================================================

-- Add preferred_side to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_side TEXT CHECK (preferred_side IN ('right', 'left', 'both')) DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS avatar_preset TEXT; -- stores preset avatar ID e.g. 'racket-purple'

-- Supabase Storage bucket for profile photos (run this once in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policy: users can upload their own avatar
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- STORAGE SETUP (run separately in Supabase Dashboard → Storage)
-- Or enable via the SQL editor after creating bucket manually
-- ============================================================
/*
  1. Go to Supabase Dashboard → Storage → Create bucket
  2. Name: "avatars", check "Public bucket"
  3. Then run:
*/
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;

CREATE POLICY IF NOT EXISTS "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
