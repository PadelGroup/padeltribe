'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import CommunityLogoDisplay from '@/components/ui/community-logo-display';

type Step = 'loading' | 'view' | 'login' | 'requested' | 'already_member' | 'error';

export default function PublicJoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [community, setCommunity] = useState<{
    id: string; name: string; slug: string; description?: string; color: string;
    logo_url?: string; logo_preset?: string; country?: string; city?: string; club_name?: string;
    whatsapp_url?: string; telegram_url?: string; instagram_url?: string; facebook_url?: string; website_url?: string;
  } | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: comm } = await supabase.from('communities').select('*').eq('slug', slug).eq('is_public', true).single();
      if (!comm) { setStep('error'); return; }
      setCommunity(comm);

      const { count } = await supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', comm.id);
      setMemberCount(count || 0);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase.from('community_members').select('id').eq('community_id', comm.id).eq('user_id', user.id).single();
        if (existing) { setStep('already_member'); return; }
        const { data: existingReq } = await supabase.from('join_requests').select('id, status').eq('community_id', comm.id).eq('user_id', user.id).single();
        if (existingReq) { setStep('requested'); return; }
      }
      setStep('view');
    };
    load();
  }, [slug]);

  const handleRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Save intent, redirect to login
      sessionStorage.setItem('join_after_login', `/join/${slug}`);
      router.push(`/login?next=/join/${slug}`);
      return;
    }
    if (!community) return;
    setSubmitting(true); setError('');
    const { error } = await supabase.from('join_requests').insert({
      community_id: community.id,
      user_id: user.id,
      message: message.trim() || null,
    });
    if (error) { setError(error.message); setSubmitting(false); return; }
    setStep('requested');
    setSubmitting(false);
  };

  const wrapper = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logo.svg" alt="CoPadel" width={120} height={44} className="h-10 w-auto" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );

  if (step === 'loading') return wrapper(
    <div className="text-center py-12"><div className="text-4xl animate-pulse">🏓</div></div>
  );

  if (step === 'error') return wrapper(
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Community Not Found</h1>
      <p className="text-[#616161] mb-6">This community doesn&apos;t exist or isn&apos;t open to the public.</p>
    </div>
  );

  if (step === 'already_member') return wrapper(
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">You&apos;re already a member</h1>
      <p className="text-[#616161] mb-6">You already belong to <strong>{community?.name}</strong>.</p>
      <Link href={`/communities/${slug}`} className="px-6 py-3 bg-[#F97316] text-white rounded-xl font-bold">Go to Community →</Link>
    </div>
  );

  if (step === 'requested') return wrapper(
    <div className="bg-white border border-[#E8E4DF] rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Request Sent!</h1>
      <p className="text-[#616161]">Your request to join <strong>{community?.name}</strong> has been sent. The admin will review it shortly.</p>
    </div>
  );

  return wrapper(
    <div className="bg-white border border-[#E8E4DF] rounded-2xl overflow-hidden">
      {/* Community header */}
      <div className="p-6 border-b border-[#E8E4DF]">
        <div className="flex items-center gap-4">
          {community && (
            <CommunityLogoDisplay logoUrl={community.logo_url} logoPreset={community.logo_preset} name={community.name} color={community.color} size="lg" />
          )}
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A]">{community?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-sm text-[#616161]">👥 {memberCount} members</span>
              {community?.city && <span className="text-sm text-[#9CA3AF]">· 📍 {community.city}{community.country ? `, ${community.country}` : ''}</span>}
              {community?.club_name && <span className="text-sm text-[#9CA3AF]">· 🏟️ {community.club_name}</span>}
            </div>
          </div>
        </div>
        {community?.description && (
          <p className="text-[#616161] text-sm mt-4">{community.description}</p>
        )}
        {(community?.whatsapp_url || community?.telegram_url || community?.instagram_url || community?.facebook_url || community?.website_url) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {community.whatsapp_url && <a href={community.whatsapp_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 bg-[#F9F7F5] border border-[#E8E4DF] rounded-lg text-[#616161] hover:border-[#F97316] hover:text-[#F97316] transition-colors">💬 WhatsApp</a>}
            {community.telegram_url && <a href={community.telegram_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 bg-[#F9F7F5] border border-[#E8E4DF] rounded-lg text-[#616161] hover:border-[#F97316] hover:text-[#F97316] transition-colors">✈️ Telegram</a>}
            {community.instagram_url && <a href={community.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 bg-[#F9F7F5] border border-[#E8E4DF] rounded-lg text-[#616161] hover:border-[#F97316] hover:text-[#F97316] transition-colors">📸 Instagram</a>}
            {community.facebook_url && <a href={community.facebook_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 bg-[#F9F7F5] border border-[#E8E4DF] rounded-lg text-[#616161] hover:border-[#F97316] hover:text-[#F97316] transition-colors">📘 Facebook</a>}
            {community.website_url && <a href={community.website_url} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 bg-[#F9F7F5] border border-[#E8E4DF] rounded-lg text-[#616161] hover:border-[#F97316] hover:text-[#F97316] transition-colors">🌐 Website</a>}
          </div>
        )}
      </div>

      {/* Request form */}
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Message to admin <span className="text-[#9CA3AF] font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us a bit about yourself or how you found us..."
            rows={3}
            className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors resize-none text-sm"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button onClick={handleRequest} disabled={submitting}
          className="w-full py-3 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold transition-all disabled:opacity-50">
          {submitting ? 'Sending...' : 'Request to Join →'}
        </button>
        <p className="text-center text-[#9CA3AF] text-xs">
          Already have an account? <Link href={`/login?next=/join/${slug}`} className="text-[#F97316]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
