'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AvatarPicker from '@/components/ui/avatar-picker';
import { SIDE_OPTIONS } from '@/lib/avatars';
import type { Invite } from '@/types';

type Step = 'loading' | 'join' | 'register' | 'profile' | 'error' | 'used';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [step, setStep] = useState<Step>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [side, setSide] = useState('both');
  const [avatarPreset, setAvatarPreset] = useState('racket');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userId, setUserId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showEmail, setShowEmail] = useState(false);

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
        // Check if profile is complete
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        if (!profile?.name) {
          setStep('profile');
        } else {
          await joinCommunity(user.id, data.community_id, data.id);
        }
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

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setError('');
    const redirectTo = typeof window !== 'undefined' ? window.location.href : '';
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) { setError(error.message); setOauthLoading(null); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      setUserId(data.user.id);
      await supabase.from('profiles').update({ name }).eq('id', data.user.id);
      setStep('profile');
    }
    setLoading(false);
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
      phone: phone || null,
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
            <span className="text-xl font-bold gradient-text">CoPadel</span>
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
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-2">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900">You&apos;re Invited!</h1>
            <p className="text-slate-500">Join <strong className="text-sky-600">{communityName}</strong></p>
          </div>

          {/* Google */}
          <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-200 hover:border-sky-300 rounded-xl font-semibold text-slate-700 transition-all disabled:opacity-50">
            {oauthLoading === 'google' ? <span className="animate-spin">⏳</span> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Apple */}
          <button onClick={() => handleOAuth('apple')} disabled={!!oauthLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black hover:bg-slate-800 border-2 border-black rounded-xl font-semibold text-white transition-all disabled:opacity-50">
            {oauthLoading === 'apple' ? <span className="animate-spin">⏳</span> : (
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            )}
            Continue with Apple
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Email toggle */}
          <button onClick={() => setShowEmail(!showEmail)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600 transition-all text-sm">
            ✉️ Continue with Email
          </button>

          {showEmail && (
            <form onSubmit={handleRegister} className="space-y-3 pt-1">
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors text-sm" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email address"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors text-sm" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password (min 6 chars)" minLength={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors text-sm" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
            </form>
          )}

          {error && !showEmail && <p className="text-red-500 text-sm text-center">{error}</p>}
          <p className="text-center text-slate-400 text-sm">Already have an account? <Link href="/login" className="text-sky-600">Sign in</Link></p>
        </div>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Smith"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Side</label>
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
