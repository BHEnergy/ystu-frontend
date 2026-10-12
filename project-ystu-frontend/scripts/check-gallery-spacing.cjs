const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:5500';
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage();
        for (const directory of ['', '/project-ystu-frontend/dist']) for (const width of [390, 768, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(base + directory + '/pages/detail-structure.html');
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(350);
            const geometry = await page.locator('.structure-gallery__slider').evaluate(element => {
                const image = element.querySelector('img').getBoundingClientRect();
                const controls = element.querySelector('.structure-gallery__controls').getBoundingClientRect();
                const gallery = element.getBoundingClientRect();
                return { gap: controls.top - image.bottom, height: controls.height, centerOffset: (controls.left + controls.right - gallery.left - gallery.right) / 2 };
            });
            console.log(directory || 'Основная версия', width, geometry);
            assert(Math.abs(geometry.gap - 16) < .5, 'Отступ должен быть 16px');
            assert.equal(geometry.height, 44);
            assert(Math.abs(geometry.centerOffset) < .5, 'Управление должно быть по центру');
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
