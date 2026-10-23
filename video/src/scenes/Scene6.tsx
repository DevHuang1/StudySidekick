import React from 'react';
import { useCurrentFrame } from 'remotion';
import { AppFrame, C, Copy, Eyebrow, FilmCanvas, Panel, Rule, Tag, ease, reveal } from '../components/FilmKit';

export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const saved = ease(frame, 190, 24);
  const phase = frame < 170 ? 'Work is placed inside the hours you set.' : frame < 340 ? 'The remaining hour stays visible.' : 'A reminder is ready in the app.';
  return (
    <FilmCanvas>
      <AppFrame active="Weekly plan" title="Your week, in view" subtitle="See the sessions, the space, and the gap together.">
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.8fr', gap: 18 }}>
          <Panel padding={23}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 21, ...reveal(frame, 24, 22) }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>BIOLOGY LAB REPORT</Eyebrow>
              <Tag background={C.clayWash} color={C.clay}>Due tomorrow · 3h total</Tag>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <ScheduleDay day="Today" time="90 min" available="90 min" blocks={[['Start the report', '60 min'], ['Keep working on the report', '30 min']]} color={C.plum} frame={frame} start={55} />
              <ScheduleDay day="Tomorrow" time="30 min" available="30 min" blocks={[["Continue the report", "30 min"]]} color={C.sage} frame={frame} start={110} />
            </div>
            <div style={{ marginTop: 19, padding: 16, borderRadius: 10, border: '1px solid #f0d7d0', backgroundColor: C.warningWash, opacity: 0.25 + ease(frame, 150, 24) * 0.75 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
                <div><div style={{ color: C.warning, fontSize: 15, fontWeight: 750 }}>60 minutes still won’t fit</div><Copy size={13} color={C.warning} style={{ marginTop: 4 }}>The deadline is not shown as covered.</Copy></div>
                <span style={{ color: C.warning, fontSize: 22, fontWeight: 750 }}>!</span>
              </div>
            </div>
          </Panel>
          <Panel padding={23} style={{ minHeight: 420 }}>
            <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>REMINDER CHECKLIST</Eyebrow>
            <Copy size={14} style={{ marginTop: 7, marginBottom: 18 }}>Keep the next step where you can find it.</Copy>
            <Rule />
            <div style={{ minHeight: 120, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '19px 0', ...reveal(frame, 220, 22) }}>
              <div style={{ width: 21, height: 21, flex: '0 0 21px', border: `2px solid ${C.sage}`, borderRadius: 6, marginTop: 2 }} />
              <div><div style={{ color: C.ink, fontSize: 15, lineHeight: 1.4, fontWeight: 650 }}>Submit the Biology lab PDF</div><Copy size={13} style={{ marginTop: 5 }}>Tomorrow</Copy></div>
            </div>
            <Rule />
            <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 19, opacity: saved }}>
              <div style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: 99, backgroundColor: C.sage, color: C.white, fontSize: 13, fontWeight: 800 }}>✓</div>
              <Copy size={13} color={C.sage}>Saved to this browser</Copy>
            </div>
          </Panel>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, padding: '13px 15px', borderRadius: 9, backgroundColor: C.plumWash, ...reveal(frame, 280, 24) }}>
          <Copy size={15} color={C.ink}>{phase}</Copy><Tag background={C.white} color={C.plum}>Plan + reminder</Tag>
        </div>
        <Copy size={12} color={C.muted} style={{ marginTop: 10, ...reveal(frame, 340, 18) }}>Reminder checklist stays in the app; it does not send operating-system notifications.</Copy>
      </AppFrame>
    </FilmCanvas>
  );
};

const ScheduleDay: React.FC<{ day: string; time: string; available: string; blocks: [string, string][]; color: string; frame: number; start: number }> = ({ day, time, available, blocks, color, frame, start }) => (
  <div style={{ padding: 16, border: `1px solid ${C.line}`, borderRadius: 11, backgroundColor: '#fffefa', ...reveal(frame, start, 24) }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}><div style={{ color: C.ink, fontSize: 16, fontWeight: 700 }}>{day}</div><Copy size={12}>{available} available</Copy></div>
    <div style={{ display: 'grid', gap: 7 }}>
      {blocks.map(([detail, length], index) => <div key={detail} style={{ borderLeft: `4px solid ${color}`, borderRadius: 5, padding: '9px 12px', backgroundColor: '#f8f6f2', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><div style={{ color: C.ink, fontSize: 13, fontWeight: 650 }}>{detail}</div><Copy size={12}>{length}</Copy></div>)}
    </div>
    <Copy size={12} style={{ marginTop: 9 }}>{time} planned · shown inside your available time</Copy>
  </div>
);
