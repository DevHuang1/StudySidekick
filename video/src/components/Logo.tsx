import React from 'react';
import { COLORS, SPACE } from '../theme';

interface LogoProps {
  size?: number;
  progress?: number;
  color?: string;
  accent?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 64,
  progress = 1,
  color = COLORS.ink,
  accent = COLORS.accentSage,
}) => {
  const dashOffset = (1 - Math.max(0, Math.min(1, progress))) * 240;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[16] }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="12"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="240"
          strokeDashoffset={dashOffset}
        />
        <path
          d="M20 24H44M20 34H36M20 44H30"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={progress}
        />
        <circle cx="42" cy="44" r="4" fill={accent} opacity={progress} />
      </svg>
    </div>
  );
};
