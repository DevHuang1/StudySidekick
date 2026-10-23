import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runRemotion } from './run-remotion.mjs';

const outputDir = resolve('out/stills');
mkdirSync(outputDir, { recursive: true });

const checkpoints = [
  ['opening', 360],
  ['assignment-added', 920],
  ['availability-set', 1435],
  ['shortfall-plan', 2260],
  ['sidekick-approved', 3220],
  ['plan-and-reminder', 3680],
  ['focus-timer', 4220],
  ['progress', 4740],
  ['end-card', 5250],
];

for (const [name, frame] of checkpoints) {
  runRemotion([
    'still',
    'src/index.ts',
    'StudySidekickAd',
    resolve(outputDir, `${name}.png`),
    `--frame=${frame}`,
    '--overwrite',
  ]);
}

console.log(`Rendered ${checkpoints.length} key stills to ${outputDir}`);
