const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const project = path.resolve(__dirname, '..');
(async () => {
    const browser = await chromium.launch({ channel: 'chromium', headless: true });
    try {
        for (const root of [path.dirname(project), path.join(project, 'dist')]) {
            for (const [width, reducedMotion] of [[1440, 'no-preference'], [1440, 'reduce'], [390, 'no-preference']]) {
                const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
                await page.route('**/*', route => {
                    const url = new URL(route.request().url());
                    if (url.hostname !== 'ystu.test') return route.abort();
                    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                    const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml' }[path.extname(file)];
                    return route.fulfill({ body: fs.readFileSync(file), contentType: type || 'application/octet-stream' });
                });
                await page.goto('http://ystu.test/pages/index.html');
                await page.waitForFunction(() => window.gsap && document.querySelector('.header__mobile-tools'));
                const result = await page.evaluate(() => {
                    const calls = [];
                    const original = gsap.fromTo;
                    gsap.fromTo = function(target, from, to) {
                        if (Array.isArray(target)) calls.push({ columns: [...new Set(target.map(node => node.closest('.mega-menu__primary, .mega-menu__section, .mega-menu__additional').className))], hidden: target.some(node => !node.getClientRects().length), stagger: to.stagger, duration: to.duration });
                        return original.apply(this, arguments);
                    };
                    document.querySelector('[data-trigger="open-menu"]').click();
                    return { open: document.querySelector('.header').classList.contains('header--menu-open'), calls };
                });
                assert(result.open);
                if (width > 1100 && reducedMotion !== 'reduce') {
                    assert.equal(result.calls.length, 1);
                    assert.equal(result.calls[0].columns.length, 3, 'all three columns animate by items');
                    assert(!result.calls[0].hidden, 'hidden panels must not delay visible items');
                    assert.equal(result.calls[0].duration, .24);
                    assert.equal(result.calls[0].stagger, .018);
                } else assert.equal(result.calls.length, 0, 'mobile/reduced motion retain their existing behavior');
                console.log('OK ' + path.basename(root) + '/' + width + '/' + reducedMotion);
                await page.close();
            }
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
