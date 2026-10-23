import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import captions from '../captions.json';

type Cue = {
  startFrame: number;
  endFrame: number;
  text: string;
};

const cues = captions.cues as Cue[];
const FADE_FRAMES = 5;

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = cues.find(({ startFrame, endFrame }) => frame >= startFrame && frame < endFrame);

  if (!cue) return null;

  const opacity = interpolate(
    frame,
    [cue.startFrame, cue.startFrame + FADE_FRAMES, cue.endFrame - FADE_FRAMES, cue.endFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 24,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1680,
          padding: '13px 22px',
          borderRadius: 12,
          border: '1px solid rgba(250,249,246,.14)',
          backgroundColor: 'rgba(20,19,16,.88)',
          color: '#faf9f6',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 26,
          lineHeight: 1.35,
          fontWeight: 500,
          letterSpacing: 0.1,
          textAlign: 'center',
          boxShadow: '0 10px 28px rgba(20,19,16,.16)',
          opacity,
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
