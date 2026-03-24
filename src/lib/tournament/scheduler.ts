import type { Profile, TournamentFormat, Match } from '@/types';

// Generate round-robin pairings for Americano
// Each round: players are divided into groups of 4, then paired within groups
export function generateAmericanoRound(
  players: Profile[],
  roundNumber: number,
  previousMatches: Match[]
): { team1: [string, string]; team2: [string, string]; court: number }[] {
  const n = players.length;
  const courts: { team1: [string, string]; team2: [string, string]; court: number }[] = [];

  if (n < 4) return courts;

  // Shuffle for first round, then use standings for subsequent
  const ids = players.map(p => p.id);
  const shuffled = roundNumber === 1 ? shuffleArray([...ids]) : ids;

  // Group into sets of 4
  let courtNum = 1;
  for (let i = 0; i + 3 < shuffled.length; i += 4) {
    const group = shuffled.slice(i, i + 4);
    courts.push({
      team1: [group[0], group[1]],
      team2: [group[2], group[3]],
      court: courtNum++,
    });
  }

  return courts;
}

// Mexicano: pair by current ranking (1st with 2nd vs 3rd with 4th, etc.)
export function generateMexicanoRound(
  players: Profile[],
  roundNumber: number,
  standings: { user_id: string; points: number }[]
): { team1: [string, string]; team2: [string, string]; court: number }[] {
  const courts: { team1: [string, string]; team2: [string, string]; court: number }[] = [];

  let ordered: string[];
  if (roundNumber === 1 || standings.length === 0) {
    ordered = shuffleArray(players.map(p => p.id));
  } else {
    // Sort by points descending
    const standingMap = new Map(standings.map(s => [s.user_id, s.points]));
    ordered = players
      .map(p => p.id)
      .sort((a, b) => (standingMap.get(b) ?? 0) - (standingMap.get(a) ?? 0));
  }

  let courtNum = 1;
  for (let i = 0; i + 3 < ordered.length; i += 4) {
    courts.push({
      team1: [ordered[i], ordered[i + 1]],
      team2: [ordered[i + 2], ordered[i + 3]],
      court: courtNum++,
    });
  }

  return courts;
}

// Mix Americano: men always pair with women
export function generateMixAmericanoRound(
  players: Profile[],
  roundNumber: number
): { team1: [string, string]; team2: [string, string]; court: number }[] {
  const courts: { team1: [string, string]; team2: [string, string]; court: number }[] = [];

  const men = shuffleArray(players.filter(p => p.gender === 'male').map(p => p.id));
  const women = shuffleArray(players.filter(p => p.gender !== 'male').map(p => p.id));

  const pairs = Math.floor(Math.min(men.length, women.length) / 2) * 2;
  let courtNum = 1;

  for (let i = 0; i + 1 < pairs; i += 2) {
    if (i + 1 < men.length && i + 1 < women.length) {
      courts.push({
        team1: [men[i], women[i]],
        team2: [men[i + 1], women[i + 1]],
        court: courtNum++,
      });
    }
  }

  return courts;
}

// King of the Court: winners stay, losers rotate
export function generateKingOfCourtRound(
  players: Profile[],
  previousRoundMatches: Match[],
  _roundNumber: number
): { team1: [string, string]; team2: [string, string]; court: number; isKingCourt: boolean }[] {
  const courts: { team1: [string, string]; team2: [string, string]; court: number; isKingCourt: boolean }[] = [];
  const ids = players.map(p => p.id);

  if (previousRoundMatches.length === 0) {
    // First round: random assignment
    const shuffled = shuffleArray([...ids]);
    let courtNum = 1;
    for (let i = 0; i + 3 < shuffled.length; i += 4) {
      courts.push({
        team1: [shuffled[i], shuffled[i + 1]],
        team2: [shuffled[i + 2], shuffled[i + 3]],
        court: courtNum,
        isKingCourt: courtNum === 1,
      });
      courtNum++;
    }
    return courts;
  }

  // Find king court match (isKingCourt = true)
  const kingMatch = previousRoundMatches.find(m => m.is_king_court);
  const otherMatches = previousRoundMatches.filter(m => !m.is_king_court);

  let winnersOfKing: string[] = [];
  let losersOfKing: string[] = [];

  if (kingMatch) {
    const team1Won = (kingMatch.team1_score ?? 0) > (kingMatch.team2_score ?? 0);
    winnersOfKing = team1Won
      ? [kingMatch.team1_player1!, kingMatch.team1_player2!].filter(Boolean)
      : [kingMatch.team2_player1!, kingMatch.team2_player2!].filter(Boolean);
    losersOfKing = team1Won
      ? [kingMatch.team2_player1!, kingMatch.team2_player2!].filter(Boolean)
      : [kingMatch.team1_player1!, kingMatch.team1_player2!].filter(Boolean);
  }

  // Challengers: winners from other courts
  const challengers: string[] = [];
  for (const m of otherMatches) {
    const team1Won = (m.team1_score ?? 0) > (m.team2_score ?? 0);
    const winners = team1Won
      ? [m.team1_player1!, m.team1_player2!]
      : [m.team2_player1!, m.team2_player2!];
    challengers.push(...winners.filter(Boolean));
  }

  // King court: winners of king vs top challengers
  if (challengers.length >= 2) {
    courts.push({
      team1: [winnersOfKing[0] || challengers[0], winnersOfKing[1] || challengers[1]],
      team2: [challengers[0], challengers[1]],
      court: 1,
      isKingCourt: true,
    });
  }

  // Remaining courts with losers + remaining challengers
  const remaining = shuffleArray([...losersOfKing, ...challengers.slice(2)]);
  let courtNum = 2;
  for (let i = 0; i + 3 < remaining.length; i += 4) {
    courts.push({
      team1: [remaining[i], remaining[i + 1]],
      team2: [remaining[i + 2], remaining[i + 3]],
      court: courtNum++,
      isKingCourt: false,
    });
  }

  return courts;
}

export function calculateStandings(
  players: Profile[],
  matches: Match[]
): { user_id: string; name: string; points: number; matches_played: number; matches_won: number }[] {
  const stats = new Map<string, { points: number; played: number; won: number }>();

  players.forEach(p => stats.set(p.id, { points: 0, played: 0, won: 0 }));

  for (const match of matches) {
    if (match.status !== 'completed') continue;

    const t1Score = match.team1_score ?? 0;
    const t2Score = match.team2_score ?? 0;

    const team1 = [match.team1_player1, match.team1_player2].filter(Boolean) as string[];
    const team2 = [match.team2_player1, match.team2_player2].filter(Boolean) as string[];

    for (const pid of team1) {
      const s = stats.get(pid);
      if (s) {
        s.points += t1Score;
        s.played += 1;
        if (t1Score > t2Score) s.won += 1;
      }
    }
    for (const pid of team2) {
      const s = stats.get(pid);
      if (s) {
        s.points += t2Score;
        s.played += 1;
        if (t2Score > t1Score) s.won += 1;
      }
    }
  }

  return players.map(p => {
    const s = stats.get(p.id) ?? { points: 0, played: 0, won: 0 };
    return { user_id: p.id, name: p.name, ...s, matches_played: s.played, matches_won: s.won };
  }).sort((a, b) => b.points - a.points || b.matches_won - a.matches_won);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
