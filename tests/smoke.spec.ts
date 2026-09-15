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
