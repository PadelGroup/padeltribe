-- ============================================================
-- PadelTribe Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- COMMUNITIES
-- ============================================================
CREATE TABLE public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  color TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Community Members
CREATE TABLE public.community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(community_id, user_id)
);

-- Auto-add admin as member when community created
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.admin_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_community_created
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- ============================================================
-- INVITES
-- ============================================================
CREATE TABLE public.invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  phone TEXT,
  email TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
CREATE TABLE public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN (
    'americano', 'team_americano',
    'mexicano', 'team_mexicano',
    'mix_americano', 'mix_mexicano',
    'king_of_court', 'regular_sets'
  )),
  status TEXT DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed')),
  max_players INT,
  points_per_game INT DEFAULT 32,
  sets_to_win INT DEFAULT 2,
  games_per_set INT DEFAULT 6,
  current_round INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tournament Players (registrations)
CREATE TABLE public.tournament_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tournament_id, user_id)
);

-- Tournament Rounds
CREATE TABLE public.tournament_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tournament_id, round_number)
);

-- Matches
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES public.tournament_rounds(id) ON DELETE CASCADE NOT NULL,
  court_number INT DEFAULT 1,
  -- Team 1
  team1_player1 UUID REFERENCES public.profiles(id),
  team1_player2 UUID REFERENCES public.profiles(id),
  -- Team 2
  team2_player1 UUID REFERENCES public.profiles(id),
  team2_player2 UUID REFERENCES public.profiles(id),
  -- Scores (games/points won)
  team1_score INT,
  team2_score INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  is_king_court BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Set Scores (for Regular Sets format)
CREATE TABLE public.set_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  set_number INT NOT NULL,
  team1_games INT NOT NULL DEFAULT 0,
  team2_games INT NOT NULL DEFAULT 0,
  tiebreak_team1 INT,
  tiebreak_team2 INT,
  UNIQUE(match_id, set_number)
);

-- ============================================================
-- RANKINGS (per community, aggregated)
-- ============================================================
CREATE TABLE public.community_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  total_points NUMERIC DEFAULT 0 NOT NULL,
  matches_played INT DEFAULT 0 NOT NULL,
  matches_won INT DEFAULT 0 NOT NULL,
  matches_lost INT DEFAULT 0 NOT NULL,
  tournaments_played INT DEFAULT 0 NOT NULL,
  ranking_position INT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(community_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rankings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Communities: viewable by members
CREATE POLICY "Communities viewable by members" ON public.communities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can update communities" ON public.communities FOR UPDATE TO authenticated
  USING (auth.uid() = admin_id);

-- Community members
CREATE POLICY "Members viewable by community members" ON public.community_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = community_id AND cm.user_id = auth.uid()));
CREATE POLICY "Users can join via invite" ON public.community_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage members" ON public.community_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.admin_id = auth.uid()));

-- Invites: public read (for invite links), admin can create
CREATE POLICY "Anyone can read invites by token" ON public.invites FOR SELECT USING (true);
CREATE POLICY "Admins can create invites" ON public.invites FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.admin_id = auth.uid()));
CREATE POLICY "Invites can be updated by anyone (to mark used)" ON public.invites FOR UPDATE USING (true);

-- Tournaments
CREATE POLICY "Tournaments viewable by community members" ON public.tournaments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = community_id AND cm.user_id = auth.uid()));
CREATE POLICY "Admins can create tournaments" ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.admin_id = auth.uid()));
CREATE POLICY "Admins can update tournaments" ON public.tournaments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.admin_id = auth.uid()));

-- Tournament players
CREATE POLICY "Tournament players viewable by community members" ON public.tournament_players FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tournaments t
    JOIN public.community_members cm ON cm.community_id = t.community_id
    WHERE t.id = tournament_id AND cm.user_id = auth.uid()
  ));
CREATE POLICY "Players can register for tournaments" ON public.tournament_players FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Players can unregister" ON public.tournament_players FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Rounds, matches, scores - viewable by community members, managed by admins
CREATE POLICY "Rounds viewable by community members" ON public.tournament_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage rounds" ON public.tournament_rounds FOR ALL TO authenticated USING (true);

CREATE POLICY "Matches viewable by all authenticated" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL TO authenticated USING (true);

CREATE POLICY "Set scores viewable by all" ON public.set_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage set scores" ON public.set_scores FOR ALL TO authenticated USING (true);

CREATE POLICY "Rankings viewable by community members" ON public.community_rankings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rankings can be updated" ON public.community_rankings FOR ALL TO authenticated USING (true);

-- ============================================================
-- HELPER FUNCTION: Update community rankings after match
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_community_rankings(p_community_id UUID)
RETURNS VOID AS $$
DECLARE
  r RECORD;
  rank_pos INT := 1;
BEGIN
  -- Calculate stats for each player from all completed matches
  FOR r IN
    WITH player_matches AS (
      SELECT
        tp.user_id,
        COUNT(DISTINCT m.id) as matches_played,
        SUM(CASE
          WHEN (m.team1_player1 = tp.user_id OR m.team1_player2 = tp.user_id) AND m.team1_score > m.team2_score THEN 1
          WHEN (m.team2_player1 = tp.user_id OR m.team2_player2 = tp.user_id) AND m.team2_score > m.team1_score THEN 1
          ELSE 0
        END) as matches_won,
        SUM(CASE
          WHEN (m.team1_player1 = tp.user_id OR m.team1_player2 = tp.user_id) THEN COALESCE(m.team1_score, 0)
          WHEN (m.team2_player1 = tp.user_id OR m.team2_player2 = tp.user_id) THEN COALESCE(m.team2_score, 0)
          ELSE 0
        END) as total_points,
        COUNT(DISTINCT t.id) as tournaments_played
      FROM public.tournament_players tp
      JOIN public.tournaments t ON t.id = tp.tournament_id
      JOIN public.matches m ON m.tournament_id = t.id
        AND (m.team1_player1 = tp.user_id OR m.team1_player2 = tp.user_id
          OR m.team2_player1 = tp.user_id OR m.team2_player2 = tp.user_id)
      WHERE t.community_id = p_community_id AND m.status = 'completed'
      GROUP BY tp.user_id
    )
    SELECT * FROM player_matches ORDER BY total_points DESC, matches_won DESC
  LOOP
    INSERT INTO public.community_rankings (community_id, user_id, total_points, matches_played, matches_won, matches_lost, tournaments_played, ranking_position)
    VALUES (p_community_id, r.user_id, r.total_points, r.matches_played, r.matches_won, r.matches_played - r.matches_won, r.tournaments_played, rank_pos)
    ON CONFLICT (community_id, user_id) DO UPDATE SET
      total_points = EXCLUDED.total_points,
      matches_played = EXCLUDED.matches_played,
      matches_won = EXCLUDED.matches_won,
      matches_lost = EXCLUDED.matches_lost,
      tournaments_played = EXCLUDED.tournaments_played,
      ranking_position = rank_pos,
      updated_at = NOW();
    rank_pos := rank_pos + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

