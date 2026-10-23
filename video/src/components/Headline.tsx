import React from 'react';
import { COLORS, TYPE } from '../theme';

interface HeadlineProps {
  size?: 'Display' | 'H1' | 'H2';
  color?: string;
  align?: 'left' | 'center';
  opacity?: number;
  translateY?: number;
  children: React.ReactNode;
}

export const Headline: React.FC<HeadlineProps> = ({
  size = 'H2',
  color = COLORS.ink,
  align = 'left',
  opacity = 1,
  translateY = 0,
  children,
}) => {
  const spec = TYPE[size];
  return (
    <div
      style={{
        fontSize: spec.fontSize,
        lineHeight: spec.lineHeight,
        letterSpacing: spec.letterSpacing,
        fontWeight: spec.fontWeight,
        color,
        textAlign: align,
        maxWidth: '18ch',
        opacity,
        transform: `translateY(calc(-0.06em + ${translateY}px))`,
        margin: 0,
        whiteSpace: 'pre-line',
      }}
    >
      {children}
    </div>
  );
};
