'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';

const COLORS = ['#0EA5E9', '#F97316', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function CreateCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = slugify(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { data, error } = await supabase
      .from('communities')
      .insert({ name, slug, description, color, admin_id: user.id })
      .select().single();

    if (error) { setError(error.message); setLoading(false); return; }
    router.push(`/communities/${data.slug}`);
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 lg:pt-0">
      <div className="mb-8">
        <Link href="/communities" className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1 mb-4">← Back to Communities</Link>
        <h1 className="text-3xl font-black text-slate-900">Create Community</h1>
        <p className="text-slate-500 mt-1">Set up your padel community</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Community Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. London Padel Club"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors" />
            {name && (
              <p className="text-xs text-slate-400 mt-1">URL: padeltribe.com/communities/<span className="text-sky-600">{slug}</span></p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Tell players what your community is about..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-sky-400 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Community Color</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-slate-400 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${color}40, ${color}20)`, border: `1px solid ${color}50` }}>
                🏓
              </div>
              <div>
                <p className="font-bold text-slate-900">{name || 'Community Name'}</p>
                <p className="text-xs text-slate-400">/{slug || 'community-slug'}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading || !name}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-all">
            {loading ? 'Creating...' : 'Create Community →'}
          </button>
        </form>
      </div>
    </div>
  );
}
