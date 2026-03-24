'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AvatarPicker from '@/components/ui/avatar-picker';
import AvatarDisplay from '@/components/ui/avatar-display';
import { SIDE_OPTIONS } from '@/lib/avatars';
import type { Invite } from '@/types';

type Step = 'loading' | 'join' | 'phone' | 'otp' | 'profile' | 'error' | 'used';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [gender, setGender] = useState('');
  const [side, setSide] = useState('both');
  const [avatarPreset, setAvatarPreset] = useState('racket');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userId, setUserId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      const { data } = await supabase.from('invites').select('*, community:communities(*)').eq('token', token).single();
      if (!data) { setStep('error'); return; }
      if (data.used) { setStep('used'); return; }
      if (new Date(data.expires_at) < new Date()) { setStep('error'); return; }
      setInvite(data as Invite);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await joinCommunity(user.id, data.community_id, data.id);
      } else {
        setStep('join');
      }
    };
    fetchInvite();
  }, [token]);

  const joinCommunity = async (uid: string, communityId: string, inviteId: string) => {
    await supabase.from('community_members').upsert({ community_id: communityId, user_id: uid, role: 'player' });
    await supabase.from('invites').update({ used: true, used_by: uid, used_at: new Date().toISOString() }).eq('id', inviteId);
    const comm = invite?.community as { slug?: string };
    router.push(`/communities/${comm?.slug || ''}`);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep('otp'); setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    const { data, error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      setUserId(data.user.id);
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', data.user.id).single();
      if (!profile?.name) { setStep('profile'); setLoading(false); return; }
      await joinCommunity(data.user.id, invite!.community_id, invite!.id);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl);
      setAvatarPreset('');
    }
    setUploading(false);
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }
    await supabase.from('profiles').update({
      name,
      gender: gender || null,
      preferred_side: side,
      avatar_preset: avatarPreset || null,
      avatar_url: avatarUrl || null,
    }).eq('id', user.id);
    await joinCommunity(user.id, invite!.community_id, invite!.id);
  };

  const communityName = (invite?.community as { name?: string })?.name || 'the community';

  const wrapper = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🏓</span>
            <span className="text-xl font-bold gradient-text">PadelTribe</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );

  if (step === 'loading') return wrapper(
    <div className="text-center py-12"><div className="text-4xl animate-pulse">🏓</div><p className="text-slate-500 mt-2">Loading invite...</p></div>
  );

  if (step === 'error') return wrapper(
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invite</h1>
      <p className="text-slate-500 mb-6">This link is invalid or has expired.</p>
      <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold">Sign In</Link>
    </div>
  );

  if (step === 'used') return wrapper(
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Already Used</h1>
      <p className="text-slate-500 mb-6">This invite has already been used.</p>
      <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold">Sign In</Link>
    </div>
  );

  return wrapper(
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
      {step === 'join' && (
        <div className="text-center space-y-5">
          <div className="text-5xl">🎉</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">You&apos;re Invited!</h1>
            <p className="text-slate-500">Join <strong className="text-sky-600">{communityName}</strong></p>
          </div>
          <button onClick={() => setStep('phone')} className="w-full py-4 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold text-lg transition-all">
            Join with Phone Number 📱
          </button>
          <p className="text-slate-400 text-sm">Already have an account? <Link href="/login" className="text-sky-600">Sign in</Link></p>
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Enter Your Phone</h2>
          <p className="text-slate-500 text-sm">We&apos;ll send a verification code</p>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1234567890"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Verify</h2>
          <p className="text-slate-500 text-sm">Code sent to {phone}</p>
          <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center text-2xl tracking-widest focus:border-sky-400 transition-colors" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button type="button" onClick={() => setStep('phone')} className="w-full text-slate-500 hover:text-slate-900 text-sm">Change number</button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCompleteProfile} className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Set Up Your Profile</h2>
            <p className="text-slate-500 text-sm">Almost there! Tell us a bit about yourself</p>
          </div>

          <AvatarPicker
            currentAvatarUrl={avatarUrl}
            currentPreset={avatarPreset}
            name={name}
            onPresetSelect={(id) => { setAvatarPreset(id); setAvatarUrl(''); }}
            onFileUpload={handleFileUpload}
            uploading={uploading}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Smith"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Side</label>
            <div className="grid grid-cols-3 gap-2">
              {SIDE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setSide(opt.value)}
                  className={`p-2.5 rounded-xl text-center transition-all border ${side === opt.value ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-200'}`}>
                  <div className="text-xl mb-0.5">{opt.emoji}</div>
                  <div className="text-xs font-semibold text-slate-900">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gender <span className="text-slate-400">(for mix formats)</span></label>
            <div className="flex gap-2">
              {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }, { v: 'other', l: '⚧ Other' }, { v: '', l: '—' }].map(g => (
                <button key={g.v} type="button" onClick={() => setGender(g.v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${gender === g.v ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading || !name}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
            {loading ? 'Joining...' : `Join ${communityName} →`}
          </button>
        </form>
      )}
    </div>
  );
}
