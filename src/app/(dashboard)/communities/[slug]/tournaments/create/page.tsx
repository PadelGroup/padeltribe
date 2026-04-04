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
  const [rankingPriority, setRankingPriority] = useState<'points_first' | 'wins_first'>('points_first');
  const [startDate, setStartDate] = useState('');
  const [venueUrl, setVenueUrl] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('communities').select('id').eq('slug', slug).single().then(({ data }) => {
      if (data) setCommunityId(data.id);
    });
  }, [slug]);

  const selectedFormat = TOURNAMENT_FORMATS.find(f => f.value === format)!;
  const isPointsBased = !['regular_sets'].includes(format);
  const hasRankingPriority = ['americano', 'team_americano', 'mexicano', 'team_mexicano', 'mix_americano', 'mix_mexicano', 'king_of_court'].includes(format);

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
      ranking_priority: hasRankingPriority ? rankingPriority : 'points_first',
      created_by: user.id,
      start_date: startDate || null,
      venue_url: venueUrl.trim() || null,
      price_per_person: pricePerPerson ? parseFloat(pricePerPerson) : null,
    }).select().single();

    if (error) { setError(error.message); setLoading(false); return; }
    router.push(`/communities/${slug}/tournaments/${data.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 lg:pt-0">
      <div className="mb-8">
        <Link href={`/communities/${slug}`} className="text-[#616161] hover:text-[#1A1A1A] text-sm flex items-center gap-1 mb-4">← Back</Link>
        <h1 className="text-3xl font-black text-[#1A1A1A]">Create Tournament</h1>
        <p className="text-[#616161] mt-1">Set up your padel tournament</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <label className="block text-sm font-medium text-[#616161] mb-2">Tournament Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Saturday League Week 3"
            className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-slate-400 focus:border-[#F97316] transition-colors" />
        </div>

        {/* Format */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <label className="block text-sm font-medium text-[#616161] mb-4">Tournament Format *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOURNAMENT_FORMATS.map(f => (
              <button key={f.value} type="button" onClick={() => setFormat(f.value)}
                className={`p-4 rounded-xl text-left transition-all border ${format === f.value
                  ? 'border-[#F97316] bg-[#FFF4EC] text-[#1A1A1A]'
                  : 'border-[#E8E4DF] bg-white text-[#616161] hover:border-[#FDBA74] hover:bg-[#FFF4EC]/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{f.emoji}</span>
                  <span className="font-semibold text-sm">{f.label}</span>
                </div>
                <p className="text-xs text-[#616161] leading-relaxed">{f.description}</p>
                <p className="text-xs text-[#F97316] mt-1">Min {f.minPlayers} players</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-[#1A1A1A]">Settings</h3>

          <div>
            <label className="block text-sm font-medium text-[#616161] mb-2">Max Players (optional)</label>
            <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} min={selectedFormat.minPlayers} placeholder="Unlimited"
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-slate-400 focus:border-[#F97316] transition-colors" />
          </div>

          {isPointsBased ? (
            <div>
              <label className="block text-sm font-medium text-[#616161] mb-2">Points per Game</label>
              <div className="flex gap-3">
                {[16, 24, 32, 40].map(p => (
                  <button key={p} type="button" onClick={() => setPointsPerGame(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${pointsPerGame === p ? 'bg-[#F97316] text-white' : 'bg-[#F5F2EE] text-[#616161] hover:bg-[#E8E4DF]'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total points played per match</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[#616161] mb-2">Sets to Win</label>
              <div className="flex gap-3">
                {[2, 3].map(s => (
                  <button key={s} type="button" onClick={() => setSetsToWin(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${setsToWin === s ? 'bg-[#F97316] text-white' : 'bg-[#F5F2EE] text-[#616161] hover:bg-[#E8E4DF]'}`}>
                    Best of {s * 2 - 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          {hasRankingPriority && (
            <div>
              <label className="block text-sm font-medium text-[#616161] mb-2">Ranking Priority</label>
              <p className="text-xs text-[#9CA3AF] mb-3">When two players are tied, what decides the winner?</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRankingPriority('points_first')}
                  className={`p-4 rounded-xl text-left transition-all border ${rankingPriority === 'points_first' ? 'border-[#F97316] bg-[#FFF4EC]' : 'border-[#E8E4DF] bg-white hover:border-[#FDBA74]'}`}>
                  <div className="text-lg mb-1">🎯</div>
                  <div className="font-semibold text-sm text-[#1A1A1A]">Points First</div>
                  <div className="text-xs text-[#616161] mt-0.5">Rank by total points scored. Wins only count as tiebreaker.</div>
                </button>
                <button type="button" onClick={() => setRankingPriority('wins_first')}
                  className={`p-4 rounded-xl text-left transition-all border ${rankingPriority === 'wins_first' ? 'border-[#F97316] bg-[#FFF4EC]' : 'border-[#E8E4DF] bg-white hover:border-[#FDBA74]'}`}>
                  <div className="text-lg mb-1">🏆</div>
                  <div className="font-semibold text-sm text-[#1A1A1A]">Wins First</div>
                  <div className="text-xs text-[#616161] mt-0.5">Rank by number of wins. Points only count as tiebreaker.</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date, Venue & Price */}
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-[#1A1A1A]">Date, Venue & Cost <span className="text-[#9CA3AF] font-normal text-sm">(optional)</span></h3>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Date & Time</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] focus:border-[#F97316] transition-colors text-sm" />
            <p className="text-xs text-[#9CA3AF] mt-1">When the tournament is scheduled to start</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Google Maps link</label>
            <input type="url" value={venueUrl} onChange={e => setVenueUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors text-sm" />
            <p className="text-xs text-[#9CA3AF] mt-1">Paste a Google Maps URL so players can find the venue</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Price per person</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-medium">$</span>
              <input type="number" value={pricePerPerson} onChange={e => setPricePerPerson(e.target.value)}
                min="0" step="0.01" placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">Leave empty if the tournament is free</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

        <button type="submit" disabled={loading || !name || !communityId}
          className="w-full py-4 bg-gradient-to-r from-[#F97316] to-[#EA6C10] hover:from-[#EA6C10] hover:to-[#DC6009] text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-all">
          {loading ? 'Creating...' : `Create ${selectedFormat.emoji} ${selectedFormat.label} Tournament →`}
        </button>
      </form>
    </div>
  );
}
