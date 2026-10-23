import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runRemotion } from './run-remotion.mjs';

const outputDir = resolve('out/gate-stills');
mkdirSync(outputDir, { recursive: true });

const frames = [45, 225, 440, 520, 780, 1020, 1125, 1400, 1635, 1780, 2130, 2360, 2440, 2770, 3110, 3270, 3420, 3660, 3820, 4080, 4350, 4480, 4660, 4860, 5040, 5290];

for (const frame of frames) {
  runRemotion([
    'still',
    'src/index.ts',
    'StudySidekickAd',
    resolve(outputDir, `frame-${frame}.png`),
    `--frame=${frame}`,
    '--overwrite',
  ]);
}

console.log(`Rendered ${frames.length} Remotion checkpoint stills to ${outputDir}`);
