import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AppFrame, C, Copy, Eyebrow, FilmCanvas, Panel, Tag, ease, reveal } from '../components/FilmKit';

export const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const secondsLeft = Math.max(25 * 60 - Math.floor(frame / 30), 0);
  const elapsedProgress = (25 * 60 - secondsLeft) / (25 * 60);
  const circumference = 2 * Math.PI * 142;
  const timer = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const breathe = 1 + Math.sin(frame / 24) * 0.008;
  const chapter = frame < 210 ? 'A small session is easier to begin.' : frame < 420 ? 'Keep one task in front of you.' : 'The saved deadline keeps the timer accurate after reload.';

  return (
    <FilmCanvas>
      <AppFrame active="Focus timer" title="Make room to focus" subtitle="One block. One thing to work on.">
        <Panel padding={28} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: 500, alignItems: 'center', ...reveal(frame, 22, 24) }}>
          <div style={{ padding: '20px 16px 20px 24px' }}>
            <Tag background={C.plumWash} color={C.plum}>FOCUS SESSION</Tag>
            <div style={{ color: C.ink, fontSize: 36, lineHeight: 1.16, letterSpacing: -1.4, fontWeight: 650, marginTop: 25, maxWidth: 480 }}>Biology lab report</div>
            <Copy size={17} style={{ marginTop: 12 }}>A 25-minute timer, started from your Sidekick request.</Copy>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
              <div style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: C.sage }} /><Copy size={15} color={C.sage}>In progress</Copy>
            </div>
            <div style={{ marginTop: 29, padding: '15px 16px', borderLeft: `3px solid ${C.clay}`, backgroundColor: '#fbfaf8', ...reveal(frame, 180, 20) }}>
              <Copy size={15} color={C.ink}>{chapter}</Copy>
            </div>
          </div>
          <div style={{ display: 'grid', justifyItems: 'center', paddingRight: 22 }}>
            <div style={{ position: 'relative', width: 310, height: 310, display: 'grid', placeItems: 'center', borderRadius: 999, transform: `scale(${breathe})` }}>
              <svg width="310" height="310" viewBox="0 0 310 310" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="155" cy="155" r="142" fill="none" stroke={C.sageWash} strokeWidth="12" />
                <circle cx="155" cy="155" r="142" fill="none" stroke={C.sage} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - elapsedProgress)} transform="rotate(-90 155 155)" />
              </svg>
              <div style={{ textAlign: 'center' }}><Eyebrow style={{ fontSize: 12, letterSpacing: 1.4 }}>TIME LEFT</Eyebrow><div style={{ color: C.ink, fontSize: 72, lineHeight: 1, fontWeight: 620, letterSpacing: -3, fontVariantNumeric: 'tabular-nums', marginTop: 15 }}>{timer}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 9, marginTop: 23, opacity: ease(frame, 400, 18) }}>
              <Tag background={C.sageWash} color={C.sage}>Timer running</Tag><Tag background="#f6f4ef" color={C.muted}>Browser saved</Tag>
            </div>
          </div>
        </Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 17, ...reveal(frame, 260, 20) }}>
          <Copy size={13} color={C.muted}>The timer keeps going if you visit another page.</Copy><Copy size={13} color={C.muted}>25:00 → {timer}</Copy>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};
