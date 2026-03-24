'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Tournament, TournamentRound, Match, Profile } from '@/types';

interface MatchWithPlayers extends Match {
  p1?: Profile; p2?: Profile; p3?: Profile; p4?: Profile;
}

export default function ScoringPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [matches, setMatches] = useState<MatchWithPlayers[]>([]);
  const [scores, setScores] = useState<Record<string, { team1: string; team2: string }>>({});
  const [sets, setSets] = useState<Record<string, { sets: { t1: string; t2: string }[] }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeRound, setActiveRound] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).single();
    if (!t) return;
    setTournament(t);

    const { data: roundsData } = await supabase.from('tournament_rounds').select('*').eq('tournament_id', id).order('round_number');
    setRounds(roundsData || []);

    const latestRound = (roundsData || []).slice(-1)[0];
    if (latestRound) {
      setActiveRound(latestRound.round_number);
      await loadRoundMatches(latestRound.id);
    }
  }, [id, supabase]);

  const loadRoundMatches = async (roundId: string) => {
    const { data } = await supabase.from('matches')
      .select('*, p1:profiles!team1_player1(id,name), p2:profiles!team1_player2(id,name), p3:profiles!team2_player1(id,name), p4:profiles!team2_player2(id,name), set_scores(*)')
      .eq('round_id', roundId).order('court_number');

    const ms = data || [];
    setMatches(ms as MatchWithPlayers[]);

    const initScores: Record<string, { team1: string; team2: string }> = {};
    const initSets: Record<string, { sets: { t1: string; t2: string }[] }> = {};

    ms.forEach((m: MatchWithPlayers & { set_scores?: { team1_games: number; team2_games: number }[] }) => {
      initScores[m.id] = {
        team1: m.team1_score?.toString() || '',
        team2: m.team2_score?.toString() || '',
      };
      initSets[m.id] = {
        sets: (m.set_scores || [{ team1_games: 0, team2_games: 0 }, { team1_games: 0, team2_games: 0 }]).map(s => ({
          t1: s.team1_games?.toString() || '0',
          t2: s.team2_games?.toString() || '0',
        }))
      };
    });
    setScores(initScores);
    setSets(initSets);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const switchRound = async (roundNum: number) => {
    setActiveRound(roundNum);
    const round = rounds.find(r => r.round_number === roundNum);
    if (round) await loadRoundMatches(round.id);
  };

  const saveScore = async (match: MatchWithPlayers) => {
    const s = scores[match.id];
    if (!s) return;

    const t1 = parseInt(s.team1);
    const t2 = parseInt(s.team2);
    if (isNaN(t1) || isNaN(t2)) return;

    setSaving(prev => ({ ...prev, [match.id]: true }));

    if (tournament?.format === 'regular_sets') {
      const ss = sets[match.id]?.sets || [];
      for (let i = 0; i < ss.length; i++) {
        const set = ss[i];
        const t1g = parseInt(set.t1) || 0;
        const t2g = parseInt(set.t2) || 0;
        if (t1g === 0 && t2g === 0) continue;
        await supabase.from('set_scores').upsert({
          match_id: match.id, set_number: i + 1,
          team1_games: t1g, team2_games: t2g,
        }, { onConflict: 'match_id,set_number' });
      }
    }

    await supabase.from('matches').update({
      team1_score: t1, team2_score: t2, status: 'completed', completed_at: new Date().toISOString(),
    }).eq('id', match.id);

    const round = rounds.find(r => r.round_number === activeRound);
    if (round) await loadRoundMatches(round.id);
    setSaving(prev => ({ ...prev, [match.id]: false }));
  };

  const isRegularSets = tournament?.format === 'regular_sets';

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div>
        <Link href={`/communities/${slug}/tournaments/${id}`} className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-2">← Back to Tournament</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Score Entry</h1>
            <p className="text-slate-500 text-sm">{tournament?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-500 text-sm font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Round tabs */}
      {rounds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rounds.map(r => (
            <button key={r.round_number} onClick={() => switchRound(r.round_number)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeRound === r.round_number ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300'}`}>
              Round {r.round_number}
            </button>
          ))}
        </div>
      )}

      {/* Matches */}
      <div className="space-y-4">
        {matches.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">No matches in this round</div>
        )}
        {matches.map(match => {
          const s = scores[match.id] || { team1: '', team2: '' };
          const isSaved = match.status === 'completed';
          const isSaving = saving[match.id];
          const t1Wins = isSaved && (match.team1_score ?? 0) > (match.team2_score ?? 0);
          const t2Wins = isSaved && (match.team2_score ?? 0) > (match.team1_score ?? 0);

          return (
            <div key={match.id} className={`rounded-2xl p-6 border ${match.is_king_court ? 'border-amber-300 bg-amber-50/30' : isSaved ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
              {match.is_king_court && <div className="text-xs text-amber-600 font-bold mb-3">👑 KING COURT</div>}

              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400 font-medium">Court {match.court_number}</span>
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${isSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                  {isSaved ? '✓ Saved' : '⏳ Pending'}
                </span>
              </div>

              {!isRegularSets ? (
                /* Points-based scoring */
                <div className="flex items-center gap-4 mt-4">
                  <div className={`flex-1 p-4 rounded-xl text-center transition-all ${t1Wins ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`font-bold mb-1 ${t1Wins ? 'text-green-700' : 'text-slate-900'}`}>{match.p1?.name || '?'}</p>
                    <p className="text-sm text-slate-400 mb-3">{match.p2?.name || '?'}</p>
                    <input
                      type="number" min="0" max={tournament?.points_per_game || 32}
                      value={s.team1} onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], team1: e.target.value } }))}
                      disabled={isSaved}
                      className="w-20 h-14 text-center text-3xl font-black bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-400 disabled:opacity-60 mx-auto block transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="text-slate-400 font-bold text-xl shrink-0">VS</div>

                  <div className={`flex-1 p-4 rounded-xl text-center transition-all ${t2Wins ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className={`font-bold mb-1 ${t2Wins ? 'text-green-700' : 'text-slate-900'}`}>{match.p3?.name || '?'}</p>
                    <p className="text-sm text-slate-400 mb-3">{match.p4?.name || '?'}</p>
                    <input
                      type="number" min="0" max={tournament?.points_per_game || 32}
                      value={s.team2} onChange={e => setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id], team2: e.target.value } }))}
                      disabled={isSaved}
                      className="w-20 h-14 text-center text-3xl font-black bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-400 disabled:opacity-60 mx-auto block transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                /* Set-based scoring */
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div className="col-span-2 text-center font-bold text-slate-900">{match.p1?.name?.split(' ')[0]} & {match.p2?.name?.split(' ')[0]}</div>
                    <div className="text-center text-slate-400">Set</div>
                    <div className="col-span-2 text-center font-bold text-slate-900">{match.p3?.name?.split(' ')[0]} & {match.p4?.name?.split(' ')[0]}</div>
                  </div>
                  {(sets[match.id]?.sets || [{ t1: '', t2: '' }, { t1: '', t2: '' }]).map((set, si) => (
                    <div key={si} className="grid grid-cols-5 gap-2 items-center">
                      <input type="number" min="0" max="7" value={set.t1}
                        onChange={e => {
                          const updated = [...(sets[match.id]?.sets || [])];
                          updated[si] = { ...updated[si], t1: e.target.value };
                          setSets(prev => ({ ...prev, [match.id]: { sets: updated } }));
                        }}
                        disabled={isSaved}
                        className="col-span-2 h-12 text-center text-xl font-black bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-400 disabled:opacity-60 transition-colors" placeholder="0" />
                      <div className="text-center text-xs text-slate-400 font-bold">S{si + 1}</div>
                      <input type="number" min="0" max="7" value={set.t2}
                        onChange={e => {
                          const updated = [...(sets[match.id]?.sets || [])];
                          updated[si] = { ...updated[si], t2: e.target.value };
                          setSets(prev => ({ ...prev, [match.id]: { sets: updated } }));
                        }}
                        disabled={isSaved}
                        className="col-span-2 h-12 text-center text-xl font-black bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-sky-400 disabled:opacity-60 transition-colors" placeholder="0" />
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const updated = [...(sets[match.id]?.sets || [])];
                    if (updated.length < 3) { updated.push({ t1: '', t2: '' }); setSets(prev => ({ ...prev, [match.id]: { sets: updated } })); }
                  }} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">+ Add set</button>
                </div>
              )}

              {!isSaved && (
                <button onClick={() => saveScore(match)} disabled={isSaving || (s.team1 === '' && s.team2 === '')}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white rounded-xl font-bold disabled:opacity-40 transition-all">
                  {isSaving ? 'Saving...' : '✓ Save Score'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {matches.every(m => m.status === 'completed') && matches.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-green-700 font-bold mb-2">✅ All scores entered!</p>
          <Link href={`/communities/${slug}/tournaments/${id}`}
            className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold text-sm inline-block">
            Back to Tournament →
          </Link>
        </div>
      )}
    </div>
  );
}
