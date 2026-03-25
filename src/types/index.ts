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
    label: 'D',
    badge: 'D',
    color: '#94A3B8',
    description: 'Introduction to padel. Can hit simple shots (serve, forehand, backhand, volley) but lacks consistency and control. Still learning basic rules, court positioning and game strategy. Stays at the back of the court.',
  },
  {
    value: 2,
    label: 'D+',
    badge: 'D+',
    color: '#64748B',
    description: 'Starting to play rallies and understand the dynamic of the game. Solid contact point but lacks depth and direction control. Beginning to use the lob and understand net play. Learning back glass and double glass shots.',
  },
  {
    value: 3,
    label: 'C',
    badge: 'C',
    color: '#22C55E',
    description: 'Good control on ground strokes. Can maintain medium rallies and starting to use padel-specific shots such as Bandeja and Bajada. Understands net play and transitions between the back and front of the court consistently.',
  },
  {
    value: 4,
    label: 'C+',
    badge: 'C+',
    color: '#16A34A',
    description: 'Can sustain rallies and control pace. Good shot selection for overheads — knows when to use Bandeja vs Smash. Understands court positioning and basic teamwork. Starting to anticipate opponents and counterattack from back to front.',
  },
  {
    value: 5,
    label: 'B',
    badge: 'B',
    color: '#F97316',
    description: 'Changes the pace of the game with varied shot selection and good decision-making. Full shot arsenal including Vibora, Chiquita and Drop Shot. Good awareness of opponents\' weaknesses. Fast movement across all three court areas.',
  },
  {
    value: 6,
    label: 'B+',
    badge: 'B+',
    color: '#EA580C',
    description: 'Aggressive net play and extremely solid defence. Absolute control over all shots. Can dictate the point with different paces and strategies. Anticipates opponents\' patterns and converts defensive situations into winning shots.',
  },
  {
    value: 7,
    label: 'A',
    badge: 'A',
    color: '#DC2626',
    description: 'Competitive at the highest amateur or professional level. Complete mastery of all padel skills executed with precision. Fast, agile and physically dominant — can compete in national, international or professional tournaments.',
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
  country?: string;
  city?: string;
  club_name?: string;
  is_public?: boolean;
  whatsapp_url?: string;
  telegram_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
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
  venue_url?: string;
  price_per_person?: number;
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
