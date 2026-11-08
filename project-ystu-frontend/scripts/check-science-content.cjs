const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');
const project = path.resolve(__dirname, '..');
(async () => {
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
        const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: 'chromium' } : {}) });
        try {
            for (const root of [path.dirname(project), path.join(project, 'dist')]) {
                const page = await browser.newPage({ reducedMotion: 'reduce' });
                await page.route('**/*', route => {
                    const url = new URL(route.request().url());
                    if (url.hostname !== 'ystu.test') return route.abort();
                    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
                    const type = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }[path.extname(file)];
                    return route.fulfill({ body: fs.readFileSync(file), contentType: type || 'application/octet-stream' });
                });
                for (const width of [320, 768, 1440, 1920]) {
                    await page.setViewportSize({ width, height: 900 });
                    await page.goto('http://ystu.test/pages/nauka.html');
                    await page.waitForFunction(() => !!window.Dropdown);
                    await page.evaluate(() => document.fonts.ready);
                    for (const long of [false, true]) {
                        const result = await page.evaluate(long => {
                            document.querySelectorAll('.dropdown--item').forEach(item => {
                                item.classList.add('open');
                                const content = item.querySelector('.dropdown--content');
                                content.hidden = false;
                                content.inert = false;
                            });
                            if (long) document.querySelectorAll('.journal-card__info dd').forEach(element => {
                                element.textContent = (element.textContent + ' Дополнительная информация о научном журнале. ').repeat(12) + 'СверхдлинноеНазвание'.repeat(25);
                            });
                            return [...document.querySelectorAll('.journal-card__info')].map(info => {
                                const columns = [...info.children];
                                const style = getComputedStyle(info);
                                const overflow = [...info.querySelectorAll('*')].some(element => element.scrollWidth > element.clientWidth + 1);
                                const overlap = columns.some(column => [...column.children].slice(1).some(element => element.getBoundingClientRect().top < element.previousElementSibling.getBoundingClientRect().bottom + 15));
                                const description = info.closest('.journal-card__section').querySelector('.journal-card__description');
                                return { display: style.display, columnGap: style.columnGap, overflow, overlap, below: description.getBoundingClientRect().top >= info.getBoundingClientRect().bottom + 39, count: columns.length };
                            });
                        }, long);
                        assert.equal(result.length, 4);
                        for (const item of result) {
                            assert.equal(item.display, 'grid');
                            assert.equal(item.columnGap, '40px');
                            assert.equal(item.count, 2);
                            assert(!item.overflow && !item.overlap && item.below, 'long content must not overflow/overlap');
                        }
                        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'page overflow');
                    }
                    console.log('OK ' + name + '/' + path.basename(root) + '/' + width + ': short/long content');
                }
                await page.close();
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
