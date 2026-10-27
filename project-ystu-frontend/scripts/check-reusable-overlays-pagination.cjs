const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright-core');
const nunjucks = require('nunjucks');

const root = path.resolve(__dirname, '../..');
const base = process.argv[2] || 'http://localhost:8000';
const eventTemplate = fs.readFileSync(path.join(root, 'project-ystu-frontend/src/templates/components/event-modal.njk'), 'utf8');
const legacy = nunjucks.renderString(eventTemplate);
assert(legacy.includes('aria-labelledby="event-modal-title"'));
assert(legacy.includes('id="event-personal-data"'));
const named = nunjucks.renderString(eventTemplate, { modalIdPrefix: 'second-', eventModalId: 'second-dialog', eventModalKey: 'second-event' });
assert(named.includes('id="second-dialog"'));
assert(named.includes('id="second-event-personal-data"'));
assert(named.includes('for="second-event-personal-data"'));

(async () => {
    for (const engine of [chromium, webkit]) {
        const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
        try {
            const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            // Позволяет проверить актуальные исходники до общей пересборки dist.
            for (const name of ['modals', 'pagination']) {
                await page.route(`**/js/components/${name}.js`, route => route.fulfill({
                    contentType: 'text/javascript', body: fs.readFileSync(path.join(root, 'js/components', `${name}.js`), 'utf8'),
                }));
            }
            await page.goto(base + '/pages/news-events.html');
            await page.waitForFunction(() => window.Pagination?.init && window.Modals?.init);
            await page.evaluate(() => document.querySelectorAll('header,.cookie').forEach(el => el.style.visibility = 'hidden'));
            const main = page.locator('[data-pagination-size][data-tab="news"] [data-ui~="pagination"]').first();
            await main.locator('[data-ui~="pagination-next"]').click();
            assert.equal(new URL(page.url()).searchParams.get('page'), '2');
            await page.evaluate(() => {
                const host = document.createElement('section');
                host.id = 'secondary-listing';
                host.dataset.paginationSize = '2';
                host.dataset.paginationKey = 'secondary';
                host.innerHTML = Array.from({ length: 6 }, (_, i) => `<article data-ui="pagination-item">Запись ${i + 1}</article>`).join('')
                    + '<nav data-ui="pagination"><a data-ui="pagination-prev" href="#">Назад</a>'
                    + [1, 2, 3, 4].map(i => `<a data-ui="pagination__page" href="#">${i}</a>`).join('')
                    + '<a data-ui="pagination-next" href="#">Вперёд</a></nav>';
                document.body.append(host);
                Pagination.init(host);
                Pagination.init(host);
                window.secondaryChanges = 0;
                host.addEventListener('pagination:change', () => window.secondaryChanges++);
            });
            const second = page.locator('#secondary-listing');
            assert.equal(await second.locator('[data-ui~="pagination-status"]').count(), 1);
            await second.locator('[data-ui~="pagination-next"]').click();
            await second.locator('[data-ui~="pagination-next"]').click();
            assert.equal(await page.evaluate(() => window.secondaryChanges), 2);
            assert.equal(new URL(page.url()).searchParams.get('secondary-page'), '3');
            assert.equal(new URL(page.url()).searchParams.get('page'), '2');
            await page.goBack();
            await page.waitForFunction(() => new URL(location.href).searchParams.get('secondary-page') === '2');
            assert.equal(await second.locator('[aria-current="page"]').textContent(), '2');
            assert.equal(await main.locator('[aria-current="page"]').textContent(), '2');
            await page.evaluate(() => {
                const host = document.querySelector('#secondary-listing');
                host.insertAdjacentHTML('afterbegin', '<article data-ui="pagination-item">Новая запись</article><article data-ui="pagination-item">Ещё запись</article>');
                Pagination.init(host);
            });
            assert.equal(await second.locator('[data-ui~="pagination-status"]').count(), 1);
            assert.equal(await second.locator('[data-ui~="pagination__page"]').last().textContent(), '4');
            await page.evaluate(() => {
                const clone = document.querySelector('#secondary-listing').cloneNode(true);
                clone.id = 'automatic-listing';
                delete clone.dataset.paginationKey;
                clone.querySelectorAll('[data-ui~="pagination-status"]').forEach(el => el.remove());
                document.body.append(clone);
                Pagination.init(clone);
            });
            const automatic = page.locator('#automatic-listing');
            assert(new URL(await automatic.locator('[data-ui~="pagination-next"]').getAttribute('href'), page.url()).searchParams.has('listing-2-page'));
            await automatic.locator('[data-ui~="pagination-next"]').click();
            assert.equal(new URL(page.url()).searchParams.get('listing-2-page'), '2');
            assert.equal(new URL(page.url()).searchParams.get('secondary-page'), '2');
            assert.equal(new URL(page.url()).searchParams.get('page'), '2');
            await page.evaluate(() => {
                const clone = document.querySelector('#automatic-listing').cloneNode(true);
                clone.id = 'local-listing';
                clone.dataset.paginationUrl = 'off';
                clone.querySelectorAll('[data-ui~="pagination-status"]').forEach(el => el.remove());
                document.body.append(clone);
                Pagination.init(clone);
            });
            const urlBeforeLocalClick = page.url();
            await page.locator('#local-listing [data-ui~="pagination-next"]').click();
            assert.equal(page.url(), urlBeforeLocalClick);
            assert.equal(await page.locator('#local-listing [aria-current="page"]').textContent(), '2');

            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.evaluate(() => {
                const modal = id => `<div id="${id}" class="modal" data-ui="modal" data-modal="same" role="dialog" aria-modal="true" aria-label="Тест"><div class="modal-overlay" data-ui="modal-overlay"><div class="modal-body"><button class="modal-close" data-ui="modal-close">Закрыть</button><form data-ui="modal-form" data-modal-demo><button type="submit">Отправить</button></form></div></div></div>`;
                const host = document.createElement('section');
                host.innerHTML = '<div data-ui="modal-scope"><button id="open-a" data-ui="button-modal" data-modal="same">Открыть A</button>' + modal('dialog-a') + '</div>'
                    + '<div data-ui="modal-scope"><button id="open-b" data-ui="button-modal" data-modal="same">Открыть B</button>' + modal('dialog-b') + '</div>'
                    + '<button id="explicit-a" data-ui="button-modal" data-modal-target="#dialog-a">Явная ссылка</button>';
                document.body.append(host);
                Modals.init(host);
                Modals.init(host);
                window.modalSubmits = 0;
                host.addEventListener('modal:submit', event => { event.preventDefault(); window.modalSubmits++; });
            });
            await page.locator('#open-b').click();
            assert(await page.locator('#dialog-b').evaluate(el => el.classList.contains('modal--active')));
            assert.equal(await page.locator('#dialog-a').evaluate(el => el.classList.contains('modal--active')), false);
            await page.locator('#dialog-b form').evaluate(el => el.requestSubmit());
            assert.equal(await page.evaluate(() => window.modalSubmits), 1);
            await page.keyboard.press('Escape');
            await page.locator('#explicit-a').click();
            assert(await page.locator('#dialog-a').evaluate(el => el.classList.contains('modal--active')));
            await page.keyboard.press('Escape');
            // Новый триггер работает без повторной инициализации документа.
            await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<button id="late-modal-trigger" data-ui="button-modal" aria-controls="dialog-b">Поздняя кнопка</button>'));
            await page.locator('#late-modal-trigger').click();
            assert(await page.locator('#dialog-b').evaluate(el => el.classList.contains('modal--active')));
            await page.keyboard.press('Escape');
            await page.emulateMedia({ reducedMotion: 'no-preference' });
            await page.evaluate(() => {
                const a = document.querySelector('#dialog-a'), b = document.querySelector('#dialog-b');
                Modals.open(a); Modals.close(a); Modals.open(b);
            });
            await page.waitForTimeout(260);
            assert(await page.locator('#dialog-b').evaluate(el => el.classList.contains('modal--active')));
            assert.deepEqual(errors, []);
            console.log(engine.name(), 'переиспользование модалок/пагинации OK');
        } finally { await browser.close(); }
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
