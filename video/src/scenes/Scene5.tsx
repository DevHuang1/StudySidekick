import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import {
  AppFrame,
  Button,
  C,
  Copy,
  Eyebrow,
  FilmCanvas,
  Panel,
  Rule,
  Tag,
  ease,
  reveal,
} from '../components/FilmKit';

const actions = [
  ['Assignment', 'Add Biology lab report · 3h · due tomorrow'],
  ['Availability', 'Set today to 90m and tomorrow to 30m'],
  ['Weekly plan', 'Build a plan and show what will not fit'],
  ['Reminder', 'Submit the lab PDF'],
  ['Focus timer', 'Start a 25-minute session'],
];

export const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const tap = interpolate(frame, [770, 777, 790], [1, 0.95, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const applied = ease(frame, 790, 24);

  return (
    <FilmCanvas>
      <AppFrame active="Sidekick" title="Ask Sidekick" subtitle="One request can update your study week.">
        <div style={{ display: 'grid', gridTemplateColumns: '0.88fr 1.12fr', gap: 18, alignItems: 'stretch' }}>
          <Panel padding={24} style={{ minHeight: 480, ...reveal(frame, 22, 24) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>YOUR REQUEST</Eyebrow>
              <Tag background={C.sageWash} color={C.sage}>Local / guided</Tag>
            </div>
            <div
              style={{
                padding: 20,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                color: '#4f4a43',
                backgroundColor: '#fbfaf8',
                fontSize: 19,
                lineHeight: 1.58,
                minHeight: 205,
              }}
            >
              Add a 3-hour Biology lab report due tomorrow. I have 90 minutes today and 30 minutes tomorrow. Build my week, remind me to submit the lab PDF, and start a 25-minute focus session.
            </div>
            <Copy size={14} style={{ marginTop: 18 }}>
              Your request is turned into a plan you can review before anything is saved.
            </Copy>
          </Panel>

          <Panel padding={24} style={{ minHeight: 480, ...reveal(frame, 48, 24) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 }}>
              <div>
                <Eyebrow style={{ fontSize: 13, letterSpacing: 1.2 }}>REVIEW CHANGES</Eyebrow>
                <Copy size={13} style={{ marginTop: 5 }}>5 actions ready for your approval</Copy>
              </div>
              <span style={{ color: C.sage, fontSize: 15, fontWeight: 700 }}>Preview</span>
            </div>
            <Rule />
            <div style={{ marginTop: 8 }}>
              {actions.map(([label, value], index) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: index < actions.length - 1 ? `1px solid ${C.line}` : 'none', ...reveal(frame, 95 + index * 69, 22) }}>
                  <div style={{ width: 28, height: 28, flex: '0 0 28px', display: 'grid', placeItems: 'center', borderRadius: 8, backgroundColor: C.plumWash, color: C.plum, fontSize: 13, fontWeight: 700 }}>{index + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.ink, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                    <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.35 }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 15, borderTop: `1px solid ${C.line}` }}>
              <Copy size={13} color={applied > 0.8 ? C.sage : C.muted}>{applied > 0.8 ? 'Approved and saved to this browser.' : 'Nothing is saved until you approve it.'}</Copy>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ opacity: applied, transform: `translateY(${(1 - applied) * 5}px)` }}><Tag background={C.sageWash} color={C.sage}>Applied</Tag></span>
                <span style={{ opacity: 1 - applied, pointerEvents: 'none' }}><Button scale={tap}>Apply all</Button></span>
              </div>
            </div>
          </Panel>
        </div>
      </AppFrame>
    </FilmCanvas>
  );
};
