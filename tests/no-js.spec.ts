import { test, expect } from '@playwright/test';
import { ALL_PATHS, ROOMS, roomPath } from '../src/data/rooms.js';

/*
  Сайт держится на скриптах, но не должен от них зависеть до такой степени,
  чтобы без них исчезало содержание. Проверяется минимум: текст на месте, из
  комнаты можно выйти, ничего не падает.

  Контекст здесь создаётся свой, с выключенным JavaScript, поэтому набор
  запускается в любом проекте.
*/

test.describe('без скриптов', () => {
  test('текст комнат остаётся видимым', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const invisible: string[] = [];

    for (const path of ALL_PATHS) {
      await page.goto(path);

      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('p, h1, h2, .phrase, .line, .para')) {
          if (!el.textContent?.trim()) continue;
          if (el.classList.contains('sr-only')) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') out.push(`${el.tagName.toLowerCase()}.${el.className || '—'}`);
        }
        return out;
      });

      if (bad.length) invisible.push(`${path}: ${bad.join(', ')}`);
    }

    expect(invisible, invisible.join('\n')).toEqual([]);
    await context.close();
  });

  test('из каждой комнаты видно выходы', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    for (const room of ROOMS.slice(0, 6)) {
      await page.goto(roomPath(room.branch, room.slug));
      const exits = page.locator('.exits .exit');
      await expect(exits.first(), `${room.branch}/${room.slug}`).toBeVisible();
      await expect(page.locator('.exit--center')).toHaveAttribute('href', /\/$/);
    }

    await context.close();
  });

  test('ссылки работают обычной навигацией', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    // без скриптов тушевого перехода нет, и переход должен просто произойти
    await page.goto('/white/cloud/');
    await page.locator('.exits .exit').first().click();
    await page.waitForLoadState('load');

    expect(page.url()).toContain('/white/');
    expect(page.url()).not.toContain('/cloud/');

    await context.close();
  });
});
