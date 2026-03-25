'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';

const PRESETS = [
  { id: 'ball', label: 'Ball', src: '/community-presets/ball.svg' },
  { id: 'racket', label: 'Racket', src: '/community-presets/racket.svg' },
  { id: 'trophy', label: 'Trophy', src: '/community-presets/trophy.svg' },
  { id: 'court', label: 'Court', src: '/community-presets/court.svg' },
  { id: 'crown', label: 'Crown', src: '/community-presets/crown.svg' },
  { id: 'star', label: 'Star', src: '/community-presets/star.svg' },
  { id: 'lightning', label: 'Lightning', src: '/community-presets/lightning.svg' },
  { id: 'shield', label: 'Shield', src: '/community-presets/shield.svg' },
  { id: 'fire', label: 'Fire', src: '/community-presets/fire.svg' },
  { id: 'diamond', label: 'Diamond', src: '/community-presets/diamond.svg' },
];

interface Props {
  currentLogoUrl?: string | null;
  currentPreset?: string | null;
  color?: string;
  onPresetSelect: (presetId: string) => void;
  onFileUpload: (file: File) => void;
  uploading?: boolean;
}

export default function CommunityLogoPicker({
  currentLogoUrl, currentPreset, color = '#F97316',
  onPresetSelect, onFileUpload, uploading = false,
}: Props) {
  const [tab, setTab] = useState<'presets' | 'upload'>('presets');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F5F2EE] rounded-xl w-fit">
        <button type="button" onClick={() => setTab('presets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'presets' ? 'bg-[#F97316] text-white shadow-sm' : 'text-[#616161] hover:text-[#1A1A1A]'}`}>
          🎨 Preset Icons
        </button>
        <button type="button" onClick={() => setTab('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'upload' ? 'bg-[#F97316] text-white shadow-sm' : 'text-[#616161] hover:text-[#1A1A1A]'}`}>
          📷 Upload Logo
        </button>
      </div>

      {tab === 'presets' && (
        <div className="grid grid-cols-5 gap-3">
          {PRESETS.map(preset => {
            const isActive = currentPreset === preset.id && !currentLogoUrl;
            return (
              <button key={preset.id} type="button" onClick={() => onPresetSelect(preset.id)}
                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                  ${isActive ? 'border-[#F97316] bg-[#FFF4EC] scale-105' : 'border-[#E8E4DF] bg-white hover:border-[#F97316]/40 hover:scale-105'}`}>
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image src={preset.src} alt={preset.label} width={40} height={40} />
                </div>
                <span className="text-[10px] font-semibold text-[#616161]">{preset.label}</span>
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#F97316] rounded-full flex items-center justify-center text-xs text-white">✓</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tab === 'upload' && (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) onFileUpload(e.target.files[0]); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-[#E8E4DF] hover:border-[#F97316] hover:bg-[#FFF4EC] rounded-xl text-center transition-all group">
            {uploading ? (
              <div className="space-y-1">
                <div className="text-2xl animate-pulse">⏳</div>
                <p className="text-sm text-[#616161]">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl group-hover:scale-110 transition-transform">🖼️</div>
                <p className="text-sm text-[#1A1A1A] font-medium">Click to upload logo</p>
                <p className="text-xs text-[#9CA3AF]">PNG, JPG, SVG up to 5MB</p>
              </div>
            )}
          </button>
          {currentLogoUrl && (
            <div className="flex items-center gap-3 bg-[#F9F7F5] border border-[#E8E4DF] rounded-xl p-3">
              <img src={currentLogoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <p className="text-sm text-[#616161] flex-1">Custom logo uploaded</p>
              <button type="button" onClick={() => onPresetSelect(currentPreset || PRESETS[0].id)}
                className="text-xs text-red-500 hover:text-red-600 transition-colors">Remove</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
