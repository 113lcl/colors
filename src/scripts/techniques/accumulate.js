/*
  Приём-накопление — единственный, у которого память длиннее одного визита.
  Считает заходы в комнату и отдаёт наружу «возраст» 0..1, чтобы комната могла
  чуть подрасти. Не очки и не прогресс: значение упирается в потолок и там живёт.

  accumulate('sage', { cap: 12, onValue: (v, n) => root.style.setProperty('--growth', v) });
*/

import { memory } from './_util.js';

export function accumulate(key, options = {}) {
  const {
    cap = 12, // после скольких визитов рост останавливается
    minGap = 20_000, // перезагрузка чаще этого не считается новым визитом
    onValue = null, // (0..1, абсолютное число визитов)
  } = options;

  const state = memory.get(`visits:${key}`, { n: 0, last: 0 });
  const now = Date.now();
  const isNewVisit = now - (state.last ?? 0) > minGap;

  if (isNewVisit) {
    state.n = (state.n ?? 0) + 1;
    state.last = now;
    memory.set(`visits:${key}`, state);
  }

  const value = Math.min(state.n / cap, 1);
  onValue?.(value, state.n);

  return { value, visits: state.n, isNewVisit };
}

/*
  Сколько прошло с прошлого визита — в человеческих словах, тепло, без цифр-таймера.
  sinceLastVisit('olive') → { phrase: 'с прошлого раза прошла ночь', ms, first: false }
*/
export function sinceLastVisit(key) {
  const last = memory.get(`seen:${key}`, null);
  const now = Date.now();
  memory.set(`seen:${key}`, now);

  if (!last) return { first: true, ms: 0, phrase: 'вы здесь впервые' };

  const ms = now - last;
  const min = ms / 60_000;
  const hour = min / 60;
  const day = hour / 24;

  let phrase;
  if (min < 2) phrase = 'вы почти не уходили';
  else if (min < 20) phrase = 'прошло совсем немного';
  else if (hour < 2) phrase = 'прошёл час или около того';
  else if (hour < 10) phrase = 'прошло полдня';
  else if (day < 2) phrase = 'с прошлого раза прошла ночь';
  else if (day < 8) phrase = 'прошло несколько дней';
  else if (day < 40) phrase = 'прошёл месяц, может меньше';
  else phrase = 'прошло много времени';

  return { first: false, ms, phrase };
}
