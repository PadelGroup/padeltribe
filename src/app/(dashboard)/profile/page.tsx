'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AvatarPicker from '@/components/ui/avatar-picker';
import AvatarDisplay from '@/components/ui/avatar-display';
import { SIDE_OPTIONS } from '@/lib/avatars';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [side, setSide] = useState('both');
  const [avatarPreset, setAvatarPreset] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setName(data.name || '');
        setGender((data as { gender?: string }).gender || '');
        setSide((data as { preferred_side?: string }).preferred_side || 'both');
        setAvatarPreset((data as { avatar_preset?: string }).avatar_preset || '');
        setAvatarUrl(data.avatar_url || '');
      });
    });
  }, []);

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

  const handlePresetSelect = (presetId: string) => {
    setAvatarPreset(presetId);
    setAvatarUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      name,
      gender: gender || null,
      preferred_side: side,
      avatar_preset: avatarPreset || null,
      avatar_url: avatarUrl || null,
    }).eq('id', user.id);
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-16 lg:pt-0">
      <h1 className="text-3xl font-black text-slate-900">My Profile</h1>

      {/* Current profile card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
        <AvatarDisplay avatarUrl={avatarUrl} avatarPreset={avatarPreset} name={name || 'Player'} size="xl" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{name || 'Player'}</h2>
          <p className="text-slate-500 text-sm">{profile?.phone || 'No phone'}</p>
          {side && side !== 'both' && (
            <p className="text-sm text-sky-600 mt-0.5">{side === 'right' ? '👉 Right side' : '👈 Left side'}</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar picker */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4">Profile Picture</h3>
            <AvatarPicker
              currentAvatarUrl={avatarUrl}
              currentPreset={avatarPreset}
              name={name}
              onPresetSelect={handlePresetSelect}
              onFileUpload={handleFileUpload}
              uploading={uploading}
            />
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:border-sky-400 transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Side</label>
              <div className="grid grid-cols-3 gap-2">
                {SIDE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setSide(opt.value)}
                    className={`p-3 rounded-xl text-center transition-all border ${side === opt.value ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50'}`}>
                    <div className="text-2xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-semibold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender <span className="text-slate-400">(for mix formats)</span></label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }, { v: 'other', l: '⚧ Other' }, { v: '', l: 'Prefer not' }].map(g => (
                  <button key={g.v} type="button" onClick={() => setGender(g.v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${gender === g.v ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className={`w-full py-3 rounded-xl font-bold transition-all text-white ${saved ? 'bg-green-500' : 'bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400'} disabled:opacity-50`}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
