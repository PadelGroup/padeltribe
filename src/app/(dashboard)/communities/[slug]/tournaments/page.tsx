import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOURNAMENT_FORMATS } from '@/types';

const STATUS_CONFIG = {
  registration: { label: 'Registration', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  active: { label: '🔴 Live', color: 'text-red-600 bg-red-50 border-red-200' },
  completed: { label: '✓ Completed', color: 'text-green-600 bg-green-50 border-green-200' },
};

export default async function TournamentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: community } = await supabase.from('communities').select('*').eq('slug', slug).single();
  if (!community) notFound();

  const { data: membership } = await supabase.from('community_members').select('role').eq('community_id', community.id).eq('user_id', user!.id).single();
  if (!membership) notFound();
  const isAdmin = membership.role === 'admin';

  const { data: tournaments } = await supabase.from('tournaments').select('*').eq('community_id', community.id).order('created_at', { ascending: false });

  // Count players per tournament
  const { data: playerCounts } = await supabase.from('tournament_players').select('tournament_id').in('tournament_id', (tournaments || []).map(t => t.id));
  const countMap = (playerCounts || []).reduce((acc: Record<string, number>, p: { tournament_id: string }) => {
    acc[p.tournament_id] = (acc[p.tournament_id] || 0) + 1; return acc;
  }, {});

  const byStatus = {
    active: (tournaments || []).filter(t => t.status === 'active'),
    registration: (tournaments || []).filter(t => t.status === 'registration'),
    completed: (tournaments || []).filter(t => t.status === 'completed'),
  };

  const renderTournament = (t: { id: string; name: string; format: string; status: string; points_per_game: number; max_players?: number }) => {
    const fmt = TOURNAMENT_FORMATS.find(f => f.value === t.format);
    const playerCount = countMap[t.id] || 0;
    const statusCfg = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG];
    return (
      <Link key={t.id} href={`/communities/${slug}/tournaments/${t.id}`}
        className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md rounded-2xl p-5 flex items-center justify-between group transition-all">
        <div className="flex items-center gap-4">
          <div className="text-2xl">{fmt?.emoji || '🏆'}</div>
          <div>
            <p className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{t.name}</p>
            <p className="text-sm text-slate-500">{fmt?.label} • {playerCount}/{t.max_players || '∞'} players</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${statusCfg?.color}`}>{statusCfg?.label}</span>
          <span className="text-slate-400 group-hover:text-sky-500 transition-colors">→</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/communities/${slug}`} className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-2">← {community.name}</Link>
          <h1 className="text-2xl font-black text-slate-900">Tournaments</h1>
          <p className="text-slate-500">{tournaments?.length || 0} total</p>
        </div>
        {isAdmin && (
          <Link href={`/communities/${slug}/tournaments/create`}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-medium transition-all">
            + New Tournament
          </Link>
        )}
      </div>

      {(!tournaments || tournaments.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No tournaments yet</h2>
          {isAdmin ? (
            <>
              <p className="text-slate-500 mb-8">Create your first tournament and invite players!</p>
              <Link href={`/communities/${slug}/tournaments/create`} className="px-8 py-4 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold text-lg inline-block">Create Tournament</Link>
            </>
          ) : (
            <p className="text-slate-500">The admin hasn&apos;t created any tournaments yet.</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {byStatus.active.length > 0 && (
            <div><h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Live Now</h2>
              <div className="space-y-3">{byStatus.active.map(renderTournament)}</div></div>
          )}
          {byStatus.registration.length > 0 && (
            <div><h2 className="font-bold text-slate-900 mb-3">📋 Registration Open</h2>
              <div className="space-y-3">{byStatus.registration.map(renderTournament)}</div></div>
          )}
          {byStatus.completed.length > 0 && (
            <div><h2 className="font-bold text-slate-900 mb-3">✅ Completed</h2>
              <div className="space-y-3">{byStatus.completed.map(renderTournament)}</div></div>
          )}
        </div>
      )}
    </div>
  );
}
