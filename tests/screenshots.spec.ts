import { test, expect } from '@playwright/test';
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
    // при первом приходе мандала собирается около пяти секунд — кадр нужен
    // после того, как встала последняя метка
    await page.waitForTimeout(6400);
    await page.screenshot({ path: 'screenshots/00-центр.png' });
  });

  /* и кадр посреди самой сборки: её видно только в первую секунду за сессию */
  test('центр собирается', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2600);
    await page.screenshot({ path: 'screenshots/00-центр-собирается.png' });
  });

  test('колофон', async ({ page }) => {
    await page.goto('/colophon/');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'screenshots/01-колофон.png' });
  });

  /* Мятный оживает только рядом с курсором — в статике этого не увидеть. */
  test('мятный рядом с курсором', async ({ page }) => {
    await page.goto('/green/mint/');
    await page.waitForTimeout(1200);

    const drop = page.locator('#drop');
    const box = (await drop.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 30);
    await page.waitForTimeout(1600);

    await page.screenshot({ path: 'screenshots/green-mint-рядом.png' });
  });

  /*
    Фиолетовый в спокойном виде ничем не отличается от отсчёта в чёрной ветке.
    Разница появляется, только если задержаться: счёт разгоняется, знак растёт
    и заваливается вперёд. Кадр снимается именно в этом состоянии.
  */
  test('фиолетовый под давлением', async ({ page }) => {
    await page.goto('/red/violet/');
    await page.locator('#field').hover();

    await expect
      .poll(async () => Number(await page.locator('#stage').getAttribute('data-urgency')), { timeout: 25_000 })
      .toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'screenshots/red-violet-под-давлением.png' });
  });

  /*
    Тушевая вспышка — единственная анимация, общая для всего сайта, и в статике
    её не видно. Кадр снимается посреди перехода: пелена уже залила экран из
    точки клика, но комната ещё не сменилась.
  */
  test('тушевый переход', async ({ page }) => {
    /*
      Ответ следующей комнаты задерживается: иначе снимок пришлось бы ловить в
      гонке с навигацией — она сносит документ ровно в момент захвата. С паузой
      старая страница остаётся живой, а пелена стоит поднятой сколько нужно.
    */
    await page.route('**/green/mint/**', async (route) => {
      await new Promise((r) => setTimeout(r, 5000));
      await route.continue();
    });

    await page.goto('/green/sage/');
    // выходы появляются с задержкой и сдвигом — кликать в них, пока они едут,
    // значит ловить нестабильную цель
    await page.waitForTimeout(4200);

    await page.locator('.exits .exit').first().click({ noWaitAfter: true });
    await page.waitForTimeout(300); // середина заливки: 460 мс на приход

    await page.screenshot({ path: 'screenshots/переход-тушь.png' });
    await page.unroute('**/green/mint/**');
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
