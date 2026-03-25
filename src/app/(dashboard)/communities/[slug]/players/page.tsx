'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { generateInviteUrl } from '@/lib/utils';
import AvatarDisplay from '@/components/ui/avatar-display';
import PlayerLevelBadge from '@/components/ui/player-level-badge';
import LevelPicker from '@/components/ui/level-picker';
import type { CommunityMember, Community } from '@/types';

export default function PlayersPage() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingLevel, setEditingLevel] = useState<string | null>(null); // member.id being edited

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: comm } = await supabase.from('communities').select('*').eq('slug', slug).single();
    if (!comm) return;
    setCommunity(comm);
    const { data: myMembership } = await supabase.from('community_members').select('role').eq('community_id', comm.id).eq('user_id', user.id).single();
    setIsAdmin(myMembership?.role === 'admin');
    const { data: membersData } = await supabase.from('community_members')
      .select('*, profile:profiles(id, name, phone, avatar_url, avatar_preset, preferred_side, gender, level)')
      .eq('community_id', comm.id).order('joined_at');
    setMembers((membersData || []) as CommunityMember[]);
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateInvite = async () => {
    if (!community || !isAdmin) return;
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('invites').insert({ community_id: community.id, created_by: user!.id }).select().single();
    if (data) setInviteUrl(generateInviteUrl(data.token));
    setGenerating(false);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removePlayer = async (memberId: string) => {
    if (!confirm('Remove this player from the community?')) return;
    await supabase.from('community_members').delete().eq('id', memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const updatePlayerLevel = async (userId: string, newLevel: number) => {
    await supabase.from('profiles').update({ level: newLevel }).eq('id', userId);
    setMembers(prev => prev.map(m =>
      m.user_id === userId
        ? { ...m, profile: { ...m.profile!, level: newLevel } as typeof m.profile }
        : m
    ));
    setEditingLevel(null);
  };

  const sideLabel = (side?: string) => {
    if (!side || side === 'both') return { icon: '🔄', label: 'Both' };
    if (side === 'right') return { icon: '👉', label: 'Right' };
    return { icon: '👈', label: 'Left' };
  };

  if (loading) return <div className="pt-16 lg:pt-0 flex items-center justify-center min-h-64"><div className="text-4xl animate-pulse">🏓</div></div>;

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/communities/${slug}`} className="text-[#616161] hover:text-[#1A1A1A] text-sm flex items-center gap-1 mb-2">← {community?.name}</Link>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Players</h1>
          <p className="text-[#616161]">{members.length} members</p>
        </div>
      </div>

      {/* Invite Section */}
      {isAdmin && (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">Invite Players</h2>
          <p className="text-[#616161] text-sm mb-4">Share an invite link — players register and set their level when joining.</p>
          {inviteUrl ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input readOnly value={inviteUrl}
                  className="flex-1 px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#616161] text-sm" />
                <button onClick={copyInvite}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[#F97316] text-white hover:bg-[#EA6C10]'}`}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <div className="flex gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Join our padel community on CoPadel! ${inviteUrl}`)}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bf5a] rounded-xl text-white text-sm font-semibold transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Join our padel community on CoPadel!')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] rounded-xl text-white text-sm font-semibold transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              </div>
              <button onClick={() => { setInviteUrl(''); generateInvite(); }} className="text-sm text-[#616161] hover:text-[#1A1A1A]">Generate new link</button>
            </div>
          ) : (
            <button onClick={generateInvite} disabled={generating}
              className="px-6 py-3 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold disabled:opacity-50 transition-all">
              {generating ? 'Generating...' : '🔗 Generate Invite Link'}
            </button>
          )}
        </div>
      )}

      {/* Members List */}
      <div>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">Members</h2>
        <div className="space-y-2">
          {members.map(member => {
            const side = sideLabel((member.profile as { preferred_side?: string })?.preferred_side);
            const memberLevel = (member.profile as { level?: number })?.level;
            const isEditingThisMember = editingLevel === member.id;

            return (
              <div key={member.id} className="bg-white border border-[#E8E4DF] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <AvatarDisplay
                    avatarUrl={(member.profile as { avatar_url?: string })?.avatar_url}
                    avatarPreset={(member.profile as { avatar_preset?: string })?.avatar_preset}
                    name={member.profile?.name || 'P'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#1A1A1A] truncate">{member.profile?.name || 'Unknown'}</p>
                      <PlayerLevelBadge level={memberLevel} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs text-[#9CA3AF]">{member.profile?.phone || '—'}</span>
                      <span className="text-xs text-[#D1D5DB]">·</span>
                      <span className="text-xs text-[#616161]">{side.icon} {side.label}</span>
                      {(member.profile as { gender?: string })?.gender && (
                        <>
                          <span className="text-xs text-[#D1D5DB]">·</span>
                          <span className="text-xs text-[#9CA3AF] capitalize">{(member.profile as { gender?: string }).gender}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${member.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-[#FFF4EC] text-[#F97316] border border-[#FDBA74]'}`}>
                      {member.role === 'admin' ? '👑 Admin' : 'Player'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setEditingLevel(isEditingThisMember ? null : member.id)}
                        className="p-1.5 text-[#9CA3AF] hover:text-[#F97316] hover:bg-[#FFF4EC] rounded-lg transition-all text-xs font-medium"
                        title="Edit level"
                      >
                        {isEditingThisMember ? '✕' : '🎯'}
                      </button>
                    )}
                    {isAdmin && member.role !== 'admin' && (
                      <button onClick={() => removePlayer(member.id)} className="p-1.5 text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">✕</button>
                    )}
                  </div>
                </div>

                {/* Admin level editor */}
                {isEditingThisMember && (
                  <div className="mt-4 pt-4 border-t border-[#E8E4DF]">
                    <p className="text-xs font-medium text-[#616161] mb-3">Set player level:</p>
                    <LevelPicker
                      value={memberLevel}
                      onChange={(newLevel) => updatePlayerLevel(member.user_id, newLevel)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
