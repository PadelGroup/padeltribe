'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AvatarPicker from '@/components/ui/avatar-picker';
import AvatarDisplay from '@/components/ui/avatar-display';
import LevelPicker from '@/components/ui/level-picker';
import { SIDE_OPTIONS } from '@/lib/avatars';
import { PADEL_LEVELS } from '@/types';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [side, setSide] = useState('both');
  const [level, setLevel] = useState<number | null>(null);
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
        setPhone((data as { phone?: string }).phone || '');
        setGender((data as { gender?: string }).gender || '');
        setSide((data as { preferred_side?: string }).preferred_side || 'both');
        setAvatarPreset((data as { avatar_preset?: string }).avatar_preset || '');
        setAvatarUrl(data.avatar_url || '');
        setLevel((data as { level?: number }).level || null);
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
      phone: phone || null,
      gender: gender || null,
      preferred_side: side,
      avatar_preset: avatarPreset || null,
      avatar_url: avatarUrl || null,
      level: level || null,
    }).eq('id', user.id);
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const levelInfo = level ? PADEL_LEVELS[level - 1] : null;

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-16 lg:pt-0">
      <h1 className="text-3xl font-black text-[#1A1A1A]">My Profile</h1>

      {/* Current profile card */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-5 flex items-center gap-4">
        <AvatarDisplay avatarUrl={avatarUrl} avatarPreset={avatarPreset} name={name || 'Player'} size="xl" />
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">{name || 'Player'}</h2>
          <p className="text-[#616161] text-sm">{profile?.phone || 'No phone'}</p>
          {levelInfo && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg text-xs font-bold text-white"
              style={{ background: levelInfo.color }}>
              L{level} · {levelInfo.badge}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar picker */}
          <div>
            <h3 className="font-bold text-[#1A1A1A] mb-4">Profile Picture</h3>
            <AvatarPicker
              currentAvatarUrl={avatarUrl}
              currentPreset={avatarPreset}
              name={name}
              onPresetSelect={handlePresetSelect}
              onFileUpload={handleFileUpload}
              uploading={uploading}
            />
          </div>

          <div className="border-t border-[#E8E4DF] pt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Display Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] focus:border-[#F97316] transition-colors" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Phone Number <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567"
                className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors" />
            </div>

            {/* Padel Level */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Padel Level</label>
              <p className="text-xs text-[#616161] mb-3">Select your current skill level (1 = Beginner, 7 = Elite)</p>
              <LevelPicker value={level} onChange={setLevel} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-3">Preferred Side</label>
              <div className="grid grid-cols-3 gap-2">
                {SIDE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setSide(opt.value)}
                    className={`p-3 rounded-xl text-center transition-all border ${side === opt.value ? 'border-[#F97316] bg-[#FFF4EC]' : 'border-[#E8E4DF] bg-white hover:border-[#F97316]/40'}`}>
                    <div className="text-2xl mb-1">{opt.emoji}</div>
                    <div className="text-xs font-semibold text-[#1A1A1A]">{opt.label}</div>
                    <div className="text-xs text-[#616161] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Gender <span className="text-[#9CA3AF]">(for mix formats)</span></label>
              <div className="flex gap-2">
                {[{ v: 'male', l: '♂ Male' }, { v: 'female', l: '♀ Female' }, { v: 'other', l: '⚧ Other' }, { v: '', l: 'Prefer not' }].map(g => (
                  <button key={g.v} type="button" onClick={() => setGender(g.v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${gender === g.v ? 'bg-[#F97316] text-white' : 'bg-[#F5F2EE] text-[#616161] hover:bg-[#E8E4DF]'}`}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className={`w-full py-3 rounded-xl font-bold transition-all text-white ${saved ? 'bg-green-500' : 'bg-[#F97316] hover:bg-[#EA6C10]'} disabled:opacity-50`}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
