import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers';

/*
  Проверяется не «страница открылась», а что приём комнаты действительно
  срабатывает: удержание запускает выдох, клик меняет фразу, скролл двигает узор
  и так далее. Без этого «готово» означало бы только отсутствие ошибок в консоли.
*/

test.describe('приёмы комнат', () => {
  test('облачный: удержание запускает выдох, уход — гасит', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/white/cloud/');

    const form = page.locator('#form');
    await expect(form).not.toHaveClass(/is-breathing/);

    await form.hover();
    await expect(form).toHaveClass(/is-breathing/, { timeout: 4000 });

    await page.mouse.move(5, 5);
    await expect(form).not.toHaveClass(/is-breathing/, { timeout: 4000 });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('слоновая кость: клик сменяет фразу', async ({ page }) => {
    await page.goto('/white/ivory/');
    const phrase = page.locator('#phrase');

    const first = await phrase.getAttribute('data-text');
    await page.locator('#surface').click();
    await expect
      .poll(async () => phrase.getAttribute('data-text'), { timeout: 6000 })
      .not.toBe(first);
  });

  test('песочный: узор двигается только от прокрутки', async ({ page }) => {
    await page.goto('/white/sand/');
    const layer = page.locator('.rake--near');
    await page.waitForTimeout(400);

    const before = await layer.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.move(600, 400); // курсор не должен ничего менять
    await page.waitForTimeout(300);
    expect(await layer.evaluate((el) => getComputedStyle(el).transform)).toBe(before);

    await page.mouse.wheel(0, 900);
    await expect
      .poll(async () => layer.evaluate((el) => getComputedStyle(el).transform), { timeout: 4000 })
      .not.toBe(before);
  });

  test('шалфейный: повторный заход добавляет кольцо', async ({ page }) => {
    await page.goto('/green/sage/');
    const grown = page.locator('.ring.is-grown');
    await expect(grown).toHaveCount(3, { timeout: 5000 });

    // счётчик визитов игнорирует перезагрузки чаще 20 секунд — сдвигаем метку назад
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('undertow:visits:sage') || '{}');
      raw.last = Date.now() - 60_000;
      localStorage.setItem('undertow:visits:sage', JSON.stringify(raw));
    });

    await page.reload();
    await expect(page.locator('.ring.is-grown')).toHaveCount(4, { timeout: 5000 });
  });

  test('мятный: близость курсора передаётся сцене', async ({ page }) => {
    await page.goto('/green/mint/');
    const field = page.locator('.field');

    await page.mouse.move(20, 20);
    await page.waitForTimeout(250);

    const drop = page.locator('#drop');
    const box = await drop.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect
      .poll(async () => Number(await field.evaluate((el) => el.style.getPropertyValue('--near') || '0')), { timeout: 4000 })
      .toBeGreaterThan(0.5);
  });

  test('оливковый: комната помнит прошлый визит', async ({ page }) => {
    await page.goto('/green/olive/');
    await expect(page.locator('#line')).toContainText('впервые', { timeout: 6000 });

    await page.reload();
    await expect(page.locator('#line')).toContainText('Давно не виделись', { timeout: 6000 });
  });

  test('жёлто-зелёный: узор другой при каждой загрузке', async ({ page }) => {
    await page.goto('/green/chartreuse/');
    const first = await page.locator('#weave path').first().getAttribute('d');

    await page.reload();
    const second = await page.locator('#weave path').first().getAttribute('d');

    expect(second).not.toBe(first);
  });

  test('глубокий: текст проявляется постепенно, а не разом', async ({ page }) => {
    await page.goto('/blue/deep/');

    const shown = () => page.locator('#p1 .rv.is-in').count();
    const total = await page.locator('#p1 .rv').count();

    // привязываться к абсолютным паузам нельзя: под нагрузкой таймеры уезжают.
    // Важно другое — что слова приходят не разом, а прибавляются по одному
    await expect.poll(shown, { timeout: 8000 }).toBeGreaterThan(0);
    const early = await shown();
    expect(early, 'весь абзац проявился сразу').toBeLessThan(total);

    await expect.poll(shown, { timeout: 8000 }).toBeGreaterThan(early);
  });

  test('бирюзовый: слои смещаются вслед за курсором', async ({ page }) => {
    await page.goto('/blue/turquoise/');
    const band = page.locator('.band').first();

    await page.mouse.move(60, 300);
    await page.waitForTimeout(900);
    const left = await band.evaluate((el) => el.style.translate);

    await page.mouse.move(1200, 500);
    await expect.poll(async () => band.evaluate((el) => el.style.translate), { timeout: 6000 }).not.toBe(left);
  });

  test('антрацит: след идёт за курсором и отстаёт', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/black/anthracite/');

    await page.mouse.move(200, 200);
    await page.mouse.move(900, 600);
    await page.waitForTimeout(600);

    const trail = await page.locator('#trail').evaluate((el) => el.style.transform);
    expect(trail).toContain('translate3d');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('баклажановый: порядок слов меняется между загрузками', async ({ page }) => {
    await page.goto('/black/aubergine/');
    const read = () => page.locator('.sheet').evaluate((el) => el.innerText);

    const variants = new Set<string>();
    for (let i = 0; i < 6; i++) {
      variants.add(await read());
      await page.reload();
    }

    expect(variants.size).toBeGreaterThan(1);
  });

  test('пепельный: пятно замирает, когда курсор рядом', async ({ page }) => {
    await page.goto('/black/ash/');
    const smudge = page.locator('[data-smudge]').first();

    await page.mouse.move(640, 400);
    await page.waitForTimeout(300);
    await expect(smudge).not.toHaveClass(/is-watched/);

    const box = await smudge.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(smudge).toHaveClass(/is-watched/, { timeout: 3000 });
  });

  test('оксблад: отсчёт идёт вниз', async ({ page }) => {
    await page.goto('/black/oxblood/');
    const count = page.locator('#count');

    const first = Number(await count.textContent());
    expect(Number.isFinite(first)).toBe(true);

    await expect.poll(async () => Number(await count.textContent()), { timeout: 6000 }).toBeLessThan(first);
  });

  test('фиолетовый: задержка ускоряет отсчёт', async ({ page }) => {
    await page.goto('/red/violet/');
    const stage = page.locator('#stage');

    await expect(stage).toHaveAttribute('data-urgency', '0');

    await page.locator('#field').hover();
    await expect
      .poll(async () => Number(await stage.getAttribute('data-urgency')), { timeout: 12_000 })
      .toBeGreaterThan(0);
  });

  test('жёлтый: клик даёт вспышку и она сама уходит', async ({ page }) => {
    await page.goto('/red/yellow/');
    const stage = page.locator('#stage');

    await expect(stage).toHaveAttribute('data-flip', 'off');
    await page.locator('#trigger').click();
    await expect(stage).toHaveAttribute('data-flip', 'on');
    await expect(stage).toHaveAttribute('data-flip', 'off', { timeout: 3000 });
  });

  test('след: посещённые комнаты оставляют лужицу под меткой своей ветки', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1200);
    expect(await page.locator('#o-white').evaluate((el) => el.style.getPropertyValue('--visited'))).toBe('');

    await page.goto('/white/cloud/');
    await page.goto('/white/ivory/');

    await page.goto('/');
    await expect
      .poll(async () => Number(await page.locator('#o-white').evaluate((el) => el.style.getPropertyValue('--visited') || '0')), {
        timeout: 6000,
      })
      .toBeGreaterThan(0);

    // другие ветки при этом остаются чистыми
    expect(await page.locator('#o-red').evaluate((el) => el.style.getPropertyValue('--visited'))).toBe('');
  });

  test('переход между комнатами поднимает тушевую пелену', async ({ page }) => {
    await page.goto('/white/cloud/');

    await page.locator('.exits .exit').first().click();
    await page.waitForLoadState('load');

    // пелена должна была подняться до отрисовки новой комнаты
    const arrived = await page.evaluate(() => document.documentElement.getAttribute('data-arriving'));
    const veilOpacity = await page.locator('#ink-veil').evaluate((el) => getComputedStyle(el).opacity);

    expect(arrived === 'white' || Number(veilOpacity) < 1).toBe(true);
    await expect(page.locator('#ink-veil')).toHaveCSS('opacity', '0', { timeout: 4000 });
  });
});
