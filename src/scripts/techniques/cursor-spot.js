/*
  Приём 1 — курсор-пятно.
  Мягкое пятно тянется за курсором с инерцией. Чем меньше ease, тем ленивее хвост.
  Вариант «сломанного» курсора (чёрная ветка): lag + двойник, отстающий ещё сильнее.

  cursorSpot(document.querySelector('.spot'), { ease: 0.08 });
*/

import { onFrame, lerp, reduced, hasPointer } from './_util.js';

export function cursorSpot(el, options = {}) {
  const {
    ease = 0.1, // 0..1 — насколько быстро пятно догоняет курсор
    ghost = null, // второй элемент-двойник, отстающий сильнее
    ghostEase = 0.035,
    scale = 1,
    restAt = 'center', // где замереть при reduced-motion
    onMove = null,
  } = options;

  if (!el) return { destroy() {} };

  const centre = () => ({ x: innerWidth / 2, y: innerHeight / 2 });

  // точка покоя — центр сцены: осмысленно, а не «там, где застало»
  if (reduced() || !hasPointer()) {
    const p = restAt === 'center' ? centre() : restAt;
    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    el.style.opacity = '1';
    if (ghost) {
      ghost.style.transform = el.style.transform;
      ghost.style.opacity = '0';
    }
    return { destroy() {} };
  }

  const target = centre();
  const pos = { ...target };
  const ghostPos = { ...target };
  let active = false;

  const onPointer = (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    if (!active) {
      active = true;
      el.style.opacity = '1';
      if (ghost) ghost.style.opacity = '1';
    }
  };

  const stop = onFrame(() => {
    pos.x = lerp(pos.x, target.x, ease);
    pos.y = lerp(pos.y, target.y, ease);
    el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;

    if (ghost) {
      ghostPos.x = lerp(ghostPos.x, target.x, ghostEase);
      ghostPos.y = lerp(ghostPos.y, target.y, ghostEase);
      ghost.style.transform = `translate3d(${ghostPos.x}px, ${ghostPos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    }

    onMove?.(pos, target);
  });

  window.addEventListener('pointermove', onPointer, { passive: true });

  return {
    destroy() {
      stop();
      window.removeEventListener('pointermove', onPointer);
    },
  };
}
