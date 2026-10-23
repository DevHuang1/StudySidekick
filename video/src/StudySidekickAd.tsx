import React from 'react';
import { Sequence } from 'remotion';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene8 } from './scenes/Scene8';
import { Scene9 } from './scenes/Scene9';
import { Captions } from './components/Captions';
export const FILM_FPS = 30;
export const FILM_DURATION = 5400;

export const StudySidekickAd: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={450} name="01-The-gap">
        <Scene1 />
      </Sequence>
      <Sequence from={450} durationInFrames={600} name="02-Assignments">
        <Scene2 />
      </Sequence>
      <Sequence from={1050} durationInFrames={600} name="03-Availability">
        <Scene3 />
      </Sequence>
      <Sequence from={1650} durationInFrames={750} name="04-The-plan">
        <Scene4 />
      </Sequence>
      <Sequence from={2400} durationInFrames={900} name="05-Sidekick-preview">
        <Scene5 />
      </Sequence>
      <Sequence from={3300} durationInFrames={600} name="06-Approved-plan-and-reminder">
        <Scene6 />
      </Sequence>
      <Sequence from={3900} durationInFrames={600} name="07-Focus-session">
        <Scene7 />
      </Sequence>
      <Sequence from={4500} durationInFrames={450} name="08-Progress">
        <Scene8 />
      </Sequence>
      <Sequence from={4950} durationInFrames={450} name="09-Close">
        <Scene9 />
      </Sequence>
      <Captions />
    </>
  );
};
