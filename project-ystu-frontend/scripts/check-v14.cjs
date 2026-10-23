const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium, webkit } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const repo = path.dirname(project);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const normalize = text => text.replace(/\s+/g, ' ').trim();
const baseline = file => execFileSync('git', ['show', `HEAD:${file.replaceAll('\\', '/')}`], { cwd: repo, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
const footerFiles = ['project-ystu-frontend/src/templates/components/footer.njk'];
for (const file of footerFiles) assert.equal(normalize(fs.readFileSync(path.join(repo, file), 'utf8')), normalize(baseline(file)), `Protected footer: ${file}`);
for (const directory of ['pages', 'project-ystu-frontend/dist/pages']) {
    for (const file of fs.readdirSync(path.join(repo, directory)).filter(file => file.endsWith('.html'))) {
        const relative = `${directory}/${file}`;
        const current = fs.readFileSync(path.join(repo, relative), 'utf8').match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
        const previous = baseline(relative).match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
        assert.equal(normalize(current), normalize(previous), `Protected footer HTML: ${relative}`);
    }
}
console.log('OK: footer content unchanged in template and all pages; adaptive CSS changes authorized');
for (const root of [repo, path.join(project, 'dist')]) {
    assert(fs.readFileSync(path.join(root, 'images/svg/sd-6.svg'), 'utf8').includes('-80 210L-80 88'), 'sixth wave must retain the extended left tail');
}

(async () => {
    for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch(engineName === 'chromium' ? { headless: true, channel: 'chromium' } : { headless: true });
        try {
            for (const [name, root] of [['legacy', repo], ['dist', path.join(project, 'dist')]]) {
                const output = path.join(project, 'test-results-v14', engineName, name);
                fs.mkdirSync(output, { recursive: true });
                const page = await browser.newPage({ viewport: { width: 390, height: 900 }, hasTouch: true });
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.route('**/*', route => {
                    const url = new URL(route.request().url());
                    if (url.hostname !== 'ystu.test') return route.abort();
                    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                    return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
                });
                const visit = async (file, width) => {
                    await page.setViewportSize({ width, height: 900 });
                    await page.goto(`http://ystu.test/pages/${file}.html`);
                    await page.evaluate(() => document.fonts.ready);
                    await page.waitForFunction(() => !!window.Content);
                    await page.waitForTimeout(100);
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${engineName}/${name}/${file}/${width}: page overflow`);
                };
                for (const width of [320, 375, 390, 576, 577, 768, 769, 900, 992, 993, 1000, 1100, 1101, 1280, 1281, 1520, 1521, 1600, 1920]) {
                    await visit('index', width);
                    await page.locator('.footer').scrollIntoViewIfNeeded();
                    await page.waitForTimeout(100);
                    const footer = await page.locator('.footer').evaluate(element => {
                        const wrapper = element.querySelector('.footer__wrapper').getBoundingClientRect();
                        const links = [...element.querySelectorAll('a, .footer__call, .footer__modal')].filter(link => link.getClientRects().length);
                        const outside = links.filter(link => {
                            const box = link.getBoundingClientRect();
                            return box.left < wrapper.left - 1 || box.right > wrapper.right + 1 || link.scrollWidth > link.clientWidth + 1;
                        }).map(link => link.className || link.textContent.trim());
                        const lines = selector => {
                            const link = element.querySelector(selector);
                            const text = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                            const range = document.createRange(); range.selectNodeContents(text);
                            return range.getClientRects().length;
                        };
                        const phones = element.querySelector('.footer__phones').getBoundingClientRect();
                        const modals = element.querySelector('.footer__modals').getBoundingClientRect();
                        const logo = element.querySelector('.redstar').getBoundingClientRect();
                        return { left: wrapper.left, right: innerWidth - wrapper.right, outside, phoneLines: lines('.footer__phone'), addressLines: lines('.footer__location'), overlap: modals.top < phones.bottom - 1, logoWidth: logo.width, logoHeight: logo.height };
                    });
                    assert(footer.left >= (width <= 576 ? 24 : 40) - 1 && footer.right >= (width <= 576 ? 24 : 40) - 1, 'footer side gutters: ' + width);
                    assert.deepEqual(footer.outside, [], engineName + '/' + name + '/' + width + ': footer overflow');
                    assert.equal(footer.phoneLines, 1, 'footer phone remains whole');
                    if (width >= 769) assert.equal(footer.addressLines, 1, 'tablet/desktop address remains whole');
                    assert(!footer.overlap, 'footer cards do not overlap phone descriptions');
                    assert(footer.logoWidth >= 130 && footer.logoHeight >= 12, 'Redstar remains visible');
                    if ([390, 900, 1000, 1521].includes(width)) await page.locator('.footer').screenshot({ path: path.join(output, 'footer-' + width + '.png'), style: '.header, .cookie-banner { visibility: hidden !important; }' });
                }
                console.log('OK ' + engineName + '/' + name + ': footer at 19 viewport widths');
                for (const width of [320, 375, 390, 500, 768, 1280, 1920]) {
                    await visit('programs', width);
                    const geometry = await page.locator('.program-card--wide').first().evaluate(card => {
                        const rect = selector => card.querySelector(selector).getBoundingClientRect().toJSON();
                        const style = getComputedStyle(card);
                        return { card: card.getBoundingClientRect().toJSON(), title: rect('.program-card__heading'), profiles: rect('.program-card__profiles'), stats: rect('.program-card__stats'), inner: card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) };
                    });
                    if (width > 992) {
                        assert(Math.abs(geometry.title.width - geometry.inner) < 2, 'wide title must span both columns');
                        assert(geometry.stats.x > geometry.profiles.x + geometry.profiles.width - 1, 'statistics must remain to the right of profiles');
                        assert(Math.abs(geometry.stats.y - geometry.profiles.y) < 2, 'profiles and statistics share a row');
                        assert(geometry.stats.width < geometry.inner * .6, 'statistics must not stretch across the card');
                    } else {
                        assert(geometry.stats.y >= geometry.profiles.bottom - 1, 'mobile statistics follow profiles');
                        assert(geometry.stats.right <= geometry.card.right, 'mobile statistics stay inside card');
                    }
                    if (width === 1280) await page.locator('.program-card--wide').first().screenshot({ path: path.join(output, 'wide-program.png'), style: '.header, .cookie-banner { visibility: hidden !important; }' });
                    await visit('student-life', width);
                    const waves = await page.locator('.student-links__item').evaluateAll(cards => cards.map(card => {
                        const style = getComputedStyle(card, '::after');
                        return { width: parseFloat(style.width), height: parseFloat(style.height), mask: style.maskSize || style.webkitMaskSize };
                    }));
                    const ratios = [543 / 290, 369 / 216, 489 / 246, 326 / 197, 393 / 324, 535 / 286];
                    assert.equal(waves.length, 6);
                    waves.forEach((wave, index) => {
                        assert(Math.abs(wave.width / wave.height - ratios[index]) < .015, `wave ${index + 1} distorted at ${width}`);
                        assert.equal(wave.mask, 'contain');
                    });
                    if ([320, 390, 500, 1920].includes(width)) await page.locator('.student-links').screenshot({ path: path.join(output, `waves-${width}.png`), style: '.header, .cookie-banner { visibility: hidden !important; }' });
                    await visit('news-events', width);
                    const panels = page.locator('.pagination:visible');
                    assert(await panels.count() > 0);
                    for (const panel of await panels.all()) {
                        const numbers = await panel.locator('.pagination__page').evaluateAll(links => links.map(link => {
                            const rect = link.getBoundingClientRect();
                            const text = [...link.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                            const range = document.createRange(); range.selectNodeContents(text);
                            const ink = range.getBoundingClientRect();
                            const style = getComputedStyle(link);
                            return { x: rect.x, y: rect.y, w: rect.width, h: rect.height, textY: ink.y, textHeight: ink.height, centerX: ink.x + ink.width / 2 - rect.x - rect.width / 2, display: style.display };
                        }));
                        assert(numbers.every(number => number.h === 44 && number.display === 'grid' && Math.abs(number.centerX) < 1), 'pagination sizing and horizontal centering');
                        assert(Math.max(...numbers.map(number => number.textY - number.y)) - Math.min(...numbers.map(number => number.textY - number.y)) < 1, 'pagination numbers must align vertically');
                    }
                    if (width === 390) await panels.first().screenshot({ path: path.join(output, 'pagination-mobile.png'), style: '.header, .cookie-banner { visibility: hidden !important; }' });
                    console.log(`OK ${engineName}/${name}/${width}: programs, six waves, pagination`);
                }
                await visit('structure', 1280);
                const transition = await page.locator('.structure__tag').first().evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, easing: getComputedStyle(el).transitionTimingFunction }));
                await visit('detail-structure', 1280);
                assert.deepEqual(await page.locator('.structure-detail__tab').first().evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, easing: getComputedStyle(el).transitionTimingFunction })), transition, 'matching tab transitions');
                assert(transition.duration.split(',').every(duration => duration.trim() === '0.2s'));
                await visit('detail-vacancy', 390);
                assert(await page.locator('.detail-vacancy__list ul > li').evaluateAll(items => items.length > 0 && items.every(item => getComputedStyle(item, '::before').content.includes('•') && getComputedStyle(item).listStyleType === 'none')), 'one bullet, no native duplicate');
                await visit('ui-kit', 390);
                assert(await page.locator('.wyswig ul > li').evaluateAll(items => items.length > 0 && items.every(item => getComputedStyle(item, '::before').content.includes('•') && getComputedStyle(item).listStyleType === 'none')), 'CMS bullets');
                await page.emulateMedia({ reducedMotion: 'reduce' });
                assert.equal(await page.locator('.structure-detail__tab').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s');
                assert.deepEqual(errors, [], 'browser JS errors');
                await page.close();
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
