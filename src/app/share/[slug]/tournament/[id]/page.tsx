import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AvatarDisplay from '@/components/ui/avatar-display';
import ShareButtonsWrapper from '@/components/ui/share-buttons-wrapper';
import { calculateStandings } from '@/lib/tournament/scheduler';
import type { Match, Profile } from '@/types';

export default async function PublicTournamentPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase.from('communities').select('*').eq('slug', slug).single();
  if (!community) notFound();
  const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', id).single();
  if (!tournament) notFound();

  const { data: tp } = await supabase.from('tournament_players').select('*, profile:profiles(id,name,avatar_url,avatar_preset)').eq('tournament_id', id);
  const { data: rounds } = await supabase.from('tournament_rounds').select('*').eq('tournament_id', id).order('round_number');

  const roundsWithMatches = await Promise.all((rounds || []).map(async r => {
    const { data: matches } = await supabase.from('matches')
      .select('*, p1:profiles!team1_player1(id,name), p2:profiles!team1_player2(id,name), p3:profiles!team2_player1(id,name), p4:profiles!team2_player2(id,name)')
      .eq('round_id', r.id).order('court_number');
    return { ...r, matches: matches || [] };
  }));

  const players = (tp || []).map(p => p.profile as Profile);
  const allMatches = roundsWithMatches.flatMap(r => r.matches);
  const standings = calculateStandings(players, allMatches as Match[]);

  const latestRound = roundsWithMatches.slice(-1)[0];
  const latestMatches = latestRound?.matches || [];

  const roundText = latestMatches.filter((m: Match) => m.status === 'completed').length > 0
    ? [
        `🏓 *${community.name}* — ${tournament.name}`,
        `📋 Round ${latestRound?.round_number} Results`,
        '─'.repeat(28),
        ...latestMatches.filter((m: Match) => m.status === 'completed').map((m: Match & { p1?: Profile; p2?: Profile; p3?: Profile; p4?: Profile }) => {
          const t1 = [m.p1?.name, m.p2?.name].filter(Boolean).join(' & ') || 'Team 1';
          const t2 = [m.p3?.name, m.p4?.name].filter(Boolean).join(' & ') || 'Team 2';
          const t1Won = (m.team1_score ?? 0) > (m.team2_score ?? 0);
          return `Court ${m.court_number}: ${t1Won ? '🏆' : ''}${t1}  ${m.team1_score}-${m.team2_score}  ${!t1Won ? '🏆' : ''}${t2}`;
        }),
        '',
        `📲 ${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/tournament/${id}`,
      ].join('\n')
    : `🏓 ${tournament.name} — No results yet`;

  const standingsText = standings.length > 0
    ? [
        `🏓 *${community.name}* — ${tournament.name}`,
        `📊 Current Standings`,
        '─'.repeat(28),
        ...standings.slice(0, 10).map((s, i) => {
          const m = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
          return `${m} *${s.name}*  ${s.points} pts  (${s.matches_won}/${s.matches_played} W)`;
        }),
        '',
        `📲 ${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/tournament/${id}`,
      ].join('\n')
    : `🏓 ${tournament.name} — Standings coming soon`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏓</span>
            <span className="font-bold gradient-text">PadelTribe</span>
          </Link>
          <span className="text-xs text-slate-400">Public results</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <p className="text-slate-500 text-sm">{community.name}</p>
          <h1 className="text-2xl font-black text-slate-900 mt-1">{tournament.name}</h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">{tournament.format.replace(/_/g, ' ')} · {tournament.status}</p>
        </div>

        {/* Latest round results */}
        {latestRound && latestMatches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Round {latestRound.round_number} Results</h2>
              <ShareButtonsWrapper text={roundText} shareUrl={`${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/tournament/${id}`} label="Share Results" />
            </div>
            {latestMatches.map((m: Match & { p1?: Profile; p2?: Profile; p3?: Profile; p4?: Profile }) => {
              const t1Won = m.status === 'completed' && (m.team1_score ?? 0) > (m.team2_score ?? 0);
              const t2Won = m.status === 'completed' && (m.team2_score ?? 0) > (m.team1_score ?? 0);
              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                  {m.is_king_court && <div className="text-xs text-amber-600 font-bold mb-2">👑 KING COURT</div>}
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 p-3 rounded-xl text-center ${t1Won ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`font-bold text-sm ${t1Won ? 'text-green-700' : 'text-slate-900'}`}>{m.p1?.name || '?'}</p>
                      <p className="text-xs text-slate-400">{m.p2?.name || '?'}</p>
                    </div>
                    <div className="text-center shrink-0">
                      {m.status === 'completed' ? (
                        <p className="text-xl font-black text-slate-900">{m.team1_score} <span className="text-slate-400 text-sm">—</span> {m.team2_score}</p>
                      ) : (
                        <p className="text-slate-400 text-sm">vs</p>
                      )}
                      <p className="text-xs text-slate-400">Court {m.court_number}</p>
                    </div>
                    <div className={`flex-1 p-3 rounded-xl text-center ${t2Won ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className={`font-bold text-sm ${t2Won ? 'text-green-700' : 'text-slate-900'}`}>{m.p3?.name || '?'}</p>
                      <p className="text-xs text-slate-400">{m.p4?.name || '?'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Standings */}
        {standings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Standings</h2>
              <ShareButtonsWrapper text={standingsText} shareUrl={`${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/tournament/${id}`} label="Share Standings" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {standings.map((s, i) => (
                <div key={s.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.matches_played}P · {s.matches_won}W</p>
                  </div>
                  <span className="text-sky-600 font-black">{s.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
