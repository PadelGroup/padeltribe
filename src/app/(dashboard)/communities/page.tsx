import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import CommunityLogoDisplay from '@/components/ui/community-logo-display';

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
          <h1 className="text-3xl font-black text-[#1A1A1A]">Communities</h1>
          <p className="text-[#616161] mt-1">Manage your padel communities</p>
        </div>
        <Link href="/communities/create" className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-medium transition-all">
          + New Community
        </Link>
      </div>

      {communities.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🏓</div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">No communities yet</h2>
          <p className="text-[#616161] mb-8 max-w-md mx-auto">Create your first padel community and start inviting players!</p>
          <Link href="/communities/create" className="px-8 py-4 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold text-lg inline-block transition-all">
            Create Your Community
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {communities.map((c: { id: string; name: string; slug: string; description?: string; color: string; logo_url?: string; logo_preset?: string; role: string }) => (
            <Link key={c.id} href={`/communities/${c.slug}`} className="bg-white border border-[#E8E4DF] hover:border-[#F97316]/40 hover:shadow-md rounded-2xl p-6 block group transition-all">
              <div className="flex items-start gap-4 mb-4">
                <CommunityLogoDisplay
                  logoUrl={c.logo_url}
                  logoPreset={c.logo_preset}
                  name={c.name}
                  color={c.color}
                  size="md"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1A1A1A] text-lg group-hover:text-[#F97316] transition-colors leading-tight">{c.name}</h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">copadel.com/{c.slug}</p>
                </div>
              </div>
              {c.description && <p className="text-sm text-[#616161] mb-4 line-clamp-2">{c.description}</p>}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${c.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-[#FFF4EC] text-[#F97316] border border-[#FDBA74]'}`}>
                  {c.role === 'admin' ? '👑 Admin' : '🎾 Player'}
                </span>
                <span className="text-[#F97316] text-sm group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
