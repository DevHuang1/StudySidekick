import React from 'react';
import { interpolate } from 'remotion';
import { COLORS, MOTION } from '../theme';

interface LightBloomProps {
  frame: number;
  durationFrames?: number;
}

/**
 * Optical paper light bloom for Scene 2 transition from cold dark open.
 * Uses only `opacity` and `transform` + `filter: blur(...)`.
 */
export const LightBloom: React.FC<LightBloomProps> = ({ frame, durationFrames = 36 }) => {
  if (frame > durationFrames) return null;
  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    easing: MOTION.easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = 1 - progress;
  const scale = 0.85 + progress * 0.45;
  const blur = (1 - progress) * 24;

  return (
    <div
      style={{
        position: 'absolute',
        inset: -140,
        backgroundColor: COLORS.paper,
        opacity,
        transform: `scale(${scale.toFixed(3)})`,
        filter: `blur(${blur.toFixed(1)}px) brightness(${(1.15 - progress * 0.15).toFixed(2)})`,
        pointerEvents: 'none',
      }}
    />
  );
};

interface RippleEffectProps {
  frame: number;
  triggerFrame: number;
  durationFrames?: number;
  color?: string;
}

/**
 * 6-frame tactile ripple ring on tap (Scene 4 "Apply all" at f2460).
 */
export const RippleRing: React.FC<RippleEffectProps> = ({
  frame,
  triggerFrame,
  durationFrames = 12,
  color = COLORS.accentPlum,
}) => {
  const local = frame - triggerFrame;
  if (local < 0 || local > durationFrames) return null;

  const progress = interpolate(local, [0, durationFrames], [0, 1], {
    easing: MOTION.easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = 0.9 + progress * 0.65;
  const opacity = (1 - progress) * 0.85;

  return (
    <div
      style={{
        position: 'absolute',
        inset: -8,
        borderRadius: 12,
        border: `2px solid ${color}`,
        opacity,
        transform: `scale(${scale.toFixed(3)})`,
        filter: `blur(${(progress * 2).toFixed(1)}px)`,
        pointerEvents: 'none',
      }}
    />
  );
};

interface VignetteClosureProps {
  frame: number;
  durationFrames: number;
  maxClosurePct?: number;
}

/**
 * Scene 5 vignette that closes 6% over the duration of the focus ring shot.
 */
export const VignetteFrame: React.FC<VignetteClosureProps> = ({
  frame,
  durationFrames,
  maxClosurePct = 0.06,
}) => {
  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = 1 - progress * maxClosurePct;
  const opacity = 0.25 + progress * 0.55;

  return (
    <div
      style={{
        position: 'absolute',
        inset: -120,
        border: `96px solid ${COLORS.dark}`,
        borderRadius: 160,
        opacity,
        transform: `scale(${scale.toFixed(4)})`,
        filter: 'blur(32px)',
        pointerEvents: 'none',
      }}
    />
  );
};
