import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C, Copy, Eyebrow, FilmCanvas, PageTitle, Tag, ease, reveal } from '../components/FilmKit';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const leftIn = ease(frame, 10, 28);
  const rightIn = ease(frame, 46, 32);
  const pulse = interpolate(frame, [94, 125, 170], [0.96, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const effortIn = ease(frame, 82, 22);
  const capacityIn = ease(frame, 158, 22);
  const gapIn = ease(frame, 234, 22);
  const question = frame < 305 ? 'A deadline can look manageable until you count the hours.' : 'What happens when the available time is less than the work?';

  return (
    <FilmCanvas dark>
      <div style={{ position: 'absolute', left: 112, top: 104 }}>
        <Eyebrow color="#c5beb4">A FULL WEEK, IN REAL LIFE</Eyebrow>
      </div>
      <div style={{ position: 'absolute', left: 112, top: 255, width: 850, ...reveal(frame, 14, 30) }}>
        <PageTitle size={91} style={{ color: C.paper, letterSpacing: -4.8, lineHeight: 1.03 }}>
          Three hours<br />
          of work.<br />
          Due tomorrow.
        </PageTitle>
        <Copy size={25} color="#c5beb4" style={{ marginTop: 30, maxWidth: 600 }}>
          Biology lab report. Tonight, you have ninety minutes. Tomorrow, thirty.
        </Copy>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1110,
          top: 262,
          width: 610,
          padding: 34,
          border: '1px solid rgba(250,249,246,.17)',
          borderRadius: 18,
          backgroundColor: 'rgba(250,249,246,.055)',
          opacity: rightIn,
          transform: `translateY(${(1 - rightIn) * 18}px) scale(${pulse})`,
        }}
      >
        <Eyebrow color="#c5beb4">THE MATH DOESN’T FIT</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 32, marginBottom: 28 }}>
          <div style={{ opacity: effortIn, transform: `translateY(${(1 - effortIn) * 10}px)` }}>
            <div style={{ color: C.paper, fontSize: 55, lineHeight: 1, fontWeight: 650, letterSpacing: -2 }}>3h</div>
            <Copy size={17} color="#b8b1a7" style={{ marginTop: 10 }}>work to do</Copy>
          </div>
          <div style={{ opacity: capacityIn, transform: `translateY(${(1 - capacityIn) * 10}px)` }}>
            <div style={{ color: C.paper, fontSize: 55, lineHeight: 1, fontWeight: 650, letterSpacing: -2 }}>2h</div>
            <Copy size={17} color="#b8b1a7" style={{ marginTop: 10 }}>time available</Copy>
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: 'rgba(250,249,246,.16)', opacity: gapIn }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, opacity: gapIn, transform: `translateY(${(1 - gapIn) * 10}px)` }}>
          <Copy size={18} color="#d2a294">Still to fit before the deadline</Copy>
          <Tag background="#523a38" color="#f0c8bb">60 minutes</Tag>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 112, right: 112, bottom: 86, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8f897f', fontSize: 15, letterSpacing: 0.3 }}>
        <span>Study Sidekick <span style={{ padding: '0 12px', color: '#5f5a52' }}>·</span> Make a plan for the time you have</span>
        <span style={{ color: '#c5beb4', opacity: ease(frame, 295, 20) }}>{question}</span>
      </div>
    </FilmCanvas>
  );
};
