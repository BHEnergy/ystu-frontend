const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const root = process.argv.includes('--legacy') ? path.dirname(project) : path.join(project, 'dist');
const output = path.join(project, 'test-results-v12', process.argv.includes('--legacy') ? 'legacy' : 'dist');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
        fs.mkdirSync(output, { recursive: true });
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.hostname !== 'ystu.test') return route.abort();
            const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
            return route.fulfill({ body: fs.readFileSync(file), contentType: ({ '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream' });
        });
        const visit = async name => {
            await page.goto(`http://ystu.test/pages/${name}.html`);
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(450);
        };
        await visit('structure');
        await page.evaluate(() => document.addEventListener('click', event => {
            if (event.target.closest('.structure__institute-link')) event.preventDefault();
        }));
        const institutes = page.locator('.structure__institute');
        for (const index of [0, 1]) {
            await institutes.nth(index).locator('a').first().tap();
            await page.waitForTimeout(450);
            assert(await institutes.evaluateAll(cards => cards.every(card => {
                const style = getComputedStyle(card);
                return style.outlineStyle === 'none' && getComputedStyle(card, '::after').transform === 'matrix(1, 0, 0, 1, 0, 0)';
            })), 'touch focus must not keep card highlights or enlarged arrows');
        }
        await page.keyboard.press('Tab');
        assert(await page.evaluate(() => {
            const link = document.activeElement;
            const card = link.closest('.structure__institute');
            return link.matches(':focus-visible') && card && getComputedStyle(card).outlineStyle === 'solid';
        }), 'keyboard focus must still highlight the card');
        console.log('OK: sequential mobile taps reset card states; keyboard focus remains visible');
        for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 844 });
            await visit('detail-vacancy');
            for (const scrollY of [0, 400]) {
                await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
                await page.waitForTimeout(450);
                const geometry = () => page.evaluate(() => {
                    const rect = document.querySelector('.header__wrapper').getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, scroll: window.scrollY };
                });
                const before = await geometry();
                await page.locator('[data-ui~="button-modal"]').first().evaluate(el => el.click());
                for (const delay of [40, 150, 350]) {
                    await page.waitForTimeout(delay);
                    const after = await geometry();
                    assert(Math.abs(before.x - after.x) < 1 && Math.abs(before.y - after.y) < 1 && Math.abs(before.width - after.width) < 1, `popup header shift ${width}/${scrollY}`);
                }
                await page.keyboard.press('Escape');
                await page.waitForTimeout(400);
                const restored = await geometry();
                assert(Math.abs(restored.scroll - before.scroll) < 1 && Math.abs(restored.y - before.y) < 1, 'popup scroll/header restoration');
            }
        }
        console.log('OK: popup header geometry at top and after scrolling, 390/1440px');
        await page.setViewportSize({ width: 390, height: 844 });
        await visit('detail-sotrudnik');
        assert(await page.locator('.sotrudnik__contact-item a').first().evaluate(el => Math.abs(parseFloat(getComputedStyle(el).lineHeight) / parseFloat(getComputedStyle(el).fontSize) - 1.4) < .01), 'contact link line-height');
        await visit('program');
        assert.equal(await page.locator('.program-about__description__feacher > p').evaluate(el => getComputedStyle(el).maxWidth), 'none');
        assert(await page.locator('.program-admissions__contacts').evaluate(el => !/[–‑]/.test(el.textContent) && /9:00 - 18:00/.test(el.textContent)), 'ASCII hyphens and spaced hours');
        await visit('detail-structure');
        assert.equal(await page.locator('.training-program-card .magistratura').first().evaluate(el => getComputedStyle(el).maxWidth), '110px');
        const card = page.locator('.training-program-card').first();
        await card.locator('a').first().focus();
        await page.waitForTimeout(450);
        assert(await card.evaluate(el => {
            const before = getComputedStyle(el, '::before'), after = getComputedStyle(el, '::after');
            return before.transform === after.transform && before.transform !== 'none' && getComputedStyle(el).outlineStyle === 'solid' && before.zIndex === '-1' && after.zIndex === '-1';
        }), 'both arrows, focus outline and layering');
        await card.screenshot({ path: path.join(output, 'training-touch-focus.png') });
        await visit('nauka');
        const trigger = page.locator('[data-ui~="dropdown--trigger"]').first();
        await trigger.click(); await page.waitForTimeout(350);
        const samples = await page.evaluate(async () => {
            const trigger = document.querySelector('[data-ui~="dropdown--trigger"]');
            const panel = document.getElementById(trigger.getAttribute('aria-controls'));
            trigger.click();
            const samples = [], started = performance.now();
            while (performance.now() - started < 650) {
                samples.push({ height: panel.getBoundingClientRect().height, offset: panel.firstElementChild.getBoundingClientRect().y - panel.getBoundingClientRect().y });
                await new Promise(requestAnimationFrame);
            }
            return samples;
        });
        assert(samples.every((s, i) => !i || s.height >= samples[i - 1].height - 2), 'accordion height must not jump back');
        assert(Math.max(...samples.map(s => s.offset)) - Math.min(...samples.map(s => s.offset)) < 2, 'accordion text must not restart its entrance');
        await visit('ui-kit');
        assert.equal(await page.locator('#hero-variants .hero-banner').count(), 1);
        assert.equal(await page.locator('#hero-variants .hero-banner__content--solid').count(), 0);
        const caption = page.locator('.wyswig__table-caption').filter({ hasText: 'Пример таблицы' }).first();
        await caption.scrollIntoViewIfNeeded();
        const beforeX = await caption.evaluate(el => el.getBoundingClientRect().x);
        await caption.evaluate(el => { const scroll = el.nextElementSibling; scroll.scrollLeft = 100; });
        assert.equal(await caption.evaluate(el => el.getBoundingClientRect().x), beforeX, 'caption fixed outside horizontal scroll');
        await caption.locator('..').screenshot({ path: path.join(output, 'cms-table-caption.png') });
        await visit('student-life');
        for (const index of [1, 5]) {
            const item = page.locator('.student-links__item').nth(index);
            await item.locator('a').focus();
            await page.waitForTimeout(500);
            assert(await item.evaluate(el => {
                const style = getComputedStyle(el, '::after');
                return style.maskImage.includes('sd-') && style.backgroundImage === 'none' && style.backgroundColor === 'rgb(244, 119, 43)' && getComputedStyle(el).outlineStyle === 'solid';
            }), 'touch wave keeps its mask and focus border');
            await item.screenshot({ path: path.join(output, `wave-touch-${index + 1}.png`) });
        }
        await visit('index');
        const feature = page.locator('.ficher').first();
        await feature.focus();
        await page.waitForTimeout(500);
        assert.equal(await feature.locator('.ficher__text').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
        assert.deepEqual(errors, []);
        console.log('OK: follow-up — breadcrumb styles, contacts, badges, both arrows/focus, accordion frames, caption, glass banner, touch masks and main cards');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
