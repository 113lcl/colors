/*
  Внутренние ссылки строятся только здесь.

  Причина: статика может лежать не в корне домена. GitHub Pages отдаёт проектный
  сайт по адресу вида /<репозиторий>/, и ссылка «/white/cloud/» там ведёт в никуда.
  Astro знает префикс как import.meta.env.BASE_URL — всё остальное обязано
  спрашивать его отсюда, а не собирать адреса руками.

  Логические пути (те, что лежат в rooms.js) остаются без префикса: их читают
  ещё и Node-скрипты, где import.meta.env нет.
*/

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

export function link(path) {
  if (!path.startsWith('/')) return path;
  return `${BASE}${path}` || '/';
}

/* Обратная операция: убрать префикс, чтобы получить логический путь. */
export function unbase(pathname) {
  if (BASE && pathname.startsWith(BASE)) return pathname.slice(BASE.length) || '/';
  return pathname;
}
