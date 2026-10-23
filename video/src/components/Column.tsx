import React from 'react';
import { colOffset, colSpanWidth, GRID, SPACE } from '../theme';

interface ColumnProps {
  start: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  span: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  top?: number;
  bottom?: number;
  bleedRight?: boolean;
  align?: 'flex-start' | 'center' | 'flex-end';
  gap?: keyof typeof SPACE;
  opacity?: number;
  translateY?: number;
  scale?: number;
  children: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({
  start,
  span,
  top,
  bottom,
  bleedRight = false,
  align = 'flex-start',
  gap = 24,
  opacity = 1,
  translateY = 0,
  scale = 1,
  children,
}) => {
  const baseWidth = colSpanWidth(span);
  const width = bleedRight ? baseWidth + GRID.safeX + GRID.bleedRight : baseWidth;

  return (
    <div
      style={{
        position: 'absolute',
        left: colOffset(start),
        top,
        bottom,
        width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: SPACE[gap],
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: align === 'center' ? 'center center' : 'left top',
      }}
    >
      {children}
    </div>
  );
};
