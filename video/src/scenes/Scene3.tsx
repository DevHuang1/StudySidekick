import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AppFrame, C, Copy, Eyebrow, FilmCanvas, Panel, ProgressBar, Tag, ease, reveal } from '../components/FilmKit';

const Day: React.FC<{ day: string; minutes: string; frame: number; start: number; accent: string }> = ({ day, minutes, frame, start, accent }) => {
  const amount = ease(frame, start, 32);
  const typing = Math.round(amount * minutes.length);
  return (
    <div style={{ padding: 20, border: `1px solid ${C.line}`, borderRadius: 12, backgroundColor: C.white, ...reveal(frame, start - 10, 22) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <div style={{ color: C.ink, fontSize: 17, fontWeight: 700 }}>{day}</div>
        <Tag background={C.sageWash} color={accent}>{typing ? `${minutes.slice(0, typing)} available` : 'Set hours'}</Tag>
      </div>
      <div style={{ height: 13, borderRadius: 99, backgroundColor: '#f0eee8', overflow: 'hidden' }}>
        <div style={{ width: `${amount * (day === 'Today' ? 74 : 34)}%`, height: '100%', borderRadius: 99, backgroundColor: accent }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 13 }}>
        <Copy size={13}>Time set aside</Copy>
        <Copy size={13} color={C.ink}>{typing ? minutes.slice(0, typing) : '—'}</Copy>
      </div>
    </div>
  );
};

export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const total = Math.round(ease(frame, 310, 28) * 120);
  const cursorY = interpolate(frame, [0, 195, 215, 270, 290], [0, 0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <FilmCanvas>
      <AppFrame active="Weekly plan" title="Make time honest" subtitle="Set aside study time that fits around the rest of your day.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.72fr', gap: 19, alignItems: 'stretch' }}>
          <Panel padding={25} style={{ minHeight: 490 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 23 }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>AVAILABLE STUDY HOURS</Eyebrow>
              <Tag>Before the due date</Tag>
            </div>
            <div style={{ display: 'grid', gap: 15 }}>
              <Day day="Today" minutes="90 min" frame={frame} start={68} accent={C.plum} />
              <Day day="Tomorrow" minutes="30 min" frame={frame} start={160} accent={C.sage} />
            </div>
            <div style={{ height: 1, backgroundColor: C.line, margin: '24px 0 18px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: ease(frame, 230, 18) }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: C.clay }} />
              <Copy size={14} color={C.ink}>The hours you enter shape the plan.</Copy>
            </div>
          </Panel>
          <Panel padding={25} style={{ minHeight: 490, backgroundColor: '#fbfaf8' }}>
            <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>TIME BEFORE THIS DEADLINE</Eyebrow>
            <div style={{ height: 1, backgroundColor: C.line, margin: '22px 0 26px' }} />
            <div style={{ display: 'grid', gap: 22 }}>
              <div style={{ ...reveal(frame, 230, 22) }}>
                <Copy size={14}>Today</Copy><div style={{ color: C.plum, fontSize: 34, fontWeight: 650, letterSpacing: -1, marginTop: 4 }}>90 min</div>
              </div>
              <div style={{ ...reveal(frame, 278, 22) }}>
                <Copy size={14}>Tomorrow</Copy><div style={{ color: C.sage, fontSize: 34, fontWeight: 650, letterSpacing: -1, marginTop: 4 }}>30 min</div>
              </div>
            </div>
            <div style={{ marginTop: 28, padding: 18, borderRadius: 11, backgroundColor: C.white, border: `1px solid ${C.line}`, ...reveal(frame, 330, 24) }}>
              <Copy size={13}>Total available before it is due</Copy>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}><span style={{ color: C.ink, fontSize: 36, fontWeight: 700 }}>{total}</span><span style={{ color: C.muted, fontSize: 15 }}>minutes</span></div>
              <ProgressBar progress={Math.min(100, total / 180 * 100)} height={7} />
            </div>
            <div style={{ position: 'absolute', right: 125, top: 455, opacity: cursorY, pointerEvents: 'none' }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: C.ink, color: C.white, fontSize: 12 }}>Edit hours</div>
            </div>
            <Copy size={12} color={C.muted} style={{ marginTop: 18, ...reveal(frame, 385, 18) }}>Availability is yours to change whenever the week changes.</Copy>
          </Panel>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};
