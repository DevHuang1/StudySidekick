import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const captionsPath = resolve(scriptDir, '../src/captions.json');
const outputDir = resolve(scriptDir, '../out');
const srtPath = resolve(outputDir, 'study-sidekick-3min.srt');

const { fps, cues } = JSON.parse(readFileSync(captionsPath, 'utf8'));

const toTimecode = (frame) => {
  const totalMs = Math.round((frame / fps) * 1000);
  const milliseconds = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    `${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`,
  ].join(':');
};

const srt = cues
  .map(
    (cue, index) =>
      `${index + 1}\n${toTimecode(cue.startFrame)} --> ${toTimecode(cue.endFrame)}\n${cue.text}\n`,
  )
  .join('\n');

mkdirSync(outputDir, { recursive: true });
writeFileSync(srtPath, srt, 'utf8');

console.log(`Wrote ${cues.length} captions to ${srtPath}`);
