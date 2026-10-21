const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');
const sharp = require('sharp');

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            const page = await browser.newPage({ reducedMotion: 'reduce' });
            for (const base of ['http://127.0.0.1:5500', 'http://127.0.0.1:5500/project-ystu-frontend/dist']) {
                for (const width of [390, 768]) {
                    await page.setViewportSize({ width, height: 900 });
                    await page.goto(base + '/pages/ui-kit.html');
                    await page.evaluate(() => document.querySelectorAll('header, .cookie').forEach(el => el.style.visibility = 'hidden'));
                    let checked = 0;
                    for (const card of await page.locator('.flagship-project__card').all()) {
                        const blue = await card.evaluate(el => {
                            const style = getComputedStyle(el);
                            return style.display !== 'none' && style.backgroundColor === 'rgb(9, 65, 136)';
                        });
                        if (!blue) continue;
                        const { data, info } = await sharp(await card.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
                        let orange = 0;
                        for (let i = 0; i < data.length; i += info.channels) {
                            if (data[i] > 200 && data[i + 1] > 55 && data[i + 1] < 180 && data[i + 2] < 100) orange++;
                        }
                        assert(orange > 200, 'На синей карточке отсутствует оранжевая линия');
                        checked++;
                    }
                    assert(checked >= 7, 'Не все варианты представлены в проверке');
                    console.log(engine.name(), base, width, checked + ' синих карточек: контраст OK');
                }
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
