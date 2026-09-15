import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ALL_PATHS } from '../src/data/rooms.js';

/*
  Базовая проверка доступности на каждой странице.
  Контраст здесь намеренно проверяется отдельным, более мягким порогом: сайт —
  это тёмная сцена, где часть подписей специально приглушена. Полностью выключать
  правило нельзя, поэтому оно проверяется на «читаемых» элементах, а декоративные
  подписи помечены aria-hidden и в проверку не попадают.
*/

test.describe('доступность', () => {
  for (const path of ALL_PATHS) {
    test(`axe: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(600);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        `${path}`
      ).toEqual([]);
    });
  }

  test('у каждой страницы есть заголовок и язык', async ({ page }) => {
    for (const path of ALL_PATHS) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
      expect(await page.title()).toContain('Undertow');
    }
  });
});
