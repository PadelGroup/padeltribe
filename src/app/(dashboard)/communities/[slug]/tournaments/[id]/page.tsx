'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TOURNAMENT_FORMATS } from '@/types';
import { calculateStandings, generateAmericanoRound, generateMexicanoRound, generateMixAmericanoRound, generateKingOfCourtRound } from '@/lib/tournament/scheduler';
import type { Tournament, TournamentPlayer, TournamentRound, Match, Profile } from '@/types';

export default function TournamentPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
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
  const [copied, setCopied] = useState(false);

  // Inline scoring state
  const [scores, setScores] = useState<Record<string, { team1: string; team2: string }>>({});
  const [savingMatch, setSavingMatch] = useState<Record<string, boolean>>({});

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      const { data: matches } = await supabase.from('matches')
        .select('*, p1:profiles!team1_player1(id,name), p2:profiles!team1_player2(id,name), p3:profiles!team2_player1(id,name), p4:profiles!team2_player2(id,name)')
        .eq('round_id', r.id).order('court_number');
      return { ...r, matches: matches || [] };
    }));
    setRounds(roundsWithMatches as TournamentRound[]);

    const lastRoundNum = roundsWithMatches.length > 0
      ? roundsWithMatches[roundsWithMatches.length - 1].round_number
      : null;
    setActiveRound(prev => prev ?? lastRoundNum);

    // Init scores for pending matches
    const initScores: Record<string, { team1: string; team2: string }> = {};
    for (const r of roundsWithMatches) {
      for (const m of (r.matches || [])) {
        initScores[m.id] = {
          team1: m.team1_score?.toString() ?? '',
          team2: m.team2_score?.toString() ?? '',
        };
      }
    }
    setScores(prev => ({ ...initScores, ...prev }));
    setLoading(false);
  }, [slug, id, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-calc opponent score
  const handleScoreChange = (matchId: string, side: 'team1' | 'team2', value: string) => {
    const ppg = tournament?.points_per_game ?? 0;
    setScores(prev => {
      const other = side === 'team1' ? 'team2' : 'team1';
      const otherVal = ppg > 0 && value !== '' && !isNaN(parseInt(value))
        ? Math.max(0, ppg - parseInt(value)).toString()
        : prev[matchId]?.[other] ?? '';
      return { ...prev, [matchId]: { ...prev[matchId], [side]: value, [other]: otherVal } };
    });
  };

  const saveScore = async (match: Match) => {
    const s = scores[match.id];
    if (!s) return;
    const t1 = parseInt(s.team1);
    const t2 = parseInt(s.team2);
    if (isNaN(t1) || isNaN(t2)) return;

    setSavingMatch(prev => ({ ...prev, [match.id]: true }));
    await supabase.from('matches').update({
      team1_score: t1, team2_score: t2,
      status: 'completed', completed_at: new Date().toISOString(),
    }).eq('id', match.id);
    setSavingMatch(prev => ({ ...prev, [match.id]: false }));
    await fetchData();
  };

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
    const standings = calculateStandings(players.map(p => p.profile as Profile), allMatches, tournament.ranking_priority);
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

    const { data: newRound } = await supabase.from('tournament_rounds')
      .insert({ tournament_id: id, round_number: nextRoundNum, status: 'active' }).select().single();
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

    setActiveRound(nextRoundNum);
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
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1"><Skeleton className="h-7 w-56" /><Skeleton className="h-5 w-36" /></div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 space-y-3">
        <Skeleton className="h-6 w-32" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-[#E8E4DF] rounded-xl">
            <Skeleton className="w-9 h-9 rounded-full" /><Skeleton className="h-4 w-32 flex-1" /><Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
  if (!tournament) return null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Join "${tournament.name}" on CoPadel! 🎾`;
  const fmt = TOURNAMENT_FORMATS.find(f => f.value === tournament.format)!;
  const allMatches = rounds.flatMap(r => r.matches || []);
  const standings = calculateStandings(players.map(p => p.profile as Profile), allMatches as Match[], tournament.ranking_priority);
  const currentRoundData = rounds.find(r => r.round_number === activeRound);
  const allMatchesCompleted = (currentRoundData?.matches?.length ?? 0) > 0 &&
    currentRoundData?.matches?.every(m => m.status === 'completed');

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
            <div className="flex items-center gap-3 flex-wrap mt-1">
              <p className="text-[#616161] text-sm">{fmt?.label} • {players.length} players registered</p>
              {tournament.start_date && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#F9F7F5] text-[#616161] border border-[#E8E4DF] rounded-lg">
                  🗓 {new Date(tournament.start_date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
              {tournament.price_per_person != null && tournament.price_per_person > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#FFF4EC] text-[#F97316] border border-[#FDBA74] rounded-lg">
                  💰 ${tournament.price_per_person} / person
                </span>
              )}
              {tournament.price_per_person === 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-lg">Free</span>
              )}
              {tournament.venue_url && (
                <a href={tournament.venue_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold px-2 py-0.5 bg-[#F9F7F5] text-[#616161] border border-[#E8E4DF] rounded-lg hover:border-[#F97316] hover:text-[#F97316] transition-colors">
                  📍 View Venue
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${tournament.status === 'active' ? 'text-red-600 bg-red-50 border-red-200' : tournament.status === 'completed' ? 'text-green-600 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
              {tournament.status === 'active' ? '🔴 Live' : tournament.status === 'completed' ? '✅ Completed' : '📋 Registration'}
            </span>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#9CA3AF] font-medium">Share:</span>
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs font-semibold transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2AABEE] hover:bg-[#1a9fde] text-white rounded-xl text-xs font-semibold transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </a>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E4DF] hover:border-[#F97316] hover:text-[#F97316] text-[#616161] rounded-xl text-xs font-semibold transition-all">
          {copied
            ? <><svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg><span className="text-green-500">Copied!</span></>
            : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Link</>
          }
        </button>
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

      {/* Active tournament info bar */}
      {tournament.status === 'active' && isAdmin && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold text-slate-900">Round {rounds.length} of {tournament.format.includes('americano') || tournament.format.includes('mexicano') ? '∞' : '?'}</p>
            <p className="text-sm text-slate-500">{allMatchesCompleted ? '✅ All matches done — ready for next round' : 'Enter scores below'}</p>
          </div>
          <button onClick={completeTournament} disabled={actionLoading}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-bold text-red-600 disabled:opacity-50 transition-all">
            End Tournament
          </button>
        </div>
      )}

      {/* Main content grid */}
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

              {/* Match cards */}
              {currentRoundData?.matches?.map((match: Match & { p1?: Profile; p2?: Profile; p3?: Profile; p4?: Profile }) => {
                const isSaved = match.status === 'completed';
                const isSaving = savingMatch[match.id];
                const s = scores[match.id] || { team1: '', team2: '' };
                const t1Wins = isSaved && (match.team1_score ?? 0) > (match.team2_score ?? 0);
                const t2Wins = isSaved && (match.team2_score ?? 0) > (match.team1_score ?? 0);
                const ppg = tournament.points_per_game;

                return (
                  <div key={match.id} className={`bg-white rounded-2xl p-5 border ${match.is_king_court ? 'border-amber-300 bg-amber-50/30' : isSaved ? 'border-green-200' : 'border-slate-200'}`}>
                    {match.is_king_court && <div className="text-xs text-amber-600 font-bold mb-2">👑 KING COURT</div>}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400 font-medium">Court {match.court_number}</span>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${isSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {isSaved ? '✓ Done' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Score row */}
                    <div className="flex items-center gap-3">
                      {/* Team 1 */}
                      <div className={`flex-1 text-center p-3 rounded-xl transition-all ${t1Wins ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-100'}`}>
                        <p className={`font-bold text-sm truncate ${t1Wins ? 'text-green-700' : 'text-slate-900'}`}>{match.p1?.name || '?'}</p>
                        <p className="text-slate-400 text-xs mb-2">& {match.p2?.name || '?'}</p>
                        {isAdmin && !isSaved ? (
                          <input
                            type="number" min="0" max={ppg || 99}
                            value={s.team1}
                            onChange={e => handleScoreChange(match.id, 'team1', e.target.value)}
                            className="w-16 h-12 text-center text-2xl font-black bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:border-[#F97316] focus:outline-none mx-auto block transition-colors"
                            placeholder="0"
                          />
                        ) : (
                          <span className={`text-3xl font-black block ${t1Wins ? 'text-green-600' : 'text-slate-800'}`}>{match.team1_score ?? '—'}</span>
                        )}
                      </div>

                      <div className="text-slate-300 font-bold text-lg shrink-0">VS</div>

                      {/* Team 2 */}
                      <div className={`flex-1 text-center p-3 rounded-xl transition-all ${t2Wins ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-100'}`}>
                        <p className={`font-bold text-sm truncate ${t2Wins ? 'text-green-700' : 'text-slate-900'}`}>{match.p3?.name || '?'}</p>
                        <p className="text-slate-400 text-xs mb-2">& {match.p4?.name || '?'}</p>
                        {isAdmin && !isSaved ? (
                          <input
                            type="number" min="0" max={ppg || 99}
                            value={s.team2}
                            onChange={e => handleScoreChange(match.id, 'team2', e.target.value)}
                            className="w-16 h-12 text-center text-2xl font-black bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:border-[#F97316] focus:outline-none mx-auto block transition-colors"
                            placeholder="0"
                          />
                        ) : (
                          <span className={`text-3xl font-black block ${t2Wins ? 'text-green-600' : 'text-slate-800'}`}>{match.team2_score ?? '—'}</span>
                        )}
                      </div>
                    </div>

                    {/* Save button */}
                    {isAdmin && !isSaved && (
                      <button
                        onClick={() => saveScore(match)}
                        disabled={isSaving || s.team1 === '' || s.team2 === ''}
                        className="mt-4 w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-all">
                        {isSaving ? 'Saving...' : '✓ Save Score'}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {rounds.length === 0 && tournament.status !== 'registration' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">No rounds yet</div>
          )}

          {/* Next Round button — below matches */}
          {tournament.status === 'active' && isAdmin && allMatchesCompleted && (
            <button onClick={generateNextRound} disabled={actionLoading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-2xl font-bold text-base disabled:opacity-50 transition-all">
              {actionLoading ? 'Generating...' : `▶ Start Round ${rounds.length + 1}`}
            </button>
          )}
        </div>

        {/* Standings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">📊 Standings</h2>
            {tournament.ranking_priority && (
              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-medium">
                {tournament.ranking_priority === 'wins_first' ? '🏆 Wins first' : '🎯 Points first'}
              </span>
            )}
          </div>
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
                    <p className="text-xs text-slate-400">{s.matches_played}P · {s.matches_won}W · {s.win_rate}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    {tournament.ranking_priority === 'wins_first' ? (
                      <>
                        <p className="text-sky-600 font-bold text-sm">{s.matches_won}W</p>
                        <p className="text-slate-400 text-xs">{s.points}pts</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sky-600 font-bold text-sm">{s.points}pts</p>
                        <p className="text-slate-400 text-xs">{s.matches_won}W</p>
                      </>
                    )}
                  </div>
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
