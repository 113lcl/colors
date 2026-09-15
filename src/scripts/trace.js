/*
  Тихая память о том, где вы уже были.

  Это НЕ прогресс и не достижения: нигде не показывается число, нет цели «собрать
  все», ничего не открывается и не запирается. Единственное следствие — под
  кистевой меткой ветки, куда вы заходили, копится еле заметная лужица туши.
  Смысл тот же, что у зелёной ветки: пространство помнит, что к нему возвращались.

  Хранится в localStorage этого браузера и никуда не отправляется.
*/

import { memory } from './techniques/_util.js';

const KEY = 'seen-rooms';

export function remember(branch, slug) {
  const seen = memory.get(KEY, []);
  const id = `${branch}/${slug}`;
  if (seen.includes(id)) return seen;
  const next = [...seen, id];
  memory.set(KEY, next);
  return next;
}

export function seenByBranch() {
  const seen = memory.get(KEY, []);
  const counts = {};
  for (const id of seen) {
    const branch = id.split('/')[0];
    counts[branch] = (counts[branch] ?? 0) + 1;
  }
  return counts;
}
