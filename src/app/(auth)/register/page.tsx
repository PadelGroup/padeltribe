'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Create Admin Account</h1>
          <p className="text-[#616161]">Start your padel community today</p>
        </div>
        <div className="bg-white border border-[#E8E4DF] shadow-sm rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
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
              {loading ? 'Creating account...' : 'Create Admin Account →'}
            </button>
            <div className="text-center text-sm text-[#616161]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#F97316] hover:text-[#EA6C10] font-medium">Sign In</Link>
            </div>
          </form>
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
