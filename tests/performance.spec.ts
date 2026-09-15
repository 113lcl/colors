import { test, expect } from '@playwright/test';
import { ALL_PATHS } from '../src/data/rooms.js';

/*
  Смысл сайта — в движении, а движение первым страдает от лишнего веса. Проверки
  держат две вещи: страница не тащит мегабайты скриптов и рисуется быстро.
  Пороги выставлены с большим запасом к текущим значениям — тест должен ловить
  регресс, а не падать от шума.
*/

const JS_BUDGET = 60 * 1024; // на страницу, суммарно
const CSS_BUDGET = 40 * 1024;

test.describe('вес и отрисовка', () => {
  test('ни одна страница не тащит лишних скриптов', async ({ page }) => {
    const report: string[] = [];

    for (const path of ALL_PATHS) {
      let js = 0;
      let css = 0;

      const onResponse = async (res: import('@playwright/test').Response) => {
        const url = res.url();
        if (!url.startsWith('http://localhost')) return;
        const type = res.headers()['content-type'] ?? '';
        try {
          const size = (await res.body()).length;
          if (type.includes('javascript')) js += size;
          else if (type.includes('css')) css += size;
        } catch {
          // ответ мог не сохраниться — для бюджета это не критично
        }
      };

      page.on('response', onResponse);
      await page.goto(path, { waitUntil: 'load' });
      await page.waitForTimeout(250);
      page.off('response', onResponse);

      report.push(`${path}: js ${(js / 1024).toFixed(1)} KB, css ${(css / 1024).toFixed(1)} KB`);
      expect(js, `${path}: скрипты ${(js / 1024).toFixed(1)} KB`).toBeLessThan(JS_BUDGET);
      expect(css, `${path}: стили ${(css / 1024).toFixed(1)} KB`).toBeLessThan(CSS_BUDGET);
    }

    console.log('\n' + report.join('\n') + '\n');
  });

  test('главная рисуется быстро', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });

    const paint = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: fcp ? fcp.startTime : null,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      };
    });

    expect(paint.fcp, 'нет замера first-contentful-paint').not.toBeNull();
    expect(paint.fcp!, `FCP ${paint.fcp?.toFixed(0)} ms`).toBeLessThan(2500);
    expect(paint.domContentLoaded, `DCL ${paint.domContentLoaded.toFixed(0)} ms`).toBeLessThan(2500);
  });

  test('анимация не держит главный поток занятым', async ({ page }) => {
    /*
      Долгие задачи — то, из-за чего плавная на вид анимация начинает заикаться.
      Проверяется самая тяжёлая комната: генеративный узор жёлто-зелёного.
    */
    await page.goto('/green/chartreuse/', { waitUntil: 'load' });

    const longTasks = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let count = 0;
          const observer = new PerformanceObserver((list) => {
            count += list.getEntries().filter((e) => e.duration > 120).length;
          });
          try {
            observer.observe({ entryTypes: ['longtask'] });
          } catch {
            resolve(0);
            return;
          }
          setTimeout(() => {
            observer.disconnect();
            resolve(count);
          }, 3000);
        })
    );

    expect(longTasks, `длинных задач: ${longTasks}`).toBeLessThanOrEqual(1);
  });
});
