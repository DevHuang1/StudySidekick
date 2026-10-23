import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runRemotion } from './run-remotion.mjs';

runRemotion([
  'render',
  'src/index.ts',
  'StudySidekickAd',
  'out/study-sidekick-3min.mp4',
  '--codec=h264',
  '--crf=18',
  '--overwrite',
]);

execFileSync(process.execPath, [fileURLToPath(new URL('./generate-captions.mjs', import.meta.url))], {
  stdio: 'inherit',
});
