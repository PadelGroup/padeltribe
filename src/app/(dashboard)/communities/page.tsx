import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase
    .from('community_members')
    .select('*, community:communities(*)')
    .eq('user_id', user!.id)
    .order('joined_at', { ascending: false });

  const communities = memberships?.map(m => ({ ...m.community, role: m.role })) || [];

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Communities</h1>
          <p className="text-slate-500 mt-1">Manage your padel communities</p>
        </div>
        <Link href="/communities/create" className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-medium transition-all">
          + New Community
        </Link>
      </div>

      {communities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🏓</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No communities yet</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Create your first padel community and start inviting players!</p>
          <Link href="/communities/create" className="px-8 py-4 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold text-lg inline-block hover:from-sky-400 hover:to-orange-400 transition-all">
            Create Your Community
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {communities.map((c: { id: string; name: string; slug: string; description?: string; color: string; role: string }) => (
            <Link key={c.id} href={`/communities/${c.slug}`} className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md rounded-2xl p-6 block group transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `linear-gradient(135deg, ${c.color}30, ${c.color}10)`, border: `1px solid ${c.color}40` }}>
                  🏓
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-sky-600 transition-colors leading-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">copadel.com/{c.slug}</p>
                </div>
              </div>
              {c.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{c.description}</p>}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${c.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-sky-50 text-sky-600 border border-sky-200'}`}>
                  {c.role === 'admin' ? '👑 Admin' : '🎾 Player'}
                </span>
                <span className="text-sky-500 text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
