import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommunityLogoDisplay from '@/components/ui/community-logo-display';

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: community } = await supabase.from('communities').select('*').eq('slug', slug).single();
  if (!community) notFound();

  const { data: membership } = await supabase.from('community_members').select('role').eq('community_id', community.id).eq('user_id', user!.id).single();
  if (!membership) notFound();

  const isAdmin = membership.role === 'admin';

  const { data: members } = await supabase.from('community_members').select('*, profile:profiles(*)').eq('community_id', community.id);
  const { data: tournaments } = await supabase.from('tournaments').select('*').eq('community_id', community.id).order('created_at', { ascending: false }).limit(5);
  const { data: rankings } = await supabase.from('community_rankings').select('*, profile:profiles(name, avatar_url)').eq('community_id', community.id).order('ranking_position').limit(5);

  const activeTournaments = tournaments?.filter(t => t.status === 'active') || [];
  const recentTournaments = tournaments?.filter(t => t.status !== 'active') || [];

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-center gap-4">
          <CommunityLogoDisplay
            logoUrl={community.logo_url}
            logoPreset={community.logo_preset}
            name={community.name}
            color={community.color}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A]">{community.name}</h1>
            <p className="text-[#616161]">{members?.length || 0} members • {isAdmin ? '👑 You are admin' : '🎾 Player'}</p>
            {(community.city || community.country || community.club_name) && (
              <p className="text-sm text-[#9CA3AF] mt-0.5">
                {[community.club_name, community.city, community.country].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/communities/${slug}/players`}
            className="px-4 py-2 bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:bg-[#FFF4EC] rounded-xl text-sm font-medium text-[#616161] transition-all">
            👥 Players
          </Link>
          {isAdmin && (
            <>
              <Link href={`/communities/${slug}/tournaments/create`}
                className="px-4 py-2 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl text-sm font-medium transition-all">
                + Tournament
              </Link>
              <Link href={`/communities/${slug}/settings`}
                className="px-4 py-2 bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:bg-[#FFF4EC] rounded-xl text-sm font-medium text-[#616161] transition-all">
                ⚙️ Settings
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">🔴 Live Now</h2>
          <div className="space-y-3">
            {activeTournaments.map((t: { id: string; name: string; format: string; status: string }) => (
              <Link key={t.id} href={`/communities/${slug}/tournaments/${t.id}`}
                className="bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:shadow-md rounded-2xl p-5 flex items-center justify-between group transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-bold text-[#1A1A1A] group-hover:text-[#F97316] transition-colors">{t.name}</p>
                    <p className="text-sm text-[#616161] capitalize">{t.format.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-[#F97316] group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Nav */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Quick Access</h2>
          {[
            { href: `/communities/${slug}/tournaments`, label: 'Tournaments', desc: `${tournaments?.length || 0} total`, emoji: '🏆' },
            { href: `/communities/${slug}/rankings`, label: 'Rankings', desc: `${members?.length || 0} players ranked`, emoji: '📊' },
            { href: `/communities/${slug}/players`, label: 'Players', desc: `${members?.length || 0} members`, emoji: '👥' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:shadow-sm rounded-xl p-4 flex items-center justify-between group transition-all">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="font-medium text-[#1A1A1A] group-hover:text-[#F97316] transition-colors">{item.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{item.desc}</p>
                </div>
              </div>
              <span className="text-[#9CA3AF] group-hover:text-[#F97316] group-hover:translate-x-1 transition-all">→</span>
            </Link>
          ))}
        </div>

        {/* Top Rankings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Top Players</h2>
            <Link href={`/communities/${slug}/rankings`} className="text-[#F97316] text-sm hover:text-[#EA6C10]">See all →</Link>
          </div>
          <div className="space-y-2">
            {(rankings || []).length === 0 ? (
              <div className="bg-white border border-[#E8E4DF] rounded-xl p-6 text-center text-[#9CA3AF] text-sm">
                No rankings yet — complete tournaments to see results
              </div>
            ) : (
              rankings?.map((r: { user_id: string; total_points: number; matches_played: number; ranking_position?: number; profile?: { name?: string; avatar_url?: string } }, i: number) => (
                <div key={r.user_id} className="bg-white border border-[#E8E4DF] rounded-xl p-3 flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black
                    ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-[#F5F2EE] text-[#616161]' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-[#F9F7F5] text-[#9CA3AF]'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] text-sm truncate">{r.profile?.name || 'Player'}</p>
                    <p className="text-xs text-[#9CA3AF]">{r.matches_played} matches</p>
                  </div>
                  <span className="text-[#F97316] font-bold text-sm">{r.total_points} pts</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Tournaments */}
      {recentTournaments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Recent Tournaments</h2>
            <Link href={`/communities/${slug}/tournaments`} className="text-[#F97316] text-sm hover:text-[#EA6C10]">See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentTournaments.slice(0, 4).map((t: { id: string; name: string; format: string; status: string; created_at: string }) => (
              <Link key={t.id} href={`/communities/${slug}/tournaments/${t.id}`}
                className="bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:shadow-sm rounded-xl p-4 flex items-center justify-between group transition-all">
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm group-hover:text-[#F97316] transition-colors">{t.name}</p>
                  <p className="text-xs text-[#9CA3AF] capitalize mt-0.5">{t.format.replace(/_/g, ' ')} • <span className={t.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>{t.status}</span></p>
                </div>
                <span className="text-[#9CA3AF] group-hover:text-[#F97316] transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
