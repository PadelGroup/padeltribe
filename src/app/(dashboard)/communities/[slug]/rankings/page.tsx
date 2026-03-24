import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AvatarDisplay from '@/components/ui/avatar-display';
import ShareButtonsWrapper from '@/components/ui/share-buttons-wrapper';

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: community } = await supabase.from('communities').select('*').eq('slug', slug).single();
  if (!community) notFound();

  const { data: membership } = await supabase.from('community_members').select('role').eq('community_id', community.id).eq('user_id', user!.id).single();
  if (!membership) notFound();

  const { data: rankings } = await supabase
    .from('community_rankings')
    .select('*, profile:profiles(id, name, avatar_url, avatar_preset, preferred_side)')
    .eq('community_id', community.id)
    .order('ranking_position');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${appUrl}/share/${slug}/rankings`;

  const medals = ['🥇', '🥈', '🥉'];
  const shareText = rankings && rankings.length > 0
    ? [
        `🏓 *${community.name}* — League Standings`,
        '─'.repeat(28),
        ...(rankings || []).slice(0, 10).map((r: { profile?: { name?: string }; total_points: number; matches_won: number; matches_played: number }, i: number) => {
          const m = medals[i] || `${i + 1}.`;
          const wr = r.matches_played > 0 ? Math.round((r.matches_won / r.matches_played) * 100) : 0;
          return `${m} *${r.profile?.name || 'Player'}*  —  ${r.total_points} pts  (${wr}% W)`;
        }),
        '',
        `📲 Full rankings: ${shareUrl}`,
      ].join('\n')
    : `🏓 ${community.name} — No rankings yet`;

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href={`/communities/${slug}`} className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-2">← {community.name}</Link>
          <h1 className="text-3xl font-black text-slate-900">Rankings</h1>
          <p className="text-slate-500 mt-1">{rankings?.length || 0} players ranked</p>
        </div>
        <Link href={shareUrl} target="_blank"
          className="px-4 py-2 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-xl text-sm text-slate-600 flex items-center gap-2 transition-all">
          🔗 Public Link
        </Link>
      </div>

      {/* Share section */}
      <ShareButtonsWrapper text={shareText} shareUrl={shareUrl} label="Share Community Standings" />

      {(!rankings || rankings.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No rankings yet</h2>
          <p className="text-slate-500 max-w-md mx-auto">Rankings are updated automatically after tournaments complete.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {rankings.length >= 2 && (
            <div className="flex items-end justify-center gap-4 py-6">
              {[rankings[1], rankings[0], rankings[2]].map((r, idx) => {
                if (!r) return <div key={idx} className="w-28" />;
                const realIdx = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                const heights = ['h-20', 'h-28', 'h-14'];
                const podiumColors = [
                  'from-slate-200 to-slate-100 border-slate-300 text-slate-600',
                  'from-amber-200 to-amber-100 border-amber-300 text-amber-700',
                  'from-orange-200 to-orange-100 border-orange-300 text-orange-600',
                ];
                return (
                  <div key={r.user_id} className="text-center flex flex-col items-center">
                    {realIdx === 0 && <div className="text-2xl mb-1">👑</div>}
                    <AvatarDisplay
                      avatarUrl={r.profile?.avatar_url}
                      avatarPreset={r.profile?.avatar_preset}
                      name={r.profile?.name || 'P'}
                      size={realIdx === 0 ? 'xl' : 'lg'}
                      className={`mb-2 ${realIdx === 0 ? 'ring-4 ring-amber-400/60 shadow-lg shadow-amber-200' : 'ring-2 ring-slate-200'}`}
                    />
                    <p className="font-bold text-slate-900 text-sm">{r.profile?.name}</p>
                    <p className={`text-sm font-bold ${realIdx === 0 ? 'text-amber-600' : 'text-slate-500'}`}>{r.total_points} pts</p>
                    <div className={`mt-2 w-24 ${heights[realIdx]} bg-gradient-to-b ${podiumColors[realIdx]} border rounded-t-lg flex items-center justify-center`}>
                      <span className="text-2xl font-black">{realIdx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Pts</div>
              <div className="col-span-2 text-center">W/L</div>
              <div className="col-span-2 text-center">Win%</div>
            </div>
            {rankings?.map((r: { user_id: string; ranking_position?: number; total_points: number; matches_won: number; matches_lost: number; matches_played: number; tournaments_played: number; profile?: { name?: string; avatar_url?: string; avatar_preset?: string; preferred_side?: string } }, i: number) => {
              const winRate = r.matches_played > 0 ? Math.round((r.matches_won / r.matches_played) * 100) : 0;
              const isMe = r.user_id === user?.id;
              return (
                <div key={r.user_id} className={`grid grid-cols-12 px-4 py-4 border-b border-slate-100 items-center ${isMe ? 'bg-sky-50' : 'hover:bg-slate-50'} transition-colors`}>
                  <div className="col-span-1 text-center">
                    <span className={`text-sm font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-slate-400'}`}>
                      {r.ranking_position || i + 1}
                    </span>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <AvatarDisplay
                      avatarUrl={r.profile?.avatar_url}
                      avatarPreset={r.profile?.avatar_preset}
                      name={r.profile?.name || 'P'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isMe ? 'text-sky-600' : 'text-slate-900'}`}>
                        {r.profile?.name || 'Player'}{isMe && <span className="text-xs text-sky-400 ml-1">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-400">
                        {r.profile?.preferred_side === 'right' ? '👉 R' : r.profile?.preferred_side === 'left' ? '👈 L' : '🔄'} · {r.tournaments_played}T
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-black text-sky-600">{r.total_points}</div>
                  <div className="col-span-2 text-center text-sm">
                    <span className="text-green-600">{r.matches_won}</span><span className="text-slate-300">/</span><span className="text-red-500">{r.matches_lost}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-10">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-orange-400 rounded-full" style={{ width: `${winRate}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-7">{winRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
