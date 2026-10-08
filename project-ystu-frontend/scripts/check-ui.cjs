const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const build = require('./build.cjs');
const root = path.resolve(__dirname, '..');
const legacyMode = process.argv.includes('--legacy');
const dist = legacyMode ? path.dirname(root) : path.join(root, 'dist');
const results = path.join(root, legacyMode ? 'test-results-legacy' : 'test-results');
const errors = [], missing = [], checks = [];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
const record = (name) => { checks.push(name); console.log('OK:', name); };

(async () => {
    if (!legacyMode) build();
    console.log('Проверяется каталог:', dist);
    fs.mkdirSync(results, { recursive: true });
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        // Внешняя карта не входит в тест локальной функциональности.
        if (url.hostname !== 'ystu.test') return route.abort();
        const file = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file)) {
            missing.push(url.pathname);
            return route.fulfill({ status: 404, body: '' });
        }
        return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
    });
    const visit = async name => {
        await page.goto(`http://ystu.test/pages/${name}.html`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
    };
    try {
        const pages = fs.readdirSync(path.join(dist, 'pages')).filter(f => f.endsWith('.html') && f !== 'map-test.html');
        for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            for (const file of pages) {
                await visit(file.replace('.html', ''));
                assert.equal(await page.locator('img[alt="Тест"]').count(), 0, file + ': placeholder alt');
                assert.equal(await page.locator('img:not([alt])').count(), 0, file + ': missing alt');
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), file + ': horizontal overflow');
            }
            record(`${pages.length} страниц: ${width}px, без переполнения и alt-заглушек`);
            await visit('programs');
            const search = page.locator('.catalog-search__input:visible').first();
            assert(await search.evaluate(input => !!input.form), 'Search has no form');
            await search.fill('несуществующаяпрограмма123');
            await search.press('Enter');
            assert.equal(await page.locator('.listing-page__results .program-card:visible').count(), 0);
            await search.fill(''); await search.press('Enter');
            assert((await page.locator('.listing-page__results .program-card:visible').count()) > 0);
            record(`Поиск по программам: ${width}px, Enter и сброс`);
            await visit('structure');
            await page.locator('.structure__tag').nth(1).click();
            assert.equal(await page.locator('.structure__institutes:visible').count(), 0);
            await page.locator('.structure__tag').first().click();
            assert.equal(await page.locator('.structure__institutes:visible').count(), 1);
            record(`Переключатели структуры: ${width}px`);
            await visit('detail-structure');
            const tabs = page.locator('.structure-detail__tab');
            await tabs.last().click();
            const count = await page.locator('.training-program-card:visible').count();
            assert(count > 0 && count < await page.locator('.training-program-card').count());
            await tabs.last().click();
            assert.equal(await page.locator('.training-program-card:visible').count(), count);
            record(`Табы программ и повторный клик: ${width}px`);
            await visit('news-events');
            const tags = page.locator('.events__tag');
            await tags.last().click();
            assert.equal(await page.locator('.news__card:visible').count(), 1);
            assert.match(await page.locator('.news__card:visible').first().innerText(), /научные проекты/);
            // Пустое состояние проверяем отдельно от добавленной демонстрационной темы.
            await tags.last().evaluate(tag => { tag.dataset.filter = '#несуществующая-тема'; });
            await tags.last().click();
            assert.equal(await page.locator('.news__card:visible').count(), 0);
            await page.locator('.events__title[data-tab="events"]').click();
            await page.waitForTimeout(400);
            assert.equal(await page.locator('.content-filter-status:visible').count(), 0, 'News empty state leaks into events');
            await page.locator('.events__title[data-tab="news"]').click();
            await page.waitForTimeout(400);
            await tags.first().click();
            assert((await page.locator('.news__card:visible').count()) > 0);
            const targets = await page.locator('.pagination:visible a:visible').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return [r.width, r.height]; }));
            assert(targets.every(([w,h]) => w >= 44 && h >= 44), 'Pagination targets smaller than 44px');
            await page.locator('.pagination:visible').first().screenshot({ path: path.join(results, `pagination-${width}.png`) });
            record(`Хештеги и пагинация 44×44: ${width}px`);
            await visit('program');
            const accordion = page.locator('.dropdown--trigger').first();
            await accordion.focus();
            const expanded = await accordion.getAttribute('aria-expanded');
            await accordion.press('Enter');
            assert.notEqual(await accordion.getAttribute('aria-expanded'), expanded);
            await accordion.press('Space');
            assert.equal(await accordion.getAttribute('aria-expanded'), expanded);
            record(`Аккордеон Enter/Space: ${width}px`);
            await visit('student-life');
            const next = page.locator(width === 390 ? '.student-direction__controls .swiper-button-next:not(.big):visible' : '.student-direction__controls .swiper-button-next.big:visible').first();
            const slider = page.locator('.js-init-student-slider').first();
            const before = await slider.evaluate(el => el.swiper.activeIndex);
            await next.focus(); await next.press('Enter');
            await page.waitForTimeout(350);
            assert.equal(await slider.evaluate(el => el.swiper.activeIndex), before + 1);
            record(`Стрелка слайдера Enter: ${width}px`);
        }
        for (const height of [777, 600]) {
            await page.setViewportSize({ width: 1440, height });
            await visit('index');
            await page.locator('.btn__menu').click();
            await page.waitForTimeout(700);
            const menu = page.locator('.mega-menu');
            assert(await menu.evaluate(el => el.getBoundingClientRect().bottom <= innerHeight), 'Menu exceeds viewport');
            await page.locator('.mega-menu__primary-link').last().focus();
            assert(await page.locator('.mega-menu__primary-link').last().evaluate(el => el.getBoundingClientRect().bottom <= innerHeight));
            await menu.screenshot({ path: path.join(results, `menu-1440x${height}.png`) });
            record(`Меню прокручивается, последний пункт доступен: 1440×${height}`);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        await visit('ui-kit');
        const primary = page.locator('.button-states__group').first().locator('button:not([disabled])');
        await primary.scrollIntoViewIfNeeded();
        await primary.hover(); await page.waitForTimeout(250);
        assert.equal(await primary.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(248, 173, 128)');
        await page.mouse.down(); await page.waitForTimeout(250);
        assert.equal(await primary.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(229, 87, 0)');
        await page.mouse.up();
        await primary.press('Tab'); await page.keyboard.press('Shift+Tab');
        assert(await primary.evaluate(el => el.matches(':focus-visible')));
        await page.locator('.button-states').screenshot({ path: path.join(results, 'button-states.png') });
        record('Кнопки: Hover/Active из Figma и клавиатурный Focus');
        assert.deepEqual(errors, [], 'Browser errors');
        assert.deepEqual(missing, [], 'Missing assets');
        fs.writeFileSync(path.join(results, 'checks.json'), JSON.stringify({ checks, errors, missing }, null, 2));
    } catch (error) {
        await page.screenshot({ path: path.join(results, 'failure.png') });
        throw error;
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
