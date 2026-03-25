'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import CommunityLogoPicker from '@/components/ui/community-logo-picker';
import CommunityLogoDisplay from '@/components/ui/community-logo-display';

const COLORS = ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function CreateCommunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreset, setLogoPreset] = useState('ball');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const slug = slugify(name);

  const handleFileUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('community-logos').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('community-logos').getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      setLogoPreset('');
    }
    setUploading(false);
  };

  const handlePresetSelect = (presetId: string) => {
    setLogoPreset(presetId);
    setLogoUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name, slug, description, color, admin_id: user.id,
        logo_url: logoUrl || null,
        logo_preset: logoPreset || null,
      })
      .select().single();

    if (error) { setError(error.message); setLoading(false); return; }
    router.push(`/communities/${data.slug}`);
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 lg:pt-0">
      <div className="mb-8">
        <Link href="/communities" className="text-[#616161] hover:text-[#1A1A1A] text-sm flex items-center gap-1 mb-4">← Back to Communities</Link>
        <h1 className="text-3xl font-black text-[#1A1A1A]">Create Community</h1>
        <p className="text-[#616161] mt-1">Set up your padel community</p>
      </div>

      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Community Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. London Padel Club"
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
            {name && (
              <p className="text-xs text-[#9CA3AF] mt-1">URL: copadel.com/communities/<span className="text-[#F97316]">{slug}</span></p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Tell players what your community is about..."
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors resize-none" />
          </div>

          {/* Community Color */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-3">Community Color</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-[#1A1A1A]/30 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Community Logo</label>
            <p className="text-xs text-[#616161] mb-3">Pick a preset icon or upload your own logo</p>
            <CommunityLogoPicker
              currentLogoUrl={logoUrl}
              currentPreset={logoPreset}
              color={color}
              onPresetSelect={handlePresetSelect}
              onFileUpload={handleFileUpload}
              uploading={uploading}
            />
          </div>

          {/* Preview */}
          <div className="bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl p-4">
            <p className="text-xs text-[#9CA3AF] mb-3">Preview</p>
            <div className="flex items-center gap-3">
              <CommunityLogoDisplay
                logoUrl={logoUrl}
                logoPreset={logoPreset || 'ball'}
                name={name || 'C'}
                color={color}
                size="md"
              />
              <div>
                <p className="font-bold text-[#1A1A1A]">{name || 'Community Name'}</p>
                <p className="text-xs text-[#9CA3AF]">/{slug || 'community-slug'}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading || !name}
            className="w-full py-4 bg-[#F97316] hover:bg-[#EA6C10] text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-all">
            {loading ? 'Creating...' : 'Create Community →'}
          </button>
        </form>
      </div>
    </div>
  );
}
