import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { AppFrame, Button, C, Copy, Eyebrow, FilmCanvas, Panel, Tag, ease, reveal } from '../components/FilmKit';

const Field: React.FC<{ label: string; value: string; frame: number; start: number; suffix?: string }> = ({ label, value, frame, start, suffix }) => {
  const shown = Math.round(ease(frame, start, 34) * value.length);
  return (
    <div style={{ ...reveal(frame, start - 8, 20) }}>
      <Eyebrow style={{ fontSize: 11, letterSpacing: 1.2, marginBottom: 8 }}>{label}</Eyebrow>
      <div style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', border: `1px solid ${C.line}`, borderRadius: 9, backgroundColor: '#fffefa', color: shown ? C.ink : '#c8c2b8', fontSize: 16 }}>
        <span>{shown ? value.slice(0, shown) : 'Add details'}{frame >= start && frame < start + 34 && <span style={{ color: C.clay }}>│</span>}</span>
        {suffix && <span style={{ color: C.muted, fontSize: 13 }}>{suffix}</span>}
      </div>
    </div>
  );
};

export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const addClick = interpolate(frame, [360, 368, 381, 390], [1, 0.94, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const saved = ease(frame, 386, 30);
  return (
    <FilmCanvas>
      <AppFrame active="Assignments" title="Start with what’s due" subtitle="Capture the deadline and your best estimate of the work.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.94fr', gap: 20 }}>
          <Panel padding={24} style={{ minHeight: 495 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 23 }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>ADD AN ASSIGNMENT</Eyebrow>
              <Tag>First, the essentials</Tag>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <Field label="Assignment title" value="Biology lab report" frame={frame} start={35} />
              <Field label="Course" value="Biology" frame={frame} start={110} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Due date" value="Tomorrow" frame={frame} start={185} />
                <Field label="Estimated total effort" value="3" frame={frame} start={250} suffix="hours" />
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
              <Copy size={13}>Estimate the full task, not just today’s study time.</Copy>
              <span style={{ transform: `scale(${addClick})`, transformOrigin: 'right center' }}><Button>+ Add assignment</Button></span>
            </div>
          </Panel>
          <Panel padding={24} style={{ minHeight: 495, backgroundColor: '#fbfaf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>SAVED ASSIGNMENTS</Eyebrow>
              <Tag background={C.sageWash} color={C.sage}>{saved > 0.8 ? '1 saved' : 'Ready when you are'}</Tag>
            </div>
            <div style={{ minHeight: 214, display: 'grid', placeItems: 'center', border: `1px dashed ${C.line}`, borderRadius: 12, color: C.muted, opacity: 1 - saved }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 34, color: C.clay, marginBottom: 12 }}>＋</div>
                <Copy size={16} color={C.ink}>One deadline gives your week a starting point.</Copy>
              </div>
            </div>
            <div style={{ position: 'absolute', left: '53.5%', right: 44, top: 290, opacity: saved, transform: `translateY(${(1 - saved) * 16}px)` }}>
              <div style={{ padding: 20, border: `1px solid ${C.line}`, borderRadius: 12, backgroundColor: C.white, boxShadow: '0 12px 30px rgba(54,47,38,.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ color: C.ink, fontSize: 19, fontWeight: 700 }}>Biology lab report</div>
                    <Copy size={14} style={{ marginTop: 6 }}>Biology · Due tomorrow</Copy>
                  </div>
                  <Tag background={C.clayWash} color={C.clay}>3h effort</Tag>
                </div>
                <div style={{ height: 1, backgroundColor: C.line, margin: '18px 0 14px' }} />
                <Copy size={14}>Added to your browser. Next, set the time you actually have.</Copy>
              </div>
            </div>
            <div style={{ marginTop: 24, ...reveal(frame, 420, 24) }}>
              <Eyebrow style={{ fontSize: 11, letterSpacing: 1.2 }}>A USEFUL DISTINCTION</Eyebrow>
              <Copy size={17} color={C.ink} style={{ marginTop: 9, maxWidth: 430, lineHeight: 1.5 }}>Three hours is the total effort estimate. It does not mean three hours are free before the deadline.</Copy>
            </div>
          </Panel>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};
