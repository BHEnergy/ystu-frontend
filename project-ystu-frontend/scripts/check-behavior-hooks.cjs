const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');

// Проверяем поведение без перечисленных в замечании оформительских классов.
const stylingClasses = new Set(['tab', 'dropdown--item', 'button-modal', 'modal', 'campus-marker__trigger']);
const withoutStylingClasses = (html) => html.replace(/class\s*=\s*"([^"]*)"/g, (_, value) => {
    const tokens = value.split(/\s+/);
    return `class="${tokens.filter(token => !stylingClasses.has(token)
        && !(tokens.includes('dropdown--item') && token === 'open')).join(' ')}"`;
});

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        for (const root of [path.resolve(__dirname, '../..'), path.resolve(__dirname, '../dist')]) {
            const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.hostname !== 'ystu.test') return route.abort();
                const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                const ext = path.extname(file);
                const contentType = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' }[ext] || 'application/octet-stream';
                const body = ext === '.html' ? withoutStylingClasses(fs.readFileSync(file, 'utf8')) : fs.readFileSync(file);
                return route.fulfill({ body, contentType });
            });
            const visit = async name => {
                await page.goto(`http://ystu.test/pages/${name}.html`);
                await page.waitForTimeout(300);
            };

            await visit('news-events');
            const newsPanel = page.locator('[data-ui~="events__container"][data-tab="news"]');
            await newsPanel.evaluate(element => {
                element.classList.remove('active');
                element.setAttribute('aria-hidden', 'false');
            });
            const nextPage = newsPanel.locator('[data-ui~="pagination-next"]');
            await nextPage.evaluate(element => element.classList.remove('pagination__button-next'));
            const initialCard = await newsPanel.locator('[data-ui~="news__card"]').evaluateAll(elements => elements.find(element => !element.hidden).textContent);
            for (const number of [2, 3]) {
                await nextPage.evaluate(element => element.click());
                assert.equal(new URL(page.url()).searchParams.get('page'), String(number));
                assert.equal(new URL(page.url()).searchParams.get('tab'), 'news');
                assert.equal((await newsPanel.locator('[aria-current="page"]').textContent()).trim(), String(number));
                assert.equal(await newsPanel.locator('[data-ui~="news__card"]').evaluateAll(elements => elements.filter(element => !element.hidden).length), 6);
                assert.notEqual(await newsPanel.locator('[data-ui~="news__card"]').evaluateAll(elements => elements.find(element => !element.hidden).textContent), initialCard);
                assert.equal(new URL(await nextPage.getAttribute('href'), page.url()).searchParams.get('page'), String(number + 1));
            }
            const previousPage = newsPanel.locator('[data-ui~="pagination-prev"]');
            await previousPage.evaluate(element => {
                element.classList.remove('pagination__button-prev');
                element.click();
            });
            assert.equal(new URL(page.url()).searchParams.get('page'), '2');
            await newsPanel.locator('[data-ui~="pagination__page"]').first().evaluate(element => element.click());
            await newsPanel.locator('[data-ui~="pagination__page"]').nth(1).evaluate(element => element.click());
            assert.equal(new URL(page.url()).searchParams.get('page'), '2', 'Номер меняет URL без класса active');
            await visit('news-events');
            for (const tab of ['events', 'news', 'events']) {
                const control = page.locator(`[data-ui~="tab"][data-tab="${tab}"]`);
                await control.evaluate(element => element.click());
                await page.waitForTimeout(50);
                assert.equal(await control.getAttribute('aria-pressed'), 'true');
                assert.equal(await page.locator('[data-ui~="tab"][aria-pressed="true"]').count(), 1);
                assert.equal(await page.locator(`[data-ui~="events__container"][data-tab="${tab}"]`).getAttribute('aria-hidden'), 'false');
            }

            const trigger = page.locator('[data-ui~="button-modal"]').first();
            const modalId = await trigger.getAttribute('data-modal');
            const modal = page.locator(`[data-ui~="modal"][data-modal="${modalId}"]`);
            await trigger.evaluate(element => element.click());
            assert(await modal.evaluate(element => element.classList.contains('modal--active')));
            await modal.locator('[data-ui~="modal-close"]').evaluate(element => element.click());
            await page.waitForTimeout(260);
            assert(!(await modal.evaluate(element => element.classList.contains('modal--active'))));

            await visit('program');
            const accordion = page.locator('[data-ui~="dropdown--item"]').first();
            const toggle = accordion.locator('[data-ui~="dropdown--trigger"]');
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'Начальное состояние не зависит от .open');
            await toggle.evaluate(element => element.click());
            assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
            assert(await accordion.locator('[data-ui~="dropdown--content"]').evaluate(element => element.hidden));
            await toggle.evaluate(element => element.click());
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true');

            await visit('map');
            const marker = page.locator('[data-ui~="campus-marker__trigger"]').first();
            await marker.evaluate(element => {
                element.classList.remove('campus-marker__trigger');
                element.click();
            });
            assert.equal(await marker.getAttribute('aria-expanded'), 'true');
            await page.locator('[data-ui~="campus-marker__close"]').evaluate(element => element.click());
            assert.equal(await marker.getAttribute('aria-expanded'), 'false');
            assert.deepEqual(errors, []);
            console.log(`${path.basename(root)}: табы, аккордеон, модальное окно, метки и пагинация (карточки/URL/повторные стрелки) работают без CSS-классов`);
            await page.close();
        }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
