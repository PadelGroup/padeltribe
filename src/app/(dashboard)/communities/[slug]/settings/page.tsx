'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import CommunityLogoPicker from '@/components/ui/community-logo-picker';
import CommunityLogoDisplay from '@/components/ui/community-logo-display';
import type { Community } from '@/types';

const COLORS = ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export default function CommunitySettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [clubName, setClubName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreset, setLogoPreset] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: comm } = await supabase.from('communities').select('*').eq('slug', slug).single();
    if (!comm) return;
    setCommunity(comm);
    setName(comm.name);
    setDescription(comm.description || '');
    setColor(comm.color);
    setCountry(comm.country || '');
    setCity(comm.city || '');
    setClubName(comm.club_name || '');
    setIsPublic(comm.is_public || false);
    setWhatsappUrl(comm.whatsapp_url || '');
    setTelegramUrl(comm.telegram_url || '');
    setInstagramUrl(comm.instagram_url || '');
    setFacebookUrl(comm.facebook_url || '');
    setWebsiteUrl(comm.website_url || '');
    setLogoUrl(comm.logo_url || '');
    setLogoPreset(comm.logo_preset || '');
    const { data: membership } = await supabase.from('community_members').select('role').eq('community_id', comm.id).eq('user_id', user.id).single();
    setIsAdmin(membership?.role === 'admin');
    setLoading(false);
  }, [slug, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !community) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${community.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('community-logos').upload(path, file, { upsert: true });
    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    if (data) {
      const { data: urlData } = supabase.storage.from('community-logos').getPublicUrl(path);
      const newUrl = urlData.publicUrl;
      setLogoUrl(newUrl);
      setLogoPreset('');
      // Auto-save logo immediately
      await supabase.from('communities').update({ logo_url: newUrl, logo_preset: null }).eq('id', community.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setUploading(false);
  };

  const handlePresetSelect = async (presetId: string) => {
    setLogoPreset(presetId);
    setLogoUrl('');
    // Auto-save preset immediately
    if (community) {
      await supabase.from('communities').update({ logo_preset: presetId, logo_url: null }).eq('id', community.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setSaving(true);
    await supabase.from('communities').update({
      name,
      description: description || null,
      color,
      country: country || null,
      city: city || null,
      club_name: clubName || null,
      is_public: isPublic,
      whatsapp_url: whatsappUrl.trim() || null,
      telegram_url: telegramUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      logo_url: logoUrl || null,
      logo_preset: logoPreset || null,
    }).eq('id', community.id);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="pt-16 lg:pt-0 flex items-center justify-center min-h-64"><div className="text-4xl animate-pulse">🏓</div></div>;
  if (!isAdmin) return <div className="pt-16 lg:pt-0 text-center py-16 text-[#616161]">Admin access required.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-16 lg:pt-0">
      <div>
        <Link href={`/communities/${slug}`} className="text-[#616161] hover:text-[#1A1A1A] text-sm flex items-center gap-1 mb-2">← {community?.name}</Link>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Community Settings</h1>
        <p className="text-[#616161]">Manage your community's appearance and details</p>
      </div>

      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-[#F9F7F5] rounded-xl border border-[#E8E4DF]">
            <CommunityLogoDisplay
              logoUrl={logoUrl}
              logoPreset={logoPreset}
              name={name || 'C'}
              color={color}
              size="lg"
            />
            <div>
              <p className="font-bold text-[#1A1A1A] text-lg">{name || 'Community Name'}</p>
              <p className="text-xs text-[#9CA3AF]">/{community?.slug}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Community Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] focus:border-[#F97316] transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Tell players what your community is about..."
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors resize-none" />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#1A1A1A]">Location <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country"
                className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors text-sm" />
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City"
                className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors text-sm" />
            </div>
            <input type="text" value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Club name (e.g. Dubai Padel Club)"
              className="w-full px-4 py-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors text-sm" />
          </div>

          {/* Social & Chat Links */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#1A1A1A]">Community Links <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
            <p className="text-xs text-[#9CA3AF] -mt-2">Add links so members can easily find your community chat and socials</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: '💬 WhatsApp', value: whatsappUrl, setter: setWhatsappUrl, placeholder: 'https://chat.whatsapp.com/...' },
                { label: '✈️ Telegram', value: telegramUrl, setter: setTelegramUrl, placeholder: 'https://t.me/...' },
                { label: '📸 Instagram', value: instagramUrl, setter: setInstagramUrl, placeholder: 'https://instagram.com/...' },
                { label: '📘 Facebook', value: facebookUrl, setter: setFacebookUrl, placeholder: 'https://facebook.com/groups/...' },
                { label: '🌐 Website', value: websiteUrl, setter: setWebsiteUrl, placeholder: 'https://yourclub.com' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-[#616161] w-28 shrink-0">{label}</span>
                  <input type="url" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                    className="flex-1 px-4 py-2.5 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-[#F97316] transition-colors text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between p-4 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Public community</p>
              <p className="text-xs text-[#616161]">People can find and request to join at copadel.com/join/{community?.slug}</p>
            </div>
            <button type="button" onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-[#F97316]' : 'bg-[#D1D5DB]'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

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

          <button type="submit" disabled={saving}
            className={`w-full py-3 rounded-xl font-bold transition-all text-white ${saved ? 'bg-green-500' : 'bg-[#F97316] hover:bg-[#EA6C10]'} disabled:opacity-50`}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
