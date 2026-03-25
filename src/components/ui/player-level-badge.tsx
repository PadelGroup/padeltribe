import { PADEL_LEVELS } from '@/types';

interface Props {
  level: number | null | undefined;
  size?: 'sm' | 'md';
}

export default function PlayerLevelBadge({ level, size = 'sm' }: Props) {
  if (!level) return null;
  const info = PADEL_LEVELS[level - 1];
  if (!info) return null;

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg text-white shrink-0
        ${size === 'sm' ? 'px-1.5 py-0.5 text-[10px] gap-0.5' : 'px-2 py-1 text-xs gap-1'}`}
      style={{ background: info.color }}
      title={`${info.badge}: ${info.description}`}
    >
      {info.badge}
    </span>
  );
}
