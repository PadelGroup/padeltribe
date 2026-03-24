'use client';
import { getPresetAvatar } from '@/lib/avatars';

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  avatarPreset?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm:  { outer: 'w-8 h-8',  text: 'text-sm' },
  md:  { outer: 'w-10 h-10', text: 'text-base' },
  lg:  { outer: 'w-14 h-14', text: 'text-2xl' },
  xl:  { outer: 'w-20 h-20', text: 'text-3xl' },
};

export default function AvatarDisplay({ avatarUrl, avatarPreset, name = 'P', size = 'md', className = '' }: AvatarDisplayProps) {
  const sz = SIZES[size];

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        className={`${sz.outer} rounded-full object-cover ${className}`} />
    );
  }

  if (avatarPreset) {
    const preset = getPresetAvatar(avatarPreset);
    return (
      <div className={`${sz.outer} rounded-full bg-gradient-to-br ${preset.bg} flex items-center justify-center ${className}`}>
        <span className={sz.text}>{preset.emoji}</span>
      </div>
    );
  }

  // Initials fallback
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className={`${sz.outer} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white ${size === 'sm' ? 'text-xs' : size === 'xl' ? 'text-xl' : 'text-sm'} ${className}`}>
      {initials}
    </div>
  );
}
