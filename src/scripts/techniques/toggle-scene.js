/*
  Приём 6 — переключатель «до/после».
  Один клик переворачивает всю сцену в противоположное состояние.
  Состояние живёт атрибутом data-flip на корне сцены: вся смена — дело CSS,
  скрипт только щёлкает переключателем (и, если нужно, возвращает обратно сам).

  toggleScene(scene, { hold: 220 });  // вспышка: щёлкнуло и само вернулось
*/

import { reduced } from './_util.js';

export function toggleScene(root, options = {}) {
  const {
    trigger = root, // что слушать
    event = 'click',
    hold = 0, // >0 — сцена сама возвращается через hold мс (вспышка)
    cooldown = 0, // сколько игнорировать повторные срабатывания
    onFlip = null,
    attr = 'data-flip',
  } = options;

  if (!root || !trigger) return { destroy() {} };

  let lockedUntil = 0;
  let back = 0;

  const flip = (e) => {
    const now = performance.now();
    if (now < lockedUntil) return;
    lockedUntil = now + cooldown;

    if (e?.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e?.type === 'keydown') e.preventDefault();

    const on = root.getAttribute(attr) === 'on';
    root.setAttribute(attr, on ? 'off' : 'on');
    onFlip?.(!on);

    if (hold > 0 && !on) {
      clearTimeout(back);
      // при reduced-motion вспышка держится дольше: без движения её легко не заметить
      back = setTimeout(() => {
        root.setAttribute(attr, 'off');
        onFlip?.(false);
      }, reduced() ? hold * 2 : hold);
    }
  };

  trigger.addEventListener(event, flip);
  if (event === 'click') trigger.addEventListener('keydown', flip);

  return {
    flip,
    destroy() {
      clearTimeout(back);
      trigger.removeEventListener(event, flip);
      trigger.removeEventListener('keydown', flip);
    },
  };
}
