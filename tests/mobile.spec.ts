import { test, expect } from '@playwright/test';
import { ALL_PATHS } from '../src/data/rooms.js';
import { watchErrors } from './helpers';

/*
  Прогоняется проектом mobile (Pixel 5). Главное, что здесь ловится, —
  горизонтальная прокрутка: на узком экране любая композиция, сверстанная
  «на глаз», начинает вылезать за край.
*/

test.describe('узкий экран', () => {
  test('ни одна страница не едет вбок', async ({ page }) => {
    for (const path of ALL_PATHS) {
      const errors = watchErrors(page);
      await page.goto(path);
      await page.waitForTimeout(500);

      const overflow = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        view: window.innerWidth,
      }));

      expect(overflow.doc, `${path}: ${overflow.doc} > ${overflow.view}`).toBeLessThanOrEqual(overflow.view + 1);
      expect(errors, `${path}:\n${errors.join('\n')}`).toEqual([]);
    }
  });

  test('выходы из комнаты остаются в кадре и достаточно крупные для пальца', async ({ page }) => {
    for (const path of ALL_PATHS.filter((p) => p !== '/' && p !== '/colophon/')) {
      await page.goto(path);
      await page.waitForTimeout(400);

      const exits = page.locator('.exits .exit');
      const count = await exits.count();
      expect(count, path).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const box = await exits.nth(i).boundingBox();
        expect(box, `${path}: выход ${i} без коробки`).not.toBeNull();
        expect(box!.y + box!.height, `${path}: выход ${i} ниже экрана`).toBeLessThanOrEqual(
          (await page.evaluate(() => window.innerHeight)) + 1
        );
        expect(box!.height, `${path}: выход ${i} слишком низкий для пальца`).toBeGreaterThanOrEqual(22);
      }
    }
  });

  test('комнаты с курсором отвечают на палец, а не выключаются', async ({ page }) => {
    await page.goto('/black/anthracite/');
    await expect(page.locator('#line')).toContainText('пальцем');

    await page.locator('.stage').hover({ position: { x: 80, y: 200 } });
    await page.mouse.down();
    await page.mouse.move(240, 420, { steps: 8 });
    await page.mouse.up();

    await expect
      .poll(async () => Number(await page.locator('#trail').evaluate((el) => getComputedStyle(el).opacity)), { timeout: 4000 })
      .toBeGreaterThan(0);

    const transform = await page.locator('#trail').evaluate((el) => el.style.transform);
    expect(transform).toContain('translate3d');
  });

  test('главная: пять меток помещаются в мандалу', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(600);

    const marks = page.locator('.orb-wrap');
    await expect(marks).toHaveCount(5);

    const view = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    for (let i = 0; i < 5; i++) {
      const box = await marks.nth(i).boundingBox();
      expect(box!.x, `метка ${i} слева за кадром`).toBeGreaterThanOrEqual(-2);
      expect(box!.x + box!.width, `метка ${i} справа за кадром`).toBeLessThanOrEqual(view.w + 2);
      expect(box!.y, `метка ${i} сверху за кадром`).toBeGreaterThanOrEqual(-2);
      expect(box!.y + box!.height, `метка ${i} снизу за кадром`).toBeLessThanOrEqual(view.h + 2);
    }
  });
});
