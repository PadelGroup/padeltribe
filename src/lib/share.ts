export function buildRankingsShareText(
  communityName: string,
  rankings: { name: string; total_points: number; matches_won: number; matches_played: number }[]
): string {
  const medals = ['🥇', '🥈', '🥉'];
  const top = rankings.slice(0, 10);
  
  const lines = [
    `🏓 *${communityName}* — League Standings`,
    `${'─'.repeat(28)}`,
    ...top.map((r, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const winRate = r.matches_played > 0 ? Math.round((r.matches_won / r.matches_played) * 100) : 0;
      return `${medal} *${r.name}*  —  ${r.total_points} pts  (${winRate}% W)`;
    }),
    ``,
    `📲 View full rankings on CoPadel`,
  ];
  return lines.join('\n');
}

export function buildMatchResultsShareText(
  communityName: string,
  tournamentName: string,
  roundNumber: number,
  matches: {
    p1?: string; p2?: string; p3?: string; p4?: string;
    team1_score?: number; team2_score?: number;
    court_number?: number;
  }[]
): string {
  const completedMatches = matches.filter(m => m.team1_score !== undefined && m.team2_score !== undefined);

  const lines = [
    `🏓 *${communityName}* — ${tournamentName}`,
    `📋 Round ${roundNumber} Results`,
    `${'─'.repeat(28)}`,
    ...completedMatches.map(m => {
      const t1Won = (m.team1_score ?? 0) > (m.team2_score ?? 0);
      const t1 = [m.p1, m.p2].filter(Boolean).join(' & ') || 'Team 1';
      const t2 = [m.p3, m.p4].filter(Boolean).join(' & ') || 'Team 2';
      const score = `${m.team1_score} - ${m.team2_score}`;
      return `Court ${m.court_number ?? '?'}: ${t1Won ? '🏆 ' : ''}${t1}  ${score}  ${!t1Won ? '🏆 ' : ''}${t2}`;
    }),
    ``,
    `📲 Follow live on CoPadel`,
  ];
  return lines.join('\n');
}

export function buildTournamentStandingsShareText(
  communityName: string,
  tournamentName: string,
  standings: { name: string; points: number; matches_played: number; matches_won: number }[]
): string {
  const medals = ['🥇', '🥈', '🥉'];
  const lines = [
    `🏓 *${communityName}*`,
    `🏆 ${tournamentName} — Standings`,
    `${'─'.repeat(28)}`,
    ...standings.slice(0, 10).map((s, i) => {
      const medal = medals[i] || `${i + 1}.`;
      return `${medal} *${s.name}*  ${s.points} pts  (${s.matches_won}/${s.matches_played} W)`;
    }),
    ``,
    `📲 Play on CoPadel`,
  ];
  return lines.join('\n');
}

export function shareToWhatsApp(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function shareToTelegram(text: string, shareUrl?: string) {
  const url = shareUrl
    ? `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
    : `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
