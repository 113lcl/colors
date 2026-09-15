import { defineConfig } from 'astro/config';

/*
  Сайт может жить и в корне домена, и в подпапке (GitHub Pages отдаёт проектный
  сайт по /<репозиторий>/). Префикс задаётся переменной окружения SITE_BASE и
  подставляется во все внутренние ссылки через src/lib/link.js.
*/
const raw = (process.env.SITE_BASE || '/').trim();
const base = raw === '/' || raw === '' ? '/' : `/${raw.replace(/^\/+|\/+$/g, '')}`;

export default defineConfig({
  site: process.env.SITE_ORIGIN || 'https://113lcl.github.io',
  base,
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
