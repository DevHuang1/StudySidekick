import React from 'react';
import { COLORS, TYPE } from '../theme';

interface BodyProps {
  muted?: boolean;
  color?: string;
  opacity?: number;
  translateY?: number;
  children: React.ReactNode;
}

export const Body: React.FC<BodyProps> = ({
  muted = false,
  color,
  opacity = 1,
  translateY = 0,
  children,
}) => {
  const resolvedColor = color ?? (muted ? COLORS.muted : COLORS.ink);
  return (
    <div
      style={{
        fontSize: TYPE.Body.fontSize,
        lineHeight: TYPE.Body.lineHeight,
        letterSpacing: TYPE.Body.letterSpacing,
        fontWeight: TYPE.Body.fontWeight,
        color: resolvedColor,
        textAlign: 'left',
        maxWidth: '42ch',
        opacity,
        transform: `translateY(${translateY}px)`,
        margin: 0,
      }}
    >
      {children}
    </div>
  );
};
