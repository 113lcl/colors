/*
  Приём 5 — скролл как единственный ввод.
  Элементы не реагируют ни на курсор, ни на клик: только положение прокрутки
  двигает их. Значение сглаживается, чтобы движение не повторяло рывки колеса.

  scrollDrive({ onScroll: (p, v) => el.style.transform = `translate3d(0,${p * -200}px,0)` });
*/

import { onFrame, lerp, reduced } from './_util.js';

export function scrollDrive(options = {}) {
  const {
    target = window,
    ease = 0.085, // сглаживание: чем меньше, тем «тяжелее» сцена
    onScroll = null, // (progress 0..1, velocity)
    restProgress = 0.5, // где замереть при reduced-motion — середина пути
  } = options;

  const el = target === window ? document.documentElement : target;

  const raw = () => {
    const max = el.scrollHeight - (target === window ? innerHeight : el.clientHeight);
    if (max <= 0) return 0;
    const top = target === window ? scrollY : el.scrollTop;
    return Math.min(Math.max(top / max, 0), 1);
  };

  if (reduced()) {
    onScroll?.(restProgress, 0);
    return { destroy() {}, progress: () => restProgress };
  }

  let smooth = raw();
  let prev = smooth;

  const stop = onFrame(() => {
    const next = lerp(smooth, raw(), ease);
    const velocity = next - prev;
    prev = smooth;
    smooth = next;
    onScroll?.(smooth, velocity);
  });

  return {
    destroy: stop,
    progress: () => smooth,
  };
}
