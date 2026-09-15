import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';
import { ALL_PATHS, ROOMS, roomPath } from '../src/data/rooms.js';

test.describe('каркас', () => {
  test('главная: мандала, пять меток, без ошибок в консоли', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');

    await expect(page).toHaveTitle('Undertow');
    await expect(page.locator('.center-point')).toBeVisible();

    const marks = page.locator('.orb-wrap');
    await expect(marks).toHaveCount(5);

    for (const id of ['o-white', 'o-blue', 'o-red', 'o-black', 'o-green']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('каждая метка ведёт во входную комнату своей ветки', async ({ page }) => {
    await page.goto('/');
    const expected: Record<string, string> = {
      'o-white': '/white/cloud/',
      'o-blue': '/blue/deep/',
      'o-red': '/red/orange/',
      'o-black': '/black/anthracite/',
      'o-green': '/green/sage/',
    };
    for (const [id, href] of Object.entries(expected)) {
      await expect(page.locator(`#${id}`)).toHaveAttribute('href', href);
    }
  });

  test('метки достижимы с клавиатуры', async ({ page }) => {
    await page.goto('/');
    const first = page.locator('#o-white');
    await first.focus();
    await expect(first).toBeFocused();
  });

  test('все страницы отвечают 200 и не ругаются в консоль', async ({ page }) => {
    for (const path of ALL_PATHS) {
      const errors = watchErrors(page);
      const res = await page.goto(path);
      expect(res?.status(), `${path} вернул ${res?.status()}`).toBe(200);
      expect(errors, `${path}:\n${errors.join('\n')}`).toEqual([]);
    }
  });

  test('по комнате можно пройти одной клавиатурой', async ({ page }) => {
    await page.goto('/white/cloud/');
    await page.waitForTimeout(4200);

    /*
      Меню на сайте нет, поэтому клавиатура — единственный способ найти выход
      без мыши. Проверяется, что до выходов вообще доходит табуляция и что
      фокус при этом видно: у фокусного кольца свой цвет ветки, а не дефолт.
    */
    const reached: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        return { tag: el.tagName.toLowerCase(), cls: el.className?.toString() ?? '', href: el.getAttribute('href') };
      });
      if (info?.href) reached.push(info.href);
      if (reached.length >= 3) break;
    }

    expect(reached.length, `табуляция дошла до: ${reached.join(', ')}`).toBeGreaterThanOrEqual(2);
    expect(reached.some((h) => h.includes('/white/')), reached.join(', ')).toBe(true);

    // Enter на выходе уводит в соседнюю комнату
    const exit = page.locator('.exits .exit').first();
    const href = await exit.getAttribute('href');
    const before = page.url();
    await exit.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL((url) => url.href !== before, { timeout: 10_000 });
    expect(page.url()).toContain(href!);
  });

  test('у каждой комнаты есть выходы и путь к центру', async ({ page }) => {
    for (const room of ROOMS) {
      await page.goto(roomPath(room.branch, room.slug));
      const exits = page.locator('.exits .exit');
      await expect(exits, `${room.branch}/${room.slug}`).not.toHaveCount(0);
      await expect(page.locator('.exit--center')).toHaveAttribute('href', '/');
      await expect(page.locator('html')).toHaveAttribute('data-branch', room.branch);
    }
  });
});
