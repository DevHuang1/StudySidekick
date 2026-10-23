import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  AppFrame,
  C,
  Copy,
  Eyebrow,
  FilmCanvas,
  Panel,
  ProgressBar,
  Rule,
  Stat,
  Tag,
  reveal,
} from '../components/FilmKit';

export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = frame < 190 ? 'Start with the estimate.' : frame < 370 ? 'Then compare it with the hours you have.' : 'The open gap is part of the plan.';
  return (
    <FilmCanvas>
      <AppFrame active="Weekly plan" title="Weekly plan" subtitle="A plan that starts with your real availability.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Panel padding={20} style={{ ...reveal(frame, 28, 22) }}><Stat value="3h" label="Biology lab effort" /></Panel>
          <Panel padding={20} style={{ ...reveal(frame, 100, 22) }}><Stat value="2h" label="Time available" /></Panel>
          <Panel padding={20} style={{ backgroundColor: C.warningWash, borderColor: '#f0d7d0', ...reveal(frame, 172, 22) }}>
            <Stat value="60m" label="Won’t fit before the due date" accent={C.warning} />
          </Panel>
        </div>

        <Panel padding={22} style={{ marginTop: 18, ...reveal(frame, 238, 24) }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>AVAILABLE TIME, PLANNED</Eyebrow>
            <Tag background={C.sageWash} color={C.sage}>2 hours scheduled</Tag>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ ...reveal(frame, 315, 24) }}><DayPlan day="Today" time="90 min" detail="Biology lab report" progress={50} /></div>
            <div style={{ ...reveal(frame, 390, 24) }}><DayPlan day="Tomorrow" time="30 min" detail="Biology lab report" progress={17} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 18, paddingTop: 15, borderTop: `1px solid ${C.line}`, ...reveal(frame, 470, 24) }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: C.warning }} />
            <Copy size={14} color={C.warning}>The plan flags the shortfall, so the deadline doesn’t look covered when it isn’t.</Copy>
          </div>
        </Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, padding: '13px 16px', borderRadius: 10, backgroundColor: C.plumWash, ...reveal(frame, 540, 22) }}>
          <Copy size={15} color={C.ink}>{phase}</Copy>
          <span style={{ color: C.plum, fontSize: 13, fontWeight: 700 }}>3h effort − 2h available = 60m short</span>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};

const DayPlan: React.FC<{ day: string; time: string; detail: string; progress: number }> = ({ day, time, detail, progress }) => (
  <div style={{ padding: 17, border: `1px solid ${C.line}`, borderRadius: 11, backgroundColor: '#fffefa' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 13 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{day}</div>
      <div style={{ color: C.plum, fontSize: 15, fontWeight: 700 }}>{time}</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
      <Copy size={14} color={C.ink}>{detail}</Copy>
      <Copy size={13}>of 3h</Copy>
    </div>
    <ProgressBar progress={progress} height={7} />
  </div>
);
