/*
  Нарастание внутри ветки.

  Бриф просит, чтобы у четырёх веток из пяти «общее ощущение нарастало по мере
  блуждания», но без жёсткого линейного маршрута. Здесь это сделано так: ветка
  помнит, сколько своих комнат вы прошли ЗА ЭТОТ ЗАХОД, и отдаёт долю 0..1 в
  переменную --depth. Дальше каждая ветка сама решает, что в ней сгущается:
  белая становится тише, зелёная теплее, синяя дальше, чёрная плотнее.

  Память сессионная, а не постоянная: путешествие должно начинаться заново,
  когда человек приходит в другой раз. Красная ветка исключена — у неё
  независимые вспышки, и нарастать там нечему.
*/

const KEY = 'undertow:journey';
const NO_ESCALATION = new Set(['red']);

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(state) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

/*
  Отмечает комнату пройденной и возвращает глубину ветки 0..1.
  total — сколько всего комнат в ветке.
*/
export function advance(branch, slug, total) {
  if (NO_ESCALATION.has(branch)) return 0;

  const state = read();
  const seen = new Set(state[branch] ?? []);
  seen.add(slug);
  state[branch] = [...seen];
  write(state);

  // первая комната — это ещё не путешествие, поэтому отсчёт идёт со второй
  return Math.min(Math.max(seen.size - 1, 0) / Math.max(total - 1, 1), 1);
}

export function depthOf(branch) {
  const state = read();
  return (state[branch] ?? []).length;
}
