/* Общие мелочи для всех приёмов. */

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/*
  Один общий rAF-цикл на страницу вместо пяти отдельных: подписчики получают dt
  в миллисекундах. Цикл сам засыпает, когда подписчиков не осталось.
*/
const subs = new Set();
let running = false;
let last = 0;

function tick(now) {
  const dt = Math.min(now - last, 64); // защита от прыжка после сворачивания вкладки
  last = now;
  for (const fn of subs) fn(dt, now);
  if (subs.size) requestAnimationFrame(tick);
  else running = false;
}

export function onFrame(fn) {
  subs.add(fn);
  if (!running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }
  return () => subs.delete(fn);
}

/*
  Детерминированный генератор — для «каждый раз чуть другого» узора нужен seed,
  который можно записать и воспроизвести (Math.random() не воспроизводится).
*/
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/* Локальная память комнаты — всегда безопасно, даже если storage запрещён. */
export const memory = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`undertow:${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`undertow:${key}`, JSON.stringify(value));
    } catch {}
  },
};

/* Есть ли у устройства настоящий курсор (для приёмов, завязанных на мышь). */
export const hasPointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
