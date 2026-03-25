export type UserRole = 'admin' | 'player';
export type TournamentFormat =
  | 'americano'
  | 'team_americano'
  | 'mexicano'
  | 'team_mexicano'
  | 'mix_americano'
  | 'mix_mexicano'
  | 'king_of_court'
  | 'regular_sets';
export type TournamentStatus = 'registration' | 'active' | 'completed';
export type MatchStatus = 'pending' | 'active' | 'completed';
export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  gender?: Gender;
  level?: number;
  created_at: string;
}

export const PADEL_LEVELS = [
  {
    value: 1,
    label: 'Level 1',
    badge: 'Beginner',
    viyaRef: 'D (0–1)',
    color: '#94A3B8',
    description: 'Introduction to padel. Can hit basic shots (serve, forehand, backhand, volley) but lacks consistency and control. Still learning positioning, game strategy, and rules. Stays at the back of the court.',
  },
  {
    value: 2,
    label: 'Level 2',
    badge: 'Beginner+',
    viyaRef: 'D+ (1–1.5)',
    color: '#64748B',
    description: 'Starting to play rallies and understand game dynamics. Solid contact point but lacks depth and direction control. Understands net play basics and begins using the lob to move opponents. Learning back and double glass shots.',
  },
  {
    value: 3,
    label: 'Level 3',
    badge: 'Intermediate',
    viyaRef: 'C- / C (2–3)',
    color: '#22C55E',
    description: 'Good groundstroke control. Can maintain medium rallies and starting to use padel-specific shots (Bandeja, Bajada). Understands net play and transitions between back and front of court. Uses lob consistently to recover net position.',
  },
  {
    value: 4,
    label: 'Level 4',
    badge: 'Intermediate+',
    viyaRef: 'C Strong / C+ (3.5–4)',
    color: '#16A34A',
    description: 'Can sustain rallies and control pace. Good shot selection for overheads — knows when to use Bandeja vs Smash. Understands court positioning and teamwork. Starts anticipating opponents. Counterattacks from back to front consistently.',
  },
  {
    value: 5,
    label: 'Level 5',
    badge: 'Advanced',
    viyaRef: 'B- / B (4.5–5)',
    color: '#F97316',
    description: 'Changes pace of the game with varied shot selection and good decision-making. Solid attack and defence — Vibora, Chiquita, Drop Shot in the arsenal. Good awareness of opponents\' weaknesses. Fast movement covering all three court areas.',
  },
  {
    value: 6,
    label: 'Level 6',
    badge: 'Advanced+',
    viyaRef: 'B+ (5.5)',
    color: '#EA580C',
    description: 'Aggressive net play and extremely solid defence. Absolute control over smashes (Power Smash and Rulo). Can dictate points against elite players. Anticipates opponents\' patterns and converts defensive situations into winners.',
  },
  {
    value: 7,
    label: 'Level 7',
    badge: 'Elite',
    viyaRef: 'A / A+ (6+)',
    color: '#DC2626',
    description: 'Competitive at the highest amateur or professional level. Top national / international ranked player (Top 25 UAE, FIP ranked, or WPT). Complete mastery of all padel skills. Fast, agile, physically dominant — no weaknesses.',
  },
];

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  admin_id: string;
  logo_url?: string;
  logo_preset?: string;
  color: string;
  created_at: string;
  member_count?: number;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  profile?: Profile;
}

export interface Invite {
  id: string;
  community_id: string;
  token: string;
  phone?: string;
  email?: string;
  created_by: string;
  used: boolean;
  expires_at: string;
  created_at: string;
  community?: Community;
}

export interface Tournament {
  id: string;
  community_id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  max_players?: number;
  points_per_game: number;
  sets_to_win: number;
  games_per_set: number;
  current_round: number;
  created_by: string;
  start_date?: string;
  completed_at?: string;
  created_at: string;
  player_count?: number;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  user_id: string;
  gender?: Gender;
  registered_at: string;
  profile?: Profile;
}

export interface TournamentRound {
  id: string;
  tournament_id: string;
  round_number: number;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
  matches?: Match[];
}

export interface Match {
  id: string;
  tournament_id: string;
  round_id: string;
  court_number: number;
  team1_player1?: string;
  team1_player2?: string;
  team2_player1?: string;
  team2_player2?: string;
  team1_score?: number;
  team2_score?: number;
  status: MatchStatus;
  is_king_court: boolean;
  created_at: string;
  completed_at?: string;
  // Joined data
  p1?: Profile;
  p2?: Profile;
  p3?: Profile;
  p4?: Profile;
  set_scores?: SetScore[];
}

export interface SetScore {
  id: string;
  match_id: string;
  set_number: number;
  team1_games: number;
  team2_games: number;
  tiebreak_team1?: number;
  tiebreak_team2?: number;
}

export interface CommunityRanking {
  id: string;
  community_id: string;
  user_id: string;
  total_points: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  tournaments_played: number;
  ranking_position?: number;
  updated_at: string;
  profile?: Profile;
}

export interface PlayerStanding {
  user_id: string;
  name: string;
  points: number;
  matches_played: number;
  matches_won: number;
  win_rate: number;
}

export const TOURNAMENT_FORMATS: { value: TournamentFormat; label: string; description: string; minPlayers: number; emoji: string }[] = [
  { value: 'americano', label: 'Americano', description: 'Everyone plays with everyone. Partners rotate each round. Individual scoring.', minPlayers: 4, emoji: '🔄' },
  { value: 'team_americano', label: 'Team Americano', description: 'Fixed teams play round-robin. Team scoring accumulated throughout.', minPlayers: 4, emoji: '👥' },
  { value: 'mexicano', label: 'Mexicano', description: 'Dynamic pairing — players with similar rankings play together each round.', minPlayers: 4, emoji: '🌶️' },
  { value: 'team_mexicano', label: 'Team Mexicano', description: 'Fixed teams, but fixture order determined by current standings.', minPlayers: 4, emoji: '🏆' },
  { value: 'mix_americano', label: 'Mix Americano', description: 'Mixed gender Americano — men always partner with women.', minPlayers: 4, emoji: '⚡' },
  { value: 'mix_mexicano', label: 'Mix Mexicano', description: 'Mixed gender Mexicano — dynamic mixed pairs based on standings.', minPlayers: 4, emoji: '✨' },
  { value: 'king_of_court', label: 'King of the Court', description: 'Winners stay on the king court. Losers rotate out. Fast & fun.', minPlayers: 6, emoji: '👑' },
  { value: 'regular_sets', label: 'Regular Sets', description: 'Traditional padel — play full sets to determine the winner.', minPlayers: 4, emoji: '🎾' },
];
