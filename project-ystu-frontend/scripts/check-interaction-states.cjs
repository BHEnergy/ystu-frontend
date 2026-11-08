const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const repo = path.dirname(project);
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const selectors = [
    '.events__tag:not(.current)', '.events__tag.current', '.events__title', '.catalog-filters__reset', '.catalog-filters-trigger',
    '.catalog-search__button', '.mobile-filter-panel__close', '.mobile-filter-panel summary',
    '.navbar__panel a', '.header__mobile-tools a', '.header__menu > a:first-child', '.header-search__close',
    '.program-about__link', '.disclosure summary', '.modal-success__back',
    '.campus-filter summary', '.campus-filter__panel button', '.campus-map__search-button', '.campus-marker__close',
    '.structure-detail__tab', '.structure-about__video', '.banner__body',
    '.swiper-button-next:not(.swiper-button-disabled, .swiper-button-lock, [aria-disabled="true"])',
    '.contact-section__contact a', '.employee-profile__contact-item a', '.contact-card a',
    '.person-card__contacts a', '.cookie-text a', '.checkbox--container label a',
    '.ui-kit__toc a', '.ui-kit__meta a', '.ui-kit__intro a',
    '.btn--default:not(:disabled, [aria-disabled="true"])', '.btn--blue:not(:disabled, [aria-disabled="true"])',
    '.btn--white:not(:disabled, [aria-disabled="true"])', '.btn--reverse', '.btn--ghost:not(:disabled, [aria-disabled="true"])',
    '.filter-tag:not(.select)', '.filter-tag.select', '.breadcrumbs a', '.program-card__title a', '.document-list__link',
    '.news__card', '.swiper-pagination-bullet',
];

(async () => {
    for (const relative of ['css/components/footer.css', 'project-ystu-frontend/src/styles/layout/footer.css', 'project-ystu-frontend/dist/styles/layout/footer.css']) {
        const baseline = execFileSync('git', ['show', 'HEAD:' + relative], { cwd: repo, encoding: 'utf8' });
        assert.equal(fs.readFileSync(path.join(repo, relative), 'utf8').replaceAll('\r', ''), baseline.replaceAll('\r', ''), 'footer is protected');
    }
    const browser = await chromium.launch({ channel: 'chromium', headless: true });
    try {
        for (const root of [repo, path.join(project, 'dist')]) {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            await page.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.hostname !== 'ystu.test') return route.abort();
                const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                return route.fulfill({ body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
            });
            const cdp = await page.context().newCDPSession(page);
            await cdp.send('DOM.enable');
            await cdp.send('CSS.enable');
            const tested = new Set();
            const failures = [];
            let checks = 0;
            for (const file of fs.readdirSync(path.join(root, 'pages')).filter(file => file.endsWith('.html') && !process.argv.includes('--media-only'))) {
                await page.goto('http://ystu.test/pages/' + file);
                await page.evaluate(() => document.fonts.ready);
                if (file === 'map.html') await page.locator('.campus-marker__trigger').first().evaluate(button => button.click());
                await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
                await page.evaluate(() => {
                    window.interactionSnapshot = selector => {
                        const target = document.querySelector(selector);
                        const nodes = [target, target.parentElement, ...target.querySelectorAll('*')].slice(0, 12);
                        return JSON.stringify(nodes.map(node => ['', '::before', '::after'].map(pseudo => {
                            const style = getComputedStyle(node, pseudo || null);
                            return ['color', 'backgroundColor', 'borderColor', 'opacity', 'filter', 'transform', 'textDecorationLine', 'boxShadow', 'outlineStyle', 'outlineColor', 'outlineWidth'].map(key => style[key]);
                        })));
                    };
                });
                const { root: doc } = await cdp.send('DOM.getDocument');
                for (const selector of selectors) {
                    if (!await page.locator(selector).count()) continue;
                    tested.add(selector);
                    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector });
                    const normal = await page.evaluate(selector => window.interactionSnapshot(selector), selector);
                    for (const state of ['hover', 'active', 'focus-visible']) {
                        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: state === 'focus-visible' ? ['focus', state] : [state] });
                        const changed = await page.evaluate(selector => window.interactionSnapshot(selector), selector);
                        // По согласованию логотип не меняется при hover.
                        if (selector === '.header__menu > a:first-child' && state === 'hover') {
                            assert.equal(changed, normal, 'logo must not change on hover');
                        } else if (normal === changed) failures.push(file + ': ' + selector + ' has no visible ' + state);
                        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
                        checks++;
                    }
                }
                // Неактивные кнопки не должны реагировать на hover/нажатие.
                for (const selector of ['.btn:disabled', '.btn[aria-disabled="true"]']) {
                    if (!await page.locator(selector).count()) continue;
                    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.nodeId, selector });
                    const normal = await page.evaluate(selector => window.interactionSnapshot(selector), selector);
                    for (const state of ['hover', 'active']) {
                        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [state] });
                        assert.equal(await page.evaluate(selector => window.interactionSnapshot(selector), selector), normal, selector + ': disabled state changes');
                    }
                    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
                }
                console.log('OK scanned ' + path.basename(root) + '/' + file);
            }
            console.log('Checks: ' + checks + '; component families: ' + tested.size);
            if (failures.length) console.log(failures.join('\n'));
            assert.equal(failures.length, 0, 'missing interaction states');
            await page.goto('http://ystu.test/pages/ui-kit.html');
            await page.emulateMedia({ reducedMotion: 'reduce' });
            for (const selector of selectors) {
                if (!await page.locator(selector).count()) continue;
                const durations = await page.locator(selector).first().evaluate(element => getComputedStyle(element).transitionDuration);
                assert(durations.split(',').every(value => parseFloat(value) === 0), selector + ': reduced motion');
            }
            await page.close();

            const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
            await touch.route('**/*', route => {
                const url = new URL(route.request().url());
                if (url.hostname !== 'ystu.test') return route.abort();
                const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                return route.fulfill({ body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
            });
            await touch.goto('http://ystu.test/pages/ui-kit.html');
            await touch.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
            assert(!await touch.evaluate(() => matchMedia('(hover: hover)').matches), 'touch device must not advertise hover');
            const touchCdp = await touch.context().newCDPSession(touch);
            await touchCdp.send('DOM.enable');
            await touchCdp.send('CSS.enable');
            const { root: touchDoc } = await touchCdp.send('DOM.getDocument');
            for (const selector of ['.events__tag:not(.current)', '.catalog-filters-trigger', '.catalog-filters__reset', '.mobile-filter-panel__close', '.header-search__close', '.program-about__link', '.structure-detail__tab']) {
                const snapshot = () => touch.locator(selector).first().evaluate(element => {
                    const style = getComputedStyle(element);
                    return JSON.stringify([style.color, style.backgroundColor, style.outlineStyle, style.outlineColor, style.outlineWidth, style.textDecorationLine]);
                });
                const { nodeId } = await touchCdp.send('DOM.querySelector', { nodeId: touchDoc.nodeId, selector });
                assert(nodeId, 'touch test element missing: ' + selector);
                const normal = await snapshot();
                await touchCdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
                assert.equal(await snapshot(), normal, selector + ': sticky touch hover');
                for (const state of ['active', 'focus-visible']) {
                    await touchCdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: state === 'focus-visible' ? ['focus', state] : [state] });
                    assert.notEqual(await snapshot(), normal, selector + ': missing touch ' + state);
                }
                await touchCdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
            }
            console.log('OK touch hover/active/focus and reduced motion: ' + path.basename(root));
            await touch.close();
        }
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
