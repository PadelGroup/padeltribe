'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

type Step = 'choose' | 'email' | 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard'); router.refresh();
  };

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep('otp'); setLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const formatted = phone.startsWith('+') ? phone : `+${phone}`;
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/dashboard'); router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Image src="/logo.svg" alt="CoPadel" width={160} height={58} className="h-14 w-auto" />
          </Link>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Welcome back</h1>
          <p className="text-[#616161]">Sign in to your account</p>
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

              <button onClick={() => setStep('phone')}
                className="w-full py-3.5 px-6 bg-white border border-[#E8E4DF] hover:border-[#F97316] hover:bg-[#FFF4EC] rounded-xl text-left flex items-center gap-4 transition-all">
                <span className="text-xl">📱</span>
                <div><div className="font-semibold text-[#1A1A1A]">Phone Number</div><div className="text-xs text-[#9CA3AF]">Sign in with OTP code</div></div>
              </button>
              <button onClick={() => setStep('email')}
                className="w-full py-3.5 px-6 bg-white border border-[#E8E4DF] hover:border-[#F97316] hover:bg-[#FFF4EC] rounded-xl text-left flex items-center gap-4 transition-all">
                <span className="text-xl">✉️</span>
                <div><div className="font-semibold text-[#1A1A1A]">Email & Password</div><div className="text-xs text-[#9CA3AF]">For admins and existing accounts</div></div>
              </button>

              <div className="text-center pt-2">
                <span className="text-[#616161] text-sm">No account? </span>
                <Link href="/register" className="text-[#F97316] hover:text-[#EA6C10] text-sm font-medium">Create one</Link>
              </div>
            </div>
          )}
          {step === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <button type="button" onClick={() => setStep('choose')} className="text-[#616161] hover:text-[#1A1A1A] text-sm">← Back</button>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSendOtp} className="space-y-4">
              <button type="button" onClick={() => setStep('choose')} className="text-[#616161] hover:text-[#1A1A1A] text-sm">← Back</button>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1234567890"
                  className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-orange-400 transition-colors" />
                <p className="text-xs text-[#9CA3AF] mt-1">Include country code (e.g. +44 for UK)</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </form>
          )}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-2">📲</div>
                <p className="text-[#616161] text-sm">Code sent to <strong>{phone}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Enter OTP Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
                  className="w-full px-4 py-4 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] text-center text-2xl tracking-widest placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-[#F97316] text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-[#616161] hover:text-[#1A1A1A] text-sm">Change number</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
