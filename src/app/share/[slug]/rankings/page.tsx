import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AvatarDisplay from '@/components/ui/avatar-display';
import ShareButtonsWrapper from '@/components/ui/share-buttons-wrapper';

export default async function PublicRankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase.from('communities').select('*').eq('slug', slug).single();
  if (!community) notFound();

  const { data: rankings } = await supabase
    .from('community_rankings')
    .select('*, profile:profiles(id, name, avatar_url, avatar_preset, preferred_side)')
    .eq('community_id', community.id)
    .order('ranking_position');

  const medals = ['🥇', '🥈', '🥉'];

  const shareText = rankings && rankings.length > 0
    ? [
        `🏓 *${community.name}* — League Standings`,
        '─'.repeat(28),
        ...rankings.slice(0, 10).map((r: { profile?: { name?: string }; total_points: number; matches_won: number; matches_played: number }, i: number) => {
          const m = medals[i] || `${i + 1}.`;
          const wr = r.matches_played > 0 ? Math.round((r.matches_won / r.matches_played) * 100) : 0;
          return `${m} *${r.profile?.name || 'Player'}*  —  ${r.total_points} pts  (${wr}% W)`;
        }),
        '',
        `📲 View full rankings: ${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/rankings`,
      ].join('\n')
    : `🏓 ${community.name} — No rankings yet`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏓</span>
            <span className="font-bold gradient-text">PadelTribe</span>
          </Link>
          <span className="text-xs text-slate-400">Public standings</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Community header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
            style={{ background: `linear-gradient(135deg, ${community.color}30, ${community.color}15)`, border: `1px solid ${community.color}40` }}>
            🏓
          </div>
          <h1 className="text-2xl font-black text-slate-900">{community.name}</h1>
          <p className="text-slate-500">Community Rankings · {rankings?.length || 0} players</p>
        </div>

        {/* Share buttons */}
        <ShareButtonsWrapper
          text={shareText}
          shareUrl={`${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}/rankings`}
          label="Share Standings"
        />

        {/* No rankings yet */}
        {(!rankings || rankings.length === 0) ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-slate-900 font-bold mb-1">No rankings yet</p>
            <p className="text-slate-500 text-sm">Rankings appear after tournaments are completed</p>
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            <div className="flex items-end justify-center gap-4 py-4">
              {[rankings[1], rankings[0], rankings[2]].map((r, idx) => {
                if (!r) return <div key={idx} className="w-28" />;
                const realIdx = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                const heights = ['h-20', 'h-28', 'h-14'];
                const colors = [
                  'from-slate-200 to-slate-100 border-slate-300 text-slate-600',
                  'from-amber-200 to-amber-100 border-amber-300 text-amber-700',
                  'from-orange-200 to-orange-100 border-orange-300 text-orange-600',
                ];
                return (
                  <div key={r.user_id} className="text-center flex flex-col items-center">
                    <AvatarDisplay avatarUrl={r.profile?.avatar_url} avatarPreset={r.profile?.avatar_preset} name={r.profile?.name || 'P'} size={realIdx === 0 ? 'xl' : 'lg'}
                      className={`mb-2 ${realIdx === 0 ? 'ring-4 ring-amber-400/60 shadow-lg shadow-amber-200' : 'ring-2 ring-slate-200'}`} />
                    <p className="font-bold text-slate-900 text-sm">{r.profile?.name}</p>
                    <p className={`text-sm font-bold ${realIdx === 0 ? 'text-amber-600' : 'text-slate-500'}`}>{r.total_points} pts</p>
                    <div className={`mt-2 w-24 ${heights[realIdx]} bg-gradient-to-b ${colors[realIdx]} border rounded-t-lg flex items-center justify-center`}>
                      <span className="text-2xl font-black">{realIdx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-12 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Player</div>
                <div className="col-span-2 text-center">Pts</div>
                <div className="col-span-2 text-center">W/L</div>
                <div className="col-span-2 text-center">Win%</div>
              </div>
              {rankings.map((r: { user_id: string; ranking_position?: number; total_points: number; matches_won: number; matches_lost: number; matches_played: number; profile?: { name?: string; avatar_url?: string; avatar_preset?: string; preferred_side?: string } }, i: number) => {
                const winRate = r.matches_played > 0 ? Math.round((r.matches_won / r.matches_played) * 100) : 0;
                return (
                  <div key={r.user_id} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors">
                    <div className="col-span-1">
                      <span className={`text-sm font-black ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-slate-400'}`}>{i + 1}</span>
                    </div>
                    <div className="col-span-5 flex items-center gap-2">
                      <AvatarDisplay avatarUrl={r.profile?.avatar_url} avatarPreset={r.profile?.avatar_preset} name={r.profile?.name || 'P'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.profile?.name || 'Player'}</p>
                        {r.profile?.preferred_side && r.profile.preferred_side !== 'both' && (
                          <p className="text-xs text-slate-400">{r.profile.preferred_side === 'right' ? '👉 Right' : '👈 Left'}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-black text-sky-600">{r.total_points}</div>
                    <div className="col-span-2 text-center text-sm">
                      <span className="text-green-600">{r.matches_won}</span><span className="text-slate-300">/</span><span className="text-red-500">{r.matches_lost}</span>
                    </div>
                    <div className="col-span-2 text-center text-xs text-slate-400">{winRate}%</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Join CTA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
          <p className="text-slate-500 text-sm mb-3">Want to join this community?</p>
          <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold text-sm inline-block hover:from-sky-400 hover:to-orange-400 transition-all">
            Join PadelTribe
          </Link>
        </div>
      </div>
    </div>
  );
}
