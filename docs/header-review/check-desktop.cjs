const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { chromium } = require('C:/Users/User/.vscode/extensions/danielsanmedium.dscodegpt-3.24.62/standalone/node_modules/patchright-core');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
        res.end(data);
    });
});
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({ headless: true, channel: 'chrome' });
        const page = await browser.newPage();
        for (const width of [1920, 1440, 1280, 1101, 390]) {
            await page.setViewportSize({ width, height: 1050 });
            await page.goto(`http://127.0.0.1:${server.address().port}/pages/index.html`);
            await page.locator('[data-trigger="open-menu"]').click();
            await page.waitForTimeout(600);
            if (width > 1100) {
                await page.locator('[data-menu-section="science"]').hover();
                await page.waitForTimeout(300);
                const state = await page.evaluate(() => {
                    const menu = document.querySelector('.mega-menu');
                    const active = menu.querySelector('[data-menu-section="science"]');
                    const panel = menu.querySelector('[data-menu-panel="science"]');
                    return {
                        open: panel.classList.contains('is-open'),
                        activeColor: getComputedStyle(active).backgroundColor,
                        titleColor: getComputedStyle(panel.querySelector('.mega-menu__title')).backgroundColor,
                        line: getComputedStyle(active).borderBottomWidth,
                        overflow: menu.scrollWidth > menu.clientWidth + 1,
                        extraTitle: getComputedStyle(menu.querySelector('.mega-menu__additional'), '::before').content,
                    };
                });
                assert.equal(state.open, true);
                assert.equal(state.activeColor, 'rgb(230, 236, 243)');
                assert.equal(state.titleColor, state.activeColor);
                assert.equal(state.line, '1px');
                assert.equal(state.overflow, false);
                assert.ok(['none', 'normal'].includes(state.extraTitle));
                if (width === 1440) {
                    await page.locator('[data-menu-section="university"]').hover();
                    await page.waitForTimeout(300);
                    await page.locator('.mega-menu').screenshot({ path: path.join(__dirname, 'desktop-menu/implemented.png') });
                }
            } else {
                await page.locator('[data-menu-section="science"]').click();
                assert.equal(await page.locator('[data-menu-panel="science"]').evaluate(el => el.classList.contains('is-open')), true);
                assert.equal(await page.locator('.mega-menu').evaluate(el => el.classList.contains('mega-menu--accordion')), true);
            }
            console.log(`${width}px: OK`);
        }
    } finally {
        await browser?.close();
        server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
