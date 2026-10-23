import React from 'react';
import { COLORS, SPACE } from '../theme';

interface ScreenFrameProps {
  width?: number | string;
  height?: number;
  opacity?: number;
  translateY?: number;
  scale?: number;
  blurPx?: number;
  padding?: keyof typeof SPACE;
  gap?: keyof typeof SPACE;
  borderColor?: string;
  surfaceColor?: string;
  children: React.ReactNode;
}

export const ScreenFrame: React.FC<ScreenFrameProps> = ({
  width = '100%',
  height,
  opacity = 1,
  translateY = 0,
  scale = 1,
  blurPx = 0,
  padding = 32,
  gap = 24,
  borderColor = COLORS.rule,
  surfaceColor = COLORS.surface,
  children,
}) => (
  <div
    style={{
      width,
      height,
      padding: SPACE[padding],
      backgroundColor: surfaceColor,
      border: `2px solid ${borderColor}`,
      borderRadius: SPACE[16],
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: SPACE[gap],
      boxSizing: 'border-box',
      opacity,
      filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
      transform: `translateY(${translateY}px) scale(${scale})`,
      transformOrigin: 'center top',
      willChange: 'transform, opacity, filter',
    }}
  >
    {children}
  </div>
);
