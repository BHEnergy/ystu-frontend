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
                for (const width of [320, 360, 375, 379, 380, 390, 576]) {
                    await page.setViewportSize({ width, height: 900 });
                    await page.goto('http://ystu.test/pages/news-events.html');
                    await page.evaluate(() => document.fonts.ready);
                    await page.waitForFunction(() => !!window.Content);
                    for (const tab of ['news', 'events']) {
                        await page.locator('[data-ui~="tab"][data-tab="' + tab + '"]').evaluate(button => button.click());
                        for (const panel of await page.locator('.pagination:visible').all()) {
                            const layout = await panel.evaluate(element => {
                                const box = element.getBoundingClientRect();
                                return [...element.children].filter(child => child.getClientRects().length).map(child => {
                                    const rect = child.getBoundingClientRect();
                                    return { top: rect.top, height: rect.height, inside: rect.left >= box.left - 1 && rect.right <= box.right + 1 };
                                });
                            });
                            assert(layout.length >= 7, 'full pagination is tested');
                            assert(layout.every(item => item.inside), name + '/' + width + ': overflow');
                            const buttons = layout.filter(item => item.height === 44);
                            assert.equal(buttons.length, layout.length - 1, 'all buttons retain 44px height');
                            assert(buttons.every(item => Math.abs(item.top - buttons[0].top) < 1), name + '/' + width + ': wrapped arrow');
                        }
                    }
                    console.log('OK ' + name + '/' + path.basename(root) + '/' + width);
                }
                await page.close();
            }
        } finally {
            await browser.close();
        }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
