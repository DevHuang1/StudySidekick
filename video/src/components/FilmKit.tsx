import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const C = {
  ink: '#29271f',
  muted: '#777168',
  paper: '#faf9f6',
  white: '#fffefa',
  line: '#ebe6dc',
  plum: '#695965',
  plumWash: '#f0ece8',
  sage: '#738a78',
  sageWash: '#eef2ed',
  clay: '#9a745f',
  clayWash: '#f7f3ee',
  warning: '#934b44',
  warningWash: '#fff6f4',
};

export const ease = (frame: number, start = 0, duration = 18) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const reveal = (frame: number, start = 0, duration = 18): React.CSSProperties => {
  const value = ease(frame, start, duration);
  return {
    opacity: value,
    transform: `translateY(${(1 - value) * 16}px)`,
  };
};

export const FilmCanvas: React.FC<{
  children: React.ReactNode;
  dark?: boolean;
}> = ({ children, dark = false }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        overflow: 'hidden',
        color: dark ? C.paper : C.ink,
        backgroundColor: dark ? C.ink : C.paper,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        opacity,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 64,
          height: 1,
          backgroundColor: dark ? 'rgba(250,249,246,.15)' : C.line,
        }}
      />
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, color = C.muted, style }) => (
  <div
    style={{
      color,
      fontSize: 17,
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      ...style,
    }}
  >
    {children}
  </div>
);

export const PageTitle: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 68, style }) => (
  <div
    style={{
      color: C.ink,
      fontSize: size,
      lineHeight: 1.04,
      letterSpacing: -3.2,
      fontWeight: 650,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Copy: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, size = 22, color = C.muted, style }) => (
  <div
    style={{
      color,
      fontSize: size,
      lineHeight: 1.55,
      fontWeight: 450,
      ...style,
    }}
  >
    {children}
  </div>
);

export const AppFrame: React.FC<{
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ active, title, subtitle, children, style }) => {
  const frame = useCurrentFrame();
  const inValue = ease(frame, 6, 24);
  const tabs = ['Weekly plan', 'Assignments', 'Sidekick', 'Reminders', 'Focus timer'];

  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 112,
        width: 1600,
        height: 850,
        display: 'flex',
        overflow: 'hidden',
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        backgroundColor: C.white,
        boxShadow: '0 28px 72px rgba(54, 47, 38, .10)',
        opacity: inValue,
        transform: `translateY(${(1 - inValue) * 24}px)`,
        ...style,
      }}
    >
      <aside
        style={{
          width: 250,
          flex: '0 0 250px',
          padding: '34px 20px 24px',
          borderRight: `1px solid ${C.line}`,
          backgroundColor: '#fbfaf8',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px', marginBottom: 48 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: C.plum,
              color: C.white,
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4 }}>
            Study <span style={{ color: C.clay }}>Sidekick</span>
          </div>
        </div>
        <Eyebrow style={{ fontSize: 12, letterSpacing: 1.4, padding: '0 12px', marginBottom: 14 }}>
          Your workspace
        </Eyebrow>
        <div style={{ display: 'grid', gap: 7 }}>
          {tabs.map((tab, index) => {
            const selected = active === tab;
            const icons = ['▦', '▤', '✳', '○', '◷'];
            return (
              <div
                key={tab}
                style={{
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '0 13px',
                  borderRadius: 10,
                  color: selected ? C.plum : C.muted,
                  backgroundColor: selected ? C.plumWash : 'transparent',
                  fontSize: 16,
                  fontWeight: selected ? 650 : 500,
                }}
              >
                <span style={{ width: 19, fontSize: 17, textAlign: 'center' }}>{icons[index]}</span>
                {tab}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto', padding: '16px 12px 0', borderTop: `1px solid ${C.line}` }}>
          <Copy size={13} color={C.muted}>Your study data is saved in this browser.</Copy>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: '42px 48px 38px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
          <div>
            <PageTitle size={37} style={{ letterSpacing: -1.4, lineHeight: 1.15 }}>{title}</PageTitle>
            {subtitle && <Copy size={15} style={{ marginTop: 8 }}>{subtitle}</Copy>}
          </div>
          <div
            style={{
              border: `1px solid ${C.line}`,
              borderRadius: 9,
              padding: '10px 13px',
              color: C.muted,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            THIS WEEK
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number;
}> = ({ children, style, padding = 22 }) => (
  <div
    style={{
      minWidth: 0,
      padding,
      border: `1px solid ${C.line}`,
      borderRadius: 14,
      backgroundColor: C.white,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Tag: React.FC<{
  children: React.ReactNode;
  background?: string;
  color?: string;
}> = ({ children, background = C.plumWash, color = C.plum }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '7px 11px',
      borderRadius: 999,
      backgroundColor: background,
      color,
      fontSize: 13,
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: 0.2,
    }}
  >
    {children}
  </span>
);

export const Button: React.FC<{
  children: React.ReactNode;
  secondary?: boolean;
  scale?: number;
  style?: React.CSSProperties;
}> = ({ children, secondary = false, scale = 1, style }) => (
  <div
    style={{
      display: 'inline-flex',
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 18px',
      border: secondary ? `1px solid ${C.line}` : 'none',
      borderRadius: 9,
      color: secondary ? C.ink : C.white,
      backgroundColor: secondary ? C.white : C.plum,
      fontSize: 15,
      fontWeight: 700,
      transform: `scale(${scale})`,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Rule: React.FC = () => <div style={{ height: 1, backgroundColor: C.line }} />;

export const Stat: React.FC<{
  value: string;
  label: string;
  accent?: string;
}> = ({ value, label, accent = C.ink }) => (
  <div>
    <div style={{ color: accent, fontSize: 36, lineHeight: 1.05, fontWeight: 680, letterSpacing: -1.4 }}>{value}</div>
    <div style={{ color: C.muted, fontSize: 14, marginTop: 7, fontWeight: 550 }}>{label}</div>
  </div>
);

export const ProgressBar: React.FC<{
  progress: number;
  color?: string;
  height?: number;
}> = ({ progress, color = C.sage, height = 10 }) => (
  <div style={{ height, borderRadius: 999, overflow: 'hidden', backgroundColor: '#efede7' }}>
    <div style={{ width: `${Math.max(0, Math.min(100, progress))}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
  </div>
);
