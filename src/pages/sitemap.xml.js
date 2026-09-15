import { ALL_PATHS } from '../data/rooms.js';
import { link } from '../lib/link.js';

/*
  Карта сайта собирается из того же модуля, что и всё остальное, поэтому новая
  комната попадает в неё сама. Страница 404 в список не входит: её не индексируют.
*/
export function GET({ site }) {
  const origin = site ? site.origin : '';

  const urls = ALL_PATHS.map((path) => {
    const loc = `${origin}${link(path)}`;
    const priority = path === '/' ? '1.0' : path === '/colophon/' ? '0.4' : '0.7';
    return `  <url>\n    <loc>${loc}</loc>\n    <priority>${priority}</priority>\n  </url>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
