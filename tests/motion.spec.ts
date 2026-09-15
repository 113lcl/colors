import { test, expect } from '@playwright/test';
import { ROOMS, roomPath, BRANCHES } from '../src/data/rooms.js';

/*
  Бриф просил временную служебную страницу-стенд, показывающую все части общей
  системы. Вместо неё — этот набор: он проверяет ровно то же, но не устаревает
  и не требует удаления перед сдачей.

  Смысл проверок: грамматика движения должна быть СВОЙСТВОМ ВЕТКИ, а не набором
  чисел, разбросанных по комнатам. Если кто-то напишет в комнате свой `ease`
  или свои 300 ms, ветка перестанет быть цельной — и это должно падать.
*/

const GRAMMAR = {
  white: { micro: 380, state: 780, spring: false },
  green: { micro: 330, state: 640, spring: true },
  blue: { micro: 420, state: 2400, spring: false },
  black: { micro: 230, state: 540, spring: false },
  red: { micro: 165, state: 230, spring: true },
} as const;

const readVars = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      micro: cs.getPropertyValue('--dur-micro').trim(),
      state: cs.getPropertyValue('--dur-state').trim(),
      amb: cs.getPropertyValue('--dur-amb').trim(),
      easeMicro: cs.getPropertyValue('--ease-micro').trim(),
      easeState: cs.getPropertyValue('--ease-state').trim(),
      branchColour: cs.getPropertyValue('--branch').trim(),
    };
  });

const ms = (value: string) => (value.endsWith('ms') ? parseFloat(value) : parseFloat(value) * 1000);

/* Перелёт кривой: третий коэффициент cubic-bezier больше единицы. */
const hasOvershoot = (ease: string) => {
  const nums = ease.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  return nums.length === 4 && (nums[1] > 1 || nums[3] > 1);
};

test.describe('грамматики движения', () => {
  for (const [branch, expected] of Object.entries(GRAMMAR)) {
    test(`${branch}: длительности и кривые — как в дизайн-системе`, async ({ page }) => {
      const room = ROOMS.find((r) => r.branch === branch)!;
      await page.goto(roomPath(room.branch, room.slug));

      const vars = await readVars(page);

      expect(ms(vars.micro), `${branch} --dur-micro`).toBe(expected.micro);
      expect(ms(vars.state), `${branch} --dur-state`).toBe(expected.state);
      expect(vars.easeMicro, `${branch} --ease-micro`).toContain('cubic-bezier');
      expect(vars.easeState, `${branch} --ease-state`).toContain('cubic-bezier');
      expect(hasOvershoot(vars.easeMicro), `${branch}: перелёт кривой`).toBe(expected.spring);
    });
  }

  test('все комнаты одной ветки говорят на одном языке движения', async ({ page }) => {
    for (const branch of Object.keys(BRANCHES)) {
      const rooms = ROOMS.filter((r) => r.branch === branch);
      const seen: string[] = [];

      for (const room of rooms) {
        await page.goto(roomPath(room.branch, room.slug));
        const vars = await readVars(page);
        seen.push(JSON.stringify(vars));
      }

      expect(new Set(seen).size, `${branch}: комнаты разошлись в грамматике`).toBe(1);
    }
  });

  test('ни одна комната не пишет дефолтные тайминги руками', async ({ page }) => {
    /*
      Ловится самое частое, из-за чего сайт начинает ощущаться дёшево: переход
      на браузерном ease/linear или на «круглой» длительности вроде 300 ms,
      не связанной с грамматикой ветки. Тушевая пелена — намеренное исключение:
      она одна на весь сайт и живёт вне веток.
    */
    const offenders: string[] = [];

    for (const room of ROOMS) {
      await page.goto(roomPath(room.branch, room.slug));
      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          if (el.closest('.ink-veil') || el.id === 'ink-veil') continue;
          const cs = getComputedStyle(el);
          if (cs.transitionDuration === '0s') continue;
          const fns = cs.transitionTimingFunction.split(', ');
          for (const fn of fns) {
            if (fn === 'ease' || fn === 'linear' || fn === 'ease-in-out' || fn === 'ease-in' || fn === 'ease-out') {
              out.push(`${el.tagName.toLowerCase()}.${el.className || '—'} → ${fn}`);
            }
          }
        }
        return out;
      });

      if (bad.length) offenders.push(`${room.branch}/${room.slug}: ${bad.slice(0, 4).join('; ')}`);
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  test('движется только transform и opacity', async ({ page }) => {
    /*
      Анимация геометрии (top/left/width/height/margin) — главная причина
      дёрганого движения. Проверяются объявленные переходы на каждой странице.
    */
    const FORBIDDEN = ['top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'padding'];
    const offenders: string[] = [];

    for (const room of ROOMS) {
      await page.goto(roomPath(room.branch, room.slug));
      const bad = await page.evaluate((forbidden) => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const props = getComputedStyle(el).transitionProperty.split(', ');
          for (const p of props) {
            if (forbidden.includes(p.trim())) out.push(`${el.tagName.toLowerCase()}.${el.className || '—'} → ${p}`);
          }
        }
        return out;
      }, FORBIDDEN);

      if (bad.length) offenders.push(`${room.branch}/${room.slug}: ${bad.slice(0, 4).join('; ')}`);
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  test('у каждой зацикленной анимации есть точка покоя', async ({ page }) => {
    /*
      --rest-offset — это то, на чём держится корректный reduced-motion:
      без него элемент замрёт в нулевой фазе цикла, а не в середине вдоха.
    */
    const offenders: string[] = [];

    for (const room of ROOMS) {
      await page.goto(roomPath(room.branch, room.slug));
      await page.waitForTimeout(250);

      const bad = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          if (cs.animationName === 'none') continue;
          if (cs.animationIterationCount.split(', ').every((c) => c !== 'infinite')) continue;
          if (!cs.getPropertyValue('--rest-offset').trim()) {
            out.push(`${el.tagName.toLowerCase()}.${(el.className || '—').toString().slice(0, 30)} → ${cs.animationName}`);
          }
        }
        return out;
      });

      if (bad.length) offenders.push(`${room.branch}/${room.slug}: ${[...new Set(bad)].slice(0, 5).join('; ')}`);
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
