/*
  Приём 4 — реакция на удержание.
  Ничего не происходит по клику; нужно задержать курсор (или палец) дольше порога.
  Пока идёт отсчёт, наружу отдаётся progress 0..1 — чтобы комната могла тихо
  намекнуть, что её слушают, не превращая это в прогресс-бар.

  dwell(el, { hold: 1100, onEnter: () => ..., onHold: () => ..., onLeave: () => ... });
*/

import { reduced } from './_util.js';

export function dwell(el, options = {}) {
  const {
    hold = 1100, // сколько держать, мс
    onProgress = null, // (0..1)
    onHold = null, // порог пройден
    onRelease = null, // ушли после срабатывания
    onLeave = null, // ушли, не дождавшись
    repeat = true, // можно ли сработать повторно
  } = options;

  if (!el) return { destroy() {} };

  let raf = 0;
  let started = 0;
  let fired = false;
  let inside = false;

  const step = (now) => {
    if (!inside) return;
    const p = Math.min((now - started) / hold, 1);
    onProgress?.(p);
    if (p >= 1 && !fired) {
      fired = true;
      onHold?.();
      if (!repeat) return;
    }
    raf = requestAnimationFrame(step);
  };

  const enter = () => {
    inside = true;
    fired = false;
    started = performance.now();
    // при reduced-motion удержание всё равно работает: это ввод, а не анимация,
    // но порог короче — ожидание без визуальной обратной связи утомляет
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  };

  const leave = () => {
    const wasFired = fired;
    inside = false;
    cancelAnimationFrame(raf);
    onProgress?.(0);
    if (wasFired) onRelease?.();
    else onLeave?.();
    fired = false;
  };

  if (reduced()) options.hold = Math.min(hold, 600);

  el.addEventListener('pointerenter', enter);
  el.addEventListener('pointerleave', leave);
  el.addEventListener('pointercancel', leave);
  // клавиатура: фокус держит так же, как курсор
  el.addEventListener('focus', enter);
  el.addEventListener('blur', leave);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointercancel', leave);
      el.removeEventListener('focus', enter);
      el.removeEventListener('blur', leave);
    },
  };
}
