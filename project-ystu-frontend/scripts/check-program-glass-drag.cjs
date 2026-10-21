const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            const page = await browser.newPage();
            for (const base of ['http://127.0.0.1:5500', 'http://127.0.0.1:5500/project-ystu-frontend/dist']) {
                for (const width of [390, 728, 768]) {
                    await page.setViewportSize({ width, height: 1000 });
                    await page.goto(base + '/pages/program.html');
                    assert(await page.locator('.hero-banner__content').evaluate(el => {
                        const box = el.getBoundingClientRect();
                        const rim = getComputedStyle(el, '::after');
                        return Math.abs(box.left) < 1 && Math.abs(box.width - innerWidth) < 1
                            && rim.borderRadius === getComputedStyle(el).borderRadius && rim.filter === 'none'
                            && [...el.children].every(child => child.getBoundingClientRect().bottom <= box.bottom + 1);
                    }), 'Стекло: ширина, радиус, отсутствие обрезания');
                }
                await page.setViewportSize({ width: 1920, height: 1080 });
                await page.goto(base + '/pages/ui-kit.html');
                await page.evaluate(() => {
                    document.querySelectorAll('header,.cookie').forEach(el => el.style.visibility = 'hidden');
                    window.testDrags = 0;
                    window.testClicks = 0;
                    document.addEventListener('dragstart', () => window.testDrags++);
                    document.addEventListener('click', event => { event.preventDefault(); window.testClicks++; });
                });
                for (const selector of ['.ficher', '.flagship-project__card']) {
                    const cards = page.locator(selector);
                    const card = cards.first();
                    await card.scrollIntoViewIfNeeded();
                    const box = await card.boundingBox();
                    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                    await page.mouse.down();
                    await page.mouse.move(box.x + box.width + 20, box.y + box.height / 2, { steps: 8 });
                    await page.mouse.up();
                    assert.equal(await page.evaluate(() => window.testDrags), 0, 'Нативное перетаскивание');
                    const before = await page.evaluate(() => window.testClicks);
                    await cards.nth(1).click();
                    assert(await page.evaluate(n => window.testClicks > n, before), 'Следующая карточка не нажимается');
                }
                const blue = page.locator('.flagship-projects__grid.card-8 .flagship-project__card').nth(3);
                await page.keyboard.press('Tab');
                await blue.focus();
                await page.waitForTimeout(400);
                assert.equal(await blue.evaluate(el => getComputedStyle(el).outlineColor), 'rgb(244, 119, 43)');
                console.log(engine.name(), base, 'OK: стекло, drag, повторный клик, контраст');
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
