/*
  Приём 3 — текст в своём темпе.
  Слова (или буквы) проявляются с неравномерной скоростью: на знаках препинания
  фраза задерживает дыхание, короткие слова идут быстрее длинных. Ровный интервал
  читается как машинописный эффект из туториала — здесь он специально сбит.

  revealText(document.querySelector('.phrase'), { unit: 'word', pace: 1 });
*/

import { reduced } from './_util.js';

const PAUSE_AFTER = { ',': 2.4, '—': 2.6, '.': 3.4, '…': 4.6, ':': 2.2, '?': 3.4, '!': 3.2 };

export function revealText(el, options = {}) {
  const {
    unit = 'word', // 'word' | 'char'
    pace = 1, // общий множитель темпа
    base = 90, // базовый шаг, мс
    startDelay = 300,
    onDone = null,
  } = options;

  if (!el) return { destroy() {}, replay() {} };

  const source = el.dataset.text ?? el.textContent ?? '';
  el.dataset.text = source;

  const pieces =
    unit === 'char' ? [...source] : source.split(/(\s+)/).filter((p) => p.length > 0);

  // разметка: каждый кусок — свой span, чтобы анимировать только opacity/transform
  el.textContent = '';
  el.setAttribute('aria-label', source);
  const spans = pieces.map((p) => {
    const span = document.createElement('span');
    span.className = 'rv';
    span.textContent = p;
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
    return span;
  });

  let timers = [];

  function clear() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function run() {
    clear();

    // Точка покоя при reduced-motion — фраза целиком, сразу и без движения.
    if (reduced()) {
      spans.forEach((s) => s.classList.add('is-in'));
      onDone?.();
      return;
    }

    let t = startDelay;
    spans.forEach((span, i) => {
      const text = span.textContent;
      if (!text.trim()) {
        span.classList.add('is-in');
        return;
      }

      timers.push(
        setTimeout(() => {
          span.classList.add('is-in');
          if (i === spans.length - 1) onDone?.();
        }, t)
      );

      const len = text.trim().length;
      const lengthFactor = unit === 'char' ? 1 : 0.55 + Math.min(len, 12) / 9;
      const last = text.trim().slice(-1);
      const punctuation = PAUSE_AFTER[last] ?? 1;
      // неравномерность: ±22 % случайного разброса, чтобы шаг не был машинным
      const jitter = 0.78 + Math.random() * 0.44;
      t += base * pace * lengthFactor * punctuation * jitter;
    });
  }

  run();

  return {
    replay(newText) {
      if (typeof newText === 'string') {
        el.dataset.text = newText;
        clear();
        const fresh = revealText(el, options);
        return fresh;
      }
      spans.forEach((s) => s.classList.remove('is-in'));
      run();
    },
    destroy: clear,
  };
}
