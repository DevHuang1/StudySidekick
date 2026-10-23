import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C, Copy, Eyebrow, FilmCanvas, PageTitle, Tag, ease, reveal } from '../components/FilmKit';

const tools = ['Weekly plan', 'Assignments', 'Sidekick', 'Reminders', 'Focus timer'];

export const Scene9: React.FC = () => {
  const frame = useCurrentFrame();
  const closeLine = frame < 210 ? 'Plan what you can.' : frame < 345 ? 'See what won’t fit.' : 'Focus on one step at a time.';
  const markScale = interpolate(frame, [10, 40], [0.78, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <FilmCanvas>
      <div style={{ position: 'absolute', left: 128, top: 116, ...reveal(frame, 6, 24) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 14, backgroundColor: C.plum, color: C.white, fontSize: 22, fontWeight: 800, transform: `scale(${markScale})` }}>S</div>
          <div style={{ color: C.ink, fontSize: 22, fontWeight: 720, letterSpacing: -0.5 }}>Study <span style={{ color: C.clay }}>Sidekick</span></div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 128, top: 300, width: 865, ...reveal(frame, 18, 30) }}>
        <Eyebrow color={C.clay}>A STUDY WEEK THAT FITS YOUR LIFE</Eyebrow>
        <PageTitle size={78} style={{ marginTop: 27, letterSpacing: -4.3 }}>
          Make room for<br />
          the next thing.
        </PageTitle>
        <Copy size={23} style={{ maxWidth: 640, marginTop: 27 }}>
          Plan what you can. See what won’t fit. Then focus on one step at a time.
        </Copy>
      </div>

      <div style={{ position: 'absolute', left: 1120, top: 326, width: 580, ...reveal(frame, 52, 28) }}>
        <div style={{ padding: 29, border: `1px solid ${C.line}`, borderRadius: 16, backgroundColor: C.white, boxShadow: '0 20px 52px rgba(54, 47, 38, .07)' }}>
          <Eyebrow style={{ fontSize: 13, letterSpacing: 1.4 }}>ONE DEADLINE, MADE CLEAR</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 20, marginTop: 23 }}>
            <div>
              <div style={{ color: C.ink, fontSize: 20, fontWeight: 700 }}>Biology lab report</div>
              <Copy size={15} style={{ marginTop: 5 }}>Due tomorrow · 3h effort</Copy>
            </div>
            <Tag background={C.warningWash} color={C.warning}>60m short</Tag>
          </div>
          <div style={{ height: 1, backgroundColor: C.line, margin: '23px 0 18px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {tools.map((tool, index) => (
              <span key={tool} style={{ opacity: ease(frame, 86 + index * 7, 12) }}>
                <Tag background={index === 2 ? C.plumWash : '#f6f4ef'} color={index === 2 ? C.plum : C.muted}>{tool}</Tag>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 128, right: 128, bottom: 94, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...reveal(frame, 102, 22) }}>
        <Copy size={15} color={C.muted}>No account or sync. Study data is stored in your browser.</Copy>
        <div style={{ textAlign: 'right' }}>
          <Copy size={15} color={C.muted}>{closeLine}</Copy>
          <Copy size={13} color={C.muted} style={{ marginTop: 6, opacity: ease(frame, 220, 18) }}>Optional cloud AI asks before sending each request.</Copy>
        </div>
      </div>
    </FilmCanvas>
  );
};
