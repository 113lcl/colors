import { test } from '@playwright/test';
import { ROOMS, roomPath } from '../src/data/rooms.js';

/*
  Снимает по кадру с каждой комнаты. Нужен и как проверка (кадр показывает, что
  комната действительно нарисовалась), и как папка для портфолио.
  Кадр берётся не сразу: комнатам дано время войти в свой ритм.
*/

test.describe('портреты комнат', () => {
  test.describe.configure({ mode: 'parallel' });

  test('центр', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3200);
    await page.screenshot({ path: 'screenshots/00-центр.png' });
  });

  test('колофон', async ({ page }) => {
    await page.goto('/colophon/');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'screenshots/01-колофон.png' });
  });

  /*
    Пара кадров про нарастание: одна и та же комната в начале блуждания по ветке
    и после того, как пройдены остальные три. Разница — это и есть «единое
    нарастающее путешествие» из брифа.
  */
  test('нарастание в синей ветке', async ({ page }) => {
    await page.goto('/blue/steel/');
    await page.waitForTimeout(2600);
    await page.screenshot({ path: 'screenshots/нарастание-синяя-начало.png' });

    for (const path of ['/blue/deep/', '/blue/turquoise/', '/blue/dusk/', '/blue/steel/']) {
      await page.goto(path);
      await page.waitForTimeout(900);
    }
    await page.waitForTimeout(3400);
    await page.screenshot({ path: 'screenshots/нарастание-синяя-глубже.png' });
  });

  for (const room of ROOMS) {
    test(`${room.branch}/${room.slug}`, async ({ page }) => {
      await page.goto(roomPath(room.branch, room.slug));
      // дать комнате войти в ритм: подписи, проявление текста, первый цикл атмосферы
      await page.waitForTimeout(4200);
      await page.screenshot({ path: `screenshots/${room.branch}-${room.slug}.png` });
    });
  }
});
