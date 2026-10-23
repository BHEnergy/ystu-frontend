const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');
const project = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

(async () => {
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: 'chromium' } : {}) });
        try {
            for (const root of [path.dirname(project), path.join(project, 'dist')]) {
                const page = await browser.newPage();
                await page.route('**/*', route => {
                    const url = new URL(route.request().url());
                    if (url.hostname !== 'ystu.test') return route.abort();
                    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                    return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
                });
                for (const file of ['programs', 'ui-kit']) {
                    for (const width of [320, 390, 768, 992, 993, 1100, 1280, 1440, 1920]) {
                        await page.setViewportSize({ width, height: 900 });
                        await page.goto('http://ystu.test/pages/' + file + '.html');
                        await page.evaluate(() => document.fonts.ready);
                        await page.waitForFunction(() => !!window.Content);
                        const cards = await page.locator('.program-card:visible').evaluateAll(elements => elements.map(card => {
                            const rect = selector => card.querySelector(selector).getBoundingClientRect().toJSON();
                            return { card: card.getBoundingClientRect().toJSON(), heading: rect('.program-card__heading'), profiles: rect('.program-card__profiles'), stats: rect('.program-card__stats') };
                        }));
                        assert(cards.length > 0);
                        for (const card of cards) {
                            if (width > 992) {
                                assert(Math.abs(card.profiles.top - card.stats.top) < 1, 'statistics align with profiles');
                                assert(card.stats.left >= card.profiles.right - 1, 'statistics remain on the right');
                                assert(card.heading.bottom <= card.stats.top, 'heading remains above statistics');
                            } else {
                                assert(card.stats.top >= card.profiles.bottom - 1, 'mobile statistics follow profiles');
                            }
                            assert(card.stats.right <= card.card.right, 'statistics stay inside card');
                        }
                        if (file === 'programs') assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'programs page overflow');
                        console.log('OK ' + name + '/' + path.basename(root) + '/' + file + '/' + width + ': ' + cards.length + ' cards');
                    }
                }
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
