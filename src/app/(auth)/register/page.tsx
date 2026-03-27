'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type Step = 'choose' | 'email';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user && phone) {
      await supabase.from('profiles').update({ phone }).eq('id', data.user.id);
    }
    router.push('/dashboard'); router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Image src="/logo.svg" alt="CoPadel" width={160} height={58} className="h-14 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Create your account</h1>
          <p className="text-[#616161]">Start your padel community today</p>
        </div>

        <div className="bg-white border border-[#E8E4DF] shadow-sm rounded-2xl p-8">
          {step === 'choose' && (
            <div className="space-y-3">
              {/* Google */}
              <button onClick={handleGoogleLogin} disabled={loading}
                className="w-full py-3.5 px-6 bg-white border-2 border-[#E8E4DF] hover:border-[#F97316] hover:bg-[#FFF4EC] rounded-xl flex items-center justify-center gap-3 transition-all font-semibold text-[#1A1A1A] disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Continue with Google'}
              </button>

              {/* Facebook */}
              <button onClick={handleFacebookLogin} disabled={loading}
                className="w-full py-3.5 px-6 bg-white border-2 border-[#E8E4DF] hover:border-[#1877F2] hover:bg-[#F0F6FF] rounded-xl flex items-center justify-center gap-3 transition-all font-semibold text-[#1A1A1A] disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Continue with Facebook'}
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-[#E8E4DF]" />
                <span className="text-xs text-[#9CA3AF]">or</span>
                <div className="flex-1 h-px bg-[#E8E4DF]" />
              </div>

              <button onClick={() => setStep('email')}
                className="w-full py-3.5 px-6 bg-white border border-[#E8E4DF] hover:border-[#F97316] hover:bg-[#FFF4EC] rounded-xl text-left flex items-center gap-4 transition-all">
                <span className="text-xl">✉️</span>
                <div>
                  <div className="font-semibold text-[#1A1A1A]">Email & Password</div>
                  <div className="text-xs text-[#9CA3AF]">Register with email address</div>
                </div>
              </button>

              <div className="text-center pt-2">
                <span className="text-[#616161] text-sm">Already have an account? </span>
                <Link href="/login" className="text-[#F97316] hover:text-[#EA6C10] text-sm font-medium">Sign In</Link>
              </div>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <button type="button" onClick={() => setStep('choose')} className="text-[#616161] hover:text-[#1A1A1A] text-sm">← Back</button>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Smith"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 8 characters" minLength={8}
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Phone Number <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold disabled:opacity-50 transition-all text-lg">
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 bg-white border border-[#E8E4DF] rounded-2xl p-4 text-sm text-[#616161]">
          <p className="font-medium text-[#1A1A1A] mb-1">👋 As an Admin you can:</p>
          <ul className="space-y-1">
            <li>✓ Create and manage communities</li>
            <li>✓ Invite players via unique links</li>
            <li>✓ Create tournaments in any format</li>
            <li>✓ Record scores and manage rankings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
