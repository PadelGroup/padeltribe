'use client';
import { PADEL_LEVELS } from '@/types';

interface Props {
  value: number | null | undefined;
  onChange: (level: number) => void;
  readOnly?: boolean;
}

export default function LevelPicker({ value, onChange, readOnly = false }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5">
        {PADEL_LEVELS.map(level => {
          const isActive = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(level.value)}
              title={`${level.label} — ${level.badge}\n${level.description}`}
              className={`relative flex flex-col items-center justify-center rounded-xl py-3 px-1 border-2 transition-all
                ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                ${isActive
                  ? 'border-[#F97316] shadow-md scale-105'
                  : 'border-[#E8E4DF] bg-white hover:border-[#F97316]/40'
                }`}
              style={isActive ? { background: `${level.color}15`, borderColor: level.color } : {}}
            >
              <span className="text-lg font-black" style={{ color: isActive ? level.color : '#9CA3AF' }}>
                {level.value}
              </span>
              <span className="text-[9px] font-semibold mt-0.5 text-center leading-tight"
                style={{ color: isActive ? level.color : '#9CA3AF' }}>
                {level.badge.split('+')[0]}
              </span>
              {isActive && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F97316] rounded-full flex items-center justify-center">
                  <span className="text-white text-[9px]">✓</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {value && (
        <div className="bg-[#FFF4EC] border border-[#FDBA74] rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-xl font-black shrink-0" style={{ color: PADEL_LEVELS[value - 1]?.color }}>
            {value}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {PADEL_LEVELS[value - 1]?.label} — {PADEL_LEVELS[value - 1]?.badge}
              </p>
              <span className="text-[10px] font-medium text-[#9CA3AF] bg-white border border-[#E8E4DF] rounded px-1.5 py-0.5">
                Viya {PADEL_LEVELS[value - 1]?.viyaRef}
              </span>
            </div>
            <p className="text-xs text-[#616161] mt-0.5">{PADEL_LEVELS[value - 1]?.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
