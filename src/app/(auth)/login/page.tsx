'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🏓</span>
            <span className="text-xl font-bold gradient-text">PadelTribe</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500">Sign in to your account</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
          {step === 'choose' && (
            <div className="space-y-4">
              <button onClick={() => setStep('email')} className="w-full py-4 px-6 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-xl text-left flex items-center gap-4 transition-all">
                <span className="text-2xl">✉️</span>
                <div><div className="font-semibold text-slate-900">Email & Password</div><div className="text-sm text-slate-500">For admins and existing accounts</div></div>
              </button>
              <button onClick={() => setStep('phone')} className="w-full py-4 px-6 bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl text-left flex items-center gap-4 transition-all">
                <span className="text-2xl">📱</span>
                <div><div className="font-semibold text-slate-900">Phone Number</div><div className="text-sm text-slate-500">Sign in with OTP — fast & easy</div></div>
              </button>
              <div className="text-center pt-2">
                <span className="text-slate-500 text-sm">No account? </span>
                <Link href="/register" className="text-sky-600 hover:text-sky-500 text-sm font-medium">Register as Admin</Link>
              </div>
            </div>
          )}
          {step === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <button type="button" onClick={() => setStep('choose')} className="text-slate-500 hover:text-slate-900 text-sm">← Back</button>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSendOtp} className="space-y-4">
              <button type="button" onClick={() => setStep('choose')} className="text-slate-500 hover:text-slate-900 text-sm">← Back</button>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1234567890"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-orange-400 transition-colors" />
                <p className="text-xs text-slate-400 mt-1">Include country code (e.g. +44 for UK)</p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </form>
          )}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-2">📲</div>
                <p className="text-slate-600 text-sm">Code sent to <strong>{phone}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Enter OTP Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-center text-2xl tracking-widest placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-sky-500 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-slate-500 hover:text-slate-900 text-sm">Change number</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
