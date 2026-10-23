import React from 'react';
import { Composition } from 'remotion';
import { FILM_DURATION, FILM_FPS, StudySidekickAd } from './StudySidekickAd';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="StudySidekickAd"
    component={StudySidekickAd}
    width={1920}
    height={1080}
    fps={FILM_FPS}
    durationInFrames={FILM_DURATION}
  />
);
