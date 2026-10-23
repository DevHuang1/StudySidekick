import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const executable = resolve('node_modules/.bin/remotion');
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
const browserArgs = browserExecutable
  ? [`--browser-executable=${browserExecutable}`, '--chrome-mode=chrome-for-testing']
  : [];

export const runRemotion = (args) =>
  execFileSync(executable, [...args, ...browserArgs], { stdio: 'inherit' });
