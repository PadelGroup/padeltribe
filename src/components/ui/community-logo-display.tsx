import Image from 'next/image';

const PRESET_SRCS: Record<string, string> = {
  ball: '/community-presets/ball.svg',
  racket: '/community-presets/racket.svg',
  trophy: '/community-presets/trophy.svg',
  court: '/community-presets/court.svg',
  crown: '/community-presets/crown.svg',
  star: '/community-presets/star.svg',
  lightning: '/community-presets/lightning.svg',
  shield: '/community-presets/shield.svg',
  fire: '/community-presets/fire.svg',
  diamond: '/community-presets/diamond.svg',
};

interface Props {
  logoUrl?: string | null;
  logoPreset?: string | null;
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = {
  sm: { container: 'w-10 h-10', text: 'text-lg', img: 28 },
  md: { container: 'w-12 h-12', text: 'text-xl', img: 36 },
  lg: { container: 'w-16 h-16', text: 'text-2xl', img: 44 },
  xl: { container: 'w-20 h-20', text: 'text-3xl', img: 56 },
};

export default function CommunityLogoDisplay({ logoUrl, logoPreset, name, color = '#F97316', size = 'md' }: Props) {
  const { container, text, img } = SIZE_MAP[size];
  const initials = name ? name.charAt(0).toUpperCase() : '?';

  const presetSrc = logoPreset ? PRESET_SRCS[logoPreset] : null;

  return (
    <div
      className={`${container} rounded-2xl flex items-center justify-center shrink-0 overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${color}25, ${color}10)`, border: `1px solid ${color}40` }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
      ) : presetSrc ? (
        <Image src={presetSrc} alt={name} width={img} height={img} className="p-1.5" />
      ) : (
        <span className={`${text} font-black`} style={{ color }}>{initials}</span>
      )}
    </div>
  );
}
