const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            for (const base of ['http://127.0.0.1:5500', 'http://localhost:8000']) {
                const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
                const errors = [];
                page.on('pageerror', e => errors.push(e.message));
                await page.goto(base + '/pages/student-life.html');
                await page.evaluate(() => SiteUI.ready);
                await page.evaluate(() => {
                    window.reuseHosts = [];
                    for (const width of [280, 400, 700, 1100]) {
                        const host = document.createElement('section');
                        host.style.width = width + 'px';
                        host.style.margin = '20px';
                        for (const selector of ['.student-directions', '.student-links']) {
                            const clone = document.querySelector(selector).cloneNode(true);
                            clone.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
                            clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
                            clone.querySelectorAll('[data-ui="content-filter-status"]').forEach(el => el.remove());
                            host.append(clone);
                        }
                        document.body.append(host);
                        reuseHosts.push(host);
                    }
                });
                await page.evaluate(async () => {
                    for (const host of reuseHosts) { await SiteUI.init(host); await SiteUI.init(host); }
                });
                await page.evaluate(() => document.fonts.ready);
                await page.waitForTimeout(500);
                const narrow = await page.evaluate(() => reuseHosts.map(host => ({
                    width: host.clientWidth,
                    scroll: host.scrollWidth,
                    directions: [...host.querySelectorAll('.student-direction')].map(el => ({
                        direction: getComputedStyle(el).flexDirection,
                        scroll: el.scrollWidth, width: el.clientWidth
                    })),
                    galleries: [...host.querySelectorAll('.js-init-student-slider')].every(el => !!el.swiper),
                    columns: getComputedStyle(host.querySelector('.student-links__body')).gridTemplateColumns.split(' ').length
                })));
                assert(narrow.every(item => item.scroll <= item.width + 1), JSON.stringify(narrow));
                assert(narrow.every(item => item.directions.every(d => (item.width < 1000 ? d.direction === 'column' : d.direction.startsWith('row')) && d.scroll <= d.width + 1) && item.galleries), JSON.stringify(narrow));
                assert.deepEqual(narrow.map(item => item.columns), [1, 1, 2, 3]);
                assert(await page.evaluate(() => {
                    const first = reuseHosts[0].querySelector('.js-init-student-slider');
                    const second = reuseHosts[1].querySelector('.js-init-student-slider');
                    first.querySelector('.swiper-button-next:not(.big)').click();
                    return first.swiper.activeIndex === 1 && second.swiper.activeIndex === 0;
                }), 'Локальные стрелки и повторный init');
                await page.evaluate(async () => {
                    const host = document.createElement('section');
                    host.id = 'dynamic-catalog-test';
                    host.innerHTML = '<div data-ui="listing-page"><form><input data-ui="catalog-search__input"><button>Search</button></form><div data-ui="listing-page__results"><article data-ui="program-card">Alpha</article><article data-ui="program-card">Beta</article></div></div>';
                    document.body.append(host);
                    await SiteUI.init(host); await SiteUI.init(host);
                    const input = host.querySelector('input'); input.value = 'Alpha';
                    input.form.requestSubmit();
                });
                assert.deepEqual(await page.locator('#dynamic-catalog-test article').evaluateAll(es => es.map(e => e.hidden)), [false, true]);
                assert.equal(await page.locator('#dynamic-catalog-test .catalog-search-status').count(), 1);
                await page.evaluate(async () => {
                    const host = document.createElement('div'); host.id = 'dynamic-form-test';
                    host.innerHTML = '<form data-ui="modal-form"><div data-ui="input--container"><input data-validate="phone" required></div></form>';
                    document.body.append(host); await SiteUI.init(host); await SiteUI.init(host);
                });
                await page.locator('#dynamic-form-test input').fill('123');
                assert(await page.locator('#dynamic-form-test input').evaluate(el => !el.validity.valid));
                assert.equal(await page.locator('#dynamic-form-test [data-ui="error-text"]').count(), 1);
                assert.deepEqual(errors, []);
                console.log(engine.name(), base, 'reuse OK: containers, galleries, catalog, validation');
                await page.close();
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
