// Реальный HTTP-ответ и реальные пиксели страницы, без перехвата SVG браузерным тестом.
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { chromium } = require('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:5500';
const orange = async locator => {
    const { data, info } = await sharp(await locator.screenshot()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let pixels = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] > 220 && data[i + 1] > 70 && data[i + 1] < 195 && data[i + 2] < 150) pixels++;
    assert(pixels > 4, 'На скриншоте отсутствует оранжевая иконка');
};
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        await page.goto(base + '/pages/news-events.html');
        assert(await page.evaluate(async () => {
            const xml = await (await fetch('../images/svg/sprite.svg')).text();
            return !new DOMParser().parseFromString(xml, 'image/svg+xml').querySelector('parsererror');
        }), 'HTTP-ответ спрайта содержит повреждённый XML');
        await page.locator('[data-ui~="tab"][data-tab="events"]').click();
        await page.waitForTimeout(450);
        for (const selector of ['.event__date', '.event__time', '.event__location']) await orange(page.locator(selector).first());
        await page.goto(base + '/pages/program.html');
        await orange(page.locator('.breadcrumbs__separator').first());
        await orange(page.locator('[data-ui~="dropdown--header"]').first());
        const tag = page.locator('.hero-banner__tag.accredit').first();
        await tag.scrollIntoViewIfNeeded();
        const padding = await tag.evaluate(element => parseFloat(getComputedStyle(element).paddingLeft));
        const { data, info } = await sharp(await tag.screenshot()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let white = 0;
        for (let y = 5; y < info.height - 5; y++) for (let x = Math.ceil(padding); x < padding + 17; x++) {
            const i = (y * info.width + x) * info.channels;
            if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) white++;
        }
        assert(white > 8, 'На скриншоте отсутствует галочка аккредитации');
        await page.goto(base + '/pages/index.html');
        await page.setViewportSize({ width: 390, height: 844 });
        const arrow = page.locator('.main-slider .swiper-button-next').first();
        await arrow.scrollIntoViewIfNeeded();
        const { data: raw, info: arrowInfo } = await sharp(await arrow.screenshot()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        let blue = 0;
        for (let i = 0; i < raw.length; i += arrowInfo.channels) if (raw[i] < 100 && raw[i + 1] < 150 && raw[i + 2] > 100) blue++;
        assert(blue > 4, 'На скриншоте отсутствует стрелка слайдера');
        console.log(base + ': XML и реальные скриншоты событий, хлебных крошек, аккордеона, аккредитации и стрелки проверены');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
