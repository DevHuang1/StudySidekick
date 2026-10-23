import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, MOTION, TYPE } from '../theme';

export interface MorphSegment {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface MorphTextProps {
  segments: readonly MorphSegment[];
  size?: 'Display' | 'H1' | 'H2' | 'Body' | 'Label';
  color?: string;
  align?: 'left' | 'center';
  morphFrames?: number;
}

/**
 * Optical text morphing using only `transform`, `opacity`, and `filter: blur(...)`
 * in strict compliance with MOTION LAW.
 * Outgoing text blurs, scales down slightly (0.97), and rises (-12px) while
 * incoming text unblurs (10px -> 0px), scales (1.03 -> 1.0), and settles (12px -> 0px).
 */
export const MorphText: React.FC<MorphTextProps> = ({
  segments,
  size = 'H2',
  color = COLORS.ink,
  align = 'left',
  morphFrames = MOTION.entranceFrames,
}) => {
  const frame = useCurrentFrame();
  const spec = TYPE[size];
  const isHeadline = size === 'Display' || size === 'H1' || size === 'H2';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: Math.round(spec.fontSize * spec.lineHeight * 2.1),
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {segments.map((seg, idx) => {
        const enterStart = seg.startFrame;
        const enterEnd = seg.startFrame + morphFrames;
        const exitStart = seg.endFrame - morphFrames;
        const exitEnd = seg.endFrame;

        if (frame < enterStart - 2 || frame > exitEnd + 2) {
          return null;
        }

        const enterProgress =
          frame === 0 && idx === 0
            ? 1
            : interpolate(frame, [enterStart, enterEnd], [0, 1], {
                easing: MOTION.easeOut,
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

        const exitProgress = interpolate(frame, [exitStart, exitEnd], [0, 1], {
          easing: MOTION.easeOut,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const opacity = enterProgress * (1 - exitProgress);
        const blurPx = (1 - enterProgress) * 10 + exitProgress * 10;
        const translateY = (1 - enterProgress) * 14 - exitProgress * 14;
        const scale = 1 + (1 - enterProgress) * 0.03 - exitProgress * 0.03;

        return (
          <div
            key={`${seg.startFrame}-${idx}`}
            style={{
              position: 'absolute',
              top: 0,
              left: align === 'center' ? 0 : 0,
              right: align === 'center' ? 0 : 'auto',
              fontSize: spec.fontSize,
              lineHeight: spec.lineHeight,
              letterSpacing: spec.letterSpacing,
              fontWeight: spec.fontWeight,
              textTransform: 'textTransform' in spec ? spec.textTransform : undefined,
              color,
              textAlign: align,
              maxWidth: isHeadline ? '18ch' : '42ch',
              whiteSpace: 'pre-line',
              opacity,
              filter: blurPx > 0.1 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
              transform: isHeadline
                ? `translateY(calc(-0.06em + ${translateY.toFixed(2)}px)) scale(${scale.toFixed(4)})`
                : `translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(4)})`,
              transformOrigin: align === 'center' ? 'center center' : 'left top',
              willChange: 'transform, opacity, filter',
            }}
          >
            {seg.text}
          </div>
        );
      })}
    </div>
  );
};
