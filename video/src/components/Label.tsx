import React from 'react';
import { COLORS, TYPE } from '../theme';

interface LabelProps {
  color?: string;
  opacity?: number;
  translateY?: number;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  color = COLORS.muted,
  opacity = 1,
  translateY = 0,
  children,
}) => (
  <div
    style={{
      fontSize: TYPE.Label.fontSize,
      lineHeight: TYPE.Label.lineHeight,
      letterSpacing: TYPE.Label.letterSpacing,
      fontWeight: TYPE.Label.fontWeight,
      textTransform: TYPE.Label.textTransform,
      color,
      opacity,
      transform: `translateY(${translateY}px)`,
      margin: 0,
    }}
  >
    {children}
  </div>
);
