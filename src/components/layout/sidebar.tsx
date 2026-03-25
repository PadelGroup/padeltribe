'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { getAvatarUrl } from '@/lib/utils';

interface Props { profile: Profile | null; }

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/communities', label: 'Communities', icon: '👥' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
];

export default function DashboardSidebar({ profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#F5F2EE] border-b border-[#E8E4DF] shadow-sm">
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.svg" alt="CoPadel" width={100} height={36} className="h-8 w-auto" />
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 bg-white hover:bg-[#FFF4EC] rounded-lg text-[#616161] transition-colors border border-[#E8E4DF]">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-30 bg-white border-r border-[#E8E4DF] shadow-sm flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#E8E4DF]">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo.svg" alt="CoPadel" width={140} height={50} className="h-12 w-auto" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium
                  ${active
                    ? 'bg-[#FFF4EC] text-[#F97316] border border-[#FDBA74]'
                    : 'text-[#616161] hover:text-[#1A1A1A] hover:bg-[#F5F2EE]'}`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          {/* Super admin link — only for owner */}
          {profile?.email === 'dimashevch@gmail.com' && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium
                ${pathname === '/admin'
                  ? 'bg-[#FFF4EC] text-[#F97316] border border-[#FDBA74]'
                  : 'text-[#616161] hover:text-[#1A1A1A] hover:bg-[#F5F2EE]'}`}>
              <span className="text-base">🛡️</span>
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Profile & Sign Out */}
        <div className="px-4 py-4 border-t border-[#E8E4DF]">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile?.avatar_url || getAvatarUrl(profile?.name || 'User')}
              alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-[#616161] truncate">{profile?.phone || profile?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#616161] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setOpen(false)} />}
    </>
  );
}
