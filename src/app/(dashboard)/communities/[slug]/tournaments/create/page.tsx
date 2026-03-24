'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TOURNAMENT_FORMATS, type TournamentFormat } from '@/types';

export default function CreateTournamentPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [communityId, setCommunityId] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('americano');
  const [maxPlayers, setMaxPlayers] = useState<string>('');
  const [pointsPerGame, setPointsPerGame] = useState(32);
  const [setsToWin, setSetsToWin] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('communities').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setCommunityId(data.id);
    });
  }, [slug]);

  const selectedFormat = TOURNAMENT_FORMATS.find(f => f.value === format)!;
  const isPointsBased = !['regular_sets'].includes(format);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { data, error } = await supabase.from('tournaments').insert({
      community_id: communityId,
      name, format,
      max_players: maxPlayers ? parseInt(maxPlayers) : null,
      points_per_game: isPointsBased ? pointsPerGame : 6,
      sets_to_win: setsToWin,
      created_by: user.id,
    }).select().single();

    if (error) { setError(error.message); setLoading(false); return; }
    router.push(`/communities/${slug}/tournaments/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 lg:pt-0">
      <div className="mb-8">
        <Link href={`/communities/${slug}`} className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-4">← Back</Link>
        <h1 className="text-3xl font-black text-slate-900">Create Tournament</h1>
        <p className="text-slate-500 mt-1">Set up your padel tournament</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tournament Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Saturday League Week 3"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
        </div>

        {/* Format */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">Tournament Format *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOURNAMENT_FORMATS.map(f => (
              <button key={f.value} type="button" onClick={() => setFormat(f.value)}
                className={`p-4 rounded-xl text-left transition-all border ${format === f.value
                  ? 'border-sky-400 bg-sky-50 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{f.emoji}</span>
                  <span className="font-semibold text-sm">{f.label}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                <p className="text-xs text-sky-600 mt-1">Min {f.minPlayers} players</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-slate-900">Settings</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Players (optional)</label>
            <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} min={selectedFormat.minPlayers} placeholder="Unlimited"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
          </div>

          {isPointsBased ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Points per Game</label>
              <div className="flex gap-3">
                {[16, 24, 32, 40].map(p => (
                  <button key={p} type="button" onClick={() => setPointsPerGame(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${pointsPerGame === p ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total points played per match</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sets to Win</label>
              <div className="flex gap-3">
                {[2, 3].map(s => (
                  <button key={s} type="button" onClick={() => setSetsToWin(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${setsToWin === s ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Best of {s * 2 - 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading || !name || !communityId}
          className="w-full py-4 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-all">
          {loading ? 'Creating...' : `Create ${selectedFormat.emoji} ${selectedFormat.label} Tournament →`}
        </button>
      </form>
    </div>
  );
}
