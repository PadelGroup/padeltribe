import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const SUPER_ADMIN_EMAIL = 'dimashevch@gmail.com';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only allow the owner
  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    redirect('/dashboard');
  }

  // Fetch all communities with admin info
  const { data: communities } = await supabase
    .from('communities')
    .select('*, admin:profiles!communities_admin_id_fkey(id, name, email)')
    .order('created_at', { ascending: false });

  // Fetch all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch member counts per community
  const { data: memberCounts } = await supabase
    .from('community_members')
    .select('community_id');

  const countMap: Record<string, number> = {};
  memberCounts?.forEach(m => {
    countMap[m.community_id] = (countMap[m.community_id] || 0) + 1;
  });

  return (
    <div className="space-y-10 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
          🛡️
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm">Full visibility across PadelTribe</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-sky-100 to-sky-50 border border-sky-200 rounded-2xl p-6">
          <div className="text-3xl mb-1">👥</div>
          <div className="text-4xl font-black text-slate-900">{profiles?.length ?? 0}</div>
          <div className="text-sm text-slate-500 mt-1">Total Users</div>
        </div>
        <div className="bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 rounded-2xl p-6">
          <div className="text-3xl mb-1">🏘️</div>
          <div className="text-4xl font-black text-slate-900">{communities?.length ?? 0}</div>
          <div className="text-sm text-slate-500 mt-1">Communities</div>
        </div>
      </div>

      {/* All Communities */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">All Communities</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Community</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden sm:table-cell">Admin</th>
                <th className="text-center px-5 py-3 font-semibold text-slate-600">Members</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {communities?.map((c: {
                id: string; name: string; slug: string; color: string; created_at: string;
                admin?: { name?: string; email?: string } | null;
              }) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}>
                        🏓
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-slate-400 text-xs">/{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="text-slate-700">{c.admin?.name || '—'}</div>
                    <div className="text-slate-400 text-xs">{c.admin?.email || ''}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-medium border border-sky-200">
                      {countMap[c.id] || 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 hidden md:table-cell text-xs">
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/communities/${c.slug}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {!communities?.length && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No communities yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Users */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">All Users</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">User</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.map((p: {
                id: string; name?: string; email?: string; phone?: string; avatar_url?: string; created_at: string;
              }) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.name || ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(p.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900">{p.name || '(no name)'}</span>
                      {p.email === SUPER_ADMIN_EMAIL && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs rounded border border-amber-200">Owner</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 hidden sm:table-cell">{p.email || '—'}</td>
                  <td className="px-5 py-4 text-slate-500 hidden md:table-cell">{p.phone || '—'}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell">
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {!profiles?.length && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
