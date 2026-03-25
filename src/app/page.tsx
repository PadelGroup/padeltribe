import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-orange-50 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center">
          <Image src="/logo.svg" alt="CoPadel" width={140} height={50} className="h-10 w-auto" />
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-lg font-medium transition-all">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sky-200 text-sm text-sky-600 mb-8 shadow-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Your padel community, all in one place
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-slate-900">
          Play Together,<br />
          <span className="gradient-text">Rise Together</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed">
          Create your padel community, invite players, organize tournaments in any format —
          Americano, Mexicano, King of the Court, and more. Track scores and rankings in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-sky-200">
            Create Your Community →
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-xl font-bold text-lg text-slate-700 transition-all">
            Sign In
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full">
          {[
            { emoji: '🔄', title: 'Americano & Mexicano', desc: 'All popular formats supported out of the box' },
            { emoji: '👑', title: 'King of the Court', desc: 'Fast-paced competitive format with automatic rotations' },
            { emoji: '📱', title: 'Phone Registration', desc: 'Players join with just their phone number — no email needed' },
            { emoji: '📊', title: 'Live Rankings', desc: 'Real-time leaderboard updated after every match' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md rounded-2xl p-6 text-left transition-all">
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3 className="font-bold mb-1 text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Formats */}
        <div className="mt-20 max-w-4xl w-full">
          <h2 className="text-2xl font-bold mb-6 text-slate-700">8 Tournament Formats</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['🔄 Americano', '👥 Team Americano', '🌶️ Mexicano', '🏆 Team Mexicano',
              '⚡ Mix Americano', '✨ Mix Mexicano', '👑 King of the Court', '🎾 Regular Sets'].map(f => (
              <span key={f} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600">{f}</span>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-400 text-sm">
        © 2025 CoPadel — Built for the love of padel 🏓
      </footer>
    </div>
  );
}
