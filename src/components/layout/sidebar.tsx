'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🏓</span>
          <span className="font-bold gradient-text">CoPadel</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-30 bg-white border-r border-slate-200 shadow-sm flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🏓</span>
            <span className="text-xl font-bold gradient-text">CoPadel</span>
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
                    ? 'bg-gradient-to-r from-sky-100 to-orange-50 text-sky-700 border border-sky-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
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
                  ? 'bg-gradient-to-r from-sky-100 to-orange-50 text-sky-700 border border-sky-200'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
              <span className="text-base">🛡️</span>
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Profile & Sign Out */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img src={profile?.avatar_url || getAvatarUrl(profile?.name || 'User')}
              alt="" className="w-8 h-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.phone || 'Admin'}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="lg:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setOpen(false)} />}
    </>
  );
}
