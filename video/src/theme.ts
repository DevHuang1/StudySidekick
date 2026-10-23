import { Easing } from 'remotion';

export const COLORS = {
  ink: '#29271f',
  paper: '#faf9f6',
  dark: '#141310',
  muted: '#77746c',
  rule: '#e6e3dc',
  darkRule: '#26241f',
  surface: '#f3f1ec',
  accentPlum: '#786875',
  accentSage: '#738a78',
  accentOchre: '#ae8068',
} as const;

export const TYPE = {
  Display: {
    fontSize: 200,
    lineHeight: 0.96,
    letterSpacing: '-0.04em',
    fontWeight: 600 as const,
  },
  H1: {
    fontSize: 128,
    lineHeight: 1.0,
    letterSpacing: '-0.03em',
    fontWeight: 600 as const,
  },
  H2: {
    fontSize: 96,
    lineHeight: 1.04,
    letterSpacing: '-0.025em',
    fontWeight: 600 as const,
  },
  Body: {
    fontSize: 48,
    lineHeight: 1.35,
    letterSpacing: '-0.01em',
    fontWeight: 400 as const,
  },
  Label: {
    fontSize: 32,
    lineHeight: 1.2,
    letterSpacing: '0.08em',
    fontWeight: 600 as const,
    textTransform: 'uppercase' as const,
  },
} as const;

export const SPACE = {
  4: 4,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
  96: 96,
  120: 120,
  140: 140,
  300: 300,
} as const;

export const GRID = {
  width: 1920,
  height: 1080,
  safeX: 140,
  safeY: 120,
  contentWidth: 1640,
  contentHeight: 840,
  gutter: 32,
  columns: 12,
  bleedRight: 60,
} as const;

const COL_UNIT = (GRID.contentWidth - GRID.gutter * (GRID.columns - 1)) / GRID.columns;

/** Left X offset inside the 1640px content box for 1-indexed column `col` (1..12) */
export const colOffset = (col: number): number =>
  Math.round((col - 1) * (COL_UNIT + GRID.gutter));

/** Exact pixel width of `span` columns (1..12) including internal gutters */
export const colSpanWidth = (span: number): number =>
  Math.round(span * COL_UNIT + (span - 1) * GRID.gutter);

export const MOTION = {
  easeOut: Easing.bezier(0.16, 1, 0.3, 1),
  springConfig: { damping: 200, mass: 0.6, stiffness: 100 } as const,
  entranceFrames: 24,
  headlineHoldFrames: 24,
} as const;
