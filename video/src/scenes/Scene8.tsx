import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AppFrame, C, Copy, Eyebrow, FilmCanvas, Panel, ProgressBar, Tag, ease, reveal } from '../components/FilmKit';

export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const checked = ease(frame, 185, 22);
  const progress = Math.round(checked * 60);
  const checkScale = interpolate(frame, [185, 194, 207], [0.6, 1.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <FilmCanvas>
      <AppFrame active="Weekly plan" title="Progress, at your pace" subtitle="You choose when a study block is done.">
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
          <Panel padding={24} style={{ minHeight: 470 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>TODAY’S STUDY BLOCKS</Eyebrow><Tag>Biology</Tag>
            </div>
            <StudyBlock title="Start the lab report" time="60 min" done={checked} scale={checkScale} />
            <StudyBlock title="Keep working on the report" time="30 min" done={0} scale={1} />
            <div style={{ marginTop: 15, padding: '13px 0 0', borderTop: `1px solid ${C.line}`, ...reveal(frame, 215, 20) }}><Copy size={12}>Tomorrow · Continue the report · 30 min</Copy></div>
            <div style={{ marginTop: 20, padding: '14px 15px', borderRadius: 9, backgroundColor: '#fbfaf8', border: `1px solid ${C.line}`, ...reveal(frame, 250, 20) }}>
              <Copy size={14} color={C.ink}>When you finish a block, check it off in your week.</Copy>
            </div>
          </Panel>
          <Panel padding={25} style={{ minHeight: 470, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2, ...reveal(frame, 100, 20) }}>WEEKLY STUDY PROGRESS</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 22, ...reveal(frame, 130, 24) }}><span style={{ color: C.ink, fontSize: 72, fontWeight: 680, lineHeight: 1, letterSpacing: -4 }}>{progress}</span><span style={{ color: C.muted, fontSize: 21 }}>minutes done</span></div>
            <div style={{ marginTop: 25 }}><ProgressBar progress={progress / 120 * 100} height={12} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}><Copy size={13}>Completed</Copy><Copy size={13} color={C.ink}>120 min planned</Copy></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 30, padding: 15, borderRadius: 10, backgroundColor: C.sageWash, ...reveal(frame, 275, 22) }}>
              <span style={{ color: C.sage, fontSize: 19, fontWeight: 800 }}>✓</span><Copy size={14} color={C.sage}>Checked off by you, counted in your progress.</Copy>
            </div>
          </Panel>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};

const StudyBlock: React.FC<{ title: string; time: string; done: number; scale: number }> = ({ title, time, done, scale }) => (
  <div style={{ minHeight: 91, display: 'flex', alignItems: 'center', gap: 15, padding: '17px 0', borderTop: `1px solid ${C.line}` }}>
    <div style={{ width: 24, height: 24, flex: '0 0 24px', display: 'grid', placeItems: 'center', border: `2px solid ${done > 0 ? C.sage : '#cfc9bf'}`, borderRadius: 7, color: C.white, backgroundColor: done > 0 ? C.sage : C.white, fontSize: 14, fontWeight: 800, transform: `scale(${scale})` }}>{done > 0.7 ? '✓' : ''}</div>
    <div style={{ flex: 1 }}><div style={{ color: done > 0.7 ? C.muted : C.ink, fontSize: 15, fontWeight: 650, textDecoration: done > 0.7 ? 'line-through' : 'none' }}>{title}</div><Copy size={13} style={{ marginTop: 5 }}>{time}</Copy></div>
    <Tag background={done > 0.7 ? C.sageWash : '#f6f4ef'} color={done > 0.7 ? C.sage : C.muted}>{done > 0.7 ? 'Done' : 'Open'}</Tag>
  </div>
);
