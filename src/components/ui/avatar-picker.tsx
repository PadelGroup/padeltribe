'use client';
import { useState, useRef } from 'react';
import { PRESET_AVATARS } from '@/lib/avatars';
import AvatarDisplay from './avatar-display';

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  currentPreset?: string | null;
  name?: string;
  onPresetSelect: (presetId: string) => void;
  onFileUpload: (file: File) => void;
  uploading?: boolean;
}

export default function AvatarPicker({
  currentAvatarUrl, currentPreset, name = 'P',
  onPresetSelect, onFileUpload, uploading = false,
}: AvatarPickerProps) {
  const [tab, setTab] = useState<'presets' | 'upload'>('presets');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      {/* Current avatar preview */}
      <div className="flex items-center gap-4">
        <AvatarDisplay avatarUrl={currentAvatarUrl} avatarPreset={currentPreset} name={name} size="xl" />
        <div>
          <p className="text-sm font-medium text-slate-900">Profile Picture</p>
          <p className="text-xs text-slate-500">Choose a preset or upload your own photo</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button type="button" onClick={() => setTab('presets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'presets' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          🎨 Preset Avatars
        </button>
        <button type="button" onClick={() => setTab('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'upload' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
          📷 Upload Photo
        </button>
      </div>

      {tab === 'presets' && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {PRESET_AVATARS.map(avatar => {
            const isActive = currentPreset === avatar.id && !currentAvatarUrl;
            return (
              <button key={avatar.id} type="button" onClick={() => onPresetSelect(avatar.id)}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all group ${isActive ? 'ring-2 scale-105' : 'hover:scale-105'}`}
                style={isActive ? { boxShadow: `0 0 0 2px ${avatar.ring}` } : {}}>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl shadow-lg`}>
                  {avatar.emoji}
                </div>
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors">{avatar.label}</span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-xs text-white">✓</div>
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
            className="w-full py-8 border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50 rounded-xl text-center transition-all group">
            {uploading ? (
              <div className="space-y-1">
                <div className="text-2xl animate-pulse">⏳</div>
                <p className="text-sm text-slate-500">Uploading...</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-3xl group-hover:scale-110 transition-transform">📷</div>
                <p className="text-sm text-slate-900 font-medium">Click to upload photo</p>
                <p className="text-xs text-slate-500">JPG, PNG, GIF up to 5MB</p>
              </div>
            )}
          </button>
          {currentAvatarUrl && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <img src={currentAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <p className="text-sm text-slate-600 flex-1">Current photo uploaded</p>
              <button type="button" onClick={() => onPresetSelect(currentPreset || PRESET_AVATARS[0].id)}
                className="text-xs text-red-500 hover:text-red-600 transition-colors">Remove</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
