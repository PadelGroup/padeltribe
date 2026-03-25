import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: memberships } = await supabase
    .from('community_members')
    .select('*, community:communities(*)')
    .eq('user_id', user!.id);

  const communities = memberships?.map(m => m.community) || [];
  const adminCommunities = memberships?.filter(m => m.role === 'admin').map(m => m.community) || [];

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-1">
          Hey, {profile?.name?.split(' ')[0] || 'Player'} 👋
        </h1>
        <p className="text-slate-500">Welcome back to CoPadel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Communities', value: communities.length, emoji: '👥', color: 'from-sky-100 to-sky-50 border-sky-200' },
          { label: 'Admin Of', value: adminCommunities.length, emoji: '👑', color: 'from-amber-100 to-amber-50 border-amber-200' },
          { label: 'Tournaments', value: '—', emoji: '🏆', color: 'from-orange-100 to-orange-50 border-orange-200' },
          { label: 'Ranking', value: '—', emoji: '📊', color: 'from-sky-100 to-white border-sky-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{stat.emoji}</div>
            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Communities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Your Communities</h2>
          <Link href="/communities/create" className="px-4 py-2 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl text-sm font-medium transition-all">
            + New Community
          </Link>
        </div>
        {communities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🏓</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No communities yet</h3>
            <p className="text-slate-500 mb-6">Create your first community or join one via an invite link</p>
            <Link href="/communities/create" className="px-6 py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold inline-block">
              Create Community
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community: { id: string; name: string; slug: string; description?: string; color: string }) => (
              <Link key={community.id} href={`/communities/${community.slug}`}
                className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md rounded-2xl p-6 block group transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${community.color}30, ${community.color}15)`, border: `1px solid ${community.color}40` }}>
                    🏓
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{community.name}</h3>
                    <p className="text-xs text-slate-400">/{community.slug}</p>
                  </div>
                </div>
                {community.description && <p className="text-sm text-slate-500 line-clamp-2">{community.description}</p>}
                <div className="mt-4 flex gap-2">
                  {adminCommunities.some((c: { id: string }) => c.id === community.id) && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-lg border border-amber-200">👑 Admin</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
