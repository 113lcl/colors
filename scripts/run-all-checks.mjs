/*
  Один вход для всех проверок: сборка → краулер связности → e2e (Playwright + axe).
  Запуск: npm run check-all
*/

import { spawn } from 'node:child_process';

const steps = [
  { name: 'Сборка', cmd: 'npm', args: ['run', 'build'] },
  { name: 'Связность (краулер)', cmd: 'node', args: ['scripts/crawl.mjs'] },
  { name: 'E2E + доступность', cmd: 'npx', args: ['playwright', 'test'] },
];

const run = (step) =>
  new Promise((resolve) => {
    console.log(`\n─── ${step.name} ───`);
    const child = spawn(step.cmd, step.args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', (code) => resolve(code ?? 1));
  });

let failures = 0;
const results = [];

for (const step of steps) {
  const code = await run(step);
  results.push({ name: step.name, ok: code === 0 });
  if (code !== 0) {
    failures++;
    // сборка не прошла — дальше проверять нечего
    if (step.name === 'Сборка') break;
  }
}

console.log('\n─── Итог ───');
for (const r of results) console.log(`${r.ok ? '  ok  ' : ' FAIL '} ${r.name}`);
process.exit(failures ? 1 : 0);
