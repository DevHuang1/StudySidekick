import React from 'react';
import { COLORS, GRID } from '../theme';

interface FieldProps {
  tone?: 'paper' | 'dark';
  opacity?: number;
  scale?: number;
  flashWhiteOpacity?: number;
  children?: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  tone = 'paper',
  opacity = 1,
  scale = 1,
  flashWhiteOpacity = 0,
  children,
}) => {
  const background = tone === 'dark' ? COLORS.dark : COLORS.paper;
  return (
    <div
      style={{
        position: 'relative',
        width: GRID.width,
        height: GRID.height,
        backgroundColor: background,
        overflow: 'hidden',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: GRID.safeX,
          top: GRID.safeY,
          width: GRID.contentWidth,
          height: GRID.contentHeight,
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </div>
      {flashWhiteOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: COLORS.paper,
            opacity: flashWhiteOpacity,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
