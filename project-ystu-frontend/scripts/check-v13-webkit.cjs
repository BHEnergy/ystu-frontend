const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            for (const base of ['http://127.0.0.1:5500', 'http://127.0.0.1:5500/project-ystu-frontend/dist']) {
                const page = await browser.newPage({ hasTouch: true });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                for (const width of [390, 576, 744, 990, 1200, 1920]) {
                    await page.setViewportSize({ width, height: 1000 });
                    await page.goto(base + '/pages/index.html');
                    await page.evaluate(() => document.fonts.ready);
                    assert(await page.locator('.redstar img').evaluate(el => {
                        const bounds = el.getBoundingClientRect();
                        return el.complete && el.naturalWidth > 0 && bounds.width > 120 && bounds.height >= 12;
                    }), 'Redstar должен иметь ненулевые размеры: ' + width);
                    assert.equal(await page.locator('.preparatory-courses__title').evaluate(el => getComputedStyle(el).fontWeight), width <= 768 ? '600' : '700');
                    if (width === 1920) assert.equal(await page.locator('.university-statistics').evaluate(el => getComputedStyle(el).backgroundPosition), 'calc(100% + 6px) -8px');
                    if (width === 1920) assert.match(await page.locator('.university-statistics').evaluate(el => getComputedStyle(el).backgroundSize), /^48%( auto)?$/);
                    await page.goto(base + '/pages/programs.html');
                    await page.evaluate(() => document.fonts.ready);
                    assert(await page.locator('.program-card--wide').evaluateAll(cards => cards.length > 0 && cards.every(card => {
                        const title = card.querySelector('.program-card__title').getBoundingClientRect();
                        const content = card.querySelector('.program-card__content').getBoundingClientRect();
                        const stats = card.querySelector('.program-card__stats').getBoundingClientRect();
                        return Math.abs(title.width - content.width) < 1 && stats.top >= title.bottom;
                    })), 'Длинные названия должны занимать ширину контента');
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Переполнение programs: ' + width);
                }
                await page.goto(base + '/pages/detail-vacancy.html');
                assert(await page.locator('.wyswig ul > li').evaluateAll(items => items.length > 0 && items.every(el => getComputedStyle(el).listStyleType === 'none' && getComputedStyle(el, '::marker').content === '""' && getComputedStyle(el, '::before').content === '"-"')));
                assert.deepEqual(errors, []);
                console.log(engine.name(), base, 'OK: шрифты, статистика, длинные названия, списки, Redstar');
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
