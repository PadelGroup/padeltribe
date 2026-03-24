'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TOURNAMENT_FORMATS } from '@/types';
import { calculateStandings, generateAmericanoRound, generateMexicanoRound, generateMixAmericanoRound, generateKingOfCourtRound } from '@/lib/tournament/scheduler';
import type { Tournament, TournamentPlayer, TournamentRound, Match, Profile } from '@/types';

export default function TournamentPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userId, setUserId] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeRound, setActiveRound] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: comm } = await supabase.from('communities').select('id, admin_id').eq('slug', slug).single();
    if (!comm) return;
    setCommunityId(comm.id);

    const { data: memb } = await supabase.from('community_members').select('role').eq('community_id', comm.id).eq('user_id', user.id).single();
    setIsAdmin(memb?.role === 'admin');

    const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single();
    if (!t) return;
    setTournament(t);

    const { data: tp } = await supabase.from('tournament_players').select('*, profile:profiles(*)').eq('tournament_id', id);
    setPlayers((tp || []) as TournamentPlayer[]);
    setIsRegistered((tp || []).some(p => p.user_id === user.id));

    const { data: roundsData } = await supabase.from('tournament_rounds').select('*').eq('tournament_id', id).order('round_number');
    const roundsWithMatches = await Promise.all((roundsData || []).map(async r => {
      const { data: matches } = await supabase.from('matches').select('*, p1:profiles!team1_player1(id,name), p2:profiles!team1_player2(id,name), p3:profiles!team2_player1(id,name), p4:profiles!team2_player2(id,name)').eq('round_id', r.id).order('court_number');
      return { ...r, matches: matches || [] };
    }));
    setRounds(roundsWithMatches as TournamentRound[]);
    if (roundsWithMatches.length > 0) setActiveRound(roundsWithMatches[roundsWithMatches.length - 1].round_number);
    setLoading(false);
  }, [slug, id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRegister = async () => {
    setActionLoading(true);
    await supabase.from('tournament_players').insert({ tournament_id: id, user_id: userId });
    setIsRegistered(true);
    await fetchData();
    setActionLoading(false);
  };

  const handleUnregister = async () => {
    setActionLoading(true);
    await supabase.from('tournament_players').delete().eq('tournament_id', id).eq('user_id', userId);
    setIsRegistered(false);
    await fetchData();
    setActionLoading(false);
  };

  const startTournament = async () => {
    if (!tournament || players.length < 4) return;
    setActionLoading(true);
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', id);
    setTournament(prev => prev ? { ...prev, status: 'active' } : null);
    await generateNextRound();
    setActionLoading(false);
  };

  const generateNextRound = async () => {
    if (!tournament) return;
    setActionLoading(true);

    const nextRoundNum = (rounds.length > 0 ? Math.max(...rounds.map(r => r.round_number)) : 0) + 1;
    const allMatches = rounds.flatMap(r => r.matches || []);
    const standings = calculateStandings(players.map(p => p.profile as Profile), allMatches);
    const playerProfiles = players.map(p => p.profile as Profile);

    let courts: { team1: [string, string]; team2: [string, string]; court: number; isKingCourt?: boolean }[] = [];
    const fmt = tournament.format;

    if (fmt === 'americano' || fmt === 'team_americano') {
      courts = generateAmericanoRound(playerProfiles, nextRoundNum, allMatches);
    } else if (fmt === 'mexicano' || fmt === 'team_mexicano') {
      courts = generateMexicanoRound(playerProfiles, nextRoundNum, standings);
    } else if (fmt === 'mix_americano') {
      courts = generateMixAmericanoRound(playerProfiles, nextRoundNum);
    } else if (fmt === 'mix_mexicano') {
      courts = generateMexicanoRound(playerProfiles, nextRoundNum, standings);
    } else if (fmt === 'king_of_court') {
      const lastRoundMatches = rounds.length > 0 ? (rounds[rounds.length - 1].matches || []) : [];
      courts = generateKingOfCourtRound(playerProfiles, lastRoundMatches as Match[], nextRoundNum);
    } else {
      courts = generateAmericanoRound(playerProfiles, nextRoundNum, allMatches);
    }

    const { data: newRound } = await supabase.from('tournament_rounds').insert({ tournament_id: id, round_number: nextRoundNum, status: 'active' }).select().single();
    if (!newRound) { setActionLoading(false); return; }

    for (const court of courts) {
      await supabase.from('matches').insert({
        tournament_id: id, round_id: newRound.id,
        court_number: court.court,
        team1_player1: court.team1[0], team1_player2: court.team1[1],
        team2_player1: court.team2[0], team2_player2: court.team2[1],
        status: 'pending',
        is_king_court: court.isKingCourt || false,
      });
    }

    await fetchData();
    setActionLoading(false);
  };

  const completeTournament = async () => {
    if (!confirm('Complete this tournament? This will finalize all rankings.')) return;
    setActionLoading(true);
    await supabase.from('tournaments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    await supabase.rpc('update_community_rankings', { p_community_id: communityId });
    await fetchData();
    setActionLoading(false);
  };

  if (loading) return (
    <div className="pt-16 lg:pt-0 flex items-center justify-center min-h-64">
      <div className="text-4xl animate-pulse">🏓</div>
    </div>
  );
  if (!tournament) return null;

  const fmt = TOURNAMENT_FORMATS.find(f => f.value === tournament.format)!;
  const allMatches = rounds.flatMap(r => r.matches || []);
  const standings = calculateStandings(players.map(p => p.profile as Profile), allMatches as Match[]);
  const currentRoundData = rounds.find(r => r.round_number === activeRound);
  const allMatchesCompleted = currentRoundData?.matches?.every(m => m.status === 'completed') || false;

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div>
        <Link href={`/communities/${slug}/tournaments`} className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-2">← Tournaments</Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{fmt?.emoji}</span>
              <h1 className="text-2xl font-black text-slate-900">{tournament.name}</h1>
            </div>
            <p className="text-slate-500 mt-1">{fmt?.label} • {players.length} players registered</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${tournament.status === 'active' ? 'text-red-600 bg-red-50 border-red-200' : tournament.status === 'completed' ? 'text-green-600 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
              {tournament.status === 'active' ? '🔴 Live' : tournament.status === 'completed' ? '✅ Completed' : '📋 Registration'}
            </span>
            {tournament.status === 'active' && isAdmin && (
              <Link href={`/communities/${slug}/tournaments/${id}/scoring`}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold transition-all">
                ✏️ Score Entry
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Registration phase */}
      {tournament.status === 'registration' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-bold text-slate-900 mb-1">Registration Open</h2>
          <p className="text-slate-500 text-sm mb-4">{players.length} player{players.length !== 1 ? 's' : ''} registered{tournament.max_players ? ` / ${tournament.max_players} max` : ''}</p>
          <div className="flex gap-3 flex-wrap">
            {!isRegistered ? (
              <button onClick={handleRegister} disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {actionLoading ? 'Joining...' : '+ Join Tournament'}
              </button>
            ) : (
              <button onClick={handleUnregister} disabled={actionLoading}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl font-medium text-slate-600 disabled:opacity-50">
                ✓ Registered — Leave
              </button>
            )}
            {isAdmin && players.length >= (fmt?.minPlayers || 4) && (
              <button onClick={startTournament} disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {actionLoading ? 'Starting...' : '▶ Start Tournament'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active tournament controls */}
      {tournament.status === 'active' && isAdmin && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-bold text-slate-900">Round {rounds.length} of {tournament.format.includes('americano') || tournament.format.includes('mexicano') ? '∞' : '?'}</p>
              <p className="text-sm text-slate-500">{allMatchesCompleted ? '✅ All matches done' : 'Matches in progress'}</p>
            </div>
            <div className="flex gap-2">
              {allMatchesCompleted && (
                <button onClick={generateNextRound} disabled={actionLoading}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
                  {actionLoading ? '...' : '▶ Next Round'}
                </button>
              )}
              <button onClick={completeTournament} disabled={actionLoading}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-bold text-red-600 disabled:opacity-50 transition-all">
                End Tournament
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Rounds & Standings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Rounds / Matches */}
        <div className="lg:col-span-3 space-y-4">
          {rounds.length > 0 && (
            <>
              {/* Round tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {rounds.map(r => (
                  <button key={r.round_number} onClick={() => setActiveRound(r.round_number)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeRound === r.round_number ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'}`}>
                    Round {r.round_number}
                  </button>
                ))}
              </div>

              {/* Matches */}
              {currentRoundData?.matches?.map((match: Match & { p1?: Profile; p2?: Profile; p3?: Profile; p4?: Profile }) => (
                <div key={match.id} className={`bg-white border rounded-2xl p-5 ${match.is_king_court ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
                  {match.is_king_court && <div className="text-xs text-amber-600 font-bold mb-2">👑 KING COURT</div>}
                  <div className="text-xs text-slate-400 mb-3">Court {match.court_number}</div>
                  <div className="flex items-center gap-4">
                    {/* Team 1 */}
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-900 text-sm">{match.p1?.name || '?'}</p>
                      <p className="text-slate-400 text-xs">& {match.p2?.name || '?'}</p>
                    </div>
                    {/* Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-2xl font-black ${match.status === 'completed' && (match.team1_score ?? 0) > (match.team2_score ?? 0) ? 'text-green-600' : 'text-slate-900'}`}>
                        {match.team1_score ?? '—'}
                      </span>
                      <span className="text-slate-400 text-sm">vs</span>
                      <span className={`text-2xl font-black ${match.status === 'completed' && (match.team2_score ?? 0) > (match.team1_score ?? 0) ? 'text-green-600' : 'text-slate-900'}`}>
                        {match.team2_score ?? '—'}
                      </span>
                    </div>
                    {/* Team 2 */}
                    <div className="flex-1 text-center">
                      <p className="font-semibold text-slate-900 text-sm">{match.p3?.name || '?'}</p>
                      <p className="text-slate-400 text-xs">& {match.p4?.name || '?'}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-lg ${match.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      {match.status === 'completed' ? '✓ Done' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
          {rounds.length === 0 && tournament.status !== 'registration' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">No rounds yet</div>
          )}
        </div>

        {/* Standings */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-slate-900 mb-3">📊 Standings</h2>
          {standings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-sm">No matches played yet</div>
          ) : (
            <div className="space-y-2">
              {standings.map((s, i) => (
                <div key={s.user_id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.matches_played}P {s.matches_won}W</p>
                  </div>
                  <span className="text-sky-600 font-bold text-sm shrink-0">{s.points}pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Registered Players */}
          {tournament.status === 'registration' && (
            <div className="mt-6">
              <h2 className="font-bold text-slate-900 mb-3">👥 Registered Players</h2>
              {players.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-slate-400 text-sm">No one registered yet</div>
              ) : (
                <div className="space-y-2">
                  {players.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-orange-400 flex items-center justify-center text-xs font-bold text-white">
                        {p.profile?.name?.[0] || '?'}
                      </div>
                      <span className="text-sm text-slate-900">{p.profile?.name || 'Player'}</span>
                      {p.user_id === userId && <span className="ml-auto text-xs text-sky-500">You</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
