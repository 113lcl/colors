import { test, expect } from '@playwright/test';
import { ALL_PATHS } from '../src/data/rooms.js';

/*
  Прогоняется проектом reduced-motion (Playwright эмулирует системную настройку).
  Проверяется не «анимации выключены», а что комната при этом осталась комнатой:
  ничего не пропало, ничего не дёргается, всё стоит в осмысленной точке покоя.
*/

test.describe('prefers-reduced-motion', () => {
  test('ни одна анимация не проигрывается', async ({ page }) => {
    for (const path of ALL_PATHS) {
      await page.goto(path);
      await page.waitForTimeout(500);

      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          // тушевая пелена — единственное исключение: её короткий уход
          // при reduced-motion остаётся, иначе она застынет поверх страницы
          .filter((a) => !((a as CSSAnimation).animationName ?? '').includes('ink-'))
          .map((a) => (a as CSSAnimation).animationName ?? a.constructor.name)
      );

      expect(running, `${path}: ${running.join(', ')}`).toEqual([]);
    }
  });

  test('текст, который обычно проявляется, виден сразу', async ({ page }) => {
    await page.goto('/blue/deep/');
    await page.waitForTimeout(400);

    const hidden = await page.locator('#p3 .rv').evaluateAll((els) =>
      els.filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length
    );
    expect(hidden).toBe(0);

    await page.goto('/white/ivory/');
    await page.waitForTimeout(400);
    await expect(page.locator('#phrase')).toContainText('успевать');
  });

  test('отсчёты остановлены, а не мигают', async ({ page }) => {
    await page.goto('/black/oxblood/');
    const value = await page.locator('#count').textContent();
    await page.waitForTimeout(2500);
    expect(await page.locator('#count').textContent()).toBe(value);
    await expect(page.locator('#caption')).toContainText('остановлен');

    await page.goto('/red/violet/');
    const v = await page.locator('#count').textContent();
    await page.waitForTimeout(2500);
    expect(await page.locator('#count').textContent()).toBe(v);
  });

  test('комнаты не пустеют: главное в кадре остаётся видимым', async ({ page }) => {
    const anchors: Array<[string, string]> = [
      ['/', '.center-point'],
      ['/white/cloud/', '#form'],
      ['/white/frost/', '.crystal'],
      ['/green/sage/', '.ring.is-grown'],
      ['/blue/steel/', '.baseline'],
      ['/blue/dusk/', '.beam-glow'],
      ['/black/ash/', '.smudge'],
      ['/red/orange/', '.blot'],
      ['/red/pink/', '.shout'],
    ];

    for (const [path, selector] of anchors) {
      await page.goto(path);
      await page.waitForTimeout(300);
      const el = page.locator(selector).first();
      await expect(el, `${path} → ${selector}`).toBeVisible();
      const opacity = await el.evaluate((node) => Number(getComputedStyle(node).opacity));
      expect(opacity, `${path} → ${selector} прозрачен`).toBeGreaterThan(0.02);
    }
  });
});
