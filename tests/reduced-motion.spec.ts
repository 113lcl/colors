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
          // переходы здесь ни при чём: reduced-motion не запрещает их, а
          // укорачивает до миллисекунды, и застать такой переход «идущим» —
          // вопрос случая, а не ошибка. Их длительность проверяется отдельно
          .filter((a) => a instanceof CSSAnimation)
          .filter((a) => a.playState === 'running')
          // тушевая пелена — единственное исключение: её короткий уход
          // при reduced-motion остаётся, иначе она застынет поверх страницы
          .filter((a) => !((a as CSSAnimation).animationName ?? '').includes('ink-'))
          .map((a) => (a as CSSAnimation).animationName)
      );

      expect(running, `${path}: ${running.join(', ')}`).toEqual([]);

      // ни один переход не должен длиться заметное время
      const slow = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          for (const d of cs.transitionDuration.split(', ')) {
            const ms = d.endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000;
            if (ms > 20) out.push(`${el.tagName.toLowerCase()}.${(el.className || '—').toString().slice(0, 30)} → ${d}`);
          }
        }
        return [...new Set(out)];
      });

      expect(slow, `${path}: ${slow.join(', ')}`).toEqual([]);
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

  test('приходящие анимации замирают в конце, а не в начале', async ({ page }) => {
    /*
      Ловушка, в которую сайт уже попадал: глобальное правило останавливает
      анимацию и подставляет --rest-offset. Для зацикленных это середина цикла,
      а для одноразовых «появлений» нулевое смещение означает нулевую фазу —
      элемент замирает прозрачным навсегда. У выходов из комнаты это значило,
      что без движения из комнаты не выйти.
    */
    const stuck: string[] = [];

    for (const path of ALL_PATHS) {
      await page.goto(path);
      await page.waitForTimeout(500);

      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          if (cs.animationName === 'none') continue;
          if (!cs.animationFillMode.split(', ').includes('forwards')) continue;
          if (cs.animationIterationCount.split(', ').some((c) => c === 'infinite')) continue;
          if (Number(cs.opacity) > 0.02) continue;
          // намеренно скрытые элементы в счёт не идут
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          out.push(`${el.tagName.toLowerCase()}.${(el.className || '—').toString().slice(0, 34)} → ${cs.animationName}`);
        }
        return out;
      });

      if (bad.length) stuck.push(`${path}: ${[...new Set(bad)].join('; ')}`);
    }

    expect(stuck, stuck.join('\n')).toEqual([]);
  });

  test('выходы из комнаты видны и кликабельны без движения', async ({ page }) => {
    for (const path of ALL_PATHS.filter((p) => p !== '/' && p !== '/colophon/')) {
      await page.goto(path);
      await page.waitForTimeout(400);

      const exits = page.locator('.exits .exit');
      const count = await exits.count();
      expect(count, path).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        await expect(exits.nth(i), `${path}: выход ${i}`).toBeVisible();
        const opacity = await exits.nth(i).evaluate((el) => {
          let o = 1;
          let node: Element | null = el;
          while (node) {
            o *= Number(getComputedStyle(node).opacity);
            node = node.parentElement;
          }
          return o;
        });
        expect(opacity, `${path}: выход ${i} прозрачен`).toBeGreaterThan(0.2);
      }
    }
  });

  test('кадры состояния покоя', async ({ page }) => {
    /*
      Бриф просит не гасить анимацию, а переводить её в осмысленную точку покоя.
      Проверить это по-настоящему можно только глазами, поэтому кадры снимаются
      и лежат рядом с обычными: видно, что комната замерла в середине вдоха.
    */
    const shots: Array<[string, string]> = [
      ['/', 'покой-центр'],
      ['/white/frost/', 'покой-морозный'],
      ['/blue/dusk/', 'покой-сумеречный'],
      ['/red/orange/', 'покой-оранжевый'],
    ];

    for (const [path, name] of shots) {
      await page.goto(path);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `screenshots/${name}.png` });
    }
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
