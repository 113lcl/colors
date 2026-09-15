/*
  Тушевый переход между комнатами.
  Использование: подключается один раз в Base.astro, дальше работает сам —
  перехватывает клики по внутренним ссылкам и проигрывает вспышку до навигации.
*/

const BRANCH_VAR = {
  white: '--c-white',
  black: '--c-black',
  green: '--c-green',
  red: '--c-red',
  blue: '--c-blue',
};

import { unbase } from '../lib/link.js';

function branchFromHref(href) {
  try {
    // адрес может быть с префиксом сайта (/colors/white/...), его нужно снять,
    // иначе веткой окажется имя подпапки
    const path = unbase(new URL(href, location.href).pathname);
    const seg = path.split('/').filter(Boolean)[0];
    return seg in BRANCH_VAR ? seg : null;
  } catch {
    return null;
  }
}

function veilColour(branch) {
  if (!branch) return 'var(--ink)';
  return `var(${BRANCH_VAR[branch]})`;
}

function getVeil() {
  return document.getElementById('ink-veil');
}

/*
  Пелена уходит. Только если мы действительно пришли через переход —
  прямой заход на страницу не должен начинаться со вспышки цвета.
*/
function release() {
  const veil = getVeil();
  if (!veil || !document.documentElement.hasAttribute('data-arriving')) return;
  requestAnimationFrame(() => {
    veil.dataset.state = 'out';
    const settle = () => {
      veil.removeAttribute('data-state');
      veil.style.opacity = '0';
      document.documentElement.removeAttribute('data-arriving');
    };
    veil.addEventListener('animationend', settle, { once: true });
    setTimeout(settle, 1400);
  });
}

/* Пелена приходит, потом навигация. */
function flood(href, origin) {
  const veil = getVeil();
  const branch = branchFromHref(href);
  if (!veil) {
    location.href = href;
    return;
  }
  veil.style.setProperty('--veil', veilColour(branch));
  try {
    sessionStorage.setItem('undertow:veil', branch || 'center');
  } catch {}
  if (origin) {
    veil.style.setProperty('--ink-x', `${origin.x}px`);
    veil.style.setProperty('--ink-y', `${origin.y}px`);
  }
  veil.style.opacity = '';
  veil.dataset.state = 'in';

  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    location.href = href;
  };
  veil.addEventListener('animationend', go, { once: true });
  // страховка: если анимация не сработала, всё равно уходим
  setTimeout(go, 900);
}

function isInternal(a) {
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
  if (a.dataset.noTransition !== undefined) return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:')) return false;
  try {
    return new URL(href, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

function init() {
  release();

  document.addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = e.target.closest?.('a[href]');
      if (!isInternal(a)) return;
      e.preventDefault();
      flood(a.getAttribute('href'), { x: e.clientX, y: e.clientY });
    },
    { capture: true }
  );

  // возврат «назад» из bfcache — пелена могла остаться поднятой
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const veil = getVeil();
      if (veil) {
        veil.removeAttribute('data-state');
        veil.style.opacity = '0';
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
