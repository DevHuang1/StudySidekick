import React from 'react';
import { COLORS } from '../theme';

interface RuleProps {
  dark?: boolean;
  color?: string;
  opacity?: number;
}

export const Rule: React.FC<RuleProps> = ({ dark = false, color, opacity = 1 }) => (
  <div
    style={{
      width: '100%',
      height: 2,
      backgroundColor: color ?? (dark ? COLORS.darkRule : COLORS.rule),
      opacity,
    }}
  />
);
