/*
  Приём 2 — магнитное притяжение.
  Элемент слегка тянется к курсору, когда тот подходит ближе radius,
  и возвращается пружиной, когда курсор уходит.

  magnetic(document.querySelector('.knot'), { radius: 260, pull: 0.32 });
*/

import { onFrame, lerp, clamp, reduced, hasPointer } from './_util.js';

export function magnetic(el, options = {}) {
  const {
    radius = 240, // с какого расстояния начинает чувствовать курсор
    pull = 0.3, // какая доля расстояния «съедается» притяжением
    ease = 0.12, // мягкость подхода
    maxOffset = 70, // предел смещения, чтобы не улетало за композицию
    breathe = 0.04, // лёгкое «дыхание» масштаба при приближении
    onNear = null,
  } = options;

  if (!el) return { destroy() {} };

  if (reduced() || !hasPointer()) {
    el.style.transform = 'translate3d(0,0,0) scale(1)';
    return { destroy() {} };
  }

  const target = { x: 0, y: 0, s: 1 };
  const cur = { x: 0, y: 0, s: 1 };
  let near = 0;

  const onPointer = (e) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > radius) {
      target.x = 0;
      target.y = 0;
      target.s = 1;
      near = 0;
      return;
    }

    near = 1 - dist / radius; // 0 на краю, 1 в центре
    const k = pull * near;
    target.x = clamp(dx * k, -maxOffset, maxOffset);
    target.y = clamp(dy * k, -maxOffset, maxOffset);
    target.s = 1 + breathe * near;
  };

  const stop = onFrame(() => {
    cur.x = lerp(cur.x, target.x, ease);
    cur.y = lerp(cur.y, target.y, ease);
    cur.s = lerp(cur.s, target.s, ease);
    el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0) scale(${cur.s.toFixed(4)})`;
    onNear?.(near);
  });

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    target.s = 1;
    near = 0;
  });

  return {
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointer);
    },
  };
}
