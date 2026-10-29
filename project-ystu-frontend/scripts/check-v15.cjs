const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            for (const base of ['http://127.0.0.1:5500', 'http://127.0.0.1:5500/project-ystu-frontend/dist']) {
                const page = await browser.newPage({ viewport: { width: 800, height: 1000 } });
                const errors = [];
                page.on('pageerror', e => errors.push(e.message));
                await page.goto(base + '/pages/ui-kit.html');
                await page.waitForFunction(() => [...document.querySelectorAll('.js-init-student-slider')].every(el => el.swiper));
                await page.evaluate(() => {
                    document.querySelectorAll('header,.cookie').forEach(el => el.style.visibility = 'hidden');
                    document.addEventListener('click', e => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
                });
                const links = page.locator('.student-links__item');
                for (let i = 0; i < 2; i++) {
                    await links.nth(i).hover();
                    await page.waitForTimeout(460);
                    assert.equal(await links.nth(i).evaluate(el => getComputedStyle(el, '::after').transform), 'matrix(1.06, 0, 0, 1.06, 0, 0)');
                }
                assert(await links.first().evaluate(el => {
                    const r = el.getBoundingClientRect();
                    return document.elementFromPoint(r.right - 20, r.top + 30)?.closest('a')?.parentElement === el;
                }), 'Вся карточка ссылки кликабельна');
                const details = page.locator('.program-exams__examples').first();
                await details.locator('summary').click();
                await page.waitForTimeout(350);
                assert(await details.evaluate(el => el.open));
                const initial = await details.evaluate(el => el.getBoundingClientRect().height);
                const middle = await details.evaluate(el => {
                    el.querySelector('summary').click();
                    const animation = el.getAnimations()[0];
                    if (!animation) throw new Error('Нет анимации закрытия');
                    animation.pause();
                    animation.currentTime = 140;
                    const height = el.getBoundingClientRect().height;
                    if (!el.open) throw new Error('Details закрыт до конца анимации');
                    animation.play();
                    return height;
                });
                assert(middle < initial, 'Закрытие анимируется');
                await page.waitForFunction(el => !el.open, await details.elementHandle());
                assert.equal(await details.evaluate(el => el.open), false);
                await page.emulateMedia({ reducedMotion: 'reduce' });
                await details.locator('summary').press('Enter');
                assert(await details.evaluate(el => el.open));
                await page.emulateMedia({ reducedMotion: 'no-preference' });
                assert(await page.evaluate(() => {
                    const host = document.createElement('section');
                    host.innerHTML = '<details data-ui="disclosure"><summary>Тест</summary><p>Содержимое</p></details>';
                    document.body.append(host);
                    Dropdown.init(host);
                    Dropdown.init(host);
                    const details = host.querySelector('details');
                    details.querySelector('summary').click();
                    const result = details.querySelector('summary').getAttribute('aria-expanded') === 'true';
                    details.getAnimations().forEach(animation => animation.finish());
                    host.remove();
                    return result;
                }), 'Повторная инициализация не должна удваивать переключение');
                const tabs = page.locator('[data-ui~="structure-detail__tabs"]').first();
                await page.keyboard.press('Tab');
                await tabs.locator('button').nth(2).focus();
                assert.equal(await tabs.locator('button').nth(2).evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
                await tabs.locator('button').nth(2).click();
                assert(await tabs.evaluate(el => el.children[2].getAttribute('aria-pressed') === 'true'));
                assert(await tabs.evaluate(el => [...el.parentElement.querySelectorAll('[data-ui~="training-program-card"]')].some(card => card.hidden)));
                assert(await page.locator('.js-init-student-slider').count() >= 2);
                await page.locator('.js-init-student-slider').first().evaluate(el => el.swiper.slideTo(1, 0));
                assert.equal(await page.locator('.js-init-student-slider').nth(1).evaluate(el => el.swiper.activeIndex), 0);
                // Пункт 8: примеры UI-Kit должны сохранять контракт рабочих компонентов.
                assert(await page.locator('.news__card').evaluateAll(cards => cards.length === 3
                    && cards.every(card => card.tagName === 'A' && card.hasAttribute('href') && !card.querySelector('a'))),
                'Все карточки новостей UI-Kit должны быть целыми ссылками без вложенных ссылок');
                const structure = page.locator('[data-ui~="structure__tags"]').first();
                assert.equal(await structure.locator('button[data-filter]').count(), 4);
                const category = structure.locator('button').nth(1);
                await structure.locator('button').first().focus();
                await page.keyboard.press('Tab');
                assert(await category.evaluate(el => document.activeElement === el));
                assert.notEqual(await category.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
                await category.press('Enter');
                assert.equal(await category.getAttribute('aria-pressed'), 'true');
                const structureScope = page.locator('[data-ui~="structure__container"]').first();
                assert(await structureScope.locator('[data-ui~="structure__institutes"]').isHidden());
                assert(await structureScope.locator('[data-ui~="content-filter-status"]').isVisible());
                await structure.locator('button').first().press('Enter');
                assert(await structureScope.locator('[data-ui~="structure__institutes"]').isVisible());
                for (const width of [1100, 800, 390]) {
                    await page.setViewportSize({ width, height: 1000 });
                    await page.goto(base + '/pages/index.html');
                    assert.equal(await page.locator('.university-statistics').evaluate(el => getComputedStyle(el).backgroundPosition), 'calc(100% + 6px) -8px');
                }
                assert.deepEqual(errors, []);
                console.log(engine.name(), base, 'v15 OK');
                await page.close();
            }
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
