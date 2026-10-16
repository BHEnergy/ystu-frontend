const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const root = process.argv.includes('--legacy') ? path.dirname(project) : path.join(project, 'dist');
const output = path.join(project, 'test-results-v12', process.argv.includes('--legacy') ? 'legacy' : 'dist');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
(async () => {
    const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
    try {
        fs.mkdirSync(output, { recursive: true });
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.hostname !== 'ystu.test') return route.abort();
            const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
            return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
        });
        const visit = async (name, width) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(`http://ystu.test/pages/${name}.html`);
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(450);
        };
        const widths = process.argv.includes('--behavior-only') ? [] : process.argv.includes('--legacy') ? [390, 815, 1440] : [390, 480, 742, 815, 1024, 1306, 1440];
        for (const width of widths) {
            for (const name of ['programs', 'news-events', 'vacancies', 'detail-vacancy', 'detail-structure', 'program', 'nauka', 'student-life', 'index', 'ui-kit']) {
                await visit(name, width);
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} ${width}: overflow`);
                if (name === 'programs' && [742, 1024, 1306].includes(width)) assert(await page.locator('.program-card').first().evaluate(card => {
                    const tags = [...card.querySelectorAll('.program-card__tag')];
                    return tags.every(tag => Math.abs(tag.getBoundingClientRect().y - tags[0].getBoundingClientRect().y) < 2);
                }), `program badges must share a row ${width}`);
                if (name === 'vacancies') assert(await page.locator('.vacancy-card').first().evaluate(card => {
                    const button = card.querySelector('.vacancy-card__button');
                    return button.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom;
                }), `vacancy button ${width}`);
                if (name === 'news-events') assert(await page.locator('.news__card').first().evaluate(card => {
                    const tags = card.querySelector('.news__tags');
                    return !tags || tags.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom;
                }), `news tags ${width}`);
            }
            console.log(`OK ${width}px: 10 страниц, переполнение и карточки`);
        }
        await visit('detail-vacancy', 1306);
        const before = await page.evaluate(() => ({ header: document.querySelector('.header').getBoundingClientRect().width, content: document.querySelector('main .container').getBoundingClientRect().x }));
        await page.locator('[data-ui~="button-modal"]').first().click();
        const after = await page.evaluate(() => ({ header: document.querySelector('.header').getBoundingClientRect().width, content: document.querySelector('main .container').getBoundingClientRect().x }));
        assert(Math.abs(before.header - after.header) <= 1 && Math.abs(before.content - after.content) <= 1, 'modal layout shift');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await visit('nauka', 815);
        const trigger = page.locator('[data-ui~="dropdown--trigger"]').first();
        const content = page.locator('[data-ui~="dropdown--content"]').first();
        await trigger.click();
        assert.equal(await content.evaluate(el => el.hidden), false, 'closing animation must remain visible');
        await page.waitForTimeout(350);
        assert.equal(await content.evaluate(el => el.hidden), true, 'accordion finish closing');
        await trigger.click(); await page.waitForTimeout(350);
        assert.equal(await content.evaluate(el => el.hidden), false, 'accordion reopening');
        await trigger.click(); await trigger.click(); await page.waitForTimeout(350);
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true', 'rapid toggle');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await trigger.click();
        assert.equal(await content.evaluate(el => el.hidden), true, 'reduced motion');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await visit('program', 390);
        await page.evaluate(() => {
            const table = document.createElement('table');
            table.style.minWidth = '1100px';
            table.innerHTML = '<tr><td>Широкая таблица из CMS</td><td>Данные</td></tr>';
            document.querySelector('[data-ui~="wyswig"]').append(table);
        });
        await page.waitForTimeout(100);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'CMS table page overflow');
        assert(await page.locator('.wyswig__table-scroll').last().evaluate(el => el.scrollWidth > el.clientWidth), 'table local scrolling');
        await visit('news-events', 390);
        assert(await page.locator('.event__date').first().evaluate(el => {
            const style = getComputedStyle(el, '::before');
            return style.backgroundSize === '384px 864px' && style.width === '18px';
        }), 'mobile event sprite');
        await page.screenshot({ path: path.join(output, 'events-mobile.png'), fullPage: true });
        for (const width of [742, 1024, 1306]) {
            await visit('programs', width);
            assert(await page.locator('.program-card').first().evaluate(card => {
                const tags = [...card.querySelectorAll('.program-card__tag')];
                return tags.every(tag => Math.abs(tag.getBoundingClientRect().y - tags[0].getBoundingClientRect().y) < 2);
            }), `full-width badges ${width}`);
            console.log(`OK: ряд бейджей ${width}px`);
        }
        await visit('index', 1440);
        await page.locator('.footer').screenshot({ path: path.join(output, 'footer-desktop.png') });
        await visit('programs', 1306);
        await page.locator('.program-card').first().screenshot({ path: path.join(output, 'program-badges.png') });
        assert.deepEqual(errors, [], 'browser errors');
        console.log('OK: modal geometry, accordion close/reopen/rapid/reduced-motion, CMS table, mobile sprite');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
