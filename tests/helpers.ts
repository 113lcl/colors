import type { Page, TestInfo } from '@playwright/test';

/*
  Сборщик ошибок страницы: консольные error + необработанные исключения.
  Шум вроде не загрузившихся Google Fonts в офлайне отфильтрован — он не про наш код.
*/
const IGNORE = [/fonts\.(googleapis|gstatic)\.com/i, /favicon/i, /ERR_INTERNET_DISCONNECTED/i];

export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORE.some((re) => re.test(text))) return;
    errors.push(`console: ${text}`);
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

export async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
  await info.attach(name, { path: `screenshots/${name}.png`, contentType: 'image/png' });
}
