const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:5500';
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const visit = async (name, width) => {
            await page.setViewportSize({ width, height: 1000 });
            await page.goto(base + '/pages/' + name + '.html');
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(400);
        };
        for (const width of [390, 728, 744, 858, 1920]) {
            await visit('student-life', width);
            assert(await page.locator('.hero-banner .breadcrumbs').evaluate(element => element.getBoundingClientRect().top >= document.querySelector('header').getBoundingClientRect().bottom), 'Крошки под шапкой ' + width);
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Переполнение student-life ' + width);
            if (width <= 768) assert(await page.locator('.hero-banner__content--student').evaluate(element => {
                const bounds = element.getBoundingClientRect();
                const style = getComputedStyle(element), rim = getComputedStyle(element, '::after');
                return Math.abs(bounds.left) < 1 && Math.abs(bounds.width - innerWidth) < 1
                    && rim.borderRadius === style.borderRadius && rim.filter === 'none' && style.boxShadow.includes('inset');
            }), 'Мобильное стекло должно быть на всю ширину, окантовка — внутри');
            if (width === 728) assert(await page.locator('.student-direction__content').first().evaluate(element => element.scrollHeight <= element.clientHeight + 1), 'Обрезан текст направления');
        }
        await visit('index', 1920);
        assert(await page.locator('.flagship-project__card').evaluateAll(elements => elements.every(element => element.tagName === 'A' && element.hasAttribute('href') && element.tabIndex === 0)));
        console.log('1920px статистика:', await page.locator('.university-statistics').evaluate(element => ({ position: getComputedStyle(element).backgroundPosition, width: element.getBoundingClientRect().width })));
        await page.evaluate(() => document.querySelectorAll('header, .cookie').forEach(element => element.style.visibility = 'hidden'));
        await page.locator('.university-statistics').screenshot({ path: require('node:path').join(require('node:os').tmpdir(), 'ystu-v13-statistics-1920.png') });
        await visit('index', 744);
        assert.equal(await page.locator('.preparatory-courses__title').evaluate(element => getComputedStyle(element).fontWeight), '600');
        const photo = await page.locator('.preparatory-courses__image').evaluate(element => ({ image: element.getBoundingClientRect().width, box: element.parentElement.closest('.preparatory-courses__media').getBoundingClientRect().width }));
        assert(Math.abs(photo.image - photo.box) < 1, 'Ширина фотографии курсов ' + JSON.stringify(photo));
        await visit('news-events', 390);
        await page.locator('[data-ui~="tab"][data-tab="events"]').click();
        await page.waitForTimeout(350);
        assert(await page.locator('.event__content').first().evaluate(element => {
            const boxes = [...element.children].map(child => child.getBoundingClientRect());
            return boxes.slice(1).every((box, index) => box.top - boxes[index].bottom <= 17);
        }), 'Лишнее расстояние между содержимым события');
        await visit('programs', 744);
        assert.equal(await page.locator('.program-card').first().evaluate(element => getComputedStyle(element).flexDirection), 'column');
        await visit('nauka', 744);
        assert(await page.locator('.dropdown--header').first().evaluate(element => {
            const title = element.firstElementChild.getBoundingClientRect();
            return title.width > element.clientWidth * .75;
        }), 'Заголовок аккордеона не занимает доступную ширину');
        await visit('ui-kit', 390);
        assert(await page.locator('.wyswig__table-scroll').last().evaluate(element => {
            element.scrollLeft = 80;
            return element.scrollWidth > element.clientWidth && element.scrollLeft > 0 && document.documentElement.scrollWidth <= innerWidth + 1;
        }), 'Таблица не прокручивается');
        await visit('detail-vacancy', 390);
        assert(await page.locator('.wyswig ul').evaluateAll(elements => elements.every(element => getComputedStyle(element).listStyleType === 'none')));
        await visit('map', 390);
        assert(!(await page.locator('main').evaluate(element => element.classList.contains('campus-map-page'))));
        assert.deepEqual(errors, []);
        console.log(base + ': V13 адаптив, ссылки, типографика, таблица и списки — OK');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
