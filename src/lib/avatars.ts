export interface PresetAvatar {
  id: string;
  label: string;
  emoji: string;
  bg: string;     // gradient CSS
  ring: string;   // ring color
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'fire',       label: 'Fire',      emoji: '🔥', bg: 'from-orange-500 to-red-600',    ring: '#f97316' },
  { id: 'lightning',  label: 'Lightning', emoji: '⚡', bg: 'from-yellow-400 to-amber-600',  ring: '#fbbf24' },
  { id: 'star',       label: 'Star',      emoji: '⭐', bg: 'from-yellow-300 to-yellow-500',  ring: '#fde68a' },
  { id: 'racket',     label: 'Racket',    emoji: '🏓', bg: 'from-purple-500 to-violet-700', ring: '#a855f7' },
  { id: 'crown',      label: 'Crown',     emoji: '👑', bg: 'from-yellow-500 to-orange-500', ring: '#f59e0b' },
  { id: 'shark',      label: 'Shark',     emoji: '🦈', bg: 'from-cyan-500 to-blue-600',     ring: '#06b6d4' },
  { id: 'lion',       label: 'Lion',      emoji: '🦁', bg: 'from-amber-500 to-yellow-600',  ring: '#d97706' },
  { id: 'wolf',       label: 'Wolf',      emoji: '🐺', bg: 'from-slate-400 to-slate-600',   ring: '#94a3b8' },
  { id: 'eagle',      label: 'Eagle',     emoji: '🦅', bg: 'from-sky-400 to-indigo-600',    ring: '#38bdf8' },
  { id: 'bull',       label: 'Bull',      emoji: '🐂', bg: 'from-red-500 to-rose-700',      ring: '#ef4444' },
  { id: 'panther',    label: 'Panther',   emoji: '🐆', bg: 'from-lime-500 to-green-700',    ring: '#84cc16' },
  { id: 'rocket',     label: 'Rocket',    emoji: '🚀', bg: 'from-pink-500 to-fuchsia-700',  ring: '#ec4899' },
  { id: 'diamond',    label: 'Diamond',   emoji: '💎', bg: 'from-teal-400 to-cyan-600',     ring: '#2dd4bf' },
  { id: 'ninja',      label: 'Ninja',     emoji: '🥷', bg: 'from-gray-700 to-gray-900',     ring: '#6b7280' },
  { id: 'viking',     label: 'Viking',    emoji: '⚔️', bg: 'from-indigo-500 to-purple-700', ring: '#6366f1' },
  { id: 'robot',      label: 'Robot',     emoji: '🤖', bg: 'from-emerald-400 to-teal-600',  ring: '#10b981' },
];

export function getPresetAvatar(id: string): PresetAvatar {
  return PRESET_AVATARS.find(a => a.id === id) || PRESET_AVATARS[0];
}

// Returns a URL or a preset ID to store
export function getAvatarDisplay(profile: { avatar_url?: string | null; avatar_preset?: string | null; name?: string }): {
  type: 'url' | 'preset' | 'initials';
  value: string;
  preset?: PresetAvatar;
} {
  if (profile.avatar_url) return { type: 'url', value: profile.avatar_url };
  if (profile.avatar_preset) {
    const preset = getPresetAvatar(profile.avatar_preset);
    return { type: 'preset', value: profile.avatar_preset, preset };
  }
  return { type: 'initials', value: profile.name || 'P' };
}

export const SIDE_OPTIONS = [
  { value: 'right', label: 'Right Side', emoji: '👉', desc: 'Drive side — you like the right court' },
  { value: 'left',  label: 'Left Side',  emoji: '👈', desc: 'Backhand side — you prefer the left court' },
  { value: 'both',  label: 'Both Sides', emoji: '🔄', desc: 'Flexible — you play anywhere' },
] as const;

export type PreferredSide = 'right' | 'left' | 'both';
