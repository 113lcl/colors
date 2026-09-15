/*
  Приём 5 — скролл как единственный ввод.
  Элементы не реагируют ни на курсор, ни на клик: только положение прокрутки
  двигает их. Значение сглаживается, чтобы движение не повторяло рывки колеса.

  scrollDrive({ onScroll: (p) => el.style.transform = `translate3d(0,${p * -200}px,0)` });
*/

import { onFrame, lerp, reduced } from './_util.js';

export function scrollDrive(options = {}) {
  const {
    target = window,
    ease = 0.085, // сглаживание: чем меньше, тем «тяжелее» сцена
    mode = 'progress', // 'progress' — 0..1 по длине страницы; 'absolute' — в пикселях
    onScroll = null, // (value, velocity)
    restProgress = 0.5, // где замереть при reduced-motion — середина пути
  } = options;

  const el = target === window ? document.documentElement : target;

  const top = () => (target === window ? scrollY : el.scrollTop);
  const maxScroll = () => Math.max(el.scrollHeight - (target === window ? innerHeight : el.clientHeight), 0);
  const raw = () => {
    if (mode === 'absolute') return top();
    const max = maxScroll();
    return max <= 0 ? 0 : Math.min(Math.max(top() / max, 0), 1);
  };

  if (reduced()) {
    const rest = mode === 'absolute' ? maxScroll() * restProgress : restProgress;
    onScroll?.(rest, 0);
    return { destroy() {}, value: () => rest, shift() {} };
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
    value: () => smooth,
    /*
      Сдвинуть внутреннее сглаженное значение вместе с прокруткой.
      Нужно бесшовным петлям: когда страница молча перепрыгивает на целое число
      периодов узора, сглаживание не должно «догонять» этот прыжок через полэкрана.
    */
    shift(delta) {
      smooth += delta;
      prev += delta;
    },
  };
}
