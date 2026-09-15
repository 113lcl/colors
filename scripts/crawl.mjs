/*
  Краулер по собранной статике (dist/).
  Что проверяет:
    — каждая внутренняя ссылка ведёт в существующую страницу;
    — каждая страница достижима от центра (/) и за сколько переходов;
    — нет тупиков (страница без исходящих внутренних ссылок).
  Запуск: npm run build && node scripts/crawl.mjs
*/

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const MAX_HOPS_FROM_CENTRE = 4;

if (!existsSync(DIST)) {
  console.error('Нет папки dist/ — сначала `npm run build`.');
  process.exit(1);
}

async function htmlFiles(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await htmlFiles(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

const toRoute = (file) => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
};

const normalise = (href) => {
  if (!href) return null;
  if (/^(https?:|mailto:|tel:|#|data:)/i.test(href)) return null;
  let route = href.split('#')[0].split('?')[0];
  if (!route.startsWith('/')) return null;
  if (!route.endsWith('/') && !route.includes('.')) route += '/';
  return route;
};

const files = await htmlFiles(DIST);
const pages = new Map();

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)]
    .map((m) => normalise(m[1]))
    .filter(Boolean);
  pages.set(toRoute(file), [...new Set(links)]);
}

const broken = [];
const deadEnds = [];

for (const [route, links] of pages) {
  for (const target of links) {
    if (!pages.has(target)) broken.push({ from: route, to: target });
  }
  const outgoing = links.filter((l) => l !== route);
  if (outgoing.length === 0) deadEnds.push(route);
}

// BFS от центра
const dist = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const cur = queue.shift();
  for (const next of pages.get(cur) ?? []) {
    if (!pages.has(next) || dist.has(next)) continue;
    dist.set(next, dist.get(cur) + 1);
    queue.push(next);
  }
}

const unreachable = [...pages.keys()].filter((r) => !dist.has(r));
const tooFar = [...dist.entries()].filter(([, d]) => d > MAX_HOPS_FROM_CENTRE);

console.log(`\nСтраниц собрано: ${pages.size}`);
console.log(
  'Расстояние от центра:',
  [...dist.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([r, d]) => `${d}:${r}`)
    .join('  ')
);

let failed = false;

if (broken.length) {
  failed = true;
  console.error('\nБИТЫЕ ССЫЛКИ:');
  for (const b of broken) console.error(`  ${b.from} → ${b.to}`);
}
if (unreachable.length) {
  failed = true;
  console.error('\nНЕДОСТИЖИМЫЕ ОТ ЦЕНТРА:');
  for (const r of unreachable) console.error(`  ${r}`);
}
if (deadEnds.length) {
  failed = true;
  console.error('\nТУПИКИ (нет исходящих ссылок):');
  for (const r of deadEnds) console.error(`  ${r}`);
}
if (tooFar.length) {
  failed = true;
  console.error(`\nДАЛЬШЕ ${MAX_HOPS_FROM_CENTRE} ПЕРЕХОДОВ ОТ ЦЕНТРА:`);
  for (const [r, d] of tooFar) console.error(`  ${r} (${d})`);
}

if (failed) {
  console.error('\nКраулер: есть проблемы связности.\n');
  process.exit(1);
}
console.log('\nКраулер: связность в порядке — битых ссылок, тупиков и сирот нет.\n');
